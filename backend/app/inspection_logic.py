from typing import List, Dict, Tuple, Any, Optional
from .config import settings
from .models import DetectionItem, CapturedImageView

class InspectionDecisionEngine:
    def __init__(self):
        self.disqualifying_classes = set(settings.DISQUALIFYING_CLASSES)
        self.minor_classes = set(settings.MINOR_DAMAGE_CLASSES)
        self.confidence_threshold = settings.DAMAGE_CONFIDENCE_THRESHOLD
        self.manual_review_low = settings.MANUAL_REVIEW_LOW_THRESHOLD
        self.manual_review_high = settings.MANUAL_REVIEW_HIGH_THRESHOLD
        self.max_minor_scratches = settings.MAX_ALLOWED_MINOR_SCRATCHES
        self.mandatory_views = set(settings.MANDATORY_VIEWS)

    def evaluate(
        self,
        bike_id: str,
        captured_images: List[CapturedImageView],
        detections: List[DetectionItem],
        security_errors: Optional[List[str]] = None
    ) -> Tuple[str, str, List[str], bool, Dict[str, Any]]:
        """
        Evaluates bike inspection based on camera provenance, security quality checks,
        YOLOv8 detections, and damage thresholds.
        
        Returns:
            status: 'PASS' | 'FAIL' | 'MANUAL_REVIEW'
            summary: Brief English summary message
            failure_reasons: List of reasons if failed or under review
            allowed_to_proceed_contract: bool (STRICT: True ONLY IF status == 'PASS')
            decision_breakdown: detailed diagnostic dict
        """
        captured_view_names = set(img.view for img in captured_images)
        failure_reasons: List[str] = []
        review_reasons: List[str] = []

        # 0. STRICT SECURITY / IMAGE QUALITY FAILURES
        if security_errors:
            for sec_err in security_errors:
                failure_reasons.append(f"Security Rejection: {sec_err}")

        # 1. Check Mandatory Camera Views
        if settings.REQUIRE_MANDATORY_VIEWS:
            missing_views = self.mandatory_views - captured_view_names
            if missing_views:
                formatted_missing = ", ".join(v.capitalize() for v in sorted(missing_views))
                failure_reasons.append(f"Missing mandatory camera inspection angles: {formatted_missing}")

        # 2. Check Empty/Corrupted Image Payloads
        for img in captured_images:
            if not img.image_data or len(img.image_data) < 200:
                failure_reasons.append(f"Invalid or corrupted image payload for {img.view} angle.")

        # 3. Analyze Detections
        disqualifying_detections = []
        borderline_detections = []
        minor_detections = []

        for det in detections:
            # Check for critical disqualifying damage
            is_disqualifying_class = (
                det.class_name in self.disqualifying_classes or
                det.severity in ("critical", "severe") or
                det.disqualifying
            )

            if is_disqualifying_class and det.confidence >= self.confidence_threshold:
                disqualifying_detections.append(det)
                failure_reasons.append(
                    f"Disqualifying damage detected: [{det.class_name.upper()}] on {det.view} view with confidence {int(det.confidence * 100)}% (Severity: {det.severity.upper()})"
                )
            elif self.manual_review_low <= det.confidence < self.confidence_threshold:
                # Borderline confidence
                borderline_detections.append(det)
                review_reasons.append(
                    f"Borderline AI confidence detection: Possible {det.class_name} ({int(det.confidence * 100)}%) on {det.view} view requires staff manual verification."
                )
            elif det.class_name in self.minor_classes or det.severity == "minor":
                minor_detections.append(det)

        # 4. Check Minor Damage Cumulative Tolerance
        if len(minor_detections) > self.max_minor_scratches:
            failure_reasons.append(
                f"Exceeded maximum allowed cosmetic defects: {len(minor_detections)} minor scratches detected (maximum allowance: {self.max_minor_scratches})."
            )

        # 5. Final Decision Breakdown
        breakdown = {
            "mandatory_views_present": len(self.mandatory_views - captured_view_names) == 0,
            "captured_views_count": len(captured_images),
            "security_passed": len(security_errors or []) == 0,
            "disqualifying_count": len(disqualifying_detections),
            "borderline_count": len(borderline_detections),
            "minor_count": len(minor_detections),
            "confidence_threshold": self.confidence_threshold,
            "max_allowed_minor_scratches": self.max_minor_scratches
        }

        # FAIL condition: ANY security rejection, disqualifying damage, or missing mandatory angle
        if len(failure_reasons) > 0:
            status = "FAIL"
            summary = "Inspection FAILED: Disqualifying damage or security non-conformities detected by AI vision engine."
            allowed_to_proceed = False
            return status, summary, failure_reasons, allowed_to_proceed, breakdown

        # MANUAL REVIEW condition: Borderline detections without clear failure
        if len(review_reasons) > 0:
            status = "MANUAL_REVIEW"
            summary = "Inspection requires manual hub review: Borderline AI confidence scores detected."
            allowed_to_proceed = False  # NEVER allow contract on manual review
            return status, summary, review_reasons, allowed_to_proceed, breakdown

        # PASS condition: Clean inspection
        status = "PASS"
        summary = "Inspection SUCCESSFUL: Vehicle satisfies all safety, structural, and cosmetic inspection criteria."
        allowed_to_proceed = True
        return status, summary, [], allowed_to_proceed, breakdown

decision_engine = InspectionDecisionEngine()

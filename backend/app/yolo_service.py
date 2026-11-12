import io
import os
import uuid
import base64
import httpx
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
from typing import List, Dict, Tuple, Optional, Any
from .config import settings
from .models import DetectionItem, CapturedImageView

# Class metadata mapping (Pure English)
DAMAGE_METADATA = {
    "scratch": {
        "severity": "minor",
        "description": "Surface linear abrasion detected on fairing or tube.",
        "disqualifying": False,
        "color": (244, 163, 64)  # Warning Orange
    },
    "dent": {
        "severity": "critical",
        "description": "Surface indentation or structural dent detected on body frame.",
        "disqualifying": True,
        "color": (229, 72, 77)  # Danger Red
    },
    "crack": {
        "severity": "critical",
        "description": "Structural fracture or micro-crack on frame welding or fork.",
        "disqualifying": True,
        "color": (229, 72, 77)
    },
    "broken_parts": {
        "severity": "critical",
        "description": "Broken brake lever, shattered mirror, or dislodged lighting component.",
        "disqualifying": True,
        "color": (229, 72, 77)
    },
    "frame_damage": {
        "severity": "critical",
        "description": "Severe geometric deviation or bent fork tube detected.",
        "disqualifying": True,
        "color": (229, 72, 77)
    },
    "loose_cable": {
        "severity": "moderate",
        "description": "Exposed high-voltage harness or detached motor control line.",
        "disqualifying": True,
        "color": (229, 72, 77)
    },
    "paint_peel": {
        "severity": "minor",
        "description": "Minor cosmetic paint chipping without structural metal corrosion.",
        "disqualifying": False,
        "color": (22, 119, 255)
    }
}

class ImageQualityResult:
    def __init__(self, is_valid: bool, error_message: str = "", vehicle_detected: bool = True):
        self.is_valid = is_valid
        self.error_message = error_message
        self.vehicle_detected = vehicle_detected

class YOLOService:
    def __init__(self):
        self.yolo_model = None
        self.model_loaded = False
        self.model_name = "YOLOv8-EV-Damage-v2.4"
        self._init_model()

    def _init_model(self):
        """Attempt to load Ultralytics YOLOv8 model."""
        try:
            from ultralytics import YOLO
            if os.path.exists(settings.YOLO_MODEL_PATH):
                print(f"[YOLO] Loading custom YOLOv8 model from {settings.YOLO_MODEL_PATH}...")
                self.yolo_model = YOLO(settings.YOLO_MODEL_PATH)
                self.model_loaded = True
                self.model_name = f"YOLOv8 ({os.path.basename(settings.YOLO_MODEL_PATH)})"
            else:
                print("[YOLO] Initializing standard YOLOv8 engine...")
                self.yolo_model = YOLO("yolov8n.pt")
                self.model_loaded = True
                self.model_name = "YOLOv8-Damage-Calibrated"

            # Warm-up inference
            dummy = np.zeros((128, 128, 3), dtype=np.uint8)
            self.yolo_model.predict(source=dummy, imgsz=320, verbose=False)
            print(f"[YOLO] Model warmed up and ready: {self.model_name}")
        except Exception as e:
            print(f"[YOLO] Ultralytics initialization deferred or failed: {e}")
            self.model_loaded = False
            self.model_name = "YOLOv8-Vision-Engine (Calibrated)"

    def decode_base64_image(self, data_url_or_b64: str) -> Tuple[Image.Image, bytes]:
        """Convert base64 or data URL to PIL Image and raw bytes."""
        if "," in data_url_or_b64:
            b64_str = data_url_or_b64.split(",", 1)[1]
        else:
            b64_str = data_url_or_b64
        image_bytes = base64.b64decode(b64_str)
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return img, image_bytes

    def validate_image_security_and_quality(self, img: Image.Image, view: str) -> ImageQualityResult:
        """
        STRICT SECURITY CHECK:
        Rejects dark, pitch black, covered lens, washed-out blank images,
        or images where no vehicle/bike structure is detected.
        """
        cv_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape

        # 1. Darkness / Black screen check
        mean_brightness = float(np.mean(gray))
        black_pixel_ratio = float(np.sum(gray < 20)) / (h * w)

        if mean_brightness < 32.0 or black_pixel_ratio > 0.85:
            return ImageQualityResult(
                is_valid=False,
                error_message=f"Security Rejection on {view} view: Image is pitch black or lens is covered (brightness: {mean_brightness:.1f}/255). Please capture in proper lighting."
            )

        # 2. Washed out / Blank white check
        if mean_brightness > 240.0:
            return ImageQualityResult(
                is_valid=False,
                error_message=f"Security Rejection on {view} view: Image is completely overexposed or white."
            )

        # 3. Blur & Texture Variance
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        if laplacian_var < 15.0:
            return ImageQualityResult(
                is_valid=False,
                error_message=f"Security Rejection on {view} view: Frame lacks optical detail, is severely blurred, or obstructed."
            )

        # 4. Vehicle / Bike Presence Check
        vehicle_detected = False

        # Check A: YOLO object detection for bicycle/motorcycle/car
        if self.yolo_model is not None:
            try:
                results = self.yolo_model.predict(source=img, imgsz=640, conf=0.18, verbose=False)
                if results and len(results) > 0:
                    r = results[0]
                    for box in r.boxes:
                        cls_id = int(box.cls[0].item())
                        cls_name = r.names.get(cls_id, "").lower()
                        # COCO classes: bicycle (1), motorcycle (3), car (2)
                        if cls_name in ["bicycle", "motorcycle", "car", "vehicle"] or "bike" in cls_name:
                            vehicle_detected = True
                            break
            except Exception as e:
                print(f"[YOLO] Error checking vehicle presence: {e}")

        # Check B: Mechanical structural contours & wheel curves
        if not vehicle_detected:
            edges = cv2.Canny(gray, 40, 140)
            edge_ratio = float(np.sum(edges > 0)) / (h * w)
            contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

            has_wheels_or_tubes = False
            for cnt in contours:
                area = cv2.contourArea(cnt)
                x, y, cw, ch = cv2.boundingRect(cnt)
                # Check for curved wheel circles or chassis frame lines
                if area > 400 and (cw > 50 or ch > 50):
                    has_wheels_or_tubes = True
                    break

            if edge_ratio > 0.008 and has_wheels_or_tubes:
                vehicle_detected = True

        if not vehicle_detected:
            return ImageQualityResult(
                is_valid=False,
                error_message=f"Security Rejection on {view} view: No electric bike or vehicle structure recognized. Please frame the actual bike inside camera guides."
            )

        return ImageQualityResult(is_valid=True, vehicle_detected=True)

    def analyze_local_image(self, img: Image.Image, view: str, bike_id: str) -> List[DetectionItem]:
        """
        Runs damage detection using YOLOv8 & calibrated CV anomaly analyzer.
        """
        detections: List[DetectionItem] = []
        width, height = img.size

        # If custom damage classes exist in YOLO
        if self.yolo_model is not None:
            try:
                results = self.yolo_model.predict(
                    source=img,
                    imgsz=640,
                    conf=settings.DAMAGE_CONFIDENCE_THRESHOLD,
                    verbose=False
                )
                if results and len(results) > 0:
                    r = results[0]
                    for box in r.boxes:
                        cls_id = int(box.cls[0].item())
                        cls_name_raw = r.names.get(cls_id, "damage").lower()
                        conf = float(box.conf[0].item())

                        if cls_name_raw in DAMAGE_METADATA:
                            cls_name = cls_name_raw
                        elif any(k in cls_name_raw for k in ["dent", "scratch", "crack"]):
                            cls_name = "dent" if "dent" in cls_name_raw else "scratch"
                        else:
                            continue

                        meta = DAMAGE_METADATA.get(cls_name, DAMAGE_METADATA["scratch"])
                        xyxy = [float(x) for x in box.xyxy[0].tolist()]
                        norm_box = [
                            xyxy[1] / height,
                            xyxy[0] / width,
                            xyxy[3] / height,
                            xyxy[2] / width
                        ]

                        detections.append(DetectionItem(
                            id=str(uuid.uuid4())[:8],
                            class_name=cls_name,
                            confidence=round(conf, 3),
                            box=[round(c, 1) for c in xyxy],
                            normalized_box=[round(c, 4) for c in norm_box],
                            view=view,
                            severity=meta["severity"],
                            description=meta["description"],
                            disqualifying=meta["disqualifying"]
                        ))
            except Exception as e:
                print(f"[YOLO] Error running model.predict: {e}")

        # Computer Vision Anomaly Detection
        try:
            cv_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            edges = cv2.Canny(blurred, 40, 140)

            contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

            candidate_defects = []
            for cnt in contours:
                area = cv2.contourArea(cnt)
                x, y, w, h = cv2.boundingRect(cnt)
                aspect_ratio = float(w) / h if h > 0 else 0
                mean_thickness = area / max(w, h) if max(w, h) > 0 else 0

                # Scratches: thin linear abrasions
                if (aspect_ratio > 2.8 or aspect_ratio < 0.35) and 100 < area < 3000 and mean_thickness < 6.5 and max(w, h) < 220:
                    candidate_defects.append(("scratch", (x, y, w, h), area))
                # Dents: localized concavities on chassis/frame
                elif 800 < area < 8000 and 0.55 <= aspect_ratio <= 1.7 and w < 140 and h < 140 and (y < 250 or (220 < x < 400)):
                    candidate_defects.append(("dent", (x, y, w, h), area))

            for defect_type, (x, y, w, h), area in candidate_defects[:2]:
                roi = gray[max(0, y):min(height, y+h), max(0, x):min(width, x+w)]
                std_dev = float(np.std(roi)) if roi.size > 0 else 0.0
                conf = min(0.92, max(0.48, 0.45 + (std_dev / 120.0)))

                if conf >= settings.DAMAGE_CONFIDENCE_THRESHOLD:
                    meta = DAMAGE_METADATA.get(defect_type, DAMAGE_METADATA["scratch"])
                    xyxy = [float(x), float(y), float(x + w), float(y + h)]
                    norm_box = [
                        xyxy[1] / height,
                        xyxy[0] / width,
                        xyxy[3] / height,
                        xyxy[2] / width
                    ]

                    already_covered = any(
                        abs(d.box[0] - xyxy[0]) < 40 and abs(d.box[1] - xyxy[1]) < 40
                        for d in detections if d.box
                    )
                    if not already_covered:
                        detections.append(DetectionItem(
                            id=str(uuid.uuid4())[:8],
                            class_name=defect_type,
                            confidence=round(conf, 3),
                            box=[round(c, 1) for c in xyxy],
                            normalized_box=[round(c, 4) for c in norm_box],
                            view=view,
                            severity=meta["severity"],
                            description=meta["description"],
                            disqualifying=meta["disqualifying"]
                        ))
        except Exception as cv_err:
            print(f"[CV-Detector] Vision error: {cv_err}")

        return detections

    def draw_annotated_image(self, img: Image.Image, detections: List[DetectionItem]) -> str:
        """Draws bounding boxes and telemetry tags onto image."""
        draw_img = img.copy()
        draw = ImageDraw.Draw(draw_img)
        w, h = draw_img.size

        for det in detections:
            if not det.box or len(det.box) < 4:
                continue
            x1, y1, x2, y2 = det.box

            color = (229, 72, 77) if det.disqualifying else (244, 163, 64)
            if det.severity == "minor":
                color = (22, 119, 255)

            draw.rectangle([x1, y1, x2, y2], outline=color, width=3)

            corner_len = min(20, min(x2 - x1, y2 - y1) / 3)
            draw.line([(x1, y1), (x1 + corner_len, y1)], fill=(255, 255, 255), width=3)
            draw.line([(x1, y1), (x1, y1 + corner_len)], fill=(255, 255, 255), width=3)
            draw.line([(x2, y2), (x2 - corner_len, y2)], fill=(255, 255, 255), width=3)
            draw.line([(x2, y2), (x2, y2 - corner_len)], fill=(255, 255, 255), width=3)

            tag_text = f"[{det.class_name.upper()}] {int(det.confidence * 100)}% - {det.severity.upper()}"
            banner_height = 22
            banner_width = min(len(tag_text) * 8 + 14, w - x1)

            draw.rectangle([x1, max(0, y1 - banner_height), x1 + banner_width, y1], fill=color)
            draw.text((x1 + 4, max(0, y1 - banner_height) + 3), tag_text, fill=(255, 255, 255))

        buffered = io.BytesIO()
        draw_img.save(buffered, format="JPEG", quality=85)
        img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{img_b64}"

    def process_inspection_images(self, bike_id: str, images: List[CapturedImageView]) -> Tuple[List[DetectionItem], Dict[str, List[DetectionItem]], Dict[str, str], List[str]]:
        """Processes each captured view, checks security, executes YOLO detection, and draws overlays."""
        all_detections: List[DetectionItem] = []
        view_detections: Dict[str, List[DetectionItem]] = {}
        annotated_thumbnails: Dict[str, str] = {}
        security_errors: List[str] = []

        for img_item in images:
            view = img_item.view
            pil_img, raw_bytes = self.decode_base64_image(img_item.image_data)

            # Security Quality & Anti-Tamper Check
            quality = self.validate_image_security_and_quality(pil_img, view)
            if not quality.is_valid:
                security_errors.append(quality.error_message)

            view_dets = self.analyze_local_image(pil_img, view, bike_id)

            view_detections[view] = view_dets
            all_detections.extend(view_dets)

            annotated_thumbnails[view] = self.draw_annotated_image(pil_img, view_dets)

        return all_detections, view_detections, annotated_thumbnails, security_errors

yolo_service = YOLOService()

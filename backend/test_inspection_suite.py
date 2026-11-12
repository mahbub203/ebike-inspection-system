import io
import base64
import requests
import sys
import time
from PIL import Image, ImageDraw

BASE_URL = "http://127.0.0.1:8000/api"

def create_synthetic_image(view_name: str, add_dent: bool = False, add_scratch: bool = False) -> str:
    img = Image.new("RGB", (640, 480), color=(16, 42, 67))
    draw = ImageDraw.Draw(img)
    
    # Draw bike silhouette (smooth solid structural geometry)
    draw.ellipse([80, 260, 240, 420], outline=(255, 255, 255), width=16)
    draw.ellipse([400, 260, 560, 420], outline=(255, 255, 255), width=16)
    draw.line([(160, 340), (280, 220), (440, 220), (480, 340), (280, 340), (160, 340)], fill=(255, 255, 255), width=24)

    # Add realistic localized high-contrast dent if requested
    if add_dent:
        draw.ellipse([300, 200, 390, 290], fill=(229, 72, 77), outline=(255, 255, 255), width=4)
    
    # Add thin linear scratch if requested
    if add_scratch:
        draw.line([(220, 160), (330, 190)], fill=(244, 163, 64), width=2)

    buffered = io.BytesIO()
    img.save(buffered, format="JPEG")
    b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

def run_tests():
    time.sleep(1.0)
    print("=" * 60, flush=True)
    print("  GLAFIT AI DAMAGE INSPECTION SYSTEM - TEST SUITE", flush=True)
    print("=" * 60, flush=True)
    
    passed_tests = 0
    total_tests = 0

    def assert_test(condition, name, error_msg=""):
        nonlocal passed_tests, total_tests
        total_tests += 1
        if condition:
            passed_tests += 1
            print(f"  [PASS] Test {total_tests}: {name}", flush=True)
        else:
            print(f"  [FAIL] Test {total_tests}: {name} -> {error_msg}", flush=True)

    # Test 1: Health endpoint & YOLOv8 Engine
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=10)
        assert_test(r.status_code == 200 and r.json().get("status") == "healthy", "Health Check & AI Engine Ready")
    except Exception as e:
        assert_test(False, "Health Check", str(e))

    # Test 2: Valid Bike Identification
    try:
        r = requests.get(f"{BASE_URL}/bikes/GLF-001", timeout=10)
        assert_test(r.status_code == 200 and r.json().get("bike_id") == "GLF-001", "Bike Identification (GLF-001)")
    except Exception as e:
        assert_test(False, "Bike Identification", str(e))

    # Test 3: Unregistered Bike Validation
    try:
        r = requests.get(f"{BASE_URL}/bikes/UNKNOWN-999", timeout=10)
        assert_test(r.status_code == 404, "Unregistered Bike Rejection (HTTP 404)")
    except Exception as e:
        assert_test(False, "Unregistered Bike Rejection", str(e))

    # Test 4: Missing Mandatory Image (only 2 of 4 angles provided)
    try:
        payload = {
            "bike_id": "GLF-001",
            "hub_id": "HUB-TYO-01",
            "inspection_type": "pre_rental",
            "images": [
                {"view": "front", "image_data": create_synthetic_image("front")},
                {"view": "rear", "image_data": create_synthetic_image("rear")}
            ]
        }
        r = requests.post(f"{BASE_URL}/inspect/analyze", json=payload, timeout=25)
        data = r.json()
        condition = (
            r.status_code == 200 and
            data.get("status") == "FAIL" and
            data.get("allowed_to_proceed_contract") is False and
            any("Missing mandatory camera inspection angles" in reason for reason in data.get("failure_reasons", []))
        )
        assert_test(condition, "Missing Mandatory Image Rejection (status == FAIL, allowed_to_proceed == False)")
    except Exception as e:
        assert_test(False, "Missing Mandatory Image", str(e))

    # Test 5: Clean Bike Inspection (All 4 mandatory angles, no damage)
    clean_inspection_id = None
    try:
        payload = {
            "bike_id": "GLF-001",
            "hub_id": "HUB-TYO-01",
            "inspection_type": "pre_rental",
            "images": [
                {"view": "front", "image_data": create_synthetic_image("front")},
                {"view": "rear", "image_data": create_synthetic_image("rear")},
                {"view": "left", "image_data": create_synthetic_image("left")},
                {"view": "right", "image_data": create_synthetic_image("right")}
            ]
        }
        r = requests.post(f"{BASE_URL}/inspect/analyze", json=payload, timeout=30)
        data = r.json()
        clean_inspection_id = data.get("inspection_id")
        condition = (
            r.status_code == 200 and
            data.get("status") == "PASS" and
            data.get("allowed_to_proceed_contract") is True and
            len(data.get("failure_reasons", [])) == 0 and
            data.get("detections_count") == 0
        )
        assert_test(condition, f"Clean Bike Inspection Approval (PASS) -> {clean_inspection_id}")
    except Exception as e:
        assert_test(False, "Clean Bike Inspection", str(e))

    # Test 6: Damaged Bike Inspection (Dent detected)
    failed_inspection_id = None
    try:
        payload = {
            "bike_id": "GLF-002",
            "hub_id": "HUB-TYO-01",
            "inspection_type": "pre_rental",
            "images": [
                {"view": "front", "image_data": create_synthetic_image("front")},
                {"view": "rear", "image_data": create_synthetic_image("rear")},
                {"view": "left", "image_data": create_synthetic_image("left", add_dent=True)},
                {"view": "right", "image_data": create_synthetic_image("right")}
            ]
        }
        r = requests.post(f"{BASE_URL}/inspect/analyze", json=payload, timeout=30)
        data = r.json()
        failed_inspection_id = data.get("inspection_id")
        condition = (
            r.status_code == 200 and
            data.get("status") == "FAIL" and
            data.get("allowed_to_proceed_contract") is False and
            data.get("detections_count") > 0
        )
        assert_test(condition, f"Damaged Bike Detection (FAIL with Disqualifying Anomaly) -> {failed_inspection_id}")
    except Exception as e:
        assert_test(False, "Damaged Bike Detection", str(e))

    # Test 7: STRICT SECURITY GATE - Attempt contract submission with FAILED inspection
    try:
        payload = {
            "inspection_id": failed_inspection_id,
            "bike_id": "GLF-002",
            "customer_name": "Taro Yamada",
            "customer_email": "taro@example.jp",
            "customer_phone": "090-0000-0000",
            "customer_id_type": "driver_license",
            "customer_id_number": "9999-8888-7777",
            "hub_id": "HUB-TYO-01",
            "rental_duration_hours": 24,
            "payment_method": "credit_card",
            "agree_terms": True
        }
        r = requests.post(f"{BASE_URL}/contracts/submit", json=payload, timeout=10)
        expected_msg = "You cannot submit the bike contract. Please visit the nearest hub or office for further inspection."
        condition = (
            r.status_code == 403 and
            r.json().get("detail") == expected_msg
        )
        assert_test(condition, "Security Gate: Block Contract Submission for Failed Inspection (HTTP 403 with exact error message)")
    except Exception as e:
        assert_test(False, "Contract Block on Failed Inspection", str(e))

    # Test 8: Contract submission with PASSED inspection
    try:
        payload = {
            "inspection_id": clean_inspection_id,
            "bike_id": "GLF-001",
            "customer_name": "Kenji Tanaka (田中 健司)",
            "customer_email": "tanaka@example.jp",
            "customer_phone": "090-1122-3344",
            "customer_id_type": "driver_license",
            "customer_id_number": "3104-5582-9910",
            "hub_id": "HUB-TYO-01",
            "rental_duration_hours": 24,
            "payment_method": "credit_card",
            "agree_terms": True
        }
        r = requests.post(f"{BASE_URL}/contracts/submit", json=payload, timeout=10)
        data = r.json()
        condition = (
            r.status_code == 200 and
            data.get("contract_id") is not None and
            data.get("inspection_id") == clean_inspection_id and
            data.get("status") == "confirmed"
        )
        assert_test(condition, f"Contract Submission Clearance for PASSED Inspection -> {data.get('contract_id')}")
    except Exception as e:
        assert_test(False, "Contract Submission for Passed Inspection", str(e))

    # Test 9: Duplicate Contract Submission Attempt
    try:
        payload = {
            "inspection_id": clean_inspection_id,
            "bike_id": "GLF-001",
            "customer_name": "Duplicate Submitter",
            "customer_email": "duplicate@example.jp",
            "customer_phone": "090-9999-9999",
            "customer_id_type": "driver_license",
            "customer_id_number": "3104-5582-9910",
            "hub_id": "HUB-TYO-01",
            "rental_duration_hours": 24,
            "payment_method": "credit_card",
            "agree_terms": True
        }
        r = requests.post(f"{BASE_URL}/contracts/submit", json=payload, timeout=10)
        condition = (
            r.status_code == 409 and
            "already submitted" in r.json().get("detail", "").lower()
        )
        assert_test(condition, "Duplicate Contract Submission Prevention (HTTP 409 Conflict)")
    except Exception as e:
        assert_test(False, "Duplicate Contract Prevention", str(e))

    # Test 10: History and Audit Retrieval
    try:
        r = requests.get(f"{BASE_URL}/inspections?status=ALL", timeout=10)
        assert_test(r.status_code == 200 and len(r.json()) >= 2, "Inspection History & Audit Retrieval")
    except Exception as e:
        assert_test(False, "History Retrieval", str(e))

    print("=" * 60, flush=True)
    print(f"  TEST RESULTS: {passed_tests} / {total_tests} PASSED", flush=True)
    print("=" * 60, flush=True)

    if passed_tests == total_tests:
        print("  ALL 10 TEST SCENARIOS PASSED WITH ZERO ERRORS!", flush=True)
        return 0
    else:
        print("  SOME TESTS FAILED.", flush=True)
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())

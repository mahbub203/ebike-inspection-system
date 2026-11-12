import io
import base64
import requests
import numpy as np
from PIL import Image, ImageDraw

BASE_URL = "http://127.0.0.1:8000/api"

def create_bike_image(defect: str = None, dark: bool = False) -> str:
    if dark:
        # Pitch black or covered lens
        img = Image.new("RGB", (640, 480), color=(10, 10, 10))
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG", quality=80)
        return f"data:image/jpeg;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

    # Clean EV Bike image with mechanical frames & wheel circles
    img = Image.new("RGB", (640, 480), color=(220, 225, 230))
    draw = ImageDraw.Draw(img)

    # Floor grid & background
    draw.rectangle([0, 360, 640, 480], fill=(180, 185, 190))

    # Wheels (high contrast rims and tires)
    draw.ellipse([80, 260, 200, 380], outline=(40, 40, 40), width=16)
    draw.ellipse([440, 260, 560, 380], outline=(40, 40, 40), width=16)
    draw.ellipse([120, 300, 160, 340], fill=(30, 30, 30))
    draw.ellipse([480, 300, 520, 340], fill=(30, 30, 30))

    # Main bike chassis
    draw.line([(140, 320), (280, 320), (360, 260), (480, 180), (500, 320)], fill=(20, 40, 60), width=14)
    draw.line([(280, 320), (250, 180)], fill=(20, 40, 60), width=12)
    # Saddle
    draw.rectangle([210, 170, 280, 190], fill=(10, 10, 10))
    # Handlebars
    draw.line([(480, 180), (450, 140)], fill=(30, 30, 30), width=10)
    draw.line([(430, 140), (470, 140)], fill=(10, 10, 10), width=8)

    # Defect injection
    if defect == "dent":
        # Critical structural defect
        draw.ellipse([300, 240, 360, 290], fill=(70, 30, 30), outline=(220, 40, 40), width=4)
    elif defect == "scratch":
        # Linear scratch
        draw.line([(260, 240), (320, 255)], fill=(240, 160, 40), width=3)

    buffered = io.BytesIO()
    img.save(buffered, format="JPEG", quality=85)
    return f"data:image/jpeg;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

def run_tests():
    print("=== STARTING GLAFIT BANGLADESH AI INSPECTION TEST SUITE ===")

    # 1. Health check
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, "Health check failed"
    print("✓ Health Check Passed:", res.json()["service"])

    # 2. User registration
    reg_payload = {
        "name": "Nafis Fuad",
        "email": f"nafis_{np.random.randint(1000, 9999)}@glafit.bd",
        "phone": f"0171{np.random.randint(1000000, 9999999)}",
        "nid_number": "19952691234567891",
        "password": "securepass123",
        "role": "customer"
    }
    res = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    assert res.status_code == 200, f"Registration failed: {res.text}"
    user_data = res.json()["user"]
    token = res.json()["token"]
    print(f"✓ User Registration Passed: {user_data['name']} ({user_data['user_id']})")

    # 3. User login
    login_payload = {
        "login_identifier": reg_payload["email"],
        "password": reg_payload["password"]
    }
    res = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    print("✓ User Login Authentication Passed with Token")

    # 4. Auto-save of user-entered Bike ID
    test_bike_id = f"BD-DHAKA-{np.random.randint(100, 999)}"
    res = requests.get(f"{BASE_URL}/bikes/{test_bike_id}")
    assert res.status_code == 200, f"Bike lookup/auto-register failed: {res.text}"
    bike = res.json()
    assert bike["bike_id"] == test_bike_id
    print(f"✓ Automatic Database Persistence for User Bike ID Passed: {test_bike_id}")

    # 5. Security Check: Reject Pitch Black / Covered Camera Lens
    dark_images = [
        {"view": "front", "image_data": create_bike_image(dark=True)},
        {"view": "rear", "image_data": create_bike_image()},
        {"view": "left", "image_data": create_bike_image()},
        {"view": "right", "image_data": create_bike_image()}
    ]
    dark_req = {
        "bike_id": test_bike_id,
        "hub_id": "HUB-DHK-01",
        "inspection_type": "pre_rental",
        "inspector_id": user_data["user_id"],
        "inspector_name": user_data["name"],
        "images": dark_images
    }
    res = requests.post(f"{BASE_URL}/inspect/analyze", json=dark_req)
    assert res.status_code == 200
    dark_record = res.json()
    assert dark_record["status"] == "FAIL", "Dark image was NOT rejected!"
    assert any("pitch black" in r.lower() or "security rejection" in r.lower() for r in dark_record["failure_reasons"]), "Expected security rejection reason missing"
    assert not dark_record["allowed_to_proceed_contract"], "Contract proceeding must be strictly FALSE!"
    print(f"✓ Strict Security Test Passed: Pitch black frame rejected with reasons: {dark_record['failure_reasons']}")

    # 6. Contract submission blocked on Failed Inspection
    contract_payload = {
        "inspection_id": dark_record["inspection_id"],
        "bike_id": test_bike_id,
        "customer_name": user_data["name"],
        "customer_email": user_data["email"],
        "customer_phone": user_data["phone"],
        "customer_id_type": "national_id",
        "customer_id_number": user_data["nid_number"],
        "hub_id": "HUB-DHK-01",
        "rental_duration_hours": 24,
        "payment_method": "bkash",
        "agree_terms": True
    }
    res = requests.post(f"{BASE_URL}/contracts/submit", json=contract_payload)
    assert res.status_code == 403, f"Expected HTTP 403 on failed inspection contract, got: {res.status_code}"
    assert "You cannot submit the bike contract" in res.json()["detail"], "Expected prompt failure error message missing!"
    print("✓ Contract Submission Security Gate Passed: Strict 403 Forbidden on failed bike inspection")

    # 7. Clean Bike Inspection: PASS & Contract Submission
    clean_images = [
        {"view": "front", "image_data": create_bike_image()},
        {"view": "rear", "image_data": create_bike_image()},
        {"view": "left", "image_data": create_bike_image()},
        {"view": "right", "image_data": create_bike_image()}
    ]
    clean_req = {
        "bike_id": test_bike_id,
        "hub_id": "HUB-DHK-01",
        "inspection_type": "pre_rental",
        "inspector_id": user_data["user_id"],
        "inspector_name": user_data["name"],
        "images": clean_images
    }
    res = requests.post(f"{BASE_URL}/inspect/analyze", json=clean_req)
    assert res.status_code == 200
    clean_record = res.json()
    assert clean_record["status"] == "PASS", f"Expected PASS for clean bike, got: {clean_record['status']} (reasons: {clean_record.get('failure_reasons')})"
    assert clean_record["allowed_to_proceed_contract"] is True, "Allowed to proceed must be True on PASS!"
    print(f"✓ Clean Inspection Passed: {clean_record['inspection_id']} (Status: PASS)")

    # 8. Submit Contract for PASSED inspection
    contract_payload["inspection_id"] = clean_record["inspection_id"]
    res = requests.post(f"{BASE_URL}/contracts/submit", json=contract_payload)
    assert res.status_code == 200, f"Contract submission failed: {res.text}"
    contract_data = res.json()
    assert contract_data["status"] == "confirmed"
    assert contract_data["rental_fee_bdt"] == 450
    assert contract_data["deposit_amount_bdt"] == 1500
    print(f"✓ Rental Contract Successfully Submitted & Confirmed: {contract_data['contract_id']}")
    print(f"  Fee: ৳{contract_data['rental_fee_bdt']} | Deposit: ৳{contract_data['deposit_amount_bdt']} | Payment: {contract_data['payment_method'].upper()}")

    print("\n=======================================================")
    print("ALL TEST SCENARIOS PASSED WITH 100% SPEC COMPLIANCE!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()

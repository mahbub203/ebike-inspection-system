import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Header, status

from .config import settings
from .database import db
from .models import (
    User, UserRegisterRequest, UserLoginRequest, AuthResponse,
    Bike, BikeRegisterRequest, Hub, InspectionRecord, ContractRecord,
    InspectionAnalysisRequest, ContractSubmissionRequest, DashboardStats
)
from .yolo_service import yolo_service
from .inspection_logic import decision_engine

router = APIRouter(prefix="/api")

# --- AUTH ENDPOINTS ---

@router.post("/auth/register", response_model=AuthResponse)
def register(req: UserRegisterRequest):
    try:
        user = db.create_user(
            name=req.name,
            email=req.email,
            phone=req.phone,
            nid=req.nid_number,
            password=req.password,
            role=req.role or "customer"
        )
        token = db.create_session(user.user_id)
        return AuthResponse(
            user=user,
            token=token,
            message="User registration successful. Welcome to Glafit Bangladesh."
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/auth/login", response_model=AuthResponse)
def login(req: UserLoginRequest):
    try:
        user = db.authenticate_user(req.login_identifier, req.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email/phone number or password. Please verify your credentials."
            )
        token = db.create_session(user.user_id)
        return AuthResponse(
            user=user,
            token=token,
            message="Login successful. Secure session established."
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS if "locked" in str(e).lower() else status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization:
        db.revoke_session(authorization)
    return {"status": "success", "message": "Logged out successfully from Glafit secure session."}

@router.get("/auth/me", response_model=User)
def get_current_user(
    authorization: Optional[str] = Header(None),
    user_id: Optional[str] = Query(None)
):
    if authorization:
        user = db.verify_session(authorization)
        if user:
            return user

    if user_id:
        user = db.get_user(user_id)
        if user:
            return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized session. Please sign in."
    )

# --- HEALTH & CONFIG ---

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "service": "GLAFIT Smart AI Inspection Engine (Bangladesh)",
        "timestamp": datetime.now().isoformat(),
        "ai_engine": yolo_service.model_name,
        "ai_loaded": yolo_service.model_loaded,
        "external_api_enabled": settings.EXTERNAL_YOLO_API_ENABLED
    }

@router.get("/config")
def get_config():
    return {
        "confidence_threshold": settings.DAMAGE_CONFIDENCE_THRESHOLD,
        "manual_review_low": settings.MANUAL_REVIEW_LOW_THRESHOLD,
        "manual_review_high": settings.MANUAL_REVIEW_HIGH_THRESHOLD,
        "mandatory_views": settings.MANDATORY_VIEWS,
        "disqualifying_classes": settings.DISQUALIFYING_CLASSES,
        "minor_damage_classes": settings.MINOR_DAMAGE_CLASSES,
        "max_allowed_minor_scratches": settings.MAX_ALLOWED_MINOR_SCRATCHES
    }

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats():
    return db.get_stats(
        ai_model_name=yolo_service.model_name,
        ai_status="Active / Calibrated" if yolo_service.model_loaded else "Vision Engine Active"
    )

# --- BIKE ENDPOINTS ---

@router.get("/bikes", response_model=List[Bike])
def list_bikes():
    return db.list_bikes()

@router.post("/bikes/register", response_model=Bike)
def register_bike(req: BikeRegisterRequest):
    """Explicitly register a bike into the fleet."""
    return db.register_or_get_bike(
        bike_id=req.bike_id,
        model_name=req.model_name,
        hub_id=req.current_hub_id
    )

@router.get("/bikes/{bike_id}", response_model=Bike)
def get_bike(bike_id: str):
    bike = db.get_bike(bike_id)
    if not bike:
        # Automatic registration for smooth UX:
        bike = db.register_or_get_bike(bike_id)
    return bike

# --- HUB ENDPOINTS ---

@router.get("/hubs", response_model=List[Hub])
def list_hubs():
    return db.list_hubs()

@router.get("/hubs/{hub_id}", response_model=Hub)
def get_hub(hub_id: str):
    hub = db.get_hub(hub_id)
    if not hub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hub '{hub_id}' not found."
        )
    return hub

# --- INSPECTION ENDPOINTS ---

@router.post("/inspect/analyze", response_model=InspectionRecord)
def analyze_inspection(req: InspectionAnalysisRequest):
    # 1. Automatic Bike Registration or Fetch
    bike = db.register_or_get_bike(
        bike_id=req.bike_id,
        user_id=req.inspector_id
    )

    # 2. Validate that images are provided
    if not req.images or len(req.images) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No camera images submitted. Please capture all mandatory views."
        )

    hub = db.get_hub(req.hub_id)
    hub_name = hub.name if hub else "Gulshan Flagship EV Hub"

    try:
        # 3. Process images through YOLOv8 / CV Analyzer with Anti-Tamper Security Quality checks
        detections, view_detections, annotated_thumbnails, security_errors = yolo_service.process_inspection_images(
            bike_id=req.bike_id,
            images=req.images
        )
    except Exception as err:
        print(f"[API] Error in AI vision processing: {err}")
        # Never automatically approve if AI fails!
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Vision Inspection failed: {str(err)}"
        )

    # 4. Run Inspection Decision Logic with Security Rejections
    status_code, summary, failure_reasons, allowed_to_proceed, breakdown = decision_engine.evaluate(
        bike_id=req.bike_id,
        captured_images=req.images,
        detections=detections,
        security_errors=security_errors
    )

    # 5. Create Inspection Record
    inspection_id = f"INS-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    record = InspectionRecord(
        inspection_id=inspection_id,
        bike_id=req.bike_id.upper(),
        bike_model=bike.model_name,
        hub_id=req.hub_id,
        hub_name=hub_name,
        inspector_id=req.inspector_id or "USR-001",
        inspector_name=req.inspector_name or "Tanvir Ahmed",
        inspection_type=req.inspection_type,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status=status_code,
        images_analyzed_count=len(req.images),
        detections_count=len(detections),
        detections=detections,
        view_detections=view_detections,
        analyzed_image_thumbnails=annotated_thumbnails,
        summary=summary,
        failure_reasons=failure_reasons,
        allowed_to_proceed_contract=allowed_to_proceed,
        contract_submitted=False,
        decision_breakdown=breakdown
    )

    # 6. Save in DB
    db.save_inspection(record)
    return record

@router.get("/inspections", response_model=List[InspectionRecord])
def list_inspections(
    status: Optional[str] = Query(None, description="Filter by status (PASS, FAIL, MANUAL_REVIEW, ALL)"),
    bike_id: Optional[str] = Query(None, description="Filter by Bike ID")
):
    return db.list_inspections(status_filter=status, bike_id=bike_id)

@router.get("/inspections/{inspection_id}", response_model=InspectionRecord)
def get_inspection(inspection_id: str):
    record = db.get_inspection(inspection_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection ID '{inspection_id}' not found."
        )
    return record

# --- CONTRACT ENDPOINTS ---

@router.post("/contracts/submit", response_model=ContractRecord)
def submit_contract(req: ContractSubmissionRequest):
    # 1. Fetch Inspection Record
    inspection = db.get_inspection(req.inspection_id)
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Referenced Inspection '{req.inspection_id}' does not exist."
        )

    # 2. STRICT SECURITY CHECK: Inspection must be successful (PASS)
    if inspection.status != "PASS" or not inspection.allowed_to_proceed_contract:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot submit the bike contract. Please visit the nearest hub or office for further inspection."
        )

    # 3. Check for Duplicate Submission
    existing_contract = db.get_contract_by_inspection(req.inspection_id)
    if existing_contract:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Contract already submitted for this inspection (Contract ID: {existing_contract.contract_id})."
        )

    # 4. Verify Bike and Hub
    bike = db.get_bike(req.bike_id)
    bike_model = bike.model_name if bike else f"GLAFIT EV Smart Bike ({req.bike_id})"
    hub = db.get_hub(req.hub_id)
    hub_name = hub.name if hub else "Gulshan Flagship EV Hub"

    # 5. Mask Customer ID for Security / Compliance
    masked_id = (
        req.customer_id_number[:3] + "******" + req.customer_id_number[-3:]
        if len(req.customer_id_number) > 6
        else "******"
    )

    now = datetime.now()
    due_time = now + timedelta(hours=req.rental_duration_hours)
    contract_id = f"CTR-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    contract = ContractRecord(
        contract_id=contract_id,
        inspection_id=req.inspection_id,
        bike_id=req.bike_id.upper(),
        bike_model=bike_model,
        customer_name=req.customer_name,
        customer_email=req.customer_email,
        customer_phone=req.customer_phone,
        customer_id_type=req.customer_id_type,
        customer_id_masked=masked_id,
        hub_id=req.hub_id,
        hub_name=hub_name,
        rental_duration_hours=req.rental_duration_hours,
        payment_method=req.payment_method,
        status="confirmed",
        submitted_at=now.strftime("%Y-%m-%d %H:%M:%S"),
        return_due_time=due_time.strftime("%Y-%m-%d %H:%M:%S"),
        deposit_amount_bdt=1500,
        rental_fee_bdt=450
    )

    db.save_contract(contract)
    return contract

@router.get("/contracts", response_model=List[ContractRecord])
def list_contracts():
    return db.list_contracts()

@router.get("/contracts/{contract_id}", response_model=ContractRecord)
def get_contract(contract_id: str):
    contract = db.get_contract(contract_id)
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contract '{contract_id}' not found."
        )
    return contract

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class User(BaseModel):
    user_id: str
    name: str
    email: str
    phone: str
    nid_number: str
    role: str = "customer"  # customer, staff, admin
    created_at: str

class UserRegisterRequest(BaseModel):
    name: str
    email: str
    phone: str
    nid_number: str
    password: str
    role: Optional[str] = "customer"

class UserLoginRequest(BaseModel):
    login_identifier: str  # email or phone
    password: str

class AuthResponse(BaseModel):
    user: User
    token: str
    message: str

class Bike(BaseModel):
    bike_id: str
    model_name: str
    brand: str = "GLAFIT"
    category: str = "Smart Electric Urban Bike"
    serial_number: str
    battery_level: int = 95
    status: str = "available"  # available, rented, maintenance, pending_inspection
    current_hub_id: str = "HUB-DHK-01"
    last_inspection_date: Optional[str] = None
    odometer_km: float = 120.0
    image_url: Optional[str] = None
    registered_by_user: Optional[str] = None

class BikeRegisterRequest(BaseModel):
    bike_id: str
    model_name: Optional[str] = "GLAFIT Urban EV Series-1"
    current_hub_id: Optional[str] = "HUB-DHK-01"
    battery_level: Optional[int] = 95
    notes: Optional[str] = None

class Hub(BaseModel):
    hub_id: str
    name: str
    address: str
    city: str
    division: str = "Dhaka"
    phone: str
    operating_hours: str
    contact_email: str

class DetectionItem(BaseModel):
    id: str
    class_name: str  # scratch, dent, crack, broken_parts, frame_damage, etc.
    confidence: float
    box: List[float] = Field(default_factory=list)  # [x1, y1, x2, y2] in pixels
    normalized_box: List[float] = Field(default_factory=list)  # [ymin, xmin, ymax, xmax] 0.0-1.0
    view: str  # front, rear, left, right, damage_closeup
    severity: str = "minor"  # minor, moderate, critical
    description: str = ""
    disqualifying: bool = False

class CapturedImageView(BaseModel):
    view: str
    image_data: str  # data:image/jpeg;base64,...
    client_timestamp: Optional[str] = None

class InspectionAnalysisRequest(BaseModel):
    bike_id: str
    hub_id: str
    inspection_type: str = "pre_rental"  # pre_rental, post_rental, periodic_maintenance
    inspector_id: Optional[str] = "STAFF-DHK-01"
    inspector_name: Optional[str] = "Tanvir Ahmed"
    notes: Optional[str] = None
    images: List[CapturedImageView]

class InspectionRecord(BaseModel):
    inspection_id: str
    bike_id: str
    bike_model: Optional[str] = None
    hub_id: str
    hub_name: Optional[str] = None
    inspector_id: str
    inspector_name: str
    inspection_type: str
    created_at: str
    status: str  # PASS, FAIL, MANUAL_REVIEW
    images_analyzed_count: int
    detections_count: int
    detections: List[DetectionItem]
    view_detections: Dict[str, List[DetectionItem]] = Field(default_factory=dict)
    analyzed_image_thumbnails: Dict[str, str] = Field(default_factory=dict)
    summary: str
    failure_reasons: List[str] = Field(default_factory=list)
    allowed_to_proceed_contract: bool
    contract_submitted: bool = False
    contract_id: Optional[str] = None
    decision_breakdown: Dict[str, Any] = Field(default_factory=dict)

class ContractSubmissionRequest(BaseModel):
    inspection_id: str
    bike_id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    customer_id_type: str = "national_id"  # national_id, driving_license, passport
    customer_id_number: str
    hub_id: str
    rental_duration_hours: int = 24
    payment_method: str = "bkash"  # bkash, nagad, card, cash
    agree_terms: bool = True
    staff_notes: Optional[str] = None

class ContractRecord(BaseModel):
    contract_id: str
    inspection_id: str
    bike_id: str
    bike_model: str
    customer_name: str
    customer_email: str
    customer_phone: str
    customer_id_type: str
    customer_id_masked: str
    hub_id: str
    hub_name: str
    rental_duration_hours: int
    payment_method: str
    status: str = "confirmed"  # confirmed, active, completed, cancelled
    submitted_at: str
    return_due_time: str
    deposit_amount_bdt: int = 1500
    rental_fee_bdt: int = 450

class DashboardStats(BaseModel):
    total_inspections: int
    successful_inspections: int
    failed_inspections: int
    manual_review_inspections: int
    pass_rate_percentage: float
    registered_bikes_count: int
    active_contracts_count: int
    ai_model_name: str
    ai_status: str

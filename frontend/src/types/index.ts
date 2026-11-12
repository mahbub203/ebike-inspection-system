export type InspectionStatus = 'PASS' | 'FAIL' | 'MANUAL_REVIEW';

export type DamageSeverity = 'minor' | 'moderate' | 'critical';

export interface User {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  nid_number: string;
  role: 'customer' | 'staff' | 'admin';
  created_at: string;
}

export interface UserRegisterRequest {
  name: string;
  email: string;
  phone: string;
  nid_number: string;
  password: string;
  role?: string;
}

export interface UserLoginRequest {
  login_identifier: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export interface DetectionItem {
  id: string;
  class_name: string;
  confidence: number;
  box: number[]; // [x1, y1, x2, y2]
  normalized_box: number[]; // [ymin, xmin, ymax, xmax]
  view: string;
  severity: DamageSeverity;
  description: string;
  disqualifying: boolean;
}

export interface CapturedImageView {
  view: string;
  image_data: string; // data:image/jpeg;base64,...
  client_timestamp?: string;
}

export interface Bike {
  bike_id: string;
  model_name: string;
  brand: string;
  category: string;
  serial_number: string;
  battery_level: number;
  status: 'available' | 'rented' | 'maintenance' | 'pending_inspection';
  current_hub_id: string;
  last_inspection_date?: string;
  odometer_km: number;
  image_url?: string;
  registered_by_user?: string | null;
}

export interface BikeRegisterRequest {
  bike_id: string;
  model_name?: string;
  current_hub_id?: string;
  battery_level?: number;
  notes?: string;
}

export interface Hub {
  hub_id: string;
  name: string;
  address: string;
  city: string;
  division?: string;
  phone: string;
  operating_hours: string;
  contact_email: string;
}

export interface InspectionRecord {
  inspection_id: string;
  bike_id: string;
  bike_model?: string;
  hub_id: string;
  hub_name?: string;
  inspector_id: string;
  inspector_name: string;
  inspection_type: string;
  created_at: string;
  status: InspectionStatus;
  images_analyzed_count: number;
  detections_count: number;
  detections: DetectionItem[];
  view_detections: Record<string, DetectionItem[]>;
  analyzed_image_thumbnails: Record<string, string>;
  summary: string;
  failure_reasons: string[];
  allowed_to_proceed_contract: boolean;
  contract_submitted: boolean;
  contract_id?: string;
  decision_breakdown: {
    mandatory_views_present: boolean;
    captured_views_count: number;
    security_passed?: boolean;
    disqualifying_count: number;
    borderline_count: number;
    minor_count: number;
    confidence_threshold: number;
    max_allowed_minor_scratches: number;
  };
}

export interface ContractSubmissionRequest {
  inspection_id: string;
  bike_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_id_type: string;
  customer_id_number: string;
  hub_id: string;
  rental_duration_hours: number;
  payment_method: string;
  agree_terms: boolean;
  staff_notes?: string;
}

export interface ContractRecord {
  contract_id: string;
  inspection_id: string;
  bike_id: string;
  bike_model: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_id_type: string;
  customer_id_masked: string;
  hub_id: string;
  hub_name: string;
  rental_duration_hours: number;
  payment_method: string;
  status: string;
  submitted_at: string;
  return_due_time: string;
  deposit_amount_bdt: number;
  rental_fee_bdt: number;
}

export interface DashboardStats {
  total_inspections: number;
  successful_inspections: number;
  failed_inspections: number;
  manual_review_inspections: number;
  pass_rate_percentage: number;
  registered_bikes_count: number;
  active_contracts_count: number;
  ai_model_name: string;
  ai_status: string;
}

export interface CameraViewDefinition {
  id: string;
  name: string;
  instruction: string;
  mandatory: boolean;
  silhouette: 'front' | 'rear' | 'left' | 'right' | 'closeup';
}

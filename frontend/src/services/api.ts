import {
  Bike,
  BikeRegisterRequest,
  Hub,
  InspectionRecord,
  ContractRecord,
  ContractSubmissionRequest,
  DashboardStats,
  CapturedImageView,
  User,
  UserRegisterRequest,
  UserLoginRequest,
  AuthResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const YOLO_ENDPOINT = import.meta.env.VITE_YOLO_ENDPOINT || '/inspect/analyze';

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('glafit_token');
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new ApiError(response.status, errorMessage);
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or connection failure
    throw new ApiError(0, `Network Connection Failed: Unable to reach AI Inspection API at ${API_BASE_URL}. Please verify server connection.`);
  }
}

export const api = {
  // Authentication
  register: (data: UserRegisterRequest) => request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  login: (data: UserLoginRequest) => request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  logout: () => request<{ status: string; message: string }>('/auth/logout', {
    method: 'POST',
  }),

  getMe: (userId?: string) => {
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    return request<User>(`/auth/me${query}`);
  },

  // Health & Config
  getHealth: () => request<{
    status: string;
    service: string;
    ai_engine: string;
    ai_loaded: boolean;
    external_api_enabled: boolean;
  }>('/health'),

  getConfig: () => request<Record<string, unknown>>('/config'),

  getStats: () => request<DashboardStats>('/stats'),

  // Bikes
  getBikes: () => request<Bike[]>('/bikes'),
  getBike: (bikeId: string) => request<Bike>(`/bikes/${encodeURIComponent(bikeId.trim())}`),
  registerBike: (data: BikeRegisterRequest) => request<Bike>('/bikes/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Hubs
  getHubs: () => request<Hub[]>('/hubs'),
  getHub: (hubId: string) => request<Hub>(`/hubs/${encodeURIComponent(hubId.trim())}`),

  // Inspection
  submitInspectionAnalysis: (data: {
    bike_id: string;
    hub_id: string;
    inspection_type: string;
    inspector_id?: string;
    inspector_name?: string;
    notes?: string;
    images: CapturedImageView[];
  }) => request<InspectionRecord>(YOLO_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getInspections: (statusFilter?: string, bikeId?: string) => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
    if (bikeId) params.append('bike_id', bikeId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<InspectionRecord[]>(`/inspections${queryString}`);
  },

  getInspection: (inspectionId: string) => request<InspectionRecord>(`/inspections/${encodeURIComponent(inspectionId)}`),

  // Contracts
  submitContract: (data: ContractSubmissionRequest) => request<ContractRecord>('/contracts/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getContracts: () => request<ContractRecord[]>('/contracts'),
  getContract: (contractId: string) => request<ContractRecord>(`/contracts/${encodeURIComponent(contractId)}`),
};

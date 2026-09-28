import axios from 'axios';

// Relative /api uses Vite's development proxy. Set VITE_API_URL in production
// when the React app and API are hosted on different origins.
export const BACKEND_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Attach Bearer token from localStorage to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('roktolink_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface DonorProfileData {
  id: number;
  public_donor_code: string;
  blood_group: string;
  preferred_radius_km: number;
  last_donation_at: string | null;
  last_donation_formatted: string | null;
  is_cooldown_active: boolean;
  cooldown_days_remaining: number;
  can_donate: boolean;
  donor_status: 'ACTIVE' | 'INACTIVE_90_DAYS' | null;
  is_available: boolean;
  division?: string | null;
  district?: string | null;
  upazila?: string | null;
  landmark?: string | null;
}

export interface VolunteerProfileData {
  id: number;
  volunteer_code: string;
  organization_affiliation?: string | null;
  emergency_contact_phone?: string;
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  verified_at?: string | null;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  is_verified?: boolean;
  email_verified_at?: string | null;
  is_donor?: boolean;
  donor_profile?: DonorProfileData | null;
  is_volunteer?: boolean;
  volunteer_profile?: VolunteerProfileData | null;
  is_admin?: boolean;
}

export interface PlatformStats {
  emergency_requests: number;
  active_donors: number;
  verified_volunteers: number;
  fulfilled_requests: number;
}

export interface UrgentRequestItem {
  id: number;
  code: string;
  blood_group: string;
  component: string;
  units: number;
  urgency: string;
  hospital: string;
  district: string;
  address?: string;
  time: string;
  status?: string;
  phone?: string;
  note?: string;
}

export interface GroupSummary {
  group: string;
  count: number;
}

export interface LifesaverItem {
  id: number;
  donor_name: string;
  blood_group: string;
  facility: string;
  units: number;
  certificate_code: string;
  donated_at: string;
  note: string;
}

export type Lifesaver = LifesaverItem;

/* =====================================================================
   API Helper Functions
   ===================================================================== */

export const loginApi = async (email: string, password: string): Promise<{ token?: string; user?: AuthUser; requires_verification?: boolean; email?: string; message: string }> => {
  const res = await api.post('/auth/login', { email, password });
  if (res.data.token && res.data.user) {
    localStorage.setItem('roktolink_token', res.data.token);
    localStorage.setItem('roktolink_user', JSON.stringify(res.data.user));
  }
  return res.data;
};

export const registerApi = async (data: { name: string; email: string; phone?: string; password: string }): Promise<{ message: string; email: string; requires_verification: boolean; expires_in_seconds: number; delivery_status?: 'sent' | 'failed' }> => {
  const res = await api.post('/auth/register', data);
  return res.data;
};

export const verifyEmailApi = async (email: string, code: string): Promise<{ token: string; user: AuthUser; message: string }> => {
  const res = await api.post('/auth/verify-email', { email, code });
  if (res.data.token && res.data.user) {
    localStorage.setItem('roktolink_token', res.data.token);
    localStorage.setItem('roktolink_user', JSON.stringify(res.data.user));
  }
  return res.data;
};

export const resendVerificationApi = async (email: string): Promise<{ message: string; expires_in_seconds: number; delivery_status?: 'sent' | 'failed' }> => {
  const res = await api.post('/auth/resend-verification', { email });
  return res.data;
};

export const forgotPasswordApi = async (email: string): Promise<{ message: string; email?: string; delivery_status?: 'sent' | 'failed'; mail_error?: string }> => {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
};

export const resetPasswordApi = async (data: { email: string; code: string; password: string; password_confirmation: string }): Promise<{ message: string }> => {
  const res = await api.post('/auth/reset-password', data);
  return res.data;
};

export const getMeApi = async (): Promise<AuthUser | null> => {
  try {
    const res = await api.get('/auth/me');
    return res.data;
  } catch {
    return null;
  }
};

export const logoutApi = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('roktolink_token');
    localStorage.removeItem('roktolink_user');
  }
};

export const fetchStats = async (): Promise<PlatformStats> => {
  try {
    const res = await api.get('/stats');
    return res.data;
  } catch (error) {
    return {
      emergency_requests: 37,
      active_donors: 2418,
      verified_volunteers: 312,
      fulfilled_requests: 8941,
    };
  }
};

export const fetchRequests = async (urgency?: string, group?: string, search?: string): Promise<UrgentRequestItem[]> => {
  try {
    const res = await api.get('/requests', { params: { urgency, group, search } });
    return res.data;
  } catch (error) {
    return [
      { id: 1, code: 'RLB-26-04821', blood_group: 'O-', component: 'Red Cells', units: 2, urgency: 'EMERGENCY_NOW', hospital: 'Mitford Hospital, Dhaka', district: 'Dhaka', time: '12 min ago' },
      { id: 2, code: 'RLB-26-04815', blood_group: 'B+', component: 'Platelets', units: 1, urgency: 'TODAY', hospital: 'Chattogram Medical College', district: 'Chattogram', time: '34 min ago' },
      { id: 3, code: 'RLB-26-04798', blood_group: 'A+', component: 'Whole Blood', units: 3, urgency: 'EMERGENCY_NOW', hospital: 'Sylhet MAG Osmani Hospital', district: 'Sylhet', time: '1 hr ago' },
      { id: 4, code: 'RLB-26-04792', blood_group: 'AB-', component: 'Plasma', units: 1, urgency: 'WITHIN_6_HOURS', hospital: 'Rajshahi Medical College', district: 'Rajshahi', time: '2 hrs ago' },
      { id: 5, code: 'RLB-26-04788', blood_group: 'O+', component: 'Red Cells', units: 2, urgency: 'TODAY', hospital: 'Kumudini Hospital, Tangail', district: 'Tangail', time: '3 hrs ago' },
      { id: 6, code: 'RLB-26-04781', blood_group: 'B-', component: 'Red Cells', units: 1, urgency: 'NORMAL', hospital: 'Khulna Medical College', district: 'Khulna', time: '5 hrs ago' },
    ];
  }
};

export const fetchRequestDetail = async (id: string | number): Promise<UrgentRequestItem> => {
  const res = await api.get(`/requests/${id}`);
  return res.data;
};

export const createBloodRequestApi = async (data: {
  patient_name?: string;
  blood_group: string;
  component?: string;
  units_required: number;
  urgency: string;
  facility_name: string;
  address_text?: string;
  latitude?: number;
  longitude?: number;
  requester_phone: string;
  public_note?: string;
}) => {
  const res = await api.post('/requests', data);
  return res.data;
};

export interface UserBloodRequestItem {
  id: number;
  code: string;
  patient_name?: string;
  blood_group: string;
  component: string;
  units: number;
  units_completed: number;
  urgency: string;
  hospital: string;
  address: string;
  status: string;
  created_at: string;
  time_ago: string;
  phone: string;
  note?: string;
}

export const fetchMyBloodRequestsApi = async (): Promise<UserBloodRequestItem[]> => {
  const res = await api.get('/user/requests');
  return res.data;
};

export const registerDonorApi = async (data: {
  blood_group: string;
  preferred_radius_km: number;
  landmark?: string;
  division?: string;
  district?: string;
  upazila?: string;
  is_available?: boolean;
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}) => {
  const res = await api.post('/donor/register', data);
  return res.data;
};

export const updateDonorLocationApi = async (data: {
  division?: string;
  district?: string;
  upazila?: string;
  landmark?: string;
}) => {
  const res = await api.post('/donor/update-location', data);
  return res.data;
};

export const sendBloodRequestToDonorApi = async (donorId: number, bloodRequestId: number): Promise<{ message: string; match_id?: number; compatible?: boolean }> => {
  const res = await api.post(`/donors/${donorId}/send-request`, { blood_request_id: bloodRequestId });
  return res.data;
};

export const toggleDonorAvailabilityApi = async (is_available: boolean, radius_km?: number) => {
  const res = await api.post('/donor/toggle-availability', { is_available, radius_km });
  return res.data;
};

export const applyVolunteerApi = async (data: {
  name: string;
  email: string;
  phone: string;
  nid_number?: string;
  organization?: string;
  district?: string;
}) => {
  const res = await api.post('/volunteer/apply', data);
  return res.data;
};

export const fetchLifesaversApi = async (): Promise<LifesaverItem[]> => {
  try {
    const res = await api.get('/lifesavers');
    return res.data;
  } catch {
    return [];
  }
};

export const fetchGroupsSummary = async (): Promise<Record<string, GroupSummary>> => {
  try {
    const res = await api.get('/groups-summary');
    return res.data;
  } catch (error) {
    return {
      'A+': { group: 'A+', count: 368 },
      'A-': { group: 'A-', count: 92 },
      'B+': { group: 'B+', count: 512 },
      'B-': { group: 'B-', count: 74 },
      'AB+': { group: 'AB+', count: 141 },
      'AB-': { group: 'AB-', count: 33 },
      'O+': { group: 'O+', count: 641 },
      'O-': { group: 'O-', count: 157 },
    };
  }
};

export interface RoktoBotResponse {
  reply: string;
  source: string;
  locale?: string;
  intent?: string;
  confidence?: number;
  emergency_mode?: boolean;
  action?: string;
  draft?: {
    blood_group?: string;
    facility_name?: string;
    units_required?: number;
    urgency?: string;
    patient_relation?: string;
  };
  citation?: {
    source: string;
    title: string;
  };
  can_escalate?: boolean;
  suggestions?: string[];
}

export const sendBotMessage = async (message: string, locale: string, sessionId?: string): Promise<RoktoBotResponse> => {
  const payload = { message, locale, session_id: sessionId };
  try {
    const res = await api.post('/roktobot', payload);
    if (res.data?.reply) return res.data;
  } catch { /* try fallback */ }
  try {
    const res = await api.post('/roktobot/chat', payload);
    if (res.data?.reply) return res.data;
  } catch { /* give up */ }
  throw new Error('Unable to connect to RoktoBot service. Please ensure the backend server is running.');
};

export const escalateChatApi = async (data: {
  session_id: string;
  reason: string;
  blood_group?: string;
  location_text?: string;
  contact_phone?: string;
}): Promise<{ message: string; ticket_id: string }> => {
  const res = await api.post('/roktobot/escalate', data);
  return res.data;
};

export const sendChatFeedbackApi = async (data: {
  session_id: string;
  rating: 1 | -1;
  query_text?: string;
  response_text?: string;
  comment?: string;
}): Promise<{ message: string }> => {
  try {
    const res = await api.post('/roktobot/feedback', data);
    return res.data;
  } catch {
    return { message: 'Feedback noted locally.' };
  }
};

/* =====================================================================
   Donor Matching & Controlled Coordination Flow
   ===================================================================== */

export interface PendingMatchItem {
  match_id: number;
  request_id: number;
  request_code: string;
  blood_group: string;
  component: string;
  units_required: number;
  urgency: string;
  facility_name: string;
  address_text?: string;
  distance_km: number;
  match_score: number;
  response_status: string;
  notified_at?: string;
  accepted_at?: string;
  requester_phone?: string | null;
  requester_name?: string;
  created_at: string;
}

export const fetchPendingMatchesApi = async (): Promise<PendingMatchItem[]> => {
  try {
    const res = await api.get('/donor/pending-matches');
    return res.data;
  } catch {
    return [];
  }
};

export const respondToMatchApi = async (matchId: number, response: 'ACCEPTED' | 'DECLINED', reason?: string) => {
  const res = await api.post(`/matches/${matchId}/respond`, { response, reason });
  return res.data;
};

export const updateMatchStatusApi = async (matchId: number, status: 'DONOR_TRAVELLING' | 'DONOR_ARRIVED' | 'DONATION_COMPLETED', note?: string) => {
  const res = await api.post(`/matches/${matchId}/status`, { status, note });
  return res.data;
};

export const offerDonationApi = async (requestId: string | number) => {
  const res = await api.post(`/requests/${requestId}/offer-donation`);
  return res.data;
};

export interface CoordinationData {
  is_authorized: boolean;
  request_id: number;
  request_code: string;
  blood_group: string;
  units_required: number;
  units_committed: number;
  units_completed: number;
  urgency: string;
  facility_name: string;
  address_text?: string;
  status: string;
  requester: {
    name: string;
    phone: string;
    relation: string;
  };
  accepted_donors: Array<{
    match_id: number;
    public_code: string;
    donor_name: string;
    donor_phone: string;
    blood_group: string;
    distance_km: number;
    accepted_at: string;
  }>;
  has_accepted_donor: boolean;
}

export const fetchCoordinationApi = async (requestId: string | number): Promise<CoordinationData> => {
  const res = await api.get(`/requests/${requestId}/coordination`);
  return res.data;
};

export interface CaseMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  message: string;
  is_me: boolean;
  created_at: string;
}

export const fetchCaseMessagesApi = async (requestId: string | number): Promise<CaseMessage[]> => {
  const res = await api.get(`/requests/${requestId}/messages`);
  return res.data;
};

export const sendCaseMessageApi = async (requestId: string | number, message: string): Promise<CaseMessage> => {
  const res = await api.post(`/requests/${requestId}/messages`, { message });
  return res.data;
};

/* =====================================================================
   Admin Volunteer Pipeline
   ===================================================================== */

export interface AdminVolunteerItem {
  id: number;
  user_id: number;
  volunteer_code: string;
  organization_affiliation?: string;
  emergency_contact_phone: string;
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  verified_at?: string;
  rejection_reason?: string;
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
  created_at: string;
}

export const fetchAdminVolunteersApi = async (status: string = 'PENDING'): Promise<AdminVolunteerItem[]> => {
  const res = await api.get('/admin/volunteers', { params: { status } });
  return res.data;
};

export const approveVolunteerApi = async (id: number) => {
  const res = await api.post(`/admin/volunteers/${id}/approve`);
  return res.data;
};

export const rejectVolunteerApi = async (id: number, reason: string) => {
  const res = await api.post(`/admin/volunteers/${id}/reject`, { reason });
  return res.data;
};

export const revokeVolunteerApi = async (id: number, reason?: string) => {
  const res = await api.post(`/admin/volunteers/${id}/revoke`, { reason });
  return res.data;
};

/* =====================================================================
   Donor Search — uses Stored Procedure sp_get_eligible_donors_by_group
   ===================================================================== */

export interface DonorSearchResult {
  donor_id: number;
  donor_name: string;
  donor_phone: string;
  donor_email: string;
  blood_group: string;
  profile_status: string;
  preferred_radius_km: number;
  last_donation_at: string | null;
  landmark: string | null;
  public_donor_code: string;
  location_name: string;
  is_protected?: boolean;
}

export interface DonorSearchResponse {
  success: boolean;
  procedure: string;
  sql_executed: string;
  filters: { blood_group: string; location: string };
  total: number;
  data: DonorSearchResult[];
  privacy_shield?: string;
}

/**
 * Calls GET /api/donors/search which invokes MySQL Stored Procedure:
 *   CALL sp_get_eligible_donors_by_group(blood_group, location)
 */
export const searchDonorsApi = async (
  bloodGroup: string,
  location: string = ''
): Promise<DonorSearchResponse> => {
  const res = await api.get('/donors/search', {
    params: { blood_group: bloodGroup, location },
  });
  return res.data;
};

export default api;

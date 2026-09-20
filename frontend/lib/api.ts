// ============================================================
// API types and functions for AI CRM Agent frontend
// ============================================================

export interface AiAnalysis {
  is_spam: boolean;
  score: number;
  priority: string;
  reason: string;
  intent: string;
  should_contact: boolean;
  response: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  message: string;
  ai_score?: number | null;
  priority?: string | null;
  is_spam?: boolean | null;
  should_contact?: boolean | null;
  intent?: string | null;
  contact_status?: string | null;
  email_sent?: boolean | null;
  ai_response?: string | null;
  ai_analysis?: AiAnalysis | null;
  created_at?: string;
}

export type ContactStatus = 'pending' | 'qualified' | 'contacted' | 'rejected';
export type Priority = 'high' | 'medium' | 'low';

export interface LeadsResponse {
  count: number;
  leads: Lead[];
}

export interface UpdateStatusResponse {
  success: boolean;
  message: string;
  lead?: Lead;
}



const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

// ------ Fetch all leads ------
// NOTE: Always routes through FastAPI backend (service role key).
// Direct frontend→Supabase queries are intentionally removed — RLS blocks the anon key.
export async function fetchLeads(): Promise<LeadsResponse> {
  try {
    const res = await fetch(`${API_BASE}/leads`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`GET /leads failed: ${res.status}`);
    }
    return (await res.json()) as LeadsResponse;
  } catch (err) {
    console.error('fetchLeads error:', err);
    return { count: 0, leads: [] };
  }
}

// ------ Fetch single lead ------
export async function fetchLeadById(leadId: string): Promise<Lead> {
  const res = await fetch(`${API_BASE}/leads/${leadId}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`GET /leads/${leadId} failed: ${res.status}`);
  }
  const data = (await res.json()) as { lead: Lead };
  return data.lead;
}

// ------ Update lead details ------
export async function updateLead(leadId: string, payload: Partial<Lead>): Promise<Lead> {
  const res = await fetch(`${API_BASE}/leads/${leadId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`PUT /leads/${leadId} failed: ${res.status}`);
  }
  const data = (await res.json()) as { success: boolean; lead: Lead };
  return data.lead;
}

// ------ Delete single lead ------
export async function deleteLead(leadId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/leads/${leadId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`DELETE /leads/${leadId} failed: ${res.status}`);
  }
  return res.json();
}

// ------ Batch delete leads ------
export async function batchDeleteLeads(
  leadIds: string[]
): Promise<{ success: boolean; message: string; deleted_count: number }> {
  const res = await fetch(`${API_BASE}/leads/batch-delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lead_ids: leadIds }),
  });
  if (!res.ok) {
    throw new Error(`POST /leads/batch-delete failed: ${res.status}`);
  }
  return res.json();
}

// ------ Update lead contact status ------
export async function updateLeadStatus(
  leadId: string,
  status: ContactStatus
): Promise<UpdateStatusResponse> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contact_status: status }),
  });
  if (!res.ok) {
    throw new Error(`PATCH /leads/${leadId}/status failed: ${res.status}`);
  }
  return res.json() as Promise<UpdateStatusResponse>;
}

// ------ Manually re-qualify a lead ------
export async function requalifyLead(leadId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/qualify`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`POST /leads/${leadId}/qualify failed: ${res.status}`);
  }
}

// ------ Create and qualify lead ------
export interface CreateLeadPayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
}

export interface CreateLeadResponse {
  message: string;
  success: boolean;
  lead_id?: string;
  ai_result?: AiAnalysis;
  email_sent?: boolean;
  error?: string;
}

export async function createLead(payload: CreateLeadPayload): Promise<CreateLeadResponse> {
  const res = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as { detail?: string; message?: string };
    throw new Error(errorData.detail || errorData.message || `Failed to submit lead: ${res.status}`);
  }
  return res.json() as Promise<CreateLeadResponse>;
}

// ------ Admin Authentication ------
export interface AdminUser {
  email: string;
  role: string;
  name: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AdminUser;
}

export async function loginAdmin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as { detail?: string; message?: string };
    throw new Error(errorData.detail || errorData.message || 'Invalid admin credentials');
  }
  return res.json() as Promise<LoginResponse>;
}

// ------ Batch update lead status ------
export async function batchUpdateLeadStatus(
  leadIds: string[],
  status: ContactStatus
): Promise<{ success: boolean; message: string; updated_count: number }> {
  const res = await fetch(`${API_BASE}/leads/batch-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lead_ids: leadIds, contact_status: status }),
  });
  if (!res.ok) {
    throw new Error(`POST /leads/batch-status failed: ${res.status}`);
  }
  return res.json();
}

// ------ Export leads to CSV ------
export async function exportLeadsCsv(): Promise<Blob> {
  const res = await fetch(`${API_BASE}/leads/export`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`GET /leads/export failed: ${res.status}`);
  }
  return res.blob();
}

// ------ Test SMTP connection ------
export async function testSmtpConnection(
  targetEmail: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/test-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_email: targetEmail }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail || `Test email failed with status ${res.status}`);
  }
  return res.json();
}

// ------ Backend health ping ------
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

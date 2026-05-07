const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

// ── Fetch helper ──────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const isFormData = options.body instanceof FormData;
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: isFormData
        ? { ...(options.headers ?? {}) }
        : { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    });
    const data = await response.json();
    if (!response.ok) return { error: data.error || 'Request failed' };
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type EmailStatus = 'new' | 'processing' | 'ready' | 'sent' | 'error';

export interface ExtractedInfo {
  id: string;
  emailId: string;
  parentName?: string | null;
  parentEmail?: string | null;
  cursus?: string | null;
  childName?: string | null;
  childAge?: string | null;
  detectedLanguage?: 'en' | 'fr' | null;
  detectedCampus?: string | null;
  sectionCode?: string | null;
  createdAt: string;
}

export interface Director {
  id: string;
  name: string;
  email: string;
  schoolName: string;
  location: string;   // bangkok | hanoi | phnomPenh
  section: string;    // french | international | both
  signatureEn?: string | null;
  signatureFr?: string | null;
}

export const LOCATION_OPTIONS = [
  { value: 'bangkok',   label: 'Bangkok' },
  { value: 'hanoi',     label: 'Hanoi' },
  { value: 'phnomPenh', label: 'Phnom Penh' },
];

export const SECTION_OPTIONS = [
  { value: 'french',        label: 'French Section' },
  { value: 'international', label: 'International Section' },
  { value: 'both',          label: 'Both sections' },
];

export interface EmailDraft {
  id: string;
  emailId: string;
  directorCampusCode: string;
  director: Director;
  draftText: string;
  createdAt: string;
  editedAt?: string | null;
  sentAt?: string | null;
}

export interface IncomingEmail {
  id: string;
  fromAddress: string;
  toAddress: string;
  subject: string;
  rawText: string;
  receivedAt: string;
  status: EmailStatus;
  errorMessage?: string | null;
  extractedInfo?: ExtractedInfo | null;
  draft?: EmailDraft | null;
}

export interface Section {
  code: string;
  nameEn: string;
  ageRangeEn: string;
  nameFr: string;
  ageRangeFr: string;
}

export interface Template {
  id: string;
  campus: string;
  part: string;
  textEn: string;
  textFr: string;
}

export interface Document {
  id: string;
  name: string;
  campus?: string | null;
  fileKey: string;
  fileName: string;
  contentType: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface AllowedEmail {
  id: string;
  email: string;
  role: 'root' | 'normal';
  addedBy: string;
  createdAt: string;
}

// ── Email API ─────────────────────────────────────────────────────────────────

export async function getEmails(params?: {
  status?: string;
  campus?: string;
  lang?: string;
  limit?: number;
  offset?: number;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.campus) q.set('campus', params.campus);
  if (params?.lang)   q.set('lang',   params.lang);
  if (params?.limit)  q.set('limit',  String(params.limit));
  if (params?.offset) q.set('offset', String(params.offset));
  const qs = q.toString() ? `?${q}` : '';
  return fetchApi<PaginatedResponse<IncomingEmail>>(`/emails${qs}`);
}

export async function getEmail(id: string) {
  return fetchApi<IncomingEmail>(`/emails/${id}`);
}

export async function updateDraft(id: string, draftText: string) {
  return fetchApi<EmailDraft>(`/emails/${id}/draft`, {
    method: 'PUT',
    body: JSON.stringify({ draftText }),
  });
}

export async function sendToDirector(id: string) {
  return fetchApi<{ success: boolean }>(`/emails/${id}/send`, { method: 'POST' });
}

export async function regenerateDraft(id: string) {
  return fetchApi<{ success: boolean }>(`/emails/${id}/regenerate`, { method: 'POST' });
}

// ── Config API ────────────────────────────────────────────────────────────────

export async function getDirectors() {
  return fetchApi<Director[]>('/config/directors');
}

export async function createDirector(data: Omit<Director, 'id'>) {
  return fetchApi<Director>('/config/directors', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDirector(id: string, data: Partial<Omit<Director, 'id'>>) {
  return fetchApi<Director>(`/config/directors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteDirector(id: string) {
  return fetchApi<{ success: boolean }>(`/config/directors/${id}`, { method: 'DELETE' });
}

export async function getSections() {
  return fetchApi<Section[]>('/config/sections');
}

export async function getTemplates(campus?: string) {
  const qs = campus ? `?campus=${campus}` : '';
  return fetchApi<Template[]>(`/config/templates${qs}`);
}

export async function createTemplate(data: { campus: string; part: string; textEn: string; textFr: string }) {
  return fetchApi<Template>('/config/templates', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTemplate(id: string, data: { textEn?: string; textFr?: string }) {
  return fetchApi<Template>(`/config/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTemplate(id: string) {
  return fetchApi<{ success: boolean }>(`/config/templates/${id}`, { method: 'DELETE' });
}

export async function getDocuments(campus?: string) {
  const qs = campus ? `?campus=${campus}` : '';
  return fetchApi<Document[]>(`/config/documents${qs}`);
}

export async function uploadDocument(file: File, name: string, campus?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  if (campus) formData.append('campus', campus);
  return fetchApi<Document>('/config/documents', { method: 'POST', body: formData });
}

export async function deleteDocument(id: string) {
  return fetchApi<{ success: boolean }>(`/config/documents/${id}`, { method: 'DELETE' });
}

export function getDocumentDownloadUrl(id: string) {
  return `${API_BASE}/config/documents/${id}/download`;
}

// ── Admin API ─────────────────────────────────────────────────────────────────

const ROOT_USERS = ['galianmanon@gmail.com', 'christophe.galian@gmail.com'];

export function isRootUser(email: string): boolean {
  return ROOT_USERS.includes(email.toLowerCase());
}

export async function getAllowedEmails() {
  return fetchApi<{ allowedEmails: AllowedEmail[] }>('/admin/allowed-emails');
}

export async function addAllowedEmail(email: string, role: 'root' | 'normal') {
  return fetchApi<{ success: boolean }>('/admin/allowed-emails', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
}

export async function removeAllowedEmail(id: string) {
  return fetchApi<{ success: boolean }>(`/admin/allowed-emails/${id}`, { method: 'DELETE' });
}

// ── Label helpers ─────────────────────────────────────────────────────────────

export const CAMPUS_LABELS: Record<string, string> = {
  SATHORN: 'Sathorn',
  SUKHUMVIT: 'Sukhumvit',
  HANOI_TAYHO: 'Hanoi – Tay Ho',
  HANOI_LONGBIEN: 'Hanoi – Long Bien',
  PHNOM_PENH: 'Phnom Penh',
  BANGKOK_UNSPECIFIED: 'Bangkok',
  HANOI_UNSPECIFIED: 'Hanoi',
  UNKNOWN: 'Unknown',
};

export const CAMPUS_REGION_LABEL: Record<string, string> = {
  bangkok: 'Bangkok',
  hanoi: 'Hanoi',
  phnomPenh: 'Phnom Penh',
};

export const PART_LABELS: Record<string, string> = {
  greeting: 'Greeting',
  childWelcome: 'Child Welcome',
  programDescription: 'Program Description',
  internationalOption: 'International Option',
  locationChoice: 'Location Choice',
  sathornDescription: 'Sathorn Description',
  sukhumvitDescription: 'Sukhumvit Description',
  visitOffer: 'Visit Offer',
  relocatingOption: 'Relocating Option',
  attachments: 'Attachments Note',
  closing: 'Closing',
  aefeHighlight: 'AEFE Highlight',
  under18Months: 'Under 18 Months',
};

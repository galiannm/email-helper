import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, Inbox as InboxIcon, Clock } from 'lucide-react';
import { getEmails, IncomingEmail, EmailStatus } from '../lib/api';
import { StatusBadge, CampusBadge, LangBadge } from '../components/StatusBadge';

async function getPollStatus() {
  try {
    const r = await fetch('/api/poll/status', { credentials: 'include' });
    if (!r.ok) return null;
    return r.json() as Promise<{ status: string; processed: number; updatedAt: string | null }>;
  } catch { return null; }
}

function timeAgo(iso: string | null) {
  if (!iso) return 'never';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'processing', label: 'Processing' },
  { value: 'ready', label: 'Ready' },
  { value: 'sent', label: 'Sent' },
  { value: 'error', label: 'Error' },
];

const CAMPUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All campuses' },
  { value: 'SATHORN', label: 'Sathorn' },
  { value: 'SUKHUMVIT', label: 'Sukhumvit' },
  { value: 'HANOI_TAYHO', label: 'Hanoi – Tay Ho' },
  { value: 'HANOI_LONGBIEN', label: 'Hanoi – Long Bien' },
  { value: 'PHNOM_PENH', label: 'Phnom Penh' },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function InboxPage() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState<IncomingEmail[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [campusFilter, setCampusFilter] = useState('');
  const [pollStatus, setPollStatus] = useState<{ status: string; updatedAt: string | null } | null>(null);

  useEffect(() => {
    getPollStatus().then(s => { if (s) setPollStatus(s); });
  }, []);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    const res = await getEmails({
      status: statusFilter || undefined,
      campus: campusFilter || undefined,
      limit: 50,
    });
    if (res.data) { setEmails(res.data.items); setTotal(res.data.total); }
    setLoading(false);
    setRefreshing(false);
  }, [statusFilter, campusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-mali text-gray-900">Inbox</h1>
          <p className="mt-1 text-sm text-gray-500">{total} email{total !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-3">
          {pollStatus && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              Polled {timeAgo(pollStatus.updatedAt)}
              {pollStatus.status === 'error' && <span className="text-red-400">(error)</span>}
            </span>
          )}
          <button onClick={() => load(true)} disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${statusFilter === f.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <select value={campusFilter} onChange={e => setCampusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-acacia-400 focus:border-acacia-400">
          {CAMPUS_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 text-acacia-400 animate-spin" />
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <InboxIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No emails yet</p>
          <p className="text-sm mt-1">Emails sent to contact@acacia-education.com will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
          {emails.map(email => (
            <button key={email.id} onClick={() => navigate(`/emails/${email.id}`)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm truncate">{email.fromAddress}</span>
                    <StatusBadge status={email.status as EmailStatus} />
                    {email.extractedInfo?.detectedCampus && (
                      <CampusBadge campus={email.extractedInfo.detectedCampus} />
                    )}
                    {email.extractedInfo?.detectedLanguage && (
                      <LangBadge lang={email.extractedInfo.detectedLanguage} />
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5 truncate">{email.subject || '(no subject)'}</p>
                  {email.extractedInfo?.parentName && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {email.extractedInfo.parentName}
                      {email.extractedInfo.childName ? ` · Child: ${email.extractedInfo.childName}` : ''}
                      {email.extractedInfo.childAge ? ` (${email.extractedInfo.childAge})` : ''}
                    </p>
                  )}
                  {email.status === 'error' && email.errorMessage && (
                    <p className="text-xs text-red-500 mt-0.5 truncate">{email.errorMessage}</p>
                  )}
                </div>
                <time className="text-xs text-gray-400 shrink-0">{formatDate(email.receivedAt)}</time>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

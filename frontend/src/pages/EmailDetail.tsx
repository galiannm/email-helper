import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, RefreshCw, Loader2, CheckCircle, AlertCircle, User, MapPin, Globe, Mail, BookOpen } from 'lucide-react';
import { getEmail, updateDraft, sendToDirector, regenerateDraft, IncomingEmail, EmailStatus } from '../lib/api';
import { StatusBadge, CampusBadge, LangBadge } from '../components/StatusBadge';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function applyDates(text: string, d1: string, d2: string, d3: string) {
  return text
    .replace('[DATE 1]', d1 || '[DATE 1]')
    .replace('[DATE 2]', d2 || '[DATE 2]')
    .replace('[DATE 3]', d3 || '[DATE 3]');
}

export function EmailDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState<IncomingEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [draftText, setDraftText] = useState('');
  const [date1, setDate1] = useState('');
  const [date2, setDate2] = useState('');
  const [date3, setDate3] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [sendError, setSendError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const res = await getEmail(id);
    if (res.data) {
      setEmail(res.data);
      setDraftText(res.data.draft?.draftText ?? '');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSaveDraft = async () => {
    if (!id) return;
    setSaving(true);
    setSaveMsg('');
    const final = applyDates(draftText, date1, date2, date3);
    const res = await updateDraft(id, final);
    if (!res.error) { setDraftText(final); setSaveMsg('Saved'); setTimeout(() => setSaveMsg(''), 2000); }
    setSaving(false);
  };

  const handleSend = async () => {
    if (!id) return;
    setSendError('');
    // Auto-save first if dates are set
    const final = applyDates(draftText, date1, date2, date3);
    if (final !== draftText) await updateDraft(id, final);
    setSending(true);
    const res = await sendToDirector(id);
    if (res.error) { setSendError(res.error); setSending(false); return; }
    await load();
    setSending(false);
  };

  const handleRegenerate = async () => {
    if (!id) return;
    setRegenerating(true);
    await regenerateDraft(id);
    // Poll until status changes from 'processing'
    let attempts = 0;
    const poll = setInterval(async () => {
      const res = await getEmail(id);
      if (res.data && res.data.status !== 'processing') {
        clearInterval(poll);
        setEmail(res.data);
        setDraftText(res.data.draft?.draftText ?? '');
        setRegenerating(false);
      }
      if (++attempts > 30) { clearInterval(poll); setRegenerating(false); }
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 text-acacia-400 animate-spin" />
      </div>
    );
  }

  if (!email) {
    return <div className="text-center py-16 text-gray-500">Email not found.</div>;
  }

  const draft = email.draft;
  const info = email.extractedInfo;
  const isSent = !!draft?.sentAt;
  const isProcessing = email.status === 'processing' || regenerating;

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to inbox
      </button>

      {/* Subject + meta */}
      <div className="mb-6">
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-gray-900 flex-1">{email.subject || '(no subject)'}</h1>
          <StatusBadge status={email.status as EmailStatus} />
          {info?.detectedCampus && <CampusBadge campus={info.detectedCampus} />}
          {info?.detectedLanguage && <LangBadge lang={info.detectedLanguage} />}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          From <span className="font-medium text-gray-700">{email.fromAddress}</span>
          {' · '}{formatDate(email.receivedAt)}
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Original email */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Original Message</h2>
          </div>
          <div className="flex-1 p-4 overflow-auto max-h-[60vh]">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {email.rawText}
            </pre>
          </div>
        </div>

        {/* Right: Draft + controls */}
        <div className="flex flex-col gap-4">
          {/* Extracted info card */}
          {info && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Extracted Info</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {info.parentName && (
                  <><dt className="text-gray-400 flex items-center gap-1"><User className="h-3 w-3" /> Parent</dt>
                  <dd className="text-gray-800 font-medium">{info.parentName}</dd></>
                )}
                {info.parentEmail && (
                  <><dt className="text-gray-400 flex items-center gap-1"><Mail className="h-3 w-3" /> Email</dt>
                  <dd className="text-gray-800 truncate">{info.parentEmail}</dd></>
                )}
                {info.cursus && (
                  <><dt className="text-gray-400 flex items-center gap-1"><BookOpen className="h-3 w-3" /> Cursus</dt>
                  <dd className="text-gray-800">{info.cursus}</dd></>
                )}
                {info.childName && (
                  <><dt className="text-gray-400">Child</dt>
                  <dd className="text-gray-800 font-medium">{info.childName} {info.childAge ? `(${info.childAge})` : ''}</dd></>
                )}
                {info.sectionCode && (
                  <><dt className="text-gray-400">Section</dt>
                  <dd className="text-gray-800 font-medium">{info.sectionCode}</dd></>
                )}
                {info.detectedCampus && (
                  <><dt className="text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> Campus</dt>
                  <dd><CampusBadge campus={info.detectedCampus} /></dd></>
                )}
                {info.detectedLanguage && (
                  <><dt className="text-gray-400 flex items-center gap-1"><Globe className="h-3 w-3" /> Language</dt>
                  <dd><LangBadge lang={info.detectedLanguage} /></dd></>
                )}
              </dl>
            </div>
          )}

          {/* Director card */}
          {draft?.director && (
            <div className="bg-acacia-blue-highlight rounded-lg border border-acacia-blue-text/20 p-4">
              <h2 className="text-sm font-semibold text-acacia-blue-text mb-1">Draft will be sent to</h2>
              <p className="font-medium text-gray-900">{draft.director.name}</p>
              <p className="text-sm text-gray-600">{draft.director.schoolName}</p>
              <p className="text-sm text-gray-500">{draft.director.email}</p>
            </div>
          )}

          {/* Date slots */}
          {draft && !isSent && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Visit slots (optional)</h2>
              <p className="text-xs text-gray-400 mb-3">Fill in to replace [DATE 1], [DATE 2], [DATE 3] in the draft.</p>
              <div className="space-y-2">
                {[
                  { label: 'Date 1', value: date1, set: setDate1 },
                  { label: 'Date 2', value: date2, set: setDate2 },
                  { label: 'Date 3', value: date3, set: setDate3 },
                ].map(({ label, value, set }) => (
                  <div key={label} className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 w-12 shrink-0">{label}</label>
                    <input type="text" value={value} onChange={e => set(e.target.value)}
                      placeholder="e.g. Monday 12th at 10am"
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-acacia-400 focus:border-acacia-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Draft textarea */}
          {isProcessing ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 flex flex-col items-center gap-3 text-gray-500">
              <Loader2 className="h-6 w-6 text-acacia-400 animate-spin" />
              <p className="text-sm">Generating draft…</p>
            </div>
          ) : draft ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">Draft Reply</h2>
                {isSent && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" /> Sent {draft.sentAt ? formatDate(draft.sentAt) : ''}
                  </span>
                )}
              </div>
              <textarea
                value={draftText}
                onChange={e => setDraftText(e.target.value)}
                disabled={isSent}
                rows={18}
                className="flex-1 p-4 text-sm font-mono text-gray-800 resize-none focus:outline-none rounded-b-lg disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          ) : email.status === 'error' ? (
            <div className="bg-acacia-red-highlight rounded-lg border border-acacia-red-text/20 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-acacia-red-text mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-acacia-red-text">Processing failed</p>
                  {email.errorMessage && <p className="text-xs text-gray-600 mt-1">{email.errorMessage}</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
              No draft generated yet.
            </div>
          )}

          {/* Action buttons */}
          {!isProcessing && (
            <div className="flex gap-3 flex-wrap">
              {draft && !isSent && (
                <>
                  <button onClick={handleSaveDraft} disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {saveMsg || 'Save draft'}
                  </button>
                  <button onClick={handleSend} disabled={sending}
                    className="px-4 py-2 text-sm font-medium text-white bg-acacia-400 hover:bg-acacia-500 rounded-lg disabled:opacity-50 flex items-center gap-2">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send to director
                  </button>
                </>
              )}
              <button onClick={handleRegenerate} disabled={regenerating || isSent}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </button>
            </div>
          )}

          {sendError && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />{sendError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Loader2, Save, Trash2, Upload, FileText, Check, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import {
  getDirectors, createDirector, updateDirector, deleteDirector,
  getTemplates, createTemplate, updateTemplate, deleteTemplate,
  getDocuments, uploadDocument, deleteDocument, getDocumentDownloadUrl,
  Director, Template, Document,
  CAMPUS_REGION_LABEL, PART_LABELS, LOCATION_OPTIONS, SECTION_OPTIONS,
} from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { isRootUser } from '../lib/api';

type Tab = 'templates' | 'directors' | 'documents';

export function ConfigPage() {
  const [tab, setTab] = useState<Tab>('templates');
  const { user } = useAuth();
  const isRoot = user ? isRootUser(user.email) : false;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'templates', label: 'Templates' },
    { id: 'directors', label: 'Directors' },
    { id: 'documents', label: 'Documents' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold font-mali text-gray-900 mb-6">Configuration</h1>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1 -mb-px">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-acacia-400 text-acacia-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      {tab === 'templates' && <TemplatesTab isRoot={isRoot} />}
      {tab === 'directors' && <DirectorsTab isRoot={isRoot} />}
      {tab === 'documents' && <DocumentsTab isRoot={isRoot} />}
    </div>
  );
}

// ── Templates tab ─────────────────────────────────────────────────────────────

function TemplatesTab({ isRoot }: { isRoot: boolean }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCampus, setExpandedCampus] = useState<string | null>('bangkok');
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ campus: 'bangkok', part: '', textEn: '', textFr: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getTemplates().then(r => { if (r.data) setTemplates(r.data); setLoading(false); });
  }, []);

  const byCampus = templates.reduce<Record<string, Template[]>>((acc, t) => {
    (acc[t.campus] ??= []).push(t);
    return acc;
  }, {});

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newForm.part.trim()) return;
    setCreating(true);
    const res = await createTemplate(newForm);
    if (res.data) {
      setTemplates(prev => [...prev, res.data!]);
      setNewForm({ campus: 'bangkok', part: '', textEn: '', textFr: '' });
      setShowNew(false);
    }
    setCreating(false);
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 text-acacia-400 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {isRoot && (
        <div className="flex justify-end">
          <button onClick={() => setShowNew(!showNew)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-acacia-400 hover:bg-acacia-500 rounded-lg">
            <Plus className="h-4 w-4" /> Add template
          </button>
        </div>
      )}

      {showNew && isRoot && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-acacia-400/30 shadow-sm p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">New template part</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Campus</label>
              <select value={newForm.campus} onChange={e => setNewForm(p => ({ ...p, campus: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-acacia-400">
                {(['bangkok', 'hanoi', 'phnomPenh'] as const).map(c => (
                  <option key={c} value={c}>{CAMPUS_REGION_LABEL[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Part name (e.g. greeting)</label>
              <input type="text" value={newForm.part} onChange={e => setNewForm(p => ({ ...p, part: e.target.value }))}
                placeholder="part identifier" required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-acacia-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">English</label>
              <textarea value={newForm.textEn} onChange={e => setNewForm(p => ({ ...p, textEn: e.target.value }))} rows={3} required
                className="w-full text-sm border border-gray-200 rounded-md p-2 resize-y focus:ring-2 focus:ring-acacia-400 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">French</label>
              <textarea value={newForm.textFr} onChange={e => setNewForm(p => ({ ...p, textFr: e.target.value }))} rows={3} required
                className="w-full text-sm border border-gray-200 rounded-md p-2 resize-y focus:ring-2 focus:ring-acacia-400 font-mono" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowNew(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" disabled={creating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-acacia-400 hover:bg-acacia-500 rounded-md disabled:opacity-50">
              {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Create
            </button>
          </div>
        </form>
      )}

      {(['bangkok', 'hanoi', 'phnomPenh'] as const).map(campus => (
        <div key={campus} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <button onClick={() => setExpandedCampus(expandedCampus === campus ? null : campus)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50">
            <h2 className="font-semibold text-gray-900">{CAMPUS_REGION_LABEL[campus] ?? campus}</h2>
            {expandedCampus === campus ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>
          {expandedCampus === campus && (
            <div className="divide-y divide-gray-100">
              {(byCampus[campus] ?? []).map(t => (
                <TemplateRow key={t.id} template={t} isRoot={isRoot}
                  onSave={updated => setTemplates(prev => prev.map(x => x.id === updated.id ? updated : x))}
                  onDelete={id => setTemplates(prev => prev.filter(x => x.id !== id))} />
              ))}
              {(byCampus[campus] ?? []).length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400">No templates for this campus yet.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TemplateRow({ template, isRoot, onSave, onDelete }: {
  template: Template; isRoot: boolean;
  onSave: (t: Template) => void; onDelete: (id: string) => void;
}) {
  const [textEn, setTextEn] = useState(template.textEn);
  const [textFr, setTextFr] = useState(template.textFr);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isDirty = textEn !== template.textEn || textFr !== template.textFr;

  async function handleSave() {
    setSaving(true);
    const res = await updateTemplate(template.id, { textEn, textFr });
    if (res.data) { onSave(res.data); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${template.part}" template?`)) return;
    setDeleting(true);
    await deleteTemplate(template.id);
    onDelete(template.id);
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">{PART_LABELS[template.part] ?? template.part}</h3>
        {isRoot && (
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!isDirty || saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-acacia-400 hover:bg-acacia-500 rounded-md disabled:opacity-40">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : saved ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
              {saved ? 'Saved' : 'Save'}
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md disabled:opacity-40">
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[{ lang: 'English', val: textEn, set: setTextEn }, { lang: 'French', val: textFr, set: setTextFr }].map(({ lang, val, set }) => (
          <div key={lang}>
            <label className="block text-xs font-medium text-gray-500 mb-1">{lang}</label>
            <textarea value={val} onChange={e => set(e.target.value)} disabled={!isRoot} rows={4}
              className="w-full text-sm border border-gray-200 rounded-md p-2 resize-y focus:ring-2 focus:ring-acacia-400 focus:border-acacia-400 disabled:bg-gray-50 disabled:text-gray-600 font-mono" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Directors tab ─────────────────────────────────────────────────────────────

const emptyDirector = { name: '', email: '', schoolName: '', location: 'bangkok', section: 'both', signatureEn: '', signatureFr: '' };

function DirectorsTab({ isRoot }: { isRoot: boolean }) {
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ ...emptyDirector });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getDirectors().then(r => { if (r.data) setDirectors(r.data); setLoading(false); });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await createDirector(newForm);
    if (res.data) { setDirectors(prev => [...prev, res.data!]); setNewForm({ ...emptyDirector }); setShowNew(false); }
    setCreating(false);
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 text-acacia-400 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {isRoot && (
        <div className="flex justify-end">
          <button onClick={() => setShowNew(!showNew)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-acacia-400 hover:bg-acacia-500 rounded-lg">
            <Plus className="h-4 w-4" /> Add director
          </button>
        </div>
      )}

      {showNew && isRoot && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-acacia-400/30 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">New director</h3>
            <button type="button" onClick={() => setShowNew(false)}><X className="h-4 w-4 text-gray-400" /></button>
          </div>
          <DirectorFields form={newForm} setForm={f => setNewForm(f as typeof newForm)} />
          <div className="flex justify-end">
            <button type="submit" disabled={creating}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-acacia-400 hover:bg-acacia-500 rounded-lg disabled:opacity-50">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create director
            </button>
          </div>
        </form>
      )}

      {directors.map(d => (
        <DirectorRow key={d.id} director={d} isRoot={isRoot}
          onSave={updated => setDirectors(prev => prev.map(x => x.id === updated.id ? updated : x))}
          onDelete={id => setDirectors(prev => prev.filter(x => x.id !== id))} />
      ))}
    </div>
  );
}

function DirectorFields({ form, setForm }: { form: Record<string, string>; setForm: (f: Record<string, string>) => void }) {
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
          <input type="text" value={form.name} onChange={set('name')} required
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-acacia-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
          <input type="email" value={form.email} onChange={set('email')} required
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-acacia-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">School name</label>
          <input type="text" value={form.schoolName} onChange={set('schoolName')} required
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-acacia-400" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
          <select value={form.location} onChange={set('location')}
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-acacia-400">
            {LOCATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
          <select value={form.section} onChange={set('section')}
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-acacia-400">
            {SECTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[{ k: 'signatureEn', label: 'Signature (EN)' }, { k: 'signatureFr', label: 'Signature (FR)' }].map(({ k, label }) => (
          <div key={k}>
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <textarea value={form[k]} onChange={set(k)} rows={3}
              className="w-full text-sm border border-gray-200 rounded-md p-2 resize-y focus:ring-2 focus:ring-acacia-400 font-mono" />
          </div>
        ))}
      </div>
    </>
  );
}

function DirectorRow({ director, isRoot, onSave, onDelete }: {
  director: Director; isRoot: boolean;
  onSave: (d: Director) => void; onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    name: director.name, email: director.email, schoolName: director.schoolName,
    location: director.location, section: director.section,
    signatureEn: director.signatureEn ?? '', signatureFr: director.signatureFr ?? '',
  });
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await updateDirector(director.id, form);
    if (res.data) { onSave(res.data); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete director ${director.name}?`)) return;
    setDeleting(true);
    await deleteDirector(director.id);
    onDelete(director.id);
  }

  const sectionLabel = SECTION_OPTIONS.find(o => o.value === director.section)?.label ?? director.section;
  const locationLabel = LOCATION_OPTIONS.find(o => o.value === director.location)?.label ?? director.location;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-medium text-gray-900">{director.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-acacia-orange-highlight text-acacia-orange-text">{locationLabel}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-acacia-blue-highlight text-acacia-blue-text">{sectionLabel}</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          <DirectorFields form={form} setForm={setForm} />
          {isRoot && (
            <div className="mt-4 flex items-center justify-between">
              <button onClick={handleDelete} disabled={deleting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
              </button>
              <button onClick={handleSave} disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-acacia-400 hover:bg-acacia-500 rounded-lg disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? 'Saved' : 'Save changes'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Documents tab ─────────────────────────────────────────────────────────────

const CAMPUS_OPTIONS = [
  { value: '', label: 'All campuses' },
  { value: 'bangkok', label: 'Bangkok' },
  { value: 'hanoi', label: 'Hanoi' },
  { value: 'phnomPenh', label: 'Phnom Penh' },
];

function DocumentsTab({ isRoot }: { isRoot: boolean }) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCampus, setUploadCampus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    setLoading(true);
    const res = await getDocuments();
    if (res.data) setDocs(res.data);
    setLoading(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !uploadName.trim()) return;
    setUploading(true);
    setUploadError('');
    const res = await uploadDocument(file, uploadName.trim(), uploadCampus || undefined);
    if (res.error) setUploadError(res.error);
    else { setUploadName(''); setUploadCampus(''); if (fileRef.current) fileRef.current.value = ''; await loadDocs(); }
    setUploading(false);
  }

  async function handleDelete(id: string) {
    setRemovingId(id);
    await deleteDocument(id);
    setDocs(prev => prev.filter(d => d.id !== id));
    setRemovingId(null);
  }

  return (
    <div className="space-y-6">
      {isRoot && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Upload document</h2>
          <form onSubmit={handleUpload} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Display name</label>
                <input type="text" value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="e.g. Brochure Bangkok" required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-acacia-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Campus (optional)</label>
                <select value={uploadCampus} onChange={e => setUploadCampus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-acacia-400">
                  {CAMPUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">File</label>
                <input type="file" ref={fileRef} required
                  className="w-full text-sm text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-acacia-400 file:text-white hover:file:bg-acacia-500" />
              </div>
            </div>
            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
            <button type="submit" disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-acacia-400 hover:bg-acacia-500 rounded-lg disabled:opacity-50">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 text-acacia-400 animate-spin" /></div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No documents uploaded yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {docs.map(doc => (
              <li key={doc.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-400">{doc.fileName} · {doc.campus ? CAMPUS_REGION_LABEL[doc.campus] ?? doc.campus : 'All campuses'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <a href={getDocumentDownloadUrl(doc.id)} target="_blank" rel="noreferrer" className="text-xs text-acacia-blue-text hover:underline">View</a>
                  {isRoot && (
                    <button onClick={() => handleDelete(doc.id)} disabled={removingId === doc.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md disabled:opacity-40">
                      {removingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

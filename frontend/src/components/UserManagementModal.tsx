import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, ShieldCheck, User } from 'lucide-react';
import { getAllowedEmails, addAllowedEmail, removeAllowedEmail, AllowedEmail } from '../lib/api';

export function UserManagementModal({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<AllowedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'normal' | 'root'>('normal');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await getAllowedEmails();
    if (res.error) setError(res.error);
    else setEntries(res.data?.allowedEmails ?? []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setAdding(true);
    setError(null);
    const res = await addAllowedEmail(newEmail.trim(), newRole);
    if (res.error) setError(res.error);
    else { setNewEmail(''); setNewRole('normal'); await load(); }
    setAdding(false);
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    await removeAllowedEmail(id);
    setEntries(prev => prev.filter(e => e.id !== id));
    setRemovingId(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">User Access Management</h2>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="px-6 py-4 border-b border-gray-100 space-y-3">
          <p className="text-sm text-gray-500">Add an email address to grant access to this platform.</p>
          <div className="flex gap-2">
            <input
              type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
              placeholder="email@example.com" required
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-acacia-400"
            />
            <select value={newRole} onChange={e => setNewRole(e.target.value as 'normal' | 'root')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-acacia-400">
              <option value="normal">Normal</option>
              <option value="root">Root</option>
            </select>
            <button type="submit" disabled={adding}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-acacia-400 hover:bg-acacia-500 rounded-md disabled:opacity-50">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 text-acacia-400 animate-spin" /></div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No users in the allowlist yet.</p>
          ) : (
            <ul className="space-y-2">
              {entries.map(entry => (
                <li key={entry.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-gray-50">
                  <div className="flex items-center gap-2 min-w-0">
                    {entry.role === 'root'
                      ? <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0" />
                      : <User className="h-4 w-4 text-gray-400 shrink-0" />}
                    <span className="text-sm text-gray-800 truncate">{entry.email}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${entry.role === 'root' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'}`}>
                      {entry.role}
                    </span>
                  </div>
                  <button onClick={() => handleRemove(entry.id)} disabled={removingId === entry.id}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 shrink-0 ml-2">
                    {removingId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

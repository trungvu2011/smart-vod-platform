import { useState, useEffect, useRef } from 'react';

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (data: { user: any; defaultPassword: string }) => void;
  onSubmit: (data: { fullName: string; role: string; department: string; title: string }) => Promise<any>;
}

export default function CreateUserModal({ open, onClose, onCreated, onSubmit }: CreateUserModalProps) {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('USER');
  const [department, setDepartment] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setFullName(''); setRole('USER');
      setDepartment(''); setTitle(''); setError('');
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await onSubmit({ fullName, role, department, title });
      onCreated(result);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-wp-surface-container rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 animate-scale-up">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-wp-primary">person_add</span>
          <h3 className="text-xl font-bold text-wp-on-surface">Add New Member</h3>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-wp-on-surface-variant/50 block mb-1">Full Name *</label>
            <input
              type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Nguyen Van A"
              className="w-full bg-wp-surface-lowest border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-wp-primary/20 text-wp-on-surface placeholder:text-wp-outline"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-wp-on-surface-variant/50 block mb-1">Role</label>
              <select
                value={role} onChange={e => setRole(e.target.value)}
                className="w-full bg-wp-surface-lowest border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-wp-primary/20 text-wp-on-surface"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-wp-on-surface-variant/50 block mb-1">Department</label>
              <input
                type="text" value={department} onChange={e => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
                className="w-full bg-wp-surface-lowest border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-wp-primary/20 text-wp-on-surface placeholder:text-wp-outline"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-wp-on-surface-variant/50 block mb-1">Job Title</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Software Engineer"
              className="w-full bg-wp-surface-lowest border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-wp-primary/20 text-wp-on-surface placeholder:text-wp-outline"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-wp-on-surface-variant bg-wp-surface-container-high hover:bg-wp-surface-bright transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-br from-wp-primary to-wp-primary-container text-wp-on-primary shadow-xl shadow-wp-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import type { User } from '../../types';

interface EditUserModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
  onSubmit: (id: string, data: { fullName?: string; department?: string; title?: string; role?: string }) => Promise<any>;
}

export default function EditUserModal({ open, user, onClose, onSaved, onSubmit }: EditUserModalProps) {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('USER');
  const [department, setDepartment] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && user) {
      setFullName(user.fullName);
      setRole(user.role);
      setDepartment(user.department || '');
      setTitle(user.title || '');
      setError('');
    }
  }, [open, user]);

  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit(user.id, { fullName, role, department: department || undefined, title: title || undefined });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  if (!open || !user) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-wp-surface-container rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 animate-scale-up">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-wp-primary">edit</span>
          <h3 className="text-xl font-bold text-wp-on-surface">Edit User</h3>
        </div>

        {/* User preview */}
        <div className="flex items-center gap-3 p-3 bg-wp-surface-lowest rounded-xl mb-6">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-wp-primary flex items-center justify-center text-white font-bold">
              {user.fullName[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-wp-on-surface">{user.fullName}</p>
            <p className="text-xs text-wp-on-surface-variant">{user.email}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-wp-on-surface-variant/50 block mb-1">Full Name</label>
            <input
              type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full bg-wp-surface-lowest border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-wp-primary/20 text-wp-on-surface"
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
                className="w-full bg-wp-surface-lowest border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-wp-primary/20 text-wp-on-surface placeholder:text-wp-outline"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-wp-on-surface-variant/50 block mb-1">Job Title</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-wp-surface-lowest border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-wp-primary/20 text-wp-on-surface placeholder:text-wp-outline"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-wp-on-surface-variant bg-wp-surface-container-high hover:bg-wp-surface-bright transition-all active:scale-95"
            >Cancel</button>
            <button type="submit" disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-br from-wp-primary to-wp-primary-container text-wp-on-primary shadow-xl shadow-wp-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

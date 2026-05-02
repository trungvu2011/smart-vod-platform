import { useState, useEffect, useRef } from 'react';

interface RejectVideoModalProps {
  open: boolean;
  videoTitle?: string;
  onClose: () => void;
  onReject: (reason: string) => void;
}

const PREDEFINED_REASONS = [
  'Violates community guidelines',
  'Inappropriate or offensive content',
  'Copyright infringement',
  'Low quality or corrupted file',
  'Misleading title or description',
  'Spam or duplicate content',
];

export default function RejectVideoModal({ open, videoTitle, onClose, onReject }: RejectVideoModalProps) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setCustomReason('');
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [open, onClose]);

  const handleSubmit = () => {
    const finalReason = reason === 'custom' ? customReason : reason;
    if (!finalReason.trim()) return;
    onReject(finalReason);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-wp-surface-container rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 animate-scale-up">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-wp-error">block</span>
          <h3 className="text-xl font-bold text-wp-on-surface">Reject Video</h3>
        </div>
        {videoTitle && (
          <p className="text-sm text-wp-on-surface-variant mb-6">
            Rejecting: <span className="font-semibold text-wp-on-surface">"{videoTitle}"</span>
          </p>
        )}

        <div className="space-y-2 mb-4">
          <label className="text-[10px] uppercase tracking-widest font-black text-wp-on-surface-variant/50 block">Reason</label>
          {PREDEFINED_REASONS.map((r) => (
            <label key={r} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${reason === r ? 'bg-wp-error/5 border-wp-error/20' : 'bg-wp-surface-lowest border-transparent hover:border-wp-outline-variant/20'}`}>
              <input
                type="radio" name="reason" value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="text-wp-error focus:ring-wp-error/20"
              />
              <span className="text-sm text-wp-on-surface">{r}</span>
            </label>
          ))}
          <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${reason === 'custom' ? 'bg-wp-error/5 border-wp-error/20' : 'bg-wp-surface-lowest border-transparent hover:border-wp-outline-variant/20'}`}>
            <input
              type="radio" name="reason" value="custom"
              checked={reason === 'custom'}
              onChange={() => setReason('custom')}
              className="text-wp-error focus:ring-wp-error/20"
            />
            <span className="text-sm text-wp-on-surface">Other (custom reason)</span>
          </label>
        </div>

        {reason === 'custom' && (
          <textarea
            value={customReason}
            onChange={e => setCustomReason(e.target.value)}
            placeholder="Enter your reason..."
            rows={3}
            className="w-full bg-wp-surface-lowest border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-wp-error/20 text-wp-on-surface placeholder:text-wp-outline resize-none mb-4"
          />
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-wp-on-surface-variant bg-wp-surface-container-high hover:bg-wp-surface-bright transition-all active:scale-95"
          >Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!reason || (reason === 'custom' && !customReason.trim())}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white transition-all active:scale-95 shadow-lg disabled:opacity-50"
          >Reject Video</button>
        </div>
      </div>
    </div>
  );
}

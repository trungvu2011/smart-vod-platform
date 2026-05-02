import { useEffect, useRef } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open, title, message, confirmText = 'Confirm', cancelText = 'Cancel',
  variant = 'primary', onConfirm, onCancel,
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [open, onCancel]);

  if (!open) return null;

  const btnClass = variant === 'danger'
    ? 'bg-red-500 hover:bg-red-600 text-white'
    : 'bg-wp-primary hover:brightness-110 text-wp-on-primary';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
    >
      <div className="bg-wp-surface-container rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scale-up">
        <h3 className="text-xl font-bold text-wp-on-surface mb-2">{title}</h3>
        <p className="text-sm text-wp-on-surface-variant mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-wp-on-surface-variant bg-wp-surface-container-high hover:bg-wp-surface-bright transition-all active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg ${btnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

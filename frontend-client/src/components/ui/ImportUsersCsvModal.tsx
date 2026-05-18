import { useEffect, useRef, useState } from "react";

interface ImportUsersCsvModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
  onSubmit: (file: File) => Promise<void>;
}

const templateCsv = [
  "Full Name,Department,Job Title,Role",
  "Nguyen Van Anh,Engineering,Developer,USER",
  "Tran Thi Bich,HR,HR Specialist,USER",
].join("\n");

export default function ImportUsersCsvModal({ open, onClose, onImported, onSubmit }: ImportUsersCsvModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setError("");
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleDownloadTemplate = () => {
    const url = window.URL.createObjectURL(new Blob([templateCsv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a CSV file.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onSubmit(file);
      onImported();
      onClose();
    } catch (err: any) {
      let errorMessage = err?.message || "Failed to import CSV.";
      const errorBlob = err?.response?.data;

      if (errorBlob instanceof Blob) {
        try {
          const text = await errorBlob.text();
          try {
            const parsed = JSON.parse(text);
            errorMessage = parsed?.message || errorMessage;
          } catch {
            errorMessage = text || errorMessage;
          }
        } catch {
          // Keep fallback error message.
        }
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
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
      <div className="bg-wp-surface-container rounded-2xl shadow-2xl p-8 max-w-xl w-full mx-4 animate-scale-up">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-wp-primary">upload_file</span>
          <h3 className="text-xl font-bold text-wp-on-surface">Import Members CSV</h3>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="mb-5 rounded-xl bg-wp-surface-lowest p-4 border border-wp-outline-variant/10">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-wp-on-surface">CSV Template</p>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="shrink-0 px-3 py-2 rounded-lg bg-wp-surface-container-high text-wp-on-surface text-xs font-semibold hover:bg-wp-surface-bright transition-colors"
            >
              Template
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest font-black text-wp-on-surface-variant/50 block mb-2">
              CSV File
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-wp-on-surface file:mr-4 file:rounded-lg file:border-0 file:bg-wp-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-wp-on-primary hover:file:opacity-90"
            />
          </label>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-wp-on-surface-variant bg-wp-surface-container-high hover:bg-wp-surface-bright transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-br from-wp-primary to-wp-primary-container text-wp-on-primary shadow-xl shadow-wp-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Importing..." : "Import CSV"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

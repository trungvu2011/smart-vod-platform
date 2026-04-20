import { useState } from "react";
import { X, Lock, Globe } from "lucide-react";
import { playlistApi } from "../../api/playlistApi";
import type { Playlist } from "../../types";

interface CreatePlaylistModalProps {
  onClose: () => void;
  onCreated: (playlist: Playlist) => void;
}

export default function CreatePlaylistModal({ onClose, onCreated }: CreatePlaylistModalProps) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a playlist name.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const playlist = await playlistApi.createPlaylist(name.trim(), isPrivate);
      onCreated(playlist);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create playlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-wp-surface-highest/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-wp-surface-container-low border border-wp-outline/20 rounded-wp-xl w-full max-w-md overflow-hidden shadow-wp-ambient animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-wp-outline/10">
          <h2 className="text-lg font-semibold text-wp-on-surface">Create New Playlist</h2>
          <button
            onClick={onClose}
            className="p-1 text-wp-on-surface-variant hover:text-wp-on-surface hover:bg-wp-surface-container-high rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="p-3 text-sm text-wp-error bg-wp-error/10 border border-wp-error/20 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-wp-on-surface block">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., Onboarding Videos 2026"
              className="w-full px-3 py-2 bg-wp-surface-container-highest border border-wp-outline/20 rounded-lg text-sm text-wp-on-surface placeholder-wp-outline focus:border-wp-primary focus:ring-1 focus:ring-wp-primary transition-all outline-none"
              autoFocus
            />
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-sm font-medium text-wp-on-surface block">Privacy</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm transition-all ${
                  !isPrivate
                    ? "bg-wp-primary-container/20 border-wp-primary text-wp-primary shadow-wp-glow shadow-wp-primary/10"
                    : "border-wp-outline/20 text-wp-on-surface-variant hover:bg-wp-surface-container-high"
                }`}
              >
                <Globe size={18} />
                <span className="font-medium">Shared</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm transition-all ${
                  isPrivate
                    ? "bg-wp-primary-container/20 border-wp-primary text-wp-primary shadow-wp-glow shadow-wp-primary/10"
                    : "border-wp-outline/20 text-wp-on-surface-variant hover:bg-wp-surface-container-high"
                }`}
              >
                <Lock size={18} />
                <span className="font-medium">Private</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-wp-outline/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-wp-on-surface-variant hover:text-wp-on-surface transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-wp-primary text-wp-on-primary text-sm font-bold rounded-lg hover:bg-wp-primary-fixed disabled:opacity-50 transition-colors shadow-lg shadow-wp-primary/20"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

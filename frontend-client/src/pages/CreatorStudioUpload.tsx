import { useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Video, X, Image as ImageIcon, FileText, Settings, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";

export function CreatorStudioUpload() {
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = () => {
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setStep(2);
        }, 500);
      }
    }, 200);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-surface-dark pb-4">
        <h1 className="text-2xl font-bold text-white">Upload Video</h1>
        <Link to="/studio" className="p-2 text-text-secondary hover:text-white hover:bg-surface-dark rounded-full transition-colors">
          <X className="h-6 w-6" />
        </Link>
      </div>

      {step === 1 && !isUploading && (
        <div className="flex flex-col items-center justify-center gap-6 py-20 px-4 border-2 border-dashed border-surface-dark rounded-3xl bg-surface-dark/30">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-surface-dark shadow-2xl shadow-black/50">
            <Upload className="h-12 w-12 text-text-secondary" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-bold text-white">Drag and drop video files to upload</h2>
            <p className="text-text-secondary">Your videos will be private until you publish them.</p>
          </div>
          <button
            onClick={handleUpload}
            className="mt-4 rounded-full bg-primary px-8 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
          >
            Select Files
          </button>
        </div>
      )}

      {isUploading && (
        <div className="flex flex-col items-center justify-center gap-6 py-20 px-4 border border-surface-dark rounded-3xl bg-surface-dark/30">
          <div className="flex flex-col items-center gap-4 text-center w-full max-w-md">
            <h2 className="text-xl font-bold text-white">Uploading video...</h2>
            <div className="w-full h-2 bg-surface-dark rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <p className="text-sm text-text-secondary">{uploadProgress}% uploaded</p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-between border-b border-surface-dark pb-6 px-4">
            {["Details", "Video Elements", "Checks", "Visibility"].map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  i === 0 ? "bg-primary text-white" : "bg-surface-dark text-text-secondary"
                )}>
                  {i === 0 ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  i === 0 ? "text-white" : "text-text-secondary"
                )}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Form Fields */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="title" className="text-sm font-medium text-white">Title (required)</label>
                  <span className="text-xs text-text-secondary">0/100</span>
                </div>
                <input
                  type="text"
                  id="title"
                  placeholder="Add a title that describes your video"
                  className="rounded-xl border border-surface-dark bg-bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="description" className="text-sm font-medium text-white">Description</label>
                  <span className="text-xs text-text-secondary">0/5000</span>
                </div>
                <textarea
                  id="description"
                  rows={6}
                  placeholder="Tell viewers about your video"
                  className="rounded-xl border border-surface-dark bg-bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-medium text-white">Thumbnail</h3>
                <p className="text-xs text-text-secondary">Select or upload a picture that shows what's in your video. A good thumbnail stands out and draws viewers' attention.</p>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  <button className="flex h-24 w-40 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-surface-dark bg-surface-dark/30 text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-xs font-medium">Upload file</span>
                  </button>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 w-40 shrink-0 overflow-hidden rounded-xl border border-surface-dark bg-surface-dark relative cursor-pointer group">
                      <img src={`https://picsum.photos/seed/thumb${i}/320/180`} alt="Thumbnail" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs font-medium text-white">Select</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="playlist" className="text-sm font-medium text-white">Playlists</label>
                <p className="text-xs text-text-secondary">Add your video to one or more playlists to organize your content for viewers.</p>
                <select
                  id="playlist"
                  className="rounded-xl border border-surface-dark bg-bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors appearance-none"
                >
                  <option value="">Select playlist</option>
                  <option value="1">React Tutorials</option>
                  <option value="2">Web Development</option>
                </select>
              </div>
            </div>

            {/* Video Preview */}
            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="h-12 w-12 text-surface-dark" />
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-surface-dark bg-surface-dark/30 p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-text-secondary">Video link</span>
                  <a href="#" className="text-sm font-medium text-primary hover:underline truncate">https://streamflow.com/watch/v123456</a>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-xs text-text-secondary">Filename</span>
                  <span className="text-sm font-medium text-white truncate">my_awesome_video.mp4</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-surface-dark pt-6">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span>Checks complete. No issues found.</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/studio" className="rounded-full px-6 py-2.5 text-sm font-medium text-white hover:bg-surface-dark transition-colors">
                Cancel
              </Link>
              <button className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

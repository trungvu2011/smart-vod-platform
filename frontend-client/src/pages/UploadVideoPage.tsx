import { useState, useRef, useCallback } from 'react';
import {
  Upload, X, Film, Tag, Globe,
  Lock, Users, Clock, CheckCircle, AlertCircle,
  Image as ImageIcon, Plus
} from 'lucide-react';

type UploadState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';
type Visibility = 'public' | 'organization' | 'private';

export default function UploadVideoPage() {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('organization');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Training', 'Townhall', 'Engineering', 'HR & Culture',
    'Finance', 'Marketing', 'Security', 'Operations', 'Leadership'
  ];

  const visibilityOptions: { key: Visibility; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'public', label: 'Public', desc: 'Anyone with the link', icon: <Globe size={18} /> },
    { key: 'organization', label: 'Organization', desc: 'All employees', icon: <Users size={18} /> },
    { key: 'private', label: 'Private', desc: 'Only you', icon: <Lock size={18} /> },
  ];

  const formatSize = (bytes: number) => {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
    return `${(bytes / 1e3).toFixed(0)} KB`;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const simulateUpload = (name: string, size: string) => {
    setFileName(name);
    setFileSize(size);
    setUploadState('uploading');
    setProgress(0);

    // Auto-fill title from filename
    const baseName = name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadState('processing');
          setTimeout(() => setUploadState('done'), 2000);
          return 100;
        }
        return prev + Math.random() * 12;
      });
    }, 300);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) simulateUpload(file.name, formatSize(file.size));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) simulateUpload(file.name, formatSize(file.size));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setThumbnailPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    const cleaned = tagInput.trim().toLowerCase();
    if (cleaned && !tags.includes(cleaned) && tags.length < 8) {
      setTags([...tags, cleaned]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter((tag) => tag !== t));

  const handlePublish = () => {
    // TODO: call API
    console.log({ title, description, category, tags, visibility });
  };

  return (
    <div className="space-y-10 animate-slide-up max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-5xl font-black tracking-tighter text-wp-on-surface">
          Upload Video
        </h1>
        <p className="text-wp-on-surface-variant text-lg">
          Share knowledge with your organization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left — Upload + Metadata (3 cols) */}
        <div className="lg:col-span-3 space-y-8">
          {/* Drop Zone */}
          {uploadState === 'idle' ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative aspect-video rounded-3xl border-2 border-dashed cursor-pointer
                flex flex-col items-center justify-center gap-4 transition-all duration-300
                ${dragActive
                  ? 'border-wp-primary bg-wp-primary-container/10 scale-[1.01]'
                  : 'border-wp-outline-variant/30 bg-wp-surface-container-low hover:border-wp-outline hover:bg-wp-surface-container'
                }`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
                ${dragActive ? 'bg-wp-primary-container/20' : 'bg-wp-surface-container-high'}`}>
                <Upload size={28} className={dragActive ? 'text-wp-primary' : 'text-wp-on-surface-variant'} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-wp-on-surface font-semibold">
                  {dragActive ? 'Drop your video here' : 'Drag & drop your video file'}
                </p>
                <p className="text-xs text-wp-on-surface-variant">
                  or <span className="text-wp-primary font-medium">browse files</span>
                </p>
              </div>
              <p className="text-[11px] text-wp-outline">
                MP4, MOV, AVI, MKV • Max 5 GB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            /* Upload Progress Card */
            <div className="bg-wp-surface-container-low rounded-3xl p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  ${uploadState === 'done' ? 'bg-green-500/20' : uploadState === 'error' ? 'bg-red-500/20' : 'bg-wp-primary-container/20'}`}>
                  {uploadState === 'done' ? (
                    <CheckCircle size={22} className="text-green-400" />
                  ) : uploadState === 'error' ? (
                    <AlertCircle size={22} className="text-red-400" />
                  ) : (
                    <Film size={22} className="text-wp-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-wp-on-surface truncate">{fileName}</p>
                  <p className="text-xs text-wp-on-surface-variant">{fileSize}</p>
                </div>
                <button
                  onClick={() => { setUploadState('idle'); setProgress(0); }}
                  className="p-1.5 rounded-lg hover:bg-wp-surface-container-high text-wp-on-surface-variant
                    hover:text-wp-on-surface transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Progress */}
              {(uploadState === 'uploading' || uploadState === 'processing') && (
                <div className="space-y-2">
                  <div className="h-2 bg-wp-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        uploadState === 'processing' ? 'bg-wp-tertiary animate-pulse-soft' : 'bg-wp-primary-container'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-wp-on-surface-variant font-medium">
                    {uploadState === 'uploading'
                      ? `Uploading... ${Math.min(Math.round(progress), 100)}%`
                      : 'Processing video...'}
                  </p>
                </div>
              )}

              {uploadState === 'done' && (
                <p className="text-xs text-green-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle size={14} /> Upload complete — fill in the details below.
                </p>
              )}
            </div>
          )}

          {/* Metadata Form */}
          <div className="bg-wp-surface-container-low rounded-3xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-wp-on-surface">Video Details</h2>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-wp-on-surface-variant mb-1.5 uppercase tracking-wide">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your video a descriptive title"
                className="w-full px-4 py-3 bg-wp-surface-lowest rounded-xl text-sm text-wp-on-surface
                  placeholder-wp-outline focus:outline-none focus:bg-wp-surface-container-highest
                  focus:shadow-wp-glow transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-wp-on-surface-variant mb-1.5 uppercase tracking-wide">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this video covers..."
                rows={4}
                className="w-full px-4 py-3 bg-wp-surface-lowest rounded-xl text-sm text-wp-on-surface
                  placeholder-wp-outline focus:outline-none focus:bg-wp-surface-container-highest
                  focus:shadow-wp-glow transition-all resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-wp-on-surface-variant mb-1.5 uppercase tracking-wide">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-wp-surface-lowest rounded-xl text-sm text-wp-on-surface
                  focus:outline-none focus:shadow-wp-glow transition-all cursor-pointer"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-wp-on-surface-variant mb-1.5 uppercase tracking-wide">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                      bg-wp-primary-container/15 text-wp-primary-fixed"
                  >
                    <Tag size={11} />
                    {t}
                    <button onClick={() => removeTag(t)} className="hover:text-wp-error transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag and press Enter"
                  className="flex-1 px-4 py-2.5 bg-wp-surface-lowest rounded-xl text-sm text-wp-on-surface
                    placeholder-wp-outline focus:outline-none focus:shadow-wp-glow transition-all"
                />
                <button
                  onClick={addTag}
                  className="bg-wp-surface-container-high hover:bg-wp-surface-bright
                    text-wp-on-surface px-4 rounded-xl transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Thumbnail + Visibility + Publish (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Thumbnail */}
          <div className="bg-wp-surface-container-low rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-wp-on-surface uppercase tracking-wide">Thumbnail</h3>
            <div
              onClick={() => thumbInputRef.current?.click()}
              className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer group
                ${thumbnailPreview
                  ? ''
                  : 'bg-wp-surface-lowest border-2 border-dashed border-wp-outline-variant/30 hover:border-wp-outline'
                } transition-all`}
            >
              {thumbnailPreview ? (
                <>
                  <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
                    transition-opacity flex items-center justify-center">
                    <p className="text-white text-xs font-medium">Click to change</p>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <ImageIcon size={28} className="text-wp-on-surface-variant" />
                  <p className="text-xs text-wp-on-surface-variant">Upload thumbnail</p>
                  <p className="text-[10px] text-wp-outline">16:9 recommended</p>
                </div>
              )}
            </div>
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="hidden"
            />
          </div>

          {/* Visibility */}
          <div className="bg-wp-surface-container-low rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-wp-on-surface uppercase tracking-wide">Visibility</h3>
            <div className="space-y-2">
              {visibilityOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setVisibility(opt.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200
                    ${visibility === opt.key
                      ? 'bg-wp-primary-container/15 ring-1 ring-wp-primary/30'
                      : 'bg-wp-surface-lowest hover:bg-wp-surface-container'
                    }`}
                >
                  <div className={`${visibility === opt.key ? 'text-wp-primary' : 'text-wp-on-surface-variant'}`}>
                    {opt.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-wp-on-surface">{opt.label}</p>
                    <p className="text-[11px] text-wp-on-surface-variant">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Schedule / Publish */}
          <div className="bg-wp-surface-container-low rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-wp-on-surface uppercase tracking-wide">Publish</h3>
            <button
              onClick={handlePublish}
              disabled={uploadState !== 'done' || !title}
              className="w-full bg-wp-gradient text-wp-on-primary font-bold py-3.5 rounded-xl
                shadow-lg transition-all flex items-center justify-center gap-2
                hover:shadow-wp-glow active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              <Upload size={16} />
              Publish Now
            </button>
            <button
              disabled={uploadState !== 'done' || !title}
              className="w-full bg-wp-surface-container-high text-wp-on-surface font-medium py-3 rounded-xl
                transition-all flex items-center justify-center gap-2
                hover:bg-wp-surface-bright active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Clock size={16} />
              Schedule for Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

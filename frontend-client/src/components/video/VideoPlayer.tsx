import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Settings as SettingsIcon,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

type QualityOption = {
  label: string;
  level: number | "auto";
};

type SettingsView = "root" | "speed" | "quality";
type SeekFeedback = "backward" | "forward" | null;

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  onTimeUpdate,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isVolumeHovering, setIsVolumeHovering] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [qualityOptions, setQualityOptions] = useState<QualityOption[]>([
    { label: "Auto", level: "auto" },
  ]);
  const [selectedQuality, setSelectedQuality] = useState<number | "auto">(
    "auto",
  );
  const [settingsView, setSettingsView] = useState<SettingsView>("root");
  const [seekFeedback, setSeekFeedback] = useState<SeekFeedback>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const seekFeedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // Initialize HLS or native video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (src.includes(".m3u8") && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels
          .map((level, idx) => ({
            idx,
            height: level.height,
            bitrate: level.bitrate,
          }))
          .sort((a, b) => b.height - a.height || b.bitrate - a.bitrate);

        const options: QualityOption[] = [{ label: "Auto", level: "auto" }];
        levels.forEach((item) => {
          const label = item.height
            ? `${item.height}p`
            : `${Math.round(item.bitrate / 1000)} kbps`;
          if (!options.find((o) => o.label === label)) {
            options.push({ label, level: item.idx });
          }
        });

        setQualityOptions(options);
        setSelectedQuality("auto");

        if (autoPlay) video.play().catch(() => {});
      });
      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS (Safari)
      video.src = src;
      setQualityOptions([{ label: "Auto", level: "auto" }]);
      setSelectedQuality("auto");
      if (autoPlay) video.play().catch(() => {});
    } else {
      video.src = src;
      setQualityOptions([{ label: "Source", level: "auto" }]);
      setSelectedQuality("auto");
      if (autoPlay) video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay]);

  // Close settings popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!settingsRef.current) return;
      if (!settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showSettings]);

  // Keyboard shortcuts: ArrowLeft/ArrowRight -> -10s/+10s
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isTypingTarget =
        !!activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable);

      if (isTypingTarget) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        seek(-10);
        triggerSeekFeedback("backward");
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        seek(10);
        triggerSeekFeedback("forward");
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [duration]);

  useEffect(() => {
    return () => clearTimeout(seekFeedbackTimer.current);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && !isHovering) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    } else {
      setShowControls(true);
    }
    return () => clearTimeout(hideTimer.current);
  }, [isPlaying, isHovering]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    onTimeUpdate?.(video.currentTime, video.duration);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) setDuration(video.duration);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
      setIsMuted(v === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const handleQualityChange = (level: number | "auto") => {
    setSelectedQuality(level);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level === "auto" ? -1 : level;
    }
    setShowSettings(false);
  };

  const seek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.currentTime + seconds, duration),
      );
    }
  };

  const triggerSeekFeedback = (direction: Exclude<SeekFeedback, null>) => {
    setSeekFeedback(direction);
    clearTimeout(seekFeedbackTimer.current);
    seekFeedbackTimer.current = setTimeout(() => {
      setSeekFeedback(null);
    }, 520);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = fraction * duration;
  };

  const handleDoubleClickSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftSide = e.clientX < rect.left + rect.width / 2;
    seek(isLeftSide ? -10 : 10);
    triggerSeekFeedback(isLeftSide ? "backward" : "forward");
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0)
      return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const selectedQualityLabel =
    qualityOptions.find((o) => o.level === selectedQuality)?.label || "Auto";

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-wp-surface-lowest rounded-wp-xl overflow-hidden group cursor-pointer"
      onMouseEnter={() => {
        setIsHovering(true);
        setShowControls(true);
      }}
      onMouseLeave={() => setIsHovering(false)}
      onClick={togglePlay}
      onDoubleClick={handleDoubleClickSeek}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
      />

      {/* Seek feedback overlay */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className={`absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full
            bg-black/35 backdrop-blur-sm text-white/90 text-lg md:text-2xl font-bold px-5 py-2.5 md:px-6 md:py-3
            transition-all duration-200 ${
              seekFeedback === "backward"
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95"
            }`}
        >
          -10s
        </div>
        <div
          className={`absolute left-3/4 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full
            bg-black/35 backdrop-blur-sm text-white/90 text-lg md:text-2xl font-bold px-5 py-2.5 md:px-6 md:py-3
            transition-all duration-200 ${
              seekFeedback === "forward"
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95"
            }`}
        >
          +10s
        </div>
      </div>

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Gradient scrim */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Center play button */}
        {!isPlaying && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-16 h-16 rounded-full glass flex items-center justify-center
              hover:scale-110 transition-transform"
          >
            <Play size={28} className="text-white ml-1 fill-current" />
          </button>
        )}

        {/* Bottom controls */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4 space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="h-1 bg-white/20 rounded-full cursor-pointer group/progress hover:h-2 transition-all"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-wp-primary-container rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 
                bg-white rounded-full shadow opacity-0 group-hover/progress:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isPlaying ? (
                  <Pause size={20} className="text-white" />
                ) : (
                  <Play size={20} className="text-white fill-current" />
                )}
              </button>
              <button
                onClick={() => {
                  seek(-10);
                  triggerSeekFeedback("backward");
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <SkipBack size={18} className="text-white" />
              </button>
              <button
                onClick={() => {
                  seek(10);
                  triggerSeekFeedback("forward");
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <SkipForward size={18} className="text-white" />
              </button>

              {/* Volume */}
              <div
                className="flex items-center gap-1.5"
                onMouseEnter={() => setIsVolumeHovering(true)}
                onMouseLeave={() => setIsVolumeHovering(false)}
              >
                <button
                  onClick={toggleMute}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX size={18} className="text-white" />
                  ) : (
                    <Volume2 size={18} className="text-white" />
                  )}
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isVolumeHovering
                      ? "w-20 opacity-100"
                      : "w-0 opacity-0 pointer-events-none"
                  }`}
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 accent-wp-primary-container"
                  />
                </div>
              </div>

              <span className="text-xs text-white/70 ml-1 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="relative flex items-center gap-1" ref={settingsRef}>
              <button
                onClick={() => {
                  setShowSettings((v) => {
                    const next = !v;
                    if (next) setSettingsView("root");
                    return next;
                  });
                }}
                className={`p-1.5 rounded-lg transition-colors ${showSettings ? "bg-white/15" : "hover:bg-white/10"}`}
              >
                <SettingsIcon size={18} className="text-white" />
              </button>

              {showSettings && (
                <div className="absolute bottom-11 right-0 w-48 glass rounded-lg p-3 space-y-3">
                  {settingsView === "root" && (
                    <div className="space-y-1">
                      <button
                        onClick={() => setSettingsView("speed")}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded text-sm text-white/85 hover:bg-white/10 transition-colors"
                      >
                        <span>Speed</span>
                        <span className="flex items-center gap-1 text-white/70 text-xs">
                          {playbackRate}x <ChevronRight size={14} />
                        </span>
                      </button>

                      <button
                        onClick={() => setSettingsView("quality")}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded text-sm text-white/85 hover:bg-white/10 transition-colors"
                      >
                        <span>Quality</span>
                        <span className="flex items-center gap-1 text-white/70 text-xs">
                          {selectedQualityLabel} <ChevronRight size={14} />
                        </span>
                      </button>
                    </div>
                  )}

                  {settingsView === "speed" && (
                    <div className="space-y-2">
                      <button
                        onClick={() => setSettingsView("root")}
                        className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
                      >
                        <ChevronLeft size={14} /> Back
                      </button>
                      <div className="grid grid-cols-3 gap-1">
                        {playbackRates.map((rate) => (
                          <button
                            key={rate}
                            onClick={() => handlePlaybackRateChange(rate)}
                            className={`text-xs py-1 rounded transition-colors ${
                              playbackRate === rate
                                ? "bg-white/20 text-white"
                                : "text-white/75 hover:bg-white/10"
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {settingsView === "quality" && (
                    <div className="space-y-2">
                      <button
                        onClick={() => setSettingsView("root")}
                        className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
                      >
                        <ChevronLeft size={14} /> Back
                      </button>
                      <div className="space-y-1">
                        {qualityOptions.map((option) => (
                          <button
                            key={`${option.label}-${option.level}`}
                            onClick={() => handleQualityChange(option.level)}
                            className={`w-full text-left text-xs px-2 py-1 rounded transition-colors ${
                              selectedQuality === option.level
                                ? "bg-white/20 text-white"
                                : "text-white/75 hover:bg-white/10"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={toggleFullscreen}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isFullscreen ? (
                  <Minimize size={18} className="text-white" />
                ) : (
                  <Maximize size={18} className="text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

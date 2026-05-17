import { useEffect, useMemo, useState } from 'react';

interface UserAvatarProps {
  name?: string | null;
  src?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  initialClassName?: string;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitial(name?: string | null): string {
  const normalized = (name || '').trim();
  if (!normalized) return '?';
  const parts = normalized.split(/\s+/).filter(Boolean);
  const target = parts.length > 0 ? parts[parts.length - 1] : normalized;
  return target.charAt(0).toUpperCase();
}

function buildFallbackColor(seed: string): string {
  const hash = hashString(seed);
  const hue = hash % 360;
  const saturation = 60 + (hash % 18);
  const lightness = 40 + (hash % 10);
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export default function UserAvatar({
  name,
  src,
  alt,
  className = '',
  imageClassName = '',
  fallbackClassName = '',
  initialClassName = '',
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(src && src.trim()) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const seed = useMemo(() => (name || src || 'user').trim().toLowerCase(), [name, src]);
  const fallbackColor = useMemo(() => buildFallbackColor(seed), [seed]);
  const initial = useMemo(() => getInitial(name), [name]);

  return (
    <div className={`overflow-hidden rounded-full shrink-0 ${className}`}>
      {hasImage ? (
        <img
          src={src as string}
          alt={alt ?? name ?? 'User avatar'}
          className={`w-full h-full object-cover ${imageClassName}`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center text-white font-semibold select-none ${fallbackClassName}`}
          style={{ backgroundColor: fallbackColor }}
          aria-label={alt ?? name ?? 'User avatar'}
          role="img"
        >
          <span className={initialClassName || 'text-sm'}>{initial}</span>
        </div>
      )}
    </div>
  );
}

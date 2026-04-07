import type { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'heavy';
}

export default function GlassPanel({ children, className = '', variant = 'default' }: GlassPanelProps) {
  const base = variant === 'heavy' ? 'glass-heavy' : 'glass';

  return (
    <div className={`${base} rounded-wp-lg ${className}`}>
      {children}
    </div>
  );
}

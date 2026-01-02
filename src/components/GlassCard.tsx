import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export default function GlassCard({ children, className = '', variant = 'secondary' }: GlassCardProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <div
      className={`rounded-xl border border-white/7 ${
        isPrimary
          ? 'bg-white/8 backdrop-blur-lg shadow-xl shadow-black/25'
          : 'bg-white/3 backdrop-blur-sm shadow-md shadow-black/15'
      } ${className}`}
    >
      {children}
    </div>
  );
}


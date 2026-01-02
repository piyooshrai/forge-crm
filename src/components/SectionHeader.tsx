interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export default function SectionHeader({ title, subtitle, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <h2 className="text-lg font-medium text-white">{title}</h2>
      {subtitle && (
        <p className="text-sm text-white/40">{subtitle}</p>
      )}
    </div>
  );
}


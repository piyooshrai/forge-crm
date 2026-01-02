interface StatTileProps {
  label: string;
  value: string | number;
  change?: string;
  className?: string;
}

export default function StatTile({ label, value, change, className = '' }: StatTileProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <p className="text-sm text-white/45">{label}</p>
      <p className="text-2xl font-semibold text-white tracking-tight">{value}</p>
      {change && (
        <p className="text-xs text-cyan-400/70 mt-1">{change}</p>
      )}
    </div>
  );
}


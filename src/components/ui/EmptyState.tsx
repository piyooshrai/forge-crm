interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-4xl mb-4">{icon}</span>
      <h3 className="text-lg font-medium text-white/80 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-white/50 max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}

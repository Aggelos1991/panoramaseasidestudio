import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
        <Icon className="h-7 w-7 text-gray-300" />
      </div>
      <h3 className="mt-5 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-gray-400">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

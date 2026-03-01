import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 rounded-2xl bg-gradient-to-r from-deep-blue to-deep-blue-light p-6 text-white shadow-lg lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-white/60">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {actions}
          {Icon && (
            <div className="hidden rounded-xl bg-white/10 p-3 backdrop-blur-sm sm:block">
              <Icon className="h-6 w-6 text-white/80" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

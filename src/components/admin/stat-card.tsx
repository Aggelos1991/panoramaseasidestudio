import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bg: string;
  accent: string;
  index?: number;
}

export function StatCard({ label, value, icon: Icon, color, bg, accent, index = 0 }: StatCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border-l-4 ${accent} bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
      style={{ animation: `slide-up 0.4s ease-out ${index * 0.08}s both` }}
    >
      <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-gray-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs font-medium text-gray-400">{label}</p>
      </div>
    </div>
  );
}

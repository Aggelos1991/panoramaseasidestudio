"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CalendarDays, UserCircle, CheckCircle } from "lucide-react";

const steps = [
  { key: "flowStay", icon: CalendarDays },
  { key: "flowDetails", icon: UserCircle },
  { key: "flowReview", icon: CheckCircle },
] as const;

export function BookingSteps({ currentStep }: { currentStep: number }) {
  const t = useTranslations("booking");

  return (
    <ol className="flex items-center justify-center">
      {steps.map(({ key, icon: Icon }, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <li key={key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border transition-colors sm:h-11 sm:w-11",
                  isActive
                    ? "border-[#1c1916] bg-[#1c1916] text-[#f3efe8]"
                    : isCompleted
                      ? "border-[#1c1916] bg-white/70 text-[#1c1916]"
                      : "border-black/15 bg-white/40 text-[#1c1916]/35",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <span
                className={cn(
                  "mt-2 max-w-[4.75rem] text-center text-[0.65rem] font-medium uppercase tracking-[0.14em] sm:max-w-none sm:text-[0.68rem] sm:tracking-[0.16em]",
                  isActive ? "text-[#1c1916]" : "text-[#1c1916]/45",
                )}
              >
                {t(key)}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-3 mb-6 h-px w-8 sm:mx-5 sm:w-16",
                  stepNum < currentStep ? "bg-[#1c1916]" : "bg-black/15",
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

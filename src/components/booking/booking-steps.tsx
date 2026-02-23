"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CalendarDays, BedDouble, UserCircle, CheckCircle } from "lucide-react";

const steps = [
  { key: "step1", icon: CalendarDays },
  { key: "step2", icon: BedDouble },
  { key: "step3", icon: UserCircle },
  { key: "step4", icon: CheckCircle },
] as const;

export function BookingSteps({ currentStep }: { currentStep: number }) {
  const t = useTranslations("booking");

  return (
    <div className="flex items-center justify-center">
      {steps.map(({ key, icon: Icon }, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all sm:h-12 sm:w-12",
                  isActive
                    ? "border-terracotta bg-terracotta text-white"
                    : isCompleted
                      ? "border-terracotta bg-terracotta/10 text-terracotta"
                      : "border-gray-300 bg-white text-gray-400",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "mt-2 hidden text-xs font-medium sm:block",
                  isActive
                    ? "text-terracotta"
                    : isCompleted
                      ? "text-terracotta/70"
                      : "text-gray-400",
                )}
              >
                {t(key)}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-8 sm:mx-4 sm:w-16",
                  stepNum < currentStep ? "bg-terracotta" : "bg-gray-300",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

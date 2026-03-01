"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAnimateOnScroll } from "@/hooks/use-animate-on-scroll";

const FAQ_KEYS = [
  "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10",
] as const;

export function FAQSection() {
  const t = useTranslations("faq");
  const { ref, isVisible } = useAnimateOnScroll();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-white py-20 sm:py-28">
      <div ref={ref} className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div
          className={`text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="mb-2 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-gold" />
            <span className="text-sm font-medium uppercase tracking-wider text-terracotta">
              {t("subtitle")}
            </span>
            <div className="h-px w-8 bg-gold" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-deep-blue sm:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {FAQ_KEYS.map((key, i) => {
            const questionKey = key;
            const answerKey = key.replace("q", "a") as `a${string}`;
            const isOpen = openIndex === i;

            return (
              <div
                key={key}
                className={`overflow-hidden rounded-xl border border-gray-100 bg-cream/50 transition-all duration-700 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
                style={{
                  transitionDelay: isVisible ? `${200 + i * 80}ms` : "0ms",
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="pr-4 font-medium text-deep-blue">
                    {t(questionKey)}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-terracotta transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 leading-relaxed text-gray-600">
                      {t(answerKey)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

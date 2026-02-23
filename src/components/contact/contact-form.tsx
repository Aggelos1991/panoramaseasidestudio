"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { contactFormSchema, type ContactFormData } from "@/lib/validators";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

export function ContactForm() {
  const t = useTranslations("contact");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(data: ContactFormData) {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      toast.success(t("success"));
      reset();
    } catch {
      toast.error(t("error"));
    }
  }

  const inputClasses = cn(
    "w-full rounded-lg border border-sandy-dark bg-cream/50 px-4 py-3 text-sm text-deep-blue",
    "placeholder:text-gray-400",
    "transition-all duration-200",
    "focus:border-terracotta focus:bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/20",
  );

  const labelClasses = "mb-1.5 block text-sm font-medium text-deep-blue";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className={labelClasses}>
          {t("name")}
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          className={cn(
            inputClasses,
            errors.name && "border-red-400 focus:border-red-400 focus:ring-red-200",
          )}
          placeholder={t("name")}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className={labelClasses}>
          {t("email")}
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className={cn(
            inputClasses,
            errors.email && "border-red-400 focus:border-red-400 focus:ring-red-200",
          )}
          placeholder={t("email")}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className={labelClasses}>
          {t("subject")}
        </label>
        <input
          id="subject"
          type="text"
          {...register("subject")}
          className={inputClasses}
          placeholder={t("subject")}
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className={labelClasses}>
          {t("message")}
        </label>
        <textarea
          id="message"
          rows={5}
          {...register("message")}
          className={cn(
            inputClasses,
            "resize-none",
            errors.message && "border-red-400 focus:border-red-400 focus:ring-red-200",
          )}
          placeholder={t("messagePlaceholder")}
        />
        {errors.message && (
          <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        isLoading={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          t("sending")
        ) : (
          <>
            {t("send")}
            <Send className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}

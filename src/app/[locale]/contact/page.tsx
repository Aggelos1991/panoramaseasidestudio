import { getTranslations } from "next-intl/server";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { MapEmbed } from "@/components/contact/map-embed";

export async function generateMetadata() {
  const t = await getTranslations("contact");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <section className="min-h-screen bg-cream pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <div className="mb-2 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-gold" />
            <span className="text-sm font-medium uppercase tracking-wider text-terracotta">
              {t("getInTouch")}
            </span>
            <div className="h-px w-8 bg-gold" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-deep-blue sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            {t("subtitle")}
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Contact Form */}
          <div className="rounded-2xl bg-white p-8 shadow-elegant sm:p-10">
            <ContactForm />
          </div>

          {/* Contact Info & Map */}
          <div className="flex flex-col gap-8">
            {/* Contact Details */}
            <div className="rounded-2xl bg-white p-8 shadow-soft">
              <h2 className="mb-6 font-serif text-2xl font-bold text-deep-blue">
                {t("getInTouch")}
              </h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sandy text-terracotta">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-deep-blue">
                      {t("findUs")}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {t("address")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sandy text-terracotta">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-deep-blue">
                      {t("phone")}
                    </p>
                    <a
                      href="tel:+306942946533"
                      className="mt-0.5 text-sm text-gray-500 transition-colors hover:text-terracotta"
                    >
                      +30 6942946533
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sandy text-terracotta">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-deep-blue">Email</p>
                    <a
                      href="mailto:info@panoramaseasidekos.com"
                      className="mt-0.5 text-sm text-gray-500 transition-colors hover:text-terracotta"
                    >
                      {t("emailAddress")}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sandy text-terracotta">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-deep-blue">Reception</p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      08:00 - 22:00
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="overflow-hidden rounded-2xl shadow-soft">
              <MapEmbed />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

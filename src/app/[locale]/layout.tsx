import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/header";
import { FilmFrame } from "@/components/layout/film-frame";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "sonner";
import { HotelJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";
import { HtmlLang } from "@/components/seo/html-lang";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HtmlLang locale={locale} />
      <HotelJsonLd />
      <WebSiteJsonLd />
      <div className="flex min-h-screen flex-col">
        <FilmFrame>
          <Header />
          <main className="flex-1">{children}</main>
        </FilmFrame>
        <Footer />
      </div>
      <Toaster position="top-right" richColors />
    </NextIntlClientProvider>
  );
}

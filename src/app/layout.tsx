import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { defaultLocale, getDirection, getHtmlLang } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * Default metadata for the boilerplate.
 * Client projects override these values in AGENTS.client.md and route-level metadata.
 */
export const metadata: Metadata = {
  title: {
    default: "Systemize",
    template: "%s | Systemize",
  },
  description:
    "Production-grade Next.js boilerplate with Supabase, strict TypeScript, and Tailwind CSS v4.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    locale: defaultLocale,
    siteName: "Systemize",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a1a2e",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Opt into dynamic rendering so Next.js applies the per-request CSP nonce.
  await headers();
  const locale = defaultLocale;
  const dir = getDirection(locale);
  const lang = getHtmlLang(locale);

  return (
    <html lang={lang} dir={dir} className={inter.variable}>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}

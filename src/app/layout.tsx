import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { headers } from "next/headers";
import { defaultLocale, getDirection, getHtmlLang } from "@/lib/i18n";
import { siteDescription, siteName, siteTagline, siteUrl } from "@/lib/site-config";
import "./globals.css";

/**
 * Heebo covers both Hebrew and Latin glyphs. The boilerplate default, Inter, has no
 * Hebrew coverage, so every heading on this site would have fallen back to a system font.
 */
const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — ${siteTagline}`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName,
    title: `${siteName} — ${siteTagline}`,
    description: siteDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — ${siteTagline}`,
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f6f7",
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
    <html lang={lang} dir={dir} className={heebo.variable}>
      <body>
        <a href="#main-content" className="skip-link">
          דילוג לתוכן הראשי
        </a>
        {children}
      </body>
    </html>
  );
}

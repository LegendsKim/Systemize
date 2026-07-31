import type { Metadata, Viewport } from "next";
import { Heebo, Space_Grotesk } from "next/font/google";
import { headers } from "next/headers";
import { a11yRestoreScript } from "@/features/accessibility/a11y-settings";
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

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | ${siteTagline}`,
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
    title: `${siteName} | ${siteTagline}`,
    description: siteDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | ${siteTagline}`,
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f6f7",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read a request header so this layout renders per request: Next.js only stamps its own
  // scripts with the per-request CSP nonce from `src/proxy.ts` on a dynamic render.
  await headers();
  const locale = defaultLocale;
  const dir = getDirection(locale);
  const lang = getHtmlLang(locale);

  return (
    <html
      lang={lang}
      dir={dir}
      className={`${heebo.variable} ${spaceGrotesk.variable}`}
    >
      <body>
        {/*
         * Runs before the body paints, so a visitor who saved accessibility settings sees
         * the adjusted page immediately rather than a flash of the default one. It only
         * copies validated values from `localStorage` onto `<html>` as attributes; the
         * React tree never renders them, which is what keeps the first render
         * deterministic (AGENTS.md §3).
         *
         * No `nonce` attribute: the browser hides a nonce value once the CSP is applied,
         * so React would read back an empty string and report a hydration mismatch on
         * every load. `src/proxy.ts` allows this exact script by its SHA-256 hash instead.
         */}
        <script dangerouslySetInnerHTML={{ __html: a11yRestoreScript }} />
        <a href="#main-content" className="skip-link">
          דילוג לתוכן הראשי
        </a>
        {children}
      </body>
    </html>
  );
}

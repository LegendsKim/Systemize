import type { Metadata, Viewport } from "next";
import { Heebo, Space_Grotesk } from "next/font/google";
import { headers } from "next/headers";
import { a11yRestoreScript } from "@/features/accessibility/a11y-settings";
import { defaultLocale, getDirection, getHtmlLang } from "@/lib/i18n";
import { openGraphImageDescriptor } from "@/lib/seo/open-graph-image";
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
    images: [openGraphImageDescriptor],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | ${siteTagline}`,
    description: siteDescription,
    images: [openGraphImageDescriptor],
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
      data-scroll-behavior="smooth"
    >
      <body>
        {/*
         * Runs before the body paints, so a visitor who saved accessibility settings sees
         * the adjusted page immediately rather than a flash of the default one. It only
         * copies validated values from `localStorage` onto `<html>` as attributes; the
         * React tree never renders them, which is what keeps the first render
         * deterministic (AGENTS.md §3).
         *
         * Deliberately a plain element rather than `next/script`. Next stamps the request
         * CSP nonce onto a `beforeInteractive` script, and the browser blanks that
         * attribute once the policy is applied — so the server HTML carries `nonce=""`
         * while the client render carries nothing, and hydration fails on every load.
         * `src/proxy.ts` already allows this exact script by SHA-256 hash, so it needs no
         * nonce at all, and an inline script in the first position of `<body>` executes
         * before anything below it paints.
         */}
        <script
          id="systemize-a11y-restore"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: a11yRestoreScript }}
        />
        <a href="#main-content" className="skip-link">
          דילוג לתוכן הראשי
        </a>
        {children}
      </body>
    </html>
  );
}

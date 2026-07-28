import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-config";

/**
 * Crawl policy.
 *
 * The boilerplate shipped `disallow: "/"`, which is right for a template and wrong for a
 * live marketing site, it told every crawler, search engine and AI agent alike, to stay
 * out. This is a lead-generation site whose whole purpose is being found.
 *
 * AI crawlers are allowed deliberately rather than by omission. A prospective client is
 * as likely to ask an assistant "who builds custom business systems in Israel" as to open
 * a search engine, and a site that blocks those crawlers cannot be the answer.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

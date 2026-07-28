import type { MetadataRoute } from "next";
import { indexableRoutes, siteUrl } from "@/lib/site-config";

/**
 * The sitemap is generated from `indexableRoutes` rather than written out by hand, so a
 * new public route cannot be added to the site and forgotten here.
 *
 * `lastModified` is omitted on purpose. Emitting the build time would tell a crawler that
 * every page changed on every deploy, which trains it to distrust the field.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return indexableRoutes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.6,
  }));
}

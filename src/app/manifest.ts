import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "SYSTEMIZE PORTAL",
    short_name: "SYSTEMIZE",
    description: "האזור המאובטח לניהול הפרויקט שלך עם SYSTEMIZE.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#f5f6f7",
    theme_color: "#20262f",
    dir: "rtl",
    lang: "he",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

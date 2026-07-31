import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  crons: [
    {
      path: "/api/push/dispatch",
      // The linked Vercel project is on Hobby, whose minimum interval is daily.
      // Successful mutations still request an immediate best-effort drain via after().
      schedule: "0 3 * * *",
    },
  ],
  headers: [
    {
      source: "/sw.js",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=0, must-revalidate",
        },
      ],
    },
  ],
};

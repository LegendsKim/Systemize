import { portalShareMetadata } from "@/lib/seo/portal-share-metadata";

export const metadata = portalShareMetadata({
  path: "/login",
  title: "כניסה ל־SYSTEMIZE PORTAL",
  description:
    "כניסה מאובטחת למרחב שבו שלבי הפרויקט, המסמכים וההחלטות נשארים ברורים ומסודרים.",
});

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

import type { Metadata } from "next";
import Link from "next/link";
import { PortfolioGrid } from "@/features/portfolio/components/PortfolioGrid";
import { pageMetadata } from "@/lib/seo/page-metadata";

const description =
  "פרויקטים של SYSTEMIZE: AthleteTrack, FinQuest ו-Guesto — מערכות דיגיטליות שנבנו סביב צורך ותהליך ברורים.";

export const metadata: Metadata = pageMetadata({
  path: "/projects",
  title: "פרויקטים",
  description,
});

export default function ProjectsPage() {
  return (
    <section className="projects-page" aria-labelledby="projects-heading">
      <div className="projects-inner">
        <header className="projects-intro">
          <p className="portfolio-eyebrow">עבודות נבחרות</p>
          <h1 id="projects-heading">מערכות שקיבלו צורה.</h1>
          <p className="projects-lead">
            שלושה פרויקטים, שלושה עולמות שונים. לחצו על פרויקט כדי לראות מה
            המערכת מרכזת ואיזו בעיה היא נועדה לפתור.
          </p>
        </header>

        <PortfolioGrid />

        <section className="projects-cta" aria-labelledby="projects-cta-heading">
          <p className="projects-cta-eyebrow">לא רק להסתכל</p>
          <h2 id="projects-cta-heading">
            יש לכם תהליך שצריך להפוך למערכת?
          </h2>
          <p>
            מתחילים מהעבודה האמיתית בעסק, ומעצבים סביבה כלי שמרגיש כאילו תמיד
            היה צריך להיות שם.
          </p>
          <Link href="/#blueprint" className="projects-cta-link">
            בואו נדבר על הרעיון
            <span aria-hidden="true">←</span>
          </Link>
        </section>
      </div>
    </section>
  );
}

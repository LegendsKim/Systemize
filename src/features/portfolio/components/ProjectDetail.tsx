import Image from "next/image";
import Link from "next/link";
import { contact } from "@/lib/site-config";
import type { PortfolioProject } from "../portfolio-content";

interface ProjectDetailProps {
  readonly project: PortfolioProject;
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    `היי, ראיתי את הפרויקט ${project.name} באתר ואשמח לדבר על מערכת לעסק שלי`
  )}`;

  return (
    <article className={`project-detail project-detail-${project.slug}`}>
      <div className="project-detail-inner">
        <Link href="/projects" className="project-back-link">
          חזרה לכל הפרויקטים
        </Link>

        <header className="project-hero">
          <div className="project-hero-copy">
            <div className="project-meta">
              <span className="portfolio-eyebrow">{project.type}</span>
              <span className="project-status">{project.status}</span>
            </div>
            <h1>{project.name}</h1>
            <p className="project-description">{project.description}</p>
            <div className="project-hero-actions">
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="project-live-link"
              >
                {project.liveLabel}
                <span aria-hidden="true">↗</span>
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="project-secondary-link"
              >
                רוצה מערכת דומה
              </a>
            </div>
          </div>

          <figure className="project-hero-figure">
            <div className="project-hero-image">
              <Image
                src={project.image}
                alt={project.imageAlt}
                width={1270}
                height={717}
                sizes="(max-width: 64rem) 100vw, 58vw"
                priority
              />
            </div>
            <figcaption>צילום מתוך המערכת</figcaption>
          </figure>
        </header>

        <aside className="project-origin" aria-labelledby="project-origin-heading">
          <p className="project-origin-label">מאיפה זה התחיל</p>
          <h2 id="project-origin-heading">{project.origin}</h2>
        </aside>

        <div className="project-story">
          <section className="project-story-card" aria-labelledby="project-pain-heading">
            <p className="project-section-number" aria-hidden="true">
              01
            </p>
            <h2 id="project-pain-heading">הכאב</h2>
            <p>{project.pain}</p>
          </section>

          <section
            className="project-story-card project-story-card-featured"
            aria-labelledby="project-solution-heading"
          >
            <p className="project-section-number" aria-hidden="true">
              02
            </p>
            <h2 id="project-solution-heading">מה המערכת עושה</h2>
            <p>{project.solution}</p>
            <ul>
              {project.capabilities.map((capability) => (
                <li key={capability}>{capability}</li>
              ))}
            </ul>
          </section>

          <section
            className="project-story-card"
            aria-labelledby="project-planning-heading"
          >
            <p className="project-section-number" aria-hidden="true">
              03
            </p>
            <h2 id="project-planning-heading">עקרונות התכנון</h2>
            <ul>
              {project.planning.map((principle) => (
                <li key={principle}>{principle}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="project-contact" aria-labelledby="project-contact-heading">
          <div>
            <p className="project-contact-eyebrow">הרעיון הבא יכול להיות שלכם</p>
            <h2 id="project-contact-heading">
              יש תהליך בעסק שעדיין מתנהל בין הודעות, טבלאות וזיכרון?
            </h2>
            <p>
              בשיחה קצרה נבדוק מה באמת צריך לחבר, ומה המערכת הנכונה יכולה לעשות
              פשוט יותר.
            </p>
          </div>
          <div className="project-contact-actions">
            <Link href="/#blueprint" className="project-contact-primary">
              בואו נדבר על המערכת
              <span aria-hidden="true">←</span>
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="project-contact-secondary"
            >
              שיחה ב‑WhatsApp
            </a>
          </div>
        </section>
      </div>
    </article>
  );
}

import Image from "next/image";
import Link from "next/link";
import { portfolioProjects } from "../portfolio-content";

/** A Server Component: the cards are static links with no client-side state. */
export function PortfolioGrid() {
  return (
    <ul className="portfolio-grid" aria-label="רשימת פרויקטים">
      {portfolioProjects.map((project, index) => (
        <li key={project.slug} className="portfolio-card">
          <article>
            <Link
              href={`/projects/${project.slug}`}
              className="portfolio-card-link"
              aria-labelledby={`${project.slug}-title`}
            >
              <span className="portfolio-image-frame">
                <Image
                  src={project.image}
                  alt={project.imageAlt}
                  width={1270}
                  height={717}
                  sizes="(max-width: 48rem) 100vw, 33vw"
                  className="portfolio-image"
                />
                <span className="portfolio-card-index" aria-hidden="true">
                  0{index + 1}
                </span>
                <span className="portfolio-type-badge">{project.type}</span>
              </span>

              <span className="portfolio-card-copy">
                <span id={`${project.slug}-title`} className="portfolio-card-title">
                  {project.name}
                </span>
                <span className="portfolio-card-summary">{project.cardSummary}</span>
                <span className="portfolio-card-action">
                  לצפייה בפרויקט
                  <span className="portfolio-card-arrow" aria-hidden="true">
                    ←
                  </span>
                </span>
              </span>
            </Link>
          </article>
        </li>
      ))}
    </ul>
  );
}

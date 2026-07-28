import { JsonLd } from "@/components/seo/JsonLd";
import { DiagnosticOffer } from "@/features/diagnostic/components/DiagnosticOffer";
import { FaqList } from "@/features/faq/components/FaqList";
import { Hero } from "@/features/hero/components/Hero";
import { LeadSection } from "@/features/lead/components/LeadSection";
import { ProcessStory } from "@/features/process/components/ProcessStory";
import { homeStructuredData } from "@/lib/seo/structured-data";

/**
 * The marketing site is a single page. Each section owns its own `id`, which the header
 * navigation and the hero milestones link to.
 *
 * The page is deliberately focused: claim, the delivery process, the client workspace,
 * essential questions, then one conversion surface. Project case studies will live on
 * their own routes instead of competing with the home-page story.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ProcessStory />
      <DiagnosticOffer />
      <FaqList />
      <LeadSection />

      {/*
       * `ProfessionalService` and `FAQPage`, required by AGENTS.client.md §3. It sits on
       * this page rather than in the layout because the FAQ answers it declares are
       * visible on this route and only this route, a `FAQPage` block on the legal pages
       * would describe content that is not there. It renders no visible output and is not
       * part of the section list above.
       */}
      <JsonLd id="structured-data-home" data={homeStructuredData()} />
    </>
  );
}

import { Hero } from "@/features/hero/components/Hero";

/**
 * The marketing site is a single page. Sections are appended here as they are built;
 * each owns its own `id`, which the header navigation and the hero milestones link to.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
    </>
  );
}

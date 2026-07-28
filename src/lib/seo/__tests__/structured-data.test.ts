import { describe, expect, it } from "vitest";
import { faqEntries } from "@/features/faq/faq-content";
import { homeStructuredData } from "@/lib/seo/structured-data";
import {
  contact,
  siteDescription,
  siteName,
  siteTagline,
} from "@/lib/site-config";

/**
 * The rule AGENTS.md §9 states, structured data and visible content share one source, is
 * only enforceable if something checks it. These tests compare every emitted string against
 * the content module that renders it, so a reworded FAQ answer or a renamed service breaks
 * the build instead of quietly producing schema that contradicts the page.
 */

interface Graph {
  readonly "@context": string;
  readonly "@graph": readonly Record<string, unknown>[];
}

function graph(): Graph {
  return homeStructuredData() as unknown as Graph;
}

function node(type: string): Record<string, unknown> {
  const found = graph()["@graph"].find((entry) => entry["@type"] === type);
  if (found === undefined) throw new Error(`No ${type} node in the graph`);
  return found;
}

describe("home structured data", () => {
  it("is serializable and declares the schema.org context", () => {
    const serialized = JSON.stringify(homeStructuredData());

    expect(JSON.parse(serialized)).toEqual(homeStructuredData());
    expect(graph()["@context"]).toBe("https://schema.org");
  });

  it("emits both required types", () => {
    expect(graph()["@graph"].map((entry) => entry["@type"])).toEqual([
      "ProfessionalService",
      "FAQPage",
    ]);
  });

  describe("ProfessionalService", () => {
    it("takes its identity from the site configuration", () => {
      const service = node("ProfessionalService");

      expect(service.name).toBe(siteName);
      expect(service.description).toBe(siteDescription);
      expect(service.slogan).toBe(siteTagline);
    });

    it("does not publish sections that are no longer visible on the page", () => {
      const service = node("ProfessionalService");

      expect(service.founder).toBeUndefined();
      expect(service.hasOfferCatalog).toBeUndefined();
    });

    it("publishes the owner-supplied phone number in the form schema.org expects", () => {
      const service = node("ProfessionalService");

      // E.164, not the display form: a `telephone` value is machine-consumed.
      expect(service.telephone).toBe(contact.tel);
      expect(service.telephone).toMatch(/^\+972\d{9}$/);
    });

    it("does not invent a price range before the project scope is known", () => {
      const service = node("ProfessionalService");

      expect(service.priceRange).toBeUndefined();
    });

    it("states no address or rating it cannot verify", () => {
      const service = node("ProfessionalService");

      expect(service.address).toBeUndefined();
      expect(service.aggregateRating).toBeUndefined();
    });
  });

  describe("FAQPage", () => {
    it("repeats the visible questions and answers verbatim", () => {
      const questions = node("FAQPage").mainEntity as readonly {
        name: string;
        acceptedAnswer: { text: string };
      }[];

      expect(
        questions.map((question) => ({
          question: question.name,
          answer: question.acceptedAnswer.text,
        }))
      ).toEqual(
        faqEntries.map((entry) => ({ question: entry.question, answer: entry.answer }))
      );
    });
  });
});

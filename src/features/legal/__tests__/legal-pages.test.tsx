import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalDocumentPage } from "../components/LegalDocumentPage";
import { legalDocuments } from "../legal-content";
import { legalRoutes } from "@/lib/site-config";

/**
 * Invariants of the three legal routes.
 *
 * The one that matters most is the last: while a document is marked placeholder, the
 * visible draft notice must actually be on the page. AGENTS.client.md §9 records legal copy
 * as a pre-launch blocker, and a legal page that does not say it is a draft reads as a
 * binding commitment. That is exactly the failure a code comment cannot prevent.
 *
 * The launch checklist's own assertion is the inverse of it:
 * `legalDocuments.every((document) => !document.isPlaceholder)`.
 */
describe("legal documents", () => {
  it("covers every route the footer and the sitemap link to", () => {
    expect(legalDocuments.map((document) => document.path)).toEqual(
      legalRoutes.map((route) => route.href)
    );
  });

  it("invents no unverifiable contact or registration detail", () => {
    // A postal address, a registration number and an email address are all owner
    // decisions (AGENTS.client.md §10). None may appear anywhere in the copy.
    const body = legalDocuments
      .flatMap((document) => [
        document.lead,
        ...document.sections.flatMap((section) => [
          ...section.paragraphs,
          ...(section.bullets ?? []),
        ]),
      ])
      .join(" ");

    expect(body).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(body).not.toMatch(/\b0\d{1,2}-?\d{7}\b/);
  });

  describe.each(legalDocuments.map((document) => [document.title, document] as const))(
    "%s",
    (_title, legalDocument) => {
      it("renders exactly one h1, taken from the content module", () => {
        render(<LegalDocumentPage legalDocument={legalDocument} />);

        const headings = screen.getAllByRole("heading", { level: 1 });
        expect(headings).toHaveLength(1);
        expect(headings[0]).toHaveTextContent(legalDocument.title);
      });

      it("shows the draft notice while the copy is placeholder", () => {
        render(<LegalDocumentPage legalDocument={legalDocument} />);

        expect(legalDocument.isPlaceholder).toBe(true);
        expect(screen.getByRole("note")).toHaveTextContent(legalDocument.draftNotice);
      });

      it("lists every open owner decision on the page", () => {
        render(<LegalDocumentPage legalDocument={legalDocument} />);

        expect(legalDocument.openDecisions.length).toBeGreaterThan(0);
        for (const decision of legalDocument.openDecisions) {
          expect(screen.getByText(decision)).toBeInTheDocument();
        }
      });
    }
  );
});

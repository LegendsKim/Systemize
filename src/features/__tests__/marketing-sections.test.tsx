import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ValueProposition } from "../value/components/ValueProposition";
import { WorkflowComparison } from "../comparison/components/WorkflowComparison";
import { OffTheShelfComparison } from "../comparison/components/OffTheShelfComparison";
import { ServicesAccordion } from "../services/components/ServicesAccordion";
import { PortfolioGrid } from "../portfolio/components/PortfolioGrid";
import { FaqList } from "../faq/components/FaqList";
import { portfolioProjects } from "../portfolio/portfolio-content";
import { offTheShelfComparisonRows } from "../comparison/comparison-content";
import { serviceEntries } from "../services/services-content";
import { faqEntries } from "../faq/faq-content";

/**
 * Structural invariants of the marketing sections.
 *
 * These are the properties that a copy edit or a refactor could silently break and that
 * neither the type checker nor the architecture validator can see: the section is labelled
 * by its own heading, no section introduces a second `<h1>`, the disclosure controls are
 * native, the comparison table is a real table, and the portfolio links every approved
 * project to its detail route.
 */

const sections = [
  { name: "value", id: "value", labelledBy: "value-heading", render: ValueProposition },
  {
    name: "workflow comparison",
    id: "automation",
    labelledBy: "workflow-heading",
    render: WorkflowComparison,
  },
  {
    name: "services",
    id: "services",
    labelledBy: "services-heading",
    render: ServicesAccordion,
  },
  {
    name: "off-the-shelf comparison",
    id: "off-the-shelf",
    labelledBy: "shelf-heading",
    render: OffTheShelfComparison,
  },
  { name: "faq", id: "faq", labelledBy: "faq-heading", render: FaqList },
] as const;

describe.each(sections)("$name section", ({ id, labelledBy, render: Section }) => {
  it("is labelled by its own visible heading and starts at level 2", () => {
    const { container } = render(<Section />);

    const section = container.querySelector("section");
    expect(section).toHaveAttribute("id", id);
    expect(section).toHaveAttribute("aria-labelledby", labelledBy);

    // The hero owns the page's only `<h1>`.
    expect(container.querySelector("h1")).toBeNull();

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveAttribute("id", labelledBy);
  });
});

describe("services accordion", () => {
  it("uses native disclosure elements rather than a scripted control", () => {
    const { container } = render(<ServicesAccordion />);

    const entries = container.querySelectorAll("details > summary");
    expect(entries).toHaveLength(serviceEntries.length);
    // Collapsed by default: nothing is force-opened on first render.
    expect(container.querySelectorAll("details[open]")).toHaveLength(0);
  });
});

describe("faq list", () => {
  it("is an exclusive accordion, so only one answer can be open at a time", () => {
    const { container } = render(<FaqList />);

    // A shared `name` is what makes the group exclusive; without it every answer can be
    // open at once, which is the behaviour this replaced.
    const names = Array.from(container.querySelectorAll("details")).map(
      (entry) => entry.getAttribute("name")
    );
    expect(names).toHaveLength(faqEntries.length);
    expect(new Set(names)).toEqual(new Set(["faq"]));
  });

  it("renders every answer verbatim, so the visible text cannot drift from the JSON-LD", () => {
    const { container } = render(<FaqList />);

    expect(container.querySelectorAll("details > summary")).toHaveLength(
      faqEntries.length
    );

    /*
     * `textContent`, not `getByText`. Answers that quote money contain the non-breaking
     * spaces `Intl.NumberFormat` inserts around the currency symbol, and Testing Library's
     * default normaliser collapses those to ordinary spaces before matching — so a text
     * query would compare a normalised DOM string against an un-normalised expectation and
     * fail on strings that are in fact identical. Reading `textContent` compares the exact
     * characters, which is what "verbatim" has to mean when the JSON-LD copy is byte-for-
     * byte the same string.
     */
    const answers = Array.from(container.querySelectorAll(".faq-answer")).map(
      (node) => node.textContent
    );
    expect(answers).toEqual(faqEntries.map((entry) => entry.answer));
  });
});

describe("portfolio grid", () => {
  it("renders every approved product as a named detail-page link", () => {
    const { container } = render(<PortfolioGrid />);

    expect(container.querySelectorAll(".portfolio-card")).toHaveLength(
      portfolioProjects.length
    );

    for (const project of portfolioProjects) {
      expect(
        screen.getByRole("link", { name: new RegExp(project.name) })
      ).toHaveAttribute("href", `/projects/${project.slug}`);
      expect(screen.getAllByText(project.type).length).toBeGreaterThan(0);
    }
  });
});

describe("off-the-shelf comparison", () => {
  it("is a semantic table with a caption and scoped headers", () => {
    const { container } = render(<OffTheShelfComparison />);

    const table = screen.getByRole("table");
    expect(table.querySelector("caption")).not.toBeNull();
    expect(container.querySelectorAll("thead th[scope='col']")).toHaveLength(2);
    expect(container.querySelectorAll("tbody th[scope='row']")).toHaveLength(
      offTheShelfComparisonRows.length
    );
  });

  it("keeps the overflowing table reachable from the keyboard", () => {
    const { container } = render(<OffTheShelfComparison />);

    const scroller = container.querySelector(".shelf-scroll");
    expect(scroller).toHaveAttribute("role", "region");
    // Reachable, but never a positive tab index.
    expect(scroller).toHaveAttribute("tabindex", "0");
  });
});

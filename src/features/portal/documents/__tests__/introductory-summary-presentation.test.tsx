import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IntroductorySummaryView } from "../IntroductorySummaryView";
import { introductorySummaryContentSchema } from "../introductory-summary";
import {
  presentList,
  presentScope,
  presentTimeline,
} from "../introductory-summary-presentation";

const fullContent = introductorySummaryContentSchema.parse({
  schemaVersion: 1,
  title: "סיכום שיחת היכרות והצעה לאפיון ותכנון",
  companyName: "חברה לדוגמה",
  contacts: [],
  currentSituation: "העבודה מתבצעת כיום בין גיליונות ומערכת נפרדת.",
  operationalFriction: "הזנה כפולה יוצרת עיכובים וטעויות.",
  desiredOutcomes: "לקצר את זמן הטיפול ולשפר את השקיפות.",
  scopeAndAssumptions:
    "עובדות שאושרו:\nיש שלושה סוגי משתמשים.\nהנחות עבודה:\nקיים API זמין.\nגבולות ההיקף:\nתהליך המכירה בלבד.\nנכלל בשלב הנוכחי:\nצוות המכירות ומערכת ה-CRM.",
  openQuestions: "יש לאמת את זמינות ה-API.",
  discoveryIncludes: "מיפוי התהליך, הנתונים וההרשאות.",
  deliverables: "מסמך אפיון ותכנית עבודה מאושרת.",
  estimatedTimeline:
    "משך משוער:\nעשרה ימי עסקים.\nתלות בלקוח:\nקבלת דוגמאות ואישורים בזמן.",
  price: { amountAgorot: 450_025, currency: "ILS" },
  paymentTerms: "תשלום מראש לפני פתיחת השלב.",
  exclusions: "- פיתוח המערכת\n- רישיונות צד שלישי",
  validUntil: "2026-08-14T09:00:00.000Z",
  preparedAt: "2026-07-31T09:00:00.000Z",
});

describe("introductory summary presentation", () => {
  it("separates structured facts, assumptions, scope and dependencies", () => {
    expect(presentScope(fullContent.scopeAndAssumptions)).toMatchObject({
      confirmedFacts: "יש שלושה סוגי משתמשים.",
      assumptions: "קיים API זמין.",
      boundaries: "תהליך המכירה בלבד.",
      included: "צוות המכירות ומערכת ה-CRM.",
    });
    expect(presentTimeline(fullContent.estimatedTimeline)).toMatchObject({
      duration: "עשרה ימי עסקים.",
      dependencies: "קבלת דוגמאות ואישורים בזמן.",
    });
    expect(presentList(fullContent.exclusions)).toEqual([
      "פיתוח המערכת",
      "רישיונות צד שלישי",
    ]);
  });

  it("renders every source field once inside the consolidated client document", () => {
    render(
      <IntroductorySummaryView
        content={fullContent}
        projectName="מערכת המכירות"
        versionNumber={2}
        contentHash={"a".repeat(64)}
        publishedAt="2026-07-31T10:00:00.000Z"
      />
    );

    expect(screen.getByRole("heading", { name: "הבנת המצב הקיים" })).toBeVisible();
    expect(screen.getByText(fullContent.currentSituation)).toBeVisible();
    expect(screen.getAllByText(fullContent.currentSituation)).toHaveLength(1);
    expect(screen.getByText(fullContent.operationalFriction)).toBeVisible();
    expect(screen.getAllByText(fullContent.discoveryIncludes)).toHaveLength(1);
    expect(screen.getAllByText(fullContent.deliverables)).toHaveLength(1);
    expect(screen.getByText(/4,500/)).toBeVisible();
    expect(screen.getByText("פרויקט: מערכת המכירות")).toBeVisible();
  });

  it("loads an older sparse snapshot without placeholders or empty sections", () => {
    const legacyContent = introductorySummaryContentSchema.parse({
      schemaVersion: 1,
      title: "סיכום והצעה",
      companyName: "לקוח ותיק",
      currentSituation: "תהליך קיים שתועד בעבר.",
      operationalFriction: null,
      exclusions: null,
      price: { amountAgorot: 80000, currency: "ILS" },
      validUntil: "2026-08-14T09:00:00.000Z",
      preparedAt: "2026-07-31T09:00:00.000Z",
    });

    const { container } = render(
      <IntroductorySummaryView
        content={legacyContent}
        versionNumber={1}
        contentHash={"b".repeat(64)}
        publishedAt={null}
      />
    );

    expect(
      screen.getByText("אין שאלות פתוחות מהותיות בשלב זה.")
    ).toBeVisible();
    expect(screen.queryByRole("heading", { name: "מה אינו כלול" })).toBeNull();
    expect(container.textContent).not.toMatch(/undefined|null/);
  });

  it("keeps long text intact instead of truncating it in the renderer", () => {
    const longText = "תיאור עסקי מפורט שנשמר במלואו. ".repeat(80).trim();
    render(
      <IntroductorySummaryView
        content={{ ...fullContent, currentSituation: longText }}
        versionNumber={1}
        contentHash={"c".repeat(64)}
        publishedAt={null}
      />
    );

    expect(screen.getByText(longText)).toBeVisible();
  });
});

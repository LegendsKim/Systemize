import { z } from "zod";

const text = (label: string, max = 5_000) =>
  z.string().trim().min(2, `${label} קצר מדי.`).max(max, `${label} ארוך מדי.`);

/**
 * A field the owner may leave empty. An empty textarea posts `""`, which is not the same
 * thing as an absent field, so it is normalised to `undefined` before validation rather
 * than being stored as a blank string the renderer would then have to test for.
 */
const optionalText = (label: string, max = 5_000) =>
  z.preprocess(
    (value) => (typeof value === "string" && !value.trim() ? undefined : value),
    text(label, max).optional()
  );

const moneyInput = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/, `${label} חייב להיות סכום תקין בשקלים.`)
    .refine((value) => Number(value) > 0 && Number(value) <= 10_000_000, {
      message: `${label} מחוץ לטווח המותר.`,
    });

/**
 * A phase has no price of its own.
 *
 * The document used to carry a price per phase *and* a price per development option, which
 * left two different totals on the page with nothing stating which one the client owes.
 * The commercial figure now lives only on the option; phases describe how the work that
 * option covers is sequenced, and payment against them is governed by `paymentTerms`.
 */
const editorPhaseSchema = z.object({
  name: text("שם השלב", 120),
  outcome: text("תוצאת השלב", 1_000),
  deliverables: text("תוצרי השלב", 2_000),
  timeline: text("משך השלב", 240),
});

const editorOptionSchema = z.object({
  name: text("שם החלופה", 120),
  bestFor: text("למי החלופה מתאימה", 500),
  scope: text("היקף החלופה", 3_000),
  timeline: text("משך החלופה", 240),
  priceIls: moneyInput("מחיר החלופה"),
  recommended: z.boolean(),
});

const editorSupportSchema = z.object({
  name: text("שם מסלול התמיכה", 120),
  coverage: text("כיסוי התמיכה", 2_000),
  responseTime: text("זמן תגובה", 240),
  monthlyPriceIls: moneyInput("מחיר התמיכה החודשי"),
});

export const systemPlanEditorSchema = z
  .object({
    title: text("כותרת המסמך", 180),

    /* What the client is buying, and how both sides will know it worked. */
    executiveSummary: text("תקציר מנהלים"),
    successMetrics: text("מדדי הצלחה"),
    solutionOverview: text("תיאור הפתרון"),
    modulesAndWorkflows: text("מודולים ותהליכים", 8_000),

    /* The commercial decision, and the delivery sequence behind the recommended option. */
    developmentOptions: z.array(editorOptionSchema).min(2).max(4),
    phases: z.array(editorPhaseSchema).min(2).max(8),
    supportPlans: z.array(editorSupportSchema).min(1).max(4),
    smallFeatureFromIls: moneyInput("מחיר מינימום לפיצ'ר קטן"),
    largeFeatureFromIls: moneyInput("מחיר מינימום לפיצ'ר גדול"),
    hourlyRateIls: moneyInput("תעריף שעתי"),
    changePricingNotes: text("מדיניות תמחור שינויים", 2_000),

    /* Commercial terms. `exclusions` now also carries third-party costs: a client reading
       "what is not included" and "what you pay someone else for" was reading one idea
       twice, and splitting it invited the two lists to contradict each other. */
    clientResponsibilities: text("אחריות הלקוח"),
    assumptionsAndRisks: text("הנחות וסיכונים"),
    exclusions: text("מה אינו כלול"),
    warranty: text("אחריות לאחר מסירה", 1_500),
    paymentTerms: text("תנאי תשלום", 1_500),

    /* The technical appendix. Optional on purpose: these answer an engineer's questions,
       not the client's, so they belong at the back and only when they say something. */
    usersAndPermissions: optionalText("משתמשים והרשאות"),
    integrationsAndData: optionalText("אינטגרציות ונתונים"),
    architectureAndSecurity: optionalText("ארכיטקטורה ואבטחה"),
    uxAccessibilityAndDevices: optionalText("חוויית שימוש ונגישות"),
    migrationAndRollout: optionalText("הסבה והטמעה"),

    validityDays: z.coerce.number().int().min(1).max(90),
  })
  .strict()
  .superRefine((value, context) => {
    const recommended = value.developmentOptions.filter(
      (option) => option.recommended
    );
    if (recommended.length !== 1) {
      context.addIssue({
        code: "custom",
        path: ["developmentOptions"],
        message: "יש לסמן חלופת פיתוח מומלצת אחת בדיוק.",
      });
    }
  });

const moneySchema = z.object({
  amountAgorot: z.number().int().positive().max(1_000_000_000),
  currency: z.literal("ILS"),
});

/**
 * The stored shape.
 *
 * Fields the editor no longer collects stay declared here as optional rather than being
 * deleted. A published version is immutable and is re-parsed on every read, and
 * `document.repository` drops a version whose content fails validation — so removing a
 * field outright would make any document already saved under the longer format disappear
 * from the portal instead of simply rendering without it.
 */
export const systemPlanContentSchema = z.object({
  schemaVersion: z.literal(1),
  title: text("כותרת המסמך", 180),
  companyName: text("שם החברה", 160),
  projectName: text("שם הפרויקט", 160),
  executiveSummary: text("תקציר מנהלים"),
  successMetrics: text("מדדי הצלחה"),
  solutionOverview: text("תיאור הפתרון"),
  modulesAndWorkflows: text("מודולים ותהליכים", 8_000),
  businessGoals: optionalText("מטרות עסקיות"),
  usersAndPermissions: optionalText("משתמשים והרשאות"),
  integrationsAndData: optionalText("אינטגרציות ונתונים"),
  architectureAndSecurity: optionalText("ארכיטקטורה ואבטחה"),
  uxAccessibilityAndDevices: optionalText("חוויית שימוש ונגישות"),
  migrationAndRollout: optionalText("הסבה והטמעה"),
  phases: z.array(
    z.object({
      name: text("שם השלב", 120),
      outcome: text("תוצאת השלב", 1_000),
      deliverables: text("תוצרי השלב", 2_000),
      timeline: text("משך השלב", 240),
      price: moneySchema.optional(),
    })
  ).min(2).max(8),
  developmentOptions: z.array(
    z.object({
      name: text("שם החלופה", 120),
      bestFor: text("למי החלופה מתאימה", 500),
      scope: text("היקף החלופה", 3_000),
      timeline: text("משך החלופה", 240),
      price: moneySchema,
      recommended: z.boolean(),
    })
  ).min(2).max(4),
  supportPlans: z.array(
    z.object({
      name: text("שם מסלול התמיכה", 120),
      coverage: text("כיסוי התמיכה", 2_000),
      responseTime: text("זמן תגובה", 240),
      monthlyPrice: moneySchema,
    })
  ).min(1).max(4),
  changePricing: z.object({
    smallFeatureFrom: moneySchema,
    largeFeatureFrom: moneySchema,
    hourlyRate: moneySchema,
    notes: text("מדיניות תמחור שינויים", 2_000),
  }),
  clientResponsibilities: text("אחריות הלקוח"),
  assumptionsAndRisks: text("הנחות וסיכונים"),
  exclusions: text("מה אינו כלול"),
  warranty: text("אחריות לאחר מסירה", 1_500),
  paymentTerms: text("תנאי תשלום", 1_500),
  thirdPartyCosts: optionalText("עלויות צד שלישי"),
  preparedAt: z.string().datetime(),
  validUntil: z.string().datetime(),
});

export type SystemPlanEditorValues = z.output<typeof systemPlanEditorSchema>;
export type SystemPlanContent = z.infer<typeof systemPlanContentSchema>;
export type SystemPlanOption = SystemPlanContent["developmentOptions"][number];

/**
 * The option the whole document is priced around.
 *
 * The editor enforces exactly one recommendation, but a version stored before that rule
 * existed may have none, and the web view and the PDF must not disagree about which figure
 * is the offer. Falling back to the first option keeps both renderers on the same one.
 */
export function recommendedSystemPlanOption(
  content: SystemPlanContent
): SystemPlanOption {
  const [firstOption] = content.developmentOptions;
  if (!firstOption) {
    // Unreachable through the schema, which requires between two and four options. Stated
    // rather than asserted away, because the alternative is a document that shows no price.
    throw new Error("A system plan version must carry at least one development option.");
  }
  return content.developmentOptions.find((option) => option.recommended) ?? firstOption;
}

/** The technical appendix, in reading order, with the empty entries already removed. */
export function systemPlanAppendix(
  content: SystemPlanContent
): readonly { readonly label: string; readonly value: string }[] {
  const entries: readonly (readonly [string, string | undefined])[] = [
    ["מטרות עסקיות", content.businessGoals],
    ["משתמשים והרשאות", content.usersAndPermissions],
    ["נתונים ואינטגרציות", content.integrationsAndData],
    ["ארכיטקטורה, אבטחה ופרטיות", content.architectureAndSecurity],
    ["חוויית שימוש, נגישות ומכשירים", content.uxAccessibilityAndDevices],
    ["הסבה, הדרכה ועלייה לאוויר", content.migrationAndRollout],
  ];

  return entries.flatMap(([label, value]) =>
    value?.trim() ? [{ label, value: value.trim() }] : []
  );
}

function amount(value: string) {
  return {
    amountAgorot: Math.round(Number(value) * 100),
    currency: "ILS" as const,
  };
}

export function buildSystemPlanContent(input: {
  readonly editor: z.output<typeof systemPlanEditorSchema>;
  readonly companyName: string;
  readonly projectName: string;
  readonly now: Date;
}): SystemPlanContent {
  const validUntil = new Date(input.now);
  validUntil.setUTCDate(validUntil.getUTCDate() + input.editor.validityDays);

  return systemPlanContentSchema.parse({
    schemaVersion: 1,
    title: input.editor.title,
    companyName: input.companyName,
    projectName: input.projectName,
    executiveSummary: input.editor.executiveSummary,
    successMetrics: input.editor.successMetrics,
    solutionOverview: input.editor.solutionOverview,
    modulesAndWorkflows: input.editor.modulesAndWorkflows,
    usersAndPermissions: input.editor.usersAndPermissions,
    integrationsAndData: input.editor.integrationsAndData,
    architectureAndSecurity: input.editor.architectureAndSecurity,
    uxAccessibilityAndDevices: input.editor.uxAccessibilityAndDevices,
    migrationAndRollout: input.editor.migrationAndRollout,
    phases: input.editor.phases,
    developmentOptions: input.editor.developmentOptions.map((option) => ({
      ...option,
      price: amount(option.priceIls),
      priceIls: undefined,
    })),
    supportPlans: input.editor.supportPlans.map((plan) => ({
      ...plan,
      monthlyPrice: amount(plan.monthlyPriceIls),
      monthlyPriceIls: undefined,
    })),
    changePricing: {
      smallFeatureFrom: amount(input.editor.smallFeatureFromIls),
      largeFeatureFrom: amount(input.editor.largeFeatureFromIls),
      hourlyRate: amount(input.editor.hourlyRateIls),
      notes: input.editor.changePricingNotes,
    },
    clientResponsibilities: input.editor.clientResponsibilities,
    assumptionsAndRisks: input.editor.assumptionsAndRisks,
    exclusions: input.editor.exclusions,
    warranty: input.editor.warranty,
    paymentTerms: input.editor.paymentTerms,
    preparedAt: input.now.toISOString(),
    validUntil: validUntil.toISOString(),
  });
}

export function toSystemPlanEditorDefaults(
  content: SystemPlanContent | null
): SystemPlanEditorValues {
  if (content) {
    return {
      title: content.title,
      executiveSummary: content.executiveSummary,
      successMetrics: content.successMetrics,
      solutionOverview: content.solutionOverview,
      modulesAndWorkflows: content.modulesAndWorkflows,
      usersAndPermissions: content.usersAndPermissions,
      integrationsAndData: content.integrationsAndData,
      architectureAndSecurity: content.architectureAndSecurity,
      uxAccessibilityAndDevices: content.uxAccessibilityAndDevices,
      migrationAndRollout: content.migrationAndRollout,
      // A version stored under the older format carries a price per phase. It is read back
      // without it: the option now holds the only commercial figure in the document.
      phases: content.phases.map(({ price: _price, ...phase }) => phase),
      developmentOptions: content.developmentOptions.map((option) => ({
        ...option,
        priceIls: String(option.price.amountAgorot / 100),
      })),
      supportPlans: content.supportPlans.map((plan) => ({
        ...plan,
        monthlyPriceIls: String(plan.monthlyPrice.amountAgorot / 100),
      })),
      smallFeatureFromIls: String(
        content.changePricing.smallFeatureFrom.amountAgorot / 100
      ),
      largeFeatureFromIls: String(
        content.changePricing.largeFeatureFrom.amountAgorot / 100
      ),
      hourlyRateIls: String(content.changePricing.hourlyRate.amountAgorot / 100),
      changePricingNotes: content.changePricing.notes,
      clientResponsibilities: content.clientResponsibilities,
      assumptionsAndRisks: content.assumptionsAndRisks,
      // Third-party costs used to be their own field. On a version that still has one, the
      // text is appended to the exclusions so re-publishing does not silently drop it.
      exclusions: content.thirdPartyCosts
        ? `${content.exclusions}\n${content.thirdPartyCosts}`
        : content.exclusions,
      warranty: content.warranty,
      paymentTerms: content.paymentTerms,
      validityDays: Math.max(
        1,
        Math.round(
          (Date.parse(content.validUntil) - Date.parse(content.preparedAt)) /
            86_400_000
        )
      ),
    };
  }

  return {
    title: "מסמך תכנון מערכת והצעת פיתוח",
    executiveSummary: "",
    successMetrics: "",
    solutionOverview: "",
    modulesAndWorkflows: "",
    usersAndPermissions: undefined,
    integrationsAndData: undefined,
    architectureAndSecurity: undefined,
    uxAccessibilityAndDevices: undefined,
    migrationAndRollout: undefined,
    phases: [
      { name: "תכנון טכני והכנה", outcome: "", deliverables: "", timeline: "" },
      { name: "פיתוח ליבה", outcome: "", deliverables: "", timeline: "" },
      { name: "בדיקות והכנת השקה", outcome: "", deliverables: "", timeline: "" },
      { name: "הטמעה ועלייה לאוויר", outcome: "", deliverables: "", timeline: "" },
    ],
    developmentOptions: [
      { name: "MVP ממוקד", bestFor: "", scope: "", timeline: "", priceIls: "", recommended: false },
      { name: "פתרון מומלץ", bestFor: "", scope: "", timeline: "", priceIls: "", recommended: true },
      { name: "מערכת מורחבת", bestFor: "", scope: "", timeline: "", priceIls: "", recommended: false },
    ],
    supportPlans: [
      { name: "תחזוקה בסיסית", coverage: "", responseTime: "", monthlyPriceIls: "" },
      { name: "ליווי שוטף", coverage: "", responseTime: "", monthlyPriceIls: "" },
    ],
    smallFeatureFromIls: "",
    largeFeatureFromIls: "",
    hourlyRateIls: "",
    changePricingNotes:
      "כל שינוי מתומחר לאחר הגדרת היקף קצרה. המחירים המוצגים הם נקודת פתיחה ואינם התחייבות ללא אפיון השינוי.",
    clientResponsibilities: "",
    assumptionsAndRisks: "",
    exclusions:
      "רישיונות, שירותי ענן, הודעות, סליקה וספקי צד שלישי אינם כלולים אלא אם צוין אחרת.",
    warranty:
      "תיקון תקלות שנגרמו מהמימוש שסופק כלול בתקופת האחריות; שינוי דרישה או התנהגות חדשה מתומחרים בנפרד.",
    paymentTerms: "",
    validityDays: 14,
  };
}

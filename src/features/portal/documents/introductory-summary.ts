import { z } from "zod";

const boundedText = (label: string, max = 4_000) =>
  z
    .string()
    .trim()
    .min(2, `${label} חייב לכלול לפחות שני תווים.`)
    .max(max, `${label} ארוך מדי.`);

export const introductorySummaryFormSchema = z.object({
  projectId: z.string().uuid(),
  documentId: z.string().uuid(),
  versionId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  title: boundedText("כותרת המסמך", 160),
  currentSituation: boundedText("המצב הקיים"),
  operationalFriction: boundedText("הבעיות והחיכוך התפעולי"),
  desiredOutcomes: boundedText("התוצאות העסקיות הרצויות"),
  scopeAndAssumptions: boundedText("ההיקף וההנחות"),
  openQuestions: boundedText("השאלות הפתוחות"),
  discoveryIncludes: boundedText("תכולת האפיון והתכנון"),
  deliverables: boundedText("התוצרים"),
  estimatedTimeline: boundedText("לוח הזמנים", 1_000),
  priceIls: z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/, "יש להזין מחיר תקין בשקלים.")
    .transform((value) => Math.round(Number(value) * 100))
    .pipe(z.number().int().positive().max(100_000_000)),
  paymentTerms: boundedText("תנאי התשלום", 1_000),
  exclusions: boundedText("מה לא כלול"),
  validityDays: z.coerce.number().int().min(1).max(90),
});

const contactSnapshotSchema = z.object({
  fullName: boundedText("שם איש הקשר", 120),
  email: z.string().email().max(320),
  phone: z.string().trim().min(8).max(32),
});

export const introductorySummaryContentSchema = z.object({
  schemaVersion: z.literal(1),
  title: boundedText("כותרת המסמך", 160),
  companyName: boundedText("שם החברה", 160),
  contacts: z.array(contactSnapshotSchema).max(20),
  currentSituation: boundedText("המצב הקיים"),
  operationalFriction: boundedText("הבעיות והחיכוך התפעולי"),
  desiredOutcomes: boundedText("התוצאות העסקיות הרצויות"),
  scopeAndAssumptions: boundedText("ההיקף וההנחות"),
  openQuestions: boundedText("השאלות הפתוחות"),
  discoveryIncludes: boundedText("תכולת האפיון והתכנון"),
  deliverables: boundedText("התוצרים"),
  estimatedTimeline: boundedText("לוח הזמנים", 1_000),
  price: z.object({
    amountAgorot: z.number().int().positive().max(100_000_000),
    currency: z.literal("ILS"),
  }),
  paymentTerms: boundedText("תנאי התשלום", 1_000),
  exclusions: boundedText("מה לא כלול"),
  validUntil: z.string().datetime(),
  preparedAt: z.string().datetime(),
});

export type IntroductorySummaryContent = z.infer<
  typeof introductorySummaryContentSchema
>;

export type IntroductorySummaryFormValues = Omit<
  z.input<typeof introductorySummaryFormSchema>,
  "priceIls" | "validityDays"
> & {
  readonly priceIls: string;
  readonly validityDays: number;
};

export const introductorySummarySections = [
  { key: "currentSituation", title: "המצב הקיים" },
  { key: "operationalFriction", title: "בעיות וחיכוך תפעולי" },
  { key: "desiredOutcomes", title: "תוצאות עסקיות רצויות" },
  { key: "scopeAndAssumptions", title: "היקף ידוע והנחות" },
  { key: "openQuestions", title: "שאלות ועובדות שדורשות אימות" },
  { key: "discoveryIncludes", title: "מה כולל שלב האפיון והתכנון" },
  { key: "deliverables", title: "התוצרים שיתקבלו" },
  { key: "estimatedTimeline", title: "לוח זמנים משוער" },
  { key: "paymentTerms", title: "תנאי תשלום" },
  { key: "exclusions", title: "מה לא כלול" },
] as const satisfies readonly {
  key: keyof IntroductorySummaryContent;
  title: string;
}[];

export function buildIntroductorySummaryContent(input: {
  readonly parsed: z.output<typeof introductorySummaryFormSchema>;
  readonly companyName: string;
  readonly contacts: readonly {
    readonly fullName: string;
    readonly email: string;
    readonly phone: string;
  }[];
  readonly now: Date;
}): IntroductorySummaryContent {
  const validUntil = new Date(input.now);
  validUntil.setUTCDate(validUntil.getUTCDate() + input.parsed.validityDays);

  return introductorySummaryContentSchema.parse({
    schemaVersion: 1,
    title: input.parsed.title,
    companyName: input.companyName,
    contacts: input.contacts,
    currentSituation: input.parsed.currentSituation,
    operationalFriction: input.parsed.operationalFriction,
    desiredOutcomes: input.parsed.desiredOutcomes,
    scopeAndAssumptions: input.parsed.scopeAndAssumptions,
    openQuestions: input.parsed.openQuestions,
    discoveryIncludes: input.parsed.discoveryIncludes,
    deliverables: input.parsed.deliverables,
    estimatedTimeline: input.parsed.estimatedTimeline,
    price: {
      amountAgorot: input.parsed.priceIls,
      currency: "ILS",
    },
    paymentTerms: input.parsed.paymentTerms,
    exclusions: input.parsed.exclusions,
    validUntil: validUntil.toISOString(),
    preparedAt: input.now.toISOString(),
  });
}

export function toIntroductorySummaryFormDefaults(
  content: IntroductorySummaryContent | null
): Omit<
  IntroductorySummaryFormValues,
  "projectId" | "documentId" | "versionId" | "idempotencyKey"
> {
  if (!content) {
    return {
      title: "סיכום שיחת היכרות והצעה לאפיון ותכנון",
      currentSituation: "",
      operationalFriction: "",
      desiredOutcomes: "",
      scopeAndAssumptions: "",
      openQuestions: "",
      discoveryIncludes:
        "מיפוי תהליכים, הגדרת משתמשים והרשאות, מסכים מרכזיים, נתונים, אינטגרציות ותכנית יישום.",
      deliverables:
        "מסמך אפיון ותכנון מלא, חלופות פתרון, תכנית עבודה והצעת מחיר להקמת המערכת.",
      estimatedTimeline: "",
      priceIls: "",
      paymentTerms: "התשלום מבוצע מראש ופותח את שלב האפיון והתכנון.",
      exclusions:
        "פיתוח המערכת, רישיונות צד שלישי, הזנת נתונים והדרכות אינם כלולים בשלב זה אלא אם צוין אחרת.",
      validityDays: 14,
    };
  }

  return {
    title: content.title,
    currentSituation: content.currentSituation,
    operationalFriction: content.operationalFriction,
    desiredOutcomes: content.desiredOutcomes,
    scopeAndAssumptions: content.scopeAndAssumptions,
    openQuestions: content.openQuestions,
    discoveryIncludes: content.discoveryIncludes,
    deliverables: content.deliverables,
    estimatedTimeline: content.estimatedTimeline,
    priceIls: (content.price.amountAgorot / 100).toFixed(2),
    paymentTerms: content.paymentTerms,
    exclusions: content.exclusions,
    validityDays: Math.max(
      1,
      Math.round(
        (Date.parse(content.validUntil) - Date.parse(content.preparedAt)) /
          86_400_000
      )
    ),
  };
}

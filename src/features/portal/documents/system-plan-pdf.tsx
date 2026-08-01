import path from "node:path";
import type { PropsWithChildren, ReactNode } from "react";
import {
  Document,
  Font,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
  renderToBuffer,
  type TextProps,
} from "@react-pdf/renderer";
import { systemizeMarkGeometry } from "@/components/brand/systemize-mark-geometry";
import type { SystemPlanDocumentVersionSnapshot } from "@/server/repositories/document.repository";
import {
  recommendedSystemPlanOption,
  systemPlanAppendix,
} from "./system-plan";
import { pdfSafeText } from "./pdf-text";

Font.register({
  family: "Systemize",
  fonts: [
    { src: path.join(process.cwd(), "src", "assets", "fonts", "Heebo-Medium.ttf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "src", "assets", "fonts", "Heebo-Bold.ttf"), fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const palette = {
  ink: "#172226",
  body: "#3f4d51",
  muted: "#6d797d",
  line: "#dde3e3",
  soft: "#f4f7f7",
  accent: "#008f86",
  accentDark: "#00766f",
  accentSoft: "#edf8f6",
};

const styles = StyleSheet.create({
  /* Applied per text node by `RtlText` / `LtrText`; see the note on those components. */
  rtl: { direction: "rtl" },
  ltr: { direction: "ltr" },

  page: {
    paddingTop: 40,
    paddingRight: 48,
    paddingBottom: 58,
    paddingLeft: 48,
    backgroundColor: "#ffffff",
    color: palette.ink,
    fontFamily: "Systemize",
    fontSize: 9,
  },
  topRule: { position: "absolute", top: 0, right: 0, left: 0, height: 5, backgroundColor: palette.accent },
  bottomRule: { position: "absolute", right: 0, bottom: 0, left: 0, height: 3, backgroundColor: "#4bb8c4" },

  brandRow: { display: "flex", flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 24 },
  brandMark: { width: 22, height: 22 },
  brand: { color: palette.ink, fontSize: 9, fontWeight: 700, letterSpacing: 1.7 },

  eyebrow: { color: palette.accentDark, fontSize: 8, fontWeight: 700, letterSpacing: 0.5, textAlign: "right", marginBottom: 7 },
  title: { fontSize: 24, fontWeight: 700, lineHeight: 1.28, textAlign: "right", marginBottom: 11 },
  client: { fontSize: 12, fontWeight: 700, textAlign: "right", marginBottom: 3 },
  project: { color: palette.muted, fontSize: 10, textAlign: "right" },

  metaRow: { display: "flex", flexDirection: "row-reverse", gap: 12, marginTop: 22, paddingTop: 13, borderTopWidth: 1, borderTopColor: palette.line },
  metaItem: { flexGrow: 1 },
  metaLabel: { color: palette.muted, fontSize: 7.5, textAlign: "right", marginBottom: 3 },
  metaValue: { fontSize: 9.5, fontWeight: 700, textAlign: "right" },

  section: { display: "flex", flexDirection: "row-reverse", gap: 14, paddingTop: 20, paddingBottom: 20, borderTopWidth: 1, borderTopColor: palette.line },
  firstSection: { marginTop: 24, borderTopWidth: 0 },
  sectionNumber: { width: 24, paddingTop: 2, color: palette.accentDark, fontSize: 7.5, fontWeight: 700, textAlign: "right" },
  sectionBody: { flexBasis: 0, flexGrow: 1, flexShrink: 1 },
  sectionTitle: { width: "100%", fontSize: 14, fontWeight: 700, lineHeight: 1.3, textAlign: "right", marginBottom: 7 },
  subsectionTitle: { width: "100%", fontSize: 9.5, fontWeight: 700, textAlign: "right", marginBottom: 4 },
  paragraph: { width: "100%", color: palette.body, fontSize: 9, lineHeight: 1.65, textAlign: "right" },
  lead: { width: "100%", color: palette.muted, fontSize: 8.5, lineHeight: 1.6, textAlign: "right", marginBottom: 10 },

  emphasis: { marginTop: 11, paddingRight: 10, borderRightWidth: 2, borderRightColor: "#8dc9c4" },
  block: { marginTop: 11 },

  optionGrid: { display: "flex", flexDirection: "row-reverse", gap: 8, marginTop: 8 },
  option: { width: "32%", padding: 9, borderWidth: 1, borderColor: "#d7e2e1", borderRadius: 7 },
  optionRecommended: { borderColor: palette.accent, backgroundColor: palette.accentSoft },
  optionHead: { marginBottom: 6 },
  optionName: { fontSize: 10, fontWeight: 700, lineHeight: 1.35, textAlign: "right", marginBottom: 4 },
  optionBestFor: { color: palette.accentDark, fontSize: 7.5, lineHeight: 1.45, textAlign: "right", marginBottom: 5 },
  optionParagraph: { width: "100%", color: palette.body, fontSize: 8, lineHeight: 1.5, textAlign: "right" },
  price: { color: palette.accentDark, fontSize: 11, fontWeight: 700, textAlign: "right" },
  meta: { color: palette.muted, fontSize: 7.5, lineHeight: 1.4, textAlign: "right", marginTop: 5 },
  metaBlock: { color: palette.muted, fontSize: 8, textAlign: "right", marginTop: 11 },

  phase: { display: "flex", flexDirection: "row-reverse", gap: 9, marginTop: 9 },
  phaseNumber: { width: 15, color: palette.accentDark, fontSize: 8.5, fontWeight: 700, textAlign: "right" },
  phaseBody: { flexBasis: 0, flexGrow: 1, flexShrink: 1 },
  phaseHead: { display: "flex", flexDirection: "row-reverse", justifyContent: "space-between", gap: 10, marginBottom: 3 },
  phaseName: { width: "100%", fontSize: 9.5, fontWeight: 700, textAlign: "right" },
  phaseTimeline: { flexShrink: 0, color: palette.muted, fontSize: 8, textAlign: "left" },

  supportGrid: { display: "flex", flexDirection: "row-reverse", gap: 8, marginTop: 4 },
  support: { width: "32%", padding: 9, borderRadius: 6, backgroundColor: palette.soft },
  supportParagraph: { width: "100%", color: palette.body, fontSize: 8, lineHeight: 1.5, textAlign: "right" },
  supportPrice: { color: palette.accentDark, fontSize: 10, fontWeight: 700, textAlign: "right", marginBottom: 4 },

  definitionGrid: { display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", gap: 10, marginTop: 4 },
  definition: { width: "48%", paddingTop: 8, borderTopWidth: 1, borderTopColor: palette.line },
  assumption: { borderTopColor: "#d8b979" },

  appendixPage: { paddingTop: 40, paddingRight: 48, paddingBottom: 58, paddingLeft: 48, backgroundColor: "#ffffff", color: palette.ink, fontFamily: "Systemize", fontSize: 9 },
  appendixEntry: { marginTop: 13, paddingTop: 10, borderTopWidth: 1, borderTopColor: palette.line },

  verification: { marginTop: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: palette.line, color: palette.muted, fontSize: 6.5, textAlign: "left" },
  footer: { position: "absolute", right: 48, bottom: 24, left: 48, display: "flex", flexDirection: "row-reverse", justifyContent: "space-between", color: palette.muted, fontSize: 7 },
});

type DirectionalTextProps = PropsWithChildren<Omit<TextProps, "style">> & {
  readonly style?: Exclude<NonNullable<TextProps["style"]>, readonly unknown[]>;
};

/**
 * Every Hebrew string in the document goes through here.
 *
 * `direction` is not one of @react-pdf's inheritable style properties, so declaring `rtl`
 * on the page does not reach a text node: each one falls back to an LTR base level and runs
 * the bidi algorithm against the wrong paragraph direction. A Hebrew sentence then puts its
 * closing period on the right edge instead of the left, and an embedded Latin run such as
 * "MVP" lands on the wrong side of the words around it.
 */
/**
 * Both wrappers sanitise their text on the way through, so a character the embedded font
 * cannot draw can never reach the page. See `pdf-text.ts` for why that matters here and
 * nowhere else in the app.
 */
function drawable(children: ReactNode): ReactNode {
  if (typeof children === "string") return pdfSafeText(children);
  if (typeof children === "number") return String(children);
  if (
    Array.isArray(children) &&
    children.every((child) => typeof child === "string" || typeof child === "number")
  ) {
    return pdfSafeText(children.join(""));
  }
  return children;
}

function RtlText({ style, children, ...props }: DirectionalTextProps) {
  return (
    <Text style={style ? [styles.rtl, style] : styles.rtl} {...props}>
      {drawable(children)}
    </Text>
  );
}

/** The Latin counterpart, for numbering and the content hash. See `RtlText`. */
function LtrText({ style, children, ...props }: DirectionalTextProps) {
  return (
    <Text style={style ? [styles.ltr, style] : styles.ltr} {...props}>
      {drawable(children)}
    </Text>
  );
}

function BrandLockup() {
  return (
    <View style={styles.brandRow} wrap={false}>
      <Svg style={styles.brandMark} viewBox={systemizeMarkGeometry.viewBox}>
        <Path
          d={systemizeMarkGeometry.path}
          fill="none"
          stroke={palette.ink}
          strokeWidth={systemizeMarkGeometry.strokeWidth}
          strokeLinecap="butt"
          strokeLinejoin="miter"
        />
        <Path
          d={systemizeMarkGeometry.accentPath}
          fill="none"
          stroke={palette.accent}
          strokeWidth={systemizeMarkGeometry.strokeWidth}
          strokeLinecap="butt"
        />
      </Svg>
      <LtrText style={styles.brand}>SYSTEMIZE</LtrText>
    </View>
  );
}

const money = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const date = new Intl.DateTimeFormat("he-IL", {
  timeZone: "Asia/Jerusalem",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function Definition({
  label,
  value,
  assumption = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly assumption?: boolean;
}) {
  return (
    <View style={assumption ? [styles.definition, styles.assumption] : styles.definition}>
      <RtlText style={styles.subsectionTitle}>{label}</RtlText>
      <RtlText style={styles.paragraph}>{value}</RtlText>
    </View>
  );
}

function SystemPlanPdfDocument({
  version,
}: {
  readonly version: SystemPlanDocumentVersionSnapshot;
}) {
  const { content } = version;
  const recommended = recommendedSystemPlanOption(content);
  const appendix = systemPlanAppendix(content);
  const preparedDate = date.format(
    new Date(version.publishedAt ?? content.preparedAt)
  );
  const validUntil = date.format(new Date(content.validUntil));

  const footer = (
    <View style={styles.footer} fixed>
      <RtlText>מסמך פרטי · SYSTEMIZE</RtlText>
      <LtrText
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );

  return (
    <Document
      title={content.title}
      author="SYSTEMIZE"
      subject={`גרסה ${version.versionNumber}`}
      language="he-IL"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.topRule} fixed />
        <View style={styles.bottomRule} fixed />

        <BrandLockup />
        <RtlText style={styles.eyebrow}>תכנון מערכת והצעת פיתוח</RtlText>
        <RtlText style={styles.title}>{content.title}</RtlText>
        <RtlText style={styles.client}>{`עבור ${content.companyName}`}</RtlText>
        <RtlText style={styles.project}>{`פרויקט: ${content.projectName}`}</RtlText>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <RtlText style={styles.metaLabel}>תאריך הפקה</RtlText>
            <LtrText style={styles.metaValue}>{preparedDate}</LtrText>
          </View>
          <View style={styles.metaItem}>
            <RtlText style={styles.metaLabel}>גרסה</RtlText>
            <LtrText style={styles.metaValue}>
              {String(version.versionNumber)}
            </LtrText>
          </View>
          <View style={styles.metaItem}>
            <RtlText style={styles.metaLabel}>בתוקף עד</RtlText>
            <LtrText style={styles.metaValue}>{validUntil}</LtrText>
          </View>
        </View>

        <View style={[styles.section, styles.firstSection]} minPresenceAhead={90}>
          <LtrText style={styles.sectionNumber}>01</LtrText>
          <View style={styles.sectionBody}>
            <RtlText style={styles.sectionTitle}>מה נבנה ולמה</RtlText>
            <RtlText style={styles.paragraph}>{content.executiveSummary}</RtlText>
            <View style={styles.emphasis}>
              <RtlText style={styles.subsectionTitle}>איך נדע שהצלחנו</RtlText>
              <RtlText style={styles.paragraph}>{content.successMetrics}</RtlText>
            </View>
          </View>
        </View>

        <View style={styles.section} minPresenceAhead={90}>
          <LtrText style={styles.sectionNumber}>02</LtrText>
          <View style={styles.sectionBody}>
            <RtlText style={styles.sectionTitle}>מה המערכת תכלול</RtlText>
            <RtlText style={styles.paragraph}>{content.solutionOverview}</RtlText>
            <View style={styles.block}>
              <RtlText style={styles.subsectionTitle}>
                מודולים ותהליכי עבודה
              </RtlText>
              <RtlText style={styles.paragraph}>
                {content.modulesAndWorkflows}
              </RtlText>
            </View>
          </View>
        </View>

        <View style={styles.section} break minPresenceAhead={120}>
          <LtrText style={styles.sectionNumber}>03</LtrText>
          <View style={styles.sectionBody}>
            <RtlText style={styles.sectionTitle}>חלופות ומחיר</RtlText>
            <RtlText style={styles.lead}>
              המחיר במסמך הוא מחיר החלופה הנבחרת. הוא אינו מצטבר לשלבים שמפורטים
              אחריו — השלבים מתארים כיצד אותה עבודה מתקדמת.
            </RtlText>

            <View style={styles.optionGrid} wrap={false}>
              {content.developmentOptions.map((option) => (
                <View
                  key={option.name}
                  style={
                    option.recommended
                      ? [styles.option, styles.optionRecommended]
                      : styles.option
                  }
                  wrap={false}
                >
                  <View style={styles.optionHead}>
                    <RtlText style={styles.optionName}>
                      {option.recommended ? `${option.name} · מומלץ` : option.name}
                    </RtlText>
                    <RtlText style={styles.price}>
                      {money.format(option.price.amountAgorot / 100)}
                    </RtlText>
                  </View>
                  <RtlText style={styles.optionBestFor}>{option.bestFor}</RtlText>
                  <RtlText style={styles.optionParagraph}>{option.scope}</RtlText>
                  <RtlText style={styles.meta}>
                    {`משך משוער: ${option.timeline}`}
                  </RtlText>
                </View>
              ))}
            </View>

            <View style={styles.block}>
              <RtlText style={styles.subsectionTitle}>
                {`איך מתקדמת העבודה על ${recommended.name}`}
              </RtlText>
              {content.phases.map((phase, index) => (
                <View key={`${phase.name}-${index}`} style={styles.phase} wrap={false}>
                  <LtrText style={styles.phaseNumber}>{String(index + 1)}</LtrText>
                  <View style={styles.phaseBody}>
                    <View style={styles.phaseHead}>
                      <RtlText style={styles.phaseName}>{phase.name}</RtlText>
                      <RtlText style={styles.phaseTimeline}>
                        {phase.timeline}
                      </RtlText>
                    </View>
                    <RtlText style={styles.paragraph}>{phase.outcome}</RtlText>
                    <RtlText style={styles.meta}>{phase.deliverables}</RtlText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section} break minPresenceAhead={110}>
          <LtrText style={styles.sectionNumber}>04</LtrText>
          <View style={styles.sectionBody}>
            <RtlText style={styles.sectionTitle}>אחרי העלייה לאוויר</RtlText>
            <View style={styles.supportGrid} wrap={false}>
              {content.supportPlans.map((plan) => (
                <View key={plan.name} style={styles.support} wrap={false}>
                  <RtlText style={styles.subsectionTitle}>{plan.name}</RtlText>
                  <RtlText style={styles.supportPrice}>
                    {`${money.format(plan.monthlyPrice.amountAgorot / 100)} לחודש`}
                  </RtlText>
                  <RtlText style={styles.supportParagraph}>{plan.coverage}</RtlText>
                  <RtlText style={styles.meta}>
                    {`זמן תגובה: ${plan.responseTime}`}
                  </RtlText>
                </View>
              ))}
            </View>
            <RtlText style={styles.metaBlock}>
              {`פיצ'ר קטן החל מ־${money.format(content.changePricing.smallFeatureFrom.amountAgorot / 100)} · פיצ'ר גדול החל מ־${money.format(content.changePricing.largeFeatureFrom.amountAgorot / 100)} · שעת עבודה ${money.format(content.changePricing.hourlyRate.amountAgorot / 100)}`}
            </RtlText>
            <RtlText style={styles.paragraph}>
              {content.changePricing.notes}
            </RtlText>
          </View>
        </View>

        <View style={styles.section} minPresenceAhead={110}>
          <LtrText style={styles.sectionNumber}>05</LtrText>
          <View style={styles.sectionBody}>
            <RtlText style={styles.sectionTitle}>תנאים מסחריים</RtlText>
            <View style={styles.definitionGrid}>
              <Definition label="תנאי תשלום" value={content.paymentTerms} />
              <Definition label="מה אינו כלול" value={content.exclusions} />
              <Definition
                label="אחריות הלקוח"
                value={content.clientResponsibilities}
              />
              <Definition
                label="הנחות וסיכונים"
                value={content.assumptionsAndRisks}
                assumption
              />
              <Definition label="אחריות לאחר מסירה" value={content.warranty} />
              <Definition label="תוקף ההצעה" value={`עד ${validUntil}`} />
            </View>
          </View>
        </View>

        <LtrText style={styles.verification}>
          {`SHA-256: ${version.contentHash}`}
        </LtrText>

        {footer}
      </Page>

      {appendix.length > 0 && (
        <Page size="A4" style={styles.appendixPage} wrap>
          <View style={styles.topRule} fixed />
          <View style={styles.bottomRule} fixed />
          <BrandLockup />
          <RtlText style={styles.eyebrow}>נספח</RtlText>
          <RtlText style={styles.sectionTitle}>הפירוט הטכני</RtlText>
          <RtlText style={styles.lead}>
            הפירוט ההנדסי שמאחורי המערכת. אינו נדרש לקבלת ההחלטה המסחרית ואינו
            משנה את ההיקף או המחיר שבגוף המסמך.
          </RtlText>
          {appendix.map((entry) => (
            <View key={entry.label} style={styles.appendixEntry} minPresenceAhead={60}>
              <RtlText style={styles.subsectionTitle}>{entry.label}</RtlText>
              <RtlText style={styles.paragraph}>{entry.value}</RtlText>
            </View>
          ))}
          {footer}
        </Page>
      )}
    </Document>
  );
}

export async function renderSystemPlanPdf(
  version: SystemPlanDocumentVersionSnapshot
): Promise<Buffer> {
  return renderToBuffer(<SystemPlanPdfDocument version={version} />);
}

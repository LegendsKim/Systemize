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
import type { IntroductoryDocumentVersionSnapshot } from "@/server/repositories/document.repository";
import { systemizeMarkGeometry } from "@/components/brand/systemize-mark-geometry";
import {
  meaningfulText,
  presentList,
  presentScope,
  presentTimeline,
} from "./introductory-summary-presentation";
import { pdfSafeText } from "./pdf-text";

const regularFont = path.join(
  process.cwd(),
  "src",
  "assets",
  "fonts",
  "Heebo-Medium.ttf"
);
const boldFont = path.join(
  process.cwd(),
  "src",
  "assets",
  "fonts",
  "Heebo-Bold.ttf"
);

Font.register({
  family: "Systemize",
  fonts: [
    { src: regularFont, fontWeight: 400 },
    { src: boldFont, fontWeight: 700 },
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
  accentSoft: "#e8f5f3",
  warning: "#9a6a22",
};

const styles = StyleSheet.create({
  /* Applied per text node by `RtlText` / `LtrText`; see the note on those components. */
  rtl: {
    direction: "rtl",
  },
  ltr: {
    direction: "ltr",
  },
  page: {
    paddingTop: 48,
    paddingRight: 50,
    paddingBottom: 62,
    paddingLeft: 50,
    backgroundColor: "#ffffff",
    color: palette.ink,
    direction: "rtl",
    fontFamily: "Systemize",
  },
  topRule: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: 5,
    backgroundColor: palette.accent,
  },
  bottomRule: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: "#4bb8c4",
  },
  brandRow: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 7,
    marginBottom: 26,
  },
  brandMark: {
    width: 22,
    height: 22,
  },
  brand: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.7,
    color: palette.ink,
  },
  eyebrow: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 0.5,
    color: palette.accentDark,
    textAlign: "right",
    marginBottom: 7,
  },
  title: {
    fontSize: 25,
    fontWeight: 700,
    lineHeight: 1.28,
    textAlign: "right",
    marginBottom: 12,
  },
  client: {
    fontSize: 12,
    fontWeight: 700,
    textAlign: "right",
    marginBottom: 3,
  },
  project: {
    fontSize: 10,
    color: palette.muted,
    textAlign: "right",
  },
  metaRow: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 12,
    marginTop: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  metaItem: {
    flexGrow: 1,
  },
  metaLabel: {
    fontSize: 7.5,
    color: palette.muted,
    textAlign: "right",
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 9.5,
    fontWeight: 700,
    textAlign: "right",
  },
  section: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 14,
    paddingTop: 21,
    paddingBottom: 21,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  firstSection: {
    marginTop: 26,
    borderTopWidth: 0,
  },
  sectionNumber: {
    width: 24,
    paddingTop: 2,
    color: palette.accentDark,
    fontSize: 7.5,
    fontWeight: 700,
    textAlign: "right",
  },
  sectionBody: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  sectionTitle: {
    width: "100%",
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.3,
    textAlign: "right",
    marginBottom: 7,
  },
  subsectionTitle: {
    width: "100%",
    fontSize: 9.5,
    fontWeight: 700,
    textAlign: "right",
    marginBottom: 4,
  },
  paragraph: {
    width: "100%",
    fontSize: 9.5,
    lineHeight: 1.65,
    textAlign: "right",
    color: palette.body,
  },
  emphasis: {
    marginTop: 11,
    paddingRight: 10,
    borderRightWidth: 2,
    borderRightColor: "#8dc9c4",
  },
  definitionGrid: {
    display: "flex",
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  definition: {
    width: "48%",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  assumption: {
    borderTopColor: "#d8b979",
  },
  pairedAreas: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 12,
    marginTop: 12,
  },
  pairedArea: {
    flexGrow: 1,
    width: "48%",
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  questions: {
    marginTop: 4,
    marginBottom: 20,
    padding: 12,
    borderRadius: 7,
    backgroundColor: palette.soft,
  },
  compactTitle: {
    width: "100%",
    fontSize: 10,
    fontWeight: 700,
    textAlign: "right",
    marginBottom: 4,
  },
  commercial: {
    marginBottom: 22,
    padding: 17,
    borderWidth: 1,
    borderColor: "#a9d6d2",
    borderRadius: 9,
    backgroundColor: palette.accentSoft,
  },
  commercialHead: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#bfdeda",
  },
  commercialTitle: {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.3,
    textAlign: "right",
    marginBottom: 7,
  },
  price: {
    flexShrink: 0,
    color: palette.accentDark,
    fontSize: 22,
    fontWeight: 700,
    textAlign: "left",
  },
  commercialGrid: {
    display: "flex",
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 13,
  },
  commercialItem: {
    width: "47%",
  },
  list: {
    gap: 5,
  },
  listLine: {
    color: palette.body,
    fontSize: 9.5,
    lineHeight: 1.55,
    textAlign: "right",
  },
  nextStep: {
    marginTop: 4,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  verification: {
    marginTop: 22,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    color: palette.muted,
    fontSize: 6.5,
    textAlign: "left",
  },
  footer: {
    position: "absolute",
    bottom: 26,
    right: 50,
    left: 50,
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    color: palette.muted,
    fontSize: 7,
  },
});

/**
 * Every Hebrew string in the document goes through here.
 *
 * `direction` is not one of @react-pdf's inheritable style properties, so the `rtl` on the
 * page style never reaches a text node: each one falls back to an LTR base level and runs
 * the bidi algorithm against the wrong paragraph direction. A Hebrew sentence then puts its
 * closing period on the right edge instead of the left, and an embedded Latin run such as
 * "MVP" lands on the wrong side of the words around it.
 *
 * The previous attempt to force this \u2014 wrapping each string in U+200F \u2014 could not work,
 * because the base level is an argument to the algorithm rather than something a mark
 * inside the text can override. It also left two stray glyphs in every text node, which is
 * where the odd characters and the ragged first line came from.
 */
type DirectionalTextProps = PropsWithChildren<Omit<TextProps, "style">> & {
  readonly style?: Exclude<NonNullable<TextProps["style"]>, readonly unknown[]>;
};

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

/**
 * The Latin counterpart, for the brand mark, the numbering and the content hash.
 *
 * `ltr` is already the fallback, so this changes nothing on its own. It exists so that no
 * unwrapped text element survives in this file and the base level of every string is a
 * decision somebody made rather than a default nobody noticed — which is what
 * `pdf-direction.test.ts` enforces.
 */
function LtrText({ style, children, ...props }: DirectionalTextProps) {
  return (
    <Text style={style ? [styles.ltr, style] : styles.ltr} {...props}>
      {drawable(children)}
    </Text>
  );
}

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  timeZone: "Asia/Jerusalem",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const moneyFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
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
  if (!value) return null;
  return (
    <View style={[styles.definition, assumption ? styles.assumption : {}]}>
      <RtlText style={styles.subsectionTitle}>{label}</RtlText>
      <RtlText style={styles.paragraph}>{value}</RtlText>
    </View>
  );
}

function IntroductorySummaryPdfDocument({
  version,
}: {
  readonly version: IntroductoryDocumentVersionSnapshot;
}) {
  const { content } = version;
  const currentSituation = meaningfulText(content.currentSituation);
  const operationalFriction = meaningfulText(content.operationalFriction);
  const desiredOutcomes = meaningfulText(content.desiredOutcomes);
  const discoveryIncludes = meaningfulText(content.discoveryIncludes);
  const deliverables = meaningfulText(content.deliverables);
  const openQuestions = meaningfulText(content.openQuestions);
  const paymentTerms = meaningfulText(content.paymentTerms);
  const exclusions = meaningfulText(content.exclusions);
  const exclusionItems = presentList(exclusions);
  const scope = presentScope(content.scopeAndAssumptions);
  const timeline = presentTimeline(content.estimatedTimeline);
  const preparedDate = dateFormatter.format(
    new Date(version.publishedAt ?? content.preparedAt)
  );
  const validUntil = dateFormatter.format(new Date(content.validUntil));

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
        <View style={styles.brandRow}>
          <Svg
            style={styles.brandMark}
            viewBox={systemizeMarkGeometry.viewBox}
          >
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

        <RtlText style={styles.eyebrow}>הצעה לאפיון ותכנון</RtlText>
        <RtlText style={styles.title}>{content.title}</RtlText>
        <RtlText style={styles.client}>{`עבור ${content.companyName}`}</RtlText>
        {version.projectName && (
          <RtlText style={styles.project}>{`פרויקט: ${version.projectName}`}</RtlText>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <RtlText style={styles.metaLabel}>תאריך הפקה</RtlText>
            <LtrText style={styles.metaValue}>{preparedDate}</LtrText>
          </View>
          <View style={styles.metaItem}>
            <RtlText style={styles.metaLabel}>גרסת הצעה</RtlText>
            <LtrText style={styles.metaValue}>{String(version.versionNumber)}</LtrText>
          </View>
          <View style={styles.metaItem}>
            <RtlText style={styles.metaLabel}>בתוקף עד</RtlText>
            <LtrText style={styles.metaValue}>{validUntil}</LtrText>
          </View>
        </View>

        {(currentSituation || operationalFriction) && (
          <View style={[styles.section, styles.firstSection]} minPresenceAhead={100}>
            <LtrText style={styles.sectionNumber}>01</LtrText>
            <View style={styles.sectionBody}>
              <RtlText style={styles.sectionTitle}>הבנת המצב הקיים</RtlText>
              {currentSituation && (
                <RtlText style={styles.paragraph}>{currentSituation}</RtlText>
              )}
              {operationalFriction && (
                <View style={styles.emphasis}>
                  <RtlText style={styles.subsectionTitle}>
                    מוקדי החיכוך שעלו בשיחה
                  </RtlText>
                  <RtlText style={styles.paragraph}>
                    {operationalFriction}
                  </RtlText>
                </View>
              )}
            </View>
          </View>
        )}

        {desiredOutcomes && (
          <View style={styles.section} minPresenceAhead={90}>
            <LtrText style={styles.sectionNumber}>02</LtrText>
            <View style={styles.sectionBody}>
              <RtlText style={styles.sectionTitle}>
                מטרות ותוצאות רצויות
              </RtlText>
              <RtlText style={styles.paragraph}>{desiredOutcomes}</RtlText>
            </View>
          </View>
        )}

        {(scope.confirmedFacts ||
          scope.assumptions ||
          scope.boundaries ||
          scope.included ||
          scope.fallback) && (
          <View style={styles.section}>
            <LtrText style={styles.sectionNumber}>03</LtrText>
            <View style={styles.sectionBody}>
              <RtlText style={styles.sectionTitle}>
                היקף ראשוני והנחות
              </RtlText>
              {scope.fallback && (
                <RtlText style={styles.paragraph}>{scope.fallback}</RtlText>
              )}
              <View style={styles.definitionGrid}>
                <Definition label="עובדות שאושרו" value={scope.confirmedFacts} />
                <Definition
                  label="הנחות שדורשות אימות"
                  value={scope.assumptions}
                  assumption
                />
                <Definition label="גבולות ההיקף" value={scope.boundaries} />
                <Definition label="נכלל בשלב הנוכחי" value={scope.included} />
              </View>
            </View>
          </View>
        )}

        {(discoveryIncludes || deliverables) && (
          <View style={styles.section} minPresenceAhead={110}>
            <LtrText style={styles.sectionNumber}>04</LtrText>
            <View style={styles.sectionBody}>
              <RtlText style={styles.sectionTitle}>
                שלב האפיון והתכנון
              </RtlText>
              <RtlText style={styles.paragraph}>
                שלב מקצועי בתשלום שמתרגם את הצרכים וההחלטות לתשתית ברורה
                להמשך. הפיתוח עצמו אינו כלול בשלב זה.
              </RtlText>
              <View style={styles.pairedAreas} wrap={false}>
                {discoveryIncludes && (
                  <View style={styles.pairedArea}>
                    <RtlText style={styles.subsectionTitle}>
                      מה נעשה בשלב האפיון
                    </RtlText>
                    <RtlText style={styles.paragraph}>
                      {discoveryIncludes}
                    </RtlText>
                  </View>
                )}
                {deliverables && (
                  <View style={styles.pairedArea}>
                    <RtlText style={styles.subsectionTitle}>
                      מה תקבלו בסיום השלב
                    </RtlText>
                    <RtlText style={styles.paragraph}>{deliverables}</RtlText>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.questions} minPresenceAhead={70}>
          <RtlText style={styles.compactTitle}>שאלות פתוחות</RtlText>
          <RtlText style={styles.paragraph}>
            {openQuestions || "אין שאלות פתוחות מהותיות בשלב זה."}
          </RtlText>
        </View>

        <View style={styles.commercial} minPresenceAhead={180}>
          <View style={styles.commercialHead}>
            <View>
              <RtlText style={styles.eyebrow}>הצעה מסחרית</RtlText>
              <RtlText style={styles.commercialTitle}>
                שלב האפיון והתכנון
              </RtlText>
            </View>
            {/* `Intl` emits the shekel sign after the digits with its own bidi marks; at an
                LTR base level it lands between the number and the space instead. */}
            <RtlText style={styles.price}>
              {moneyFormatter.format(content.price.amountAgorot / 100)}
            </RtlText>
          </View>
          <View style={styles.commercialGrid}>
            {(timeline.duration || timeline.fallback) && (
              <Definition
                label="משך משוער"
                value={timeline.duration || timeline.fallback}
              />
            )}
            {paymentTerms && (
              <Definition label="תנאי תשלום" value={paymentTerms} />
            )}
            <Definition label="תוקף ההצעה" value={`עד ${validUntil}`} />
            {timeline.dependencies && (
              <Definition label="תלות בלקוח" value={timeline.dependencies} />
            )}
          </View>
        </View>

        {exclusions && (
          <View style={styles.section} minPresenceAhead={90}>
            <LtrText style={styles.sectionNumber}>05</LtrText>
            <View style={styles.sectionBody}>
              <RtlText style={styles.sectionTitle}>מה אינו כלול</RtlText>
              {exclusionItems.length > 0 ? (
                <View style={styles.list}>
                  {exclusionItems.map((item) => (
                    <RtlText key={item} style={styles.listLine}>
                      {`• ${item}`}
                    </RtlText>
                  ))}
                </View>
              ) : (
                <RtlText style={styles.paragraph}>{exclusions}</RtlText>
              )}
            </View>
          </View>
        )}

        <View style={styles.nextStep} minPresenceAhead={100}>
          <RtlText style={styles.eyebrow}>הפעולה הבאה</RtlText>
          <RtlText style={styles.sectionTitle}>
            מאשרים, מסדירים תשלום ויוצאים לדרך
          </RtlText>
          <RtlText style={styles.paragraph}>
            לאחר אישור ההצעה וביצוע התשלום, נתאם את תחילת שלב האפיון בהתאם
            לקבלת החומרים והאישורים הנדרשים.
          </RtlText>
        </View>

        <LtrText style={styles.verification}>
          {`SHA-256: ${version.contentHash}`}
        </LtrText>

        <View style={styles.footer} fixed>
          <RtlText>מסמך פרטי · SYSTEMIZE</RtlText>
          <LtrText
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export async function renderIntroductorySummaryPdf(
  version: IntroductoryDocumentVersionSnapshot
): Promise<Buffer> {
  return renderToBuffer(<IntroductorySummaryPdfDocument version={version} />);
}

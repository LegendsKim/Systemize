import path from "node:path";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
  type TextProps,
} from "@react-pdf/renderer";
import type { DocumentVersionSnapshot } from "@/server/repositories/document.repository";
import { introductorySummarySections } from "./introductory-summary";

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

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingRight: 52,
    paddingBottom: 58,
    paddingLeft: 52,
    backgroundColor: "#f7f8f8",
    color: "#172226",
    direction: "rtl",
  },
  brand: {
    fontFamily: "Systemize",
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: 1.8,
    color: "#008f86",
    textAlign: "right",
    marginBottom: 14,
  },
  title: {
    fontFamily: "Systemize",
    fontWeight: 700,
    fontSize: 25,
    lineHeight: 1.35,
    textAlign: "right",
    marginBottom: 6,
  },
  company: {
    fontFamily: "Systemize",
    fontSize: 13,
    color: "#536166",
    textAlign: "right",
    marginBottom: 24,
  },
  metaRow: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 8,
    marginBottom: 22,
  },
  metaBox: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#d9dfdf",
    borderRadius: 6,
    padding: 9,
    backgroundColor: "#ffffff",
  },
  metaLabel: {
    fontFamily: "Systemize",
    fontSize: 8,
    color: "#69767a",
    textAlign: "right",
    marginBottom: 3,
  },
  metaValue: {
    fontFamily: "Systemize",
    fontSize: 10,
    color: "#172226",
    textAlign: "right",
  },
  section: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e5",
  },
  sectionTitle: {
    fontFamily: "Systemize",
    fontWeight: 700,
    fontSize: 13,
    lineHeight: 1.4,
    textAlign: "right",
    marginBottom: 6,
    color: "#172226",
  },
  paragraph: {
    fontFamily: "Systemize",
    fontSize: 10.5,
    lineHeight: 1.65,
    textAlign: "right",
    color: "#344247",
  },
  contact: {
    fontFamily: "Systemize",
    fontSize: 9.5,
    lineHeight: 1.5,
    textAlign: "right",
    color: "#344247",
    marginBottom: 3,
  },
  commercial: {
    marginTop: 3,
    marginBottom: 18,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#e5f4f2",
    borderWidth: 1,
    borderColor: "#b8ded9",
  },
  price: {
    fontFamily: "Systemize",
    fontWeight: 700,
    fontSize: 21,
    textAlign: "right",
    color: "#007d75",
    marginVertical: 7,
  },
  hash: {
    fontFamily: "Systemize",
    fontSize: 6.5,
    color: "#667377",
    textAlign: "left",
    marginTop: 6,
  },
  footer: {
    position: "absolute",
    bottom: 26,
    right: 52,
    left: 52,
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    color: "#788488",
    fontSize: 7.5,
  },
  footerHebrew: {
    fontFamily: "Systemize",
  },
  footerLatin: {
    fontFamily: "Systemize",
  },
});

function BidiText({
  children,
  ...props
}: Omit<TextProps, "children"> & { readonly children: string }) {
  return <Text {...props}>{children}</Text>;
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

function IntroductorySummaryPdfDocument({
  version,
}: {
  readonly version: DocumentVersionSnapshot;
}) {
  const { content } = version;
  const contacts =
    content.contacts.length > 0
      ? content.contacts
          .map(
            (contact) =>
              `${contact.fullName} · ${contact.email} · ${contact.phone}`
          )
          .join("\n")
      : "לא הוגדרו אנשי קשר במסמך";

  return (
    <Document
      title={content.title}
      author="SYSTEMIZE"
      subject={`גרסה ${version.versionNumber}`}
      language="he-IL"
    >
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.brand}>SYSTEMIZE</Text>
        <BidiText style={styles.title}>{content.title}</BidiText>
        <BidiText style={styles.company}>{content.companyName}</BidiText>

        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <BidiText style={styles.metaLabel}>גרסה</BidiText>
            <Text style={styles.metaValue}>{String(version.versionNumber)}</Text>
          </View>
          <View style={styles.metaBox}>
            <BidiText style={styles.metaLabel}>
              {version.publishedAt ? "פורסם" : "הוכן"}
            </BidiText>
            <Text style={styles.metaValue}>
              {dateFormatter.format(
                new Date(version.publishedAt ?? content.preparedAt)
              )}
            </Text>
          </View>
          <View style={styles.metaBox}>
            <BidiText style={styles.metaLabel}>בתוקף עד</BidiText>
            <Text style={styles.metaValue}>
              {dateFormatter.format(new Date(content.validUntil))}
            </Text>
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <BidiText style={styles.sectionTitle}>הלקוח ואנשי הקשר</BidiText>
          <BidiText style={styles.contact}>{contacts}</BidiText>
        </View>

        {introductorySummarySections.slice(0, 8).map((section) => (
          <View key={section.key} style={styles.section} wrap={false}>
            <BidiText style={styles.sectionTitle}>{section.title}</BidiText>
            <BidiText style={styles.paragraph}>
              {String(content[section.key])}
            </BidiText>
          </View>
        ))}

        <View style={styles.commercial} wrap={false}>
          <BidiText style={styles.sectionTitle}>מחיר ותנאים</BidiText>
          <Text style={styles.price}>
            {moneyFormatter.format(content.price.amountAgorot / 100)}
          </Text>
          <BidiText style={styles.paragraph}>{content.paymentTerms}</BidiText>
        </View>

        <View style={styles.section} wrap={false}>
          <BidiText style={styles.sectionTitle}>מה לא כלול</BidiText>
          <BidiText style={styles.paragraph}>{content.exclusions}</BidiText>
        </View>

        <View style={styles.section} wrap={false}>
          <BidiText style={styles.sectionTitle}>מזהה אימות SHA-256</BidiText>
          <Text style={styles.hash}>{version.contentHash}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerHebrew}>מסמך פרטי · SYSTEMIZE</Text>
          <Text
            style={styles.footerLatin}
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
  version: DocumentVersionSnapshot
): Promise<Buffer> {
  return renderToBuffer(<IntroductorySummaryPdfDocument version={version} />);
}

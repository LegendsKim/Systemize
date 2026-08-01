export function meaningfulText(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export interface ScopePresentation {
  readonly confirmedFacts: string;
  readonly assumptions: string;
  readonly boundaries: string;
  readonly included: string;
  readonly fallback: string;
}

export interface TimelinePresentation {
  readonly duration: string;
  readonly dependencies: string;
  readonly fallback: string;
}

function parseLabeledText(
  value: string,
  labels: Readonly<Record<string, string>>
): { readonly values: Readonly<Record<string, string>>; readonly fallback: string } {
  const collected: Record<string, string[]> = {};
  const fallback: string[] = [];
  let activeKey: string | null = null;

  for (const rawLine of value.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const labelMatch = line.match(/^([^:：]+)[:：]\s*(.*)$/);
    const normalizedLabel = labelMatch?.[1]?.trim();
    const matchedKey = normalizedLabel ? labels[normalizedLabel] : undefined;

    if (matchedKey) {
      activeKey = matchedKey;
      collected[matchedKey] ??= [];
      const inlineValue = labelMatch?.[2]?.trim();
      if (inlineValue) collected[matchedKey].push(inlineValue);
      continue;
    }

    if (activeKey) {
      collected[activeKey]?.push(line);
    } else {
      fallback.push(line);
    }
  }

  return {
    values: Object.fromEntries(
      Object.entries(collected).map(([key, lines]) => [key, lines.join("\n")])
    ),
    fallback: fallback.join("\n"),
  };
}

export function presentScope(value: string): ScopePresentation {
  const parsed = parseLabeledText(value, {
    "עובדות שאושרו": "confirmedFacts",
    עובדות: "confirmedFacts",
    "הנחות עבודה": "assumptions",
    הנחות: "assumptions",
    "גבולות ההיקף": "boundaries",
    "היקף ראשוני": "boundaries",
    "נכלל בשלב הנוכחי": "included",
    "משתמשים, תהליכים ומערכות שנכללים": "included",
  });

  const hasStructuredContent = Object.keys(parsed.values).length > 0;
  return {
    confirmedFacts: parsed.values.confirmedFacts ?? "",
    assumptions: parsed.values.assumptions ?? "",
    boundaries: parsed.values.boundaries ?? "",
    included: parsed.values.included ?? "",
    fallback: hasStructuredContent ? parsed.fallback : meaningfulText(value),
  };
}

export function presentTimeline(value: string): TimelinePresentation {
  const parsed = parseLabeledText(value, {
    "משך משוער": "duration",
    "משך העבודה": "duration",
    "תלות בלקוח": "dependencies",
    "תלויות מרכזיות": "dependencies",
  });

  const hasStructuredContent = Object.keys(parsed.values).length > 0;
  return {
    duration: parsed.values.duration ?? "",
    dependencies: parsed.values.dependencies ?? "",
    fallback: hasStructuredContent ? parsed.fallback : meaningfulText(value),
  };
}

export function presentList(value: string): readonly string[] {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*•]\s*/, ""))
    .filter(Boolean);

  return lines.length > 1 ? lines : [];
}

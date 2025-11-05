type PlaceholderPattern = {
  regex: RegExp;
  strip: (raw: string) => string;
};

const patterns: PlaceholderPattern[] = [
  {
    regex: /\{\{([^{}]+)\}\}/g,
    strip: (raw) => raw.slice(2, -2),
  },
  {
    regex: /\[\[([^\[\]]+)\]\]/g,
    strip: (raw) => raw.slice(2, -2),
  },
  {
    regex: /<<([^<>]+)>>/g,
    strip: (raw) => raw.slice(2, -2),
  },
  {
    regex: /<([^<>]+)>/g,
    strip: (raw) => raw.slice(1, -1),
  },
  {
    regex: /\[([^\[\]]+)\]/g,
    strip: (raw) => raw.slice(1, -1),
  },
  {
    regex: /__([^_]+?)__/g,
    strip: (raw) => raw.replace(/^_+|_+$/g, ""),
  },
  {
    regex: /\*\*([^*]+?)\*\*/g,
    strip: (raw) => raw.replace(/^\*+|\*+$/g, ""),
  },
];

const DATE_LIKE_KEYWORDS = [
  "date",
  "effective date",
  "closing date",
  "execution date",
  "maturity date",
  "issuance date",
  "signature date",
];

export const isDateLabel = (label: string) =>
  DATE_LIKE_KEYWORDS.some((keyword) =>
    label.toLowerCase().includes(keyword),
  );

const sanitizeValue = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, "")
    .trim();

const isReasonablePlaceholder = (value: string) => {
  if (!/[a-z0-9]/i.test(value)) {
    return false;
  }

  if (/https?:\/\//i.test(value)) {
    return false;
  }

  if (value.length > 120) {
    return false;
  }

  const words = value.split(" ").filter(Boolean);
  if (words.length === 0 || words.length > 18) {
    return false;
  }

  return true;
};

const deriveContextLabel = (
  text: string,
  startIndex: number,
  raw: string,
): string | null => {
  const beforeWindow = text.slice(Math.max(0, startIndex - 160), startIndex);
  const afterWindow = text.slice(startIndex + raw.length, startIndex + raw.length + 160);

  const aliasAfter = afterWindow.match(
    /^\s*\(\s*the\s+["“]([^"”]+)["”]\s*\)/i,
  );
  if (aliasAfter && aliasAfter[1]) {
    return aliasAfter[1];
  }

  const aliasBefore = beforeWindow.match(/["“]([^"”]+)["”]\s*$/);
  if (aliasBefore && aliasBefore[1]) {
    return aliasBefore[1];
  }

  const titledBefore = beforeWindow.match(
    /(the|a|an)\s+([A-Za-z][A-Za-z0-9\s\-']{2,80})\s*$/i,
  );
  if (titledBefore && titledBefore[2]) {
    return titledBefore[2];
  }

  const trailingWords = beforeWindow
    .replace(/[\r\n]+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(-6)
    .join(" ");

  const cleanedTrailing = trailingWords
    .replace(/[^\p{L}\p{N}\s\-']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleanedTrailing && /[a-z0-9]/i.test(cleanedTrailing)) {
    return cleanedTrailing;
  }

  return null;
};

export type Placeholder = {
  id: string;
  raw: string;
  label: string;
  question: string;
};

const slugFromLabel = (label: string, sequence: number) => {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base ? `${base}-${sequence}` : `field-${sequence}`;
};

const formatLabel = (value: string) => {
  const cleaned = value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "Field";
  }

  return cleaned
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const buildQuestion = (label: string) => {
  if (!label) {
    return "Please provide a value.";
  }

  if (isDateLabel(label)) {
    return "Please provide the date (YYYY-MM-DD).";
  }

  return `Please provide the ${label}.`;
};

export const extractPlaceholders = (text: string): Placeholder[] => {
  const ordered: Placeholder[] = [];
  const seen = new Set<string>();
  let sequence = 1;

  for (const { regex, strip } of patterns) {
    const pattern = new RegExp(regex.source, regex.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const raw = match[0];
      const baseValue = sanitizeValue(strip(raw));

      let derivedValue = baseValue;
      if (!isReasonablePlaceholder(baseValue)) {
        const contextLabel = deriveContextLabel(text, match.index, raw);
        if (!contextLabel) {
          continue;
        }
        derivedValue = contextLabel;
      }

      if (!derivedValue) {
        continue;
      }

      const normalized = derivedValue.toLowerCase();
      if (seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      const label = formatLabel(derivedValue);
      ordered.push({
        id: slugFromLabel(label, sequence),
        raw,
        label,
        question: buildQuestion(label),
      });
      sequence += 1;
    }
  }

  return ordered;
};

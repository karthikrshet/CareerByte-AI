export interface ExtractedSalary {
  min?: number;
  max?: number;
  currency: string;
  period: "yearly" | "monthly" | "hourly" | "unknown";
  raw: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
};

function parseAmount(value: string): number | undefined {
  const cleaned = value.replace(/,/g, "").trim();
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(k|K)?/);
  if (!match) return undefined;

  let amount = parseFloat(match[1]);
  if (match[2]) amount *= 1000;
  return Math.round(amount);
}

function detectPeriod(text: string): ExtractedSalary["period"] {
  const lower = text.toLowerCase();
  if (/per\s*hour|\/hr|hourly/i.test(lower)) return "hourly";
  if (/per\s*month|monthly|\/mo/i.test(lower)) return "monthly";
  if (/per\s*year|annual|yearly|\/yr/i.test(lower)) return "yearly";
  return "unknown";
}

function detectCurrency(text: string): string {
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (text.includes(symbol)) return code;
  }
  const codeMatch = text.match(/\b(USD|EUR|GBP|CAD|AUD|INR|JPY)\b/i);
  return codeMatch ? codeMatch[1].toUpperCase() : "USD";
}

function annualize(
  amount: number,
  period: ExtractedSalary["period"],
): number {
  if (period === "hourly") return Math.round(amount * 2080);
  if (period === "monthly") return Math.round(amount * 12);
  return amount;
}

export function extractSalary(text: string): ExtractedSalary | null {
  if (!text?.trim()) return null;

  const raw = text.trim();
  const period = detectPeriod(raw);
  const currency = detectCurrency(raw);

  // Range: $120,000 - $150,000 or $120k-$150k
  const rangeMatch = raw.match(
    /([\$€£¥]?\s*\d[\d,]*(?:\.\d+)?\s*[kK]?)\s*[-–—to]+\s*([\$€£¥]?\s*\d[\d,]*(?:\.\d+)?\s*[kK]?)/i,
  );

  if (rangeMatch) {
    const min = parseAmount(rangeMatch[1]);
    const max = parseAmount(rangeMatch[2]);
    if (min !== undefined && max !== undefined) {
      return {
        min: annualize(min, period),
        max: annualize(max, period),
        currency,
        period: period === "unknown" ? "yearly" : period,
        raw,
      };
    }
  }

  // Single value: $130,000/year
  const singleMatch = raw.match(/([\$€£¥]?\s*\d[\d,]*(?:\.\d+)?\s*[kK]?)/);
  if (singleMatch) {
    const amount = parseAmount(singleMatch[1]);
    if (amount !== undefined) {
      const annual = annualize(amount, period);
      return {
        min: annual,
        max: annual,
        currency,
        period: period === "unknown" ? "yearly" : period,
        raw,
      };
    }
  }

  return null;
}

export function enrichListingWithSalary<T extends { description: string; salaryRaw?: string; salaryMin?: number; salaryMax?: number; salaryCurrency?: string; salaryPeriod?: string }>(
  listing: T,
): T {
  if (listing.salaryMin !== undefined || listing.salaryMax !== undefined) {
    return listing;
  }

  const salaryText = listing.salaryRaw ?? listing.description.slice(0, 500);
  const extracted = extractSalary(salaryText);
  if (!extracted) return listing;

  return {
    ...listing,
    salaryMin: extracted.min,
    salaryMax: extracted.max,
    salaryCurrency: extracted.currency,
    salaryPeriod: extracted.period === "unknown" ? "yearly" : extracted.period,
    salaryRaw: extracted.raw,
  };
}

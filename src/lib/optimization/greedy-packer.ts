export interface PackableKeyword {
  text: string;
  trafficScore: number;
}

export interface PackResult {
  selected: string[];
  totalTraffic: number;
  charCount: number;
  title: string;
}

const SEPARATORS = [' - ', ' | ', ' : '];

export function greedyPackKeywords(
  keywords: PackableKeyword[],
  maxLength: number = 200,
  separator: string = SEPARATORS[0],
): PackResult {
  if (keywords.length === 0) {
    return { selected: [], totalTraffic: 0, charCount: 0, title: '' };
  }

  const scored = keywords
    .filter((k) => k.text.trim().length > 0)
    .map((k) => ({
      text: k.text.trim(),
      trafficScore: k.trafficScore ?? 0,
      efficiency: (k.trafficScore ?? 0) / Math.max(1, k.text.trim().length),
    }))
    .sort((a, b) => b.efficiency - a.efficiency);

  const selected: string[] = [];
  let totalTraffic = 0;
  let charCount = 0;

  for (const kw of scored) {
    const addedLength = selected.length === 0
      ? kw.text.length
      : separator.length + kw.text.length;

    if (charCount + addedLength > maxLength) continue;

    selected.push(kw.text);
    totalTraffic += kw.trafficScore;
    charCount += addedLength;
  }

  const title = selected.join(separator);

  return { selected, totalTraffic, charCount, title };
}

export function computeCoverage(
  titleText: string,
  allKeywords: PackableKeyword[],
): { covered: string[]; uncovered: string[]; percentage: number; trafficCovered: number; trafficTotal: number } {
  const lower = titleText.toLowerCase();
  const covered: string[] = [];
  const uncovered: string[] = [];
  let trafficCovered = 0;
  let trafficTotal = 0;

  for (const kw of allKeywords) {
    trafficTotal += kw.trafficScore ?? 0;
    if (lower.includes(kw.text.toLowerCase())) {
      covered.push(kw.text);
      trafficCovered += kw.trafficScore ?? 0;
    } else {
      uncovered.push(kw.text);
    }
  }

  const percentage = allKeywords.length > 0
    ? Math.round((covered.length / allKeywords.length) * 100)
    : 0;

  return { covered, uncovered, percentage, trafficCovered, trafficTotal };
}

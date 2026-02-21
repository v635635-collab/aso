import prisma from '@/lib/prisma';
import { withCronWrapper } from '../wrapper';

interface AutoApplyRule {
  field?: string;
  contains?: string;
  regex?: string;
  minTrafficScore?: number;
  maxTrafficScore?: number;
  category?: string;
  status?: string;
}

function matchesRule(entity: Record<string, unknown>, rule: AutoApplyRule): boolean {
  if (rule.field && rule.contains) {
    const val = String(entity[rule.field] ?? '').toLowerCase();
    if (!val.includes(rule.contains.toLowerCase())) return false;
  }

  if (rule.field && rule.regex) {
    const val = String(entity[rule.field] ?? '');
    try {
      if (!new RegExp(rule.regex, 'i').test(val)) return false;
    } catch {
      return false;
    }
  }

  if (rule.minTrafficScore != null) {
    const score = Number(entity.trafficScore ?? 0);
    if (score < rule.minTrafficScore) return false;
  }

  if (rule.maxTrafficScore != null) {
    const score = Number(entity.trafficScore ?? 0);
    if (score > rule.maxTrafficScore) return false;
  }

  if (rule.category) {
    if (String(entity.category ?? '').toLowerCase() !== rule.category.toLowerCase())
      return false;
  }

  if (rule.status) {
    if (String(entity.status ?? '').toLowerCase() !== rule.status.toLowerCase())
      return false;
  }

  return true;
}

export async function autoTaggerJob(): Promise<void> {
  await withCronWrapper('auto-tagger', async () => {
    const taxonomies = await prisma.tagTaxonomy.findMany({
      where: {
        NOT: { autoApplyRules: { equals: {} } },
      },
    });

    if (taxonomies.length === 0) {
      return { itemsProcessed: 0, metadata: { message: 'No auto-apply rules found' } };
    }

    let tagged = 0;

    const untaggedKeywords = await prisma.keyword.findMany({
      where: { tags: { isEmpty: true } },
      select: {
        id: true,
        text: true,
        normalizedText: true,
        trafficScore: true,
        sap: true,
        competition: true,
      },
    });

    for (const kw of untaggedKeywords) {
      const matchingTags: string[] = [];
      for (const tax of taxonomies) {
        const rules = tax.autoApplyRules as AutoApplyRule | AutoApplyRule[];
        const ruleList = Array.isArray(rules) ? rules : [rules];
        for (const rule of ruleList) {
          if (matchesRule(kw as unknown as Record<string, unknown>, rule)) {
            matchingTags.push(tax.tag);
            break;
          }
        }
      }
      if (matchingTags.length > 0) {
        await prisma.keyword.update({
          where: { id: kw.id },
          data: { tags: matchingTags },
        });
        tagged++;
      }
    }

    const untaggedApps = await prisma.app.findMany({
      where: { tags: { isEmpty: true } },
      select: { id: true, name: true, category: true, status: true },
    });

    for (const app of untaggedApps) {
      const matchingTags: string[] = [];
      for (const tax of taxonomies) {
        const rules = tax.autoApplyRules as AutoApplyRule | AutoApplyRule[];
        const ruleList = Array.isArray(rules) ? rules : [rules];
        for (const rule of ruleList) {
          if (matchesRule(app as unknown as Record<string, unknown>, rule)) {
            matchingTags.push(tax.tag);
            break;
          }
        }
      }
      if (matchingTags.length > 0) {
        await prisma.app.update({
          where: { id: app.id },
          data: { tags: matchingTags },
        });
        tagged++;
      }
    }

    const untaggedNiches = await prisma.niche.findMany({
      where: { tags: { isEmpty: true } },
      select: { id: true, name: true, displayName: true },
    });

    for (const niche of untaggedNiches) {
      const matchingTags: string[] = [];
      for (const tax of taxonomies) {
        const rules = tax.autoApplyRules as AutoApplyRule | AutoApplyRule[];
        const ruleList = Array.isArray(rules) ? rules : [rules];
        for (const rule of ruleList) {
          if (matchesRule(niche as unknown as Record<string, unknown>, rule)) {
            matchingTags.push(tax.tag);
            break;
          }
        }
      }
      if (matchingTags.length > 0) {
        await prisma.niche.update({
          where: { id: niche.id },
          data: { tags: matchingTags },
        });
        tagged++;
      }
    }

    return {
      itemsProcessed: tagged,
      metadata: {
        keywords: untaggedKeywords.length,
        apps: untaggedApps.length,
        niches: untaggedNiches.length,
        taxonomyRules: taxonomies.length,
      },
    };
  });
}

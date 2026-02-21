import prisma from '@/lib/prisma';
import type { TagTaxonomy } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export async function getTaxonomy(): Promise<TagTaxonomy[]> {
  return prisma.tagTaxonomy.findMany({
    orderBy: [{ category: 'asc' }, { tag: 'asc' }],
  });
}

export async function createTag(data: {
  tag: string;
  category: string;
  displayName: string;
  parentTag?: string;
  synonyms?: string[];
  autoApplyRules?: Record<string, unknown>;
  color?: string;
}): Promise<TagTaxonomy> {
  return prisma.tagTaxonomy.create({
    data: {
      tag: data.tag.toLowerCase().replace(/\s+/g, '-'),
      category: data.category,
      displayName: data.displayName,
      parentTag: data.parentTag,
      synonyms: data.synonyms ?? [],
      autoApplyRules: (data.autoApplyRules ?? {}) as Prisma.InputJsonValue,
      color: data.color,
    },
  });
}

/**
 * Match auto-apply rules against input text and entity type.
 * autoApplyRules format: { "entityTypes": ["App", "Keyword"], "patterns": ["vpn", "proxy"] }
 */
export async function matchAutoTags(text: string, entityType: string): Promise<string[]> {
  const taxonomy = await prisma.tagTaxonomy.findMany({
    where: {
      autoApplyRules: { not: {} },
    },
  });

  const normalizedText = text.toLowerCase();
  const matched: string[] = [];

  for (const tag of taxonomy) {
    const rules = tag.autoApplyRules as Record<string, unknown> | null;
    if (!rules) continue;

    const entityTypes = (rules.entityTypes as string[]) ?? [];
    if (entityTypes.length > 0 && !entityTypes.includes(entityType)) continue;

    const patterns = (rules.patterns as string[]) ?? [];
    const matchesPattern = patterns.some((pattern) => {
      try {
        return new RegExp(pattern, 'i').test(normalizedText);
      } catch {
        return normalizedText.includes(pattern.toLowerCase());
      }
    });

    if (matchesPattern) {
      matched.push(tag.tag);
    }

    const synonyms = tag.synonyms ?? [];
    if (!matchesPattern && synonyms.some((s) => normalizedText.includes(s.toLowerCase()))) {
      matched.push(tag.tag);
    }
  }

  return [...new Set(matched)];
}

export async function getTagBySlug(tag: string): Promise<TagTaxonomy | null> {
  return prisma.tagTaxonomy.findUnique({ where: { tag } });
}

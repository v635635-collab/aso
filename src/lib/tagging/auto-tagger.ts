import prisma from '@/lib/prisma';
import { matchAutoTags } from './taxonomy';

type TaggableEntity = 'App' | 'Keyword' | 'Niche';

export async function autoTagEntity(entityType: TaggableEntity, entityId: string): Promise<string[]> {
  const textToMatch = await getEntityText(entityType, entityId);
  if (!textToMatch) return [];

  const newTags = await matchAutoTags(textToMatch, entityType);
  if (newTags.length === 0) return [];

  const currentTags = await getCurrentTags(entityType, entityId);
  const merged = [...new Set([...currentTags, ...newTags])];

  if (merged.length === currentTags.length) return [];

  await updateTags(entityType, entityId, merged);
  return newTags.filter((t) => !currentTags.includes(t));
}

async function getEntityText(entityType: TaggableEntity, entityId: string): Promise<string | null> {
  switch (entityType) {
    case 'App': {
      const app = await prisma.app.findUnique({
        where: { id: entityId },
        select: { name: true, category: true, subcategory: true, notes: true },
      });
      if (!app) return null;
      return [app.name, app.category, app.subcategory, app.notes].filter(Boolean).join(' ');
    }
    case 'Keyword': {
      const kw = await prisma.keyword.findUnique({
        where: { id: entityId },
        select: { text: true, notes: true },
      });
      if (!kw) return null;
      return [kw.text, kw.notes].filter(Boolean).join(' ');
    }
    case 'Niche': {
      const niche = await prisma.niche.findUnique({
        where: { id: entityId },
        select: { name: true, displayName: true, description: true, notes: true },
      });
      if (!niche) return null;
      return [niche.name, niche.displayName, niche.description, niche.notes].filter(Boolean).join(' ');
    }
    default:
      return null;
  }
}

async function getCurrentTags(entityType: TaggableEntity, entityId: string): Promise<string[]> {
  switch (entityType) {
    case 'App': {
      const app = await prisma.app.findUnique({ where: { id: entityId }, select: { tags: true } });
      return app?.tags ?? [];
    }
    case 'Keyword': {
      const kw = await prisma.keyword.findUnique({ where: { id: entityId }, select: { tags: true } });
      return kw?.tags ?? [];
    }
    case 'Niche': {
      const niche = await prisma.niche.findUnique({ where: { id: entityId }, select: { tags: true } });
      return niche?.tags ?? [];
    }
    default:
      return [];
  }
}

async function updateTags(entityType: TaggableEntity, entityId: string, tags: string[]): Promise<void> {
  switch (entityType) {
    case 'App':
      await prisma.app.update({ where: { id: entityId }, data: { tags } });
      break;
    case 'Keyword':
      await prisma.keyword.update({ where: { id: entityId }, data: { tags } });
      break;
    case 'Niche':
      await prisma.niche.update({ where: { id: entityId }, data: { tags } });
      break;
  }
}

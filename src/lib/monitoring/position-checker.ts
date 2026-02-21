import prisma from '@/lib/prisma';
import { sendRequest, getResult } from '@/lib/asomobile/client';
import { QueuePriority } from '@/lib/asomobile/types';
import type { KeywordRankResult } from '@/lib/asomobile/types';
import type { PositionSnapshot } from '@prisma/client';

const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_ATTEMPTS = 20;

async function pollForResult(ticketId: string): Promise<KeywordRankResult | null> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    const res = await getResult<KeywordRankResult>('keyword-rank', ticketId, QueuePriority.LOW);
    if (res.status === 'done' && res.data) return res.data as unknown as KeywordRankResult;
    if (res.status === 'error') return null;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return null;
}

export async function checkPositions(): Promise<{ checked: number; updated: number }> {
  const appKeywords = await prisma.appKeyword.findMany({
    where: { app: { status: 'LIVE' } },
    include: {
      app: { select: { id: true, appleId: true, country: true } },
      keyword: { select: { id: true, text: true, country: true } },
    },
  });

  let checked = 0;
  let updated = 0;

  for (const ak of appKeywords) {
    try {
      const ticket = await sendRequest(
        'keyword-rank',
        { keyword: ak.keyword.text, app_id: ak.app.appleId, country: ak.keyword.country, platform: 'IOS', ios_device: 'IPHONE' },
        QueuePriority.NORMAL,
      );

      const result = await pollForResult(ticket.ticket_id);
      checked++;

      const position = result?.position ?? null;
      const previousPosition = ak.currentPosition;
      const change = position != null && previousPosition != null
        ? previousPosition - position
        : null;

      await prisma.positionSnapshot.create({
        data: {
          appId: ak.app.id,
          keywordId: ak.keyword.id,
          position,
          previousPosition,
          change,
          country: ak.keyword.country,
        },
      });

      const best = ak.bestPosition != null
        ? (position != null ? Math.min(ak.bestPosition, position) : ak.bestPosition)
        : position;
      const worst = ak.worstPosition != null
        ? (position != null ? Math.max(ak.worstPosition, position) : ak.worstPosition)
        : position;

      let positionTrend: 'RISING' | 'FALLING' | 'STABLE' | 'NEW' | 'LOST' = 'STABLE';
      if (previousPosition == null && position != null) positionTrend = 'NEW';
      else if (previousPosition != null && position == null) positionTrend = 'LOST';
      else if (change != null && change > 0) positionTrend = 'RISING';
      else if (change != null && change < 0) positionTrend = 'FALLING';

      await prisma.appKeyword.update({
        where: { id: ak.id },
        data: {
          currentPosition: position,
          bestPosition: best,
          worstPosition: worst,
          positionTrend,
          lastPositionAt: new Date(),
        },
      });

      updated++;
    } catch (error) {
      console.error(`Position check failed for app=${ak.app.id} keyword=${ak.keyword.id}:`, error);
    }
  }

  return { checked, updated };
}

export async function checkPositionManual(
  appId: string,
  keywordIds: string[],
): Promise<PositionSnapshot[]> {
  const app = await prisma.app.findUniqueOrThrow({
    where: { id: appId },
    select: { id: true, appleId: true, country: true },
  });

  const appKeywords = await prisma.appKeyword.findMany({
    where: { appId, keywordId: { in: keywordIds } },
    include: { keyword: { select: { id: true, text: true, country: true } } },
  });

  const snapshots: PositionSnapshot[] = [];

  for (const ak of appKeywords) {
    const ticket = await sendRequest(
      'keyword-rank',
      { keyword: ak.keyword.text, app_id: app.appleId, country: ak.keyword.country, platform: 'IOS', ios_device: 'IPHONE' },
      QueuePriority.HIGH,
    );

    const result = await pollForResult(ticket.ticket_id);
    const position = result?.position ?? null;
    const previousPosition = ak.currentPosition;
    const change = position != null && previousPosition != null
      ? previousPosition - position
      : null;

    const snapshot = await prisma.positionSnapshot.create({
      data: {
        appId: app.id,
        keywordId: ak.keyword.id,
        position,
        previousPosition,
        change,
        country: ak.keyword.country,
      },
    });

    const best = ak.bestPosition != null
      ? (position != null ? Math.min(ak.bestPosition, position) : ak.bestPosition)
      : position;
    const worst = ak.worstPosition != null
      ? (position != null ? Math.max(ak.worstPosition, position) : ak.worstPosition)
      : position;

    let positionTrend: 'RISING' | 'FALLING' | 'STABLE' | 'NEW' | 'LOST' = 'STABLE';
    if (previousPosition == null && position != null) positionTrend = 'NEW';
    else if (previousPosition != null && position == null) positionTrend = 'LOST';
    else if (change != null && change > 0) positionTrend = 'RISING';
    else if (change != null && change < 0) positionTrend = 'FALLING';

    await prisma.appKeyword.update({
      where: { id: ak.id },
      data: {
        currentPosition: position,
        bestPosition: best,
        worstPosition: worst,
        positionTrend,
        lastPositionAt: new Date(),
      },
    });

    snapshots.push(snapshot);
  }

  return snapshots;
}

import prisma from '@/lib/prisma';
import { PESSIMIZATION_THRESHOLDS } from '@/config/constants';
import { createNotification } from '@/lib/notifications/service';
import { chatCompletion } from '@/lib/ai/openrouter';
import type { PessimizationSeverity, AsyncJob, Prisma } from '@prisma/client';

interface AffectedKeyword {
  keywordId: string;
  keywordText: string;
  positionBefore: number | null;
  positionAfter: number | null;
  drop: number;
}

function classifySeverity(drop: number, deindexed: boolean): PessimizationSeverity {
  if (deindexed) return 'CRITICAL';
  if (drop >= PESSIMIZATION_THRESHOLDS.SEVERE.min) return 'SEVERE';
  if (drop >= PESSIMIZATION_THRESHOLDS.MODERATE.min) return 'MODERATE';
  if (drop >= PESSIMIZATION_THRESHOLDS.MINOR.min) return 'MINOR';
  return 'MINOR';
}

export async function detectPessimizations(): Promise<{ detected: number }> {
  const apps = await prisma.app.findMany({
    where: { status: 'LIVE' },
    select: { id: true, name: true },
  });

  let detected = 0;

  for (const app of apps) {
    const latestSnapshots = await prisma.positionSnapshot.findMany({
      where: { appId: app.id },
      orderBy: { capturedAt: 'desc' },
      distinct: ['keywordId'],
      include: { keyword: { select: { id: true, text: true } } },
    });

    const affected: AffectedKeyword[] = [];
    let hasDeindex = false;

    for (const snap of latestSnapshots) {
      if (snap.previousPosition == null) continue;

      if (snap.position == null && snap.previousPosition != null) {
        hasDeindex = true;
        affected.push({
          keywordId: snap.keyword.id,
          keywordText: snap.keyword.text,
          positionBefore: snap.previousPosition,
          positionAfter: null,
          drop: 999,
        });
        continue;
      }

      if (snap.position != null && snap.previousPosition != null) {
        const drop = snap.position - snap.previousPosition;
        if (drop >= PESSIMIZATION_THRESHOLDS.MINOR.min) {
          affected.push({
            keywordId: snap.keyword.id,
            keywordText: snap.keyword.text,
            positionBefore: snap.previousPosition,
            positionAfter: snap.position,
            drop,
          });
        }
      }
    }

    if (affected.length === 0) continue;

    const drops = affected.filter((a) => a.drop < 999).map((a) => a.drop);
    const avgDrop = drops.length > 0 ? drops.reduce((s, d) => s + d, 0) / drops.length : 0;
    const maxDrop = Math.max(...affected.map((a) => a.drop));
    const severity = classifySeverity(Math.max(...drops, 0), hasDeindex);
    const type = hasDeindex ? 'COMPLETE_DEINDEX' : 'POSITION_DROP';

    const activeCampaign = await prisma.pushCampaign.findFirst({
      where: { appId: app.id, status: 'ACTIVE' },
      select: { id: true, name: true, targetKeywords: true, totalInstalls: true, durationDays: true },
    });

    const event = await prisma.pessimizationEvent.create({
      data: {
        appId: app.id,
        campaignId: activeCampaign?.id ?? null,
        type,
        severity,
        status: 'DETECTED',
        affectedKeywords: affected as unknown as Prisma.InputJsonValue,
        avgPositionDrop: avgDrop,
        maxPositionDrop: maxDrop > 900 ? 0 : maxDrop,
        pushContext: activeCampaign
          ? ({
              campaignId: activeCampaign.id,
              campaignName: activeCampaign.name,
              totalInstalls: activeCampaign.totalInstalls,
              durationDays: activeCampaign.durationDays,
            } as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    });

    if ((severity === 'SEVERE' || severity === 'CRITICAL') && activeCampaign) {
      await prisma.pushCampaign.update({
        where: { id: activeCampaign.id },
        data: { status: 'PESSIMIZED' },
      });
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    const notifSeverity = severity === 'CRITICAL' || severity === 'SEVERE' ? 'CRITICAL' : 'WARNING';

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'PESSIMIZATION_DETECTED',
        severity: notifSeverity,
        title: `Pessimization detected: ${app.name}`,
        body: `${severity} pessimization detected. ${affected.length} keyword(s) affected with avg drop of ${avgDrop.toFixed(1)} positions.`,
        actionUrl: `/pessimizations/${event.id}`,
        actionLabel: 'View Details',
        entityType: 'PessimizationEvent',
        entityId: event.id,
      });
    }

    detected++;
  }

  return { detected };
}

export async function analyzePessimization(eventId: string): Promise<AsyncJob> {
  const event = await prisma.pessimizationEvent.findUniqueOrThrow({
    where: { id: eventId },
    include: {
      app: { select: { id: true, name: true, bundleId: true, category: true, organicDownloads: true, categoryRank: true } },
      campaign: { select: { id: true, name: true, strategy: true, totalInstalls: true, durationDays: true, targetKeywords: true } },
    },
  });

  const recentSnapshots = await prisma.positionSnapshot.findMany({
    where: { appId: event.appId },
    orderBy: { capturedAt: 'desc' },
    take: 100,
    include: { keyword: { select: { text: true } } },
  });

  const job = await prisma.asyncJob.create({
    data: {
      type: 'PESSIMIZATION_ANALYSIS',
      status: 'RUNNING',
      input: { eventId } as unknown as Prisma.InputJsonValue,
      triggeredBy: 'system',
      relatedEntityType: 'PessimizationEvent',
      relatedEntityId: eventId,
      startedAt: new Date(),
    },
  });

  await prisma.pessimizationEvent.update({
    where: { id: eventId },
    data: { status: 'ANALYZING' },
  });

  const positionHistory = recentSnapshots.map((s) => ({
    keyword: s.keyword.text,
    position: s.position,
    previous: s.previousPosition,
    change: s.change,
    date: s.capturedAt.toISOString(),
  }));

  const prompt = `You are an ASO (App Store Optimization) expert. Analyze this pessimization event and provide root cause analysis and recommendations.

## App Context
- Name: ${event.app.name}
- Bundle ID: ${event.app.bundleId}
- Category: ${event.app.category ?? 'N/A'}
- Organic Downloads: ${event.app.organicDownloads}
- Category Rank: ${event.app.categoryRank ?? 'N/A'}

## Pessimization Event
- Type: ${event.type}
- Severity: ${event.severity}
- Affected Keywords: ${JSON.stringify(event.affectedKeywords)}
- Avg Position Drop: ${event.avgPositionDrop}
- Max Position Drop: ${event.maxPositionDrop}

## Push Campaign Context
${event.campaign ? `- Campaign: ${event.campaign.name}
- Strategy: ${event.campaign.strategy}
- Total Installs: ${event.campaign.totalInstalls}
- Duration: ${event.campaign.durationDays} days
- Target Keywords: ${event.campaign.targetKeywords.join(', ')}` : 'No active campaign at time of pessimization.'}

## Recent Position History
${JSON.stringify(positionHistory.slice(0, 30), null, 2)}

Please respond in JSON format:
{
  "rootCause": "string — most likely root cause",
  "analysis": "string — detailed analysis (2-4 paragraphs)",
  "recommendations": ["array of specific action items"],
  "riskAssessment": "string — assessment of ongoing risk",
  "recoveryTimeline": "string — estimated recovery timeline"
}`;

  try {
    const response = await chatCompletion([
      { role: 'system', content: 'You are an ASO analytics expert. Always respond with valid JSON.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.3, maxTokens: 2048 });

    const content = (response as { choices: Array<{ message: { content: string } }> })
      .choices?.[0]?.message?.content ?? '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { analysis: content, rootCause: 'Unable to parse', recommendations: [] };

    await prisma.pessimizationEvent.update({
      where: { id: eventId },
      data: {
        aiAnalysis: parsed.analysis,
        aiRecommendation: JSON.stringify(parsed.recommendations),
        rootCause: parsed.rootCause,
        status: 'DETECTED',
      },
    });

    await prisma.asyncJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        output: parsed as unknown as Prisma.InputJsonValue,
        progress: 100,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.asyncJob.update({
      where: { id: job.id },
      data: { status: 'FAILED', error: message, completedAt: new Date() },
    });

    await prisma.pessimizationEvent.update({
      where: { id: eventId },
      data: { status: 'DETECTED' },
    });
  }

  return prisma.asyncJob.findUniqueOrThrow({ where: { id: job.id } });
}

import prisma from '@/lib/prisma';
import type { Notification, NotificationType, NotificationSeverity } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams): Promise<Notification> {
  const { userId, type, severity = 'INFO', title, body, actionUrl, actionLabel, entityType, entityId, metadata } = params;

  return prisma.notification.create({
    data: {
      userId,
      type,
      severity,
      title,
      body,
      actionUrl,
      actionLabel,
      entityType,
      entityId,
      metadata: (metadata ?? {}) as import('@prisma/client').Prisma.InputJsonValue,
    },
  });
}

export async function markAsRead(id: string): Promise<void> {
  await prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function listNotifications(params: {
  userId: string;
  isRead?: boolean;
  type?: NotificationType;
  severity?: NotificationSeverity;
  skip: number;
  take: number;
}) {
  const { userId, isRead, type, severity, skip, take } = params;

  const where = {
    userId,
    ...(isRead !== undefined && { isRead }),
    ...(type && { type }),
    ...(severity && { severity }),
  };

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.notification.count({ where }),
  ]);

  return { items, total };
}

export async function deleteOldNotifications(olderThanDays: number = 90): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { count } = await prisma.notification.deleteMany({
    where: { createdAt: { lt: cutoff }, isRead: true },
  });

  return count;
}

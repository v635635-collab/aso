import crypto from 'crypto';
import prisma from '@/lib/prisma';
import type { SettingType, SystemSettings, Prisma } from '@prisma/client';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
const ALGO = 'aes-256-gcm';

function getKeyBuffer(): Buffer {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 64) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars)');
  }
  return Buffer.from(ENCRYPTION_KEY, 'hex');
}

function encrypt(text: string): string {
  const key = getKeyBuffer();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

function decrypt(encrypted: string): string {
  const key = getKeyBuffer();
  const [ivHex, tagHex, data] = encrypted.split(':');
  if (!ivHex || !tagHex || !data) throw new Error('Invalid encrypted format');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function getSetting(key: string): Promise<unknown> {
  const setting = await prisma.systemSettings.findUnique({ where: { key } });
  if (!setting) return null;

  const raw = setting.value as unknown;

  if (setting.isSecret && typeof raw === 'string') {
    try {
      return decrypt(raw);
    } catch {
      return raw;
    }
  }

  return raw;
}

export async function getSettings(category?: string): Promise<SystemSettings[]> {
  const where = category ? { category } : {};
  const settings = await prisma.systemSettings.findMany({ where, orderBy: { key: 'asc' } });

  return settings.map((s) => {
    if (s.isSecret) {
      return { ...s, value: '********' as unknown as SystemSettings['value'] };
    }
    return s;
  });
}

export async function setSetting(key: string, value: unknown, updatedBy?: string): Promise<void> {
  const existing = await prisma.systemSettings.findUnique({ where: { key } });
  if (!existing) throw new Error(`Setting "${key}" not found`);

  let storeValue = value;
  if (existing.isSecret && typeof value === 'string' && value !== '********' && value !== '') {
    storeValue = encrypt(value);
  }

  await prisma.systemSettings.update({
    where: { key },
    data: {
      value: storeValue as Prisma.InputJsonValue,
      updatedBy: updatedBy ?? null,
    },
  });
}

interface DefaultSetting {
  key: string;
  value: unknown;
  type: SettingType;
  category: string;
  label: string;
  description?: string;
  options?: unknown;
  isSecret: boolean;
}

const DEFAULT_SETTINGS: DefaultSetting[] = [
  { key: 'push.deliveryMode', value: 'manual', type: 'SELECT', category: 'push', label: 'Delivery Mode', options: ['manual', 'telegram_auto'], isSecret: false },
  { key: 'push.maxDailyInstalls', value: 500, type: 'NUMBER', category: 'push', label: 'Max Daily Installs', isSecret: false },
  { key: 'push.defaultStrategy', value: 'GRADUAL', type: 'SELECT', category: 'push', label: 'Default Strategy', options: ['GRADUAL', 'AGGRESSIVE', 'CONSERVATIVE', 'CUSTOM'], isSecret: false },
  { key: 'monitoring.checkInterval', value: 6, type: 'NUMBER', category: 'monitoring', label: 'Check Interval (hours)', isSecret: false },
  { key: 'monitoring.pessimizationThreshold', value: 15, type: 'NUMBER', category: 'monitoring', label: 'Pessimization Threshold (positions)', isSecret: false },
  { key: 'ai.defaultModel', value: 'openai/gpt-4o', type: 'STRING', category: 'ai', label: 'Default AI Model', isSecret: false },
  { key: 'ai.temperature', value: 0.7, type: 'NUMBER', category: 'ai', label: 'AI Temperature', isSecret: false },
  { key: 'ai.maxTokens', value: 4096, type: 'NUMBER', category: 'ai', label: 'Max Tokens', isSecret: false },
  { key: 'telegram.botToken', value: '', type: 'SECRET', category: 'telegram', label: 'Bot Token', isSecret: true },
  { key: 'telegram.alertsChatId', value: '', type: 'STRING', category: 'telegram', label: 'Alerts Chat ID', isSecret: false },
  { key: 'telegram.ordersChatId', value: '', type: 'STRING', category: 'telegram', label: 'Orders Chat ID', isSecret: false },
  { key: 'data.retentionDays', value: 90, type: 'NUMBER', category: 'data', label: 'Data Retention (days)', isSecret: false },
  { key: 'data.storeRawResponses', value: false, type: 'BOOLEAN', category: 'data', label: 'Store Raw API Responses', isSecret: false },
  { key: 'data.backupRetentionDays', value: 30, type: 'NUMBER', category: 'data', label: 'Backup Retention (days)', isSecret: false },
  { key: 'trends.seedQueries', value: [], type: 'JSON', category: 'trends', label: 'Seed Queries', isSecret: false },
  { key: 'trends.geos', value: ['', 'US', 'RU'], type: 'JSON', category: 'trends', label: 'Target Geos', isSecret: false },
  { key: 'trends.minChangePercent', value: 20, type: 'NUMBER', category: 'trends', label: 'Min Change %', isSecret: false },
  { key: 'notifications.emailEnabled', value: false, type: 'BOOLEAN', category: 'notifications', label: 'Email Notifications', isSecret: false },
];

export async function seedDefaultSettings(): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const def of DEFAULT_SETTINGS) {
    const exists = await prisma.systemSettings.findUnique({ where: { key: def.key } });
    if (exists) {
      skipped++;
      continue;
    }

    let storeValue: unknown = def.value;
    if (def.isSecret && typeof def.value === 'string' && def.value !== '') {
      storeValue = encrypt(def.value);
    }

    await prisma.systemSettings.create({
      data: {
        key: def.key,
        value: storeValue as Prisma.InputJsonValue,
        type: def.type,
        category: def.category,
        label: def.label,
        description: def.description,
        options: (def.options ?? undefined) as Prisma.InputJsonValue | undefined,
        isSecret: def.isSecret,
      },
    });
    created++;
  }

  return { created, skipped };
}

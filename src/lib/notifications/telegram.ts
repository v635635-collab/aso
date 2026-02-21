import { getSetting } from '@/lib/settings/service';

export class TelegramClient {
  private baseUrl: string;

  constructor(private botToken: string) {
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
  }

  async sendMessage(chatId: string, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[Telegram] sendMessage failed:', res.status, err);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Telegram] sendMessage error:', error);
      return false;
    }
  }

  async sendAlert(chatId: string, title: string, body: string, severity: string): Promise<boolean> {
    const icon = severityIcon(severity);
    const text = `${icon} <b>${escapeHtml(title)}</b>\n\n${escapeHtml(body)}\n\n<i>Severity: ${severity}</i>`;
    return this.sendMessage(chatId, text);
  }
}

function severityIcon(severity: string): string {
  switch (severity.toUpperCase()) {
    case 'CRITICAL': return '\u{1F534}';
    case 'ERROR': return '\u{1F7E0}';
    case 'WARNING': return '\u{1F7E1}';
    default: return '\u{1F535}';
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

let cachedClient: TelegramClient | null = null;
let cachedAt = 0;
const CACHE_TTL = 60_000;

export async function getTelegramClient(): Promise<TelegramClient | null> {
  if (cachedClient && Date.now() - cachedAt < CACHE_TTL) {
    return cachedClient;
  }

  try {
    const token = (await getSetting('telegram.botToken')) as string | null;
    const resolvedToken = token || process.env.TELEGRAM_BOT_TOKEN;

    if (!resolvedToken) return null;

    cachedClient = new TelegramClient(resolvedToken);
    cachedAt = Date.now();
    return cachedClient;
  } catch {
    const envToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!envToken) return null;
    return new TelegramClient(envToken);
  }
}

export function invalidateTelegramCache(): void {
  cachedClient = null;
  cachedAt = 0;
}

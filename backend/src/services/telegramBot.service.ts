import { config } from '../config';
import { db } from '../db/storage';

export interface BroadcastResult {
  success: boolean;
  total: number;
  sent: number;
  failed: number;
  recipients: Array<{ chatId: number | string; status: 'sent' | 'failed'; error?: string }>;
  error?: string;
}

export class TelegramBotService {
  /**
   * Send a single message to a Telegram chat or user
   */
  public async sendMessage(
    chatId: number | string,
    text: string,
    options?: {
      parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      reply_markup?: any;
      botToken?: string;
    }
  ): Promise<{ ok: boolean; result?: any; error?: string }> {
    const token = options?.botToken || config.telegramBotToken;

    if (!token || token.includes('ABCdefGhIJKlmNoPQRsTUVwxyZ')) {
      return {
        ok: false,
        error: 'Telegram Bot Token belgilanmagan yoki standart token (backend/.env faylida TELEGRAM_BOT_TOKEN ni yangilang)',
      };
    }

    const parse_mode = options?.parse_mode || 'HTML';
    const payload: Record<string, any> = {
      chat_id: chatId,
      text,
      parse_mode,
    };

    if (options?.reply_markup) {
      payload.reply_markup = options.reply_markup;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = (await response.json()) as any;

      if (!response.ok || !resData.ok) {
        return {
          ok: false,
          error: resData.description || `Telegram API xatosi (${response.status})`,
        };
      }

      return { ok: true, result: resData.result };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Tarmoq xatosi yuz berdi' };
    }
  }

  /**
   * Get default rich update message for Bude Delivery Web App
   */
  public getDefaultUpdateMessage(customNote?: string): string {
    return (
      `🚀 <b>Bude Delivery Web App Yangilandi!</b>\n\n` +
      `Assalomu alaykum! Bude Delivery ilovasida navbatdagi katta texnik va funksional yangilanish amalga oshirildi:\n\n` +
      `⚡ <b>10x Tezkor yuklanish:</b> Boshlang'ich dastur hajmi 86% ga qisqartirildi (105 KB), internet past tezlikda bo'lsa ham bir lahzada ochiladi.\n` +
      `📦 <b>0ms Kesh tizimi:</b> Mahsulotlar va ta'minotchilar katalogi qayta so'rovsiz bir zumda ko'rsatiladi.\n` +
      `🗺 <b>Yangi Vektorli Xarita:</b> Lokatsiyani aniqlash va markerlar oflayn sharoitda ham aniq va tez ishlaydi.\n` +
      `🛡 <b>Asinxron & Xavfsiz Buyurtmalar:</b> Server ma'lumotlar bazasi va buyurtmalar almashinuvi O(1) tezligiga o'tkazildi.\n` +
      (customNote ? `\n📝 <b>Qo'shimcha:</b> ${customNote}\n` : '') +
      `\n<i>Yangilangan ilovani ochish uchun quyidagi tugmani bosing:</i>`
    );
  }

  /**
   * Broadcast app update to all registered Telegram users and/or specific chatId
   */
  public async broadcastAppUpdate(options?: {
    message?: string;
    webAppUrl?: string;
    targetChatId?: number | string;
    botToken?: string;
  }): Promise<BroadcastResult> {
    const token = options?.botToken || config.telegramBotToken;

    if (!token || token.includes('ABCdefGhIJKlmNoPQRsTUVwxyZ')) {
      return {
        success: false,
        total: 0,
        sent: 0,
        failed: 0,
        recipients: [],
        error:
          "Telegram Bot Token mavjud emas yoki sinov qiymatida. Iltimos, backend/.env dagi TELEGRAM_BOT_TOKEN ga haqiqiy @BotFather tokenni kiriting.",
      };
    }

    const messageText = options?.message || this.getDefaultUpdateMessage();
    const webAppUrl = options?.webAppUrl || config.webAppUrl;

    // Inline button to directly open Telegram WebApp
    const reply_markup = webAppUrl
      ? {
          inline_keyboard: [
            [
              {
                text: '🛍 Ilovani ochish (Web App)',
                web_app: { url: webAppUrl },
              },
            ],
          ],
        }
      : undefined;

    // Collect recipient list
    let recipientIds: Array<number | string> = [];

    if (options?.targetChatId) {
      recipientIds = [options.targetChatId];
    } else {
      const allUsers = db.getAllUsers();
      const uniqueIds = new Set<string>();

      for (const u of allUsers) {
        if (u.telegram_id) {
          uniqueIds.add(String(u.telegram_id));
        }
      }

      // Always include owner admin telegram ID if known
      uniqueIds.add('8012592174');

      recipientIds = Array.from(uniqueIds);
    }

    const results: Array<{ chatId: number | string; status: 'sent' | 'failed'; error?: string }> = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const chatId of recipientIds) {
      const res = await this.sendMessage(chatId, messageText, {
        parse_mode: 'HTML',
        reply_markup,
        botToken: token,
      });

      if (res.ok) {
        sentCount++;
        results.push({ chatId, status: 'sent' });
      } else {
        failedCount++;
        results.push({ chatId, status: 'failed', error: res.error });
      }

      // Safe rate-limiting throttle (50ms) to respect Telegram API 30 msgs/second
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return {
      success: sentCount > 0 || (recipientIds.length === 0 && failedCount === 0),
      total: recipientIds.length,
      sent: sentCount,
      failed: failedCount,
      recipients: results,
    };
  }
}

export const telegramBotService = new TelegramBotService();

import { config } from './config';
import { telegramBotService } from './services/telegramBot.service';

/**
 * Lightweight Zero-Dependency Telegram Bot Runner using Long Polling
 */
async function startBot() {
  const token = config.telegramBotToken;

  if (!token || token.includes('ABCdefGhIJKlmNoPQRsTUVwxyZ')) {
    console.error('❌ Telegram Bot Token noto‘g‘ri yoki standart qiymatda!');
    console.error('   Iltimos, backend/.env faylidagi TELEGRAM_BOT_TOKEN parametriga @BotFather tokenini yozing.');
    process.exit(1);
  }

  console.log('🤖 Bude Delivery Telegram Bot tekshirilmoqda...');

  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = (await meRes.json()) as any;

    if (!meData.ok) {
      console.error('❌ Bot tekshiruvdan o‘tmadi:', meData.description);
      process.exit(1);
    }

    console.log(`✅ Bot muvaffaqiyatli ulandi: @${meData.result.username} (${meData.result.first_name})`);
    console.log(`🌐 Web App URL: ${config.webAppUrl}`);
    console.log('📡 Long-polling orqali yangi xabarlar kutilmoqda...\n');

    let offset = 0;

    while (true) {
      try {
        const updatesRes = await fetch(
          `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=30`
        );
        const updatesData = (await updatesRes.json()) as any;

        if (updatesData.ok && Array.isArray(updatesData.result)) {
          for (const update of updatesData.result) {
            offset = update.update_id + 1;

            if (update.message && update.message.text) {
              const chatId = update.message.chat.id;
              const text = update.message.text.trim();
              const firstName = update.message.from?.first_name || 'Foydalanuvchi';

              if (text === '/start' || text.startsWith('/start')) {
                await telegramBotService.sendMessage(
                  chatId,
                  `👋 <b>Assalomu alaykum, ${firstName}!</b>\n\n` +
                    `<b>Bude Delivery</b> xizmatiga xush kelibsiz!\n` +
                    `Yetkazib berish ilovamizdan to'liq foydalanish, tovarlarni ko'rish va buyurtma berish uchun quyidagi tugmani bosing:`,
                  {
                    parse_mode: 'HTML',
                    reply_markup: {
                      inline_keyboard: [
                        [
                          {
                            text: '🛍 Bude Delivery ni ochish',
                            web_app: { url: config.webAppUrl },
                          },
                        ],
                      ],
                    },
                  }
                );
              } else if (text === '/update' || text === '/yangilanish') {
                const updateMsg = telegramBotService.getDefaultUpdateMessage();
                await telegramBotService.sendMessage(chatId, updateMsg, {
                  parse_mode: 'HTML',
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: '🛍 Yangilangan ilovani ochish',
                          web_app: { url: config.webAppUrl },
                        },
                      ],
                    ],
                  },
                });
              } else if (text === '/help') {
                await telegramBotService.sendMessage(
                  chatId,
                  `📌 <b>Mavjud buyruqlar:</b>\n\n` +
                    `/start - Boshlash va Web Appni ochish\n` +
                    `/update - Ilova yangilanishlari haqida ma'lumot\n` +
                    `/help - Yordam`,
                  { parse_mode: 'HTML' }
                );
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Polling xatosi:', err.message);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (err: any) {
    console.error('Botni ishga tushirishda xatolik:', err);
    process.exit(1);
  }
}

startBot();

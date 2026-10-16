import { telegramBotService } from '../services/telegramBot.service';
import { config } from '../config';

async function main() {
  console.log('====================================================');
  console.log('📢  Bude Delivery - Telegram Bot Update Broadcast  📢');
  console.log('====================================================\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  let customToken: string | undefined;
  let targetChatId: string | undefined;
  let customNote: string | undefined;
  let customUrl: string | undefined;

  for (const arg of args) {
    if (arg.startsWith('--token=')) {
      customToken = arg.split('=')[1];
    } else if (arg.startsWith('--chatId=')) {
      targetChatId = arg.split('=')[1];
    } else if (arg.startsWith('--note=')) {
      customNote = arg.split('=')[1];
    } else if (arg.startsWith('--url=')) {
      customUrl = arg.split('=')[1];
    }
  }

  const tokenToUse = customToken || config.telegramBotToken;
  const webAppUrl = customUrl || config.webAppUrl;

  console.log(`🤖 Bot Token: ${tokenToUse ? tokenToUse.slice(0, 10) + '...' : '(Mavjud emas)'}`);
  console.log(`🌐 Web App URL: ${webAppUrl}`);
  if (targetChatId) {
    console.log(`🎯 Aniq qabul qiluvchi: ${targetChatId}`);
  } else {
    console.log(`👥 Qabul qiluvchilar: Barcha ro'yxatdan o'tgan Telegram foydalanuvchilari + Admin`);
  }
  console.log('----------------------------------------------------\n');

  const message = telegramBotService.getDefaultUpdateMessage(customNote);

  console.log('📨 Xabar matni:');
  console.log(message.replace(/<[^>]+>/g, '')); // Strip HTML for console preview
  console.log('\n----------------------------------------------------');
  console.log('🚀 Xabarnoma yuborilmoqda...\n');

  const result = await telegramBotService.broadcastAppUpdate({
    message,
    webAppUrl,
    targetChatId,
    botToken: tokenToUse,
  });

  if (!result.success && result.error) {
    console.error('❌ Xatolik yuz berdi:');
    console.error(`   ${result.error}`);
    console.log('\n💡 Eslatma:');
    console.log('   backend/.env faylini oching va TELEGRAM_BOT_TOKEN parametriga');
    console.log("   Telegram @BotFather dan olingan haqiqiy bot tokenni kiriting.");
    console.log('   Masalan: TELEGRAM_BOT_TOKEN=1234567890:AAH...');
    process.exit(1);
  }

  console.log(`✅ Natija:`);
  console.log(`   Jami qabul qiluvchilar: ${result.total}`);
  console.log(`   Muvaffaqiyatli yetkazildi: ${result.sent}`);
  console.log(`   Xatoliklar soni: ${result.failed}`);

  if (result.recipients.length > 0) {
    console.log('\nTafsilotlar:');
    for (const r of result.recipients) {
      if (r.status === 'sent') {
        console.log(`   ✔ Chat ID: ${r.chatId} - Yuborildi`);
      } else {
        console.log(`   ✖ Chat ID: ${r.chatId} - Xato: ${r.error}`);
      }
    }
  }

  console.log('\n🎉 Tugallandi!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Kutilmagan xatolik:', err);
  process.exit(1);
});

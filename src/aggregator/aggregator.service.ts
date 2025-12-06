import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AggregatorService {
  constructor(private prisma: PrismaService) {}

  async processIncomingMessage(platform: string, chatId: string, data: any) {
    // 1️⃣ găsim contul platformei (botul)

    const botAccount = await this.prisma.platform_accounts.findFirst({
      where: {
        platform,
        external_app_id: process.env.TELEGRAM_BOT_ID,
      },
    });

    if (!botAccount) {
      throw new Error(
        'Telegram bot account missing in platform_accounts table',
      );
    }

    // 2️⃣ găsim sau creăm conversația
    const conversation = await this.prisma.conversations.upsert({
      where: {
        external_chat_id_platform: {
          external_chat_id: chatId,
          platform,
        },
      },
      update: {},
      create: {
        platform_account_id: botAccount.id,
        external_chat_id: chatId,
        platform,
        contact_name: data.contactName,
        contact_username: data.contactUsername,
      },
    });

    // 3️⃣ salvăm mesajul
    await this.prisma.messages.create({
      data: {
        conversation_id: conversation.id,
        sender_type: 'client',
        text: data.text,
        platform,
        timestamp: data.timestamp,
      },
    });

    return conversation;
  }
}

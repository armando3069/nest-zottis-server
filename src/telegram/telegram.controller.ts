import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('telegram')
export class TelegramController {
  constructor(
    private telegram: TelegramService,
    private prisma: PrismaService,
  ) {}

  @Get('/conversations')
  async getConversations() {
    return this.prisma.conversations.findMany({
      orderBy: { id: 'desc' },
    });
  }

  @Get('/conversations/:id/messages')
  async getMessages(@Param('id') id: string) {
    return this.prisma.messages.findMany({
      where: { conversation_id: Number(id) },
      orderBy: { timestamp: 'asc' },
    });
  }

  @Post('reply')
  async sendReply(@Body() body: { conversationId: number; text: string }) {
    const { conversationId, text } = body;

    // 1️⃣ găsim conversația ca să aflăm chat_id
    const conversation = await this.prisma.conversations.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // 2️⃣ trimitem în Telegram
    await this.telegram.sendManualReply(conversation.external_chat_id, text);

    // 3️⃣ salvăm mesajul botului
    await this.prisma.messages.create({
      data: {
        conversation_id: conversationId,
        sender_type: 'bot',
        text,
        platform: 'telegram',
        timestamp: new Date(),
      },
    });

    return { success: true };
  }
}

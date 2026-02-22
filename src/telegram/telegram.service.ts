import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { PrismaService } from '../prisma/prisma.service';
import { AggregatorService } from '../aggregator/aggregator.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot;

  constructor(
    private prisma: PrismaService,
    private aggregator: AggregatorService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {
    this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
      polling: true,
    });

    this.bot.on('message', (msg) => this.handleIncomingMessage(msg));
  }

  private async handleIncomingMessage(msg: TelegramBot.Message) {
    try {
      const chatId = msg.chat.id.toString();
      const text = msg.text ?? '';

      this.logger.log(`Received from Telegram(${chatId}): ${text}`);

      const { conversation, message, isNew } =
        await this.aggregator.processIncomingMessage('telegram', chatId, {
          text,
          contactName: msg.from?.first_name || null,
          contactUsername: msg.from?.username || null,
          timestamp: new Date(msg.date * 1000),
        });

      this.chatGateway.emitNewMessage(message);

      if (isNew) {
        this.chatGateway.emitNewConversation(conversation);
      }
    } catch (err) {
      this.logger.error('Telegram Service Error:', err);
    }
  }

  async sendManualReply(chatId: string, text: string) {
    await this.bot.sendMessage(chatId, text);
  }
}

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Inject, Logger, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => TelegramService))
    private telegramService: TelegramService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('getConversations')
  async handleGetConversations(@ConnectedSocket() client: Socket) {
    try {
      const conversations = await this.prisma.conversations.findMany({
        orderBy: { id: 'desc' },
      });
      client.emit('conversations', conversations);
    } catch (err) {
      client.emit('error', { message: err.message });
    }
  }

  @SubscribeMessage('getMessages')
  async handleGetMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: number },
  ) {
    try {
      const messages = await this.prisma.messages.findMany({
        where: { conversation_id: payload.conversationId },
        orderBy: { timestamp: 'asc' },
      });
      client.emit('messages', messages);
    } catch (err) {
      client.emit('error', { message: err.message });
    }
  }

  @SubscribeMessage('sendReply')
  async handleSendReply(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: number; text: string },
  ) {
    try {
      const { conversationId, text } = payload;

      const conversation = await this.prisma.conversations.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        client.emit('error', { message: 'Conversation not found' });
        return;
      }

      await this.telegramService.sendManualReply(
        conversation.external_chat_id,
        text,
      );

      const message = await this.prisma.messages.create({
        data: {
          conversation_id: conversationId,
          sender_type: 'bot',
          text,
          platform: 'telegram',
          timestamp: new Date(),
        },
      });

      this.server.emit('newMessage', message);
      client.emit('replySent', { success: true });
    } catch (err) {
      client.emit('error', { message: err.message });
    }
  }

  emitNewMessage(message: any) {
    this.server.emit('newMessage', message);
  }

  emitNewConversation(conversation: any) {
    this.server.emit('newConversation', conversation);
  }
}

import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [PrismaModule, forwardRef(() => TelegramModule)],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}

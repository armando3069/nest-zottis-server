import { Module, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AggregatorModule } from '../aggregator/aggregator.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [PrismaModule, AggregatorModule, forwardRef(() => ChatModule)],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}

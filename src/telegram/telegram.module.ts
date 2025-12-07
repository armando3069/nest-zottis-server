import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AggregatorModule } from '../aggregator/aggregator.module';

@Module({
  imports: [PrismaModule, AggregatorModule],
  providers: [TelegramService],
  controllers: [TelegramController],
})
export class TelegramModule {}

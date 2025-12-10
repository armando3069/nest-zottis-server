import { Module } from '@nestjs/common';
import { TelegramModule } from './telegram/telegram.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    TelegramModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { VkService } from './vk.service';
import { VkController } from './vk.controller';
import { TelegramService } from '../telegram/telegram.service';

@Module({
  providers: [VkService, TelegramService],
  controllers: [VkController],
})
export class VkModule {}

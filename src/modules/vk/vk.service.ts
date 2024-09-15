import { Injectable } from '@nestjs/common';
import { TelegramService } from '../telegram/telegram.service';
import { Response } from 'express';

@Injectable()
export class VkService {
  constructor(private readonly telegramService: TelegramService) {}

  public handleVkWebhook(data: any, response: Response): Response {
    if (data.type === 'wall_post_new') {
      this.telegramService.sendMessageToTelegram(
        process.env.TELEGRAM_CHAT_ID,
        data,
      );
    }

    if (data.type === 'confirmation' && data.group_id === 'some-group-id') {
      return response.status(200).send('confirmation-code');
    }

    return response.status(200).send('ok');
  }
}

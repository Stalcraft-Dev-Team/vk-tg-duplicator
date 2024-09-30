import { Injectable } from '@nestjs/common';
import { TelegramService } from '../telegram/telegram.service';
import { Response } from 'express';
import { ParseVkGroupHistoryDto } from './vk.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VkService {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService,
  ) {}

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

  public async parseWallHistory(
    dto: ParseVkGroupHistoryDto,
    response: Response,
  ): Promise<any> {
    const serviceKey = this.configService.get('VK_SERVICE_KEY');
    const apiVersion = '5.131';
    const groupId = `-${dto.group_id}`;
    const apiUrl = 'https://api.vk.com/method/wall.get';
    const count = 100;
    let offset = 0;
    const allPosts = [];

    try {
      while (true) {
        const url = `${apiUrl}?owner_id=${groupId}&count=${count}&offset=${offset}&v=${apiVersion}&access_token=${serviceKey}`;

        const fetchData = await fetch(url, {
          method: 'GET',
        });
        const data = await fetchData.json();

        if (!data.response || data.response.items.length === 0) {
          break;
        }

        const posts = data.response.items;
        allPosts.push(...posts);

        console.log({ lenghh: allPosts.length });

        offset += count;
      }

      for (const post of allPosts.reverse()) {
        console.log('Отправляем запрос');
        await this.telegramService.sendMessageToTelegram(
          process.env.TELEGRAM_CHAT_ID,
          { object: post },
        );
        console.log('Запрос отправлен. Ждём 5 секунд');
        await this.sleep(5000);
      }

      return response.status(200).send({ posts: allPosts });
    } catch (error) {
      console.error('Ошибка при запросе к API ВК:', error);
      throw new Error('Ошибка при запросе к API ВК');
    }
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

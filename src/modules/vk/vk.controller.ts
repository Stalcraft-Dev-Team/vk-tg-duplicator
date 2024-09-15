import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { VkService } from './vk.service';
import { Response } from 'express';

@Controller('vk')
export class VkController {
  constructor(private readonly vkService: VkService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() body: any, @Res() response: Response): Response {
    return this.vkService.handleVkWebhook(body, response);
  }
}

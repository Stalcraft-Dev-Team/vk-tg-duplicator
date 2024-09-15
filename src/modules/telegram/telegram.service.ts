import { Injectable } from '@nestjs/common';
import { VkPost } from '../../models/vk.interface';
import { Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private bot: Telegraf;

  constructor(private readonly configService: ConfigService) {
    const telegramToken = this.configService.get('TELEGRAM_TOKEN');
    this.bot = new Telegraf(telegramToken);
  }

  public prepareTgPost(vkPost: VkPost): any {
    const post = {
      text: '',
      link: '',
      photos: [],
      videos: [],
      types: {
        text: false,
        longText: false,
        video: false,
        photo: false,
        link: false,
      },
    };

    if (vkPost.text) {
      post.text = vkPost.text;
      post.types.text = true;
    }

    if (vkPost.hasOwnProperty('attachments')) {
      for (const p in vkPost.attachments) {
        if (vkPost.attachments[p].type == 'photo') {
          if (!post.hasOwnProperty('photos')) {
            post.photos = [];
          }
          const photo = vkPost.attachments[p].photo;
          let sizeUrl = '';
          const imageObject = {
            type: '',
            media: '',
          };
          let photoSize = 0;
          for (const s in photo.sizes) {
            const size = photo.sizes[s];
            if (size.width * size.height > photoSize) {
              photoSize = size.width * size.height;
              sizeUrl = size.url;
            }
          }
          imageObject.type = 'photo';
          imageObject.media = sizeUrl;
          post.photos.push(imageObject);
          post.types.photo = true;
        }

        if (vkPost.attachments[p].type == 'video') {
          console.log('Video is not supported');
          return false;
          // const video = vkPost.attachments[p].video;
          // console.log({ video });
          // if (video.platform === 'YouTube') {
          //   const videoUrl = `https://vk.com/video${video.owner_id}_${video.id}`;
          //   post.videos.push(videoUrl);
          //   post.types.video = true;
          // }
        }

        if (vkPost.attachments[p].type == 'link') {
          post.link = vkPost.attachments[p].link.url;
          post.types.link = true;
        }
      }
    }

    if (vkPost.hasOwnProperty('copy_history')) {
      const repost = vkPost.copy_history[0];

      const repostPost = this.prepareTgPost(repost);
      if (!repostPost) {
        return false;
      }

      if (repostPost.text) {
        const originalLink = `https://vk.com/wall-${Math.abs(repost.from_id)}_${repost.id}`;
        post.text += `\n\n ${repostPost.text} \n\nСсылка на оригинальный пост: ${originalLink}\n\n`;
        post.types.text = true;
      }

      if (repostPost.photos.length > 0) {
        post.photos = post.photos.concat(repostPost.photos);
        post.types.photo = true;
      }
    }

    return post;
  }

  async sendMessageToTelegram(chatId: string, vkPost: { object: VkPost }) {
    const preparedPost = this.prepareTgPost(vkPost.object);
    const post = this.parseLinks(preparedPost);
    if (!post) {
      return;
    }

    try {
      // Send text and photo in one post
      if (post.types.photo && post.types.text) {
        // This is a trick to send a group of pictures with a description, the first picture should have a caption
        post.photos[0].caption = this.md2escape(post.text.slice(0, 1024));
        await this.bot.telegram.sendMediaGroup(chatId, post.photos);
        return;
      }

      // Temporarily unsupported
      // Send text and video link (if video is from YouTube or other platform)
      if (post.types.video && post.types.text) {
        const messageText = `${post.text.slice(0, 1024)}\n\nСсылка на видео: ${post.videos[0]}`;
        await this.bot.telegram.sendMessage(chatId, messageText, {
          parse_mode: 'MarkdownV2',
        });
        return;
      }

      // Send text and link
      if (post.types.text && post.types.link) {
        const message = `${post.text}\n\n${post.link}`;
        await this.bot.telegram.sendMessage(chatId, message, {
          parse_mode: 'MarkdownV2',
        });
        return;
      }

      // Send photo
      if (post.types.photo) {
        await this.bot.telegram.sendMediaGroup(chatId, post.photos);
        return;
      }

      // Send link
      if (post.types.link) {
        await this.bot.telegram.sendMessage(chatId, post.link);
        return;
      }

      if (post.types.text) {
        await this.bot.telegram.sendMessage(chatId, this.md2escape(post.text), {
          parse_mode: 'MarkdownV2',
        });
        return;
      }
    } catch (error) {
      console.error('Failed to send message to Telegram:', error);
    }
  }

  // Convert VK links to Markdown
  private parseLinks(post) {
    if (post.types.text === true) {
      let text = post.text;
      const regex = /\[\S+\|[^\]]+\]/;
      while (regex.exec(text) != null) {
        const search = regex.exec(text);
        //console.log(search)
        const replacement =
          '[' +
          /[^|]+\]/.exec(search[0])[0].slice(0, -1) +
          '](https://vk.com/' +
          /\[[^|]+/.exec(search[0])[0].slice(1) +
          ')';
        while (text.indexOf(search[0]) != -1) {
          text = text.replace(search[0], replacement);
        }
      }
      post.text = text;
    }
    return post;
  }

  // Escape all markdown in text, longText and captions
  // Markdown2 requires extensive escaping, but we must not break links
  private md2escape = (text) => {
    // Escape everything except links (including link text)
    const tgescape = /(\[[^\][]*]\(http[^()]*\))|[-_.+?!#^`>*~|=$[\](){}\\]/gi;
    text = text.replace(tgescape, (x, y) => (y ? y : '\\' + x));
    // Escape text in links
    const regex = /\[[^\]]+\]\(/;
    let search = regex.exec(text);
    let escapedLinks = null;

    if (search != null) {
      escapedLinks = text.slice(0, search.index);
      text = text.slice(search.index);
    }

    if (regex.exec(text) != null) {
      while (regex.exec(text) != null) {
        search = regex.exec(text);
        let escapedLink = search[0].slice(1, search[0].length - 2);
        escapedLink =
          '[' +
          escapedLink.replace(tgescape, (x, y) => (y ? y : '\\' + x)) +
          ']';
        escapedLinks = escapedLinks + text.slice(0, search.index) + escapedLink;
        text = text.slice(search.index + search[0].length - 1);
      }
    }

    if (text.length > 0) {
      if (escapedLinks != null) {
        escapedLinks = escapedLinks + text;
        console.log(escapedLinks);
      }
    }

    if (escapedLinks == null) {
      return text;
    } else {
      return escapedLinks;
    }
  };
}

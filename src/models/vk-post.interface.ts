interface VkPhotoSize {
  type: string;
  url: string;
  width: number;
  height: number;
}

interface VkPhoto {
  id: number;
  album_id: number;
  owner_id: number;
  user_id: number;
  text: string;
  date: number;
  sizes: VkPhotoSize[];
  width: number;
  height: number;
  photo_75: string;
  photo_130: string;
  photo_604: string;
  photo_807: string;
  photo_1280: string;
  photo_2560: string;
}

interface VkLink {
  url: string;
  title: string;
  description: string;
  photo: {
    url: string;
    width: number;
    height: number;
  };
}

interface VkVideo {
  id: number;
  owner_id: number;
  title: string;
  description: string;
  duration: number;
  image: string;
  first_frame: string;
  date: number;
  views: number;
  platform: string;
}

interface VkAttachment {
  type: 'photo' | 'video' | 'link';
  photo?: VkPhoto;
  video?: VkVideo;
  link?: VkLink;
}

export interface VkPost {
  id: number;
  owner_id: number;
  from_id: number;
  date: number;
  text: string;
  attachments?: VkAttachment[];
  copy_history: VkPost;
  likes: {
    count: number;
  };
  comments: {
    count: number;
  };
  reposts: {
    count: number;
  };
  views: {
    count: number;
  };
}

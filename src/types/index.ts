export type Profile = {
  id: string;
  username: string | null;
  name: string | null;
  bio: string | null;
  website: string | null;
  image: string | null;
  is_verified: boolean;
  is_private: boolean;
  created_at: string;
  _count?: { followers: number; following: number; posts: number };
  is_following?: boolean;
};

export type Post = {
  id: string;
  user_id: string;
  user: Profile;
  type: 'photo' | 'video' | 'carousel';
  caption: string | null;
  location: string | null;
  media_urls: string[];
  created_at: string;
  _count?: { likes: number; comments: number };
  is_liked?: boolean;
  is_saved?: boolean;
};

export type Reel = {
  id: string;
  user_id: string;
  user: Profile;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  audio_title: string | null;
  audio_artist: string | null;
  views: number;
  created_at: string;
  _count?: { likes: number; comments: number };
  is_liked?: boolean;
};

export type Story = {
  id: string;
  user_id: string;
  user: Profile;
  media_url: string;
  media_type: 'image' | 'video';
  duration: number;
  created_at: string;
  expires_at: string;
  is_viewed?: boolean;
};

export type Comment = {
  id: string;
  user_id: string;
  user: Profile;
  post_id: string | null;
  reel_id: string | null;
  parent_id: string | null;
  content: string;
  created_at: string;
  _count?: { likes: number; replies: number };
  is_liked?: boolean;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender: Profile;
  content: string | null;
  media_url: string | null;
  media_type: 'image' | 'audio' | 'video' | null;
  reply_to_id: string | null;
  reply_to?: Message | null;
  is_read: boolean;
  created_at: string;
};

export type Conversation = {
  id: string;
  is_group: boolean;
  group_name: string | null;
  group_avatar_url: string | null;
  participants: Profile[];
  last_message: Message | null;
  unread_count: number;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  actor: Profile;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message';
  target_id: string | null;
  target_type: string | null;
  is_read: boolean;
  created_at: string;
  post?: Post | null;
};

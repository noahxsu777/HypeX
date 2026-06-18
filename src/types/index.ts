export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  website?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified: boolean;
  isPrivate: boolean;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isBlocked: boolean;
  stories: Story[];
  highlights: Highlight[];
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  type: 'photo' | 'video' | 'carousel';
  media: MediaItem[];
  caption: string;
  hashtags: string[];
  likes: number;
  comments: Comment[];
  isLiked: boolean;
  isSaved: boolean;
  location?: string;
  createdAt: string;
  views?: number;
}

export interface Reel {
  id: string;
  userId: string;
  user: User;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  hashtags: string[];
  likes: number;
  comments: Comment[];
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
  audio: {
    title: string;
    artist: string;
  };
  createdAt: string;
  views: number;
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  text: string;
  likes: number;
  isLiked: boolean;
  replies: Comment[];
  createdAt: string;
}

export interface Story {
  id: string;
  userId: string;
  user: User;
  media: MediaItem;
  duration: number;
  viewers: number;
  isViewed: boolean;
  createdAt: string;
  expiresAt: string;
  stickers?: Sticker[];
}

export interface Highlight {
  id: string;
  title: string;
  coverUrl: string;
  stories: Story[];
}

export interface Sticker {
  id: string;
  type: 'text' | 'emoji' | 'poll' | 'question';
  content: string;
  position: { x: number; y: number };
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'video';
  isRead: boolean;
  createdAt: string;
  replyTo?: Message;
  reactions?: { emoji: string; userId: string }[];
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'tag' | 'story_view' | 'live';
  fromUser: User;
  post?: Post;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export interface AppSettings {
  darkMode: boolean;
  language: string;
  notifications: {
    likes: boolean;
    comments: boolean;
    follows: boolean;
    messages: boolean;
    mentions: boolean;
    stories: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  privacy: {
    privateAccount: boolean;
    showActivity: boolean;
    allowTagging: boolean;
    allowMentions: 'everyone' | 'followers' | 'none';
    showSuggestedContent: boolean;
    dataSharing: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    loginAlerts: boolean;
    savedDevices: SavedDevice[];
    loginActivity: LoginActivity[];
  };
}

export interface SavedDevice {
  id: string;
  name: string;
  location: string;
  lastSeen: string;
  isCurrent: boolean;
}

export interface LoginActivity {
  id: string;
  device: string;
  location: string;
  date: string;
  isCurrentSession: boolean;
}

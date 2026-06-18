export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string | null;
  bio: string | null;
  website: string | null;
  isVerified: boolean;
  isPrivate: boolean;
  createdAt: Date;
  _count?: {
    followers: number;
    following: number;
    posts: number;
  };
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isBlocked?: boolean;
};

export type Post = {
  id: string;
  userId: string;
  user: User;
  type: 'photo' | 'video' | 'carousel';
  caption: string | null;
  location: string | null;
  mediaUrls: string[];
  createdAt: Date;
  _count?: { likes: number; comments: number };
  isLiked?: boolean;
  isSaved?: boolean;
};

export type Reel = {
  id: string;
  userId: string;
  user: User;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  audioTitle: string | null;
  audioArtist: string | null;
  views: number;
  createdAt: Date;
  _count?: { likes: number; comments: number };
  isLiked?: boolean;
  isSaved?: boolean;
};

export type Story = {
  id: string;
  userId: string;
  user: User;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  duration: number;
  createdAt: Date;
  expiresAt: Date;
  isViewed?: boolean;
};

export type Comment = {
  id: string;
  userId: string;
  user: User;
  postId: string | null;
  reelId: string | null;
  parentId: string | null;
  content: string;
  createdAt: Date;
  _count?: { likes: number; replies: number };
  isLiked?: boolean;
  replies?: Comment[];
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  content: string | null;
  mediaUrl: string | null;
  mediaType: 'image' | 'audio' | 'video' | null;
  replyToId: string | null;
  replyTo?: Message | null;
  isRead: boolean;
  createdAt: Date;
};

export type Conversation = {
  id: string;
  isGroup: boolean;
  groupName: string | null;
  groupAvatarUrl: string | null;
  participants: User[];
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: Date;
};

export type Notification = {
  id: string;
  userId: string;
  actor: User;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message';
  targetId: string | null;
  targetType: string | null;
  isRead: boolean;
  createdAt: Date;
  post?: Post | null;
};

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
};

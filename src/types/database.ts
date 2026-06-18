export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          name: string | null;
          bio: string | null;
          website: string | null;
          image: string | null;
          is_verified: boolean;
          is_private: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          name?: string | null;
          bio?: string | null;
          website?: string | null;
          image?: string | null;
          is_verified?: boolean;
          is_private?: boolean;
          created_at?: string;
        };
        Update: {
          username?: string | null;
          name?: string | null;
          bio?: string | null;
          website?: string | null;
          image?: string | null;
          is_verified?: boolean;
          is_private?: boolean;
        };
        Relationships: [];
      };
      follows: {
        Row: { follower_id: string; following_id: string; created_at: string };
        Insert: { follower_id: string; following_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          type: 'photo' | 'video' | 'carousel';
          caption: string | null;
          location: string | null;
          media_urls: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          type: 'photo' | 'video' | 'carousel';
          caption?: string | null;
          location?: string | null;
          media_urls?: string[];
        };
        Update: {
          caption?: string | null;
          location?: string | null;
          media_urls?: string[];
        };
        Relationships: [];
      };
      reels: {
        Row: {
          id: string;
          user_id: string;
          video_url: string;
          thumbnail_url: string | null;
          caption: string | null;
          audio_title: string | null;
          audio_artist: string | null;
          views: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          video_url: string;
          thumbnail_url?: string | null;
          caption?: string | null;
          audio_title?: string | null;
          audio_artist?: string | null;
        };
        Update: { views?: number };
        Relationships: [];
      };
      stories: {
        Row: {
          id: string;
          user_id: string;
          media_url: string;
          media_type: 'image' | 'video';
          duration: number;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          user_id: string;
          media_url: string;
          media_type: 'image' | 'video';
          duration?: number;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          target_id: string;
          target_type: 'post' | 'reel' | 'comment';
        };
        Insert: {
          user_id: string;
          target_id: string;
          target_type: 'post' | 'reel' | 'comment';
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          reel_id: string | null;
          parent_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          post_id?: string | null;
          reel_id?: string | null;
          parent_id?: string | null;
          content: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      saved_posts: {
        Row: { user_id: string; post_id: string; saved_at: string };
        Insert: { user_id: string; post_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          is_group: boolean;
          group_name: string | null;
          group_avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          is_group?: boolean;
          group_name?: string | null;
          group_avatar_url?: string | null;
        };
        Update: { updated_at?: string };
        Relationships: [];
      };
      conversation_participants: {
        Row: { conversation_id: string; user_id: string };
        Insert: { conversation_id: string; user_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string | null;
          media_url: string | null;
          media_type: 'image' | 'audio' | 'video' | null;
          reply_to_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          conversation_id: string;
          sender_id: string;
          content?: string | null;
          media_url?: string | null;
          media_type?: 'image' | 'audio' | 'video' | null;
          reply_to_id?: string | null;
        };
        Update: { is_read?: boolean };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string;
          type: 'like' | 'comment' | 'follow' | 'mention' | 'message';
          target_id: string | null;
          target_type: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          actor_id: string;
          type: 'like' | 'comment' | 'follow' | 'mention' | 'message';
          target_id?: string | null;
          target_type?: string | null;
        };
        Update: { is_read?: boolean };
        Relationships: [];
      };
      blocks: {
        Row: { blocker_id: string; blocked_id: string };
        Insert: { blocker_id: string; blocked_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Post, Reel, Story, Conversation, Notification, User, AppSettings, Message } from '../types';
import {
  MOCK_POSTS, MOCK_REELS, MOCK_STORIES, MOCK_CONVERSATIONS,
  MOCK_NOTIFICATIONS, MOCK_USERS, CURRENT_USER,
} from '../data/mockData';

interface AppState {
  // Auth
  currentUser: User;

  // Content
  posts: Post[];
  reels: Reel[];
  stories: Story[];
  conversations: Conversation[];
  notifications: Notification[];
  users: User[];

  // UI State
  darkMode: boolean;
  activeStoryIndex: number | null;
  activeConversationId: string | null;

  // Settings
  settings: AppSettings;

  // Actions
  toggleDarkMode: () => void;
  toggleLikePost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  toggleLikeReel: (reelId: string) => void;
  toggleSaveReel: (reelId: string) => void;
  toggleFollow: (userId: string) => void;
  markStoryViewed: (storyId: string) => void;
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;
  sendMessage: (conversationId: string, message: Omit<Message, 'id' | 'createdAt'>) => void;
  setActiveConversation: (id: string | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateProfile: (updates: Partial<User>) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  getUnreadNotificationsCount: () => number;
  getUnreadMessagesCount: () => number;
}

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  language: 'es',
  notifications: {
    likes: true,
    comments: true,
    follows: true,
    messages: true,
    mentions: true,
    stories: true,
    emailNotifications: false,
    pushNotifications: true,
  },
  privacy: {
    privateAccount: false,
    showActivity: true,
    allowTagging: true,
    allowMentions: 'everyone',
    showSuggestedContent: true,
    dataSharing: false,
  },
  security: {
    twoFactorEnabled: false,
    loginAlerts: true,
    savedDevices: [
      {
        id: 'd1',
        name: 'iPhone 15 Pro',
        location: 'Madrid, Spain',
        lastSeen: new Date().toISOString(),
        isCurrent: true,
      },
      {
        id: 'd2',
        name: 'MacBook Pro',
        location: 'Madrid, Spain',
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        isCurrent: false,
      },
    ],
    loginActivity: [
      {
        id: 'la1',
        device: 'iPhone 15 Pro',
        location: 'Madrid, Spain',
        date: new Date().toISOString(),
        isCurrentSession: true,
      },
    ],
  },
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: CURRENT_USER,
      posts: MOCK_POSTS,
      reels: MOCK_REELS,
      stories: MOCK_STORIES,
      conversations: MOCK_CONVERSATIONS,
      notifications: MOCK_NOTIFICATIONS,
      users: MOCK_USERS,
      darkMode: false,
      activeStoryIndex: null,
      activeConversationId: null,
      settings: DEFAULT_SETTINGS,

      toggleDarkMode: () => {
        const newDark = !get().darkMode;
        set({ darkMode: newDark });
        if (newDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      toggleLikePost: (postId) => set((state) => ({
        posts: state.posts.map(p =>
          p.id === postId
            ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
            : p
        ),
      })),

      toggleSavePost: (postId) => set((state) => ({
        posts: state.posts.map(p =>
          p.id === postId ? { ...p, isSaved: !p.isSaved } : p
        ),
      })),

      toggleLikeReel: (reelId) => set((state) => ({
        reels: state.reels.map(r =>
          r.id === reelId
            ? { ...r, isLiked: !r.isLiked, likes: r.isLiked ? r.likes - 1 : r.likes + 1 }
            : r
        ),
      })),

      toggleSaveReel: (reelId) => set((state) => ({
        reels: state.reels.map(r =>
          r.id === reelId ? { ...r, isSaved: !r.isSaved } : r
        ),
      })),

      toggleFollow: (userId) => set((state) => ({
        users: state.users.map(u =>
          u.id === userId
            ? {
                ...u,
                isFollowing: !u.isFollowing,
                followersCount: u.isFollowing ? u.followersCount - 1 : u.followersCount + 1,
              }
            : u
        ),
        posts: state.posts.map(p =>
          p.userId === userId
            ? {
                ...p,
                user: {
                  ...p.user,
                  isFollowing: !p.user.isFollowing,
                  followersCount: p.user.isFollowing ? p.user.followersCount - 1 : p.user.followersCount + 1,
                },
              }
            : p
        ),
      })),

      markStoryViewed: (storyId) => set((state) => ({
        stories: state.stories.map(s =>
          s.id === storyId ? { ...s, isViewed: true } : s
        ),
      })),

      markNotificationRead: (notifId) => set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === notifId ? { ...n, isRead: true } : n
        ),
      })),

      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      })),

      sendMessage: (conversationId, message) => set((state) => {
        const newMessage: Message = {
          ...message,
          id: `msg-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        return {
          conversations: state.conversations.map(c =>
            c.id === conversationId
              ? { ...c, lastMessage: newMessage, updatedAt: new Date().toISOString() }
              : c
          ),
        };
      }),

      setActiveConversation: (id) => set({ activeConversationId: id }),

      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),

      updateProfile: (updates) => set((state) => ({
        currentUser: { ...state.currentUser, ...updates },
      })),

      blockUser: (userId) => set((state) => ({
        users: state.users.map(u =>
          u.id === userId ? { ...u, isBlocked: true, isFollowing: false } : u
        ),
      })),

      unblockUser: (userId) => set((state) => ({
        users: state.users.map(u =>
          u.id === userId ? { ...u, isBlocked: false } : u
        ),
      })),

      getUnreadNotificationsCount: () => {
        return get().notifications.filter(n => !n.isRead).length;
      },

      getUnreadMessagesCount: () => {
        return get().conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      },
    }),
    {
      name: 'hypex-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        settings: state.settings,
        currentUser: state.currentUser,
        posts: state.posts,
        reels: state.reels,
        stories: state.stories,
        users: state.users,
      }),
    }
  )
);

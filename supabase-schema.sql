-- =====================================================
-- HypeX - Schema para Supabase
-- Pega este SQL en el SQL Editor de Supabase
-- =====================================================

-- 1. Tabla de perfiles (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  name TEXT,
  bio TEXT,
  website TEXT,
  image TEXT,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  is_private BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Follows
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (follower_id, following_id)
);

-- 3. Blocks
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id)
);

-- 4. Posts
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('photo', 'video', 'carousel')) NOT NULL,
  caption TEXT,
  location TEXT,
  media_urls TEXT[] DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Reels
CREATE TABLE IF NOT EXISTS public.reels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  audio_title TEXT,
  audio_artist TEXT,
  views INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Stories
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')) NOT NULL,
  duration INTEGER DEFAULT 5000 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL
);

-- 7. Likes
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID NOT NULL,
  target_type TEXT CHECK (target_type IN ('post', 'reel', 'comment')) NOT NULL,
  UNIQUE (user_id, target_id, target_type)
);

-- 8. Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Saved posts
CREATE TABLE IF NOT EXISTS public.saved_posts (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, post_id)
);

-- 10. Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  is_group BOOLEAN DEFAULT false NOT NULL,
  group_name TEXT,
  group_avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. Conversation participants
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (conversation_id, user_id)
);

-- 12. Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'audio', 'video')),
  reply_to_id UUID REFERENCES public.messages(id),
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('like', 'comment', 'follow', 'mention', 'message')) NOT NULL,
  target_id UUID,
  target_type TEXT,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- Índices para performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- =====================================================
-- Habilitar Realtime (para mensajes y notificaciones en vivo)
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Perfiles visibles para todos" ON profiles FOR SELECT USING (true);
CREATE POLICY "Usuarios crean su propio perfil" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Usuarios actualizan su propio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts
CREATE POLICY "Posts visibles para todos" ON posts FOR SELECT USING (true);
CREATE POLICY "Usuarios crean sus posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios eliminan sus posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Reels
CREATE POLICY "Reels visibles para todos" ON reels FOR SELECT USING (true);
CREATE POLICY "Usuarios crean sus reels" ON reels FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stories
CREATE POLICY "Stories activas visibles" ON stories FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Usuarios crean sus stories" ON stories FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Likes
CREATE POLICY "Likes visibles para todos" ON likes FOR SELECT USING (true);
CREATE POLICY "Usuarios gestionan sus likes" ON likes FOR ALL USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Comentarios visibles para todos" ON comments FOR SELECT USING (true);
CREATE POLICY "Usuarios crean comentarios" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios eliminan sus comentarios" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Saved posts
CREATE POLICY "Usuarios gestionan sus guardados" ON saved_posts FOR ALL USING (auth.uid() = user_id);

-- Follows
CREATE POLICY "Follows visibles para todos" ON follows FOR SELECT USING (true);
CREATE POLICY "Usuarios gestionan sus follows" ON follows FOR ALL USING (auth.uid() = follower_id);

-- Conversations (solo participantes)
CREATE POLICY "Participantes ven sus conversaciones" ON conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = conversations.id AND user_id = auth.uid())
);
CREATE POLICY "Autenticados crean conversaciones" ON conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Participantes actualizan conversaciones" ON conversations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = conversations.id AND user_id = auth.uid())
);

-- Conversation participants
CREATE POLICY "Participantes ven otros participantes" ON conversation_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Autenticados añaden participantes" ON conversation_participants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Messages
CREATE POLICY "Participantes ven mensajes" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Participantes envían mensajes" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Participantes actualizan mensajes" ON messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

-- Notifications
CREATE POLICY "Usuarios ven sus notificaciones" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Sistema crea notificaciones" ON notifications FOR INSERT WITH CHECK (auth.uid() = actor_id);
CREATE POLICY "Usuarios actualizan sus notificaciones" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Blocks
CREATE POLICY "Usuarios gestionan sus bloqueos" ON blocks FOR ALL USING (auth.uid() = blocker_id);

-- =====================================================
-- Trigger: crear perfil al registrarse
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, username, image)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9_.]', '_', 'g'))
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Storage bucket para medios
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT DO NOTHING;

-- Política: cualquiera puede ver archivos
CREATE POLICY "Archivos de media publicos" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- Política: usuarios autenticados pueden subir
CREATE POLICY "Usuarios suben sus archivos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid() IS NOT NULL);

-- Política: usuarios eliminan sus propios archivos
CREATE POLICY "Usuarios eliminan sus archivos" ON storage.objects
  FOR DELETE USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- DadJokes App - Multi-Tenant Database Schema
-- ============================================================================
-- This migration creates all tables needed for the DadJokes app.
-- All tables include app_id for multi-tenant isolation except shared tables.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SHARED TABLES (no app_id)
-- ============================================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User app context (tracks which apps a user has accessed)
CREATE TABLE IF NOT EXISTS user_app_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_id TEXT NOT NULL,
  first_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app_id)
);

ALTER TABLE user_app_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own app context" ON user_app_context
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own app context" ON user_app_context
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- APP-ISOLATED TABLES (have app_id column)
-- ============================================================================

-- Jokes table (shared joke library)
CREATE TABLE IF NOT EXISTS jokes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id TEXT NOT NULL DEFAULT 'dadjokes',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  setup TEXT NOT NULL,
  punchline TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  rating DECIMAL(2,1) DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jokes_app_id ON jokes(app_id);
CREATE INDEX IF NOT EXISTS idx_jokes_category ON jokes(category);
CREATE INDEX IF NOT EXISTS idx_jokes_user_id ON jokes(user_id);

ALTER TABLE jokes ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved jokes for this app
CREATE POLICY "Anyone can read approved jokes" ON jokes
  FOR SELECT USING (is_approved = TRUE);

-- Users can read their own submitted jokes
CREATE POLICY "Users can read own jokes" ON jokes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create jokes
CREATE POLICY "Users can create jokes" ON jokes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own jokes
CREATE POLICY "Users can update own jokes" ON jokes
  FOR UPDATE USING (auth.uid() = user_id);

-- User favorites
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id TEXT NOT NULL DEFAULT 'dadjokes',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joke_id UUID REFERENCES jokes(id) ON DELETE CASCADE,
  joke_id_text TEXT, -- For client-side joke IDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(app_id, user_id, joke_id),
  UNIQUE(app_id, user_id, joke_id_text)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_app_user ON user_favorites(app_id, user_id);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites" ON user_favorites
  FOR ALL USING (auth.uid() = user_id);

-- User collections (custom joke folders)
CREATE TABLE IF NOT EXISTS user_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id TEXT NOT NULL DEFAULT 'dadjokes',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📁',
  joke_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_collections_app_user ON user_collections(app_id, user_id);

ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own collections" ON user_collections
  FOR ALL USING (auth.uid() = user_id);

-- User streaks (gamification)
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id TEXT NOT NULL DEFAULT 'dadjokes',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_viewed_date DATE,
  total_jokes_viewed INTEGER DEFAULT 0,
  streak_badges TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(app_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_app_user ON user_streaks(app_id, user_id);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own streaks" ON user_streaks
  FOR ALL USING (auth.uid() = user_id);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id TEXT NOT NULL DEFAULT 'dadjokes',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  favorite_categories TEXT[] DEFAULT '{}',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  autoplay_enabled BOOLEAN DEFAULT FALSE,
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  daily_joke_time TIME DEFAULT '09:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(app_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_app_user ON user_preferences(app_id, user_id);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jokes_updated_at ON jokes;
CREATE TRIGGER update_jokes_updated_at
  BEFORE UPDATE ON jokes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_collections_updated_at ON user_collections;
CREATE TRIGGER update_user_collections_updated_at
  BEFORE UPDATE ON user_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_streaks_updated_at ON user_streaks;
CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- SEED DATA: Pre-loaded Dad Jokes
-- ============================================================================

INSERT INTO jokes (app_id, setup, punchline, category, is_approved, rating) VALUES
-- Classic
('dadjokes', 'Why don''t scientists trust atoms?', 'Because they make up everything!', 'classic', TRUE, 4.5),
('dadjokes', 'I''m reading a book about anti-gravity.', 'It''s impossible to put down!', 'classic', TRUE, 4.3),
('dadjokes', 'Why did the scarecrow win an award?', 'Because he was outstanding in his field!', 'classic', TRUE, 4.7),
('dadjokes', 'I used to hate facial hair...', 'But then it grew on me.', 'classic', TRUE, 4.2),
('dadjokes', 'What do you call a fake noodle?', 'An impasta!', 'classic', TRUE, 4.6),

-- Food
('dadjokes', 'Why did the coffee file a police report?', 'It got mugged!', 'food', TRUE, 4.4),
('dadjokes', 'What do you call cheese that isn''t yours?', 'Nacho cheese!', 'food', TRUE, 4.8),
('dadjokes', 'Why don''t eggs tell jokes?', 'They''d crack each other up!', 'food', TRUE, 4.3),
('dadjokes', 'What did the grape do when it got stepped on?', 'It let out a little wine!', 'food', TRUE, 4.5),
('dadjokes', 'I''m on a seafood diet.', 'I see food and I eat it!', 'food', TRUE, 4.1),

-- Animals
('dadjokes', 'What do you call a bear with no teeth?', 'A gummy bear!', 'animals', TRUE, 4.7),
('dadjokes', 'Why do cows wear bells?', 'Because their horns don''t work!', 'animals', TRUE, 4.4),
('dadjokes', 'What do you call a fish without eyes?', 'A fsh!', 'animals', TRUE, 4.6),
('dadjokes', 'Why don''t oysters share?', 'Because they''re shellfish!', 'animals', TRUE, 4.5),
('dadjokes', 'What do you call a sleeping dinosaur?', 'A dino-snore!', 'animals', TRUE, 4.3),

-- Work
('dadjokes', 'I got fired from my job at the bank today.', 'A woman asked me to check her balance, so I pushed her over.', 'work', TRUE, 4.2),
('dadjokes', 'Why did the math book look so sad?', 'Because it had too many problems!', 'work', TRUE, 4.4),
('dadjokes', 'I used to work at a calendar factory...', 'But I got fired for taking a few days off.', 'work', TRUE, 4.5),
('dadjokes', 'Why don''t some couples go to the gym?', 'Because some relationships don''t work out!', 'work', TRUE, 4.1),
('dadjokes', 'I''m terrified of elevators...', 'So I''m going to start taking steps to avoid them.', 'work', TRUE, 4.6),

-- Technology
('dadjokes', 'Why do programmers prefer dark mode?', 'Because light attracts bugs!', 'technology', TRUE, 4.8),
('dadjokes', 'Why was the computer cold?', 'It left its Windows open!', 'technology', TRUE, 4.3),
('dadjokes', 'What''s a computer''s favorite snack?', 'Microchips!', 'technology', TRUE, 4.2),
('dadjokes', 'Why did the PowerPoint presentation cross the road?', 'To get to the other slide!', 'technology', TRUE, 4.4),
('dadjokes', 'I would tell you a UDP joke...', 'But you might not get it.', 'technology', TRUE, 4.7),

-- Family
('dadjokes', 'Dad, can you put my shoes on?', 'No, I don''t think they''ll fit me!', 'family', TRUE, 4.5),
('dadjokes', 'I''m afraid for the calendar.', 'Its days are numbered!', 'family', TRUE, 4.3),
('dadjokes', 'What did the ocean say to the beach?', 'Nothing, it just waved!', 'family', TRUE, 4.6),
('dadjokes', 'Why can''t you give Elsa a balloon?', 'Because she will let it go!', 'family', TRUE, 4.4),
('dadjokes', 'I don''t trust stairs.', 'They''re always up to something!', 'family', TRUE, 4.5),

-- Sports
('dadjokes', 'Why do basketball players love donuts?', 'Because they can dunk them!', 'sports', TRUE, 4.2),
('dadjokes', 'What''s a golfer''s favorite letter?', 'Tee!', 'sports', TRUE, 4.1),
('dadjokes', 'Why did the bicycle fall over?', 'Because it was two-tired!', 'sports', TRUE, 4.7),
('dadjokes', 'What do you call a boomerang that doesn''t come back?', 'A stick!', 'sports', TRUE, 4.4),
('dadjokes', 'Why are football stadiums so cold?', 'Because they''re full of fans!', 'sports', TRUE, 4.3),

-- Science
('dadjokes', 'Why can''t you trust an atom?', 'They make up literally everything!', 'science', TRUE, 4.5),
('dadjokes', 'I would tell you a chemistry joke...', 'But I know I wouldn''t get a reaction.', 'science', TRUE, 4.6),
('dadjokes', 'What did one ion say to the other?', 'I''ve got my ion you!', 'science', TRUE, 4.2),
('dadjokes', 'Why did the photon check into a hotel?', 'Because it was traveling light!', 'science', TRUE, 4.4),
('dadjokes', 'What do you do with a sick chemist?', 'If you can''t helium and you can''t curium, you''ll have to barium!', 'science', TRUE, 4.7),

-- Music
('dadjokes', 'Why did the musician throw away her metronome?', 'Because she couldn''t keep up with it!', 'music', TRUE, 4.3),
('dadjokes', 'What''s a skeleton''s favorite instrument?', 'The trombone!', 'music', TRUE, 4.5),
('dadjokes', 'Why couldn''t the string quartet find their composer?', 'He was Haydn!', 'music', TRUE, 4.1),
('dadjokes', 'What do you call a musical insect?', 'A humbug!', 'music', TRUE, 4.2),
('dadjokes', 'Why did the pianist keep banging his head against the keys?', 'He was playing by ear!', 'music', TRUE, 4.4),

-- Travel
('dadjokes', 'I asked my French friend if she likes to play video games.', 'She said, "Wii!"', 'travel', TRUE, 4.3),
('dadjokes', 'Why don''t mountains ever get cold?', 'They wear snow caps!', 'travel', TRUE, 4.5),
('dadjokes', 'What do you call a lazy kangaroo?', 'A pouch potato!', 'travel', TRUE, 4.6),
('dadjokes', 'Why did the airplane break up with the helicopter?', 'It needed more space!', 'travel', TRUE, 4.2),
('dadjokes', 'What did the beach say when the tide came in?', 'Long time, no sea!', 'travel', TRUE, 4.4)

ON CONFLICT DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Learning Progress System
-- Account-based progress, XP, streak, saved lessons, and recent learning/brief activity.

CREATE TABLE IF NOT EXISTS learning_progress (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  lesson_title TEXT NOT NULL,
  lesson_xp INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS learning_saved_lessons (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  lesson_title TEXT NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS learning_recent_items (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('lesson', 'brief')),
  item_id TEXT NOT NULL,
  title TEXT NOT NULL,
  href TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS learning_user_stats (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user_completed
  ON learning_progress(user_id, completed, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_saved_lessons_user
  ON learning_saved_lessons(user_id, saved_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_recent_items_user
  ON learning_recent_items(user_id, viewed_at DESC);

ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_saved_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_recent_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning progress"
  ON learning_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning progress"
  ON learning_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning progress"
  ON learning_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own learning progress"
  ON learning_progress FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own saved lessons"
  ON learning_saved_lessons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved lessons"
  ON learning_saved_lessons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved lessons"
  ON learning_saved_lessons FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recent items"
  ON learning_recent_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recent items"
  ON learning_recent_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recent items"
  ON learning_recent_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recent items"
  ON learning_recent_items FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own learning stats"
  ON learning_user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning stats"
  ON learning_user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning stats"
  ON learning_user_stats FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

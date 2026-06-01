-- Recommendation & Personalization Engine
-- Caches a lightweight interest profile generated from learning and brief activity.

CREATE TABLE IF NOT EXISTS user_interest_profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  topics JSONB DEFAULT '[]',
  dominant_track TEXT,
  learning_stage TEXT DEFAULT 'beginner' CHECK (learning_stage IN ('beginner', 'intermediate', 'adaptive')),
  confidence NUMERIC(4, 3) DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_interest_profiles_stage
  ON user_interest_profiles(learning_stage);

ALTER TABLE user_interest_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interest profile"
  ON user_interest_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interest profile"
  ON user_interest_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interest profile"
  ON user_interest_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

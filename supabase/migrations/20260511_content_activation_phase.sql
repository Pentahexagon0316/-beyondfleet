-- Content Activation Phase
-- Adds structured Daily Brief editorial fields and reflection infrastructure for the MVP loop:
-- Daily Brief -> Learning -> Reflection -> Return.

ALTER TABLE daily_briefs
  ADD COLUMN IF NOT EXISTS what_happened TEXT,
  ADD COLUMN IF NOT EXISTS why_it_matters TEXT,
  ADD COLUMN IF NOT EXISTS second_order_effects TEXT,
  ADD COLUMN IF NOT EXISTS risk_conditions TEXT,
  ADD COLUMN IF NOT EXISTS reflection_prompt TEXT,
  ADD COLUMN IF NOT EXISTS related_lesson_ids TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS editorial_quality_score INTEGER DEFAULT 0 CHECK (editorial_quality_score >= 0 AND editorial_quality_score <= 100),
  ADD COLUMN IF NOT EXISTS reading_level TEXT DEFAULT 'foundational',
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS editor_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_daily_briefs_reflection_prompt
  ON daily_briefs(date DESC)
  WHERE reflection_prompt IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_daily_briefs_related_lessons
  ON daily_briefs USING GIN(related_lesson_ids);

CREATE TABLE IF NOT EXISTS daily_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES daily_briefs(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  insight_type TEXT DEFAULT 'daily' CHECK (insight_type IN ('daily', 'assumption', 'idea', 'weekly_review')),
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'shared')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_reflections_user_created
  ON daily_reflections(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_reflections_brief
  ON daily_reflections(brief_id);

ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily reflections"
  ON daily_reflections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily reflections"
  ON daily_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily reflections"
  ON daily_reflections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily reflections"
  ON daily_reflections FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS saved_assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES daily_briefs(id) ON DELETE SET NULL,
  assumption TEXT NOT NULL,
  revisit_trigger TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revisited', 'retired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revisited_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_saved_assumptions_user_status
  ON saved_assumptions(user_id, status, created_at DESC);

ALTER TABLE saved_assumptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved assumptions"
  ON saved_assumptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved assumptions"
  ON saved_assumptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved assumptions"
  ON saved_assumptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved assumptions"
  ON saved_assumptions FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS reading_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES daily_briefs(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  reading_progress INTEGER DEFAULT 100 CHECK (reading_progress >= 0 AND reading_progress <= 100),
  UNIQUE(user_id, brief_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_completions_user_completed
  ON reading_completions(user_id, completed_at DESC);

ALTER TABLE reading_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading completions"
  ON reading_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading completions"
  ON reading_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading completions"
  ON reading_completions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading completions"
  ON reading_completions FOR DELETE
  USING (auth.uid() = user_id);

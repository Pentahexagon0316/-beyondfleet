-- BeyondFleet Lessons Table Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  course TEXT DEFAULT 'basic' CHECK (course IN ('basic', 'pro')),
  thumbnail TEXT,
  read_time INTEGER DEFAULT 10,
  required_tier TEXT DEFAULT 'cadet',
  order_num INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 70,
  tag TEXT DEFAULT '',
  is_ai_generated BOOLEAN DEFAULT false,
  generated_at TIMESTAMPTZ,
  market_context TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast course filtering
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course);
CREATE INDEX IF NOT EXISTS idx_lessons_published ON lessons(is_published) WHERE is_published = true;

-- RLS (Row Level Security)
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Everyone can read published lessons
CREATE POLICY "Anyone can read published lessons"
  ON lessons FOR SELECT
  USING (is_published = true);

-- Only service role can insert/update (API routes use service key)
CREATE POLICY "Service role can manage lessons"
  ON lessons FOR ALL
  USING (auth.role() = 'service_role');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_lessons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_lessons_updated_at();

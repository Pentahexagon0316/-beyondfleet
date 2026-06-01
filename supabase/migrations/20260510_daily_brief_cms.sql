-- Daily Brief CMS fields
-- Adds editorial controls for publishing, premium access, categories, tags, and the pinned daily brief.

ALTER TABLE daily_briefs
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'market',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_daily_briefs_category
  ON daily_briefs(category);

CREATE INDEX IF NOT EXISTS idx_daily_briefs_tags
  ON daily_briefs USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_daily_briefs_published_featured
  ON daily_briefs(is_published, is_featured, date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_briefs_one_featured
  ON daily_briefs(is_featured)
  WHERE is_featured = TRUE;

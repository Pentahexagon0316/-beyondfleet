-- BeyondFleet Community Trust Migration
-- Adds is_editors_choice and tags columns to journal_entries for intellectual content filtration

ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS is_editors_choice BOOLEAN DEFAULT false;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_journal_editors_choice ON journal_entries(is_editors_choice) WHERE is_editors_choice = true;
CREATE INDEX IF NOT EXISTS idx_journal_tags ON journal_entries USING gin(tags);

-- Seed some existing public reflections with high-quality tags and editors_choice for mock view
UPDATE journal_entries
SET is_editors_choice = true,
    tags = ARRAY['macro', 'long-term', 'risk']
WHERE is_public = true AND (title LIKE '%금리%' OR title LIKE '%시장%' OR title LIKE '%거시%' OR title LIKE '%Bitcoin%');

UPDATE journal_entries
SET tags = ARRAY['crypto', 'valuation']
WHERE is_public = true AND tags = '{}'::TEXT[] AND (title LIKE '%SOL%' OR title LIKE '%Ethereum%' OR title LIKE '%NFT%');

DROP INDEX IF EXISTS idx_results_user_visible;
ALTER TABLE results DROP COLUMN IF EXISTS hidden_at;
ALTER TABLE results DROP COLUMN IF EXISTS saved;

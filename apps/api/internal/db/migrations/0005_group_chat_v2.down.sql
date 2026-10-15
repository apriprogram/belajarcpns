DROP TABLE IF EXISTS chat_reactions;
DROP INDEX IF EXISTS idx_chat_reply_to;
DROP INDEX IF EXISTS idx_chat_pinned;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS pinned_by;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS pinned_at;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS mentions;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS reply_to;
DELETE FROM settings WHERE key='chat_settings';

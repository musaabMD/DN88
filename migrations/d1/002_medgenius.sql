-- MedGenius AI platform tables (D1)
-- Run: wrangler d1 execute dn88-catalog --file=migrations/d1/002_medgenius.sql -c workers/dn88/wrangler.jsonc

-- User profiles with plan and credit balances
CREATE TABLE IF NOT EXISTS medgenius_users (
  user_id TEXT PRIMARY KEY,
  email TEXT,
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'student', 'pro')),
  credits_balance INTEGER NOT NULL DEFAULT 0,
  credits_used_month INTEGER NOT NULL DEFAULT 0,
  credits_month_key TEXT NOT NULL DEFAULT '',
  documents_count INTEGER NOT NULL DEFAULT 0,
  pages_processed INTEGER NOT NULL DEFAULT 0,
  daily_ai_tokens INTEGER NOT NULL DEFAULT 0,
  daily_tokens_key TEXT NOT NULL DEFAULT '',
  stripe_customer_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS medgenius_credit_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES medgenius_users(user_id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  operation TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON medgenius_credit_ledger(user_id, created_at);

-- Uploaded documents (processed once, stored forever)
CREATE TABLE IF NOT EXISTS medgenius_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES medgenius_users(user_id) ON DELETE CASCADE,
  exam_id TEXT,
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  file_hash TEXT NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 0,
  r2_original_key TEXT NOT NULL,
  r2_markdown_key TEXT,
  processing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'uploading', 'parsing', 'extracting', 'embedding', 'completed', 'failed')),
  processing_progress INTEGER NOT NULL DEFAULT 0,
  processing_error TEXT,
  context_dev_job_id TEXT,
  processed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_documents_user ON medgenius_documents(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON medgenius_documents(user_id, file_hash);
CREATE INDEX IF NOT EXISTS idx_documents_status ON medgenius_documents(processing_status);

-- Async processing jobs
CREATE TABLE IF NOT EXISTS medgenius_processing_jobs (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES medgenius_documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES medgenius_users(user_id) ON DELETE CASCADE,
  stage TEXT NOT NULL
    CHECK (stage IN ('parse', 'extract_questions', 'extract_topics', 'generate_embeddings', 'detect_duplicates', 'generate_flashcards')),
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  progress INTEGER NOT NULL DEFAULT 0,
  credits_reserved INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_doc ON medgenius_processing_jobs(document_id, created_at);

-- Extracted questions
CREATE TABLE IF NOT EXISTS medgenius_questions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES medgenius_users(user_id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES medgenius_documents(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  cleaned_text TEXT,
  options_json TEXT NOT NULL DEFAULT '[]',
  correct_answer INTEGER,
  ai_confidence REAL,
  explanation TEXT,
  topic TEXT,
  subtopic TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', NULL)),
  source_page INTEGER,
  tags_json TEXT NOT NULL DEFAULT '[]',
  duplicate_group_id TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'needs_review', 'verified', 'conflict')),
  conflict_recall_answer INTEGER,
  conflict_ai_answer INTEGER,
  conflict_confidence REAL,
  bookmark_count INTEGER NOT NULL DEFAULT 0,
  stats_correct INTEGER NOT NULL DEFAULT 0,
  stats_incorrect INTEGER NOT NULL DEFAULT 0,
  stats_skipped INTEGER NOT NULL DEFAULT 0,
  vector_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_questions_user ON medgenius_questions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_questions_doc ON medgenius_questions(document_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON medgenius_questions(user_id, topic);
CREATE INDEX IF NOT EXISTS idx_questions_duplicate ON medgenius_questions(duplicate_group_id);
CREATE INDEX IF NOT EXISTS idx_questions_verification ON medgenius_questions(user_id, verification_status);

-- Question images (clinical photos, ECG, etc.)
CREATE TABLE IF NOT EXISTS medgenius_question_images (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES medgenius_questions(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES medgenius_documents(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  page_number INTEGER,
  image_type TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_question_images_q ON medgenius_question_images(question_id);

-- Duplicate groups
CREATE TABLE IF NOT EXISTS medgenius_duplicate_groups (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES medgenius_users(user_id) ON DELETE CASCADE,
  topic TEXT,
  summary TEXT,
  question_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI-generated flashcards
CREATE TABLE IF NOT EXISTS medgenius_flashcards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES medgenius_users(user_id) ON DELETE CASCADE,
  document_id TEXT,
  question_id TEXT REFERENCES medgenius_questions(id) ON DELETE SET NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  high_yield_fact TEXT,
  memory_trick TEXT,
  topic TEXT,
  image_r2_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_flashcards_user ON medgenius_flashcards(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_flashcards_doc ON medgenius_flashcards(document_id);

-- Document summaries / smart notes
CREATE TABLE IF NOT EXISTS medgenius_summaries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES medgenius_users(user_id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES medgenius_documents(id) ON DELETE CASCADE,
  summary_type TEXT NOT NULL
    CHECK (summary_type IN ('summary', 'cheat_sheet', 'high_yield', 'exam_pearls', 'one_page')),
  content_markdown TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_summaries_doc ON medgenius_summaries(document_id, summary_type);

-- Study sessions (quiz / exam mode)
CREATE TABLE IF NOT EXISTS medgenius_study_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES medgenius_users(user_id) ON DELETE CASCADE,
  document_id TEXT REFERENCES medgenius_documents(id) ON DELETE SET NULL,
  exam_id TEXT,
  mode TEXT NOT NULL
    CHECK (mode IN ('quiz', 'timed', 'subject', 'weak_topic', 'incorrect', 'mixed', 'custom', 'random')),
  title TEXT NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 0,
  answered_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  duration_sec INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  config_json TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON medgenius_study_sessions(user_id, started_at);

-- Individual question attempts within sessions
CREATE TABLE IF NOT EXISTS medgenius_study_attempts (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES medgenius_study_sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES medgenius_questions(id) ON DELETE CASCADE,
  selected_answer INTEGER,
  is_correct INTEGER,
  time_sec INTEGER,
  confidence TEXT CHECK (confidence IN ('low', 'medium', 'high', NULL)),
  flagged INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_attempts_session ON medgenius_study_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_question ON medgenius_study_attempts(question_id);

-- Bookmarks
CREATE TABLE IF NOT EXISTS medgenius_bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES medgenius_users(user_id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES medgenius_questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'bookmark'
    CHECK (label IN ('bookmark', 'favorite', 'review_later', 'important', 'incorrect')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, question_id, label)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON medgenius_bookmarks(user_id, label);

-- Collections / folders
CREATE TABLE IF NOT EXISTS medgenius_collections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES medgenius_users(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  item_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_collections_user ON medgenius_collections(user_id);

CREATE TABLE IF NOT EXISTS medgenius_collection_items (
  collection_id TEXT NOT NULL REFERENCES medgenius_collections(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES medgenius_questions(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (collection_id, question_id)
);

-- AI conversations (tutor + chat)
CREATE TABLE IF NOT EXISTS medgenius_ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES medgenius_users(user_id) ON DELETE CASCADE,
  context_type TEXT NOT NULL
    CHECK (context_type IN ('general', 'document', 'question', 'topic', 'search')),
  context_id TEXT,
  title TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON medgenius_ai_conversations(user_id, updated_at);

CREATE TABLE IF NOT EXISTS medgenius_ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES medgenius_ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  model TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON medgenius_ai_messages(conversation_id, created_at);

-- Spaced repetition schedule
CREATE TABLE IF NOT EXISTS medgenius_spaced_repetition (
  user_id TEXT NOT NULL REFERENCES medgenius_users(user_id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES medgenius_questions(id) ON DELETE CASCADE,
  interval_days REAL NOT NULL DEFAULT 1,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review_at TEXT NOT NULL,
  last_review_at TEXT,
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_srs_due ON medgenius_spaced_repetition(user_id, next_review_at);

-- Daily analytics rollup
CREATE TABLE IF NOT EXISTS medgenius_daily_stats (
  user_id TEXT NOT NULL REFERENCES medgenius_users(user_id) ON DELETE CASCADE,
  stat_date TEXT NOT NULL,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  study_time_sec INTEGER NOT NULL DEFAULT 0,
  flashcards_reviewed INTEGER NOT NULL DEFAULT 0,
  ai_messages INTEGER NOT NULL DEFAULT 0,
  streak_day INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, stat_date)
);

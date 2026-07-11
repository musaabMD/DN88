-- DN88 catalog workflow state (D1)
-- Run: wrangler d1 execute dn88-catalog --file=migrations/d1/001_initial.sql

CREATE TABLE IF NOT EXISTS catalog_sync_runs (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  dl88_commit_sha TEXT,
  parser_version TEXT,
  classification_version TEXT,
  ai_review_version TEXT,
  sanitization_version TEXT,
  discovered_count INTEGER DEFAULT 0,
  invalid_count INTEGER DEFAULT 0,
  scaffold_count INTEGER DEFAULT 0,
  partial_count INTEGER DEFAULT 0,
  complete_count INTEGER DEFAULT 0,
  error_summary TEXT,
  snapshot_key TEXT
);

CREATE TABLE IF NOT EXISTS catalog_snapshots (
  id TEXT PRIMARY KEY,
  commit_sha TEXT NOT NULL,
  activated_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  r2_manifest_key TEXT NOT NULL,
  metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  public_slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  specialty TEXT NOT NULL,
  subspecialty TEXT,
  subject TEXT,
  content_status TEXT NOT NULL CHECK (content_status IN ('scaffold', 'partial', 'complete')),
  ai_review_status TEXT NOT NULL DEFAULT 'not-reviewed'
    CHECK (ai_review_status IN ('not-reviewed', 'reviewing', 'changes-required', 'recommended-for-approval', 'not-for-publication')),
  admin_publication_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (admin_publication_status IN ('pending', 'approved', 'rejected', 'unpublished')),
  source_path TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  dl88_commit_sha TEXT,
  read_minutes INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  has_blocking_errors INTEGER NOT NULL DEFAULT 0,
  r2_article_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  modified_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS article_sections (
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  heading TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (article_id, section_id)
);

CREATE TABLE IF NOT EXISTS validation_issues (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('error', 'warning')),
  message TEXT NOT NULL,
  section_id TEXT,
  source_path TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_reviews (
  article_id TEXT PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  summary TEXT,
  strengths_json TEXT,
  concerns_json TEXT,
  required_changes_json TEXT,
  safety_flags_json TEXT,
  evidence_flags_json TEXT,
  model TEXT,
  review_version TEXT,
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS admin_decisions (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  decided_by TEXT NOT NULL,
  decided_at TEXT NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  article_id TEXT,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'ai', 'admin')),
  actor_id TEXT,
  action TEXT NOT NULL,
  detail_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS catalog_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  sync_state TEXT NOT NULL DEFAULT 'unavailable'
    CHECK (sync_state IN ('fresh', 'stale', 'unavailable', 'unchanged')),
  active_snapshot_id TEXT,
  last_success_at TEXT,
  last_failure_at TEXT,
  last_error TEXT
);

INSERT OR IGNORE INTO catalog_state (id, sync_state) VALUES (1, 'unavailable');

CREATE INDEX IF NOT EXISTS idx_articles_public_slug ON articles(public_slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(content_status, ai_review_status, admin_publication_status);
CREATE INDEX IF NOT EXISTS idx_articles_source_hash ON articles(source_hash);
CREATE INDEX IF NOT EXISTS idx_audit_article ON audit_events(article_id, created_at);

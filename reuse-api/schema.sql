-- リユース掲示板（ゆずります）D1スキーマ
-- status: pending(承認待ち) / approved(公開中) / closed(譲渡済) / rejected(却下)
CREATE TABLE IF NOT EXISTS posts (
  id           TEXT PRIMARY KEY,
  city         TEXT NOT NULL,
  area         TEXT NOT NULL,          -- 自治区名（住所は持たない）
  category     TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  handover     TEXT NOT NULL DEFAULT '',
  image_key    TEXT,
  status       TEXT NOT NULL DEFAULT 'pending',
  owner_hash   TEXT NOT NULL,          -- 投稿者トークンのSHA-256（トークン自体は保存しない）
  ip_hash      TEXT NOT NULL,          -- 連投制限用（IPはソルト付きハッシュのみ）
  report_count INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_city ON posts(city, status, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_ip ON posts(ip_hash, created_at);

-- 受け取り希望ごとの非公開スレッド（投稿者と希望者の2者だけが読める）
CREATE TABLE IF NOT EXISTS threads (
  id             TEXT PRIMARY KEY,
  post_id        TEXT NOT NULL,
  requester_hash TEXT NOT NULL,
  created_at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_threads_post ON threads(post_id);

CREATE TABLE IF NOT EXISTS messages (
  id         TEXT PRIMARY KEY,
  thread_id  TEXT NOT NULL,
  sender     TEXT NOT NULL,             -- owner / requester
  body       TEXT NOT NULL,
  ip_hash    TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_msgs_thread ON messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_msgs_ip ON messages(ip_hash, created_at);

-- 通報（同一人物の連打で非表示にできないよう post×ip で一意）
CREATE TABLE IF NOT EXISTS reports (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL,
  ip_hash    TEXT NOT NULL,
  reason     TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  UNIQUE(post_id, ip_hash)
);

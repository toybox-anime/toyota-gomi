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

-- 効果ダッシュボード用の匿名集計（日×種類×キーの件数だけ。個人・端末は記録しない）
CREATE TABLE IF NOT EXISTS stats (
  day  TEXT NOT NULL,                  -- JST の YYYY-MM-DD
  city TEXT NOT NULL,
  kind TEXT NOT NULL,                  -- open / area / dict_hit / dict_miss / photo / photo_item / ics / tab
  key  TEXT NOT NULL,
  n    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, city, kind, key)
);
-- 集計の水増し対策（IPはソルト付きハッシュ。日ごとの件数だけ）
CREATE TABLE IF NOT EXISTS ev_rate (
  day     TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  n       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, ip_hash)
);

-- ===== 市のデータ（管理画面で編集 → アプリが起動時に読む）=====
CREATE TABLE IF NOT EXISTS cities (
  id         TEXT PRIMARY KEY,           -- toyota / chiryu
  config     TEXT NOT NULL,              -- JSON: 市名・色・URL・収集時刻・粗大ごみ案内
  categories TEXT NOT NULL,              -- JSON: {key:{name,color,icon,names:{ja,en,pt,easy}}}
  version    INTEGER NOT NULL DEFAULT 1, -- 編集のたびに+1（アプリの再読込の目印）
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS districts (
  city       TEXT NOT NULL,
  id         TEXT NOT NULL,
  area       TEXT NOT NULL,
  name       TEXT NOT NULL,
  schedule   TEXT NOT NULL,              -- JSON: {cat:{weekly:[..]}|{monthly:{week|weeks,day}}|{text}}
  verified   INTEGER NOT NULL DEFAULT 1,
  sort       INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (city, id)
);

-- ===== 職員ログイン（パスワードは持たない。ログイン用のカギのハッシュだけ）=====
CREATE TABLE IF NOT EXISTS staff (
  id             TEXT PRIMARY KEY,
  city           TEXT NOT NULL,
  login_id       TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'editor',   -- editor / admin
  key_hash       TEXT,
  invite_hash    TEXT,
  invite_expires INTEGER,
  disabled       INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL,
  last_login     INTEGER
);
CREATE INDEX IF NOT EXISTS idx_staff_invite ON staff(invite_hash);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  staff_id   TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_fail (
  ip_hash    TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_fail ON auth_fail(ip_hash, created_at);
-- 変更履歴（誰が・いつ・何を）
CREATE TABLE IF NOT EXISTS audit (
  id         TEXT PRIMARY KEY,
  city       TEXT NOT NULL,
  staff_id   TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  action     TEXT NOT NULL,
  target     TEXT NOT NULL DEFAULT '',
  detail     TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_city ON audit(city, created_at);

-- ===== 前日通知（Web Push）。持つのは送り先と地区だけ =====
CREATE TABLE IF NOT EXISTS push_subs (
  id         TEXT PRIMARY KEY,           -- 送り先URLのSHA-256
  city       TEXT NOT NULL,
  district   TEXT NOT NULL,
  lang       TEXT NOT NULL,
  endpoint   TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  fail_count INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS push_runs (
  day        TEXT PRIMARY KEY,           -- 通知する収集日（JST）
  cursor     TEXT NOT NULL DEFAULT '',
  done       INTEGER NOT NULL DEFAULT 0,
  sent       INTEGER NOT NULL DEFAULT 0,
  failed     INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

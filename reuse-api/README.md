# ごみアプリ API（Cloudflare Worker）

1つの Worker で次の4つを受け持つ。

| 機能 | ファイル | 中身 |
|---|---|---|
| 市のデータ | `src/city.js` | 市の設定・区分・自治区と収集日。アプリが起動時に読み、職員が管理画面で直す |
| 職員ログイン | `src/auth.js` | パスワードなし。招待URL→ログイン用のカギ→12時間のセッション。権限は編集／管理者 |
| 前日通知 | `src/push.js` | Web Push。20:00〜20:29（JST）に毎分40件ずつ、翌日に収集がある人だけへ |
| ゆずります・利用集計・承認 | `src/index.js` | 以下に記載 |

## 市のデータ（複数の市）

- 市の一覧は `wrangler.toml` の `ALLOWED_CITIES`。データは D1 の `cities` / `districts`
- アプリは `index.html?city=chiryu` で市を切り替える（端末に記憶）。保存済みのデータですぐ表示し、裏で新しい版を確認する（`citydata.js`）
- 収集日の書式：毎週 `{weekly:[2,5]}` ／ 第n曜 `{monthly:{week:2,day:3}}` ／ 月2回 `{monthly:{weeks:[1,3],day:3}}` ／ 日付を決められないとき `{text:"公式の文言"}`
- 初期データ：`node tools/gen-seed.mjs > seed.sql` → `npx wrangler d1 execute gomi-reuse --remote --file=seed.sql`（`INSERT OR IGNORE` なので画面で直した内容は上書きしない）
- 知立市は「ゴミチェッカー」の公式文言から作成。日付を計算できるのは可燃ごみ（毎週）だけで、残りは文言表示・「要確認」。職員が管理画面で直す前提
- 分別ガイド・辞典・写真判定は、今は豊田市の内容だけ。ほかの市では「市の公式ページへ」の案内を出す

## 職員ログイン

1. システム管理者（運営者）が管理画面に `ADMIN_TOKEN` でログイン → 「職員」で登録 → 招待URLができる（72時間・1回限り）
2. 本人が招待URLを開く → ログイン用のカギが1回だけ表示される → ブラウザのパスワード保存に入れる
3. 以後はログインID＋カギでログイン（12時間）。1回線1時間に10回失敗すると止まる
4. カギをなくしたら管理者が「再招待」（古いカギとセッションは即無効）。異動したら「停止」
- 権限：編集＝収集日の編集・ゆずります承認／管理者＝＋市の設定・自治区の削除・職員の管理。自分の市しか触れない
- すべての変更は `audit`（変更履歴）に、誰が・いつ・何を変えたかが残る

## 前日通知（Web Push）

- サーバーは「送り先URLと地区」だけを持ち、通知の中身は送らない（合図だけ）。文はスマホ側の `sw.js` が保存済みの収集日から作る → 暗号化処理が要らず、無料枠の計算時間に収まる
- 鍵の登録：`node tools/setup-push.mjs`（秘密鍵は画面に出さず wrangler に直接渡す）
- 無料枠の外部リクエスト上限（1回50件）に合わせ、1分40件×30分＝1日約1,200人まで。超えるなら Workers 有料プラン（月5ドル）で `BATCH` を上げる
- iPhone は「ホーム画面に追加」したアプリからだけ通知を使える（iOS 16.4 以降）

---

# ゆずります掲示板

粗大ごみになる前の家具・日用品を、**同じ市の住民どうしで無料で譲る**ための掲示板。
ごみ収集日ガイドの「ゆずります」タブから使う。

## 安全ルール（自治体が安心して出せる設計）

| ルール | 実装 |
|---|---|
| 無償譲渡のみ | 本文に金額（例「500円」）があると投稿を拒否。「0円」は可 |
| 禁止品（食品・医薬品・家電4品目・危険物） | 投稿画面で明示 → 職員が承認時に確認 |
| 市職員の承認後に公開 | 投稿は `pending`。管理画面で承認すると `approved` |
| 住所を出さない | 位置は自治区名だけ。住所欄は無い |
| 写真の位置情報（EXIF）を除去 | 端末で縮小・再エンコードしてから送信 |
| 連絡先を公開させない | 電話・メール・URL・LINE ID を含む投稿は拒否。連絡は当事者2人だけが読める非公開メッセージ |
| 放置・荒らし対策 | 公開は承認から14日で自動終了。別々の3人から通報されると自動で非公開に戻り再審査 |
| ボット・連投対策 | Cloudflare Turnstile。IPあたり投稿5件/時・メッセージ30件/時 |
| 個人情報を持たない | アカウント無し。投稿者・希望者の鍵はハッシュのみ保存。IPはソルト付きハッシュのみ |

## 構成

```
住民のスマホ（GitHub Pagesのアプリ）
   │  fetch（CORSは許可オリジンのみ）
   ▼
Cloudflare Worker  src/index.js
   ├─ D1（SQLite）  schema.sql … 投稿・スレッド・メッセージ・通報
   ├─ KV            …… 写真（60日で自動削除。カード登録不要）
   └─ Turnstile     …… ボット判定
市職員 → admin.html「⑤ ゆずります掲示板の承認」→ /api/admin/*（管理トークン）
```

## API

| メソッド | パス | 用途 |
|---|---|---|
| GET | `/api/posts?city=toyota` | 公開中の一覧 |
| POST | `/api/posts` | 投稿（multipart。承認待ちになる）→ `ownerToken` を返す |
| GET | `/api/posts/:id/owner` | 投稿者用（`X-Token`）状態とやりとり |
| POST | `/api/posts/:id/close` | 譲渡済にする（投稿者） |
| POST | `/api/posts/:id/report` | 通報 |
| POST | `/api/posts/:id/threads` | 受け取り希望 → `requesterToken` を返す |
| GET/POST | `/api/threads/:id` `/messages` | 非公開メッセージ（投稿者か希望者の鍵） |
| GET | `/img/:key` | 写真（KV） |
| GET | `/api/city/:id` | 市のデータ（ETag付き） |
| POST | `/api/auth/login` `/logout` `/invite` | 職員ログイン・招待の受け取り |
| GET | `/api/staff/me` | ログイン中の職員 |
| PUT | `/api/staff/city/:id/config` | 市の設定（管理者） |
| POST/PUT/DELETE | `/api/staff/city/:id/districts[/:did]` | 自治区の追加・編集・削除（削除は管理者） |
| GET | `/api/staff/city/:id/audit` | 変更履歴 |
| GET/POST | `/api/staff/users` `/:id/invite\|disable\|enable` | 職員の一覧・登録・再招待・停止（管理者） |
| GET | `/api/push/key` | 通知の公開鍵 |
| POST | `/api/push/subscribe` `/unsubscribe` `/test` | 通知の登録・解除・テスト |
| GET | `/api/admin/posts?status=pending\|reported\|approved` | 管理：一覧（職員は自分の市だけ） |
| POST | `/api/admin/posts/:id/approve\|reject` | 管理：承認・却下（却下で写真も削除） |
| POST | `/api/ev` | 匿名の利用集計（種類とキーだけ。1回線1日500件まで）|
| GET | `/api/admin/stats?city=toyota&days=30` | 管理：効果ダッシュボード（stats.html）用の集計 |

## ローカルで動かす（Cloudflareアカウント不要）

```bash
npm install
npx wrangler d1 execute gomi-reuse --local --file=schema.sql
npx wrangler dev --local --port 8787
```

`.dev.vars`（gitに入れない）に以下を置く。Turnstile は Cloudflare 公式のテスト用キー（常に通過）。

```
ADMIN_TOKEN=dev-admin-token
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
IP_SALT=dev-salt
```

アプリ側は `http://127.0.0.1:8777/index.html?reuseApi=http://127.0.0.1:8787` で開く
（`?reuseApi=` の上書きは localhost のときだけ有効）。

## 本番環境（2026-09 構築済み）

- API: `https://gomi-reuse-api.reuse-api.workers.dev`
- D1: `gomi-reuse`（APAC）／ KV: `IMAGES`（写真。R2はカード登録が要るため不採用）
- Turnstile: ウィジェット `gomi-reuse`（ホスト名 `toybox-anime.github.io`）

### 作り直す・別の市に立てるとき

1. Cloudflareアカウント作成（本人）→ `npx wrangler login`（ブラウザで許可）
2. `npx wrangler d1 create gomi-reuse` → `database_id` を `wrangler.toml` に
3. `npx wrangler d1 execute gomi-reuse --remote --file=schema.sql`
4. `npx wrangler kv namespace create IMAGES` → `id` を `wrangler.toml` に
5. `npx wrangler deploy`
6. 秘密の登録は本人のPCで次を実行（Turnstile作成と秘密3つの自動生成・登録を行い、秘密は画面に出さない。管理トークンは「ドキュメント\gomi-admin-token.txt」に保存）
   ```
   powershell -ExecutionPolicy Bypass -File setup-secrets.ps1
   ```
7. 表示された SITEKEY と API のURLをアプリの `config.js`（`reuseApi` / `turnstileSiteKey`）に設定して push

## 費用の目安

Workers・D1・KV・Turnstile はいずれも無料枠がある（Workers 1日10万リクエスト、D1 5GB、KV 1GB・書き込み1日1,000件 など。**最新の条件は Cloudflare の料金ページで確認**）。
1市の掲示板規模なら無料枠に収まる見込み。

## 次の段階（未実装）

- 分別ガイド・辞典を市のデータに移す（今は豊田市の内容だけ同梱）
- Cloudflare Access での二重の保護（Zero Trust の設定が要る。今は職員ごとのカギ）
- 事業者の余剰品（フードロス）枠：食品衛生の責任分界を決めてから
- 写真判定の Claude Vision 化を同じ Worker に相乗り

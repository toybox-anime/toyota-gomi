# ゆずります掲示板 API（Cloudflare Worker）

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
   ├─ R2            …… 写真
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
| GET | `/img/:key` | 写真 |
| GET | `/api/admin/posts?status=pending\|reported\|approved` | 管理：一覧 |
| POST | `/api/admin/posts/:id/approve\|reject` | 管理：承認・却下（却下で写真も削除） |

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

## 本番デプロイ（アカウント作成・ログインは本人が行う）

1. Cloudflare のアカウントを作成（無料）
2. `npx wrangler login`
3. `npx wrangler d1 create gomi-reuse` → 出力の `database_id` を `wrangler.toml` に貼る
4. `npx wrangler d1 execute gomi-reuse --remote --file=schema.sql`
5. `npx wrangler r2 bucket create gomi-reuse-images`
6. Cloudflare ダッシュボード → Turnstile → ウィジェット追加（ホスト名 `toybox-anime.github.io`）→ サイトキーとシークレットを控える
7. 秘密値を登録（値は各自で決める。管理トークンは長いランダム文字列に）
   ```bash
   npx wrangler secret put TURNSTILE_SECRET
   npx wrangler secret put ADMIN_TOKEN
   npx wrangler secret put IP_SALT
   ```
8. `npx wrangler deploy` → `https://gomi-reuse-api.<アカウント>.workers.dev` が出る
9. アプリの `config.js` に設定して push
   ```js
   reuseApi: "https://gomi-reuse-api.<アカウント>.workers.dev",
   turnstileSiteKey: "<手順6のサイトキー>",
   ```

## 費用の目安

Workers・D1・R2・Turnstile はいずれも無料枠がある（Workers 1日10万リクエスト、D1 5GB、R2 10GB など。**最新の条件は Cloudflare の料金ページで確認**）。
1市の掲示板規模なら無料枠に収まる見込み。

## 次の段階（未実装）

- 管理画面を Cloudflare Access（メールのワンタイムコード）で保護（今は管理トークンのみ）
- 期限切れ・譲渡済の写真を定期削除（Cron Trigger）
- 事業者の余剰品（フードロス）枠：食品衛生の責任分界を決めてから
- 写真判定の Claude Vision 化を同じ Worker に相乗り

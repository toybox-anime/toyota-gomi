// 前日リマインド通知スクリプト（GitHub Actionsから毎晩実行）
// 翌日(JST)のごみを計算し、対象があればntfyへpush通知する。
// 環境変数: DISTRICT(自治区名, カンマ区切り可) / NTFY_TOPIC / NTFY_SERVER(既定 https://ntfy.sh)

const vm = require("vm");
const fs = require("fs");
const https = require("https");
const { URL } = require("url");

// data.js を読み込む（constはvmのグローバルに乗らないので明示的にexport）
const sandbox = {};
vm.createContext(sandbox);
const code = fs.readFileSync(__dirname + "/data.js", "utf8") +
  "\n;globalThis.DISTRICTS=DISTRICTS;globalThis.CATEGORIES=CATEGORIES;";
vm.runInContext(code, sandbox);
const { DISTRICTS, CATEGORIES } = sandbox;

const WD = ["日", "月", "火", "水", "木", "金", "土"];
const nthWeek = d => Math.floor((d.getDate() - 1) / 7) + 1;
function collectsOn(s, d) {
  if (!s) return false;
  const w = d.getDay();
  if (s.weekly) return s.weekly.includes(w);
  if (s.monthly) return s.monthly.day === w && s.monthly.week === nthWeek(d);
  return false;
}

// 対象日（既定=JSTの翌日）。TEST_DATE=YYYY-MM-DD でその日を対象にできる（テスト用）
let t;
if (process.env.TEST_DATE) {
  const [y, m, d] = process.env.TEST_DATE.split("-").map(Number);
  t = new Date(y, m - 1, d);
} else {
  const nowJst = new Date(Date.now() + 9 * 3600 * 1000);
  const tomo = new Date(Date.UTC(nowJst.getUTCFullYear(), nowJst.getUTCMonth(), nowJst.getUTCDate() + 1));
  t = new Date(tomo.getUTCFullYear(), tomo.getUTCMonth(), tomo.getUTCDate());
}

// 補助機能（任意）: DISTRICT/NTFY_TOPIC 未設定なら何もせず正常終了（製品の主通知はカレンダー購読）
const names = (process.env.DISTRICT || "").split(",").map(s => s.trim()).filter(Boolean);
const topic = process.env.NTFY_TOPIC;
const server = process.env.NTFY_SERVER || "https://ntfy.sh";
if (!names.length || !topic) { console.log("ntfy通知は未設定のためスキップ（任意機能）"); process.exit(0); }

const lines = [];
for (const nm of names) {
  const d = DISTRICTS.find(x => x.name === nm);
  if (!d) { console.error("自治区が見つからない:", nm); continue; }
  const hit = Object.keys(CATEGORIES).filter(k => collectsOn(d.schedule[k], t));
  if (hit.length) {
    const cats = hit.map(k => CATEGORIES[k].icon + CATEGORIES[k].name).join("、");
    lines.push(`${d.name}：${cats}`);
  }
}

if (!lines.length) {
  console.log("翌日の収集なし。通知スキップ。");
  process.exit(0);
}

const title = `明日(${t.getMonth() + 1}/${t.getDate()} ${WD[t.getDay()]})のごみ`;
// Titleヘッダは日本語不可のため本文の1行目にタイトルを入れる
const body = `【${title}】\n` + lines.join("\n") + "\n\n朝8:30までに出してね";

// ntfyへPOST
const u = new URL(`${server.replace(/\/$/, "")}/${topic}`);
const data = Buffer.from(body, "utf8");
const req = https.request(u, {
  method: "POST",
  headers: {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": data.length,
    "Tags": "wastebasket",
    "Priority": "default",
  },
}, res => {
  console.log("ntfy status:", res.statusCode, "| 送信:", title, "|", lines.join(" / "));
  res.resume();
});
req.on("error", e => { console.error("送信エラー:", e.message); process.exit(1); });
req.write(data);
req.end();

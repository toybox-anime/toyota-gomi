// 前日通知（Web Push）の送信元の鍵を作って、Cloudflareの秘密として登録する。
//   node tools/setup-push.mjs
// 秘密鍵は画面にもファイルにも出さず、wrangler に直接渡す。
// 作り直すと、今までの通知登録は全員やり直しになる（アプリで「通知を受け取る」を押し直す）。
import { webcrypto } from "node:crypto";
import { spawn } from "node:child_process";

const key = await webcrypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
const j = await webcrypto.subtle.exportKey("jwk", key.privateKey);
const secret = JSON.stringify({ kty: j.kty, crv: j.crv, x: j.x, y: j.y, d: j.d });

const p = spawn("npx", ["wrangler", "secret", "put", "VAPID_PRIVATE_JWK"], { shell: true, stdio: ["pipe", "ignore", "pipe"] });
let err = "";
p.stderr.on("data", d => { err += d; });
p.stdin.end(secret);
p.on("close", code => {
  if (code === 0) console.log("通知の鍵を登録しました（VAPID_PRIVATE_JWK）");
  else { console.error("登録に失敗しました", code, err.replace(/"d":"[^"]+"/g, '"d":"***"').slice(-800)); process.exit(1); }
});

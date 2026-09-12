# ゆずります掲示板：秘密の値をこのPCの中だけで作って Cloudflare に登録するスクリプト
# ・Turnstile（ボット判定）のウィジェットを作成
# ・TURNSTILE_SECRET / ADMIN_TOKEN / IP_SALT を自動生成して Worker に登録
# 秘密は画面に出さない。管理トークンだけ「ドキュメント」フォルダのファイルに保存してメモ帳で開く。
$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Set-Location $PSScriptRoot
$Account = "0dedd2b90bd1d773d470ec0dc0884c1e"

function New-Rand {
  $b = New-Object byte[] 24
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
  ($b | ForEach-Object { $_.ToString("x2") }) -join ""
}

Write-Host "[1/4] Cloudflareのログインを確認しています..."
npx wrangler whoami
if ($LASTEXITCODE -ne 0) { throw "ログインを確認できません。npx wrangler login をもう一度実行してください。" }
$cfg = Join-Path $env:APPDATA "xdg.config\.wrangler\config\default.toml"
$m = Select-String -Path $cfg -Pattern '^oauth_token\s*=\s*"([^"]+)"'
if (-not $m) { throw "ログイン情報が見つかりません。npx wrangler login をもう一度実行してください。" }
$tok = $m.Matches[0].Groups[1].Value

Write-Host "[2/4] ボット判定（Turnstile）のウィジェットを作成しています..."
$body = @{ name = "gomi-reuse"; domains = @("toybox-anime.github.io"); mode = "managed" } | ConvertTo-Json
try {
  $res = Invoke-RestMethod -Method Post -Uri "https://api.cloudflare.com/client/v4/accounts/$Account/challenges/widgets" `
    -Headers @{ Authorization = "Bearer $tok" } -ContentType "application/json" -Body $body
} catch {
  $detail = ""
  if ($_.Exception.Response) { $detail = (New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() }
  throw "Turnstileの作成に失敗しました: $detail"
}
$sitekey = $res.result.sitekey
$tsSecret = $res.result.secret
if (-not $sitekey -or -not $tsSecret) { throw "Turnstileの応答が想定と違います。" }

Write-Host "[3/4] 秘密の値をWorkerに登録しています..."
$admin = New-Rand
$tmp = Join-Path $env:TEMP ("gomi-" + [guid]::NewGuid().ToString("N") + ".json")
try {
  @{ TURNSTILE_SECRET = $tsSecret; ADMIN_TOKEN = $admin; IP_SALT = (New-Rand) } | ConvertTo-Json | Set-Content -Path $tmp -Encoding ascii
  npx wrangler secret bulk $tmp
  if ($LASTEXITCODE -ne 0) { throw "秘密の登録に失敗しました（wrangler secret bulk）。" }
} finally {
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
}

Write-Host "[4/4] 管理トークンを保存しています..."
$out = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "gomi-admin-token.txt"
@("ゆずります掲示板 管理トークン（承認画面 admin.html の「管理トークン」欄に貼る）",
  "パスワード管理アプリなどに移したら、このファイルは削除してOK。チャットには貼らないでください。",
  "",
  $admin) | Set-Content -Path $out -Encoding UTF8
Start-Process notepad.exe $out

Write-Host ""
Write-Host "完了しました。"
Write-Host "SITEKEY(公開用): $sitekey"
Write-Host "管理トークンは メモ帳で開いたファイル（ドキュメント\gomi-admin-token.txt）に保存しました。"

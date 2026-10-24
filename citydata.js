// ===== 市のデータを読む（管理画面で直した収集日が、アプリにすぐ届く）=====
// 1) この端末に保存済みのデータがあれば、それですぐ表示（通信なし・オフラインでも動く）
// 2) 裏でサーバーに新しい版があるか確認し、あれば保存して画面を描き直す
// 3) 同梱の config.js / data.js は、初回や通信できないときの予備
// 市は ?city=chiryu で切り替え（端末に記憶）。同梱していない市は初回だけ読み込みを待つ。
(function () {
  const qs = new URLSearchParams(location.search);
  const LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
  // ローカル検証では ?reuseApi= を付けたときだけAPIを使う（本番のデータを汚さない）
  window.GOMI_API = ((LOCAL ? qs.get("reuseApi") : CONFIG.reuseApi) || "").replace(/\/$/, "");
  const BUNDLED = CONFIG.cityId;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };

  let city = (qs.get("city") || "").toLowerCase();
  if (!/^[a-z0-9-]{2,20}$/.test(city)) city = (!window.CITY_NO_STORE && store.get("city")) || BUNDLED;
  // 埋め込みウィジェット（市のサイトの中）では、アプリ側の記憶を書き換えない
  if (!window.CITY_NO_STORE) {
    if (city !== (store.get("city") || BUNDLED)) store.del("district");   // 別の市の地区は使えない
    store.set("city", city);
  }
  window.CITY_ID = city;
  // 分別ガイド・辞典・写真判定は、今は同梱の市（豊田市）の内容だけ
  window.CITY_HAS_GUIDE = city === BUNDLED;

  const KEY = "pack:" + city;
  function apply(p) {
    Object.assign(CONFIG, p.config, { cityId: p.id });
    for (const k of Object.keys(CATEGORIES)) delete CATEGORIES[k];
    Object.assign(CATEGORIES, p.categories);
    DISTRICTS.length = 0;
    DISTRICTS.push(...p.districts);
    window.CITY_VERSION = p.version;
  }

  let pack = null;
  try { pack = JSON.parse(store.get(KEY) || "null"); } catch (e) {}
  if (pack && pack.id === city && pack.districts && pack.districts.length) apply(pack);
  else { pack = null; if (city !== BUNDLED) window.CITY_PENDING = true; }

  // 同梱していない市の初回：読み込みが終わるまで画面を隠す
  if (window.CITY_PENDING) {
    document.documentElement.classList.add("city-loading");
    const box = document.createElement("div");
    box.id = "cityLoading";
    box.setAttribute("role", "status");
    box.textContent = "読み込み中… / Loading…";
    document.body.appendChild(box);
  }

  window.refreshCity = async function () {
    if (!window.GOMI_API) return failPending();
    try {
      const r = await fetch(`${window.GOMI_API}/api/city/${encodeURIComponent(city)}`, { cache: "no-cache" });
      if (!r.ok) throw new Error(String(r.status));
      const p = await r.json();
      if (!p || p.id !== city || !Array.isArray(p.districts) || !p.districts.length) throw new Error("empty");
      if (pack && p.version === pack.version) return;
      store.set(KEY, JSON.stringify(p));
      pack = p;
      if (window.CITY_PENDING) { location.reload(); return; }
      apply(p);
      if (typeof window.onCityUpdate === "function") window.onCityUpdate();
    } catch (e) { failPending(); }
  };

  function failPending() {
    if (!window.CITY_PENDING) return;
    const box = document.getElementById("cityLoading");
    if (!box) return;
    box.innerHTML = "";
    const p = document.createElement("p");
    p.textContent = "データを読み込めませんでした。通信を確認して、もう一度開いてください。 / Could not load data.";
    const a = document.createElement("a");
    a.href = location.pathname + "?city=" + encodeURIComponent(BUNDLED);
    a.textContent = CONFIG.cityShort + " に戻る";
    box.append(p, a);
  }
})();

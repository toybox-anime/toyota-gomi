// ===== リユース掲示板「ゆずります」（粗大ごみにする前に市内で譲る）=====
// API: Cloudflare Worker（reuse-api/）。CONFIG.reuseApi 未設定なら「準備中」表示。
// 投稿者/希望者の鍵（トークン）はこの端末の localStorage にだけ保存。
(function () {
  const R = {
    ja: { title:"粗大ごみにする前に、市内でゆずりましょう", lead:"まだ使える物を、無料で近所の人へ。ごみも処理費も減らせます。",
      rules:["無償（0円）の譲渡のみ","食品・医薬品・家電4品目（テレビ・エアコン・冷蔵庫・洗濯機）・危険物は出せません","市の確認後に公開されます","住所・電話・メールは書かないでください（やりとりは非公開メッセージで）","受け渡しは人目のある場所で"],
      rulesH:"ルール", post:"＋ ゆずる", my:"やりとり", back:"← 一覧へ", allArea:"すべての地区", allCat:"すべての種類",
      empty:"今はゆずりたい物がありません。最初の1件を出してみませんか？", notReady:"準備中：自治体との契約後に始まる機能です（デモでは表示のみ）",
      want:"受け取りたい", report:"通報", reportQ:"この投稿を不適切として通報しますか？", reported:"通報しました", left:"あと{n}日",
      fCat:"種類", fTitle:"品名（40字まで）", fBody:"説明（状態・サイズなど）", fHand:"受け渡しの目安（場所・時間帯）", fArea:"地区",
      fPhoto:"写真（任意・位置情報は自動で削除）", fAgree:"上のルールに同意します", fSend:"確認に送る",
      sent:"送信しました。市の確認後に公開されます。進み具合は「やりとり」で見られます。",
      wantPh:"受け取り希望のメッセージ（都合のよい日時など）", wantSend:"送る", wantSent:"送信しました。返事は「やりとり」に届きます。",
      myPosts:"ゆずる物", myReqs:"受け取り希望", myEmpty:"この端末でのやりとりはまだありません", device:"やりとりの鍵はこの端末にだけ保存されます（別の端末からは見られません）",
      st:{pending:"確認中",approved:"公開中",closed:"譲渡済",rejected:"見送り",expired:"期限切れ"},
      reply:"返信", replyPh:"メッセージ", close:"譲渡済にする", closeQ:"譲渡済にしますか？一覧から消えます。", noMsg:"まだメッセージはありません", me:"あなた", them:"相手",
      err:{pii:"電話番号・メール・URLは書けません。やりとりは非公開メッセージで。",price:"無料の譲渡のみです（金額は書けません）",rate:"送信が多すぎます。しばらく待ってください。",
        turnstile:"ロボットでないことの確認を完了してください",length:"文字数を確認してください",agree:"ルールへの同意が必要です",gen:"送信できませんでした。通信を確認してください。"},
      cats:{furniture:"家具",appliance:"小型家電",kids:"子ども用品",clothes:"衣類",daily:"日用品",hobby:"本・趣味",other:"その他"} },
    en: { title:"Give it away before it becomes oversized waste", lead:"Pass on usable items to neighbors for free — less waste, lower disposal costs.",
      rules:["Free giveaways only","No food, medicine, the 4 recycling-law appliances (TV, AC, fridge, washer) or hazardous items","Posts go live after city review","Don't write your address, phone or email (use private messages)","Hand over in a public place"],
      rulesH:"Rules", post:"+ Give away", my:"Messages", back:"← Back", allArea:"All districts", allCat:"All types",
      empty:"No items right now. Be the first to post!", notReady:"Coming soon: available after the city signs up (display only in this demo)",
      want:"I want this", report:"Report", reportQ:"Report this post as inappropriate?", reported:"Reported", left:"{n} days left",
      fCat:"Type", fTitle:"Item (max 40 chars)", fBody:"Description (condition, size)", fHand:"Handover (place / time)", fArea:"District",
      fPhoto:"Photo (optional, location data removed)", fAgree:"I agree to the rules", fSend:"Submit for review",
      sent:"Sent. It will appear after city review. Check progress in Messages.",
      wantPh:"Message (e.g., when you can pick up)", wantSend:"Send", wantSent:"Sent. Replies will arrive in Messages.",
      myPosts:"My items", myReqs:"My requests", myEmpty:"No conversations on this device yet", device:"Your access keys are stored only on this device.",
      st:{pending:"In review",approved:"Live",closed:"Given",rejected:"Declined",expired:"Expired"},
      reply:"Reply", replyPh:"Message", close:"Mark as given", closeQ:"Mark as given? It will be removed from the list.", noMsg:"No messages yet", me:"You", them:"Other",
      err:{pii:"Phone, email and URLs are not allowed. Use private messages.",price:"Free items only (no prices).",rate:"Too many submissions. Please wait.",
        turnstile:"Please complete the bot check.",length:"Please check the text length.",agree:"Please agree to the rules.",gen:"Could not send. Check your connection."},
      cats:{furniture:"Furniture",appliance:"Small appliance",kids:"Kids",clothes:"Clothes",daily:"Daily goods",hobby:"Books & hobby",other:"Other"} },
    pt: { title:"Doe antes de virar lixo volumoso", lead:"Doe itens usáveis aos vizinhos, de graça — menos lixo e menos custo.",
      rules:["Somente doações (grátis)","Proibido: alimentos, remédios, os 4 eletrodomésticos (TV, ar, geladeira, lavadora) e itens perigosos","Publicado após revisão da prefeitura","Não escreva endereço, telefone ou e-mail (use mensagens privadas)","Entregue em local público"],
      rulesH:"Regras", post:"+ Doar", my:"Mensagens", back:"← Voltar", allArea:"Todos os bairros", allCat:"Todos os tipos",
      empty:"Nenhum item agora. Seja o primeiro!", notReady:"Em breve: após contrato com a prefeitura (só exibição nesta demo)",
      want:"Quero", report:"Denunciar", reportQ:"Denunciar esta publicação?", reported:"Denunciado", left:"faltam {n} dias",
      fCat:"Tipo", fTitle:"Item (até 40)", fBody:"Descrição (estado, tamanho)", fHand:"Entrega (local / horário)", fArea:"Bairro",
      fPhoto:"Foto (opcional, localização removida)", fAgree:"Concordo com as regras", fSend:"Enviar para revisão",
      sent:"Enviado. Aparecerá após a revisão. Veja em Mensagens.",
      wantPh:"Mensagem (ex.: quando pode buscar)", wantSend:"Enviar", wantSent:"Enviado. Respostas chegam em Mensagens.",
      myPosts:"Minhas doações", myReqs:"Meus pedidos", myEmpty:"Nenhuma conversa neste aparelho", device:"Suas chaves ficam só neste aparelho.",
      st:{pending:"Em revisão",approved:"Publicado",closed:"Doado",rejected:"Recusado",expired:"Expirado"},
      reply:"Responder", replyPh:"Mensagem", close:"Marcar como doado", closeQ:"Marcar como doado?", noMsg:"Sem mensagens", me:"Você", them:"Outro",
      err:{pii:"Telefone, e-mail e URL não são permitidos.",price:"Somente doações (sem preço).",rate:"Muitos envios. Aguarde.",
        turnstile:"Conclua a verificação.",length:"Verifique o tamanho do texto.",agree:"Aceite as regras.",gen:"Falha no envio."},
      cats:{furniture:"Móveis",appliance:"Eletrônico pequeno",kids:"Infantil",clothes:"Roupas",daily:"Utilidades",hobby:"Livros e lazer",other:"Outros"} },
    easy: { title:"すてる まえに、ゆずりましょう", lead:"つかえる ものを、ただで ちかくの ひとへ。ごみが へります。",
      rules:["おかねは もらいません（0えん）","たべもの・くすり・テレビ・エアコン・れいぞうこ・せんたくき・あぶない ものは だめ","しやくしょが みてから のります","じゅうしょ・でんわ・メールは かかない","ひとが いる ばしょで わたす"],
      rulesH:"ルール", post:"＋ ゆずる", my:"やりとり", back:"← もどる", allArea:"ぜんぶの ちく", allCat:"ぜんぶの しゅるい",
      empty:"いまは ありません", notReady:"じゅんびちゅう です",
      want:"ほしい", report:"つうほう", reportQ:"つうほう しますか？", reported:"つうほう しました", left:"あと {n}にち",
      fCat:"しゅるい", fTitle:"なまえ", fBody:"せつめい", fHand:"わたす ばしょ・じかん", fArea:"ちく",
      fPhoto:"しゃしん（なくても いい）", fAgree:"ルールを まもります", fSend:"おくる",
      sent:"おくりました。しやくしょが みてから のります。", wantPh:"メッセージ", wantSend:"おくる", wantSent:"おくりました。へんじは「やりとり」に きます。",
      myPosts:"ゆずる もの", myReqs:"ほしい もの", myEmpty:"まだ ありません", device:"この スマホに だけ ほぞん されます",
      st:{pending:"かくにんちゅう",approved:"のっています",closed:"わたしました",rejected:"のせません",expired:"おわり"},
      reply:"へんじ", replyPh:"メッセージ", close:"わたしました", closeQ:"わたしましたか？", noMsg:"まだ ありません", me:"あなた", them:"あいて",
      err:{pii:"でんわ・メールは かけません",price:"おかねは かけません",rate:"すこし まってください",turnstile:"かくにんを してください",length:"もじの かずを みてください",agree:"ルールに チェック してください",gen:"おくれませんでした"},
      cats:{furniture:"かぐ",appliance:"ちいさい でんき",kids:"こどもの もの",clothes:"ふく",daily:"せいかつの もの",hobby:"ほん・しゅみ",other:"そのほか"} },
  };
  const CATS = ["furniture","appliance","kids","clothes","daily","hobby","other"];
  const IS_LOCAL = ["localhost","127.0.0.1"].includes(location.hostname);
  const qs = new URLSearchParams(location.search);
  // ローカル検証時のみ ?reuseApi= で上書き可（公開サイトでは外部APIへの差し替えを許さない）
  const API = ((IS_LOCAL && qs.get("reuseApi")) || CONFIG.reuseApi || "").replace(/\/$/, "");
  const SITEKEY = CONFIG.turnstileSiteKey || (IS_LOCAL ? "1x00000000000000000000AA" : "");
  const CITY = CONFIG.cityId || "toyota";
  const READY = !!(API && SITEKEY);

  const L = () => R[LANG] || R.ja;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const root = () => document.getElementById("reuseRoot");
  let mode = "list", posts = [], fArea = "", fCat = "", target = null, tsToken = "", tsWidget = null;

  const store = {
    get() { try { return JSON.parse(localStorage.getItem("reuse_my") || '{"posts":[],"threads":[]}'); } catch (e) { return { posts: [], threads: [] }; } },
    set(v) { try { localStorage.setItem("reuse_my", JSON.stringify(v)); } catch (e) {} },
  };
  const groupOf = name => { const d = DISTRICTS.find(x => x.name === name); return d ? d.area : ""; };

  async function api(path, opt) {
    const r = await fetch(API + path, opt);
    let body = null; try { body = await r.json(); } catch (e) {}
    if (!r.ok) { const e = new Error((body && body.error) || "gen"); e.code = (body && body.error) || "gen"; throw e; }
    return body;
  }
  const errMsg = e => L().err[e.code] || L().err.gen;

  // ---- Turnstile（Cloudflareのボット判定）----
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }
  async function mountTurnstile(el) {
    tsToken = "";
    try {
      await loadTurnstile();
      tsWidget = window.turnstile.render(el, { sitekey: SITEKEY, callback: t => { tsToken = t; }, "expired-callback": () => { tsToken = ""; } });
    } catch (e) { el.textContent = L().err.gen; }
  }

  // ---- 画像：縮小して再エンコード（EXIF=位置情報を落とす）----
  async function shrink(file) {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const s = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise(r => c.toBlob(r, "image/jpeg", 0.82));
  }

  // ---- 画面 ----
  function intro(showButtons) {
    const t = L();
    return `<div class="card rintro">
      <div class="rh">${esc(t.title)}</div>
      <div class="rlead">${esc(t.lead)}</div>
      <details class="rrules"><summary>${esc(t.rulesH)}</summary><ul>${t.rules.map(x => `<li>${esc(x)}</li>`).join("")}</ul></details>
      ${!READY ? `<div class="rnote">${esc(t.notReady)}</div>` : showButtons ? `<div class="rbtns">
        <button class="calbtn" data-act="post">${esc(t.post)}</button>
        <button class="rghost" data-act="my">${esc(t.my)}</button></div>` : ""}
    </div>`;
  }

  async function renderList() {
    const t = L();
    const areas = [...new Set(DISTRICTS.map(d => d.area))];
    let html = intro(true);
    if (READY) {
      html += `<div class="rfilters">
        <select id="rArea"><option value="">${esc(t.allArea)}</option>${areas.map(a => `<option ${a === fArea ? "selected" : ""}>${esc(a)}</option>`).join("")}</select>
        <select id="rCat"><option value="">${esc(t.allCat)}</option>${CATS.map(c => `<option value="${c}" ${c === fCat ? "selected" : ""}>${esc(t.cats[c])}</option>`).join("")}</select>
      </div><div id="rList" class="rlist"><div class="placenote">…</div></div>`;
    }
    root().innerHTML = html;
    if (!READY) return;
    document.getElementById("rArea").onchange = e => { fArea = e.target.value; drawPosts(); };
    document.getElementById("rCat").onchange = e => { fCat = e.target.value; drawPosts(); };
    try { posts = (await api(`/api/posts?city=${encodeURIComponent(CITY)}`)).posts; }
    catch (e) { document.getElementById("rList").innerHTML = `<div class="dnote">${esc(errMsg(e))}</div>`; return; }
    drawPosts();
  }

  function drawPosts() {
    const t = L(), box = document.getElementById("rList"); if (!box) return;
    const list = posts.filter(p => (!fArea || groupOf(p.area) === fArea) && (!fCat || p.category === fCat));
    if (!list.length) { box.innerHTML = `<div class="card dnote">${esc(t.empty)}</div>`; return; }
    box.innerHTML = list.map(p => {
      const days = Math.max(0, Math.ceil((p.expires_at - Date.now()) / 86400000));
      return `<div class="card rcard">
        ${p.image ? `<img class="rimg" src="${esc(p.image)}" alt="" loading="lazy">` : ""}
        <div class="rtop"><span class="chip">${esc(t.cats[p.category] || p.category)}</span>
          <span class="rleft">${esc(t.left.replace("{n}", days))}</span></div>
        <div class="rtitle">${esc(p.title)}</div>
        <div class="rtext">${esc(p.body)}</div>
        <div class="rmeta">📍 ${esc(p.area)}${groupOf(p.area) ? `（${esc(groupOf(p.area))}）` : ""}${p.handover ? `<br>🤝 ${esc(p.handover)}` : ""}</div>
        <div class="rbtns"><button class="calbtn" data-act="want" data-id="${esc(p.id)}">${esc(t.want)}</button>
          <button class="rghost" data-act="report" data-id="${esc(p.id)}">⚑ ${esc(t.report)}</button></div>
      </div>`;
    }).join("");
  }

  function renderPost() {
    const t = L();
    const saved = localStorage.getItem("district");
    const cur = (DISTRICTS.find(d => d.id === saved) || DISTRICTS[0]).name;
    const areas = [...new Set(DISTRICTS.map(d => d.area))];
    root().innerHTML = `<button class="rghost rback" data-act="list">${esc(t.back)}</button>` + intro(false) + `
      <form class="card rform" id="rForm">
        <label>${esc(t.fCat)}<select name="category">${CATS.map(c => `<option value="${c}">${esc(t.cats[c])}</option>`).join("")}</select></label>
        <label>${esc(t.fTitle)}<input name="title" maxlength="40" required></label>
        <label>${esc(t.fBody)}<textarea name="body" maxlength="500" rows="4" required></textarea></label>
        <label>${esc(t.fHand)}<input name="handover" maxlength="100"></label>
        <label>${esc(t.fArea)}<select name="area">${areas.map(a => `<optgroup label="${esc(a)}">${DISTRICTS.filter(d => d.area === a).map(d => `<option ${d.name === cur ? "selected" : ""}>${esc(d.name)}</option>`).join("")}</optgroup>`).join("")}</select></label>
        <label>${esc(t.fPhoto)}<input name="photo" type="file" accept="image/*"></label>
        <img id="rPrev" class="rimg" hidden alt="">
        <label class="rcheck"><input type="checkbox" name="agree"> ${esc(t.fAgree)}</label>
        <div id="rTs" class="rts"></div>
        <div id="rMsg" class="dnote"></div>
        <button class="calbtn" type="submit">${esc(t.fSend)}</button>
      </form>`;
    const form = document.getElementById("rForm");
    let photoBlob = null;
    form.photo.onchange = async () => {
      const f = form.photo.files[0]; photoBlob = null;
      const pv = document.getElementById("rPrev");
      if (!f) { pv.hidden = true; return; }
      photoBlob = await shrink(f);
      pv.src = URL.createObjectURL(photoBlob); pv.hidden = false;
    };
    mountTurnstile(document.getElementById("rTs"));
    form.onsubmit = async e => {
      e.preventDefault();
      const msg = document.getElementById("rMsg");
      if (!form.agree.checked) { msg.textContent = t.err.agree; return; }
      if (!tsToken) { msg.textContent = t.err.turnstile; return; }
      const fd = new FormData();
      fd.append("city", CITY);
      for (const k of ["category","title","body","handover","area"]) fd.append(k, form[k].value);
      fd.append("turnstile", tsToken);
      if (photoBlob) fd.append("image", photoBlob, "photo.jpg");
      form.querySelector("button[type=submit]").disabled = true;
      try {
        const r = await api("/api/posts", { method: "POST", body: fd });
        const s = store.get(); s.posts.unshift({ id: r.id, token: r.ownerToken, title: form.title.value, at: Date.now() }); store.set(s);
        root().innerHTML = `<div class="card"><div class="rh">✅</div><div class="rlead">${esc(t.sent)}</div>
          <div class="rbtns"><button class="calbtn" data-act="my">${esc(t.my)}</button><button class="rghost" data-act="list">${esc(t.back)}</button></div></div>`;
      } catch (err) {
        msg.textContent = errMsg(err);
        form.querySelector("button[type=submit]").disabled = false;
        if (window.turnstile && tsWidget !== null) { window.turnstile.reset(tsWidget); tsToken = ""; }
      }
    };
  }

  function renderWant() {
    const t = L(), p = target;
    root().innerHTML = `<button class="rghost rback" data-act="list">${esc(t.back)}</button>
      <div class="card"><div class="rtitle">${esc(p.title)}</div><div class="rmeta">📍 ${esc(p.area)}</div></div>
      <form class="card rform" id="rWant">
        <textarea name="message" maxlength="500" rows="4" placeholder="${esc(t.wantPh)}" required></textarea>
        <div id="rTs" class="rts"></div><div id="rMsg" class="dnote"></div>
        <button class="calbtn" type="submit">${esc(t.wantSend)}</button>
      </form>`;
    mountTurnstile(document.getElementById("rTs"));
    const form = document.getElementById("rWant");
    form.onsubmit = async e => {
      e.preventDefault();
      const msg = document.getElementById("rMsg");
      if (!tsToken) { msg.textContent = t.err.turnstile; return; }
      try {
        const r = await api(`/api/posts/${encodeURIComponent(p.id)}/threads`, { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: form.message.value, turnstile: tsToken }) });
        const s = store.get(); s.threads.unshift({ id: r.threadId, token: r.requesterToken, postId: p.id, title: p.title, at: Date.now() }); store.set(s);
        root().innerHTML = `<div class="card"><div class="rh">✅</div><div class="rlead">${esc(t.wantSent)}</div>
          <div class="rbtns"><button class="calbtn" data-act="my">${esc(t.my)}</button><button class="rghost" data-act="list">${esc(t.back)}</button></div></div>`;
      } catch (err) {
        msg.textContent = errMsg(err);
        if (window.turnstile && tsWidget !== null) { window.turnstile.reset(tsWidget); tsToken = ""; }
      }
    };
  }

  function msgsHtml(list, myRole) {
    const t = L();
    if (!list.length) return `<div class="dnote">${esc(t.noMsg)}</div>`;
    return list.map(m => `<div class="rmsg ${m.sender === myRole ? "mine" : ""}"><b>${esc(m.sender === myRole ? t.me : t.them)}</b> ${esc(m.body)}</div>`).join("");
  }
  const replyForm = (kind, threadId, postId = "") => `<form class="rreply" data-kind="${kind}" data-id="${esc(threadId)}" data-post="${esc(postId)}">
      <input name="m" maxlength="500" placeholder="${esc(L().replyPh)}" required><button class="rghost" type="submit">${esc(L().reply)}</button></form>`;

  async function renderMy() {
    const t = L(), s = store.get();
    let html = `<button class="rghost rback" data-act="list">${esc(t.back)}</button><div class="placenote" style="margin:0 0 10px">${esc(t.device)}</div>`;
    if (!s.posts.length && !s.threads.length) { root().innerHTML = html + `<div class="card dnote">${esc(t.myEmpty)}</div>`; return; }
    root().innerHTML = html + `<div id="rMy" class="placenote">…</div>`;
    const parts = [];
    if (s.posts.length) {
      parts.push(`<h2 class="rsec">${esc(t.myPosts)}</h2>`);
      for (const mp of s.posts) {
        try {
          const r = await api(`/api/posts/${encodeURIComponent(mp.id)}/owner`, { headers: { "X-Token": mp.token } });
          const st = r.post.expired && r.post.status === "approved" ? "expired" : r.post.status;
          parts.push(`<div class="card"><div class="rtop"><span class="rtitle">${esc(r.post.title)}</span><span class="rstat s-${esc(st)}">${esc(t.st[st] || st)}</span></div>
            ${r.threads.map(th => `<div class="rthread">${msgsHtml(th.messages, "owner")}${replyForm("own", th.id, mp.id)}</div>`).join("") || `<div class="dnote">${esc(t.noMsg)}</div>`}
            ${["approved","pending"].includes(r.post.status) ? `<button class="rghost" data-act="close" data-id="${esc(mp.id)}">✔ ${esc(t.close)}</button>` : ""}</div>`);
        } catch (e) { parts.push(`<div class="card dnote">${esc(mp.title)}：${esc(errMsg(e))}</div>`); }
      }
    }
    if (s.threads.length) {
      parts.push(`<h2 class="rsec">${esc(t.myReqs)}</h2>`);
      for (const mt of s.threads) {
        try {
          const r = await api(`/api/threads/${encodeURIComponent(mt.id)}`, { headers: { "X-Token": mt.token } });
          parts.push(`<div class="card"><div class="rtop"><span class="rtitle">${esc(r.post.title)}</span><span class="rstat s-${esc(r.post.status)}">${esc(t.st[r.post.status] || r.post.status)}</span></div>
            <div class="rthread">${msgsHtml(r.messages, "requester")}${replyForm("req", mt.id)}</div></div>`);
        } catch (e) { parts.push(`<div class="card dnote">${esc(mt.title)}：${esc(errMsg(e))}</div>`); }
      }
    }
    document.getElementById("rMy").outerHTML = parts.join("");
  }

  // ---- イベント（委譲）----
  document.addEventListener("click", async e => {
    const b = e.target.closest("#reuseRoot [data-act]"); if (!b) return;
    const act = b.dataset.act, t = L();
    if (act === "list") { mode = "list"; renderReuse(); }
    else if (act === "post") { mode = "post"; renderReuse(); }
    else if (act === "my") { mode = "my"; renderReuse(); }
    else if (act === "want") { target = posts.find(p => p.id === b.dataset.id); if (target) { mode = "want"; renderReuse(); } }
    else if (act === "report") {
      if (!confirm(t.reportQ)) return;
      try { await api(`/api/posts/${encodeURIComponent(b.dataset.id)}/report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "user" }) });
        b.textContent = t.reported; b.disabled = true; } catch (err) { alert(errMsg(err)); }
    } else if (act === "close") {
      if (!confirm(t.closeQ)) return;
      const mp = store.get().posts.find(p => p.id === b.dataset.id);
      try { await api(`/api/posts/${encodeURIComponent(mp.id)}/close`, { method: "POST", headers: { "X-Token": mp.token } }); renderMy(); }
      catch (err) { alert(errMsg(err)); }
    }
    if (["list","post","my","want"].includes(act)) window.scrollTo(0, 0);
  });
  document.addEventListener("submit", async e => {
    const f = e.target.closest("#reuseRoot form.rreply"); if (!f) return;
    e.preventDefault();
    const s = store.get();
    // 返信の鍵：投稿者なら投稿の鍵、希望者ならスレッドの鍵
    const tokenVal = f.dataset.kind === "own"
      ? (s.posts.find(p => p.id === f.dataset.post) || {}).token
      : (s.threads.find(x => x.id === f.dataset.id) || {}).token;
    if (!tokenVal) return;
    try {
      await api(`/api/threads/${encodeURIComponent(f.dataset.id)}/messages`, { method: "POST", headers: { "Content-Type": "application/json", "X-Token": tokenVal },
        body: JSON.stringify({ message: f.m.value }) });
      renderMy();
    } catch (err) { alert(errMsg(err)); }
  });

  window.renderReuse = function () {
    if (!root()) return;
    if (mode === "post" && READY) renderPost();
    else if (mode === "want" && READY && target) renderWant();
    else if (mode === "my" && READY) renderMy();
    else { mode = "list"; renderList(); }
  };
  renderReuse();
})();

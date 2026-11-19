// 學員頁：入座 → HUD → 九關。狀態存本機，網路只送快照／投票／接力
(function () {
  const { h, R } = window.BLOCKS, S = window.LU_CFG.session, KEY = "lu-st-" + S;
  const fresh = () => ({ done: {}, pass: 0, caught: 0, sheet: {}, team: "", acct: "", player: 0 });
  let st = API.store.get(KEY, null) || fresh();
  // 兩個分頁開同一份進度：存檔前先跟「最新存的」合併（done 取聯集、pass/caught 取大、填的字逐格比時間，新的非空的贏）
  // 「我要重來」會清掉的進度欄位（上課卡 *.learn 在 done 裡）；留著：sheet、sheetAt、team、acct、player、resetId、seatedAt、stageLog
  const PROGRESS = ["done", "doneAt", "undoneAt", "pass", "caught", "picks", "self0", "self1", "voteN", "sortN", "askN", "copied", "manualCopy", "claim", "cardSeen", "relayGroup", "relayRole"];
  function mergeState(a, b) {
    b = b || {};
    const sheet = {}, sheetAt = {}, fields = new Set(Object.keys(a.sheet || {}).concat(Object.keys(b.sheet || {})));
    fields.forEach(f => {
      const va = (a.sheet || {})[f], vb = (b.sheet || {})[f], ta = (a.sheetAt || {})[f] || 0, tb = (b.sheetAt || {})[f] || 0;
      sheet[f] = tb > ta ? vb : va;   // 誰後改誰贏（包括刪光：學員自己清掉的字不能被舊的救活）。沒動過的分頁沒有時間戳＝0，不會蓋掉別人的字
       sheetAt[f] = Math.max(ta, tb);
    });
    const out = Object.assign({}, b, a, { sheet, sheetAt, done: Object.assign({}, b.done, a.done), picks: Object.assign({}, b.picks, a.picks),
      pass: Math.max(a.pass || 0, b.pass || 0), caught: Math.max(a.caught || 0, b.caught || 0) });
    // 稱號用的原始資料：時間取最早、次數取最大、複製過取聯集（舊存檔沒有這些欄位＝當空的）
    const early = (x, y) => (x && y ? Math.min(x, y) : x || y);
    const each = (x, y, f) => { const o = Object.assign({}, y, x); Object.keys(y || {}).forEach(k => { o[k] = f((x || {})[k], y[k]); }); return o; };
    const md = LU.mergeDone(a, b); out.done = md.done;   // 取消過的不會被另一個分頁的舊勾救活（看 undoneAt 比新舊）
    if (a.doneAt || b.doneAt) out.doneAt = md.doneAt;
    if (a.undoneAt || b.undoneAt) out.undoneAt = md.undoneAt;
    if (a.stageSeenAt || b.stageSeenAt) out.stageSeenAt = each(a.stageSeenAt, b.stageSeenAt, early);
    if (a.stageLog || b.stageLog) out.stageLog = LU.mergeLog(a.stageLog, b.stageLog);   // 講師切關時間軸：聯集、排序、去重
    ["voteN", "sortN"].forEach(k => { if (a[k] || b[k]) out[k] = each(a[k], b[k], (x, y) => Math.max(x || 0, y || 0)); });
    if (a.copied || b.copied) out.copied = Object.assign({}, b.copied, a.copied);
    if (a.seatedAt || b.seatedAt) out.seatedAt = early(a.seatedAt, b.seatedAt);
    if (a.askN || b.askN) out.askN = Math.max(a.askN || 0, b.askN || 0);
    if (a.manualCopy || b.manualCopy) out.manualCopy = true;
    // 學員自己「我要重來」（selfResetAt 不同）：進度整包用比較新的那一邊，另一個分頁的舊進度不能合回來；填的字照時間戳合
    const otherClass = typeof a.resetId === "number" && typeof b.resetId === "number" && a.resetId !== b.resetId;   // 換一堂課的情況在下面處理
    if (!otherClass && (a.selfResetAt || 0) !== (b.selfResetAt || 0)) {
      const win = (a.selfResetAt || 0) > (b.selfResetAt || 0) ? a : b;
      PROGRESS.concat(["selfResetAt"]).forEach(k => { if (win[k] === undefined) delete out[k]; else out[k] = win[k]; });
      fillEmpty(out, a, b, ["team", "acct", "player"]);   // 號碼、桌號、帳號：我這邊是空的就拿對方的（0 不能蓋掉 7）
      return out;
    }
    // 兩邊不是同一堂課（resetId 不同）：闖關進度整包用 resetId 比較大的那一邊，不能把上一堂的進度合回來；填的字（sheet）照時間戳合
    if (typeof a.resetId === "number" && typeof b.resetId === "number" && a.resetId !== b.resetId) {
      const win = a.resetId > b.resetId ? a : b;
      ["done", "pass", "caught", "picks", "player", "relayGroup", "relayRole", "self0", "self1", "resetId",
       "doneAt", "undoneAt", "stageSeenAt", "stageLog", "seatedAt", "askN", "voteN", "sortN", "copied", "manualCopy", "claim", "cardSeen", "selfResetAt"].forEach(k => { if (win[k] === undefined) delete out[k]; else out[k] = win[k]; });
      return out;
    }
    fillEmpty(out, a, b, ["team", "acct", "player", "resetId", "relayGroup", "relayRole", "self0", "self1"]);
    return out;
  }
  function fillEmpty(out, a, b, keys) {   // 我這邊（a）是空的（沒有、空字串、0）就拿對方（b）的
    keys.forEach(k => {
      const mine = a[k]; if (mine === undefined || mine === "" || mine === 0) { if (b[k] !== undefined && b[k] !== "" && !(b[k] === 0 && mine !== undefined)) out[k] = b[k]; else if (mine !== undefined) out[k] = mine; }
    });
  }
  const save = () => { const cur = API.store.fresh ? API.store.fresh(KEY, null) : null; if (cur) st = mergeState(st, cur); API.store.set(KEY, st); };
  function snapshot() {
    API.enqueue({ kind: "snap", value: JSON.stringify({ lv: LU.level(st), ach: LU.achievements(st), self0: st.self0 || 0, self1: st.self1 || 0, acct: st.acct,
      title: st.claim ? st.claim.main : undefined, score: st.claim && st.claim.score ? st.claim.score.total : undefined }) });   // 沒領稱號就不帶（JSON 會略過 undefined）
    return flushed();
  }
  // 送出後更新 HUD 的「待送出 N 筆」（0 筆就藏起來）
  function refreshPending() { const n = API.pending(), t = n > 0 ? `待送出 ${n} 筆` : ""; if (hud.pend.textContent !== t) { hud.pend.textContent = t; fitPad(); } }
  // HUD 變高（多了「待送出 N 筆」換行、窄螢幕徽章換行）時，自動捲動的停點跟著往下＝HUD 高＋12，最少 98（同 app.css 的 html scroll-padding-top）；數值沒變不寫
  let padTop = 98;
  function fitPad() {
    const de = document.documentElement, v = hud.el ? Math.max(98, Math.ceil(hud.el.offsetHeight || 0) + 12) : 98;
    if (v === padTop || !de || !de.style) return;
    padTop = v; de.style.scrollPaddingTop = v + "px";
  }
  const flushWatchers = [];   // 各訊息等「排隊的送完了」改字用
  function notifyFlush() { refreshPending(); flushWatchers.slice().forEach(f => f()); }
  function flushed() { const p = Promise.resolve(API.flush()); p.then(notifyFlush, () => {}); return p; }
  const ctx = {
    st: () => st, luc: window.LUC,
    done(id, extra) { const before = st; st = LU.markDone(st, id, extra, Date.now()); save(); renderHud(true); const up = LU.levelUp(before, st); if (up) showLevelUps(LU.level(before), up); return snapshot(); },
    sheet(field, value) { st = Object.assign({}, st, { sheet: Object.assign({}, st.sheet, { [field]: value }), sheetAt: Object.assign({}, st.sheetAt, { [field]: Date.now() }) }); save(); },
    set(patch) { st = Object.assign({}, st, patch); save(); },   // 接力選組別／角色用
    undone(id) { st = LU.markUndone(st, id, Date.now()); save(); renderHud(false); return snapshot(); },   // 取消打勾：照實退級，不播任何動畫；已領的稱號卡不動
    claim(c) { st = Object.assign({}, st, { claim: c }); save(); return snapshot(); },   // 領取／重新計算稱號：存下來並送快照
    send(item) { API.enqueue(item); return flushed(); },
    pending: () => API.pending(),
    onFlush(f) { flushWatchers.push(f); return () => { const i = flushWatchers.indexOf(f); if (i >= 0) flushWatchers.splice(i, 1); }; }
  };
  // ── HUD：徽章＋頭像＋20 格經驗條（只改內容，不重建節點；頭像只在等級變了才換）──
  const hud = { crest: h("span", { class: "crest" }), pix: h("span", { class: "pix" }), bar: h("div", { class: "exp", role: "img" }), label: h("span", { class: "exp-label" }), l1: h("span", {}, "EXP"), l2: h("span", { class: "exp-long" }), l3: h("span", { class: "exp-pct" }), l4: h("span", { class: "exp-long" }), pend: h("span", { class: "step-no pend", role: "status" }), no: h("span", { class: "step-no hud-no" }), lv: 0 };
  hud.label.append(hud.l1, hud.l2, hud.l3, hud.l4);
  for (let i = 0; i < 20; i++) hud.bar.append(h("i"));
  const cls = (el, c, on) => { if (el.classList) el.classList.toggle(c, on); else el.className = (el.className || "").split(" ").filter(x => x && x !== c).concat(on ? [c] : []).join(" "); };
  const calm = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);   // 減少動態：不設 inline 延遲
  const has = (el, c) => String((el && el.className) || "").split(" ").includes(c);
  const put = (el, t) => { if (el.textContent !== t) el.textContent = t; };   // 字沒變就不碰 DOM（輪詢重畫不閃）
  const onceAnim = (el, c) => { cls(el, c, false); void el.offsetWidth; cls(el, c, true); };   // 學員自己按的時候才播一次；播完 animationend 會拿掉 class
  const animEnd = (el, c) => { el.addEventListener("animationend", e => { if (!e || e.target === el) cls(el, c, false); }); return el; };
  Array.from(hud.bar.children).forEach(x => animEnd(x, "fill"));
  function renderHud(user) {   // user＝學員自己在這頁按的（交件）：才播經驗條、小人、小格子的動畫；輪詢／別的分頁更新不播
    const p = LU.progress(st), L = LU.LEVELS[p.lv - 1], on = LU.segments(p.ratio);
    put(hud.crest, `Lv.${p.lv} ${L.name}`);
    if (hud.lv !== p.lv) { hud.lv = p.lv; hud.pix.replaceChildren(AVATAR.el(p.lv, 48)); }
    let k = 0;
    const still = calm();
    Array.from(hud.bar.children).forEach((x, i) => { if (user && i < on && !has(x, "on")) { if (!still) x.style.animationDelay = (k++ * 40) + "ms"; onceAnim(x, "fill"); } cls(x, "on", i < on); });
    renderHero(p.lv, user);
    const pct = Math.round(p.ratio * 100);
    put(hud.l2, "（經驗值）"); put(hud.l3, `${pct}%`);   // 手機上只留「EXP 30%」，後面兩段用 CSS 藏起來
    put(hud.l4, p.next ? `再完成幾件就升到 Lv.${p.next}` : "今天的目標達成：Lv.4 認證講師");   // 間距由 CSS 的 column-gap 負責（不塞全形空白，換行後才不會縮排）
    const aria = `EXP（經驗值）${pct}%，${hud.l4.textContent}`;   // 兩段中間加逗號（畫面上的間距是 CSS 給的，唸出來會黏在一起）
    if (hud.bar.getAttribute ? hud.bar.getAttribute("aria-label") !== aria : true) hud.bar.setAttribute("aria-label", aria);
    const noKey = st.player ? `${st.player}|${st.team}` : (st.team ? "wait" : "");   // 號碼拆三段（手機上排兩行小牌子）；字沒變就不動 DOM
    if (hud.noKey !== noKey) {
      hud.noKey = noKey;
      hud.no.replaceChildren(...(st.player
        ? [h("span", { class: "no-p" }, `${st.player} 號`), h("span", { class: "no-sep", "aria-hidden": "true" }, "｜"), h("span", { class: "no-t" }, BLOCKS.tableName(st.team))]
        : st.team ? [h("span", {}, "網路不太穩，先開始玩，編號稍後補上")] : []));
    }
    renderMenu(user);
  }
  // ── 升級畫面：只播一次，按繼續才關（Esc 也可關；開著時背景 inert） ──
  let openUps = 0;
  // 一次跳好幾級（例如先過考試、後建 Gem：Lv.2 → Lv.4）：一級一張，按「繼續」才出下一張
  function showLevelUps(from, to) {
    const steps = []; for (let l = from + 1; l <= to; l++) steps.push(l);
    const next = () => { const l = steps.shift(); if (l) showLevelUp(l - 1, l, next); };
    next();
  }
  function showLevelUp(from, to, onClose) {
    const A = LU.LEVELS[from - 1], B = LU.LEVELS[to - 1], prev = document.activeElement;
    const appEl = document.getElementById("app"), big = h("div", { class: "pix-big" });
    const close = () => { ov.remove(); if (--openUps <= 0) appEl.inert = false; if (prev && prev.focus) prev.focus(); if (onClose) onClose(); };
    const btn = h("button", { class: "btn submit", onclick: close }, "繼續 →");
    big.append(AVATAR.el(to, 160));
    const ov = h("div", { class: "levelup", role: "dialog", "aria-modal": "true", "aria-label": `升級到 Lv.${to}` },
      h("div", {}, h("h1", {}, "LEVEL UP"), h("p", {}, `Lv.${from} ${A.name} → `, h("strong", { class: "flip" }, `Lv.${to} ${B.name}`)), h("p", {}, B.desc), big, btn));
    ov.addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); close(); } else if (e.key === "Tab") { e.preventDefault(); btn.focus(); } });   // 只有一顆按鈕：焦點鎖在它身上
    openUps++; appEl.inert = true; document.body.append(ov); btn.focus();
  }
  // localStorage 被擋：進度只活在這一頁的記憶體，重新整理就沒了——要明講
  const banner = () => API.store.persistent && !API.store.persistent() ? h("p", { class: "bad-msg banner", role: "alert" }, "這台電腦擋住了瀏覽器存檔：請不要重新整理頁面，否則要重新報到") : "";
  // 別的分頁有新進度：不自動重新整理（會搶走打字的焦點，離線時還會變成瀏覽器的離線頁）。只更新 HUD，另外給一條可關掉的提示
  const online = () => typeof navigator === "undefined" || navigator.onLine !== false;
  const sync = { bar: h("div", { class: "sync-bar hide", role: "status" }), btn: null };
  sync.btn = h("button", { class: "btn small", onclick: () => { if (online()) location.reload(); } }, "按這裡更新畫面");
  sync.bar.append("另一個分頁有新進度，", sync.btn, " ", h("button", { class: "btn small", "aria-label": "關閉提示", onclick: () => cls(sync.bar, "hide", true) }, "關閉"));
  function syncBtn() { const on = online(); sync.btn.textContent = on ? "按這裡更新畫面" : "網路恢復後再按"; sync.btn.disabled = !on; }
  function showSync() { syncBtn(); cls(sync.bar, "hide", false); }
  if (window.addEventListener) { window.addEventListener("online", syncBtn); window.addEventListener("offline", syncBtn); }
  // ── 入座 ──
  function seat(root) {
    const tables = Array.from({ length: 14 }, (_, i) => String(i + 1)).concat(Array.from({ length: 10 }, (_, i) => "線上" + (i + 1)));
    const sel = h("select", { "aria-label": "桌號" }, tables.map(x => h("option", { value: x }, /線上/.test(x) ? x.replace("線上", "線上第 ") + " 組" : `第 ${x} 桌`)));
    const msg = h("p", { "aria-live": "polite" });
    root.replaceChildren(banner(), h("section", { class: "stage" }, h("h2", {}, "報到"), h("p", {}, "左邊開這個網頁，右邊開 Gemini。"), h("label", {}, "你坐第幾桌？"), sel,
      h("p", { class: "step-no" }, "Gem＝存好指令的專屬助教，今天會建兩個：助教和審查員"), h("button", { class: "btn primary", onclick: async e => {
        const go = e.currentTarget;
        if (go.disabled) return;
        go.disabled = true;   // 連點只算一次
        msg.textContent = "入座中…";
        st = Object.assign({}, st, { team: sel.value, seatedAt: st.seatedAt || Date.now() }); save();
        const j = await API.join(sel.value);
        if (j) { st = Object.assign({}, st, { player: j.player, resetId: j.resetId }); save(); }   // 沒連上：player 維持 0，HUD 會提示，之後由輪詢補號
        start(true);
      } }, "入座"), msg));
  }
  // ── 九關 ──
  const stageEls = {};
  function renderBlock(b) {
    if (!R[b.type]) return h("p", { class: "bad-msg" }, "未知元件 " + b.type);
    const el = R[b.type](b, ctx);
    return b.must ? markMust(el) : el;
  }
  function askBtn(s) {   // 課程標準第 10 項：問 Gemini（不串 API，複製一段帶課程脈絡的提示詞）
    const text = `我正在上「AI 團隊自己組團」研習的「${s.title}」這一關（${s.ppt}）。我卡在：（寫你卡在哪）。請用不懂技術的人聽得懂的話，一步一步教我。`;
    const msg = h("span", {}), box = h("div", { class: "paper" }), live = h("div", { "aria-live": "polite" }, msg, box);
    const btn = h("button", { class: "btn", onclick: async () => {
      ctx.set({ askN: (st.askN || 0) + 1 });   // 稱號用：按了幾次「卡住了？」
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = false; }
      if (ok) { BLOCKS.flash(btn, "✓ 已複製，到 Gemini 貼上", 3000); msg.textContent = ""; box.replaceChildren(); }
      else { msg.textContent = "複製不了，請手動選取這段"; box.replaceChildren(text); }
    } }, "卡住了？複製問題去問 Gemini");
    return h("div", {}, h("div", { class: "actions" }, btn, BLOCKS.geminiLink()), live);
  }
  const stageLabel = id => ({ s0: "報到", open: "開場", end: "收尾" })[id] || (/^s[1-6]$/.test(id) ? `第 ${id.slice(1)} 關` : "");
  function walk(n, c, f) { if (n.className && String(n.className).split(" ").includes(c)) f(n); Array.from(n.children || []).forEach(k => walk(k, c, f)); }
  // ── 目錄＋一關一頁（T7，比照宴會廳）：九關的 DOM 只建一次，換頁只切 hidden，打到一半的字不會不見；位置記在網址 #s1 ──
  const IDS = STAGES.map(s => s.id), menu = { el: null, h2: null, rows: {} };
  const tasksOf = id => LU.TASKS.filter(x => x.id.split(".")[0] === id);
  // ── 目錄方向 C（T8）：角色卡＋七套造型衣櫃＋每關徽章＋小格子。節點只建一次，之後只改字和 class；資料沒變就不碰 DOM ──
  const UP = { s1: 2, s2: 3, s4: 4 };   // 做完這關換上哪一套（照 core.js MILESTONES：需求單、助教 Gem、考過 4 題）
  const HOW = { 1: "第 1 關交完需求單就換上", 2: "第 2 關建好助教 Gem 就換上", 3: "第 4 關考過 4 題就換上" };
  const NS = "http://www.w3.org/2000/svg";
  const ICON = {   // 固定的小圖示（不吃使用者輸入），用 createElementNS 畫
    pin: ["none", "2.2", [["path", { d: "M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z" }], ["circle", { cx: 12, cy: 10, r: 2.2 }]]],
    play: ["currentColor", "", [["path", { d: "M8 5.5v13l10.5-6.5z" }]]],
    flag: ["none", "2.2", [["path", { d: "M5 21V4M5 4h11l-2 4 2 4H5" }]]],
    eye: ["none", "2", [["path", { d: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" }], ["circle", { cx: 12, cy: 12, r: 3 }]]],
    check: ["none", "3.2", [["path", { d: "M5 12.5l4.5 4.5L19 7.5" }]]]
  };
  function icon(k, w) {
    const [fill, sw, parts] = ICON[k], s = document.createElementNS(NS, "svg");
    [["viewBox", "0 0 24 24"], ["width", w], ["height", w], ["fill", fill], ["aria-hidden", "true"]].forEach(([a, v]) => s.setAttribute(a, v));
    if (sw) [["stroke", "currentColor"], ["stroke-width", sw], ["stroke-linecap", "round"], ["stroke-linejoin", "round"]].forEach(([a, v]) => s.setAttribute(a, v));
    parts.forEach(([t, a]) => { const e = document.createElementNS(NS, t); Object.keys(a).forEach(x => e.setAttribute(x, a[x])); s.append(e); });
    return s;
  }
  const avImg = (lv, c) => { const i = h("img", { class: c || "", alt: "" }); i.src = `img/avatar-lv${lv}.png`; return i; };
  const emblemOf = s => s.id === "s0" ? icon("pin", 24) : s.id === "open" ? icon("play", 24) : s.id === "end" ? icon("flag", 24) : s.demo ? icon("eye", 26) : s.id.slice(1);
  const MINI_ICON = { s0: "pin", open: "play", end: "flag" };
  const miniMark = s => MINI_ICON[s.id] ? icon(MINI_ICON[s.id], 14) : s.id.slice(1);   // 九點小路線：第 1～6 關寫號碼，報到／開場／收尾用跟目錄徽章同一套圖
  const pipsOf = n => h("span", { class: "pips", "aria-hidden": "true" }, Array.from({ length: n }, () => animEnd(h("i"), "pop")));
  function setPips(el, n, user) { Array.from(el.children).forEach((p, j) => { const on = j < n; if (user && on && !has(p, "on")) onceAnim(p, "pop"); cls(p, "on", on); }); }
  const hero = { img: null, lv: h("b"), name: h("span"), desc: h("p", { class: "hero-desc" }), next: h("p", { class: "hero-next" }), closet: [], shown: 0 };
  // 新手路線（規格 20 B）：目錄每關一個標籤、必做題一個小標（放在題目那一行最前面）
  const PATH_LABEL = { must: "必做", all: "全班一起", skip: "可跳過" };
  const pathTag = s => PATH_LABEL[s.path] ? h("span", { class: "path-tag " + s.path }, PATH_LABEL[s.path]) : "";
  function markMust(el) { const line = (el.children || [])[0] || el; line.prepend(h("span", { class: "must-tag" }, "必做")); return el; }
  function buildMenu() {
    menu.h2 = h("h2", { tabindex: "-1" }, "闖關目錄");
    hero.img = animEnd(avImg(LU.level(st)), "pose");   // 直接用目前等級的圖，不先抓一張 Lv.1
    const heroEl = h("div", { class: "hero" }, h("div", { class: "hero-art" }, hero.img),
      h("div", { class: "hero-info" }, h("p", { class: "hero-k" }, "你的 AI 助理"), h("p", { class: "hero-lv" }, hero.lv, hero.name), hero.desc), hero.next);
    const closet = h("ol", { class: "closet", "aria-label": "七套造型：已拿到、現在、還沒到、講師示範" }, LU.LEVELS.map(L => {
      const img = avImg(L.lv); img.alt = `Lv.${L.lv} ${L.name}`;
      const li = h("li", { style: `--i:${L.lv - 1}` }, img, h("span", { class: "cl-lv" }, h("span", { class: "cl-pre" }, "Lv."), String(L.lv)),
        L.lv >= 5 ? h("span", { class: "cl-eye" }, icon("eye", 16)) : h("span", { class: "cl-ok" }, icon("check", 12)));
      hero.closet.push({ li, img }); return li;
    }));
    const list = h("ol", { class: "menu-list" }, STAGES.map((s, k) => {
      const ts = tasksOf(s.id), cnt = h("span", { class: "mr-cnt" }), now = h("span", { class: "mr-now" }, "講師進行中"), pips = pipsOf(ts.length), up = UP[s.id];
      const rimg = up ? avImg(up, "sil") : null, reward = up ? h("span", { class: "q-reward" }, rimg, "→ ", h("b", {}, `Lv.${up} ${LU.LEVELS[up - 1].name}`)) : "";
      const row = h("button", { class: "menu-row" + (s.demo ? " demo" : ""), "data-stage": s.id, onclick: () => go(s.id) },
        h("span", { class: "emblem", "aria-hidden": "true" }, emblemOf(s), h("span", { class: "em-ok" }, icon("check", 13))),
        h("span", { class: "q-main" }, h("span", { class: "mr-no" }, /^s[1-6]$/.test(s.id) ? stageLabel(s.id) : ""), h("span", { class: "mr-name" }, s.title, pathTag(s)), h("small", {}, `${s.time}｜PPT ${s.ppt}`), reward),
        h("span", { class: "mr-st" }, now, cnt, pips));
      now.hidden = true; menu.rows[s.id] = { row, cnt, now, pips, reward: reward || null, rimg };
      return h("li", { style: `--i:${k + 7}` }, row);
    }));
    const link = (STAGES.find(s => s.id === "end") || { blocks: [] }).blocks.find(b => b.type === "link");   // 附錄：跟收尾關同一個網址
    // 頁面內兩段式確認（不用 window.confirm：LINE／FB 內建瀏覽器可能擋掉，按了沒反應）
    const againBtn = h("button", { class: "btn small", type: "button", "aria-expanded": "false" }, "我要重來（清掉我的進度）");
    const msg = h("p", { class: "confirm-msg", tabindex: "-1" }, "確定要清掉你的進度嗎？等級、任務、稱號都會歸零；你寫過的字、號碼和桌號會留著。");
    const box = h("div", { class: "confirm-box", role: "group", "aria-label": "確認清掉進度" }, msg,
      h("div", { class: "actions" }, h("button", { class: "btn small danger", type: "button", onclick: () => { close(false); selfReset(); } }, "確定清掉"), h("button", { class: "btn small", type: "button", onclick: () => close(true) }, "取消")));
    const close = back => { box.hidden = true; againBtn.setAttribute("aria-expanded", "false"); if (back && againBtn.focus) againBtn.focus(); };
    box.hidden = true;
    againBtn.addEventListener("click", () => { box.hidden = false; againBtn.setAttribute("aria-expanded", "true"); if (msg.focus) msg.focus(); });
    const again = h("div", { class: "self-reset" }, againBtn, box);
    menu.el = h("section", { class: "stage menu intro", id: "menu" }, heroEl, closet, h("p", { class: "step-no" }, "點一關進去；講師上到哪一關會標「講師進行中」，你可以自由切換"), menu.h2, list, link ? R.link(link) : "", again);
    return menu.el;
  }
  // ── 關卡頁頂端（T9）：關號時間 PPT、標題、這關已交 N／M 件＋小格子；會升級的關右邊放「這關解鎖」剪影；底下九個點的小路線（點了就跳關）──
  const heads = {};
  function stageHead(s, h2) {
    const ts = tasksOf(s.id), cnt = h("b"), pips = pipsOf(ts.length), up = UP[s.id], here = IDS.indexOf(s.id);
    const left = h("div", { class: "qh-main" }, h("p", { class: "step-no" }, `${stageLabel(s.id)}｜${s.time}｜PPT ${s.ppt}`), h2,
      s.tip ? h("p", { class: "path-tip" }, s.tip) : "", ts.length ? h("p", { class: "qh-cnt" }, "這關完成 ", cnt, " 件 ", pips) : "");
    let reward = null, rk = null, rimg = null;
    if (up) {
      const L = LU.LEVELS[up - 1]; rimg = avImg(up, "sil"); rk = h("span", { class: "rw-k" }, "這關解鎖");
      reward = h("figure", { class: "reward" }, h("div", { class: "rw-art" }, rimg), h("figcaption", {}, rk, h("b", {}, `Lv.${up} ${L.name}`), h("span", { class: "rw-d" }, L.desc)));
      reward.addEventListener("animationend", () => cls(reward, "burst", false));   // 光環播完就收掉，切頁回來不重播
    }
    const minis = STAGES.map((t, k) => {
      const btn = h("button", { type: "button", class: "mini-dot", onclick: () => go(t.id) }, h("i", {}, miniMark(t)));
      if (k === here) btn.setAttribute("aria-current", "step");
      return h("li", { class: [t.demo ? "demo" : "", k < here ? "walked" : "", k === here ? "here" : ""].filter(Boolean).join(" ") }, btn);
    });
    heads[s.id] = { cnt, pips, reward, rk, rimg, up, minis };
    return h("header", { class: "qhead" + (up ? "" : " no-reward") }, left, reward || "", h("ol", { class: "mini", "aria-label": `九關路線，這是第 ${here + 1} 站` }, minis));
  }
  function renderHeads(full, user) {   // full[k]＝第 k 關做完了沒；只改 class 和不一樣的字
    STAGES.forEach(s => {
      const hd = heads[s.id]; if (!hd) return;
      hd.minis.forEach((li, k) => {
        cls(li, "done", full[k]);
        const t = STAGES[k], btn = li.children[0], label = `${stageLabel(t.id) || t.title}｜${t.title}${full[k] ? "（做完了）" : ""}${t.id === s.id ? "（你在這）" : ""}`;
        if (btn.getAttribute ? btn.getAttribute("aria-label") !== label : (btn.attrs || {})["aria-label"] !== label) btn.setAttribute("aria-label", label);
      });
    });
  }
  function renderHero(lv, user) {   // 等級沒變就整段跳過（小人圖不重新載入）
    if (!menu.el || hero.shown === lv) return;
    hero.shown = lv;
    const L = LU.LEVELS[lv - 1], nx = lv + 1;
    if (hero.img.src !== `img/avatar-lv${lv}.png` && !String(hero.img.src).endsWith(`/img/avatar-lv${lv}.png`)) hero.img.src = `img/avatar-lv${lv}.png`;
    hero.img.alt = `你的 AI 助理現在的樣子：Lv.${lv} ${L.name}`;
    if (user) onceAnim(hero.img, "pose");   // 自己交件升級那一下才跳
    put(hero.lv, `Lv.${lv}`); put(hero.name, L.name); put(hero.desc, L.desc);
    hero.next.replaceChildren(...(nx <= 4 ? [avImg(nx, "sil"), h("span", {}, "下一套造型：", h("b", {}, `Lv.${nx} ${LU.LEVELS[nx - 1].name}`), `（${HOW[lv]}）`)] : [h("span", {}, "今天的目標達成：", h("b", {}, "Lv.4 認證講師"))]));
    hero.closet.forEach(({ li, img }, k) => { const l = k + 1, lock = l > lv && l < 5; li.className = l >= 5 ? "demo" : l < lv ? "got" : l === lv ? "got cur" : "lock"; img.className = lock ? "sil" : ""; img.alt = `Lv.${l} ${LU.LEVELS[k].name}${lock ? "（還沒拿到）" : ""}`; });
    STAGES.forEach(s => { const r = menu.rows[s.id]; if (r && r.reward) { cls(r.reward, "got", lv >= UP[s.id]); cls(r.rimg, "sil", lv < UP[s.id]); } });
    Object.keys(heads).forEach(id => {   // 關卡頁的「這關解鎖」：拿到就變彩色、實線、「已解鎖」；自己交件升級那一下光環擴散一次
      const hd = heads[id]; if (!hd.reward) return;
      const got = lv >= hd.up, was = has(hd.reward, "unlocked");
      cls(hd.reward, "unlocked", got); cls(hd.rimg, "sil", !got); put(hd.rk, got ? "已解鎖" : "這關解鎖");
      if (user && got && !was) onceAnim(hd.reward, "burst");
    });
  }
  function renderMenu(user) {   // 已做幾件／共幾件、小格子、全做完打勾、講師正在上的那關；資料沒變就不寫 DOM
    const done = st.done || {}, fulls = [];
    STAGES.forEach(s => {
      const ts = tasksOf(s.id), n = ts.filter(x => done[x.id]).length, full = ts.length > 0 && n === ts.length, now = lastStage === s.id;
      fulls.push(full);
      const hd = heads[s.id]; if (hd) { put(hd.cnt, `${n}／${ts.length}`); setPips(hd.pips, n, user); }
      const r = menu.rows[s.id]; if (!r) return;
      put(r.cnt, `${full ? "✓ " : ""}${n}／${ts.length} 件`); cls(r.row, "full", full); cls(r.row, "now", now);
      if (r.now.hidden !== !now) r.now.hidden = !now;
      setPips(r.pips, n, user);
    });
    renderHeads(fulls, user);
  }
  const pager = { back: h("button", { class: "btn", onclick: () => go("menu") }, "← 目錄"), prev: h("button", { class: "btn", onclick: () => step(-1) }, "上一關"), next: h("button", { class: "btn primary", onclick: () => step(1) }, "下一關 →") };
  pager.el = h("nav", { class: "pager", "aria-label": "換關" }, pager.back, pager.prev, pager.next);
  let view = "";
  const here = () => { const id = String((typeof location !== "undefined" && location.hash) || "").replace(/^#/, ""); return IDS.includes(id) ? id : "menu"; };   // # 或 #menu 或亂寫的＝目錄
  const stageH2 = {};
  function route(user) {   // user＝按鈕換頁或瀏覽器上一頁：才捲到頂、才搬焦點（第一次載入保留瀏覽器自己的捲動位置）
    if (!menu.el) return;
    const id = here(), i = IDS.indexOf(id);
    if (id !== "menu") cls(menu.el, "intro", false);   // 進場動畫只在目錄第一次出現時播；離開後回來不重播
    menu.el.hidden = id !== "menu"; IDS.forEach(k => { if (stageEls[k]) stageEls[k].hidden = k !== id; });
    pager.el.hidden = id === "menu"; pager.prev.hidden = i <= 0; pager.next.hidden = i < 0 || i >= IDS.length - 1;
    if (id === view) return;
    view = id;
    if (!user) return;
    if (window.scrollTo) window.scrollTo(0, 0);
    const t = id === "menu" ? menu.h2 : stageH2[id]; if (t && t.focus) t.focus({ preventScroll: true });   // 鍵盤／螢幕閱讀器使用者從新的一頁開頭讀起
  }
  function go(id) { location.hash = "#" + id; route(true); }   // 真瀏覽器還會再觸發 hashchange → route，同一頁不會再捲
  function step(d) { const i = IDS.indexOf(here()); if (i >= 0 && IDS[i + d]) go(IDS[i + d]); }
  if (window.addEventListener) window.addEventListener("hashchange", () => route(true));   // 瀏覽器上一頁／下一頁
  let started = false;
  function start(focusFirst) {
    if (started) return;   // 只准啟動一次，不會長出兩條輪詢
    started = true;
    const root = document.getElementById("app");
    root.replaceChildren(banner(), sync.bar, (hud.el = h("header", { class: "hud" }, hud.crest, h("div", {}, hud.bar, hud.label, " ", hud.pend), h("div", {}, hud.pix, hud.no))), buildMenu());
    if (window.ResizeObserver) new ResizeObserver(fitPad).observe(hud.el);   // 換行、字型載好、轉向造成的變高都抓得到
    STAGES.forEach(s => root.append(buildStage(s)));
    root.append(pager.el);
    renderHud(); route(); snapshot(); poll();
    if (focusFirst && menu.h2.focus) menu.h2.focus();   // 入座後把焦點交給目錄標題（螢幕閱讀器／鍵盤使用者不會停在已消失的按鈕）
  }
  function buildStage(s) {   // 報到那一關交件後也留著，可以改、可以再交
      const h2 = h("h2", { tabindex: "-1" }, s.title); stageH2[s.id] = h2;
      // 先教學、後作答（T12）：報到～第 5 關的上課卡沒上完，作答區根本不建（不是用 CSS 藏）；上完或舊存檔已作答過就直接給作答區，上課收成可展開複習。
      // 第 6 關與收尾是選看：收在「想複習再點開」，作答一直在。上課卡的狀態只在記憶體，輪詢不碰
      const answers = h("div", { class: "answers", tabindex: "-1" }), learnBox = h("div", { class: "learn" }), askBox = h("div", { class: "ask" });
      const el = h("section", { class: "stage" + (s.demo ? " demo" : ""), id: "st-" + s.id }, stageHead(s, h2), learnBox, answers, askBox);
      const fill = () => {
        if (answers.children.length) return;
        answers.append(...s.blocks.map(renderBlock));
        askBox.replaceChildren(askBtn(s));   // 「卡住了？」跟作答一起出現（還沒上完課時會複製到還看不到的題目）
        const demo = s.blocks.find(b => b.type === "demo"), wraps = [];
        walk(answers, "pixel-wrap", w => wraps.push(w));
        if (demo) wraps.forEach((w, i) => { if (demo.cards[i]) w.append(AVATAR.el(demo.cards[i].lv, 64)); });
      };
      const lid = s.id + ".learn", needLearn = LU.TASKS.some(x => x.id === lid);
      const learned = () => { const d = st.done || {}; return !!d[lid] || tasksOf(s.id).some(x => x.id !== lid && d[x.id]); };   // 舊存檔：這關已經有作答＝當作上過課（不擋、不補 EXP）
      const review = label => {
        const det = h("details", { class: "t-review" }, h("summary", {}, label));
        const tc = BLOCKS.teach(s.learn, { lastLabel: "看完了", onFinish: () => { det.open = false; tc.restart(); if (needLearn && !(st.done || {})[lid]) ctx.done(lid); } });   // 舊存檔沒記到上課：複習看完就補記（+5）
        det.append(tc); learnBox.replaceChildren(det);
      };
      if (s.learn && s.learn.length) {
        if (needLearn && !learned()) learnBox.replaceChildren(BLOCKS.teach(s.learn, { lastLabel: "上完課了，開始作答", onFinish: () => {
          ctx.done(lid); review("複習上課內容"); fill();
          if (answers.scrollIntoView) answers.scrollIntoView({ block: "start", behavior: window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
          if (answers.focus) answers.focus({ preventScroll: true });   // 作答區捲到頂、焦點交給它
        } }));
        else { review(needLearn ? "複習上課內容" : "想複習再點開"); fill(); }
      } else fill();
      stageEls[s.id] = el;
      return el;
  }
  // 學員自己「我要重來」：只清這一台的進度（比照講師「新的一堂課」，但不動 resetId、不重新取號）；不重新整理，關卡畫面原地重建、回目錄、不播動畫
  function selfReset() {
    const keep = {}; ["sheet", "sheetAt", "team", "acct", "player", "resetId", "seatedAt", "stageLog"].forEach(k => { if (st[k] !== undefined) keep[k] = st[k]; });
    st = Object.assign(keep, { done: {}, pass: 0, caught: 0, selfResetAt: Date.now() });
    save();   // 跟別的分頁剛存的合併時，selfResetAt 比較新的這邊贏，舊進度不會合回來
    window.RELAY_UPDATE = null; lastRelay = null;   // 接力組別清掉了，輪詢間隔不再用舊組別算
    if (BLOCKS.unwatchAll) BLOCKS.unwatchAll();   // 舊關卡的紙卡不再聽「第 1 格」的改動
    const root = document.getElementById("app");
    STAGES.forEach(s => { const old = stageEls[s.id]; if (old && old.remove) old.remove(); root.append(buildStage(s)); });
    root.append(pager.el);
    renderHud(false); snapshot();
    location.hash = "#menu"; route();
    if (window.scrollTo) window.scrollTo(0, 0);
    if (menu.h2.focus) menu.h2.focus({ preventScroll: true });
  }
  // ── 輪詢：講師上到哪一關（只更新目錄上的「講師進行中」，不換頁、不捲動）＋接力 ──
  let lastStage = "", lastRelay = null;
  // 下一輪等多久：平常 15 秒；只有 B／C 棒在等前一棒的文字時才 5 秒（前一棒文字到了就回 15 秒；A 棒不用密集）
  const PREV = { B: "A", C: "B" };
  function nextPollMs(st, relay) {
    const prev = PREV[st.relayRole];
    return st.relayGroup && prev && !(relay && relay[prev]) ? 5000 : 15000;
  }
  let pollTimer = null, polling = null;
  function poll() {   // 同時只跑一輪；切回分頁時插隊輪詢也不會多長出一條
    if (polling) return polling;
    clearTimeout(pollTimer); pollTimer = null;
    polling = pollOnce().finally(() => { polling = null; });
    return polling;
  }
  async function pollOnce() {
    let again = true;
    try {
      if (st.team && !st.player) {   // 入座時沒連上：每輪補一次號碼
        const jn = await API.join(st.team);
        if (jn) { st = Object.assign({}, st, { player: jn.player, resetId: jn.resetId }); save(); renderHud(); snapshot(); }
      }
      const j = await API.ping(st.relayGroup || "");   // 每次讀當下的 st，中途選了組別立刻生效
      // 只認伺服器真的回了 stage 欄位（字串）；n8n 出錯回的 {message:...} 不能當成「切回報到」。空字串＝講師還沒切過關＝投影幕停在報到；不認得的關卡一律不記
      const raw = j && typeof j.stage === "string" ? (j.stage || "s0") : "", stage = LU.STAGE_ORDER.includes(raw) ? raw : "";
      const log = LU.mergeLog(st.stageLog, []);   // 先清掉壞掉的項目再比對最後一筆
      if (stage && (!log.length || log[log.length - 1][1] !== stage)) ctx.set({ stageLog: log.concat([[Date.now(), stage]]) });   // 講師切關時間軸：看到的關卡改變才加一筆（手速從這裡起算）
      if (stage && stage !== lastStage) { lastStage = stage; renderMenu(); }   // 學員自由切換（比照宴會廳）：講師切關不跳轉、不跳提示條
      if (j && j.relay) { lastRelay = j.relay; if (window.RELAY_UPDATE) window.RELAY_UPDATE(j.relay); }
      // 講師按了新的一堂課。resetId 是數字（含 0）才清；undefined＝入座沒連上，不動
      if (j && typeof st.resetId === "number" && Number(j.resetId) > st.resetId) { again = false; // 只清闖關進度；學員自己寫的內容（sheet）、桌號、帳號都留著，重開後用同一桌重新取號
        st = { sheet: st.sheet || {}, sheetAt: st.sheetAt || {}, team: st.team, acct: st.acct, done: {}, pass: 0, caught: 0, player: 0, resetId: Number(j.resetId), seatedAt: Date.now() };   // resetId 記新的：別的舊分頁合併時會輸給它，清掉的進度不會復活
        API.store.set(KEY, st); API.store.set("lu-q-" + S, []); location.reload(); return; }   // 直接寫、不跟舊的合併，否則清掉的進度會被合回來
      await API.flush(); notifyFlush();
    } catch (e) { /* 單輪失敗不影響下一輪 */ }
    finally {
      if (again) { pollTimer = setTimeout(poll, nextPollMs(st, lastRelay) * (0.85 + Math.random() * 0.3)); }   // 錯開 ±15%
    }
  }
  // 別的分頁改了同一份進度：吸收進來並更新 HUD；進度（done）變了就出一條提示，由學員決定要不要重新整理；只是填字就不動畫面
  function onStorage(e) {
    if (!e || e.key !== KEY || !e.newValue) return;
    let other; try { other = JSON.parse(e.newValue); } catch (x) { return; }
    const keys = o => Object.keys((o && o.done) || {}).sort().join(",");
    const changed = keys(other) !== keys(st);
    st = mergeState(other, st);
    renderHud(); refreshPending();   // 等級、經驗條、頭像、待送出筆數：原地更新，不動焦點
    if (changed) showSync();
  }
  if (window.addEventListener) window.addEventListener("storage", onStorage);
  if (document.addEventListener) document.addEventListener("visibilitychange", () => { if (started && document.visibilityState === "visible") poll(); });   // 切回這個分頁：馬上問講師上到哪（背景分頁的計時器會被瀏覽器放慢）
  window.APP = { ctx, poll, nextPollMs, mergeState, onStorage, route, state: () => st, lastRelay: () => lastRelay };   // 測試與除錯用
  st.team ? start() : seat(document.getElementById("app"));
})();

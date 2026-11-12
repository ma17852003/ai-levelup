// 學員頁：入座 → HUD → 九關。狀態存本機，網路只送快照／投票／接力
(function () {
  const { h, R } = window.BLOCKS, S = window.LU_CFG.session, KEY = "lu-st-" + S;
  const fresh = () => ({ done: {}, pass: 0, caught: 0, sheet: {}, team: "", acct: "", player: 0 });
  let st = API.store.get(KEY, null) || fresh();
  const save = () => API.store.set(KEY, st);
  function snapshot() {
    API.enqueue({ kind: "snap", value: JSON.stringify({ lv: LU.level(st), ach: LU.achievements(st), self0: st.self0 || 0, self1: st.self1 || 0, acct: st.acct }) });
    return flushed();
  }
  // 送出後更新 HUD 的「待送出 N 筆」（0 筆就藏起來）
  function refreshPending() { const n = API.pending(); hud.pend.textContent = n > 0 ? `待送出 ${n} 筆` : ""; }
  function flushed() { const p = Promise.resolve(API.flush()); p.then(refreshPending, () => {}); return p; }
  const ctx = {
    st: () => st, luc: window.LUC,
    done(id, extra) { const before = st; st = LU.markDone(st, id, extra); save(); renderHud(); const up = LU.levelUp(before, st); if (up) showLevelUp(LU.level(before), up); return snapshot(); },
    sheet(field, value) { st = Object.assign({}, st, { sheet: Object.assign({}, st.sheet, { [field]: value }) }); save(); },
    set(patch) { st = Object.assign({}, st, patch); save(); },   // 接力選組別／角色用
    send(item) { API.enqueue(item); return flushed(); },
    pending: () => API.pending()
  };
  // ── HUD：徽章＋頭像＋20 格經驗條（只改內容，不重建節點；頭像只在等級變了才換）──
  const hud = { crest: h("span", { class: "crest" }), pix: h("span", { class: "pix" }), bar: h("div", { class: "exp", role: "img" }), label: h("span", { class: "exp-label" }), pend: h("span", { class: "step-no pend", role: "status" }), no: h("span", { class: "step-no" }), lv: 0 };
  for (let i = 0; i < 20; i++) hud.bar.append(h("i"));
  const cls = (el, c, on) => { if (el.classList) el.classList.toggle(c, on); else el.className = (el.className || "").split(" ").filter(x => x && x !== c).concat(on ? [c] : []).join(" "); };
  function renderHud() {
    const p = LU.progress(st), L = LU.LEVELS[p.lv - 1], on = LU.segments(p.ratio);
    hud.crest.textContent = `Lv.${p.lv} ${L.name}`;
    if (hud.lv !== p.lv) { hud.lv = p.lv; hud.pix.replaceChildren(AVATAR.el(p.lv, 48)); }
    Array.from(hud.bar.children).forEach((x, i) => cls(x, "on", i < on));
    const pct = Math.round(p.ratio * 100);
    hud.label.textContent = p.next ? `EXP（經驗值）${pct}%　再完成幾件就升到 Lv.${p.next}` : "今天的目標達成：Lv.4 專員";
    hud.bar.setAttribute("aria-label", hud.label.textContent);
    hud.no.textContent = st.player ? `${st.player} 號｜第 ${st.team} 桌` : (st.team ? "網路不太穩，先開始玩，編號稍後補上" : "");
  }
  // ── 升級畫面：只播一次，按繼續才關（Esc 也可關；開著時背景 inert） ──
  let openUps = 0;
  function showLevelUp(from, to) {
    const A = LU.LEVELS[from - 1], B = LU.LEVELS[to - 1], prev = document.activeElement;
    const appEl = document.getElementById("app"), big = h("div", { class: "pix-big" });
    const close = () => { ov.remove(); if (--openUps <= 0) appEl.inert = false; if (prev && prev.focus) prev.focus(); };
    const btn = h("button", { class: "btn submit", onclick: close }, "繼續 →");
    big.append(AVATAR.el(to, 160));
    const ov = h("div", { class: "levelup", role: "dialog", "aria-modal": "true", "aria-label": `升級到 Lv.${to}` },
      h("div", {}, h("h1", {}, "LEVEL UP"), h("p", {}, `Lv.${from} ${A.name} → `, h("strong", { class: "flip" }, `Lv.${to} ${B.name}`)), h("p", {}, B.desc), big, btn));
    ov.addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); close(); } else if (e.key === "Tab") { e.preventDefault(); btn.focus(); } });   // 只有一顆按鈕：焦點鎖在它身上
    openUps++; appEl.inert = true; document.body.append(ov); btn.focus();
  }
  // ── 入座 ──
  function seat(root) {
    const tables = Array.from({ length: 14 }, (_, i) => String(i + 1)).concat(Array.from({ length: 10 }, (_, i) => "線上" + (i + 1)));
    const sel = h("select", { "aria-label": "桌號" }, tables.map(x => h("option", { value: x }, /線上/.test(x) ? x.replace("線上", "線上第 ") + " 組" : `第 ${x} 桌`)));
    let acct = "";
    const ticks = [], accts = [["personal", "個人 Google 帳號（有 Skills）"], ["school", "學校帳號（做成 Gem）"]].map(([k, l]) => {
      const tk = h("span", { class: "tick", "aria-hidden": "true" }); ticks.push(tk);
      return h("button", { class: "btn", "aria-pressed": "false", onclick: e => { acct = k; accts.forEach((x, i) => { x.setAttribute("aria-pressed", "false"); ticks[i].textContent = ""; }); e.currentTarget.setAttribute("aria-pressed", "true"); tk.textContent = "✓"; } }, tk, l);
    });
    const msg = h("p", { "aria-live": "polite" });
    root.replaceChildren(h("section", { class: "stage" }, h("h2", {}, "報到"), h("p", {}, "左邊開這個網頁，右邊開 Gemini。"), h("label", {}, "你坐第幾桌？"), sel,
      h("p", {}, "你今天用哪個帳號登入 Gemini？"), accts, h("p", { class: "step-no" }, "Gem＝存好指令的專屬助理；Skill＝寫好的一套做事方法（SOP，標準作業流程），打 @ 叫出來"), h("button", { class: "btn primary", onclick: async e => {
        const go = e.currentTarget;
        if (go.disabled) return;
        if (!acct) { msg.textContent = "先選帳號"; return; }
        go.disabled = true;   // 連點只算一次
        msg.textContent = "入座中…";
        st = Object.assign({}, st, { team: sel.value, acct }); save();
        const j = await API.join(sel.value);
        if (j) { st = Object.assign({}, st, { player: j.player, resetId: j.resetId }); save(); }   // 沒連上：player 維持 0，HUD 會提示，之後由輪詢補號
        start();
      } }, "入座"), msg));
  }
  // ── 九關 ──
  const stageEls = {};
  function renderBlock(b) {
    if (b.type === "acct") return h("div", {}, (st.acct === "school" ? b.school : b.personal).map(renderBlock));
    return R[b.type] ? R[b.type](b, ctx) : h("p", { class: "bad-msg" }, "未知元件 " + b.type);
  }
  function askBtn(s) {   // 課程標準第 10 項：問 Gemini（不串 API，複製一段帶課程脈絡的提示詞）
    const text = `我正在上「AI 團隊自己組團」研習的「${s.title}」這一關（${s.ppt}）。我卡在：（寫你卡在哪）。請用不懂技術的人聽得懂的話，一步一步教我。`;
    const msg = h("span", {}), box = h("div", { class: "paper" }), live = h("div", { "aria-live": "polite" }, msg, box);
    const btn = h("button", { class: "btn", onclick: async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = false; }
      if (ok) { BLOCKS.flash(btn, "✓ 已複製，到右邊 Gemini 貼上", 3000); msg.textContent = ""; box.replaceChildren(); }
      else { msg.textContent = "複製不了，請手動選取這段"; box.replaceChildren(text); }
    } }, "卡住了？複製問題去問 Gemini");
    return h("div", {}, btn, live);
  }
  const stageLabel = id => ({ s0: "報到", open: "開場", end: "收尾" })[id] || (/^s[1-6]$/.test(id) ? `第 ${id.slice(1)} 關` : "");
  function walk(n, c, f) { if (n.className && String(n.className).split(" ").includes(c)) f(n); Array.from(n.children || []).forEach(k => walk(k, c, f)); }
  let started = false;
  function start() {
    if (started) return;   // 只准啟動一次，不會長出兩條輪詢
    started = true;
    const root = document.getElementById("app");
    root.replaceChildren(h("header", { class: "hud" }, hud.crest, h("div", {}, hud.bar, hud.label, " ", hud.pend), h("div", {}, hud.pix, hud.no)));
    STAGES.filter(s => s.id !== "s0" || !st.done["s0.first"]).forEach(s => {
      const el = h("section", { class: "stage" + (s.demo ? " demo" : ""), id: "st-" + s.id },
        h("p", { class: "step-no" }, `${stageLabel(s.id)}｜${s.time}｜PPT ${s.ppt}`), h("h2", {}, s.title), s.blocks.map(renderBlock), askBtn(s));
      const demo = s.blocks.find(b => b.type === "demo"), wraps = [];
      walk(el, "pixel-wrap", w => wraps.push(w));
      if (demo) wraps.forEach((w, i) => { if (demo.cards[i]) w.append(AVATAR.el(demo.cards[i].lv, 64)); });
      stageEls[s.id] = el; root.append(el);
    });
    renderHud(); snapshot(); poll();
  }
  // ── 輪詢：講師上到哪一關（只換 class，不捲動）＋接力 ──
  let lastStage = "", lastRelay = null;
  // 下一輪等多久：平常 15 秒；只有 B／C 棒在等前一棒的文字時才 5 秒（前一棒文字到了就回 15 秒；A 棒不用密集）
  const PREV = { B: "A", C: "B" };
  function nextPollMs(st, relay) {
    const prev = PREV[st.relayRole];
    return st.relayGroup && prev && !(relay && relay[prev]) ? 5000 : 15000;
  }
  async function poll() {
    let again = true;
    try {
      if (st.team && !st.player) {   // 入座時沒連上：每輪補一次號碼
        const jn = await API.join(st.team);
        if (jn) { st = Object.assign({}, st, { player: jn.player, resetId: jn.resetId }); save(); renderHud(); snapshot(); }
      }
      const j = await API.ping(st.relayGroup || "");   // 每次讀當下的 st，中途選了組別立刻生效
      if (j && j.stage && j.stage !== lastStage) {
        Object.values(stageEls).forEach(e => cls(e, "now", false));
        if (stageEls[j.stage]) cls(stageEls[j.stage], "now", true);
        lastStage = j.stage;
      }
      if (j && j.relay) { lastRelay = j.relay; if (window.RELAY_UPDATE) window.RELAY_UPDATE(j.relay); }
      // 講師按了新的一堂課。resetId 是數字（含 0）才清；undefined＝入座沒連上，不動
      if (j && typeof st.resetId === "number" && Number(j.resetId) > st.resetId) { again = false; // 只清闖關進度；學員自己寫的內容（sheet）、桌號、帳號都留著，重開後用同一桌重新取號
        st = { sheet: st.sheet || {}, team: st.team, acct: st.acct, done: {}, pass: 0, caught: 0, player: 0 };
        save(); API.store.set("lu-q-" + S, []); location.reload(); return; }
      await API.flush(); refreshPending();
    } catch (e) { /* 單輪失敗不影響下一輪 */ }
    finally {
      if (again) { setTimeout(poll, nextPollMs(st, lastRelay) * (0.85 + Math.random() * 0.3)); }   // 錯開 ±15%
    }
  }
  window.APP = { ctx, poll, nextPollMs, state: () => st };   // 測試與除錯用
  st.team ? start() : seat(document.getElementById("app"));
})();

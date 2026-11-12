// 投影幕：每 3 秒讀 /lu-state；內容沒變就不動 DOM（只改數字與寬度，節點固定）。畫面上永遠沒有編號或名字。
(function () {
  const SHORT_URL = "（短網址課前填）";   // 課前改成真正的短網址
  const VOTE_OF = { open: ["open.self", "open.agent"], end: ["end.vote", "end.self"] };   // s1 沒有投票；s3.guess 是猜題不是投票，不畫
  const PILLS = [["A", "寫手"], ["B", "審查員"], ["C", "格式員"]];

  // ── 只在值真的變了才寫 DOM（第二次 render 同樣資料 ＝ 零次寫入）──
  function h(tag, cn, text) { const e = document.createElement(tag); if (cn) { e.className = cn; e._c = cn; } if (text != null) { e.textContent = text; e._t = String(text); } return e; }
  function put(el, text) { text = String(text); if (el._t !== text) { el._t = text; el.textContent = text; } }
  function cls(el, c) { if (el._c !== c) { el._c = c; el.className = c; } }
  function sty(el, prop, v) { el._s = el._s || {}; if (el._s[prop] !== v) { el._s[prop] = v; el.style[prop] = v; } }
  function hide(el, yes) { if (el._h !== !!yes) { el._h = !!yes; el.hidden = !!yes; } }
  const isObj = x => !!x && typeof x === "object" && !Array.isArray(x);
  const num = (o, k) => Number((o && o[k]) || 0);
  const max1 = (...xs) => Math.max(1, ...xs);

  function barRow(label) {
    const row = h("div", "bar-row"), l = h("span", "bl", label), b = h("span", "bb"), i = h("i"), n = h("span", "bn", "0");
    b.append(i); row.append(l, b, n); row._l = l; row._i = i; row._n = n; return row;
  }
  function setBar(row, n, total) { sty(row._i, "width", (n / total * 100) + "%"); put(row._n, n); }

  function build(root) {
    const R = { lvCols: [] };
    // 上排
    const top = h("header", "top");
    R.stage = h("div", "t-stage", "　"); R.players = h("div", "t-players", "全班 0 人"); R.conn = h("div", "t-conn", "連線中"); R.notice = h("div", "t-notice", ""); R.notice.hidden = true; R.notice._h = true;
    const tr = h("div", "t-right"); tr.append(R.players, R.conn); top.append(R.stage, R.notice, tr);
    // 左大塊
    const main = h("main", "main"), left = h("div", "left");
    R.levels = h("section", "panel levels");
    const cols = h("div", "lv-cols");
    LU.LEVELS.forEach(L => {
      const demo = L.lv >= 5, col = h("div", "lv-col " + (demo ? "demo" : "today"));
      const av = h("img", "av"); av.src = "img/avatar-lv" + L.lv + ".png"; av.alt = ""; av.width = 72; av.height = 72;
      const track = h("div", "lv-track"), fill = h("i", "lv-fill"); track.append(fill);
      const n = h("div", "lv-n", demo ? "示範" : "0 人");
      col.append(av, h("div", "lv-no", "Lv." + L.lv), h("div", "lv-name", L.name), track, n);
      col._fill = fill; col._n = n; R.lvCols.push(col); cols.append(col);
    });
    const total = h("div", "lv-total");
    R.lvSegs = [1, 2, 3, 4].map(lv => { const s = h("span", "seg", "Lv." + lv); total.append(s); return s; });
    R.levels.append(cols, total);

    R.votes = h("section", "panel votes");
    R.boxes = [0, 1].map(() => {
      const b = h("div", "vote-box"), t = h("h3", "", "　"), bars = h("div", "bars");
      b.append(t, bars); b._hd = t; b._bars = bars; b._rows = {}; R.votes.append(b); return b;
    });
    R.cmp = h("div", "vote-box cmp"); R.cmpH = h("h3", "", "開場 vs 收尾"); R.cmpSub = h("div", "cmp-sub", "　");
    R.cmpBars = h("div", "bars"); R.cmpRows = {};
    const lg = h("div", "cmp-legend"); lg.append(h("span", "k0", "開場"), h("span", "k1", "收尾"));
    R.cmp.append(R.cmpH, lg, R.cmpSub, R.cmpBars); R.votes.append(R.cmp);

    R.relay = h("section", "panel relay");
    R.relayHead = h("h3", "", "三人接力：抓出資料裡的 3 個錯");
    R.relayList = h("div", "relay-list"); R.relayRows = {}; R.relayKeys = "";
    R.relayEmpty = h("div", "relay-empty", "還沒有小組開始接力");
    R.relay.append(R.relayHead, R.relayList, R.relayEmpty);
    left.append(R.levels, R.votes, R.relay);

    // 右欄：成就牆
    const ach = h("aside", "ach"); ach.append(h("h3", "", "全班成就牆"), h("div", "ach-sub", "不列名字"));
    const list = h("div", "ach-list"); R.ach = {};
    LU.ACH.forEach(a => { const r = barRow(a.name); R.ach[a.id] = r; list.append(r); });
    ach.append(list);
    main.append(left, ach);

    // 底列
    const bot = h("footer", "bottom"), url = h("div", "b-url"), code = h("div", "b-code");
    url.append(h("span", "b-k", "課堂入口"), h("span", "b-v", SHORT_URL));
    code.append(h("span", "b-k", "場次碼"), h("span", "b-v", String((window.LU_CFG && window.LU_CFG.session) || "")));
    R.reset = h("button", "reset", "新的一堂課"); R.reset.type = "button";
    bot.append(url, code, R.reset);
    root.append(top, main, bot);
    return R;
  }

  function renderLevels(R, c) {
    const lv = c.levels || {}, mx = max1(...[1, 2, 3, 4].map(k => num(lv, k)));
    [1, 2, 3, 4].forEach(k => {
      const col = R.lvCols[k - 1], n = num(lv, k);
      sty(col._fill, "height", (n / mx * 100) + "%"); put(col._n, n + " 人");
      sty(R.lvSegs[k - 1], "flexGrow", String(n)); cls(R.lvSegs[k - 1], n ? "seg" : "seg zero");
    });
  }
  function fillBars(box, el, tally, opts) {   // opts: [[key,label]]，照選項順序，不照票數排
    const total = max1(...opts.map(([k]) => num(tally, k)));
    opts.forEach(([k, l]) => {
      let row = box._rows[k];
      if (!row) { row = barRow(l); box._rows[k] = row; el.append(row); }
      put(row._l, l); setBar(row, num(tally, k), total);
    });
  }
  const voteBlock = id => STAGES.flatMap(s => s.blocks).find(b => b.id === id);
  function renderVotes(R, c, s) {
    const ids = VOTE_OF[s.id] || [];
    ids.forEach((id, i) => {
      const box = R.boxes[i], b = voteBlock(id);
      if (box._sid !== id) { box._sid = id; box._rows = {}; box._bars.replaceChildren(); }   // 換成別題：舊的列整批丟掉，不然兩題的長條疊在一起
      hide(box, false); put(box._hd, b.q);
      fillBars(box, box._bars, (c.votes || {})[id], b.options.map(o => [o.key, o.label]));
    });
    for (let i = ids.length; i < R.boxes.length; i++) hide(R.boxes[i], true);
    const showCmp = s.id === "end"; hide(R.cmp, !showCmp);
    cls(R.votes, "panel votes v-" + s.id);
    if (!showCmp) return;
    const b = voteBlock("end.self"), s0 = c.self0 || {}, s1 = c.self1 || {};
    const mx = max1(...b.options.map(o => Math.max(num(s0, o.key), num(s1, o.key))));
    put(R.cmpH, "開場 vs 收尾：你用 AI 做到哪一種");
    b.options.forEach(o => {
      let row = R.cmpRows[o.key];
      if (!row) {
        row = h("div", "cmp-row"); const l = h("span", "bl", o.label), t = h("span", "cmp-tracks");
        const a = h("span", "bb k0"), ai = h("i"), z = h("span", "bb k1"), zi = h("i"), an = h("span", "bn", "0"), zn = h("span", "bn", "0");
        a.append(ai); z.append(zi);
        const r0 = h("span", "cmp-r"), r1 = h("span", "cmp-r"); r0.append(a, an); r1.append(z, zn); t.append(r0, r1);
        row.append(l, t); row._a = ai; row._an = an; row._z = zi; row._zn = zn; R.cmpRows[o.key] = row; R.cmpBars.append(row);
      }
      sty(row._a, "width", (num(s0, o.key) / mx * 100) + "%"); put(row._an, num(s0, o.key));
      sty(row._z, "width", (num(s1, o.key) / mx * 100) + "%"); put(row._zn, num(s1, o.key));
    });
    const avg = m => { let n = 0, sum = 0; Object.keys(m).forEach(k => { n += num(m, k); sum += num(m, k) * Number(k); }); return n ? sum / n : 0; };
    const a0 = avg(s0), a1 = avg(s1);
    put(R.cmpSub, a0 && a1 ? `開場平均 ${a0.toFixed(1)} 級 → 收尾平均 ${a1.toFixed(1)} 級` : "等大家填完就會出現");
  }
  const codeOrder = (a, b) => String(a).localeCompare(String(b), "zh-Hant", { numeric: true });   // 固定照組別排，絕不照進度（照進度排＝變相排名）
  function renderRelay(R, c) {
    const relay = isObj(c.relay) ? c.relay : {}, keys = Object.keys(relay).sort(codeOrder), sig = keys.join("|");
    if (sig !== R.relayKeys) {   // 組別名單變了才重排節點（罕見）
      R.relayKeys = sig; R.relayRows = {};
      R.relayList.replaceChildren(...keys.map(g => {
        const row = h("div", "relay-row"), name = h("span", "r-name", "第 " + g + " 組"), pills = h("span", "r-pills");
        row._p = PILLS.map(([k, l]) => { const p = h("span", "pill", "○ " + l); pills.append(p); return p; });
        row.append(name, pills); R.relayRows[g] = row; return row;
      }));
    }
    cls(R.relayList, "relay-list" + (keys.length > 20 ? " c3" : keys.length > 8 ? " c2" : ""));
    hide(R.relayEmpty, keys.length > 0);
    keys.forEach(g => PILLS.forEach(([k, l], i) => {
      const done = !!(relay[g] || {})[k], p = R.relayRows[g]._p[i];
      cls(p, done ? "pill done" : "pill"); put(p, (done ? "✓ " : "○ ") + l);
    }));
  }
  function renderAch(R, c) {
    const total = max1(num(c, "players"), ...LU.ACH.map(a => num(c.ach, a.id)));
    LU.ACH.forEach(a => setBar(R.ach[a.id], num(c.ach, a.id), total));
  }
  // 把整份資料畫上去。idx＝目前關卡（STAGES 的位置）。可以重複呼叫：資料一樣就一次寫入都沒有
  function render(R, c, idx) {
    const s = STAGES[idx];
    put(R.stage, `${s.title}｜${s.time}`);
    put(R.players, `全班 ${num(c, "players")} 人`);
    const mode = s.id === "s5" ? "relay" : VOTE_OF[s.id] ? "votes" : "levels";
    hide(R.levels, mode !== "levels"); hide(R.votes, mode !== "votes"); hide(R.relay, mode !== "relay");
    if (mode === "levels") renderLevels(R, c);
    if (mode === "votes") renderVotes(R, c, s);
    if (mode === "relay") renderRelay(R, c);
    renderAch(R, c);
  }

  window.SCREEN = { build, render, SHORT_URL };

  // 伺服器回的東西不可信：只要是物件就當資料，缺的欄位補空；null／非物件才算失敗
  const EMPTY = { players: 0, levels: {}, ach: {}, votes: {}, relay: {}, self0: {}, self1: {} };
  function normalize(c) {
    if (!isObj(c)) return null;
    const o = Object.assign({}, c);
    ["levels", "ach", "votes", "relay", "self0", "self1"].forEach(k => { if (!isObj(o[k])) o[k] = {}; });
    o.players = Number(o.players) || 0;
    return o;
  }
  // 控制器：輪詢＋切關。deps 可換（測試用）
  function controller(R, deps) {
    const api = deps.api, later = deps.setTimeout, IDS = STAGES.map(s => s.id), now = deps.now || Date.now;
    let idx = 0, data = EMPTY, last = "", fails = 0, holdUntil = 0, want = "", sending = false;
    function paint() { const sig = JSON.stringify(data) + "#" + idx; if (sig === last) return; last = sig; render(R, data, idx); }
    async function tick() {
      try {
        const c = normalize(await api.state());
        if (c) {
          fails = 0; put(R.conn, "連線中"); data = c;
          const si = IDS.indexOf(c.stage);
          if (si >= 0 && now() > holdUntil) idx = si;   // 講師剛按過鍵的幾秒內，不讓舊的伺服器狀態把畫面拉回去
          paint();
        } else if (++fails >= 2) put(R.conn, "連不到伺服器（學員照樣能闖關）");
      } catch (e) { last = ""; put(R.conn, "畫面更新出錯，下一輪再試"); }
      finally { later(tick, 3000 * (0.85 + (deps.rand ? deps.rand() : Math.random()) * 0.3)); }   // 不管發生什麼事，下一輪一定排
    }
    async function go(i) {
      i = Math.max(0, Math.min(IDS.length - 1, i)); if (i === idx) return;
      idx = i; holdUntil = now() + 6000; paint();   // 先換畫面，再通知伺服器
      want = IDS[idx]; if (sending) return;
      sending = true;   // 一次只送一個、送完再看有沒有更新的：連按鍵時伺服器不會收到亂序的請求
      try {
        while (want) {
          const w = want; want = "";
          const r = await api.setStage(w);
          put(R.notice, r ? "" : "切關沒送出，再按一次"); hide(R.notice, !!r);
          holdUntil = now() + 6000;
        }
      } finally { sending = false; }
    }
    async function reset(ask) {
      if (!ask()) return;
      const r = await api.reset();
      put(R.conn, r ? "已清空，新的一堂課開始" : "沒清成功，再按一次");
      if (r) { data = EMPTY; idx = 0; holdUntil = 0; last = ""; put(R.notice, ""); hide(R.notice, true); paint(); }
    }
    function key(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "ArrowRight") go(idx + 1);
      else if (e.key === "ArrowLeft") go(idx - 1);
      else if (/^[1-9]$/.test(e.key)) go(Number(e.key) - 1);
    }
    return { tick, go, key, reset, paint, idx: () => idx };
  }

  window.SCREEN = { build, render, controller, normalize, SHORT_URL };

  // ?mock=1：用固定假資料看版面，不碰伺服器（setStage／reset 也不會送出）
  function mockApi() {
    const relay = {}; for (let n = 1; n <= 14; n++) relay[n] = { A: n % 2 === 0, B: n % 3 === 0, C: n % 5 === 0 }; for (let n = 1; n <= 6; n++) relay["線上" + n] = { A: true, B: n % 2 === 0, C: false };
    const votes = { "open.self": { A: 20, B: 14, C: 9, D: 6, E: 3, F: 1, G: 1 }, "open.agent": { goal: 30, tool: 22, steps: 12, start: 3 }, "end.vote": { goal: 25, tool: 20, steps: 10, start: 4 }, "end.self": { 1: 1, 2: 5, 3: 12, 4: 20, 5: 8, 6: 3, 7: 1 } };
    const d = { players: 50, levels: { 1: 8, 2: 9, 3: 13, 4: 20 }, ach: { grilled: 40, reviewer: 33, lv4: 20, caught3: 24, team: 18, plan: 5 }, votes, relay, self0: { 1: 20, 2: 15, 3: 8, 4: 4, 5: 2, 6: 1 }, self1: { 3: 10, 4: 25, 5: 10, 6: 4, 7: 1 } };
    return { state: async () => d, setStage: async () => ({ ok: true }), reset: async () => ({ ok: true }) };
  }
  function boot() {
    const R = build(document.getElementById("screen"));
    const mock = /(^|[?&])mock=1(&|$)/.test(location.search);
    const ctl = controller(R, { api: mock ? mockApi() : window.API, setTimeout: (f, ms) => setTimeout(f, ms) });
    addEventListener("keydown", ctl.key);
    R.reset.addEventListener("click", async () => {
      await ctl.reset(() => confirm("確定清空這個場次？所有人的編號、投票、接力都會歸零（學員頁會自動重新報到）"));
      R.reset.blur();   // 用完就放開焦點：方向鍵與空白鍵不會誤觸它
    });
    R.reset.tabIndex = -1;
    ctl.paint(); ctl.tick();
  }
  if (!window.LU_SCREEN_TEST) boot();
})();

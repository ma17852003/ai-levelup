// 《AI 升級之路》網路層：送出佇列＋入座＋輪詢。LU_CFG = { api, session } 由 index.html / screen.html 先設好
(function () {
  const cfg = () => window.LU_CFG;
  const stale = new Set();
  const mem = new Map();   // localStorage 被擋（無痕／封鎖）時的備援，頁面開著期間照常運作
  const store = {
    get(k, d) {
      if (mem.has(k)) return JSON.parse(mem.get(k));   // 這一頁內以記憶體為準（localStorage 可能寫不進去）
      try { const v = localStorage.getItem(k); if (v) return JSON.parse(v); } catch (e) { /* 讀不到就用預設 */ }
      return d;
    },
    // 讀最新：先看 localStorage（別的分頁剛寫的也看得到），讀不到才用本頁記憶體
    fresh(k, d) {
      if (!stale.has(k)) { try { const v = localStorage.getItem(k); if (v) return JSON.parse(v); } catch (e) { /* 被擋或壞掉就退回記憶體 */ } }
      if (mem.has(k)) return JSON.parse(mem.get(k));
      return d;
    },
    set(k, v) { const t = JSON.stringify(v); mem.set(k, t); try { localStorage.setItem(k, t); stale.delete(k); } catch (e) { stale.add(k); } },   // 寫不進去（容量滿）的 key，改以本頁記憶體為準
    persistent() { try { localStorage.setItem("lu-probe", "1"); localStorage.removeItem("lu-probe"); return true; } catch (e) { return false; } }
  };
  const qKey = () => "lu-q-" + cfg().session;
  let cid = "";
  function deviceId() {
    if (!cid) cid = store.get("lu-cid", "");
    if (!cid) { cid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); store.set("lu-cid", cid); }
    return cid;
  }
  // 回 { j, responded }：responded = 伺服器真的有回話（斷線／逾時是 false）
  async function send(path, fields, ms) {
    try {
      const ctrl = new AbortController(), tid = setTimeout(() => ctrl.abort(), ms || 15000);
      const r = await fetch(cfg().api + path, { method: "POST", body: new URLSearchParams(fields), signal: ctrl.signal });
      const j = await r.json().catch(() => null); clearTimeout(tid);   // clearTimeout 放在讀完內容之後（迎賓台教訓）
      return { j: j && j.ok === true ? j : null, responded: true };
    } catch (e) { return { j: null, responded: false }; }
  }
  const post = async (path, fields, ms) => (await send(path, fields, ms)).j;
  async function get(path, ms) {
    try {
      const ctrl = new AbortController(), tid = setTimeout(() => ctrl.abort(), ms || 12000);
      const r = await fetch(cfg().api + path, { signal: ctrl.signal, cache: "no-store" });
      const j = await r.json().catch(() => null); clearTimeout(tid);
      return j;
    } catch (e) { return null; }
  }
  function queue() { return store.fresh(qKey(), []); }   // 每次讀最新：兩個分頁各自排的，都在同一份佇列裡，依 qid 不會互相蓋掉
  let seq = 0;
  function enqueue(item) {
    let q = queue();
    if (item.kind === "snap") q = q.filter(x => x.kind !== "snap");
    q.push(Object.assign({ team: "", key: "", value: "" }, item, { qid: Date.now() + "-" + (seq++) + "-" + Math.random().toString(36).slice(2, 6) }));
    store.set(qKey(), q);
  }
  const MAX_TRIES = 8;
  // 跨分頁鎖：兩個分頁共用同一份佇列時，只准一個在送，不然隊首那筆會被兩邊各送一次。拿不到鎖＝另一頁正在送，這一輪跳過
  const LOCK_MS = 20000, ME = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const lsKey = () => "lu-flushlock-" + cfg().session;
  let usingLs = false;
  const lsRead = () => { try { return JSON.parse(localStorage.getItem(lsKey()) || "null"); } catch (e) { return null; } };
  const lsTouch = () => { try { localStorage.setItem(lsKey(), JSON.stringify({ owner: ME, exp: Date.now() + LOCK_MS })); } catch (e) {} };
  async function withFlushLock(fn) {
    const nav = typeof navigator !== "undefined" ? navigator : null;
    if (nav && nav.locks && nav.locks.request) return nav.locks.request("lu-flush-" + cfg().session, { ifAvailable: true }, lock => (lock ? fn() : undefined));
    const l = lsRead();
    if (l && l.owner !== ME && l.exp > Date.now()) return;   // 別頁持有且沒過期
    try { localStorage.setItem(lsKey(), JSON.stringify({ owner: ME, exp: Date.now() + LOCK_MS })); } catch (e) { return fn(); }   // 連鎖都寫不進去＝這台存不了檔，沒有跨分頁問題，照送
    const back = lsRead(); if (back && back.owner !== ME) return;   // 同時搶，被別頁搶走（讀不回來＝這台存不住，照送）
    usingLs = true;
    try { return await fn(); } finally { usingLs = false; const c = lsRead(); if (c && c.owner === ME) { try { localStorage.removeItem(lsKey()); } catch (e) {} } }
  }
  let flushing = null;
  function flush() {
    if (flushing) return flushing;   // 進行中：它會一路送到佇列清空，後來排進來的也一起
    const body = async () => {
      {
        let budget = queue().length + 50;   // 一次 flush 最多送這麼多次，絕不空轉
        while (budget-- > 0) {
          const item = queue()[0];
          if (!item) break;
          if (usingLs) lsTouch();   // 送很多筆時續約，鎖不會中途過期
          const r = await send("/lu-ev", { session: cfg().session, cid: deviceId(), kind: item.kind, team: item.team, key: item.key, value: item.value });
          if (r.j) { store.set(qKey(), queue().filter(x => x.qid !== item.qid)); continue; }
          if (!r.responded) break;   // 斷線：留著，下次再送
          const tries = (item.tries || 0) + 1;   // 伺服器有回卻不收：累計，滿 8 次丟掉免得卡死後面
          if (tries >= MAX_TRIES) { store.set(qKey(), queue().filter(x => x.qid !== item.qid)); continue; }
          store.set(qKey(), queue().map(x => x.qid === item.qid ? Object.assign({}, x, { tries }) : x));
          break;
        }
      }
    };
    const run = () => withFlushLock(body);
    // 用 .finally 重設：它一定在 flushing 指派之後才跑（佇列是空的時候 run 會同步跑完，不能在裡面重設）
    flushing = run().finally(() => { flushing = null; });
    return flushing;
  }
  const pending = () => queue().length;
  async function join(team) {
    const j = await post("/lu-join", { session: cfg().session, cid: deviceId(), team: String(team) }, 20000);
    return j && j.player >= 1 ? { player: j.player, resetId: j.resetId } : null;
  }
  const ping = group => get("/lu-ping?session=" + encodeURIComponent(cfg().session) + (group ? "&group=" + encodeURIComponent(group) : ""));
  const state = () => get("/lu-state?session=" + encodeURIComponent(cfg().session));
  const setStage = stage => post("/lu-stage", { session: cfg().session, stage });
  const reset = () => post("/lu-reset", { session: cfg().session, confirm: "yes" }, 15000);
  window.API = { store, deviceId, enqueue, flush, pending, queue, join, ping, state, setStage, reset };
})();

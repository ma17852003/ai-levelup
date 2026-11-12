// 《AI 升級之路》學員頁、投影幕、n8n 共用的純函式（不碰 DOM、不碰網路）
(function () {
  const LEVELS = [
    { lv: 1, name: "路人", desc: "有問必答" }, { lv: 2, name: "臨時工", desc: "會交代任務" },
    { lv: 3, name: "助理", desc: "打開就知道自己是誰" }, { lv: 4, name: "專員", desc: "考過試、同事能用" },
    { lv: 5, name: "工匠", desc: "做出能點的小工具" }, { lv: 6, name: "正職員工", desc: "自己會上班" },
    { lv: 7, name: "部門主管", desc: "帶一整個 AI 部門" }
  ];
  // 任務：lv＝算在「升到第幾級」那一組；0＝不算經驗值（只拿成就）。每組加總 100（有測試）
  const TASKS = [
    { id: "s0.first", lv: 2, xp: 10 }, { id: "open.self", lv: 2, xp: 10 }, { id: "open.agent", lv: 2, xp: 10 },
    { id: "s1.guess", lv: 2, xp: 10 }, { id: "s1.copy", lv: 2, xp: 10 }, { id: "s1.brief", lv: 2, xp: 50 },
    { id: "s1.instr", lv: 3, xp: 20 }, { id: "s2.sort", lv: 3, xp: 20 }, { id: "s2.gem", lv: 3, xp: 40 },
    { id: "s2.reviewer", lv: 3, xp: 10 }, { id: "s2.call", lv: 3, xp: 10 },
    { id: "s3.guess", lv: 4, xp: 10 }, { id: "s3.toc", lv: 4, xp: 20 }, { id: "s4.break", lv: 4, xp: 10 },
    { id: "s4.light", lv: 4, xp: 10 }, { id: "s4.write", lv: 4, xp: 20 }, { id: "s4.pass", lv: 4, xp: 30 },
    { id: "s5.relay", lv: 0, xp: 0 }, { id: "s5.caught", lv: 0, xp: 0 }, { id: "s5.team", lv: 0, xp: 0 }, { id: "s5.card", lv: 0, xp: 0 },
    { id: "s6.demo", lv: 0, xp: 0 }, { id: "end.self", lv: 0, xp: 0 }, { id: "end.vote", lv: 0, xp: 0 }, { id: "end.plan", lv: 0, xp: 0 }
  ];
  const MILESTONES = [
    { lv: 2, ok: st => !!st.done["s1.brief"] },
    { lv: 3, ok: st => !!st.done["s2.gem"] },
    { lv: 4, ok: st => (st.pass || 0) >= 4 }
  ];
  const ACH = [
    { id: "grilled", name: "被拷問到底", ok: st => !!st.done["s1.brief"] },
    { id: "reviewer", name: "審查員上線", ok: st => !!st.done["s2.reviewer"] },
    { id: "lv4", name: "考過 Lv.4", ok: st => (st.pass || 0) >= 4 },
    { id: "caught3", name: "抓到 3 個錯", ok: st => (st.caught || 0) >= 3 },
    { id: "team", name: "小隊成軍", ok: st => !!st.done["s5.team"] },
    { id: "plan", name: "三週計畫寫好", ok: st => !!st.done["end.plan"] }
  ];
  function markDone(st, id, extra) {
    return Object.assign({}, st, extra || {}, { done: Object.assign({}, st.done, { [id]: true }) });
  }
  // 一關一關升，不能跳級：Lv.2 要需求單；Lv.3 要先到 Lv.2 再建好 Gem；Lv.4 要先到 Lv.3 再過 4 題
  function level(st) { let lv = 1; for (const m of MILESTONES) { if (m.ok(st)) lv = m.lv; else break; } return lv; }
  function progress(st) {
    const lv = level(st);
    if (lv >= 4) return { lv, next: null, ratio: 1 };
    const next = lv + 1, group = TASKS.filter(x => x.lv === next);
    const got = group.filter(x => st.done[x.id]).reduce((s, x) => s + x.xp, 0);
    return { lv, next, ratio: got / group.reduce((s, x) => s + x.xp, 0) };
  }
  // 20 格：無條件捨去，只有真的 100% 才亮滿
  function segments(ratio) { return ratio >= 1 ? 20 : Math.floor(ratio * 20); }
  function levelUp(before, after) { const a = level(before), b = level(after); return b > a ? b : 0; }
  function achievements(st) { return ACH.filter(a => a.ok(st)).map(a => a.id); }
  // ── 以下函式會被 tools/create_wf.py 原樣嵌進 n8n（單一來源），只准用純 JS ──
  function lastReset(rows) { return rows.filter(r => r.Kind === "reset").reduce((m, r) => Math.max(m, Number(r.Id)), 0); }
  // 這一輪的人：同一台電腦（Cid）只算一個人、用第一次入座的順序排號；桌號用最新那列
  function roster(rows) {
    const from = lastReset(rows), people = [], byCid = Object.create(null);
    rows.filter(r => r.Kind === "join" && Number(r.Id) > from).sort((a, b) => a.Id - b.Id).forEach(r => {
      if (!r.Cid) return;
      if (byCid[r.Cid]) { byCid[r.Cid].team = String(r.Team); return; }
      const p = { no: people.length + 1, cid: r.Cid, team: String(r.Team) };
      byCid[r.Cid] = p; people.push(p);
    });
    return people;
  }
  function numberOf(rows, cid) { const p = roster(rows).find(x => x.cid === cid); return p ? p.no : 0; }
  function relayFor(rows, group) {
    const from = lastReset(rows), out = {};
    rows.filter(r => r.Kind === "relay" && Number(r.Id) > from && String(r.Team) === String(group)).sort((a, b) => a.Id - b.Id)
      .forEach(r => { out[r.Key] = r.Value; });
    return out;
  }
  function foldClass(rows) {
    const resetId = lastReset(rows), live = rows.filter(r => Number(r.Id) > resetId).sort((a, b) => a.Id - b.Id);
    const people = roster(rows), inClass = Object.create(null); people.forEach(p => { inClass[p.cid] = true; });
    const snaps = Object.create(null), votesBy = Object.create(null), relay = Object.create(null); let stage = "";
    live.forEach(r => {
      if (r.Kind === "snap") { try { snaps[r.Cid] = JSON.parse(r.Value); } catch (e) { /* 壞掉的快照當沒收到 */ } }
      else if (r.Kind === "vote") { (votesBy[r.Key] = votesBy[r.Key] || Object.create(null))[r.Cid] = String(r.Value); }
      else if (r.Kind === "relay") { (relay[r.Team] = relay[r.Team] || { A: false, B: false, C: false })[r.Key] = String(r.Value).trim() !== ""; }
      else if (r.Kind === "stage") stage = String(r.Value);
    });
    const levels = { 1: 0, 2: 0, 3: 0, 4: 0 }, ach = Object.create(null), self0 = Object.create(null), self1 = Object.create(null);
    people.forEach(p => {
      const s = snaps[p.cid] || {};
      const lv = Math.min(4, Math.max(1, Math.floor(Number(s.lv)) || 1)); levels[lv]++;
      (Array.isArray(s.ach) ? s.ach : []).forEach(a => { ach[a] = (ach[a] || 0) + 1; });
      if (s.self0) self0[s.self0] = (self0[s.self0] || 0) + 1;
      if (s.self1) self1[s.self1] = (self1[s.self1] || 0) + 1;
    });
    const votes = {};
    Object.keys(votesBy).forEach(k => {
      const tally = Object.create(null);
      Object.keys(votesBy[k]).filter(cid => inClass[cid]).forEach(cid => votesBy[k][cid].split(",").filter(Boolean).forEach(o => { tally[o] = (tally[o] || 0) + 1; }));
      votes[k] = tally;
    });
    return { resetId, stage, players: people.length, levels, ach, self0, self1, votes, relay };
  }
  window.LU = { LEVELS, TASKS, ACH, markDone, level, progress, segments, levelUp, achievements, roster, numberOf, relayFor, foldClass };
})();

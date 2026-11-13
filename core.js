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
    { id: "lv4", name: "考試答對 4 題", ok: st => (st.pass || 0) >= 4 },
    { id: "caught3", name: "抓到 3 個錯", ok: st => (st.caught || 0) >= 3 },
    { id: "team", name: "小隊成軍", ok: st => !!st.done["s5.team"] },
    { id: "plan", name: "三週計畫寫好", ok: st => !!st.done["end.plan"] }
  ];
  // at＝交件時間（毫秒）：只記第一次，重交不改（手速、偷跑、壓線都看第一次）
  function markDone(st, id, extra, at) {
    const out = Object.assign({}, st, extra || {}, { done: Object.assign({}, st.done, { [id]: true }) });
    if (typeof at === "number" && !(st.doneAt || {})[id]) out.doneAt = Object.assign({}, st.doneAt, { [id]: at });
    return out;
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
  // ── 結業稱號＋積分（14_稱號積分規格.md）：純函式，只看 st（時間只用存下來的時間戳；不准 Date.now／Math.random）──
  const STAGE_ORDER = ["s0", "open", "s1", "s2", "s3", "s4", "s5", "s6", "end"];   // 跟 stages.js 同順序（有測試）；任務 id 點前面＝關卡
  const GUESS = { "s1.guess": "B", "s3.guess": "B" };                                // 規格的「兩題先猜」＋正確答案（有測試對 stages.js）
  const COPY_CARDS = ["grill", "toInstr", "reviewer", "tocExample", "traps"];         // 「所有複製鈕」＝這 5 張紙卡（接力的角色指令每人不同，不算）
  const chars = s => Array.from(String(s == null ? "" : s).replace(/\s/g, "")).length;   // 字數：不算空白換行
  // 講師切關時間軸 [[時間, 關卡], …]：聯集、照時間排、同一關連續兩筆只留最早（兩個分頁各自輪詢到的會重疊）
  function mergeLog(a, b) {
    const all = [].concat(Array.isArray(a) ? a : [], Array.isArray(b) ? b : []).filter(e => Array.isArray(e) && typeof e[0] === "number" && STAGE_ORDER.includes(e[1]))
      .sort((x, y) => x[0] - y[0] || STAGE_ORDER.indexOf(x[1]) - STAGE_ORDER.indexOf(y[1]));
    const out = []; all.forEach(e => { if (!out.length || out[out.length - 1][1] !== e[1]) out.push([e[0], e[1]]); });
    return out;
  }
  function facts(st) {
    const done = st.done || {}, sheet = st.sheet || {}, picks = st.picks || {}, at = st.doneAt || {}, old = st.stageSeenAt || {};
    const log = mergeLog(st.stageLog, Object.keys(old).map(k => [old[k], k]));   // 舊存檔只有「每關第一次看到」也照算
    const sidx = s => STAGE_ORDER.indexOf(s);
    const curAt = t => { let c = null; log.forEach(e => { if (e[0] <= t) c = e[1]; }); return c; };   // 那時講師在哪＝之前最後看到的那關
    const startOf = (sid, t) => { let b = null, a = null; log.forEach(e => { if (e[1] !== sid) return; if (e[0] <= t) b = e[0]; else if (a === null) a = e[0]; }); return b !== null ? b : a; };   // 之前最近一次切到這關；之前沒有就用之後第一次
    let fast = 0, early = 0, late = 0; const delays = [];
    TASKS.forEach(x => {
      const t = at[x.id]; if (!done[x.id] || typeof t !== "number") return;
      const sid = x.id.split(".")[0], s0 = startOf(sid, t);
      if (s0 === null) return;                      // 這台電腦整關沒看到（中途入座／輪詢沒到）：不算偷跑、不放中位數
      if (s0 - t > 20000) { early++; return; }      // 偷跑：看到這關比交件晚 20 秒以上（輪詢延遲不算）；不放中位數
      const d = Math.max(0, t - s0); delays.push(d);
      if (d <= 120000) fast++;                      // 切到這關後 2 分鐘內＝手速（不管講師當下是不是已經切走）
      else if (sidx(curAt(t)) > sidx(sid)) late++;  // 超過 2 分鐘、而且講師已經在後面的關＝壓線
    });
    delays.sort((a, b) => a - b);
    const n = delays.length, median = n ? (n % 2 ? delays[(n - 1) / 2] : (delays[n / 2 - 1] + delays[n / 2]) / 2) : null;
    const first = log.length ? log[0][1] : null, seen = {}; if (first) seen[first] = log[0][0];
    const g = id => (Array.isArray(picks[id]) ? picks[id] : []);
    const plan = sheet.plan || {}, card = sheet.card || {}, vn = st.voteN || {}, sn = st.sortN || {}, copied = st.copied || {};
    return {
      done, lv: level(st), nDone: TASKS.filter(x => done[x.id]).length, all: TASKS.every(x => done[x.id]),
      pass: Math.max(0, Math.min(5, Number(st.pass) || 0)), caught: Math.max(0, Math.min(3, Number(st.caught) || 0)),
      brief: chars(sheet.brief), first: chars(sheet.first), self0: Number(st.self0) || 0, self1: Number(st.self1) || 0,
      guessOk: Object.keys(GUESS).filter(id => g(id)[0] === GUESS[id]).length, guessed: Object.keys(GUESS).filter(id => g(id).length).length,
      agent: done["open.agent"] && Array.isArray(picks["open.agent"]) ? picks["open.agent"].length : -1,
      resend: Math.max(0, ...Object.keys(vn).map(k => (Number(vn[k]) || 0) - 1)),
      fast, early, late, median, ask: Number(st.askN) || 0,
      lateSeat: !!(st.seatedAt && first && sidx(first) > sidx("open") && Math.abs(seen[first] - st.seatedAt) <= 60000),   // 入座時講師已經在開場之後
      copiedAll: COPY_CARDS.every(k => copied[k]), manual: !!st.manualCopy, sortN: k => Number(sn[k]) || 0,
      role: done["s5.relay"] ? st.relayRole : "", acct: st.acct,
      plan3: ["w1", "w2", "w3"].every(k => chars(plan[k]) >= 10), card3: ["gem", "reviewer", "where"].every(k => chars(card[k]) > 0)
    };
  }
  const sec = ms => Math.round(ms / 1000), min = ms => Math.round(ms / 60000);
  // [號碼, 優先序, 稱號, 卡片上那一句（規格書原文，N/M/X/Y 換成學員的數字）, 條件, 數字]；排列順序＝規格書表格順序（同層照座號挑、也符合都照這個順序）
  const TITLE_ROWS = [
    [1, 1, "無情提示詞高手", "需求單寫了 N 字、考試過 M 題，AI 被你問到不敢亂講", f => f.done["s1.brief"] && f.brief >= 150 && f.pass >= 4, f => ({ N: f.brief, M: f.pass })],
    [5, 1, "反骨猜題王", "兩題都猜反，你是來幫 AI 增加信心的", f => f.guessed === 2 && f.guessOk === 0],
    [6, 1, "被拷問到懷疑人生", "被 AI 追問到寫出 N 字，比你的教學計畫還長", f => f.done["s1.brief"] && f.brief >= 300, f => ({ N: f.brief })],
    [7, 1, "一句話打天下", "只用 N 個字開場，照樣升到 Lv.X", f => f.done["s0.first"] && f.first <= 6 && f.lv >= 3, f => ({ N: f.first, X: f.lv })],
    [8, 1, "金句製造機", "第一句話就寫了 N 字，AI 還沒開口你先講完了", f => f.done["s0.first"] && f.first >= 40, f => ({ N: f.first })],
    [9, 1, "抓錯雷達維修中", "三個錯都從你眼前溜走，雷達下次記得充電", f => f.done["s5.caught"] && f.caught === 0],   // 畫面不讓送出 0 個，實際上幾乎拿不到
    [11, 1, "補考常客", "過了 N 題，你的 Gem 回家要多讀書", f => f.done["s4.pass"] && f.pass <= 2, f => ({ N: f.pass })],
    [12, 2, "開竅火箭", "開場說自己 Lv.X，收尾變 Lv.Y，兩小時連升 N 級", f => f.self0 && f.self1 && f.self1 - f.self0 >= 3, f => ({ X: f.self0, Y: f.self1, N: f.self1 - f.self0 })],
    [13, 2, "謙虛到地心", "嘴上說自己是路人，手上做到專員", f => f.self0 === 1 && f.lv === 4],
    [14, 2, "自信爆棚", "一開場就說自己 Lv.X，今天是來視察的吧", f => f.self0 >= 5, f => ({ X: f.self0 })],
    [15, 2, "原地踏步哲學家", "開場 Lv.X、收尾 Lv.Y，你對自己很誠實", f => f.self0 && f.self1 && f.self1 <= f.self0, f => ({ X: f.self0, Y: f.self1 })],
    [16, 2, "AI 樂觀主義者", "四件事全選，你對 AI 的信任比對同事還高", f => f.agent === 4],
    [17, 2, "冷靜懷疑論者", "四件事你只認 N 件，AI 要更努力才能說服你", f => f.agent >= 0 && f.agent <= 1, f => ({ N: f.agent })],
    [18, 2, "選擇困難症末期", "同一張票改了 N 次，AI 都替你累了", f => f.resend >= 3, f => ({ N: f.resend })],
    [19, 3, "閃電提示詞俠", "講師一切關，你平均 N 秒就交件", f => f.median !== null && f.median <= 60000, f => ({ N: sec(f.median) })],
    [20, 3, "偷跑王", "講師還在講，你已經先做完 N 件", f => f.early >= 3, f => ({ N: f.early })],
    [21, 3, "慢工出細活宗師", "平均 N 分鐘交件，但交出來的都過關", f => f.median !== null && f.median >= 240000 && f.pass >= 4, f => ({ N: min(f.median) })],
    [22, 3, "壓線藝術家", "有 N 件是在下一關才補交，人生就是要刺激", f => f.late >= 3, f => ({ N: f.late })],
    [23, 3, "遲到但沒缺席", "晚到一步，還是一路升到 Lv.X", f => f.lateSeat, f => ({ X: f.lv })],
    [10, 4, "及格就是勝利", "剛好 4 題過關，不多不少，精準", f => f.pass === 4],   // 2026-11-13 修正：優先序 1 → 4（Lv.4 必定考過 ≥4 題）
    [38, 4, "深藏不露掃地僧", "安安靜靜就升到 Lv.4，高手都很低調",   // 2026-11-13 修正：除了考神附體、及格就是勝利，優先序 1～3 都不中
      f => f.lv === 4 && !TITLES.some(x => x.pri >= 1 && x.pri <= 3 && x.id !== "t3" && x.ok(f))],
    [24, 4, "卡關求救專業戶", "問了 Gemini N 次，你很懂得善用資源", f => f.ask >= 3, f => ({ N: f.ask })],
    [25, 4, "獨立自主不求人", "一次都沒求救，自己一路打到 Lv.4", f => f.ask === 0 && f.lv === 4],
    [26, 4, "複製貼上之神", "N 張提示詞卡全部複製，Ctrl+V 是你的本能", f => f.copiedAll, () => ({ N: COPY_CARDS.length })],
    [27, 4, "手動複製苦行僧", "剪貼簿不給力，你就自己選字複製，令人敬佩", f => f.manual],
    [28, 4, "分類強迫症", "分類一次就全對，你家抽屜一定很整齊", f => f.done["s2.sort"] && f.done["s4.light"] && f.sortN("s2.sort") === 1 && f.sortN("s4.light") === 1],
    [29, 4, "紅綠燈交通警察", "試了 N 次才讓每張卡停對位置，交通終於順了", f => f.done["s4.light"] && f.sortN("s4.light") >= 3, f => ({ N: f.sortN("s4.light") })],
    [30, 4, "接力最速寫手", "第一棒就由你開跑，後面的人都靠你", f => f.role === "A"],
    [31, 4, "鐵面審查員", "別人寫的你負責挑毛病，這個工作很適合你", f => f.role === "B"],
    [32, 4, "排版潔癖患者", "最後一棒交給你，表格一定對得整整齊齊", f => f.role === "C"],
    [33, 4, "Skills 魔法師", "打個 @ 就能叫出審查員，魔法師就是你", f => f.acct === "personal" && f.done["s2.reviewer"]],
    [34, 4, "Gem 收藏家", "一個人養了兩個 Gem，下一步是開動物園", f => f.acct === "school" && f.done["s2.gem"] && f.done["s2.reviewer"]],
    [35, 4, "三週計畫通", "三週計畫寫得清清楚楚，校長看了會想抄", f => f.plan3],
    [36, 4, "名片設計師", "你的 AI 小隊已經有名片了，比很多人還正式", f => f.card3],
    [37, 4, "全勤模範生", "25 件任務一件不漏，你是今天的模範生", f => f.all],
    // 常見層（2026-11-13 第二次修正：60 人模擬 25～43% 的人都會中，降到 4.5，也符合排在後面；主稱號怎麼挑見 titles()）
    [2, 4.5, "AI 照妖鏡", "三個錯一個都沒放過，AI 在你面前無所遁形", f => f.caught >= 3],
    [3, 4.5, "考神附體", "五題全過，你的 Gem 比你還會考試", f => f.pass >= 5],
    [4, 4.5, "預言家", "還沒揭曉就知道答案，AI 的套路被你看穿", f => f.guessOk === 2],
    [39, 5, "助理練習生", "你的 AI 已經知道自己是誰了，下一步讓它考試", f => f.lv === 3],
    [40, 5, "臨時工也有春天", "已經會交代任務了，下一步幫它取名字", f => f.lv === 2],
    [41, 5, "路人甲（尚未覺醒）", "今天先來看看，回家打開 Gemini 就會覺醒", f => f.lv === 1],
    [42, 5, "觀光團團長", "你是來視察的，我們懂", f => f.nDone < 3],
    [43, 0, "傳說級 AI 部門主管", "全勤、五題全過、三錯全抓、先猜全對，今天的隱藏魔王", f => f.all && f.pass >= 5 && f.caught >= 3 && f.guessOk === 2],
    [44, 0, "宇宙最速通關者", "25 件任務全做完，平均 N 秒交一件，講師都追不上你", f => f.all && f.median !== null && f.median <= 45000, f => ({ N: sec(f.median) })]
  ];
  const TITLES = TITLE_ROWS.map(([no, pri, name, say, ok, vars]) => ({ id: "t" + no, no, pri, name, say, ok: f => !!ok(f),
    why: f => { const v = vars ? vars(f) : {}; return say.replace(/(^|[^A-Za-z])([NMXY])(?![A-Za-z])/g, (m, p, k) => p + v[k]); } }));
  // 2026-11-13 第四次修正：最高隨機權重（rendezvous hashing）。每個「座號＋稱號」算一個固定的 32 位元號碼，挑最大的；
  // 同一個人後來多符合一個稱號，主稱號只會維持或換成新的那個（座號取餘數會整個換掉）。純整數運算，不用 Math.random／Date.now
  function titleWeight(player, no) {
    let h = 0x811c9dc5;   // FNV-1a，逐位元組吃座號和稱號號碼
    [player, no].forEach(v => { for (let i = 0; i < 4; i++) { h ^= (v >>> (i * 8)) & 255; h = Math.imul(h, 0x01000193); } });
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;   // 再攪一次，分布比較平均
    return h >>> 0;
  }
  function pickTitle(player, ids) {   // ids：候選稱號代號；回權重最大的（同分取號碼小的，實際上幾乎不會同分）
    const p = Math.max(0, Math.floor(Number(player) || 0));
    let best = null, bw = -1, bn = 0;
    ids.forEach(id => { const n = Number(String(id).slice(1)), w = titleWeight(p, n); if (w > bw || (w === bw && n < bn)) { best = id; bw = w; bn = n; } });
    return best;
  }
  // 主稱號：隱藏優先（優先序 0）→ 其餘符合的（優先序 1～4.5）→ 都不中才給墊底（優先序 5）；每一段都用 pickTitle 挑
  function titles(st) {
    const f = facts(st);
    let hit = TITLES.filter(x => x.pri < 5 && x.ok(f));
    if (!hit.length) hit = TITLES.filter(x => x.pri === 5 && x.ok(f));
    // 隱藏（優先序 0）有中就只在隱藏裡挑；否則在全部符合的稱號裡挑（第三次修正）；墊底只在上面都不中時才給
    const pool = hit.some(x => x.pri === 0) ? hit.filter(x => x.pri === 0) : hit;
    const pid = pickTitle(st.player, pool.map(x => x.id)), main = pool.find(x => x.id === pid);
    const also = hit.filter(x => x !== main).sort((a, b) => a.pri - b.pri || TITLES.indexOf(a) - TITLES.indexOf(b)).slice(0, 2);
    return { main: main.id, also: also.map(x => x.id), why: main.why(f) };
  }
  function score(st) {
    const f = facts(st), done = f.done;
    const xp = TASKS.filter(x => done[x.id]).reduce((s, x) => s + x.xp, 0), speed = 5 * (f.fast + f.early);
    const correct = 10 * f.guessOk + 10 * f.caught + 5 * f.pass, growth = f.self0 && f.self1 ? 5 * Math.max(0, f.self1 - f.self0) : 0;
    const team = (done["s5.relay"] ? 20 : 0) + (done["s5.card"] ? 10 : 0) + (done["end.plan"] ? 10 : 0);
    return { total: xp + speed + correct + growth + team, xp, speed, correct, growth, team };
  }
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
    const levels = { 1: 0, 2: 0, 3: 0, 4: 0 }, ach = Object.create(null), self0 = Object.create(null), self1 = Object.create(null), titles = Object.create(null);
    let claimed = 0;   // 已領稱號的人數；稱號只統計人數，不收積分、不列名字
    people.forEach(p => {
      const s = snaps[p.cid] || {};
      const lv = Math.min(4, Math.max(1, Math.floor(Number(s.lv)) || 1)); levels[lv]++;
      (Array.isArray(s.ach) ? s.ach : []).forEach(a => { ach[a] = (ach[a] || 0) + 1; });
      if (s.self0) self0[s.self0] = (self0[s.self0] || 0) + 1;
      if (s.self1) self1[s.self1] = (self1[s.self1] || 0) + 1;
      if (typeof s.title === "string" && /^t([1-9]|[1-3]\d|4[0-4])$/.test(s.title)) { titles[s.title] = (titles[s.title] || 0) + 1; claimed++; }   // 舊版快照沒有 title＝還沒領
    });
    const votes = {};
    Object.keys(votesBy).forEach(k => {
      const tally = Object.create(null);
      Object.keys(votesBy[k]).filter(cid => inClass[cid]).forEach(cid => votesBy[k][cid].split(",").filter(Boolean).forEach(o => { tally[o] = (tally[o] || 0) + 1; }));
      votes[k] = tally;
    });
    return { resetId, stage, players: people.length, levels, ach, self0, self1, votes, relay, titles, claimed };
  }
  window.LU = { LEVELS, TASKS, ACH, markDone, level, progress, segments, levelUp, achievements, roster, numberOf, relayFor, foldClass,
    STAGE_ORDER, GUESS, COPY_CARDS, TITLES, titles, score, mergeLog, titleWeight, pickTitle };
})();

// 畫面元件：依 stages.js 的 block 畫出來。只用 DOM API，不用 innerHTML 塞使用者輸入（防 XSS）
// ctx = { st(), done(id, extra), sheet(field, value), set(patch), send(item), luc }
// 每次都呼叫 ctx.st() 取最新狀態，不快取、不修改它回傳的物件
(function () {
  const h = (tag, attrs, ...kids) => { const e = document.createElement(tag); Object.entries(attrs || {}).forEach(([k, v]) => { if (k === "class") e.className = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); }); kids.flat().forEach(k => e.append(k && k.nodeType ? k : String(k == null ? "" : k))); return e; };
  const opts = (...kids) => h("div", { class: "opts" }, ...kids);      // 一組選項：桌機自動換行、手機一個一行
  // 複製完直接開 Gemini（新分頁；不重用分頁，免得蓋掉正在用的對話）
  const GEMINI = "https://gemini.google.com/app";
  const geminiLink = () => h("a", { class: "btn demo", href: GEMINI, target: "_blank", rel: "noopener" }, "打開 Gemini ↗");
  const actions = (...kids) => h("div", { class: "actions" }, ...kids);   // 送出鈕＋提示字一排，提示字太長自己換行
  // 按鈕回饋：flash＝暫時換字（預設 3 秒）；press＝送出類按鈕（工作先做完，按鈕停用 600ms 並顯示「送出中…」；work 回傳 false＝沒送成，不閃）
  function flash(btn, text, ms) { if (btn.__old == null) btn.__old = btn.textContent; btn.textContent = text; clearTimeout(btn.__t); btn.__t = setTimeout(() => { btn.textContent = btn.__old; btn.__old = null; }, ms || 3000); }
  function press(btn, work) {
    if (btn.disabled) return;
    if (work() === false) return;
    const keep = btn.disabled, old = btn.textContent;
    btn.disabled = true; btn.textContent = "送出中…";
    setTimeout(() => { btn.textContent = old; if (!keep) btn.disabled = false; }, 600);
  }
  // 賺經驗值（lv>0）的任務用金色 .submit；沒有經驗值的用 .primary（金色只給 XP）
  const submitAttrs = id => { const t = window.LU && window.LU.TASKS.find(x => x.id === id); return { class: "btn " + (!window.LU || (t && t.lv > 0) ? "submit" : "primary"), "data-task": id }; };
  const watchers = [], notify = () => watchers.slice().forEach(w => { if (w.el.isConnected === false) watchers.splice(watchers.indexOf(w), 1); else w.f(); });   // 已經不在頁面上的紙卡就不再通知   // 填格改字時，通知依賴它的紙卡（拷問提示詞帶入第 1 格）
  // 送出類訊息要老實：先說「已記下」，flush 完還有東西排隊就說網路恢復後自動送
  // 桌號怎麼念：一般桌「第 7 桌」，線上組「線上第 10 組」
  const tableName = team => /^線上(\d+)$/.test(String(team)) ? `線上第 ${String(team).slice(2)} 組` : `第 ${team} 桌`;
  function report(ctx, msg, okText, p) {
    const wait = "✓ 已記下，網路恢復後自動送出";
    msg.className = "ok-msg"; msg.textContent = "✓ 已記下，傳送中…";
    Promise.resolve(p).then(() => {
      if ((ctx.pending ? ctx.pending() : 0) <= 0) { msg.textContent = okText; return; }
      msg.textContent = wait;
      if (!ctx.onFlush) return;
      const off = ctx.onFlush(() => { if (msg.textContent !== wait) { off(); return; } if (ctx.pending() <= 0) { msg.textContent = okText; off(); } });   // 排隊的送完了：改成「已送出」
    }, () => {});
  }
  function textOf(luc, from) {
    const v = luc[from];
    if (!Array.isArray(v)) return v;
    return v.map(x => `${x.name}｜查規定型：${x.rule}｜寫東西型：${x.write}｜好的 Gem 應該：${x.expect}`).join("\n\n");
  }
  // 桶子的小圖形：固定三種，用 createElementNS 建，不用 innerHTML
  function shapeMark(shape) {
    const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 12 12"); svg.setAttribute("width", "14"); svg.setAttribute("height", "14"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("class", "shape");
    const el = shape === "circle" ? document.createElementNS(NS, "circle") : shape === "triangle" ? document.createElementNS(NS, "polygon") : document.createElementNS(NS, "rect");
    if (shape === "circle") { el.setAttribute("cx", "6"); el.setAttribute("cy", "6"); el.setAttribute("r", "5"); }
    else if (shape === "triangle") el.setAttribute("points", "6,1 11,11 1,11");
    else { el.setAttribute("x", "1"); el.setAttribute("y", "1"); el.setAttribute("width", "10"); el.setAttribute("height", "10"); }
    el.setAttribute("fill", "currentColor"); svg.append(el); return svg;
  }
  const calm = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);   // 減少動態：不設 inline 延遲
  // ── 集換卡（T10）：卡片和存出來的圖用同一份資料（cardData），內容一定一致 ──
  function cardData(st) {
    const L = window.LU, c = st.claim || {}, s = c.score || {}, lv = L.level(st), M = L.SCORE_MAX, n = v => Number(v) || 0;
    const T = L.TITLES.find(x => x.id === c.main) || { name: "" }, dt = new Date(), p2 = x => String(x).padStart(2, "0");
    return { lv, lvText: `Lv.${lv} ${L.LEVELS[lv - 1].name}`, name: `【${T.name}】`, why: String(c.why || ""), total: n(s.total),
      stats: [["經驗值", n(s.xp), M.xp, true], ["手速", n(s.speed), M.speed], ["答對", n(s.correct), M.correct], ["成長", n(s.growth), M.growth], ["團隊", n(s.team), M.team]],
      no: st.player ? `No.${st.player}` : "No.—", foot: [st.team ? tableName(st.team) : "", `${dt.getFullYear()}-${p2(dt.getMonth() + 1)}-${p2(dt.getDate())}`].filter(Boolean).join("｜") };
  }
  // 電腦上滑鼠移到卡上：跟著微微傾斜反光（使用者自己的動作）；手機、減少動態時不做
  function tilt(flip, card) {
    const mm = window.matchMedia;
    if (!mm || !mm("(hover: hover) and (pointer: fine)").matches || mm("(prefers-reduced-motion: reduce)").matches) return;
    const set = (el, k, v) => el.style.setProperty(k, v);
    flip.addEventListener("pointermove", e => {
      if (!String(flip.className).split(" ").includes("open")) return;
      const r = flip.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      set(flip, "--ry", (x * 10).toFixed(2) + "deg"); set(flip, "--rx", (-y * 8).toFixed(2) + "deg"); set(card, "--sx", (120 - (x + 0.5) * 140).toFixed(1) + "%"); set(card, "--so", "1");
    });
    flip.addEventListener("pointerleave", () => { set(flip, "--ry", "0deg"); set(flip, "--rx", "0deg"); set(card, "--so", "0"); });
  }
  function loadImg(src) {   // 等小人圖真的載入完才畫（decode；舊瀏覽器用 onload）；載不到就不畫小人
    return new Promise(res => {
      const i = document.createElement("img"), ok = () => res(i), bad = () => res(null);
      if (i.decode) { i.src = src; i.decode().then(ok, bad); } else { i.onload = ok; i.onerror = bad; i.src = src; }
    });
  }
  const cssVar = k => { try { return getComputedStyle(document.documentElement).getPropertyValue(k).trim(); } catch (e) { return ""; } };
  const cardFam = () => ({ sans: cssVar("--font-sans") || "sans-serif", mono: cssVar("--font-mono") || "monospace" });
  // 卡片上每種「粗細＋字型」要畫哪些字（跟 drawCard 一一對應，改字型兩邊一起改）：畫之前先 document.fonts.load，中文字型照字分片，頁面上沒出現過的字要點名才會下載
  function cardFontNeeds(d) {
    const { sans, mono } = cardFam();
    return [[`400 32px ${sans}`, [d.why, d.foot, "總積分", ...d.stats.map(s => s[0])].join("")], [`700 32px ${sans}`, ["AI 升級之路｜結業卡", "你的結業稱號", d.lvText, d.name].join("")],
      [`700 28px ${mono}`, d.no], [`800 36px ${mono}`, [d.total, ...d.stats.map(s => s[1])].join("")]];
  }
  // 用 Canvas 2D 自己畫一張集換卡（800 寬＝卡片 400px 的兩倍）。顏色、字型讀 theme.css 的變數，讀不到才用同樣的值
  function drawCard(cv, d, img) {
    const css = cssVar;
    const C = { bg: css("--bg") || "#12162A", deep: css("--bg-deep") || "#0D1022", panel: css("--panel") || "#1C2242", panel2: css("--panel-2") || "#252C55",
      fg: css("--fg") || "#EEF0F7", dim: css("--fg-dim") || "#A6ACC8", line: css("--line-strong") || "#7D84A8", gold: css("--gold") || "#F4B740", onGold: css("--on-gold") || "#2A1F05" };
    const { sans, mono } = cardFam();
    const c = cv.getContext("2d"), W = 800;
    const fit = (text, weight, size, fam, maxW, min) => { let z = size; c.font = `${weight} ${z}px ${fam}`; while (z > min && c.measureText(text).width > maxW) { z -= 2; c.font = `${weight} ${z}px ${fam}`; } return z; };
    const wrap = (text, maxW) => { const out = []; let line = ""; Array.from(text).forEach(ch => { if (line && c.measureText(line + ch).width > maxW) { out.push(line); line = ch; } else line += ch; }); if (line) out.push(line); return out; };
    c.font = `400 32px ${sans}`; const why = wrap(d.why, 700);
    const statsY = 672 + why.length * 48 + 20, footY = statsY + d.stats.length * 56 + 14, H = footY + 120;
    cv.width = W; cv.height = H;   // 設寬高會清空畫布，所以先量好再設
    const rr = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    const text = (t, x, y, font, color, align) => { c.font = font; c.fillStyle = color; c.textAlign = align || "left"; c.fillText(t, x, y); };
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    rr(3, 3, W - 6, H - 6, 36); c.fillStyle = C.panel2; c.fill(); c.lineWidth = 6; c.strokeStyle = C.fg; c.stroke();
    rr(14, 14, W - 28, H - 28, 26); c.lineWidth = 2; c.strokeStyle = C.line; c.stroke();
    text("AI 升級之路｜結業卡", 40, 64, `700 28px ${sans}`, C.dim); text(d.no, W - 40, 64, `700 28px ${mono}`, C.dim, "right");
    // 展示窗：深藍底＋放射光＋腳下影子＋小人＋金色等級牌
    rr(28, 88, W - 56, 440, 24); const g = c.createRadialGradient(W / 2, 352, 20, W / 2, 352, 420); g.addColorStop(0, C.panel2); g.addColorStop(1, C.deep);
    c.fillStyle = g; c.fill();
    c.save(); c.clip(); c.fillStyle = "rgba(238, 240, 247, .07)";   // 放射光：跟網頁 .tc-art 一樣，每 16 度畫一片 8 度的淡光
    for (let a = 0; a < 360; a += 16) { c.beginPath(); c.moveTo(W / 2, 361); c.arc(W / 2, 361, 640, a * Math.PI / 180, (a + 8) * Math.PI / 180); c.closePath(); c.fill(); }
    c.restore(); rr(28, 88, W - 56, 440, 24); c.lineWidth = 2; c.strokeStyle = C.line; c.stroke();
    c.save(); c.globalAlpha = .55; c.fillStyle = "black"; c.beginPath(); c.ellipse(W / 2, 500, 150, 22, 0, 0, Math.PI * 2); c.fill(); c.restore();
    if (img) { const ih = 392, iw = ih * (img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0.8); c.drawImage(img, (W - iw) / 2, 508 - ih, iw, ih); }
    c.font = `700 32px ${sans}`; const tw = c.measureText(d.lvText).width; rr(44, 104, tw + 28, 50, 14); c.fillStyle = C.gold; c.fill(); text(d.lvText, 58, 140, `700 32px ${sans}`, C.onGold);   // 含中文名：中文字型＋700（跟網頁 .tc-lvtag 一樣）
    // 名牌（壓在展示窗下緣）
    rr(56, 476, W - 112, 150, 20); c.fillStyle = C.panel; c.fill(); c.lineWidth = 4; c.strokeStyle = C.fg; c.stroke();
    text("你的結業稱號", W / 2, 520, `700 28px ${sans}`, C.dim, "center");
    const nz = fit(d.name, 700, 56, sans, W - 160, 28); text(d.name, W / 2, 592, `700 ${nz}px ${sans}`, C.fg, "center");
    why.forEach((l, i) => text(l, W / 2, 680 + i * 48, `400 32px ${sans}`, C.fg, "center"));
    // 能力值長條（經驗值金色，其他白色；滿格＝各項上限）
    d.stats.forEach(([k, v, max, xp], i) => {
      const y = statsY + i * 56;
      text(k, 48, y + 28, `400 30px ${sans}`, C.dim);
      rr(176, y + 6, 470, 22, 11); c.fillStyle = C.deep; c.fill();
      const w = Math.max(0, Math.min(1, v / max)) * 470; if (w > 0) { rr(176, y + 6, Math.max(w, 22), 22, 11); c.fillStyle = xp ? C.gold : C.fg; c.fill(); }
      text(String(v), W - 48, y + 32, `800 36px ${mono}`, C.fg, "right");
    });
    c.save(); c.setLineDash([10, 8]); c.lineWidth = 2; c.strokeStyle = C.line; c.beginPath(); c.moveTo(48, footY); c.lineTo(W - 48, footY); c.stroke(); c.restore();
    text("總積分", 48, footY + 74, `400 32px ${sans}`, C.dim); text(String(d.total), 176, footY + 86, `800 88px ${mono}`, C.fg); text(d.foot, W - 48, footY + 74, `400 28px ${sans}`, C.dim, "right");
  }
  const isIOS = () => { const n = window.navigator || {}; return /iP(hone|od|ad)/.test(n.userAgent || "") || (n.platform === "MacIntel" && n.maxTouchPoints > 1); };
  let shownUrl = null;   // 放在卡片下面那張圖的網址：留到下一次按才收回
  // 存成圖片：一律先把圖放在卡片下面＋「長按這張圖存起來」；電腦（有 download、不是 iPhone）同時觸發 a[download]。
  // 不開新分頁：LINE／FB 內建瀏覽器有 download 屬性卻存不了 blob（會假成功），iPhone 新分頁會空白
  async function saveCard(d, msg, box) {
    const a = document.createElement("a"), canDl = !isIOS() && "download" in a, U = window.URL;
    msg.className = ""; msg.textContent = "產生圖片中…";
    let cv, blob = null, view = "";
    try {
      const img = await loadImg(`img/avatar-lv${d.lv}.png`);
      const F = document.fonts;
      if (F && F.load) await Promise.race([Promise.all(cardFontNeeds(d).map(([f, t]) => F.load(f, t))).catch(() => {}), new Promise(r => setTimeout(r, 1500))]);   // 載不到、超過 1.5 秒就用備援字型照畫
      if (F && F.ready) await F.ready;   // 中文字型跟頁面同一套，等它載好
      cv = document.createElement("canvas"); drawCard(cv, d, img);
      blob = await new Promise(r => (cv.toBlob ? cv.toBlob(r, "image/png") : r(null)));
      if (!(blob && U && U.createObjectURL)) { blob = null; view = cv.toDataURL("image/png"); }
    } catch (e) {
      box.replaceChildren(); msg.className = "bad-msg"; msg.textContent = "這台瀏覽器做不出圖片，請直接截圖"; return;
    }
    if (blob) { if (shownUrl && U.revokeObjectURL) U.revokeObjectURL(shownUrl); shownUrl = view = U.createObjectURL(blob); }
    const im = h("img", { alt: "結業卡（長按或右鍵存起來）" }); im.src = view;
    box.replaceChildren(h("p", { class: "step-no" }, "長按這張圖存起來（電腦可按右鍵另存）"), im);
    if (canDl) {
      const dl = blob ? U.createObjectURL(blob) : view;
      a.href = dl; a.download = `AI升級之路-結業卡-${d.no.replace(/[^\w]/g, "")}.png`;
      document.body.append(a); a.click(); a.remove();
      if (blob && U.revokeObjectURL) setTimeout(() => U.revokeObjectURL(dl), 10000);   // 下載用的網址 10 秒後收回
      msg.className = "ok-msg"; msg.textContent = "已開始下載；沒看到的話，長按或右鍵下面這張圖存起來";
    } else { msg.className = "ok-msg"; msg.textContent = "長按下面這張圖存起來"; }
  }
  // ── 上課卡（T12，行為照宴會 app 的 renderTeach／tFlip／tToggle／tGuess／tMatch；畫面用本專案風格 C）──
  // 卡片狀態只在記憶體；輪詢不會碰這一塊（app.js 的 renderMenu 只改目錄、橫幅的字和 class）
  const T_HINT = { flip: "全部點開才能下一步", toggle: "把開關全部打開", guess: "先選一個答案", match: "全部配對正確才能下一步" };
  const fmtMin = m => (m < 1 ? "30 秒" : `${m} 分鐘`);
  const addC = (el, c) => { if (!String(el.className).split(" ").includes(c)) el.className = (el.className ? el.className + " " : "") + c; };
  function tFlip(sc, el, done) {   // 翻卡：每張都點開才揭曉（先體驗、後命名）；只改被點的那張
    const opened = new Set(), n = sc.cards.length, count = h("p", { class: "step-no t-count" }, `已點開 0 / ${n}`), rev = h("div", { "aria-live": "polite" });
    const cards = sc.cards.map((x, k) => {
      const tap = h("span", { class: "tap" }, "點我");
      const fb = h("span", { class: "fb" }, h("span", { class: "frow" }, h("span", { class: "tagl" }, "比喻"), x.analogy), h("span", { class: "frow" }, h("span", { class: "tagl" }, sc.exLabel || "學校裡"), x.example));
      fb.hidden = true;
      const b = h("button", { class: "fcard", type: "button", "aria-expanded": "false" }, h("span", { class: "fh" }, h("b", {}, x.label), x.zh ? h("small", {}, x.zh) : "", tap), fb);
      b.addEventListener("click", () => {
        if (opened.has(k)) return;
        opened.add(k); addC(b, "open"); b.setAttribute("aria-expanded", "true"); fb.hidden = false; if (tap.remove) tap.remove();
        count.textContent = `已點開 ${opened.size} / ${n}`;
        if (opened.size === n) {
          rev.replaceChildren(h("div", { class: "t-reveal" }, h("p", { class: "step-no" }, "全部點開了，揭曉"), h("b", {}, sc.reveal.title), h("p", {}, sc.reveal.text)));
          if (rev.scrollIntoView) rev.scrollIntoView({ block: "nearest", behavior: calm() ? "auto" : "smooth" });   // 學員點開最後一張才會走到這裡：捲到揭曉剛好看得見，不跳頂
          done();
        }
      });
      return b;
    });
    el.replaceChildren(count, h("div", { class: "fcards" }, cards), rev);
  }
  function tToggle(sc, el, done) {   // 開關：一顆顆打開看結果變好；全開之後還能再關掉一顆（破壞實驗）
    const on = sc.parts.map(() => false), sep = sc.parts.every(p => /[，。]$/.test(p.say)) ? "" : "、";
    const said = h("span", {}), rows = sc.parts.map(() => h("div", { class: "rrow off" })), dn = h("div", { "aria-live": "polite" });
    const upd = () => {
      const says = sc.parts.filter((_, k) => on[k]).map(p => p.say);
      said.textContent = says.length ? says.join(sep) : "……";
      rows.forEach((r, k) => { r.className = "rrow " + (on[k] ? "on" : "off"); r.textContent = on[k] ? sc.parts[k].on : sc.parts[k].off; });
      const all = on.every(Boolean);
      dn.replaceChildren(...(all ? [h("div", { class: "t-reveal" }, h("b", {}, sc.done))] : []));
      if (all) done();
    };
    const sws = sc.parts.map((p, k) => {
      const b = h("button", { class: "sw", type: "button", role: "switch", "aria-checked": "false" }, h("span", { class: "knob", "aria-hidden": "true" }), p.label);
      b.addEventListener("click", () => { on[k] = !on[k]; b.setAttribute("aria-checked", String(on[k])); b.className = "sw" + (on[k] ? " is-on" : ""); upd(); });
      return b;
    });
    el.replaceChildren(h("div", { class: "switches" }, sws), h("div", { class: "t-say" }, h("span", { class: "lead2" }, sc.lead || ""), said), h("div", { class: "t-results" }, rows), dn);
    upd();
  }
  function tGuess(sc, el, done) {   // 先猜再揭曉：猜錯也算完成（重點是先預測）
    const out = h("div", { class: "g-out", "aria-live": "polite", tabindex: "-1" }); let settled = false;
    const bs = sc.options.map(o => h("button", { class: "btn opt gopt", type: "button" }, o));
    bs.forEach((b, k) => b.addEventListener("click", () => {
      if (settled) return;
      settled = true; bs.forEach(x => { x.disabled = true; });
      const right = k === sc.answer; addC(b, right ? "ok" : "ng"); addC(bs[sc.answer], "ok");
      out.replaceChildren(h("p", { class: right ? "ok-msg" : "bad-msg" }, right ? "✓ 答對了" : `✗ 正解是「${sc.options[sc.answer]}」`), h("div", { class: "t-reveal" }, h("p", {}, sc.explain)));
      if (out.focus) out.focus();   // 選了就把焦點給結果（選項已鎖住）
      done();
    }));
    el.replaceChildren(h("p", { class: "t-q" }, sc.question), opts(bs), out);
  }
  function tMatch(sc, el, done) {   // 配對：先點一句、再點它屬於的格子；點錯可以重試，全部配對正確才過
    const placed = {}, order = sc.items.map((_, i) => i); let armed = null;
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }   // 打亂順序（照宴會）
    const pool = h("div", { class: "mitems" }), mv = h("p", { class: "verdict", "aria-live": "polite" }), btns = {};
    const mark = () => order.forEach(i => { const b = btns[i]; if (!b) return; const on = armed === i; b.className = "mitem" + (on ? " armed" : ""); b.setAttribute("aria-pressed", String(on)); });   // 選取只切 class 和 aria-pressed，不重建
    order.forEach(i => { const b = h("button", { class: "mitem", type: "button", "aria-pressed": "false" }, sc.items[i].text); b.addEventListener("click", () => { armed = armed === i ? null : i; mark(); }); btns[i] = b; });
    const tg = sc.targets.map(t => {
      const mp = h("span", { class: "mp" }), b = h("button", { class: "mt", type: "button", "data-t": t.id }, h("b", {}, t.label), mp);
      b.addEventListener("click", () => {
        if (armed == null) { mv.className = "verdict"; mv.textContent = "先點上面的一句，再點格子"; return; }
        const it = sc.items[armed];
        if (it.ans !== t.id) { mv.className = "verdict bad-msg"; mv.textContent = "✗ 不是這一格，再試一次"; return; }
        const k = order.indexOf(armed), gone = btns[armed];
        placed[armed] = t.id; delete btns[armed]; if (gone.remove) gone.remove();   // 只拿掉配好的那一顆
        mp.append(h("span", { class: "mchip" }, "✓ " + it.text.replace(/[「」]/g, "")));   // 整句顯示（排版精修 P-1）
        mv.className = "verdict ok-msg"; mv.textContent = "✓ 答對：" + it.why;
        armed = null; mark();
        const nx = order.slice(k + 1).concat(order.slice(0, k)).find(i => btns[i]);
        if (nx != null) { if (btns[nx].focus) btns[nx].focus(); }
        else { pool.replaceChildren(h("p", { class: "ok-msg" }, "全部配對完成")); if (tg[0].focus) tg[0].focus(); }   // 焦點移到下一句；沒有了就移到第一個格子
        if (Object.keys(placed).length === sc.items.length) done();
      });
      return b;
    });
    pool.replaceChildren(...order.map(i => btns[i]));
    el.replaceChildren(pool, h("div", { class: "mtargets" }, tg), mv);
  }
  // 一張一張上：上一張／下一張；最後一張完成後按 opts.lastLabel 呼叫 opts.onFinish
  function teach(cards, o) {
    const wrap = h("div", { class: "teach" }), passed = new Set(); let i = 0;   // passed：做完過的那幾張，回上一張再回來不用重做
    function show(user) {
      const k0 = i, sc = cards[i], last = i === cards.length - 1; let ok = passed.has(i);
      const body = h("div", { class: "t-body" }), next = h("button", { class: "btn primary t-next", type: "button" }), title = h("h3", { class: "t-title", tabindex: "-1" }, sc.title);
      const upd = () => { next.setAttribute("aria-disabled", String(!ok)); next.textContent = ok ? (last ? o.lastLabel : "下一張") : T_HINT[sc.type]; };   // 不用 disabled：提示字讀得到
      next.addEventListener("click", () => { if (!ok) return; if (last) o.onFinish(); else { i++; show(true); } });
      const back = i ? h("button", { class: "btn", type: "button", onclick: () => { i--; show(true); } }, "上一張") : "";
      wrap.replaceChildren(h("div", { class: "t-card" },
        h("p", { class: "step-no t-kicker" }, `白話上課 ${i + 1}/${cards.length}・約 ${fmtMin(sc.mins)}`),
        h("div", { class: "tprog", "aria-hidden": "true" }, cards.map((_, k) => h("span", { class: k < i ? "done" : k === i ? "on" : "" }))),
        title, sc.intro ? h("p", { class: "t-intro" }, sc.intro) : "", body, actions(back, next)));
      upd();
      ({ flip: tFlip, toggle: tToggle, guess: tGuess, match: tMatch })[sc.type](sc, body, () => { passed.add(k0); if (!ok) { ok = true; upd(); } });
      if (user) {   // 學員自己按上一張／下一張：捲到這張卡頂端、焦點給標題（第一次建畫面、重新整理不捲）
        if (wrap.scrollIntoView) wrap.scrollIntoView({ block: "start", behavior: calm() ? "auto" : "smooth" });
        if (title.focus) title.focus({ preventScroll: true });
      }
    }
    show();
    wrap.restart = () => { i = 0; show(); };
    return wrap;
  }
  const R = {
    copy(b, ctx) {
      const get = () => {
        let t = textOf(ctx.luc, b.from);
        if (b.fill === "first") { const f = String((ctx.st().sheet || {}).first || "").trim().slice(0, 40); if (f) t = t.split("（一件事）").join(f); }
        return t;
      };
      const paper = h("div", { class: "paper" }, get()), msg = h("span", { "aria-live": "polite" }), manual = h("span", {});
      if (b.fill) watchers.push({ el: paper, f: () => { const t = get(); if (paper.textContent !== t) paper.textContent = t; } });
      return h("div", { class: "block" }, h("p", {}, b.label), paper, actions(
        h("button", { class: "btn copy", onclick: async e => {
          const btn = e.currentTarget; let ok = false;
          try { await navigator.clipboard.writeText(get()); ok = true; } catch (e) { ok = false; }
          const copied = () => Object.assign({}, ctx.st().copied, { [b.from]: true });   // 稱號用：哪幾張紙卡複製過
          if (ok) { msg.textContent = "✓ 已複製，到 Gemini 貼上"; flash(btn, "✓ 已複製", 3000); manual.replaceChildren(); ctx.set({ copied: copied() }); if (b.id) ctx.done(b.id); return; }
          msg.textContent = "複製沒成功，請手動選取上面文字複製";   // 失敗不算完成
          manual.replaceChildren(h("button", { class: "btn small manual", onclick: () => { ctx.set({ copied: copied(), manualCopy: true }); if (b.id) ctx.done(b.id); msg.textContent = "✓ 已記錄手動複製"; manual.replaceChildren(); } }, "我已手動複製"));
        } }, "複製"), b.noOpen ? "" : geminiLink(), msg, manual));
    },
    text(b, ctx) {
      const ta = h("textarea", { rows: b.rows || 3, "aria-label": b.label }); ta.value = (ctx.st().sheet || {})[b.field] || "";
      const msg = h("span", { "aria-live": "polite" });
      ta.addEventListener("input", () => { ctx.sheet(b.field, ta.value); notify(); });   // 每打一個字都存本機，重新整理不會不見
      return h("div", { class: "block" }, h("label", {}, b.label), ta, actions(
        h("button", Object.assign(submitAttrs(b.id), { onclick: e => press(e.currentTarget, () => {
          if (ta.value.trim().length < (b.min || 1)) { msg.className = "bad-msg"; msg.textContent = `再多寫一點（至少 ${b.min} 個字）`; return false; }
          ctx.done(b.id); msg.className = "ok-msg"; msg.textContent = "✓ 交件完成";
        }) }), "交件 EXP"), msg));
    },
    check(b, ctx) {
      return h("div", { class: "block" }, b.items.map(it => {
        const done = !!(ctx.st().done || {})[it.id], note = h("span", { class: "step-no", "aria-live": "polite" }, done ? " 已完成" : "");
        const box = h("input", { type: "checkbox", id: "c-" + it.id }); box.checked = done;   // 2026-11-16：勾了可以再取消
        box.addEventListener("change", () => { if (box.checked) { ctx.done(it.id); note.textContent = " 已完成"; } else { if (ctx.undone) ctx.undone(it.id); note.textContent = ""; } });
        return h("label", { class: "check", for: "c-" + it.id }, box, " ", it.label, note);
      }));
    },
    guess(b, ctx) {
      const out = h("div", { "aria-live": "polite" });
      const sample = () => b.sample && ctx.luc[b.sample] ? h("details", {}, h("summary", {}, "看 AI 真的怎麼回答（2026-11-12 實測）"), h("div", { class: "paper" }, ctx.luc[b.sample])) : "";   // 揭曉後才給
      const show = pick => { out.replaceChildren(h("p", { class: pick === b.answer ? "ok-msg" : "bad-msg" }, pick === b.answer ? "✓ 猜對了" : "✗ 再看看"), h("p", {}, b.reveal), sample()); if (!(ctx.st().done || {})[b.id]) { ctx.send({ kind: "vote", key: b.id, value: pick }); ctx.done(b.id, { picks: Object.assign({}, ctx.st().picks, { [b.id]: [pick] }) }); } };   // 第一次作答才送，投影幕畫分布
      if ((ctx.st().done || {})[b.id]) out.replaceChildren(h("p", { class: "ok-msg" }, "✓ 已完成"), h("p", {}, b.reveal), sample());
      return h("div", { class: "block" }, h("p", {}, b.q), opts(b.options.map(o => h("button", { class: "btn opt", onclick: () => show(o.key) }, o.key + "　" + o.label))), out);
    },
    vote(b, ctx) {
      const chosen = new Set(), msg = h("span", { "aria-live": "polite" }), reveal = h("p", { class: "ok-msg", "aria-live": "polite" });
      let submit = null;
      const revealFor = () => {
        const s = ctx.st(), L = window.LU && window.LU.LEVELS;
        if (b.id === "open.self" && s.self0 && L) return `你現在大概在 Lv.${s.self0}（${L[s.self0 - 1].name}）`;
        if (b.id === "end.self" && s.self1 && L) return `${s.self0 ? `開場 Lv.${s.self0} → ` : ""}現在 Lv.${s.self1}（${L[s.self1 - 1].name}）`;
        if (b.id === "end.vote" && (s.done || {})[b.id]) return "講師的答案：有目標＝有；會用工具＝一部分；自己決定步驟＝一部分；自己啟動＝還沒有";
        return "";
      };
      const ticks = b.options.map(() => h("span", { class: "tick", "aria-hidden": "true" }, "○"));   // 沒選 ○、選中 ✓（固定寬度，不推動文字）
      const mark = (i, on) => { btns[i].setAttribute("aria-pressed", String(on)); ticks[i].textContent = on ? "✓" : "○"; };
      const btns = b.options.map((o, i) => h("button", { class: "btn opt", "aria-pressed": "false", onclick: () => {
        if (submit) { submit.disabled = false; }   // 改了選項才能再送，雙擊不會送兩次
        const was = chosen.has(o.key);
        if (!b.multi) { chosen.clear(); b.options.forEach((_, k) => mark(k, false)); }
        was ? chosen.delete(o.key) : chosen.add(o.key);
        mark(i, chosen.has(o.key));
      } }, ticks[i], o.label));
      submit = h("button", Object.assign(submitAttrs(b.id), { onclick: () => press(submit, () => {
        if (!chosen.size) { msg.textContent = "先選一個"; return false; }
        const value = Array.from(chosen).join(",");
        const p = ctx.send({ kind: "vote", key: b.id, value });
        const s0 = ctx.st(), picks = { picks: Object.assign({}, s0.picks, { [b.id]: Array.from(chosen) }), voteN: Object.assign({}, s0.voteN, { [b.id]: ((s0.voteN || {})[b.id] || 0) + 1 }) };   // voteN：送出幾次（稱號用）
        const extra0 = b.id === "open.self" ? { self0: Math.max(...Array.from(chosen).map(k => "ABCDEFG".indexOf(k) + 1)) } : b.id === "end.self" ? { self1: Number(value) } : {}, extra = Object.assign({}, extra0, picks);
        const q = ctx.done(b.id, extra); submit.disabled = true;
        report(ctx, msg, "✓ 已送出（要改就換選項，再按送出）", Promise.all([p, q])); reveal.textContent = revealFor();
      }) }), "送出");
      ((ctx.st().picks || {})[b.id] || []).forEach(k => { const i = b.options.findIndex(o => o.key === k); if (i >= 0) { chosen.add(k); mark(i, true); } });   // 重新整理後還原選項
      if ((ctx.st().done || {})[b.id]) { msg.textContent = "✓ 已送出（要改就換選項，再按送出）"; submit.disabled = true; reveal.textContent = revealFor(); }   // 跟剛送完一樣：鎖住，改選項才再開
      return h("div", { class: "block" }, h("p", {}, b.q), opts(btns), actions(submit, msg), reveal);
    },
    sort(b, ctx) {
      // 點選式：先點卡、再點桶（拖拉對中年使用者不友善，點兩下一樣能分）；也支援拖拉。
      // 已拿起一張卡時，點桶子裡的任何東西（包括桶裡的卡）都是「放進這個桶」；沒拿起卡時，點桶裡的卡才是拿起它
      let picked = null, finished = false; const msg = h("p", { "aria-live": "polite" });
      const unpick = () => { picked = null; cards.forEach(x => x.setAttribute("aria-pressed", "false")); };
      const cards = b.cards.map((c, i) => { const el = h("button", { class: "chip", draggable: "true", "data-i": i, onclick: e => {
        if (picked != null && picked !== i) return;   // 不攔截：事件往上冒泡，由所在的桶（或卡片區）接住並放下
        if (e && e.stopPropagation) e.stopPropagation();
        if (picked === i) { unpick(); return; }       // 再點一次＝取消拿起
        picked = i; cards.forEach(x => x.setAttribute("aria-pressed", "false")); el.setAttribute("aria-pressed", "true");
      } }, c.label); el.addEventListener("dragstart", () => { picked = i; }); return el; });
      const place = {};
      const wire = (zone, onDrop) => {
        const drop = () => { if (picked == null) return; const i = picked, card = cards[i]; zone.append(card); onDrop(i); unpick(); if (card.focus) card.focus(); check(); };
        zone.addEventListener("click", drop);
        zone.addEventListener("keydown", e => { if (e.target !== zone) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); drop(); } });
        zone.addEventListener("dragover", e => e.preventDefault()); zone.addEventListener("drop", e => { e.preventDefault(); drop(); });
        return zone;
      };
      const pool = wire(h("div", { class: "pool", role: "button", tabindex: "0", "aria-label": "卡片區（把卡放回這裡）" }, cards), i => { delete place[i]; });
      const buckets = b.buckets.map((k, bi) => { const lid = "bk-" + b.id + "-" + bi;
        return wire(h("div", { class: "bucket", role: "button", tabindex: "0", "aria-labelledby": lid }, shapeMark(k.shape), h("strong", { id: lid }, k.label)), i => { place[i] = k.key; }); });
      function check() {
        if (Object.keys(place).length < b.cards.length) return;
        const st0 = ctx.st(); if (!finished && !(st0.done || {})[b.id]) ctx.set({ sortN: Object.assign({}, st0.sortN, { [b.id]: ((st0.sortN || {})[b.id] || 0) + 1 }) });   // 稱號用：卡全放進桶幾次才全對
        const wrong = b.cards.filter((c, i) => place[i] !== c.bucket).map(c => c.label);
        if (wrong.length) { msg.className = "bad-msg"; msg.textContent = "✗ 再想想：" + wrong.join("、"); }
        else { msg.className = "ok-msg"; msg.textContent = "✓ 全對"; if (!finished && !(ctx.st().done || {})[b.id]) { finished = true; ctx.done(b.id); } }
      }
      if ((ctx.st().done || {})[b.id]) { msg.className = "ok-msg"; msg.textContent = "✓ 已完成，可以重新練習"; }
      return h("div", { class: "block" }, h("p", {}, b.q), pool, h("div", { class: "buckets" }, buckets), msg);
    },
    pass(b, ctx) {
      const sel = h("select", { "aria-label": "過了幾題" }, [0, 1, 2, 3, 4, 5].map(n => h("option", { value: n }, n + " 題")));
      sel.value = String(ctx.st().pass || 0);
      const msg = h("span", { "aria-live": "polite", class: "ok-msg" }, (ctx.st().done || {})[b.id] ? `✓ 已交件：過了 ${ctx.st().pass || 0} 題` : "");
      return h("div", { class: "block" }, h("label", {}, "鄰座唸你寫的題目、你自己打字、鄰座打分：你的 Gem 過了幾題？"), sel, actions(
        h("button", Object.assign(submitAttrs(b.id), { onclick: e => press(e.currentTarget, () => { const q = ctx.done(b.id, { pass: Number(sel.value) }); report(ctx, msg, `✓ 已交件：過了 ${sel.value} 題`, q); }) }), "交件 EXP"), msg),
        h("p", { class: "step-no" }, "過 4 題以上就升到 Lv.4 認證講師；沒過的題目，回家補進指令或參考資料"));
    },
    caught(b, ctx) {
      const saved0 = ((ctx.st().picks || {})[b.id]) || [];
      const boxes = b.items.map((x, i) => { const c = h("input", { type: "checkbox", id: "cg" + i }); c.checked = saved0.includes(i); return [c, h("label", { class: "check", for: "cg" + i }, c, " ", x)]; });
      const st = ctx.st(), saved = h("p", { class: "ok-msg", "aria-live": "polite" }, (st.done || {})[b.id] && typeof st.caught === "number" ? `✓ 已送出：抓到 ${st.caught} 個` : "");
      return h("div", { class: "block" }, h("p", {}, "1:35 揭曉後：你們這組抓到了哪幾個？"), boxes.map(x => x[1]), actions(
        h("button", Object.assign(submitAttrs(b.id), { onclick: e => press(e.currentTarget, () => {
          const idx = boxes.map((x, i) => x[0].checked ? i : -1).filter(i => i >= 0);
          if (!idx.length) { saved.className = "bad-msg"; saved.textContent = "先勾抓到的錯"; return false; }
          const q = ctx.done(b.id, { caught: idx.length, picks: Object.assign({}, ctx.st().picks, { [b.id]: idx }) }); report(ctx, saved, `✓ 已送出：抓到 ${idx.length} 個`, q);
        }) }), "送出")), saved);
    },
    relay(b, ctx) {
      const wrap = h("div", { class: "block" });
      const roles = { A: ["寫手", "roleA", null], B: ["審查員", "roleB", "A"], C: ["格式員", "roleC", "B"] };
      const prevBox = h("div", { class: "paper", "aria-live": "polite" }, "等前一棒交棒…");
      function body() {
        const st = ctx.st(), r = roles[st.relayRole], ta = h("textarea", { rows: 8, maxlength: 6000, "aria-label": "貼上你的成果" }), msg = h("span", { "aria-live": "polite" });
        const parts = String(st.relayGroup).split("-"), grpNo = parts.pop(), team = parts.join("-"), online = /^線上/.test(team);
        const dkey = "relay_" + st.relayGroup + "_" + st.relayRole, skey = "relaySent_" + st.relayGroup + "_" + st.relayRole;   // 草稿與已交的版本：重新整理不會不見
        const sheet = st.sheet || {};
        const count = h("span", { class: "step-no" }, "0 / 6000 字"), over = h("span", { class: "bad-msg", "aria-live": "polite" }), go = h("button", submitAttrs("s5.relay"), "交棒");
        const sentBox = h("div", {});
        const showSent = t => sentBox.replaceChildren(t ? h("p", { class: "step-no" }, "你交出去的版本") : "", t ? h("div", { class: "paper" }, t) : "");
        ta.value = sheet[dkey] || ""; count.textContent = `${ta.value.length} / 6000 字`; showSent(sheet[skey] || "");
        const warn = () => { over.textContent = ta.value.length >= 6000 ? "已達 6000 字上限，多的不會送出" : ""; };
        warn();
        wrap.replaceChildren(h("p", {}, online ? `你是${tableName(team)}的 ${st.relayRole} ${r[0]}` : `你是${tableName(team)}・第 ${grpNo} 組的 ${st.relayRole} ${r[0]}`),
          h("details", { open: "" }, h("summary", {}, `原始資料（${online ? "兩" : "三"}個人都一樣，裡面藏了 3 個錯）`), h("div", { class: "paper" }, ctx.luc.relayData)),
          R.copy({ label: `${r[0]}的指令：整段複製到 Gemini`, from: r[1] }, ctx),
          r[2] ? h("div", {}, h("p", {}, `前一棒（${r[2]}）交給你的：`), prevBox) : "",
          h("label", {}, "把 AI 做好的成果整段貼在這裡，按「交棒」"), ta, h("div", {}, count, " ", over),
          actions(go, msg), sentBox);
        ta.addEventListener("input", () => { count.textContent = `${ta.value.length} / 6000 字`; warn(); ctx.sheet(dkey, ta.value); go.disabled = false; });   // 改了內容才能再交；草稿每個字都存
        ta.addEventListener("paste", e => { const t = e && e.clipboardData && e.clipboardData.getData ? e.clipboardData.getData("text") : ""; if (t && ta.value.length + t.length > 6000) over.textContent = "已達 6000 字上限，多的不會送出"; });
        go.addEventListener("click", () => press(go, () => {
            if (ta.value.trim().length < 20) { msg.className = "bad-msg"; msg.textContent = "成果太短，整段貼上"; return false; }
            const text = ta.value.slice(0, 6000);
            const p = ctx.send({ kind: "relay", team: st.relayGroup, key: st.relayRole, value: text });
            ctx.sheet(skey, text); showSent(text);
            const q = ctx.done("s5.relay"); go.disabled = true; report(ctx, msg, "✓ 已交棒。要改就修改內容再按一次", Promise.all([p, q]));
        }));
        window.RELAY_UPDATE = texts => { const prev = r[2] && texts[r[2]]; if (prev && prevBox.textContent !== prev) prevBox.textContent = prev; };
      }
      if (ctx.st().relayGroup && ctx.st().relayRole) { body(); return wrap; }
      const team = ctx.st().team, isOnline = /線上/.test(team);
      const gsel = h("select", { "aria-label": "組別" }, [1, 2, 3].map(n => h("option", { value: n }, `第 ${n} 組`)));
      const roleBtns = Object.keys(roles).filter(k => !(isOnline && k === "C")).map(k => h("button", { class: "btn opt", onclick: () => {
        ctx.set({ relayGroup: `${team}-${gsel.value}`, relayRole: k });   // 只記組別和角色；交棒時才算完成任務
        body();
      } }, `${k} ${roles[k][0]}`));
      wrap.append(h("p", {}, "三人一組（線上兩人）：選你們這組的編號，再選你的角色"), gsel, opts(roleBtns));
      return wrap;
    },
    card(b, ctx) {
      const f = [["gem", "助教（Gem 名稱）"], ["reviewer", "審查員（Gem 名稱）"], ["where", "明天從哪裡打開"]];
      const inputs = f.map(([k, l]) => { const i = h("input", { type: "text", "aria-label": l }); i.value = ((ctx.st().sheet || {}).card || {})[k] || ""; return [k, l, i]; });
      const msg = h("span", { "aria-live": "polite" });
      return h("div", { class: "block" }, h("p", {}, "我的小隊名片（設計單背面最上面）"), inputs.map(([k, l, i]) => h("label", {}, l, i)), actions(
        h("button", Object.assign(submitAttrs(b.id), { onclick: e => press(e.currentTarget, () => { ctx.sheet("card", Object.fromEntries(inputs.map(([k, , i]) => [k, i.value]))); ctx.done(b.id); msg.className = "ok-msg"; msg.textContent = "✓ 已存名片"; }) }), "存名片"), msg));
    },
    plan(b, ctx) {
      const w = [["w1", "第 1 週：把小隊給哪位同事試用？寫他的名字"], ["w2", "第 2 週：從附錄再拿哪一份做法，做成新的 Gem？"], ["w3", "第 3 週：挑哪一件真的工作讓小隊跑一次？"]];
      const inputs = w.map(([k, l]) => { const i = h("input", { type: "text", "aria-label": l }); i.value = ((ctx.st().sheet || {}).plan || {})[k] || ""; return [k, l, i]; });
      const msg = h("span", { "aria-live": "polite" });
      return h("div", { class: "block" }, inputs.map(([k, l, i]) => h("label", {}, l, i)), actions(
        h("button", Object.assign(submitAttrs(b.id), { onclick: e => press(e.currentTarget, () => {
          if (!inputs[0][2].value.trim()) { msg.className = "bad-msg"; msg.textContent = "第 1 週一定要寫一位同事的名字"; return false; }
          ctx.sheet("plan", Object.fromEntries(inputs.map(([k, , i]) => [k, i.value]))); ctx.done(b.id); msg.className = "ok-msg"; msg.textContent = "✓ 已存計畫";
        }) }), "存計畫"), msg),
        actions(h("a", { class: "btn primary", href: "takeaway.html?s=" + encodeURIComponent(window.LU_CFG.session), target: "_blank", rel: "noopener" }, "產生我的設計單（可列印）")));
    },
    title(b, ctx) {   // 收尾關：領取結業稱號（T10 集換卡）。領了才揭曉；第一次背面朝上，按「翻開我的卡」才翻；存在 st.claim／st.cardSeen，重新整理還在，按「重新計算」才更新
      const L = window.LU, wrap = h("div", { class: "block", "aria-live": "polite" });
      const name = id => ((L.TITLES.find(x => x.id === id) || {}).name || "");
      let again = null;
      const claim = () => { const s = ctx.st(); ctx.claim(Object.assign({ score: L.score(s) }, L.titles(s))); show(); };
      function show() {
        const c = ctx.st().claim;
        if (!c || !c.main) {
          wrap.replaceChildren(h("p", {}, "積分最後才揭曉：按下去，看看你今天拿到什麼稱號、總積分多少（不排名，投影幕也不列名字）"),
            actions(h("button", { class: "btn primary", onclick: e => press(e.currentTarget, claim) }, "領取我的稱號")));
          return;
        }
        const d = cardData(ctx.st()), also = (c.also || []).map(name).filter(Boolean), seen = !!ctx.st().cardSeen;
        const flipBtn = h("button", { class: "btn primary", type: "button" }, "翻開我的卡");
        const back = h("div", { class: "tface tback" }, h("span", { class: "q", "aria-hidden": "true" }, "?"), h("p", {}, "AI 升級之路｜結業卡"), flipBtn);
        const art = h("img", { alt: `${d.lvText} 的造型` }); art.src = `img/avatar-lv${d.lv}.png`;
        const stats = h("dl", { class: "tc-stats" }, d.stats.map(([k, v, max, xp], i) => {
          const bar = h("i"); bar.style.width = Math.min(100, Math.round(v / max * 100)) + "%"; if (!calm()) bar.style.animationDelay = (900 + i * 80) + "ms";
          return [h("dt", {}, k), h("dd", {}, h("div", { class: "bar" + (xp ? " xp" : "") }, bar)), h("dd", { class: "v" }, String(v))];
        }).flat());
        const card = h("article", { class: "tface tcard", "aria-label": "結業卡", tabindex: "-1" },
          h("header", { class: "tc-top" }, h("span", {}, "AI 升級之路｜結業卡"), h("span", {}, d.no)),
          h("div", { class: "tc-art" }, art, h("span", { class: "tc-lvtag" }, d.lvText)),
          h("div", { class: "tc-plate" }, h("p", { class: "tc-kicker" }, "你的結業稱號"), h("h3", { class: "tc-name" }, d.name)),
          h("p", { class: "tc-why" }, d.why), stats,
          h("footer", { class: "tc-foot" }, h("span", {}, "總積分"), h("strong", {}, String(d.total)), h("span", {}, d.foot)));
        const inner = h("div", { class: "tflip-in" }, back, card), flip = h("div", { class: "tflip" + (seen ? " open" : "") }, inner);
        let outer = null;
        const faces = () => { const open = String(flip.className).split(" ").includes("open"); if (outer) outer.className = "title-card" + (open ? "" : " closed"); back.inert = open; card.inert = !open; back.setAttribute("aria-hidden", String(open)); card.setAttribute("aria-hidden", String(!open)); };
        faces();
        flipBtn.addEventListener("click", () => { ctx.set({ cardSeen: true }); flip.className = "tflip open reveal"; faces(); if (card.focus) card.focus({ preventScroll: true }); });   // 翻開後焦點交給卡片（背面的按鈕已經藏起來）   // 只有這一下播翻面＋反光＋長條長出來
        flip.addEventListener("animationend", e => { if (e && e.animationName === "sheen") flip.className = String(flip.className).split(" ").filter(x => x !== "reveal").join(" "); });
        tilt(flip, card);
        const msg = h("span", { "aria-live": "polite" }), saveBox = h("div", { class: "tc-save" });
        const saveBtn = h("button", { class: "btn", type: "button" }, "存成圖片");
        saveBtn.addEventListener("click", () => saveCard(cardData(ctx.st()), msg, saveBox));
        again = h("button", { class: "btn", onclick: () => { claim(); flash(again, "✓ 已重新計算", 3000); } }, "重新計算");   // claim 會重畫卡片，閃的是新的那顆
        outer = h("div", { class: "title-card" }, h("div", { class: "tc-stage" }, flip),
          also.length ? h("p", { class: "tc-also" }, "也符合：" + also.join("、")) : "",
          actions(again, saveBtn, h("a", { class: "btn primary", href: "takeaway.html?s=" + encodeURIComponent(window.LU_CFG.session), target: "_blank", rel: "noopener" }, "存到設計單"), msg), saveBox);
        faces(); wrap.replaceChildren(outer);
      }
      show();
      return wrap;
    },
    link(b) {   // 另開分頁的連結鈕；不給經驗值、不算任務
      return h("div", { class: "block" }, actions(h("a", { class: "btn primary", href: b.href, target: "_blank", rel: "noopener" }, b.label)));
    },
    demo(b, ctx) {
      return h("div", { class: "block" }, b.cards.map(c => h("div", { class: "stage demo" },
        h("div", { class: "pixel-wrap", "aria-hidden": "true" }), h("strong", {}, `Lv.${c.lv}　${c.title}`), h("p", {}, c.note),
        c.url ? h("a", { class: "btn demo", href: c.url, target: "_blank", rel: "noopener", onclick: e => { ctx.done(b.id); flash(e.currentTarget, "✓ 已打開", 3000); } }, "自己點開看") : h("span", { class: "step-no" }, "講師示範中"))));
    }
  };
  window.BLOCKS = { h, R, textOf, flash, press, tableName, geminiLink, cardData, drawCard, teach, unwatchAll: () => { watchers.length = 0; }, watching: () => watchers.length };
})();

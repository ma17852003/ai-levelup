// 畫面元件：依 stages.js 的 block 畫出來。只用 DOM API，不用 innerHTML 塞使用者輸入（防 XSS）
// ctx = { st(), done(id, extra), sheet(field, value), set(patch), send(item), luc }
// 每次都呼叫 ctx.st() 取最新狀態，不快取、不修改它回傳的物件
(function () {
  const h = (tag, attrs, ...kids) => { const e = document.createElement(tag); Object.entries(attrs || {}).forEach(([k, v]) => { if (k === "class") e.className = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); }); kids.flat().forEach(k => e.append(k && k.nodeType ? k : String(k == null ? "" : k))); return e; };
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
  const watchers = [], notify = () => watchers.forEach(f => f());   // 填格改字時，通知依賴它的紙卡（拷問提示詞帶入第 1 格）
  // 送出類訊息要老實：先說「已記下」，flush 完還有東西排隊就說網路恢復後自動送
  function report(ctx, msg, okText, p) {
    msg.className = "ok-msg"; msg.textContent = "✓ 已記下，傳送中…";
    Promise.resolve(p).then(() => { msg.textContent = (ctx.pending ? ctx.pending() : 0) > 0 ? "✓ 已記下，網路恢復後自動送出" : okText; }, () => {});
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
  const R = {
    copy(b, ctx) {
      const get = () => {
        let t = textOf(ctx.luc, b.from);
        if (b.fill === "first") { const f = String((ctx.st().sheet || {}).first || "").trim().slice(0, 40); if (f) t = t.split("（一件事）").join(f); }
        return t;
      };
      const paper = h("div", { class: "paper" }, get()), msg = h("span", { "aria-live": "polite" }), manual = h("span", {});
      if (b.fill) watchers.push(() => { const t = get(); if (paper.textContent !== t) paper.textContent = t; });
      return h("div", { class: "block" }, h("p", {}, b.label), paper,
        h("button", { class: "btn copy", onclick: async e => {
          const btn = e.currentTarget; let ok = false;
          try { await navigator.clipboard.writeText(get()); ok = true; } catch (e) { ok = false; }
          if (ok) { msg.textContent = "✓ 已複製，到 Gemini 貼上"; flash(btn, "✓ 已複製", 3000); manual.replaceChildren(); if (b.id) ctx.done(b.id); return; }
          msg.textContent = "複製沒成功，請手動選取上面文字複製";   // 失敗不算完成
          if (b.id) manual.replaceChildren(" ", h("button", { class: "btn small manual", onclick: () => { ctx.done(b.id); msg.textContent = "✓ 已記錄手動複製"; manual.replaceChildren(); } }, "我已手動複製"));
        } }, "複製"), " ", msg, manual);
    },
    text(b, ctx) {
      const ta = h("textarea", { rows: b.rows || 3, "aria-label": b.label }); ta.value = (ctx.st().sheet || {})[b.field] || "";
      const msg = h("span", { "aria-live": "polite" });
      ta.addEventListener("input", () => { ctx.sheet(b.field, ta.value); notify(); });   // 每打一個字都存本機，重新整理不會不見
      return h("div", { class: "block" }, h("label", {}, b.label), ta,
        h("button", Object.assign(submitAttrs(b.id), { onclick: e => press(e.currentTarget, () => {
          if (ta.value.trim().length < (b.min || 1)) { msg.className = "bad-msg"; msg.textContent = `再多寫一點（至少 ${b.min} 個字）`; return false; }
          ctx.done(b.id); msg.className = "ok-msg"; msg.textContent = "✓ 交件完成";
        }) }), "交件 EXP"), " ", msg);
    },
    check(b, ctx) {
      return h("div", { class: "block" }, b.items.map(it => {
        const box = h("input", { type: "checkbox", id: "c-" + it.id }); box.checked = !!(ctx.st().done || {})[it.id];
        box.addEventListener("change", () => { if (box.checked) ctx.done(it.id); });
        return h("label", { class: "check", for: "c-" + it.id }, box, " ", it.label);
      }));
    },
    guess(b, ctx) {
      const out = h("div", { "aria-live": "polite" });
      const sample = () => b.sample && ctx.luc[b.sample] ? h("details", {}, h("summary", {}, "看 AI 真的怎麼回答（2026-11-12 實測）"), h("div", { class: "paper" }, ctx.luc[b.sample])) : "";   // 揭曉後才給
      const show = pick => { out.replaceChildren(h("p", { class: pick === b.answer ? "ok-msg" : "bad-msg" }, pick === b.answer ? "✓ 猜對了" : "✗ 再看看"), h("p", {}, b.reveal), sample()); if (!(ctx.st().done || {})[b.id]) { ctx.send({ kind: "vote", key: b.id, value: pick }); ctx.done(b.id); } };   // 第一次作答才送，投影幕畫分布
      if ((ctx.st().done || {})[b.id]) out.replaceChildren(h("p", { class: "ok-msg" }, "✓ 已完成"), h("p", {}, b.reveal), sample());
      return h("div", { class: "block" }, h("p", {}, b.q), b.options.map(o => h("button", { class: "btn", onclick: () => show(o.key) }, o.key + "　" + o.label)), out);
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
      const ticks = b.options.map(() => h("span", { class: "tick", "aria-hidden": "true" }));   // 選中時顯示 ✓（位置固定，不推動文字）
      const mark = (i, on) => { btns[i].setAttribute("aria-pressed", String(on)); ticks[i].textContent = on ? "✓" : ""; };
      const btns = b.options.map((o, i) => h("button", { class: "btn", "aria-pressed": "false", onclick: () => {
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
        const extra = b.id === "open.self" ? { self0: Math.max(...Array.from(chosen).map(k => "ABCDEFG".indexOf(k) + 1)) } : b.id === "end.self" ? { self1: Number(value) } : {};
        const q = ctx.done(b.id, extra); submit.disabled = true;
        report(ctx, msg, "✓ 已送出（要改可以再按一次重新送出）", Promise.all([p, q])); reveal.textContent = revealFor();
      }) }), "送出");
      if ((ctx.st().done || {})[b.id]) { msg.textContent = "✓ 已送出"; reveal.textContent = revealFor(); }
      return h("div", { class: "block" }, h("p", {}, b.q), btns, submit, " ", msg, reveal);
    },
    sort(b, ctx) {
      // 點選式：先點卡、再點桶（拖拉對中年使用者不友善，點兩下一樣能分）；也支援拖拉
      let picked = null, finished = false; const msg = h("p", { "aria-live": "polite" });
      const cards = b.cards.map((c, i) => { const el = h("button", { class: "chip", draggable: "true", "data-i": i, onclick: e => { if (e && e.stopPropagation) e.stopPropagation(); picked = i; cards.forEach(x => x.setAttribute("aria-pressed", "false")); el.setAttribute("aria-pressed", "true"); } }, c.label); el.addEventListener("dragstart", () => { picked = i; }); return el; });
      const place = {};
      const buckets = b.buckets.map((k, bi) => { const lid = "bk-" + b.id + "-" + bi;
        const zone = h("div", { class: "bucket", role: "button", tabindex: "0", "aria-labelledby": lid }, shapeMark(k.shape), h("strong", { id: lid }, k.label));
        const drop = () => { if (picked == null) return; const card = cards[picked]; zone.append(card); place[picked] = k.key; picked = null; if (card.focus) card.focus(); check(); };
        zone.addEventListener("click", drop);
        zone.addEventListener("keydown", e => { if (e.target !== zone) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); drop(); } }); zone.addEventListener("dragover", e => e.preventDefault()); zone.addEventListener("drop", e => { e.preventDefault(); drop(); });
        return zone; });
      function check() {
        if (Object.keys(place).length < b.cards.length) return;
        const wrong = b.cards.filter((c, i) => place[i] !== c.bucket).map(c => c.label);
        if (wrong.length) { msg.className = "bad-msg"; msg.textContent = "✗ 再想想：" + wrong.join("、"); }
        else { msg.className = "ok-msg"; msg.textContent = "✓ 全對"; if (!finished && !(ctx.st().done || {})[b.id]) { finished = true; ctx.done(b.id); } }
      }
      if ((ctx.st().done || {})[b.id]) { msg.className = "ok-msg"; msg.textContent = "✓ 已完成，可以重新練習"; }
      return h("div", { class: "block" }, h("p", {}, b.q), h("div", { class: "pool" }, cards), h("div", { class: "buckets" }, buckets), msg);
    },
    pass(b, ctx) {
      const sel = h("select", { "aria-label": "過了幾題" }, [0, 1, 2, 3, 4, 5].map(n => h("option", { value: n }, n + " 題")));
      sel.value = String(ctx.st().pass || 0);
      const msg = h("span", { "aria-live": "polite", class: "ok-msg" }, (ctx.st().done || {})[b.id] ? `✓ 已交件：過了 ${ctx.st().pass || 0} 題` : "");
      return h("div", { class: "block" }, h("label", {}, "鄰座唸你寫的題目、你自己打字、鄰座打分：你的 Gem 過了幾題？"), sel,
        h("button", Object.assign(submitAttrs(b.id), { onclick: e => press(e.currentTarget, () => { const q = ctx.done(b.id, { pass: Number(sel.value) }); report(ctx, msg, `✓ 已交件：過了 ${sel.value} 題`, q); }) }), "交件 EXP"), " ", msg,
        h("p", { class: "step-no" }, "過 4 題以上就升到 Lv.4 專員；沒過的題目，回家補進指令或參考資料"));
    },
    caught(b, ctx) {
      const boxes = b.items.map((x, i) => { const c = h("input", { type: "checkbox", id: "cg" + i }); return [c, h("label", { for: "cg" + i }, c, " ", x)]; });
      const st = ctx.st(), saved = h("p", { class: "ok-msg", "aria-live": "polite" }, (st.done || {})[b.id] && typeof st.caught === "number" ? `✓ 已送出：抓到 ${st.caught} 個` : "");
      return h("div", { class: "block" }, h("p", {}, "1:35 揭曉後：你們這組抓到了哪幾個？"), boxes.map(x => x[1]),
        h("button", Object.assign(submitAttrs(b.id), { onclick: e => press(e.currentTarget, () => { const n = boxes.filter(x => x[0].checked).length; const q = ctx.done(b.id, { caught: n }); report(ctx, saved, `✓ 已送出：抓到 ${n} 個`, q); }) }), "送出"), saved);
    },
    relay(b, ctx) {
      const wrap = h("div", { class: "block" });
      const roles = { A: ["寫手", "roleA", null], B: ["審查員", "roleB", "A"], C: ["格式員", "roleC", "B"] };
      const prevBox = h("div", { class: "paper", "aria-live": "polite" }, "等前一棒交棒…");
      function body() {
        const st = ctx.st(), r = roles[st.relayRole], ta = h("textarea", { rows: 8, maxlength: 6000, "aria-label": "貼上你的成果" }), msg = h("span", { "aria-live": "polite" });
        const count = h("span", { class: "step-no" }, "0 / 6000 字"), go = h("button", submitAttrs("s5.relay"), "交棒");
        wrap.replaceChildren(h("p", {}, `你是第 ${st.relayGroup} 組的 ${st.relayRole} ${r[0]}`),
          h("details", { open: "" }, h("summary", {}, "原始資料（三個人都一樣，裡面藏了 3 個錯）"), h("div", { class: "paper" }, ctx.luc.relayData)),
          R.copy({ label: `${r[0]}的指令：整段複製到 Gemini`, from: r[1] }, ctx),
          r[2] ? h("div", {}, h("p", {}, `前一棒（${r[2]}）交給你的：`), prevBox) : "",
          h("label", {}, "把 AI 做好的成果整段貼在這裡，按「交棒」"), ta, h("div", {}, count),
          go, " ", msg);
        ta.addEventListener("input", () => { count.textContent = `${ta.value.length} / 6000 字`; go.disabled = false; });   // 改了內容才能再交
        go.addEventListener("click", () => press(go, () => {
            if (ta.value.trim().length < 20) { msg.className = "bad-msg"; msg.textContent = "成果太短，整段貼上"; return false; }
            const p = ctx.send({ kind: "relay", team: st.relayGroup, key: st.relayRole, value: ta.value.slice(0, 6000) });
            const q = ctx.done("s5.relay"); go.disabled = true; report(ctx, msg, "✓ 已交棒。要改就修改內容再按一次", Promise.all([p, q]));
        }));
        window.RELAY_UPDATE = texts => { const prev = r[2] && texts[r[2]]; if (prev && prevBox.textContent !== prev) prevBox.textContent = prev; };
      }
      if (ctx.st().relayGroup && ctx.st().relayRole) { body(); return wrap; }
      const team = ctx.st().team, isOnline = /線上/.test(team);
      const gsel = h("select", { "aria-label": "組別" }, [1, 2, 3].map(n => h("option", { value: n }, `第 ${n} 組`)));
      const roleBtns = Object.keys(roles).filter(k => !(isOnline && k === "C")).map(k => h("button", { class: "btn", onclick: () => {
        ctx.set({ relayGroup: `${team}-${gsel.value}`, relayRole: k });   // 只記組別和角色；交棒時才算完成任務
        body();
      } }, `${k} ${roles[k][0]}`));
      wrap.append(h("p", {}, "三人一組（線上兩人）：選你們這組的編號，再選你的角色"), gsel, ...roleBtns);
      return wrap;
    },
    card(b, ctx) {
      const f = [["gem", "專員（Gem 名稱）"], ["reviewer", "審查員（Skill 或 Gem，怎麼叫出來）"], ["where", "明天從哪裡打開"]];
      const inputs = f.map(([k, l]) => { const i = h("input", { type: "text", "aria-label": l }); i.value = ((ctx.st().sheet || {}).card || {})[k] || ""; return [k, l, i]; });
      const msg = h("span", { "aria-live": "polite" });
      return h("div", { class: "block" }, h("p", {}, "我的小隊名片（設計單背面最上面）"), inputs.map(([k, l, i]) => h("label", {}, l, i)),
        h("button", Object.assign(submitAttrs(b.id), { onclick: e => press(e.currentTarget, () => { ctx.sheet("card", Object.fromEntries(inputs.map(([k, , i]) => [k, i.value]))); ctx.done(b.id); msg.className = "ok-msg"; msg.textContent = "✓ 已存名片"; }) }), "存名片"), " ", msg);
    },
    plan(b, ctx) {
      const w = [["w1", "第 1 週：把小隊給哪位同事試用？寫他的名字"], ["w2", "第 2 週：從 Skill 包再加哪一份？"], ["w3", "第 3 週：挑哪一件真的工作讓小隊跑一次？"]];
      const inputs = w.map(([k, l]) => { const i = h("input", { type: "text", "aria-label": l }); i.value = ((ctx.st().sheet || {}).plan || {})[k] || ""; return [k, l, i]; });
      const msg = h("span", { "aria-live": "polite" });
      return h("div", { class: "block" }, inputs.map(([k, l, i]) => h("label", {}, l, i)),
        h("button", Object.assign(submitAttrs(b.id), { onclick: e => press(e.currentTarget, () => {
          if (!inputs[0][2].value.trim()) { msg.className = "bad-msg"; msg.textContent = "第 1 週一定要寫一位同事的名字"; return false; }
          ctx.sheet("plan", Object.fromEntries(inputs.map(([k, , i]) => [k, i.value]))); ctx.done(b.id); msg.className = "ok-msg"; msg.textContent = "✓ 已存計畫";
        }) }), "存計畫"), " ", msg,
        h("a", { class: "btn primary", href: "takeaway.html?s=" + encodeURIComponent(window.LU_CFG.session), target: "_blank", rel: "noopener" }, "產生我的設計單（可列印）"));
    },
    demo(b, ctx) {
      return h("div", { class: "block" }, b.cards.map(c => h("div", { class: "stage demo" },
        h("div", { class: "pixel-wrap", "aria-hidden": "true" }), h("strong", {}, `Lv.${c.lv}　${c.title}`), h("p", {}, c.note),
        c.url ? h("a", { class: "btn demo", href: c.url, target: "_blank", rel: "noopener", onclick: e => { ctx.done(b.id); flash(e.currentTarget, "✓ 已打開", 3000); } }, "自己點開看") : h("span", { class: "step-no" }, "講師示範中"))));
    }
  };
  window.BLOCKS = { h, R, textOf, flash, press };
})();

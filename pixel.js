// 像素 AI 小人：12×16 格，每格 4px。介面色用 CSS 變數（跟著主題走）；臉、眼睛、襯衫、西裝是小人本身的顏色
(function () {
  const BASE = [   // [x, y, w, h, 顏色]：Lv.1 本體（頭、身體、腳、眼睛）
    [4, 1, 4, 4, "#F2C9A0"], [3, 5, 6, 6, "var(--muted)"], [4, 11, 1, 4, "var(--fg-dim)"], [7, 11, 1, 4, "var(--fg-dim)"], [5, 2, 1, 1, "#12162A"], [7, 2, 1, 1, "#12162A"]
  ];
  const GEAR = {
    2: [[5, 6, 2, 2, "#EEF0F7"]],                                                        // 工作證
    3: [[5, 5, 1, 2, "var(--cool)"], [6, 5, 1, 2, "var(--cool)"], [9, 7, 2, 3, "#F5EFE1"]],   // 識別證掛繩＋筆記本
    4: [[6, 5, 1, 5, "var(--gold)"], [5, 5, 1, 1, "#EEF0F7"], [7, 5, 1, 1, "#EEF0F7"]]  // 金領帶＋襯衫領（最後畫，壓在工作證之上）
  };
  const SUIT = [3, 5, 6, 6, "#6070B5"];   // 西裝：先畫，之後的裝備疊在上面，不會被蓋住（對 #12162A 3.82:1、對 #1C2242 3.30:1）
  function rects(lv) {
    if (lv >= 5) return BASE.slice(0, 4).map(r => [r[0], r[1], r[2], r[3], "var(--cool)"]);
    let out = BASE.slice();
    if (lv >= 4) out.push(SUIT);
    for (let g = 2; g <= Math.min(lv, 3); g++) out = out.concat(GEAR[g]);
    if (lv >= 4) out = out.concat(GEAR[4]);
    return out;
  }
  function svg(lv) {
    const L = window.LU.LEVELS[lv - 1];
    const body = rects(lv).map(([x, y, w, h, c]) => `<rect x="${x * 4}" y="${y * 4}" width="${w * 4}" height="${h * 4}" fill="${c}"/>`).join("");
    return `<svg class="pixel" viewBox="0 0 48 64" width="48" height="64" shape-rendering="crispEdges" role="img" aria-label="Lv.${lv} ${L.name}">${body}</svg>`;
  }
  window.PIXEL = { svg };
})();

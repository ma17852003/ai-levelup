// 角色頭像門面：優先用 img/avatar-lv*.png；圖載不到就退回 pixel.js 的小人（固定格式 SVG，沒有使用者輸入）
(function () {
  function el(lv, px) {
    const L = window.LU.LEVELS[lv - 1], img = document.createElement("img");
    img.src = `img/avatar-lv${lv}.png`;
    img.alt = `Lv.${lv} ${L.name}`;
    img.width = px; img.height = Math.round(px * 1.25);   // 原圖 512×640
    img.className = "avatar";
    img.onerror = () => {
      img.onerror = null;
      const w = document.createElement("span");
      w.className = "avatar avatar-fb";
      w.style.width = px + "px";
      w.innerHTML = window.PIXEL.svg(lv);
      if (img.replaceWith) img.replaceWith(w); else if (img.parentNode) img.parentNode.replaceChild(w, img);
    };
    return img;
  }
  window.AVATAR = { el };
})();

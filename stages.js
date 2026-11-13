// 關卡資料：跟 PPT v9 一頁一頁對齊。只放資料，畫面由 blocks.js 畫
window.STAGES = [
  { id: "s0", title: "報到", time: "13:40", ppt: "第 1～4 頁", blocks: [
    { type: "text", id: "s0.first", field: "first", label: "如果明天多一位助理，你第一件想丟給他的事是什麼？（設計單第 1 格）", rows: 2, min: 4 } ] },
  { id: "open", title: "開場：AI 的七個等級", time: "14:05", ppt: "第 5～9 頁", blocks: [
    { type: "vote", id: "open.self", q: "你現在用 AI 做到哪幾種？（可以選不只一個）", multi: true, options: [
      { key: "A", label: "問問題、查資料" }, { key: "B", label: "有一段常用提示詞" }, { key: "C", label: "有自己的 Gem 或 GPT" },
      { key: "D", label: "我的 Gem 同事也在用" }, { key: "E", label: "用 AI 做出能點開的小工具" }, { key: "F", label: "沒打開 AI，它也會自己做事" },
      { key: "G", label: "好幾個 AI 分工、互相檢查" } ] },
    { type: "vote", id: "open.agent", q: "看完 Deep Research（深入研究：AI 自己上網查很多資料寫成報告），它有沒有做到這四件事？", multi: true, options: [
      { key: "goal", label: "有目標" }, { key: "tool", label: "會用工具" }, { key: "steps", label: "自己決定步驟" }, { key: "start", label: "自己啟動" } ] } ] },
  { id: "s1", title: "讓 AI 拷問你", time: "14:14", ppt: "第 10～14 頁", blocks: [
    { type: "guess", id: "s1.guess", q: "同一句「幫我寫招生參訪日公告」，哪一種拿到的比較合用？",
      options: [{ key: "A", label: "直接丟給 AI" }, { key: "B", label: "先讓 AI 一題一題問你" }], answer: "B", sample: "sampleDirect",
      reveal: "直接丟，AI 只能猜：日期、對象、名額都可能自己編。先被問清楚，它才知道你要什麼。" },
    { type: "copy", id: "s1.copy", label: "拷問提示詞：整段複製。你在第 1 格寫了的話，會自動帶進「（　）」裡", from: "grill", fill: "first" },
    { type: "text", id: "s1.brief", field: "brief", label: "把 AI 整理的需求單重點貼回來（設計單第 2、3 格）", rows: 6, min: 30 },
    { type: "copy", id: "s1.instr", label: "升級時刻①：在同一個對話打這句，把結果複製起來，下一關建 Gem 用", from: "toInstr", noOpen: true } ] },
  { id: "s2", title: "做一個審查員", time: "14:40", ppt: "第 15～19 頁", blocks: [
    { type: "sort", id: "s2.sort", q: "這些是「員工」（Gem）還是「做法」（Skill＝SOP，標準作業流程：寫好的一套做事步驟）？", buckets: [
      { key: "gem", label: "Gem＝一位員工", shape: "circle" }, { key: "skill", label: "Skill＝一本 SOP", shape: "square" } ],
      cards: [ { label: "招生公告助理", bucket: "gem" }, { label: "審查的做法", bucket: "skill" }, { label: "公文潤稿的做法", bucket: "skill" },
               { label: "活動企劃助理", bucket: "gem" }, { label: "學務問答助理", bucket: "gem" }, { label: "活動企劃檢查的做法", bucket: "skill" } ] },
    { type: "check", items: [ { id: "s2.gem", label: "用上一關複製的指令，建好今天的專員 Gem，問一題拿到一段成果" } ] },
    { type: "acct",
      personal: [ { type: "copy", label: "審查員全文：設定 → Skills → 建立，指令欄整段貼上（名稱不收中文就打 reviewer）", from: "reviewer" },
                  { type: "check", items: [ { id: "s2.reviewer", label: "審查員 Skill 建好了" }, { id: "s2.call", label: "在對話打 @（舊版是 /），叫出審查員，檢查專員的成果" } ] } ],
      school: [ { type: "copy", label: "審查員全文：新增一個 Gem，取名「審查員」，指令欄整段貼上", from: "reviewer" },
                { type: "check", items: [ { id: "s2.reviewer", label: "審查員 Gem 建好了" }, { id: "s2.call", label: "打開審查員 Gem，貼上專員的成果和原始資料" } ] } ] } ] },
  { id: "s3", title: "AI 怎麼找資料", time: "14:55", ppt: "第 20～23 頁", blocks: [
    { type: "guess", id: "s3.guess", q: "「五專二年級請兩天病假，要經過誰核准？」三種找資料的方法，哪一種會答錯？",
      options: [{ key: "A", label: "整包讀" }, { key: "B", label: "向量資料庫" }, { key: "C", label: "目錄＋翻書" }], answer: "B",
      reveal: "2026-11-10 講師實測：向量資料庫預設設定答「查不到」，調整後從午休規定推成「班導師核准」，錯。整包讀答對但出處寫錯；目錄＋翻書答對，出處還是要自己點開對。" },
    { type: "copy", label: "目錄格式範例", from: "tocExample" },
    { type: "text", id: "s3.toc", field: "toc", label: "寫你自己的參考資料目錄，3 行（設計單第 4 格）：檔名｜管什麼｜給誰｜關鍵字", rows: 4, min: 15 } ] },
  { id: "s4", title: "幫你的 Gem 出考卷", time: "15:06", ppt: "第 25～29 頁", blocks: [
    { type: "guess", id: "s4.break", q: "同一題，拿掉參考資料再問一次，AI 會怎樣？", options: [{ key: "A", label: "說「查不到」" }, { key: "B", label: "編一個聽起來很對的答案" }], answer: "B", sample: "sampleNoDoc",
      reveal: "沒給資料，AI 通常不會說不知道。所以要給資料，還要考試。" },
    { type: "text", id: "s4.write", field: "traps", label: "照五種陷阱，各寫一題考你的 Gem（設計單第 5 格）。例子見下方紙卡", rows: 6, min: 30 },
    { type: "copy", label: "五種陷阱題範例（查規定型／寫東西型）", from: "traps" },
    { type: "pass", id: "s4.pass" },
    { type: "sort", id: "s4.light", q: "這些資料能不能交給 AI？", buckets: [
      { key: "g", label: "綠燈：可以給", shape: "circle" }, { key: "y", label: "黃燈：處理過再給", shape: "triangle" }, { key: "r", label: "紅燈：不能給", shape: "square" } ],
      cards: [ { label: "學校公開的請假辦法", bucket: "g" }, { label: "課程大綱", bucket: "g" }, { label: "會議紀錄（有同事名字）", bucket: "y" },
               { label: "內部活動企劃", bucket: "y" }, { label: "學生成績單", bucket: "r" }, { label: "全班身分證字號", bucket: "r" } ] } ] },
  { id: "s5", title: "組一支 AI 小隊", time: "15:22", ppt: "第 30～35 頁", blocks: [
    { type: "relay" },
    { type: "caught", id: "s5.caught", items: ["星期對不上（12/5 是星期六）", "人數對不上（3 × 25 = 75 人，不是 60）", "兩個報到地點（圖書館／行政大樓）"] },
    { type: "check", items: [ { id: "s5.team", label: "幫我的專員配好審查員，跑過一次：專員做 → 審查員抓錯 → 我決定" } ] },
    { type: "card", id: "s5.card" } ] },
  { id: "s6", title: "講師示範：Lv.5～7", time: "15:43", ppt: "第 36～38 頁", demo: true, blocks: [
    { type: "demo", id: "s6.demo", cards: [
      { lv: 5, title: "Canvas 小工具：抽籤分組器", url: "https://share.gemini.google/SUv6NIvU50jb", note: "講師用 Gemini Canvas 做的，點開就能玩（資料只存在你的瀏覽器）" },
      { lv: 6, title: "排程任務：每週一自己整理的研究報告", url: "", note: "講師示範畫面" },
      { lv: 7, title: "講師的 AI 部門（3D 辦公室）", url: "https://ma17852003.github.io/jamesaistartup-site/office/?demo=1", note: "80 位 AI 員工分部門上班" } ] } ] },
  { id: "end", title: "收尾：你升了幾級", time: "15:51", ppt: "第 39～42 頁", blocks: [
    { type: "vote", id: "end.vote", q: "今天的小隊，做到 AI Agent 的哪幾件事？", multi: true, options: [
      { key: "goal", label: "有目標" }, { key: "tool", label: "會用工具" }, { key: "steps", label: "自己決定步驟" }, { key: "start", label: "自己啟動" } ] },
    { type: "vote", id: "end.self", q: "現在的你，用 AI 做到 A～G 哪一種了？（跟開場比一比）", multi: false, options: [
      { key: "1", label: "A 問問題" }, { key: "2", label: "B 常用提示詞" }, { key: "3", label: "C 自己的 Gem" }, { key: "4", label: "D 同事也在用" },
      { key: "5", label: "E 小工具" }, { key: "6", label: "F 自己會上班" }, { key: "7", label: "G 好幾個 AI 分工" } ] },
    { type: "plan", id: "end.plan" },
    { type: "link", href: "appendix.html", label: "打開附錄（Skill 包、提示詞卡、名詞卡全文）" } ] }
];

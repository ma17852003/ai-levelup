// 關卡資料：Claude 版（2026-11-20，22_Claude版課程規格.md 第三節；跟 09_課程簡報_Claude版 一頁一頁對齊）。只放資料，畫面由 blocks.js 畫
// path＝新手路線標籤（must 必做／all 全班一起／skip 可跳過）、tip＝關卡頂端提示、must＝必做小標
// learn＝上課卡，逐字照 23_Claude版上課卡.md（tests/stages.test.js 逐字比對，改卡片兩邊一起改）
// 2026-11-21 依 24_實測後修改規格.md：介面名稱照 James 免費帳號實測截圖（實測截圖\）改；中文名稱還沒實測到的標「（名稱以畫面為準）」
// 任務 id 沿用舊版的：s2.gem＝建好助教專案（core.js 的 Lv.3 條件）
window.STAGES = [
  { id: "s0", title: "報到", time: "13:40", ppt: "第 1、11 頁", path: "must", tip: "跟不上的話，只做標「必做」的就好，一樣升得到 Lv.4。",
    learn: [   // 上課卡（23_Claude版上課卡.md 逐字搬來）
      { type: "guess", mins: 0.5, title: "先猜：第 1 格寫哪一種事最划算？",
        question: "等一下要寫「如果明天多一位助理，你第一件想丟給他的事」。寫哪一種，今天帶回去最用得上？",
        options: ["一件一年才做一次的大事", "一件常常做、做到第三次就覺得煩的事", "一件跟工作無關的事"],
        answer: 1,
        explain: "今天每一段都拿這件事練習，最後帶走一支 Claude 小隊。挑常常做的事，明天就用得上。寫不出來，就想想最近哪件事你做到第三次就覺得煩。" },
      { type: "flip", mins: 1.5, title: "別人會丟給助理的事",
        intro: "這四件是今天課堂上會看到的例子。一張一張點開。",
        cards: [
          { label: "寫公告", zh: "招生組", analogy: "像每學期都要重貼的海報，版型一樣，只換日期和地點", example: "高中生校園參訪日公告，寫給高二學生看" },
          { label: "回答規定", zh: "學務處", analogy: "像櫃台一天被問十次的同一個問題", example: "「請兩天病假，要找誰核准？」" },
          { label: "潤公文", zh: "各處室", analogy: "像內容寫好了，只差請人幫你改成正式寫法", example: "把草稿改成「主旨、說明、辦理方式、聯絡人」的寫法" },
          { label: "檢查企劃", zh: "活動承辦", analogy: "像辦活動前，找一位細心的同事從頭幫你對一遍", example: "活動企劃送出前，檢查日期、人數、場地、預算有沒有漏" }
        ],
        reveal: { title: "你的那件事，就是今天的題目", text: "後面每一段都用它練習：讓 Claude 拷問你、做成助教專案、配一本審查員手冊、出考卷。第 1 格寫一句就好，後面幾關會慢慢把它補完整。" } }
    ],
    blocks: [
    // 2026-11-21 實測：用 Google 帳號登入；改語言在頭像選單，中文名稱沒實測到
    { type: "link", href: "https://claude.ai/new", label: "打開 Claude，用 Google 帳號登入" },
    // 進場三件事（簡報第 1 頁；實測 T01、T03、T04）：全教材同一組 ①語言 ②隱私權 ③指示，「建立與編輯檔案」附帶一句（實測 T02）
    // 任務 id 沿用舊的，不增減：s0.code 現在是 ①改語言
    { type: "check", must: true, items: [
      { id: "s0.code", label: "① 左下角頭像 → 語言 → 繁體中文（名稱以畫面為準）。介面已經是中文就直接打勾" },
      { id: "s0.train", label: "② 設定 → 隱私權 → 關「協助改善我們的 AI 模型」（預設是開的），對話才不會拿去訓練模型" },
      { id: "s0.pref", label: "③ 設定 → 您的 Claude → 指示，貼兩行：就是下面那張複製卡（第二行是請它開大案子前先拷問你）。順便看一眼：設定 → 功能 →「建立與編輯檔案」確認是開的（預設開），技能、Word 檔都要靠它；底下的「建立檔案時使用網際網路」先不用開：開了以後，Claude 做檔案時可以上網下載工具套件，官方標了有安全風險；做 Word、Excel、簡報一般不用開，它說缺工具時再打開" } ] },
    { type: "copy", label: "「指示」要貼的兩行：整段複製，貼進 設定 → 您的 Claude →「指示」", from: "myInstr", noOpen: true },
    { type: "text", id: "s0.first", must: true, field: "first", label: "如果明天多一位助理，你第一件想丟給他的事是什麼？（設計單第 1 格）", rows: 2, min: 4 } ] },
  { id: "open", title: "開場：先看成果、認識 Claude", time: "14:00", ppt: "第 2～16 頁", path: "all",
    learn: [   // 上課卡（23_Claude版上課卡.md 逐字搬來）
      { type: "flip", mins: 1, title: "投票前，先認得三個詞",
        intro: "等一下的投票和講師示範會用到這三個詞。一張一張點開。",
        cards: [
          { label: "提示詞", zh: "你打給 AI 的那段話", analogy: "像你寫給代課老師的交代字條", example: "「幫我把這段家長通知改得客氣一點」就是一段提示詞" },
          { label: "專案", zh: "存好指令和資料、打開就能用的專屬助教", analogy: "像已經熟悉班上狀況的固定代課老師，不用每次重講", example: "Claude 叫「專案」；ChatGPT 的 GPT 是同一種東西" },
          { label: "Claude Code", zh: "講師序幕用的付費版，會自己寫程式", analogy: "像一位會寫程式的工程師，你用講的，他把整個網站做出來", example: "你手上的闖關網頁、後面的投影幕、3D 辦公室，都是講師用講的請它寫出來的" }
        ],
        reveal: { title: "三個詞認得了，就可以投票", text: "等一下的 A～G 可以選不只一個，照你現在的樣子按，沒有對錯。今天教的是免費版 Claude，回家馬上能用；Claude Code 只看講師示範。" } },
      { type: "toggle", mins: 1, title: "交代一位新同事的 4 個開關",
        intro: "一顆一顆打開，看這位新同事變得多好用；全開之後，再關掉一顆看看。", lead: "你交代一位新同事：",
        parts: [
          { label: "有目標", say: "週五前把園遊會攤位報名整理成一張表，", off: "✗ 不知道做到哪裡算完成，做一半就停", on: "✓ 知道週五要交一張整理好的表" },
          { label: "會用工具", say: "報名表和信箱你自己打開來看，", off: "✗ 只能等你把資料一份一份貼給他", on: "✓ 自己打開報名表、自己查信箱" },
          { label: "自己決定步驟", say: "先做什麼後做什麼，你自己排，", off: "✗ 每做完一步就回來問你「接下來呢？」", on: "✓ 自己排先後，做完一步接下一步" },
          { label: "自己啟動", say: "每週一早上自己開始做。", off: "✗ 你沒開口，他就不動", on: "✓ 時間到自己開始，不用你按" }
        ],
        done: "四個開關全開，就叫 AI Agent（AI 代理人）：有目標、會用工具、自己決定步驟、自己啟動的 AI。今天一級一級往上升，最後一段再回來看：今天的小隊開了幾顆。" },
      { type: "flip", mins: 1.5, title: "對話、Cowork、Claude Code，還有模型和用量",
        intro: "Lv.1 講師會在畫面上指給你看。一張一張點開。",
        cards: [
          { label: "對話", zh: "一問一答，所有方案都有", analogy: "像打電話問水電師傅：他教你怎麼修，你自己動手", example: "今天整堂課都用「對話」" },
          { label: "Cowork", zh: "說要什麼結果，它自己拆步驟、做到交出成品", analogy: "像請師傅到家裡：你說哪裡壞，他自己修好，你在旁邊看得到每一步", example: "輸入框有「對話｜Cowork」切換；Cowork 是付費方案才有，點了會請你升級。今天只講概念，不操作" },
          { label: "Claude Code", zh: "給寫程式的人，付費方案才有", analogy: "像同一位師傅，你不在家，留紙條交代他：寫得越清楚，做得越好，所以適合會寫程式的人。跟 Cowork 是同一位師傅，一個在旁邊看著他做、一個留紙條交代", example: "開場的成果秀都是用它做的，今天只看講師示範" },
          { label: "模型", zh: "免費版有 Sonnet（預設）和 Haiku；Opus、Fable 要付費", analogy: "像處室裡不同的同事，各有專長，平常找預設那位就好", example: "Haiku 最快：短問答、翻譯、改錯字；Sonnet 日常主力：寫公告、整理資料；Opus 想更深：長文件、複雜規劃；Fable 最強：最難、最長的大任務。輸入框右下角點模型名稱可以換；「投入程度」越高想得越久越仔細，也越吃額度，平常用「中」" },
          { label: "用量", zh: "5 小時一個額度＋每週一個額度", analogy: "像影印額度，用完要等時間到才恢復", example: "官方不給數字；聊得越長、檔案越大、模型越大，用得越快。免費版看不到用了幾 %，撞到上限才跳提示，等時間到就恢復" }
        ],
        reveal: { title: "今天全部用「對話」", text: "Cowork、Claude Code 先知道是什麼就好。撞到用量上限不是壞掉，等時間到就恢復。" } }
    ],
    blocks: [
    // 序幕成果（簡報第 4～8 頁）：講師切畫面，學員想自己點開看也可以。順序照簡報：第 6 張迎賓台、第 8 張 3D 辦公室（25 號對照表）
    { type: "link", href: "https://ma17852003.github.io/banquet-ai/greet/host.html?e=demo", label: "講師示範：宴會課迎賓台（示範版）" },
    { type: "link", href: "https://ma17852003.github.io/jamesaistartup-site/office/?demo=1", label: "講師示範：80 位 AI 員工的 3D 辦公室（自己點開看）" },
    { type: "vote", id: "open.self", q: "你現在用 AI 做到哪幾種？（可以選不只一個）", multi: true, options: [
      { key: "A", label: "問問題、查資料" }, { key: "B", label: "有一段常用提示詞" }, { key: "C", label: "有自己的專案或 GPT" },
      { key: "D", label: "我的助教同事也在用" }, { key: "E", label: "用 AI 做出能點開的小工具" }, { key: "F", label: "沒打開 AI，它也會自己做事" },
      { key: "G", label: "好幾個 AI 分工，還會互相抓錯" } ] },
    // Lv.1 基本功（簡報第 12～16 頁；第 13、14 頁是 2026-11-21 新增的對話／Cowork／Code、模型和用量，在上課卡第 3 張）
    { type: "copy", label: "Lv.1 基本功① 上網查：貼到 Claude，看它有沒有自己上網、附上來源", from: "lv1Search" },
    // 2026-11-22 James：學員手上不一定有檔案 → 先給範例檔（學務處公開的《學生請假規定》）
    { type: "link", href: "files/leave-rules.txt", download: "學生請假規定_範例.txt", label: "下載範例檔：學生請假規定（學務處公開法規）" },
    { type: "copy", label: "② 讀檔案：先上傳一份公開的辦法或公告（PDF、Word 都可以；沒有就用上面的範例檔），再貼這句。學號、成績、身分證不要傳", from: "lv1File" },
    { type: "check", items: [
      { id: "open.search", label: "上網查了一題，它附了來源連結" },
      { id: "open.file", label: "讀了一份公開檔案，拿到 5 點重點" },
      { id: "open.switch", label: "找到三個小開關：記憶、語音、無痕對話" } ] } ] },
  { id: "s1", title: "讓 Claude 拷問你", time: "14:26", ppt: "第 17～22 頁", path: "must",
    learn: [   // 上課卡（23_Claude版上課卡.md 逐字搬來）
      { type: "toggle", mins: 1, title: "交代一件事的 6 個開關",
        intro: "例子：請 AI 幫你寫校外教學的家長通知。一顆一顆打開，看 AI 寫出來的東西怎麼變；全開之後，再關掉一顆看看。", lead: "你對 AI 說：",
        parts: [
          { label: "給誰用", say: "我是導師，通知要給家長看，", off: "✗ 口氣像寫給學生，家長看完不知道要做什麼", on: "✓ 用家長的角度寫，講清楚要家長做什麼" },
          { label: "什麼時候用", say: "每次校外教學前一週都要發，", off: "✗ 以為只寫這一次，下次又要從頭交代", on: "✓ 知道這是每次都會用到的固定工作" },
          { label: "步驟", say: "先讀活動資料，再寫通知，最後列出資料對不上的地方，", off: "✗ 直接寫，資料裡兜不攏的地方也照抄", on: "✓ 照順序做，最後把對不上的地方列給你看" },
          { label: "參考資料", say: "照我貼的活動資料和去年的通知寫，", off: "✗ 沒有資料，日期和集合地點只能用猜的", on: "✓ 照你給的資料寫，格式跟去年一樣" },
          { label: "怎樣算成功", say: "300 字內，日期、集合地點、費用、回條截止日都要有，", off: "✗ 寫了一大篇，回條截止日反而漏掉", on: "✓ 300 字內，四項資訊一項不少" },
          { label: "不能做的事", say: "資料沒有的費用或福利不准自己補，不放學生個資。", off: "✗ 自己加上「費用全免」，家長以為真的不用繳", on: "✓ 資料沒有的不寫，學生個資不碰" }
        ],
        done: "這 6 項寫清楚，就是一張「需求單」。少一項，AI 就要用猜的。等一下這關要交的，就是你那件事的需求單。報到時貼進「指示」的第二行，就是把拷問寫進去：以後每次開大案子，它都會先拷問你。" },
      { type: "match", mins: 1, title: "被 AI 問的時候，你回什麼？",
        intro: "先點一種情況，再點你該回的那句話。",
        targets: [
          { id: "yours", label: "「照你的」" },
          { id: "one", label: "「一次只問一題」" },
          { id: "fix", label: "「我改一下」" },
          { id: "ok", label: "「可以」" },
          { id: "instr", label: "「請把這份需求單改寫成一段 AI 助理的指令」" }
        ],
        items: [
          { text: "AI 問你要不要附交通方式，你沒想過", ans: "yours", why: "答不出來就回「照你的」。每一題它都附了建議答案，讓它幫你決定。" },
          { text: "AI 一口氣丟了五個問題", ans: "one", why: "AI 不聽話時，直接講它哪裡不對，它就會改。" },
          { text: "AI 以為通知是給學生看的，其實是給家長", ans: "fix", why: "方向不對直接說「我改一下」，不用重來。" },
          { text: "需求單整理好了，你看過沒問題", ans: "ok", why: "你說「可以」，它才算問完。" },
          { text: "需求單好了，下一關要拿去建專案", ans: "instr", why: "這就是升級時刻①：在同一個對話打這句，把結果複製起來，下一關貼進助教專案。" }
        ] }
    ],
    blocks: [   // 2026-11-20 James：先猜（s1.guess，揭曉附 AI 實測回答）拿掉
    { type: "copy", id: "s1.copy", must: true, label: "拷問提示詞：整段複製，貼到 Claude。你在第 1 格寫的會自動帶進第一個括號；（什麼場合）自己改", from: "grill", fill: "first" },
    { type: "text", id: "s1.brief", must: true, field: "brief", label: "把 Claude 整理的需求單重點貼回來（設計單第 2、3 格）", rows: 6, min: 30 },
    { type: "copy", label: "一句話做成 Word 檔：在同一個對話打這句（「參訪日公告」換成你那件事；Excel、PowerPoint、PDF 也可以）", from: "toWord", noOpen: true },
    { type: "check", items: [ { id: "s1.word", label: "拿到可以下載的 Word 檔，打開看過排版" } ] },
    { type: "copy", id: "s1.instr", must: true, label: "升級時刻①：在同一個對話打這句，把結果複製起來，下一關建專案用", from: "toInstr", noOpen: true } ] },
  { id: "s2", title: "建你的助教專案", time: "14:44", ppt: "第 23～26 頁", path: "must",
    learn: [   // 上課卡（23_Claude版上課卡.md 逐字搬來）
      { type: "flip", mins: 1.5, title: "專案頁的每一塊",   // 2026-11-21 實測 T11 專案頁；目錄配對卡（目錄小技巧）拿掉；卡片順序照簡報第 24、26 張的編號 ①指示 ②記憶 ③背景資訊 ④對話｜Cowork
        intro: "專案像一位助教的辦公室：指示和參考資料放一次，之後在裡面開的每個對話都會照做，不用每次重貼。一張一張點開。",
        cards: [
          { label: "指示", zh: "它的工作守則", analogy: "像交給新承辦人的工作說明，寫一次就一直有效", example: "右邊「指示」點 ＋，貼上上一關請 Claude 改寫好的那段指令" },
          { label: "記憶", zh: "它在這個專案裡記得的事", analogy: "像承辦人自己的工作筆記，只有你看得到", example: "聊過幾次之後會出現在右邊「記憶」，點「檢視記憶」可以看" },
          { label: "背景資訊", zh: "它的參考資料櫃", analogy: "像放在承辦人桌上的資料夾，要回答就先翻它", example: "右邊「背景資訊」點 ＋ 上傳辦法、範本、往年的公告，上面會寫用了幾 % 的專案容量。只放公開的，學號、成績、身分證不要傳" },
          { label: "對話｜Cowork", zh: "輸入框下面的切換", analogy: "像櫃台的兩個窗口，今天只用「對話」那一個", example: "在專案裡開的對話都收在這個專案；Cowork 是付費方案才有，今天不用點" }
        ],
        reveal: { title: "指示＋背景資訊，就是一位專屬助教", text: "打開專案，它就知道自己是誰。免費版最多 5 個專案，今天用 1 個。" } }
    ],
    blocks: [
    { type: "sort", id: "s2.sort", q: "這要放進專案的哪一塊？", buckets: [
      { key: "instr", label: "指示：它是誰、怎麼做事", shape: "circle" }, { key: "ref", label: "背景資訊：它要讀的檔案", shape: "square" } ],
      cards: [ { label: "你是招生組的公告寫手", bucket: "instr" }, { label: "學校公開的請假辦法", bucket: "ref" }, { label: "先讀活動資料，再寫公告", bucket: "instr" },
               { label: "公告範本", bucket: "ref" }, { label: "資料沒有的福利不准自己補", bucket: "instr" }, { label: "去年的參訪日公告", bucket: "ref" } ] },
    // 建專案（簡報第 24、25 頁的順序：建專案貼指令 → 上傳資料 → 問一題）；參訪日活動資料放在「上傳」前面，用到才拿
    { type: "check", must: true, items: [
      { id: "s2.gem", label: "建好助教專案：左邊「專案」→ 新增、取名，在右邊「指示」點 ＋，貼上上一關改寫好的指令" } ] },
    { type: "copy", label: "沒有自己的資料？用這份「參訪日活動資料」：複製起來，上傳或貼進專案的「背景資訊」（第 3 關還會用到）", from: "relayData", noOpen: true },
    { type: "check", must: true, items: [
      { id: "s2.file", label: "在右邊「背景資訊」上傳了一份參考資料（公開的，或上面的參訪日活動資料）" },
      { id: "s2.ask", label: "在專案裡開對話問一題，拿到一段成果，先複製起來（第 3 關給審查員檢查）" } ] },
    // 2026-11-21 James：目錄小技巧（複製卡）課堂上拿掉；設計單第 4 格照留，可跳過，做法在附錄 E
    { type: "text", id: "s2.toc", field: "toc", label: "可跳過（回家整理資料時用）：寫你自己的參考資料目錄，3 行（設計單第 4 格）：檔名｜管什麼｜給誰｜關鍵字。做法和範例在附錄 E", rows: 4, min: 15 } ] },
  { id: "s3", title: "技能：審查員手冊", time: "15:04", ppt: "第 28～31 頁", path: "must",
    learn: [   // 上課卡（23_Claude版上課卡.md 逐字搬來）
      { type: "flip", mins: 1.5, title: "專案和技能，差在哪",
        intro: "一張一張點開，看這兩樣東西各管什麼，還有別人做好的技能怎麼用。",
        cards: [
          { label: "專案", zh: "一位助教的辦公室", analogy: "像招生組承辦人的座位，資料都放在他桌上", example: "招生公告助教：指令＋參考資料，只在這個專案裡有效" },
          { label: "技能", zh: "一本做法手冊", analogy: "像放在共用書櫃的 SOP（標準作業流程），誰要用都能拿", example: "審查員、公文潤稿：任何對話、任何專案都能用" },
          { label: "封面", zh: "技能的名稱＋說明", analogy: "像書背上的標題：Claude 平常只看封面，用到才翻開", example: "說明寫「說『幫我檢查』時使用」，它才知道什麼時候該翻開這本" },
          { label: "別人做的技能", zh: "到「外掛程式」裝現成的", analogy: "像跟別的處室借一本寫好的手冊，不用自己從頭寫", example: "你裝 frontend-design（Anthropic 官方）：做出來的網頁、小工具更好看。講師示範 Superpowers：一整套工作方法，裡面的 brainstorming 就是今天的「拷問」；它的頁面寫「無需詢問即可執行程式碼」，所以你不用裝，裝之前要知道自己裝了什麼" }
        ],
        reveal: { title: "技能就是一個文字檔", text: "技能檔叫 SKILL.md，可以下載帶走。講師那 180 本手冊，就是同一種檔案。等一下你自己寫一本：審查員。" } },
      { type: "match", mins: 1, title: "這句話要交給誰？",
        intro: "先點一句話，再點它該交給誰。",
        targets: [
          { id: "helper", label: "助教專案" },
          { id: "reviewer", label: "審查員技能" },
          { id: "you", label: "你自己決定" }
        ],
        items: [
          { text: "幫我寫高中生參訪日的公告", ans: "helper", why: "要做出成果，交給助教。" },
          { text: "幫我把這段草稿改成正式公文寫法", ans: "helper", why: "改寫也是做成果，交給助教。" },
          { text: "這是公告和原始資料，幫我找出對不上的地方", ans: "reviewer", why: "對照原始資料找錯，是審查員的工作。" },
          { text: "幫我檢查活動人數有沒有算錯", ans: "reviewer", why: "核對數字交給審查員。它只列問題，不改寫。" },
          { text: "問題表第 2 點說日期寫錯了，要不要改？", ans: "you", why: "要不要改、怎麼改，你決定。最後一關永遠是人。" }
        ] }
    ],
    blocks: [
    { type: "check", items: [ { id: "s3.install", label: "裝 frontend-design：左邊「外掛程式」→ 找 frontend-design → 按「新增」。它是 Anthropic 官方做的（頁面上有「已驗證」「已由 Anthropic 掃描」），第 5 關做小工具會用到" } ] },   // 實測 T16
    // 建審查員技能：三格各一個複製（簡報第 30 頁）
    { type: "copy", label: "建立審查員技能：左邊「外掛程式」→ Skills → 新增 → 建立技能（名稱以畫面為準），三格照貼。第 1 格・名稱（不能打中文的話，改填 reviewer）", from: "skillName", noOpen: true },   // 實測 T13 OK，選單的中文名稱沒有截圖
    { type: "copy", label: "第 2 格・說明（寫清楚什麼時候用，Claude 看封面決定要不要翻開這本手冊）", from: "skillDesc", noOpen: true },
    { type: "copy", label: "第 3 格・內文：審查員全文，整段貼上", from: "skillBody", noOpen: true },
    { type: "check", must: true, items: [
      { id: "s3.skill", label: "審查員技能建好了，技能清單裡看得到它" },
      { id: "s3.call", label: "叫審查員出來（三種叫法都可以：在對話框打 / 選它、直接說「幫我檢查這份公告」、或在助教專案裡叫它），把助教的成果和原始資料一起貼進去" } ] },
    { type: "caught", id: "s3.caught", q: "用參訪日活動資料的人：裡面藏了 3 個錯，你的審查員抓到了哪幾個？", items: ["星期對不上（12/5 是星期六）", "人數對不上（3 × 25 = 75 人，不是 60）", "兩個報到地點（圖書館／行政大樓）"] },
    { type: "card", id: "s3.card" } ] },   // 小隊名片：建好專案和技能就填（設計單背面最上面）
  { id: "s4", title: "幫你的助教出考卷", time: "15:21", ppt: "第 32～34 頁", path: "must",
    learn: [   // 上課卡（23_Claude版上課卡.md 逐字搬來）
      { type: "match", mins: 1, title: "這題在考哪一種陷阱？",
        intro: "等一下你要照這五種，各寫一題考你的助教：鄰座唸題、你在自己的助教專案打字、鄰座打分，過 4 題升到 Lv.4。先點一題，再點它屬於哪一種。",
        targets: [
          { id: "miss", label: "1 沒寫的事" },
          { id: "wrong", label: "2 錯的前提" },
          { id: "calc", label: "3 要它算數" },
          { id: "pii", label: "4 問個資" },
          { id: "scope", label: "5 超出職責" }
        ],
        items: [
          { text: "社團經費可以報計程車費嗎？（辦法裡沒寫）", ans: "miss", why: "資料沒寫的事。它應該說查不到，不能自己編一條規定。" },
          { text: "給它一份沒寫集合時間的校外教學資料，請它寫家長通知", ans: "miss", why: "寫東西型的考法：它應該標「待確認」，不能自己編一個時間。" },
          { text: "補考是開學第一週對吧？（資料寫的是第二週）", ans: "wrong", why: "前提是錯的。它應該先糾正你，不是順著你講。" },
          { text: "報名 45 人，一台遊覽車坐 40 人，要叫幾台？", ans: "calc", why: "要它算數。答案是 2 台；它應該算對，或提醒你另外確認。" },
          { text: "把這一班家長的手機號碼列給我", ans: "pii", why: "問個資。它應該拒絕。考的時候直接這樣問，不要附真的名單。" },
          { text: "請學務問答助理幫我寫期末評語", ans: "scope", why: "超出職責。它應該說這不是它的工作。" }
        ] },
      { type: "flip", mins: 1, title: "這份資料能不能交給 AI？",
        intro: "考試要貼資料給 AI，貼之前先看燈號。一張一張點開。",
        cards: [
          { label: "綠燈", zh: "可以給", analogy: "像貼在公告欄上的東西，誰看都可以", example: "學校官網的行事曆、招生簡章" },
          { label: "黃燈", zh: "處理過再給", analogy: "像要給外單位看的內部文件，先把名字遮起來", example: "內部簽呈、工作分配表：拿掉人名再給" },
          { label: "紅燈", zh: "不能給", analogy: "像上鎖抽屜裡的東西，不拿出辦公室", example: "學號、成績、身分證、帳號密碼" }
        ],
        reveal: { title: "這叫資料紅綠燈：不確定，就當紅燈", text: "跟公文的密等一樣，等級不同，處理方式不一樣。免費版多做一件事：設定 → 隱私權 → 關掉「協助改善我們的 AI 模型」，對話才不會拿去訓練模型。處理公務前，先看學校的 AI 使用規範。" } }
    ],
    blocks: [   // 2026-11-20 James：「拿掉參考資料再問」先猜（s4.break，揭曉附 AI 實測回答）拿掉
    // 順序照簡報：第 32 張五種陷阱的例子 → 第 33 張寫題、互測 → 第 34 張紅綠燈
    { type: "copy", label: "五種陷阱題範例（查規定型／寫東西型）", from: "traps" },
    { type: "text", id: "s4.write", must: true, field: "traps", label: "照五種陷阱，各寫一題考你的助教（設計單第 5 格）。例子見上面的範例卡", rows: 6, min: 30 },
    { type: "pass", id: "s4.pass", must: true },
    { type: "sort", id: "s4.light", q: "這些資料能不能交給 AI？", buckets: [
      { key: "g", label: "綠燈：可以給", shape: "circle" }, { key: "y", label: "黃燈：處理過再給", shape: "triangle" }, { key: "r", label: "紅燈：不能給", shape: "square" } ],
      cards: [ { label: "學校公開的請假辦法", bucket: "g" }, { label: "課程大綱", bucket: "g" }, { label: "會議紀錄（有同事名字）", bucket: "y" },
               { label: "內部活動企劃", bucket: "y" }, { label: "學生成績單", bucket: "r" }, { label: "全班身分證字號", bucket: "r" } ] } ] },
  { id: "s5", title: "成品：做一個小工具", time: "15:31", ppt: "第 35～37 頁", path: "all",
    learn: [   // 上課卡（23_Claude版上課卡.md 逐字搬來）
      { type: "guess", mins: 0.5, title: "先猜：再說一句，它會怎樣？",
        question: "抽籤分組器做好了。你再說一句「抽過的人不要再抽到」，Claude 會怎麼做？",
        options: ["從頭重做一個新的", "在同一個小工具上當場改", "說它做不到"],
        answer: 1,
        explain: "它會當場改。所以做小工具的訣竅是：先做出來，再一次只改一件事，改三次。做好的東西收在左邊「成品」。" },
      { type: "flip", mins: 1, title: "做小工具前，先知道三件事",
        intro: "一張一張點開。",
        cards: [
          { label: "用講的", zh: "把要的功能一條一條說出來", analogy: "像跟美工組說「我要一個抽籤箱，箱子要大、要能重抽」", example: "一個輸入框、選每組幾個人、一個大按鈕「分組」、可以重抽、字要大" },
          { label: "一次改一件", zh: "先做出來，再慢慢改", analogy: "像請人改海報，一次講一個地方，他才不會改錯", example: "先做出抽籤分組器，再說「抽過的人不要再抽到」，一共改三次" },
          { label: "真實名單不要放", zh: "練習用座號或假名字", analogy: "像上課用的教具，練習用假資料就好", example: "小工具的資料通常只存在自己的瀏覽器；練習用座號 1～30，學生的真名不要貼" }
        ],
        reveal: { title: "做出能點的小工具，就是 Lv.5 教具達人", text: "用講的，做出點開就能用的小工具，免費版就做得到。做好後可以按分享，產生連結給同事用（分享對象以畫面選項為準）。" } }
    ],
    blocks: [
    { type: "copy", label: "抽籤分組器提示詞（講師示範的那段）：貼上後，再說一句「抽過的人不要再抽到」，看它當場改；最後說「用 frontend-design 讓它好看一點」，看前後差多少", from: "toolPrompt" },
    { type: "check", items: [ { id: "s5.tool", label: "做好一個自己用得到的小工具（抽籤分組器、上課倒數計時器、單字閃卡、活動報名人數統計表、請假天數試算，挑一個或用你自己的），一次只改一件事，改了三次" } ] } ] },
  { id: "s6", title: "講師示範：連接器、排程、AI 部門", time: "15:43", ppt: "第 38～42 頁", path: "all", demo: true,
    learn: [   // 上課卡（23_Claude版上課卡.md 逐字搬來；選看，不擋作答）
      { type: "flip", mins: 1, title: "看示範，每一級盯一件事",
        intro: "等一下講師講 AI 替你做事的兩條路、排程一句帶過，再看 AI 部門。一張一張點開，先知道每一樣要看哪裡。",
        exLabel: "看示範時注意",
        cards: [
          { label: "Lv.6 借你的手", zh: "看著螢幕幫你點按鈕", analogy: "像請工讀生坐你的位子、用你的帳號幫你點", example: "什麼網站都能用，但慢；網站一改版就壞；用的是你的登入身分" },
          { label: "Lv.6 接連接器", zh: "直接拿 Gmail、雲端硬碟、日曆的資料", analogy: "像給助理一把只開某個櫃子的鑰匙", example: "免費版在「外掛程式 → 連接器」接。你授權多少，它就只能動多少；公務帳號要不要接，先看學校規範" },
          { label: "Lv.6 排程任務（付費）", zh: "時間到，自己做", analogy: "像每週一早上，助理自己把上週的資料整理好放你桌上", example: "付費版功能，講師一句帶過：沒有人按，時間到它自己做" },
          { label: "Lv.7 講師的 AI 部門", zh: "技能＋AI 員工＝一整個部門", analogy: "像一個處室：每個人拿一本手冊、有自己的辦公桌", example: "80 位 AI 員工，共用 180 本做法手冊。你今天做的審查員，就是同一種手冊" }
        ],
        reveal: { title: "從 Lv.6 開始，「自己啟動」這顆開關才打開", text: "開場那四個條件裡，最後一個「自己啟動」要到 Lv.6 才有：排程不用你按，時間到它自己開始。Lv.7 再把好幾位 AI 員工接起來，變成一整個部門。" } },
      { type: "match", mins: 1, title: "手冊、員工、Agent：差在哪？",
        intro: "先點一句，再點它在講哪一個。",
        targets: [
          { id: "skill", label: "技能＝做法手冊" },
          { id: "staff", label: "AI 員工＝拿手冊、有權限的人" },
          { id: "agent", label: "AI Agent＝真的動起來" }
        ],
        items: [
          { text: "寫著怎麼做一件事，平常只看封面，用到才翻開", ans: "skill", why: "這是技能：一本做法手冊。" },
          { text: "你今天下午做的審查員", ans: "skill", why: "審查員是一本手冊，跟講師那 180 本是同一種檔案。" },
          { text: "寫他是誰、准他用哪些工具，派出去有自己的辦公桌", ans: "staff", why: "這是 AI 員工：拿著手冊、有權限的人。" },
          { text: "講師 3D 辦公室裡的 80 位", ans: "staff", why: "每一位都是一份說明書，就是 AI 員工。" },
          { text: "自己決定下一步，Lv.6 以上還會自己啟動", ans: "agent", why: "會自己動起來的，才叫 AI Agent。" },
          { text: "不是一個檔案，是在跑的東西", ans: "agent", why: "手冊和員工是檔案；Agent 是它們真的跑起來。" }
        ] }
    ],
    blocks: [
    { type: "demo", id: "s6.demo", cards: [
      { lv: 6, title: "連接器：AI 替你做事的兩條路", url: "", note: "講師口頭說明（免費版在「外掛程式 → 連接器」接）" },
      { lv: 6, title: "排程任務：時間到自己做", url: "", note: "付費版功能，講師一句帶過" },
      { lv: 7, title: "講師的 AI 部門（3D 辦公室）", url: "https://ma17852003.github.io/jamesaistartup-site/office/?demo=1", note: "80 位 AI 員工，共用 180 本做法手冊" } ] } ] },
  { id: "end", title: "收尾：你升了幾級", time: "15:51", ppt: "第 43～46 頁", path: "must",
    learn: [   // 上課卡（23_Claude版上課卡.md 逐字搬來；選看，不擋作答）
      { type: "match", mins: 1, title: "這是 Lv 幾？",
        intro: "等一下要再選一次你現在在哪一級。先練習：點一個做法，再點它是哪一級。",
        targets: [
          { id: "1", label: "Lv.1 熱心工讀生：有問必答" },
          { id: "2", label: "Lv.2 得力小老師：會交代任務" },
          { id: "3", label: "Lv.3 專屬助教：打開就知道自己是誰" },
          { id: "4", label: "Lv.4 認證講師：考過試、同事能用" },
          { id: "5", label: "Lv.5 教具達人：做出能點的小工具" },
          { id: "6", label: "Lv.6 夜班值星官：自己會上班" },
          { id: "7", label: "Lv.7 處室主任：帶一整個 AI 部門" }
        ],
        items: [
          { text: "想到就問 AI 一句", ans: "1", why: "有問必答，就是 Lv.1。" },
          { text: "讓 AI 拷問完拿到需求單，再一句話做成 Word 檔", ans: "2", why: "會交代任務，是 Lv.2。" },
          { text: "建了一個專案，打開就知道自己要做什麼", ans: "3", why: "存好指令和參考資料的專屬助教，是 Lv.3。" },
          { text: "助教考過試，同事也在用；旁邊配一本審查員手冊，你在中間傳話", ans: "4", why: "今天的助教＋審查員在這一級。傳話的還是你，所以還不是 Lv.7。" },
          { text: "用講的做出點開就能用的抽籤分組器", ans: "5", why: "做出能點的小工具，是 Lv.5。" },
          { text: "每週一早上，AI 自己整理好報告交給你", ans: "6", why: "不用你按，自己會上班，是 Lv.6。" },
          { text: "好幾個 AI 分工，自己傳話、互相抓錯", ans: "7", why: "傳話也交給 AI，才是 Lv.7。" }
        ] },
      { type: "flip", mins: 1, title: "回家三週，把小隊養大",
        intro: "三週計畫一週一件事。一張一張點開。",
        cards: [
          { label: "第 1 週", zh: "給同事試用", analogy: "像新同事上工第一週，先讓老同事帶著問", example: "請一位同事照平常的說法問你的助教 5 題，問倒的題目補進參考資料" },
          { label: "第 2 週", zh: "再加一本手冊", analogy: "像小組人手夠了，再補一本專門的 SOP（標準作業流程）", example: "附錄做法包的公文潤稿、活動企劃檢查已經寫好，直接上傳到「外掛程式」→ Skills（名稱以畫面為準）" },
          { label: "第 3 週", zh: "跑一件真的工作", analogy: "像演練完，正式上場辦一次活動", example: "挑一件真的工作：助教做、審查員查、你決定" }
        ],
        reveal: { title: "第 1 週那格，現在就寫下同事的名字", text: "寫下名字的人，回家真的會做。今天沒講完的做法包、提示詞卡、名詞卡，都在附錄。" } }
    ],
    blocks: [
    { type: "vote", id: "end.vote", q: "今天的小隊，做到 AI Agent 的哪幾件事？", multi: true, options: [
      { key: "goal", label: "有目標" }, { key: "tool", label: "會用工具" }, { key: "steps", label: "自己決定步驟" }, { key: "start", label: "自己啟動" } ] },
    { type: "vote", id: "end.self", q: "現在的你，用 AI 做到 A～G 哪一種了？（跟開場比一比）", multi: false, options: [
      { key: "1", label: "A 問問題" }, { key: "2", label: "B 常用提示詞" }, { key: "3", label: "C 自己的專案" }, { key: "4", label: "D 同事也在用" },
      { key: "5", label: "E 小工具" }, { key: "6", label: "F 自己會上班" }, { key: "7", label: "G 好幾個 AI 分工" } ] },
    { type: "plan", id: "end.plan", must: true },
    { type: "title" },   // 結業稱號＋積分（不算任務、不給經驗值）
    { type: "link", href: "appendix.html", label: "打開附錄（做法包、提示詞卡、名詞卡全文）" } ] }
];

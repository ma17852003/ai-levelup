// 關卡資料：跟 PPT v10 一頁一頁對齊。只放資料，畫面由 blocks.js 畫
// path＝新手路線標籤（must 必做／all 全班一起／skip 可跳過）、tip＝關卡頂端提示、must＝必做小標（20_新手路線與審查員統一Gem_規格.md B）
window.STAGES = [
  { id: "s0", title: "報到", time: "13:40", ppt: "第 1～4 頁", path: "must", tip: "跟不上的話，只做標「必做」的就好，一樣升得到 Lv.4。",
    learn: [   // 上課卡（17_先教學後作答規格.md 逐字搬來）
      { type: "guess", mins: 0.5, title: "先猜：第 1 格寫哪一種事最划算？",
        question: "等一下要寫「如果明天多一位助理，你第一件想丟給他的事」。寫哪一種，今天帶回去最用得上？",
        options: ["一件一年才做一次的大事", "一件常常做、做到第三次就覺得煩的事", "一件跟工作無關的事"],
        answer: 1,
        explain: "今天每一段都拿這件事練習，最後還會為它組一支小隊。挑常常做的事，明天就用得上。寫不出來，就想想最近哪件事你做到第三次就覺得煩。" },
      { type: "flip", mins: 1.5, title: "別人會丟給助理的事",
        intro: "這四件是今天課堂上會看到的例子。一張一張點開。",
        cards: [
          { label: "寫公告", zh: "招生組", analogy: "像每學期都要重貼的海報，版型一樣，只換日期和地點", example: "高中生校園參訪日公告，寫給高二學生看" },
          { label: "回答規定", zh: "學務處", analogy: "像櫃台一天被問十次的同一個問題", example: "「請兩天病假，要找誰核准？」" },
          { label: "潤公文", zh: "各處室", analogy: "像內容寫好了，只差請人幫你改成正式寫法", example: "把草稿改成「主旨、說明、辦理方式、聯絡人」的寫法" },
          { label: "檢查企劃", zh: "活動承辦", analogy: "像辦活動前，找一位細心的同事從頭幫你對一遍", example: "活動企劃送出前，檢查日期、人數、場地、預算有沒有漏" }
        ],
        reveal: { title: "你的那件事，就是今天的題目", text: "後面每一段都用它練習：交代它、做成助理、出考卷、最後為它組一支小隊。第 1 格寫一句就好，後面幾關會慢慢把它補完整。" } }
    ],
    blocks: [
    { type: "text", id: "s0.first", must: true, field: "first", label: "如果明天多一位助理，你第一件想丟給他的事是什麼？（設計單第 1 格）", rows: 2, min: 4 } ] },
  { id: "open", title: "開場：AI 的七個等級", time: "14:05", ppt: "第 5～9 頁", path: "all",
    learn: [   // 上課卡（17_先教學後作答規格.md 逐字搬來）
      { type: "flip", mins: 1, title: "投票前，先認得三個詞",
        intro: "等一下的投票會用到這三個詞。一張一張點開。",
        cards: [
          { label: "提示詞", zh: "你打給 AI 的那段話", analogy: "像你寫給代課老師的交代字條", example: "「幫我把這段家長通知改得客氣一點」就是一段提示詞" },
          { label: "Gem／GPT", zh: "存好指令、打開就能用的專屬助教", analogy: "像已經熟悉班上狀況的固定代課老師，不用每次重講", example: "存好「你是招生組的公告寫手」這類指令，下次打開直接用" },
          { label: "Deep Research", zh: "深入研究", analogy: "像請工讀生去圖書館查一個下午，回來交一份整理好的報告", example: "你打一句題目，它自己上網查很多資料，寫成一份報告" }
        ],
        reveal: { title: "三個詞認得了，就可以投票", text: "等一下的 A～G 可以選不只一個，照你現在的樣子按，沒有對錯。投完，講師會揭曉這七種代表什麼。" } },
      { type: "toggle", mins: 1, title: "交代一位新同事的 4 個開關",
        intro: "一顆一顆打開，看這位新同事變得多好用；全開之後，再關掉一顆看看。", lead: "你交代一位新同事：",
        parts: [
          { label: "有目標", say: "週五前把園遊會攤位報名整理成一張表，", off: "✗ 不知道做到哪裡算完成，做一半就停", on: "✓ 知道週五要交一張整理好的表" },
          { label: "會用工具", say: "報名表和信箱你自己打開來看，", off: "✗ 只能等你把資料一份一份貼給他", on: "✓ 自己打開報名表、自己查信箱" },
          { label: "自己決定步驟", say: "先做什麼後做什麼，你自己排，", off: "✗ 每做完一步就回來問你「接下來呢？」", on: "✓ 自己排先後，做完一步接下一步" },
          { label: "自己啟動", say: "每週一早上自己開始做。", off: "✗ 你沒開口，他就不動", on: "✓ 時間到自己開始，不用你按" }
        ],
        done: "四個開關全開，就叫 AI Agent（AI 代理人）：有目標、會用工具、自己決定步驟、自己啟動的 AI。等一下看講師的 Deep Research，自己判斷它開了哪幾顆。" }
    ],
    blocks: [
    { type: "vote", id: "open.self", q: "你現在用 AI 做到哪幾種？（可以選不只一個）", multi: true, options: [
      { key: "A", label: "問問題、查資料" }, { key: "B", label: "有一段常用提示詞" }, { key: "C", label: "有自己的 Gem 或 GPT" },
      { key: "D", label: "我的 Gem 同事也在用" }, { key: "E", label: "用 AI 做出能點開的小工具" }, { key: "F", label: "沒打開 AI，它也會自己做事" },
      { key: "G", label: "好幾個 AI 分工、互相檢查" } ] },
    { type: "vote", id: "open.agent", q: "看完 Deep Research（深入研究：AI 自己上網查很多資料寫成報告），它有沒有做到這四件事？", multi: true, options: [
      { key: "goal", label: "有目標" }, { key: "tool", label: "會用工具" }, { key: "steps", label: "自己決定步驟" }, { key: "start", label: "自己啟動" } ] } ] },
  { id: "s1", title: "讓 AI 拷問你", time: "14:14", ppt: "第 10～14 頁", path: "must",
    learn: [   // 上課卡（17_先教學後作答規格.md 逐字搬來）
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
        done: "這 6 項寫清楚，就是一張「需求單」。少一項，AI 就要用猜的。等一下這關要交的，就是你那件事的需求單。" },
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
          { text: "需求單好了，下一關要拿去建 Gem", ans: "instr", why: "這就是升級時刻①：在同一個對話打這句，把結果複製起來，下一關貼進 Gem。" }
        ] }
    ],
    blocks: [
    { type: "guess", id: "s1.guess", q: "同一句「幫我寫招生參訪日公告」，哪一種拿到的比較合用？",
      options: [{ key: "A", label: "直接丟給 AI" }, { key: "B", label: "先讓 AI 一題一題問你" }], answer: "B", sample: "sampleDirect",
      reveal: "直接丟，AI 只能猜：日期、對象、名額都可能自己編。先被問清楚，它才知道你要什麼。" },
    { type: "copy", id: "s1.copy", must: true, label: "拷問提示詞：整段複製。你在第 1 格寫了的話，會自動帶進「（　）」裡", from: "grill", fill: "first" },
    { type: "text", id: "s1.brief", must: true, field: "brief", label: "把 AI 整理的需求單重點貼回來（設計單第 2、3 格）", rows: 6, min: 30 },
    { type: "copy", id: "s1.instr", must: true, label: "升級時刻①：在同一個對話打這句，把結果複製起來，下一關建 Gem 用", from: "toInstr", noOpen: true } ] },
  { id: "s2", title: "做一個審查員", time: "14:40", ppt: "第 15～19 頁", path: "must",
    learn: [   // 上課卡（2026-11-19 改：審查員統一做成第二個 Gem，課堂不提進階版；20_新手路線與審查員統一Gem_規格.md）
      { type: "flip", mins: 1, title: "兩個 Gem，各管一段",
        intro: "今天要建兩個 Gem。一張一張點開，看誰管哪一段。",
        cards: [
          { label: "助教 Gem", zh: "照指令做出成果", analogy: "像熟悉業務的承辦人，交代一句就把初稿寫好", example: "用上一關複製的指令建好，問它「幫我寫參訪日公告」，它交一份初稿" },
          { label: "審查員 Gem", zh: "拿原始資料對照找錯", analogy: "像送出前幫你逐字核對的細心同事，只圈出錯，不幫你改", example: "貼上助教的初稿和原始資料，它列一張問題表：日期、人數、地點哪裡對不上" },
          { label: "你", zh: "看問題表，決定改不改", analogy: "像簽核公文的主管，最後一關一定是人", example: "問題表第 2 點要不要改，你說了算" }
        ],
        reveal: { title: "一個做、一個抓錯、你決定", text: "Gem 就是存好指令的專屬助教，點它就叫得出來。今天建兩個：先用上一關複製的指令建助教，再用同一個方法建審查員，兩個都會在你的 Gem 清單裡。" } },
      { type: "match", mins: 1, title: "這句話要貼給誰？",
        intro: "先點一句話，再點它該交給誰。",
        targets: [
          { id: "helper", label: "助教 Gem" },
          { id: "reviewer", label: "審查員 Gem" },
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
    { type: "sort", id: "s2.sort", q: "這件事是助教做，還是審查員做？", buckets: [
      { key: "helper", label: "助教：做出成果", shape: "circle" }, { key: "reviewer", label: "審查員：對照找錯", shape: "square" } ],
      cards: [ { label: "寫招生公告初稿", bucket: "helper" }, { label: "對照簡章檢查日期", bucket: "reviewer" }, { label: "把草稿改成公文寫法", bucket: "helper" },
               { label: "檢查人數算得對不對", bucket: "reviewer" }, { label: "回答請假規定", bucket: "helper" }, { label: "列出跟原始資料對不上的地方", bucket: "reviewer" } ] },
    { type: "check", must: true, items: [ { id: "s2.gem", label: "用上一關複製的指令，建好今天的助教 Gem，問一題拿到一段成果" } ] },
    { type: "copy", must: true, label: "審查員全文：再新增一個 Gem，取名「審查員」，指令欄整段貼上", from: "reviewer" },
    { type: "check", must: true, items: [ { id: "s2.reviewer", label: "審查員 Gem 建好了" }, { id: "s2.call", label: "打開審查員 Gem，貼上助教的成果和原始資料" } ] } ] },
  { id: "s3", title: "AI 怎麼找資料", time: "14:55", ppt: "第 20～23 頁", path: "skip", tip: "跟不上可以先跳過這關，直接去第 4 關，升級不受影響。",
    learn: [   // 上課卡（17_先教學後作答規格.md 逐字搬來）
      { type: "flip", mins: 1, title: "AI 找資料的三種方法",
        intro: "同一櫃規定，AI 有三種讀法。一張一張點開。",
        cards: [
          { label: "整包讀", zh: "整份丟給它讀", analogy: "把整櫃法規搬到桌上，從第一頁讀到最後一頁", example: "學務處的 12 份生活輔導法規，全部一起給 AI 讀" },
          { label: "向量資料庫", zh: "切成小段，找意思最像的", analogy: "把法規剪成一張張小紙條收進抽屜，有人問問題，就抽出看起來最像的幾張", example: "有人問請假的事，它挑出意思最接近的幾小段給 AI 看" },
          { label: "目錄＋翻書", zh: "先看目錄，再整份讀", analogy: "承辦人先看檔案櫃的標籤，抽出那份公文從頭讀", example: "AI 先看「00_目錄」，挑出《學生請假規定》，整份讀完再回答" }
        ],
        reveal: { title: "差別在：AI 回答前，先看到了什麼", text: "整包讀，看到全部；向量資料庫，看到幾小段；目錄＋翻書，看到挑出來的那幾份全文。等一下先猜哪一種會答錯，再看講師 11 月 10 日的實測。" } },
      { type: "match", mins: 1, title: "目錄的一行，分成四欄",
        intro: "參考資料目錄一份資料寫一行：檔名｜管什麼｜給誰｜關鍵字。先點一段字，再點它是哪一欄。",
        targets: [
          { id: "name", label: "檔名" },
          { id: "what", label: "管什麼" },
          { id: "who", label: "給誰" },
          { id: "kw", label: "關鍵字" }
        ],
        items: [
          { text: "02_學院部學生操行成績評定要點", ans: "name", why: "檔名就是那份資料的名字，一個主題一份。" },
          { text: "五專操行成績怎麼算", ans: "what", why: "一句話講這份資料管什麼事。" },
          { text: "假別、請假手續、核准權責", ans: "what", why: "也是「管什麼」：這份管哪幾件事。" },
          { text: "五專學生", ans: "who", why: "給誰一定要寫，AI 最常搞混的就是對象。" },
          { text: "操行、加減分、缺曠", ans: "kw", why: "關鍵字寫大家真的會問的說法。" },
          { text: "病假、事假、補請假", ans: "kw", why: "同事會打「補請假」，就把「補請假」寫進去。" }
        ] }
    ],
    blocks: [
    { type: "guess", id: "s3.guess", q: "「五專二年級請兩天病假，要經過誰核准？」三種找資料的方法，哪一種會答錯？",
      options: [{ key: "A", label: "整包讀" }, { key: "B", label: "向量資料庫" }, { key: "C", label: "目錄＋翻書" }], answer: "B",
      reveal: "2026-11-10 講師實測：向量資料庫預設設定答「查不到」，調整後從午休規定推成「班導師核准」，錯。整包讀答對但出處寫錯；目錄＋翻書答對，出處還是要自己點開對。" },
    { type: "copy", label: "目錄格式範例", from: "tocExample" },
    { type: "text", id: "s3.toc", field: "toc", label: "寫你自己的參考資料目錄，3 行（設計單第 4 格）：檔名｜管什麼｜給誰｜關鍵字", rows: 4, min: 15 } ] },
  { id: "s4", title: "幫你的 Gem 出考卷", time: "15:06", ppt: "第 25～29 頁", path: "must",
    learn: [   // 上課卡（17_先教學後作答規格.md 逐字搬來）
      { type: "match", mins: 1, title: "這題在考哪一種陷阱？",
        intro: "等一下你要照這五種，各寫一題考你的 Gem：鄰座唸題、你打字、鄰座打分，過 4 題升到 Lv.4。先點一題，再點它屬於哪一種。",
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
        reveal: { title: "這叫資料紅綠燈：不確定，就當紅燈", text: "跟公文的密等一樣，等級不同，處理方式不一樣。處理公務用學校帳號，遵守學校的 AI 使用規範。" } }
    ],
    blocks: [
    { type: "guess", id: "s4.break", q: "同一題，拿掉參考資料再問一次，AI 會怎樣？", options: [{ key: "A", label: "說「查不到」" }, { key: "B", label: "編一個聽起來很對的答案" }], answer: "B", sample: "sampleNoDoc",
      reveal: "沒給資料，AI 通常不會說不知道。所以要給資料，還要考試。" },
    { type: "text", id: "s4.write", must: true, field: "traps", label: "照五種陷阱，各寫一題考你的 Gem（設計單第 5 格）。例子見下方紙卡", rows: 6, min: 30 },
    { type: "copy", label: "五種陷阱題範例（查規定型／寫東西型）", from: "traps" },
    { type: "pass", id: "s4.pass", must: true },
    { type: "sort", id: "s4.light", q: "這些資料能不能交給 AI？", buckets: [
      { key: "g", label: "綠燈：可以給", shape: "circle" }, { key: "y", label: "黃燈：處理過再給", shape: "triangle" }, { key: "r", label: "紅燈：不能給", shape: "square" } ],
      cards: [ { label: "學校公開的請假辦法", bucket: "g" }, { label: "課程大綱", bucket: "g" }, { label: "會議紀錄（有同事名字）", bucket: "y" },
               { label: "內部活動企劃", bucket: "y" }, { label: "學生成績單", bucket: "r" }, { label: "全班身分證字號", bucket: "r" } ] } ] },
  { id: "s5", title: "組一支 AI 小隊", time: "15:22", ppt: "第 30～35 頁", path: "all",
    learn: [   // 上課卡（17_先教學後作答規格.md 逐字搬來）
      { type: "toggle", mins: 1, title: "一支小隊的 4 個開關",
        intro: "一份活動資料，要變成一則正式公告。一顆一顆打開；全開之後，關掉「審查員」看看會怎樣。", lead: "這份資料會經過：",
        parts: [
          { label: "寫手", say: "寫手照資料寫成公告，", off: "✗ 沒有初稿，後面的人沒東西可以看", on: "✓ 有一份照資料寫的初稿" },
          { label: "審查員", say: "審查員對照原始資料找錯，", off: "✗ 資料裡藏的錯，原封不動跟著公告發出去", on: "✓ 對不上的地方，被列成一張問題表" },
          { label: "格式員", say: "格式員改成正式公告，", off: "✗ 內容對了，寫法卻不像學校公告", on: "✓ 改成正式寫法，不確定的地方標「待確認」" },
          { label: "交接寫下來", say: "每一棒都把結果整段貼給下一棒。", off: "✗ 你在旁邊用嘴巴補一句，AI 聽不到，下一棒照舊", on: "✓ 下一棒拿到的，就是上一棒完整的結果" }
        ],
        done: "四個開關全開，就是一支 AI 小隊：各管一段、接力完成，而且有一個專門找錯的角色。等一下接力，傳話只靠闖關網頁的「交棒」，不准用嘴巴補充。" },
      { type: "guess", mins: 0.5, title: "先猜：問題表出來之後，誰說了算？",
        question: "審查員列出一張問題表之後，要不要改、怎麼改，誰決定？",
        options: ["審查員，抓到的直接改掉", "助教，叫它自己看著辦", "你"],
        answer: 2,
        explain: "審查員只列問題，不改寫。要不要改，你決定：最後一關永遠是人。助教做、審查員抓錯、你決定，就是今天帶回家的小隊。貼原始資料前先過紅綠燈：紅燈不貼，黃燈拿掉人名再貼。" }
    ],
    blocks: [
    { type: "relay" },
    { type: "caught", id: "s5.caught", items: ["星期對不上（12/5 是星期六）", "人數對不上（3 × 25 = 75 人，不是 60）", "兩個報到地點（圖書館／行政大樓）"] },
    { type: "check", items: [ { id: "s5.team", label: "幫我的助教配好審查員，跑過一次：助教做 → 審查員抓錯 → 我決定" } ] },
    { type: "card", id: "s5.card" } ] },
  { id: "s6", title: "講師示範：Lv.5～7", time: "15:43", ppt: "第 36～38 頁", path: "all", demo: true,
    learn: [   // 上課卡（17_先教學後作答規格.md 逐字搬來）
      { type: "flip", mins: 1, title: "看示範，每一級盯一件事",
        intro: "等一下講師會秀四樣成品。一張一張點開，先知道每一樣要看哪裡。",
        exLabel: "看示範時注意",   // 新欄位，見待確認 #6；沒有這個欄位就顯示「學校裡」
        cards: [
          { label: "Lv.5 教具達人", zh: "Canvas：用講的做出小工具", analogy: "像跟美工組說「我要一個抽籤箱」，他當場做給你", example: "看它怎麼從一段話變成點網址就能用的工具，再看講師說一句「抽過的人不要再抽到」它怎麼改。這種小工具的資料只存在自己的瀏覽器，真實名單不要放上去。" },
          { label: "Lv.6 夜班值星官", zh: "排程任務：時間到，自己做", analogy: "像每週一早上，助理自己把上週的資料整理好放你桌上", example: "看那份報告是誰按開始的：沒有人按，時間到它自己做。" },
          { label: "Lv.6 夜班值星官", zh: "自動流程（n8n，一套串流程的軟體）：事情一發生，就照流程跑", analogy: "像收到報名表，承辦人照 SOP 回信、登記、通知，一步不漏", example: "看「事情一發生」它怎麼自己跑。n8n 原始碼公開、可以免費自己架，但要有人架、有人顧。" },
          { label: "Lv.7 處室主任", zh: "講師的 AI 部門", analogy: "像一個處室：主管只交代一句，各組分工，還有人專門核對", example: "看三件事：每條線都有審查員、交接靠交接單、大家共用一套紅線。再想一個問題：誰幫它開帳號、誰當督導人、出錯誰負責？" }
        ],
        reveal: { title: "從 Lv.6 開始，「自己啟動」這顆開關才打開", text: "開場那四個條件裡，最後一個「自己啟動」要到 Lv.6 才有：排程和自動流程不用你按，時間到或事情一發生，它自己開始。Lv.7 再把好幾個這樣的 AI 接起來，讓它們自己傳話。" } },
      { type: "match", mins: 1, title: "這件事，交給哪一種？",
        intro: "先點一件事，再點最適合的工具。",
        targets: [
          { id: "canvas", label: "Canvas 小工具" },
          { id: "sched", label: "排程任務" },
          { id: "flow", label: "自動流程" }
        ],
        items: [
          { text: "上課抽籤分組", ans: "canvas", why: "點網址就能用的小工具，適合抽籤、分組、倒數、閃卡。" },
          { text: "上台報告的倒數計時", ans: "canvas", why: "一樣是小工具，講一段話就做得出來。" },
          { text: "每週一早上整理一份產業新聞報告", ans: "sched", why: "要上網查、要判斷、要寫報告，用排程任務。" },
          { text: "有人填了報名表，就自動回一封確認信", ans: "flow", why: "要準時、要串表單，用自動流程。" },
          { text: "收到 LINE 訊息就照流程處理", ans: "flow", why: "要串 LINE、很多人同時用，用自動流程。" }
        ] }
    ],
    blocks: [
    { type: "demo", id: "s6.demo", cards: [
      { lv: 5, title: "Canvas 小工具：抽籤分組器", url: "https://share.gemini.google/SUv6NIvU50jb", note: "講師用 Gemini Canvas 做的，點開就能玩（資料只存在你的瀏覽器）" },
      { lv: 6, title: "排程任務：每週一自己整理的研究報告", url: "", note: "講師示範畫面" },
      { lv: 7, title: "講師的 AI 部門（3D 辦公室）", url: "https://ma17852003.github.io/jamesaistartup-site/office/?demo=1", note: "80 位 AI 員工分部門上班" } ] } ] },
  { id: "end", title: "收尾：你升了幾級", time: "15:51", ppt: "第 39～42 頁", path: "must",
    learn: [   // 上課卡（17_先教學後作答規格.md 逐字搬來）
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
          { text: "存了一段常用的提示詞，要用就貼上", ans: "2", why: "會交代任務，是 Lv.2。" },
          { text: "建了一個 Gem，打開就知道自己要做什麼", ans: "3", why: "存好指令的專屬助教，是 Lv.3。" },
          { text: "Gem 考過試，同事也在用；旁邊配一位審查員，你在中間傳話", ans: "4", why: "今天的助教＋審查員在這一級。傳話的還是你，所以還不是 Lv.7。" },
          { text: "用 Canvas 做出點網址就能用的抽籤分組器", ans: "5", why: "做出能點的小工具，是 Lv.5。" },
          { text: "每週一早上，AI 自己整理好報告交給你", ans: "6", why: "不用你按，自己會上班，是 Lv.6。" },
          { text: "好幾個 AI 分工，自己傳話、互相抓錯", ans: "7", why: "傳話也交給 AI，才是 Lv.7。" }
        ] },
      { type: "flip", mins: 1, title: "回家三週，把小隊養大",
        intro: "三週計畫一週一件事。一張一張點開。",
        cards: [
          { label: "第 1 週", zh: "給同事用", analogy: "像新同事上工第一週，先讓老同事帶著問", example: "請一位同事照平常的說法問 5 題，問倒的題目補進參考資料" },
          { label: "第 2 週", zh: "加第三位隊員", analogy: "像小組人手夠了，再補一位專門的人", example: "從附錄再拿一份做法，例如公文潤稿或活動企劃檢查，貼進一個新的 Gem" },
          { label: "第 3 週", zh: "跑一件真的工作", analogy: "像演練完，正式上場辦一次活動", example: "挑一件真的工作，讓小隊從頭跑到尾，交接只靠寫下來的東西" }
        ],
        reveal: { title: "第 1 週那格，現在就寫下同事的名字", text: "寫下名字的人，回家真的會做。三週跑順了想擴編，看附錄 M：先招人、再寫 SOP、再分工。" } }
    ],
    blocks: [
    { type: "vote", id: "end.vote", q: "今天的小隊，做到 AI Agent 的哪幾件事？", multi: true, options: [
      { key: "goal", label: "有目標" }, { key: "tool", label: "會用工具" }, { key: "steps", label: "自己決定步驟" }, { key: "start", label: "自己啟動" } ] },
    { type: "vote", id: "end.self", q: "現在的你，用 AI 做到 A～G 哪一種了？（跟開場比一比）", multi: false, options: [
      { key: "1", label: "A 問問題" }, { key: "2", label: "B 常用提示詞" }, { key: "3", label: "C 自己的 Gem" }, { key: "4", label: "D 同事也在用" },
      { key: "5", label: "E 小工具" }, { key: "6", label: "F 自己會上班" }, { key: "7", label: "G 好幾個 AI 分工" } ] },
    { type: "plan", id: "end.plan", must: true },
    { type: "title" },   // 結業稱號＋積分（不算任務、不給經驗值）
    { type: "link", href: "appendix.html", label: "打開附錄（做法包、提示詞卡、名詞卡全文）" } ] }
];

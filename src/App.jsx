import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Play, Square, Skull, Shield, Zap, Flame, Wind, Coins, Hammer, Box, ScrollText, Network, AlertTriangle, EyeOff, Crown, ChevronsUp, RefreshCw, Zap as Lightning, CloudLightning, Info, Eye, Activity, Sparkles, Sword, Compass, Clover, Lock, BookOpen, X, History, BarChart3, Save, Pill, HelpCircle, ShieldAlert, Award, Heart, Copy, Download, FileText } from 'lucide-react';
// 註：全文中原本使用 <HelpCircle /> 的地方需改為 <CircleHelp />
// 全文中原本使用 <BarChart3 /> 的地方需改為 <ChartColumn />
/**
 * ========================================================
 * 0. 天道雲端初始化 (Firebase Setup)
 * ========================================================
 */
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update, increment } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDamtpmaAYF0NSIGWbvcSzQ9EW3QkDI8-w",
  authDomain: "xiuxian-rpg-pomodoro.firebaseapp.com",
  projectId: "xiuxian-rpg-pomodoro",
  storageBucket: "xiuxian-rpg-pomodoro.firebasestorage.app",
  messagingSenderId: "14248923269",
  appId: "1:14248923269:web:29c538b685b4ea401d99ec",
  measurementId: "G-JCWLBL5D1N"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

/**
 * ========================================================
 * 1. 靜態數據定義 (Lore & Database)
 * ========================================================
 */

const CHANGELOG_DATA = [
  {
    version: "v3.7.1",
    date: "2026-03-11",
    title: "時空定序與萬寶歸宗",
    desc: "天道法則補全，徹底封印時空亂流，萬寶樓鑑寶系統全面升級。",
    changes: [
      "修復【時空亂流】：徹底封印因「閉包與幽靈計時器」導致的 00:00 卡死與專注期間升級回溯問題。",
      "重構【靈氣化晶】：拔除死劫豁免權。只要結算時靈氣溢出丹田，必定觸發 30% 比例強制化晶，嚴格控管修為上限。",
      "校準【生死法則】：死亡懲罰（扣除 20% 總修為）將絕對優先於化晶判定。身死道消者，靈氣消散，無法獲得任何靈石保底。",
      "優化【萬寶圖鑑】：法寶庫新增「右上角專屬品階標籤」，並於修行指引中公開完整的法寶稀有度排序（凡品 ➔ 造化至寶）。",
      "優化【天機史記】：境界突破與飛升仙界現在將於「修行日誌」中獨立成行，並以高光展示，彰顯修仙里程碑。"
    ]
  },
  {
    version: "v3.7.0",
    date: "2026-03-11",
    title: "晨曦機緣與洞府玄光",
    desc: "天道酬勤，每日八點靈氣重聚。",
    changes: [
      "實裝【每日機緣】：每日早上 08:00 定時重置。每日首次登入修仙大陣，皆可獲得天道賜予的免費尋寶機會一次。",
      "優化【引導亮點】：將免費尋寶提醒移至「洞府淬煉」分頁，並改為低調的「微弱呼吸紅點」，導向更直觀的收益轉化點。",
      "清理【介面冗餘】：移除頁尾名號頭銜的數字通知，進一步淨化視覺空間。"
    ]
  },
  {
    version: "v3.6.0",
    date: "2026-03-11",
    title: "天機化隱與萬法歸一",
    desc: "大道至簡，大音希聲。真正的機緣，在於厚積薄發。",
    changes: [
      "重構【萬法歸一】：尋寶與掉落法則大一統！全面實裝「① 同階 ➡️ ② 向下兼容 ➡️ ③ 向上連鎖突變」的極致收集體系。當低階圖鑑飽和後，任何微末機緣皆必連鎖突變為高階異寶，直至全圖鑑 100% 畢業。",
      "優化【天機化隱】：拔除原先突兀的天機預測外框。天機預警現化作一抹「神識獨白」，伴隨微弱的靈力呼吸，於開陣前隱隱浮現於心頭。",
      "實裝【神識明察】：天機感應現已將「爆擊潛力」精準納入推演。面對死劫，若常規輸出不足，但極限爆擊可破敵時，神識將提示「靈壓感應...或可一試...」，鼓勵道友富貴險中求。",
      "修復【時空亂流】：徹底斬斷因「天地法則錯位 (TDZ 變數未宣告先使用)」引發的全新開局白屏死劫，並為本地識海 (LocalStorage) 築起嚴格的型別防護牆。"
    ]
  },
  {
    version: "v3.5.0",
    date: "2026-03-11",
    title: "天機迷霧與萬法溯源",
    desc: "破除天機迷霧，洞悉萬法本源。真正的修仙，在於直面未知。",
    changes: [
      "實裝【天機迷霧】：移除精確勝負作弊。天機推演不再隨時長變動，改為純粹的「絕對靈壓威脅感應」，將專注時長的選擇權還給現實。",
      "實裝【逆天改命】：連擊倍率現已正式納入天機推演。面對死劫，可藉由連續短修累積無上劍勢，看著天機從「死氣逼人」化為「微末之流」。",
      "實裝【屬性溯源】：屬性極限面板全面覺醒！游標懸停即可精準洞悉每一分戰力、氣血、爆擊的「來源拆解」，徹底消除數值黑箱。",
      "修復【時空亂流】：修補因天機測算與 UI 陣法殘影引發的白屏死機 (React Crash) 與編譯失敗，確保飛升之路順暢無阻。"
    ]
  },
  {
    version: "v3.4.0",
    date: "2026-03-10",
    title: "天機羅盤與綜合靈壓",
    desc: "天道無常，然天機可測。掌握靈壓，方能百戰不殆。",
    changes: [
      "實裝【綜合靈壓】：將戰力、防禦、爆擊、閃避等繁雜屬性，鎔鑄為統一的「絕對戰力指標（CP）」，直觀感受每一次突破的強度躍升。",
      "實裝【天機推演】：於大陣啟動前，系統將依據所選時長進行「極端戰鬥模擬」。提供『大吉、變數、鏖戰、死劫』等精準預警，徹底告別盲目送死。",
      "優化【戰略博弈】：切換 15m 與 60m 時，天機卦象將即時變動。短修刷錢與長關破劫的策略抉擇將更加透明且致命。"
    ]
  },
  {
    version: "v3.3.1",
    date: "2026-03-10",
    title: "天道酬勤與神魔嘶吼",
    desc: "修仙無捷徑，天道認可每一分光陰的價值。",
    changes: [
      "實裝【妖獸挑釁】：萬妖錄全面覺醒，每隻妖獸與死劫 Boss 現在都具備專屬原著語錄，在對峙時震懾神魂。",
      "校準【連擊權重】：連擊獲取現在與「專注時長」掛鉤。15m(+1) / 60m(+4)，確保長時專注具備最高戰略價值。",
      "優化【丹藥法則】：頓悟丹掉落率改為隨時間縮放。60m(10%基礎) / 15m(2.5%基礎)，徹底防堵短時刷丹漏洞。",
      "修正【祕籍不滅】：散功重修後，所有機緣祕籍將降回 Lv.1 而非徹底消失，保留道友辛苦收集的道統遺產。",
      "完善【結算機制】：服用頓悟丹現在會根據「當前設定時長」精準發放靈石、修為與傷害，建議在 60m 模式下服用以達最大藥效。"
    ]
  },
  {
    version: "v3.3.0",
    date: "2026-03-10",
    title: "天命所歸與萬法歸宗",
    desc: "冥冥中自有天意，萬法皆可成大道。",
    changes: [
      "實裝【天機牽引】：溢出的氣運現在會轉化為『爆擊率』、『閃避率』與『復活率』的微幅加成。",
      "實裝【機緣免費】：搜刮或奇遇獲得的功法第一級不再扣除 SP，唯有後續參悟需消耗心神。",
      "擴充【天道藏經閣】：新增《化劫大法》、《血靈大法》等 6 部原著絕學，配合屬性溢出衍生極限流派。",
      "優化【潛能顯化】：實裝『可用 / 總量』的 SP 顯示介面，不再盲目修煉。",
      "修補【時空漏洞】：鑄造『神識鎖 (Session Lock)』，徹底封印因切換分頁導致的重複結算 Bug。"
    ]
  },
  {
    version: "v3.2.5",
    date: "2026-03-09",
    title: "心流與史記",
    desc: "溫故而知新，每一次吐納皆是修行。",
    changes: [
      "優化【介面樞紐】：將「修行日誌」移至分頁首位並設為預設開啟，讓道友出關後能第一時間閱覽戰報與收穫。"
    ]
  },
  {
    version: "v3.2.4",
    date: "2026-03-09",
    title: "歲月情深：矩陣語錄與防呆優化",
    desc: "一語一契機，情隨歲月深，羈絆演化萬千。",
    changes: [
      "實裝【矩陣隨機語錄】：道侶在不同羈絆階級擁有獨立語錄庫，隨機抽選，徹底告別重複台詞。",
      "優化【結緣慶典】：境界突破若伴隨新紅顏結識，彈窗將優先展示佳人的「初次見面語」。",
      "調整【氣機牽引 2.0】：防呆期由 10 秒延長至 1 分鐘，給予更寬裕的戰略反悔時間。"
    ]
  },
  {
    version: "v3.2.2",
    date: "2026-03-09",
    title: "仙緣初綻",
    desc: "驀然回首，那人卻在，燈火闌珊處。",
    changes: [
      "新增【結緣提示】：首次突破至可認識道侶的境界時，將在突破彈窗中高光展示佳人身影。",
      "優化【突破文案】：若突破時伴隨結緣，彈窗語錄將優先抽取道侶的初次見面語。"
    ]
  },
  {
    version: "v3.2.1",
    date: "2026-03-09",
    title: "識海史記擴容",
    desc: "筆耕不輟，錄仙途點滴。",
    changes: [
      "優化【修記容量】：日誌保留上限由 50 則提升至 200 則，詳盡記錄修行點滴。",
      "校準【資訊雙軌制】：掉落物高光展示與日誌記錄同步實裝，重要機緣絕不遺漏。"
    ]
  },
  {
    version: "v3.2.0",
    date: "2026-03-08",
    title: "階層式心流反饋",
    desc: "斬妖除魔，法寶現世，一切了然於胸。",
    changes: [
      "實裝【動態浮動橫幅 (Toast)】：日常運功與休息結算將以非阻擋式橫幅呈現，停留後自動消散，保護您的心流體驗。",
      "新增【掉落高光展示】：打寶、奇遇與頓悟丹等重要收穫，將直接以醒目大字展示於橫幅，不再錯過機緣。",
      "擴充【沉浸式語錄】：新增數十種專注、戰鬥與突破的動態文案，讓每一次結算都充滿修仙意境。"
    ]
  },
  {
    version: "v3.1.0",
    date: "2026-03-08",
    title: "天道法則：氣機與歲月",
    desc: "修仙無歲月，寒盡不知年。生死一線間，方顯真神通。",
    changes: [
      "重構【道侶羈絆】：不再計算冰冷的擊殺數，改為「相伴載數(專注分鐘數)」，並加入豐富的原著互動語錄。",
      "實裝【氣機牽引】：【結丹期】起，強行收功將依據「已流逝時間」產生反噬加成，起步 1.2 倍基礎懲罰，撐得越久放棄越致命 (10秒防呆期)。",
      "實裝【妖獸同步蓄力】：【築基期】起，長時長專注將導致妖獸同步吸收靈氣，反撲傷害暴增。",
      "優化【天道指引】：全面重寫新手教學與進階秘訣，解密時長戰略與屬性流派。"
    ]
  },
  {
    version: "v2.9.0",
    date: "2026-03-08",
    title: "萬妖圖鑑 2.0 與死劫系統",
    desc: "修仙之路，步步驚心，死劫不破，修為難進。",
    changes: [
      "實裝【雙軌妖獸系統】：修為未滿時，遭遇隨機「道中妖獸」；修為滿載時，觸發專屬「守關首領(死劫)」。",
      "修復【跌落悖論】：若在死劫中重傷導致修為跌落門檻，死劫消散，需重新歷練。",
      "封堵【遁入虛空】：妖獸氣血狀態寫入本地靈脈(緩存)，F5 刷新網頁無法重置殘血或逃避戰鬥。"
    ]
  },
  {
    version: "v2.8.0",
    date: "2026-03-08",
    title: "禪定模式 (Zen Mode)",
    desc: "大道至簡，專注如一。",
    changes: [
      "實裝【禪定模式】：一旦開始運轉周天，所有與當前專注無關的境界、法寶、狀態將全數隱藏。",
      "優化【視覺置中】：螢幕將只剩下最純粹的計時器與陣眼，幫助道友心無旁騖地衝擊瓶頸。"
    ]
  }
];

// 新增：沉浸式結算語錄
const FEEDBACK_TEXTS = {
  focus: [
    "劍光閃爍，在妖獸身上留下一道深深的血痕。", "法寶轟擊，震退了眼前的強敵！", "攻勢如潮，妖獸的氣息隨之衰弱了幾分。", "真元激盪，這一擊結結實實地打在了妖獸的破綻上。", "趁其不備，凌厲的殺招狠狠命中了目標。", "激烈交鋒！你的法術成功穿透了它的防禦。", "靈力爆發，妖獸的護體靈光被你強行撕裂。", "一番纏鬥，妖獸的動作明顯遲緩了下來。", "抓住破綻，連續的猛攻讓妖獸連連後退。", "氣血翻湧，你的一擊讓妖獸發出了痛苦的嘶吼。"
  ],
  break: [
    "靈氣運轉一個周天，神清氣爽。", "心無旁騖，道心更堅定了一分。", "摒棄雜念，真元如臂使指。", "吐納之間，修為暗暗增長。", "一念不生，萬法無咎。", "神識清明，對天地法則的感悟加深了。", "氣沉丹田，經脈中的靈力越發凝實。", "歲月如梭，唯有苦修方能證得大道。", "不驕不躁，平心靜氣地完成了一次循環。", "周天圓滿，將外界喧囂盡數隔絕。"
  ],
  kill: [
    "劍氣如虹，妖血染紅了大地！", "雷霆手段，瞬間將妖邪斬化為飛灰！", "區區妖物，也敢擋我修仙之路！", "真元爆發，摧枯拉朽般粉碎了敵人的防禦。", "身法如電，在妖獸來不及反應前取其首級。"
  ],
  boss: [
    "逆天改命！硬生生踏破了這生死玄關！", "天道不公，我便逆天！死劫已破！", "千百次生死邊緣的試探，終於斬滅此瓶頸！", "縱使九死一生，也絕不退縮半步！境界突破！", "宿敵伏誅！從今往後，此界再無人能阻我！"
  ]
};

const REALM_COLORS = {
  emerald: { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500' },
  teal: { text: 'text-teal-400', border: 'border-teal-500/30', bg: 'bg-teal-500' },
  blue: { text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500' },
  indigo: { text: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'bg-indigo-500' },
  purple: { text: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500' },
  violet: { text: 'text-violet-400', border: 'border-violet-500/30', bg: 'bg-violet-500' },
  amber: { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500' },
  orange: { text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500' },
  slate: { text: 'text-slate-400', border: 'border-slate-500/30', bg: 'bg-slate-500' },
  rose: { text: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500' }
};

const LUCK_FATES = [
  { min: 5.51, name: '【天道化身】', color: 'text-white animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' },
  { min: 5.01, name: '【此界之主】', color: 'text-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]' },
  { min: 4.01, name: '【天命所歸】', color: 'text-amber-400' },
  { min: 2.81, name: '【氣運加身】', color: 'text-purple-400' },
  { min: 1.81, name: '【百靈護體】', color: 'text-blue-400' },
  { min: 1.21, name: '【偶有機緣】', color: 'text-emerald-400' },
  { min: 0.00, name: '【凡骨俗胎】', color: 'text-slate-400' },
];

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  if (num >= 1e16) return (num / 1e16).toFixed(2) + ' 京';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + ' 兆';
  if (num >= 1e8) return (num / 1e8).toFixed(2) + ' 億';
  if (num >= 1e4) return (num / 1e4).toFixed(2) + ' 萬';
  return Math.floor(num).toLocaleString();
};

const FOCUS_OPTIONS = [
  { label: '15m', value: 15 * 60 },
  { label: '25m', value: 25 * 60 },
  { label: '45m', value: 45 * 60 },
  { label: '60m', value: 60 * 60 }
];

const RARITY = {
  COMMON: { name: '凡品', color: 'text-slate-400', weight: 0.34 },
  UNCOMMON: { name: '靈品', color: 'text-green-400', weight: 0.30 },
  RARE: { name: '法寶', color: 'text-blue-400', weight: 0.20 },
  EPIC: { name: '古寶', color: 'text-purple-400', weight: 0.10 },
  LEGENDARY: { name: '通天靈寶', color: 'text-orange-400', weight: 0.04 },
  MYTHIC: { name: '玄天之寶', color: 'text-red-500', weight: 0.015 },
  DIVINE: { name: '造化至寶', color: 'text-yellow-400', weight: 0.005 }
};

const RARITIES_ORDER = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC', 'DIVINE'];

const MAJOR_REALMS_DATA = [
  { name: '煉氣境', desc: '吸納天地靈氣，洗髓易經，初窺仙道門徑。', color: 'emerald' },
  { name: '築基境', desc: '靈氣化液，凝結道基，壽元大增，辟除凡胎。', color: 'teal' },
  { name: '結丹境', desc: '丹田結丹，靈力固化，可煉製本命法寶。', color: 'blue' },
  { name: '元嬰境', desc: '碎丹成嬰，元嬰可瞬移離體，神魂不滅。', color: 'indigo' },
  { name: '化神境', desc: '溝通天地，初步掌控天地元氣，具備飛升資格。', color: 'purple' },
  { name: '煉虛境', desc: '五行合一，化實為虛，初步掌控空間之力。', color: 'violet' },
  { name: '合體境', desc: '天人合一，法相實體化，成為靈界霸主。', color: 'amber' },
  { name: '大乘境', desc: '掌握天地法則，道臻巔峰，萬法不侵。', color: 'orange' }
];

const REALMS = [{ name: '一介凡人', desc: '凡夫俗子，尚未引氣入體，壽元百載。', majorName: '凡人', color: 'slate', isMajor: true }];
MAJOR_REALMS_DATA.forEach(major => {
  ['初期', '中期', '後期', '巔峰'].forEach((suffix, i) => {
    REALMS.push({ name: `${major.name.replace('境', '')}${suffix}`, desc: major.desc, isMajor: i === 0, majorName: major.name.replace('境', ''), color: major.color });
  });
});
REALMS.push({ name: '渡劫', desc: '引動九九重雷劫，成則羽化登仙，敗則化為劫灰。', majorName: '渡劫', isMajor: true, color: 'rose' });

const GUIDE_REALMS = [
  { name: '一介凡人', desc: '凡夫俗子，尚未引氣入體，壽元百載。', range: 'Tier 1' },
  ...MAJOR_REALMS_DATA.map((r, i) => ({ name: r.name, desc: r.desc, range: `Tier ${i * 4 + 2} - ${i * 4 + 5}` })),
  { name: '渡劫期', desc: '引動九九重雷劫，成則羽化登仙，敗則化為劫灰。', range: 'Tier 34' }
];

// ==========================================
// 萬寶錄 89+ 擴編
// ==========================================
const ARTIFACT_POOL = [
  // --- COMMON (凡品：凡人兵刃、低階殘次法器) ---
  { id: 'a_c01', rarity: 'COMMON', name: '鐵木盾', desc: '低階法器 (防禦減傷 +5%)', val: { def: 0.05 } },
  { id: 'a_c02', rarity: 'COMMON', name: '青銅戈', desc: '凡俗兵刃 (基礎戰力 +5%)', val: { atk: 0.05 } },
  { id: 'a_c03', rarity: 'COMMON', name: '凝神蒲團', desc: '固本培元 (回血+3%，修為+3%)', val: { heal_bonus: 0.03, qi: 0.03 } },
  { id: 'a_c04', rarity: 'COMMON', name: '粗糙靈石袋', desc: '聚財之物 (靈石掉落 +8%)', val: { stone: 0.08 } },
  { id: 'a_c05', rarity: 'COMMON', name: '玄鐵刃', desc: '近戰利器 (基礎戰力 +6%)', val: { atk: 0.06 } },
  { id: 'a_c06', rarity: 'COMMON', name: '飛蝗石', desc: '凡人暗器 (連擊效率 +5%)', val: { streak_eff: 0.05 } },
  { id: 'a_c07', rarity: 'COMMON', name: '聚氣散', desc: '臨時提氣 (修為獲取 +6%)', val: { qi: 0.06 } },
  { id: 'a_c08', rarity: 'COMMON', name: '水罩符', desc: '初階符籙 (防禦減傷 +4%)', val: { def: 0.04 } },
  { id: 'a_c09', rarity: 'COMMON', name: '烈陽劍', desc: '火行低階飛劍 (戰力+4%，劍陣部件)', val: { atk: 0.04 }, tags: ['sword'] },
  { id: 'a_c10', rarity: 'COMMON', name: '冷月刀', desc: '凡人寶刀 (爆擊傷害 +10%)', val: { crit_dmg: 0.10 } },
  { id: 'a_c11', rarity: 'COMMON', name: '踏雲靴', desc: '凡俗輕功 (閃避率 +3%)', val: { evade: 0.03 } },
  { id: 'a_c12', rarity: 'COMMON', name: '震天弓', desc: '七玄門神兵 (爆擊率 +3%)', val: { crit: 0.03 } }, // 📉 從靈品降級
  { id: 'a_c13', rarity: 'COMMON', name: '金剛罩', desc: '凡人硬氣功 (氣血上限 +6%)', val: { hp: 0.06 } },
  { id: 'a_c14', rarity: 'COMMON', name: '穿雲箭', desc: '配合震天弓使用 (修為獲取 +5%)', val: { qi: 0.05 } }, // 📉 從靈品降級
  { id: 'a_c15', rarity: 'COMMON', name: '青光劍', desc: '黃楓谷制式飛劍 (戰力+5%，劍陣部件)', val: { atk: 0.05 }, tags: ['sword'] },
  { id: 'a_c16', rarity: 'COMMON', name: '黃絲網', desc: '束縛困敵 (神識減傷 +4%)', val: { sense_def: 0.04 } },
  { id: 'a_c17', rarity: 'COMMON', name: '巨鐵劍', desc: '沉重無比 (戰力+8%，閃避-2%)', val: { atk: 0.08, evade: -0.02 }, tags: ['sword'] },
  { id: 'a_c18', rarity: 'COMMON', name: '追風玉', desc: '提升遁速 (閃避率 +4%)', val: { evade: 0.04 } },
  { id: 'a_c19', rarity: 'COMMON', name: '靈龜盾', desc: '龜甲防禦 (防禦減傷 +6%)', val: { def: 0.06 } },
  { id: 'a_c20', rarity: 'COMMON', name: '炎陽玉', desc: '純陽之氣 (休息回血 +4%)', val: { heal_bonus: 0.04 } },
  { id: 'a_c21', rarity: 'COMMON', name: '寒冰刺', desc: '冰寒刺骨 (爆擊傷害 +12%)', val: { crit_dmg: 0.12 } },
  { id: 'a_c22', rarity: 'COMMON', name: '迷霧陣旗', desc: '基礎陣法 (閃避率 +4%)', val: { evade: 0.04 } },
  { id: 'a_c23', rarity: 'COMMON', name: '遁地符', desc: '五行遁術 (閃避率 +5%)', val: { evade: 0.05 } },
  { id: 'a_c24', rarity: 'COMMON', name: '引路蜂', desc: '尋寶靈蟲 (靈石掉落 +6%)', val: { stone: 0.06 } },
  { id: 'a_c25', rarity: 'COMMON', name: '踏雪無痕靴', desc: '凡人絕頂輕功 (爆傷+15%)', val: { crit_dmg: 0.15 } }, // 📉 從靈品降級

  // --- UNCOMMON (靈品：對應原著的「法器 Faqi」) ---
  { id: 'a_u01', rarity: 'UNCOMMON', name: '神風舟', desc: '代步飛行法器 (閃避率 +8%)', val: { evade: 0.08 } },
  { id: 'a_u02', rarity: 'UNCOMMON', name: '金蚨子母刃', desc: '成套頂階法器 (戰力+12%，爆擊+5%)', val: { atk: 0.12, crit: 0.05 }, tags: ['sword'] },
  { id: 'a_u03', rarity: 'UNCOMMON', name: '無形針', desc: '無影無蹤的暗器法器 (連擊效率+15%，爆擊+5%)', val: { streak_eff: 0.15, crit: 0.05 } },
  { id: 'a_u04', rarity: 'UNCOMMON', name: '血玉髓', desc: '氣血滋養 (休息回血比例 +10%)', val: { heal_bonus: 0.10 } },
  { id: 'a_u05', rarity: 'UNCOMMON', name: '玄鐵飛天盾', desc: '頂階防禦法器 (防禦減傷 +10%)', val: { def: 0.10 } },
  { id: 'a_u06', rarity: 'UNCOMMON', name: '天雷竹(殘)', desc: '辟邪神雷基底 (爆傷 +20%)', val: { crit_dmg: 0.20 } },
  { id: 'a_u07', rarity: 'UNCOMMON', name: '平山印', desc: '重壓攻擊 (戰力+15%)', val: { atk: 0.15 } },
  { id: 'a_u08', rarity: 'UNCOMMON', name: '引魂鐘', desc: '攻擊神識 (反噬減傷 +10%)', val: { sense_def: 0.10 } },
  { id: 'a_u09', rarity: 'UNCOMMON', name: '烏龍奪', desc: '頂階詭異法器 (閃避率 +10%)', val: { evade: 0.10 } }, // 📈 從凡品升級
  { id: 'a_u10', rarity: 'UNCOMMON', name: '破甲錐', desc: '無視防禦 (爆擊傷害 +25%)', val: { crit_dmg: 0.25 } },
  { id: 'a_u11', rarity: 'UNCOMMON', name: '青蛟舟', desc: '蛟龍之鱗煉製法器 (戰力+12%，爆擊+6%)', val: { atk: 0.12, crit: 0.06 } }, // 🔄 修正名稱
  { id: 'a_u12', rarity: 'UNCOMMON', name: '迷魂鐘', desc: '干擾神識 (連擊上限 +10%)', val: { streak_cap: 0.10 } },
  { id: 'a_u13', rarity: 'UNCOMMON', name: '縛妖索', desc: '專剋妖獸 (防禦減傷 +8%)', val: { def: 0.08 } },
  { id: 'a_u14', rarity: 'UNCOMMON', name: '青靈甲', desc: '木系戰甲 (氣血上限 +15%)', val: { hp: 0.15 } },
  { id: 'a_u15', rarity: 'UNCOMMON', name: '幻影陣盤', desc: '迷幻神識 (閃避率 +9%)', val: { evade: 0.09 } },
  { id: 'a_u16', rarity: 'UNCOMMON', name: '烈焰珠', desc: '純火爆發 (戰力 +14%)', val: { atk: 0.14 } },
  { id: 'a_u17', rarity: 'UNCOMMON', name: '寒冰劍', desc: '冰封減速 (戰力+10%，劍陣)', val: { atk: 0.10 }, tags: ['sword'] },
  { id: 'a_u18', rarity: 'UNCOMMON', name: '紫金缽', desc: '佛門法器 (防禦減傷 +12%)', val: { def: 0.12 } },
  { id: 'a_u19', rarity: 'UNCOMMON', name: '攝魂鈴', desc: '神識攻擊 (反噬減傷 +12%)', val: { sense_def: 0.12 } },
  { id: 'a_u20', rarity: 'UNCOMMON', name: '高級儲物袋', desc: '極大空間 (靈石掉落 +20%)', val: { stone: 0.20 } },

  // --- RARE (法寶：對應原著的「結丹期法寶 Fabao」與「符寶」) ---
  { id: 'a_r01', rarity: 'RARE', name: '黃羅傘', desc: '結丹修士防禦法寶 (戰力加成 +25%)', val: { atk: 0.25 } }, // 🔄 替換青蛟旗
  { id: 'a_r02', rarity: 'RARE', name: '金光磚符寶', desc: '結丹法寶威力分身 (爆擊傷害 +40%)', val: { crit_dmg: 0.40 } }, // 🔄 精確標註符寶
  { id: 'a_r03', rarity: 'RARE', name: '碧玉葫蘆', desc: '納寶空間 (靈石掉落 +40%)', val: { stone: 0.40 } },
  { id: 'a_r04', rarity: 'RARE', name: '綠煌劍', desc: '毒性本命飛劍 (戰力+20%，劍陣)', val: { atk: 0.20 }, tags: ['sword'] },
  { id: 'a_r05', rarity: 'RARE', name: '降魔杖', desc: '佛門降魔 (防禦+15%，爆擊+8%)', val: { def: 0.15, crit: 0.08 } },
  { id: 'a_r06', rarity: 'RARE', name: '混元缽', desc: '混元之氣 (減傷+15%，修為+15%)', val: { def: 0.15, qi: 0.15 } },
  { id: 'a_r07', rarity: 'RARE', name: '巨劍門重劍', desc: '力劈華山 (戰力+30%，閃避-5%)', val: { atk: 0.30, evade: -0.05 }, tags: ['sword'] },
  { id: 'a_r08', rarity: 'RARE', name: '血毒刃', desc: '見血封喉 (爆傷+45%)', val: { crit_dmg: 0.45 } },
  { id: 'a_r09', rarity: 'RARE', name: '掩月雙環', desc: '合擊之術 (連擊效率 +30%)', val: { streak_eff: 0.30 } },
  { id: 'a_r10', rarity: 'RARE', name: '烏黑魔匕', desc: '魔道暗器法寶 (爆擊率 +12%)', val: { crit: 0.12 } },
  { id: 'a_r11', rarity: 'RARE', name: '雪晶珠', desc: '極寒冰域 (閃避+12%，減傷+10%)', val: { evade: 0.12, def: 0.10 } },
  { id: 'a_r12', rarity: 'RARE', name: '碧血帶', desc: '韌性極強 (氣血上限 +25%)', val: { hp: 0.25 } },
  { id: 'a_r13', rarity: 'RARE', name: '乾坤塔', desc: '鎮壓妖物 (防禦減傷 +20%)', val: { def: 0.20 } },
  { id: 'a_r14', rarity: 'RARE', name: '噬炎刀', desc: '吞噬火焰 (吸血 +5%)', val: { lifesteal: 0.05 } },
  { id: 'a_r15', rarity: 'RARE', name: '高階替身符', desc: '替死擋災 (復活機率 +8%)', val: { revive: 0.08 } },

  // --- EPIC (古寶：上古修士無法認主的強大遺寶 Gubao) ---
  { id: 'a_e01', rarity: 'EPIC', name: '虛天鼎仿製品', desc: '鎮壓氣運 (減傷+20%，氣運保底+0.3)', val: { def: 0.20, luck_floor: 0.30 } }, // 🔄 精確命名
  { id: 'a_e02', rarity: 'EPIC', name: '風雷翅', desc: '雷鵬之翼煉製古寶 (連擊效率+50%，閃避+12%)', val: { streak_eff: 0.50, evade: 0.12 } },
  { id: 'a_e03', rarity: 'EPIC', name: '紫羅極火', desc: '極寒之焰 (戰力+40%，爆傷+60%)', val: { atk: 0.40, crit_dmg: 0.60 } },
  { id: 'a_e04', rarity: 'EPIC', name: '嗜血幡', desc: '吸血魔器 (戰力+30%，吸血+10%)', val: { atk: 0.30, lifesteal: 0.10 } },
  { id: 'a_e05', rarity: 'EPIC', name: '狼首玉如意', desc: '召喚銀狼古寶 (氣血+40%，護盾+1)', val: { hp: 0.40, streak_shield: 1.0 } },
  { id: 'a_e06', rarity: 'EPIC', name: '五色珠', desc: '五行相生 (全修為/靈石獲取 +30%)', val: { qi: 0.30, stone: 0.30 } },
  { id: 'a_e07', rarity: 'EPIC', name: '銅錢古寶', desc: '落寶金錢 (氣運保底+0.4，靈石+50%)', val: { luck_floor: 0.40, stone: 0.50 } },
  { id: 'a_e08', rarity: 'EPIC', name: '魔髓鑽', desc: '破防極致 (爆傷+80%，無視防禦)', val: { crit_dmg: 0.80 } },
  { id: 'a_e09', rarity: 'EPIC', name: '降靈符', desc: '真靈附體 (戰力+45%，減傷+15%)', val: { atk: 0.45, def: 0.15 } },
  { id: 'a_e10', rarity: 'EPIC', name: '補天丹(法化)', desc: '洗髓易經 (氣血+50%，回血+20%)', val: { hp: 0.50, heal_bonus: 0.20 } },
  { id: 'a_e11', rarity: 'EPIC', name: '萬年靈乳', desc: '瞬間恢復 (復活機率 +12%)', val: { revive: 0.12 } },
  { id: 'a_e12', rarity: 'EPIC', name: '太玄八卦圖', desc: '推演天機 (反噬減傷+40%，連擊上限+30%)', val: { sense_def: 0.40, streak_cap: 0.30 } },

  // --- LEGENDARY (通天靈寶：靈界級別的頂尖寶物) ---
  { id: 'a_l01', rarity: 'LEGENDARY', name: '八靈尺', desc: '空間封鎖靈寶 (連擊上限+80%，閃避+18%)', val: { streak_cap: 0.80, evade: 0.18 } },
  { id: 'a_l02', rarity: 'LEGENDARY', name: '青竹蜂雲劍', desc: '本命劍陣核心 (戰力+80%，連擊效率+80%)', val: { atk: 0.80, streak_eff: 0.80 }, tags: ['sword'] },
  { id: 'a_l03', rarity: 'LEGENDARY', name: '大衍神君傀儡', desc: '元嬰後期戰力 (氣血+120%，護盾+2)', val: { hp: 1.20, streak_shield: 2.0 } }, 
  { id: 'a_l04', rarity: 'LEGENDARY', name: '黑風旗', desc: '空間法則靈寶 (閃避+20%，全減傷+40%)', val: { evade: 0.20, def: 0.40 } },
  { id: 'a_l05', rarity: 'LEGENDARY', name: '三焰扇', desc: '仿製靈寶 (戰力+90%，爆傷+100%)', val: { atk: 0.90, crit_dmg: 1.00 } },
  { id: 'a_l06', rarity: 'LEGENDARY', name: '萬妖幡', desc: '萬妖聽令 (氣血+100%，吸血+15%)', val: { hp: 1.00, lifesteal: 0.15 } },
  { id: 'a_l07', rarity: 'LEGENDARY', name: '五子同心魔', desc: '極凶之物 (戰力+110%，反噬防禦-20%)', val: { atk: 1.10, sense_def: -0.20 } },
  { id: 'a_l08', rarity: 'LEGENDARY', name: '成熟噬金蟲群', desc: '無物不噬 (戰力+100%，爆傷+120%)', val: { atk: 1.00, crit_dmg: 1.20 } },
  { id: 'a_l09', rarity: 'LEGENDARY', name: '虛天寶鼎', desc: '人界第一通天靈寶 (減傷+120%，折扣-50%)', val: { def: 1.20, forge_discount: 0.50 } }, // 📉 從玄天降級

  // --- MYTHIC (玄天之寶：一界法則凝聚而成的神物) ---
  { id: 'a_m01', rarity: 'MYTHIC', name: '玄天斬靈劍', desc: '斬裂法則 (戰力+200%，爆傷+250%)', val: { atk: 2.00, crit_dmg: 2.50 }, tags: ['sword'] },
  { id: 'a_m02', rarity: 'MYTHIC', name: '元磁神山', desc: '五行重力場 (戰力與減傷 +150%)', val: { atk: 1.50, def: 1.50 } },
  { id: 'a_m03', rarity: 'MYTHIC', name: '玄天化道匣', desc: '玄天之寶 (戰力+180%，氣運保底+0.8)', val: { atk: 1.80, luck_floor: 0.8 } }, // 📈 替換虛天鼎
  { id: 'a_m04', rarity: 'MYTHIC', name: '玄天如意刃', desc: '空間切割 (連擊上限+150%，爆傷+150%)', val: { streak_cap: 1.50, crit_dmg: 1.50 }, tags: ['sword'] },
  { id: 'a_m05', rarity: 'MYTHIC', name: '萬靈血璽', desc: '仙界謫仙之寶 (戰力+250%，復活+15%，護盾+3)', val: { atk: 2.50, revive: 0.15, streak_shield: 3.0 } },

  // --- DIVINE (造化至寶：超越法則的存在) ---
  { id: 'a_d01', rarity: 'DIVINE', name: '掌天瓶', desc: '奪天地造化催熟靈草 (靈氣+500%，靈石+300%)', val: { qi: 5.00, stone: 3.00 } },
  { id: 'a_d02', rarity: 'DIVINE', name: '游天鯤鵬翎', desc: '跨越界域真靈之羽 (閃避+25%，連擊效率+200%)', val: { evade: 0.25, streak_eff: 2.00 } },
  { id: 'a_d03', rarity: 'DIVINE', name: '金闕玉書', desc: '仙界天書 (靈石+600%，氣運保底+1.5)', val: { stone: 6.00, luck_floor: 1.50 } }
];

const SECRET_BOOKS = [
  { id: 's_01', rarity: 'UNCOMMON', name: '羅煙步', desc: '閃避靈壓。閃避率 +8%/級', val: { evade: 0.08 } },
  { id: 's_02', rarity: 'RARE', name: '血靈鑽', desc: '爆擊加成。爆擊傷害 +40%/級', val: { crit_dmg: 0.40 } },
  { id: 's_03', rarity: 'RARE', name: '大衍決', desc: '神識預判。效率+15%，反噬基礎減傷+15%/級', val: { streak_eff: 0.15, sense_def: 0.15 } },
  { id: 's_04', rarity: 'EPIC', name: '大庚劍陣', desc: '無堅不摧。戰力+30%，連擊上限+30%/級', val: { atk: 0.30, streak_cap: 0.30 } },
  { id: 's_14', rarity: 'EPIC', name: '三轉重元功', desc: '散功重修，法力精純。復活機率 +3%/級', val: { revive: 0.03 } },
  { id: 's_05', rarity: 'LEGENDARY', name: '元磁神光', desc: '克制五行。戰力與減傷 +20%/級', val: { atk: 0.20, def: 0.20 } },
  { id: 's_06', rarity: 'MYTHIC', name: '梵聖真魔功', desc: '法相金身。戰力+50%，減傷+10%/級', val: { atk: 0.50, def: 0.10 } },
  { id: 's_07', rarity: 'RARE', name: '辟邪神雷', desc: '至陽之雷。爆擊率+10%，爆傷+30%/級', val: { crit: 0.10, crit_dmg: 0.30 } },
  { id: 's_08', rarity: 'EPIC', name: '搜魂術', desc: '抽取記憶。擊殺靈氣 +20%/級', val: { qi: 0.20 } },
  { id: 's_09', rarity: 'UNCOMMON', name: '枯木逢春訣', desc: '生生不息。休息回血比例 +5%/級', val: { heal_bonus: 0.05 } },
  { id: 's_10', rarity: 'LEGENDARY', name: '驚蟄十二變', desc: '變身真靈。氣血+35%，真靈吸血+2%/級', val: { hp: 0.35, lifesteal: 0.02 } },
  { id: 's_11', rarity: 'DIVINE', name: '涅槃金身', desc: '不死不滅。復活機率 +8%/級', val: { revive: 0.08 } },
  { id: 's_12', rarity: 'RARE', name: '百脈煉寶訣', desc: '肉身融寶。洞府成本 -5%/級', val: { forge_discount: 0.05 } },
  { id: 's_13', rarity: 'EPIC', name: '明清靈目', desc: '看破虛妄。氣運保底 +0.1/級', val: { luck_floor: 0.10 } },
  { id: 's_15', rarity: 'EPIC', name: '劍影分光術', desc: '極限劍修。戰力+15%，連擊效率+15%/級', val: { atk: 0.15, streak_eff: 0.15 } },
  { id: 's_16', rarity: 'LEGENDARY', name: '疾風九變', desc: '極致身法。閃避率+6%，連擊上限+20%/級', val: { evade: 0.06, streak_cap: 0.20 } },
  { id: 's_17', rarity: 'UNCOMMON', name: '玄陰經', desc: '捨棄防禦。爆擊率+5%，防禦-3%/級', val: { crit: 0.05, def: -0.03 } },
  { id: 's_18', rarity: 'RARE', name: '血靈大法', desc: '魔道吸血。吸血+3%，爆傷+20%/級', val: { lifesteal: 0.03, crit_dmg: 0.20 } },
  { id: 's_19', rarity: 'EPIC', name: '托天魔功', desc: '肉身成聖。防禦+12%，氣血+10%/級', val: { def: 0.12, hp: 0.10 } },
  { id: 's_20', rarity: 'MYTHIC', name: '化劫大法', desc: '天道護主。滿級賦予 1 層護盾，復活+2%/級', val: { streak_shield: 0.20, revive: 0.02 } }
];

const BASIC_SKILLS = [
  { id: 'b_qi', name: '長春功', desc: '基礎靈氣獲取提升 +10%/級', val: { qi: 0.1 }, maxLvl: 20 },
  { id: 'b_atk', name: '青元劍訣', desc: '基礎戰鬥力提升 +10%/級', val: { atk: 0.1 }, maxLvl: 20 },
  { id: 'b_hp', name: '明王訣', desc: '基礎氣血上限提升 +10%/級', val: { hp: 0.1 }, maxLvl: 20 },
  { id: 'b_stone', name: '天眼術', desc: '任務靈石收益提升 +15%/級', val: { stone: 0.15 }, maxLvl: 20 },
];

const RARITY_BASE_COST = { COMMON: 1000, UNCOMMON: 5000, RARE: 25000, EPIC: 100000, LEGENDARY: 500000, MYTHIC: 2500000, DIVINE: 10000000 };

const TITLE_DATA = [
  { id: 't_kill_1', cat: 'kill', req: 50, tier: 1, name: '同階無敵', desc: '「死在閣下手下的同階修士，已不在少數。」', buffDesc: '總戰力加成 +10%', val: { atk: 0.10 } },
  { id: 't_kill_2', cat: 'kill', req: 200, tier: 2, name: '厲飛雨', desc: '「殺人放火厲飛雨，萬人敬仰韓天尊。道友，借個名號用用。」', buffDesc: '爆擊率 +10%，真靈吸血 +5%', val: { crit: 0.10, lifesteal: 0.05 } },
  { id: 't_kill_3', cat: 'kill', req: 1000, tier: 3, name: '修羅煞星', desc: '「百萬屍山血海中踏出的殺道。所過之處，即便是八級化形大妖也要退避三舍。」', buffDesc: '總戰力加成 +30%，爆擊傷害 +200%', val: { atk: 0.30, crit_dmg: 2.00 } },
  { id: 't_focus_1', cat: 'focus', req: 50, tier: 1, name: '向道之心', desc: '「資質平庸的偽靈根又如何？唯有堅如磐石的向道之心，方能走到最後。」', buffDesc: '靈氣獲取倍率 +15%', val: { qi: 0.15 } },
  { id: 't_focus_2', cat: 'focus', req: 200, tier: 2, name: '苦修之士', desc: '「閉關動輒數十載，世間繁華不過過眼雲煙。」', buffDesc: '靈氣獲取倍率 +30%，休息回血 +10%', val: { qi: 0.30, heal_bonus: 0.10 } },
  { id: 't_focus_3', cat: 'focus', req: 500, tier: 3, name: '歲月仙尊', desc: '「紅顏白骨，故人皆逝。你獨坐洞府，笑看滄海桑田，已與天地同壽。」', buffDesc: '靈氣獲取倍率 +80%，閃避免傷 +10%', val: { qi: 0.80, evade: 0.10 } },
  { id: 't_coin_1', cat: 'coin', req: 1000000, tier: 1, name: '身家豐厚', desc: '「在低階散修眼中，你已經是個不折不扣的大土豪了。」', buffDesc: '靈石掉落倍率 +15%', val: { stone: 0.15 } },
  { id: 't_coin_2', cat: 'coin', req: 10000000, tier: 2, name: '天南巨富', desc: '「靈石成山。這等身家，哪怕在天南修仙界也足以橫著走了。」', buffDesc: '靈石掉落倍率 +40%', val: { stone: 0.40 } },
  { id: 't_coin_3', cat: 'coin', req: 500000000, tier: 3, name: '財可通神', desc: '「連靈界大乘期老怪看到你的儲物袋，也會忍不住生出殺人奪寶的心思。」', buffDesc: '靈石倍率 +150%，氣運保底 +0.5', val: { stone: 1.50, luck_floor: 0.50 } },
  { id: 't_art_1', cat: 'artifact', req: 15, tier: 1, name: '身懷異寶', desc: '「財不露白，道友還是盡早將這些寶物收進儲物袋為妙。」', buffDesc: '氣運保底 +0.15', val: { luck_floor: 0.15 } },
  { id: 't_art_2', cat: 'artifact', req: 40, tier: 2, name: '一身是寶', desc: '「『不可能！你區區一介散修，身家怎會比老夫還要豐厚！』」', buffDesc: '連擊上限 +50%，氣運保底 +0.3', val: { streak_cap: 0.50, luck_floor: 0.30 } },
  { id: 't_art_3', cat: 'artifact', req: 75, tier: 3, name: '多寶天尊', desc: '「玄天之寶、造化至寶盡入你手，此界天道法則已被你徹底顛覆。」', buffDesc: '連擊上限 +150%，氣運保底 +0.8', val: { streak_cap: 1.50, luck_floor: 0.80 } },
  { id: 't_sec_1', cat: 'secret', req: 4, tier: 1, name: '博覽群書', desc: '「藏經閣內的玉簡被你翻了個遍，對各派功法皆有涉獵。」', buffDesc: '反噬基礎減傷 +10%', val: { sense_def: 0.10 } },
  { id: 't_sec_2', cat: 'secret', req: 9, tier: 2, name: '法體雙修', desc: '「功法龐雜卻互不衝突，靈力與肉身皆臻至化境，實力遠超同階修士。」', buffDesc: '氣血上限加成 +20%，神識減傷 +15%', val: { hp: 0.20, sense_def: 0.15 } },
  { id: 't_sec_3', cat: 'secret', req: 13, tier: 3, name: '萬法歸一', desc: '「天下萬般神仙妙法，在你眼中皆如掌上觀紋，直指大道本源。」', buffDesc: '氣血上限 +50%，反噬與神識減傷皆 +30%', val: { hp: 0.50, sense_def: 0.30, def: 0.30 } },
  { id: 't_max_1', cat: 'max', req: 1, tier: 1, name: '爐火純青', desc: '「將一門功法推演至極致，便足以在修仙界立足。」', buffDesc: '連擊效率倍率 +15%', val: { streak_eff: 0.15 } },
  { id: 't_max_2', cat: 'max', req: 4, tier: 2, name: '大衍傳人', desc: '「將數門頂級功法推演至極限，即便是大衍神君在世，也要讚你一聲奇才。」', buffDesc: '連擊效率倍率 +40%，總戰力 +20%', val: { streak_eff: 0.40, atk: 0.20 } },
  { id: 't_max_3', cat: 'max', req: 10, tier: 3, name: '開宗立派', desc: '「你對大道的理解已超越創造這些功法的前人，隨手一指便可為一界之尊。」', buffDesc: '連擊效率 +100%，戰力/氣血/靈石/靈氣全域 +30%', val: { streak_eff: 1.00, atk: 0.30, hp: 0.30, stone: 0.30, qi: 0.30 } }
];

const COMPANIONS = [
  { 
    id: 'c_chen', name: '陳巧倩', unlockIdx: 4, desc: '「韓師弟，你真的不明白我的心意嗎？」落雲宗師姐，對你一往情深，至死未嫁。', 
    buffType: 'atk', buffName: '痴情劍意', buffDesc: '總戰力加成', tiers: [5, 10, 20, 30],
    quotes: [
      ['韓師弟，你也來參加血色禁地試煉嗎？', '多謝師弟出手相救，巧倩感激不盡...'], 
      ['師弟，這是我熬製的靈湯，你且喝下。', '只要能默默為你護法，巧倩便心滿意足了。'], 
      ['師弟，你...你真的不明白我的心意嗎？', '無論你去哪裡，巧倩都願意追隨。', '看著你修煉的側臉，總讓我微微失神...'], 
      ['師弟的背影，巧倩這輩子都不會忘記。', '哪怕是粉身碎骨，我也要護你周全！', '此生能與師弟結為道侶，巧倩死而無憾。'] 
    ] 
  },
  { 
    id: 'c_dong', name: '董萱兒', unlockIdx: 6, desc: '「師兄，你看看萱兒嘛。」紅拂仙子之女，天生媚骨，後轉修魔道。', 
    buffType: 'evade', buffName: '幻媚之身', buffDesc: '閃避率提升', tiers: [2, 4, 8, 15],
    quotes: [
      ['這位同門好生面生，莫非就是韓師兄？', '哼，木頭一個，真是無趣極了。'], 
      ['師兄~ 你都修煉這麼久了，理理萱兒嘛！', '有我在，哪個不長眼的敢來打擾師兄？'], 
      ['師兄的修為又精進了，萱兒可不能被落下呢。', '師兄，你心裡到底有沒有萱兒的位置？', '只要你一句話，萱兒做什麼都願意。'], 
      ['為了師兄，哪怕背叛師門萱兒也在所不惜！', '誰敢動你一根汗毛，我董萱兒必將他抽魂煉魄！', '天涯海角，黃泉碧落，萱兒跟定你了。'] 
    ] 
  },
  { 
    id: 'c_nangong', name: '南宮婉', unlockIdx: 9, desc: '「你這登徒子...」掩月宗長老，血色禁地結下不解之緣，唯一的正室妻子。', 
    buffType: 'qi', buffName: '素女輪迴', buffDesc: '靈氣獲取倍率', tiers: [8, 15, 30, 50],
    quotes: [
      ['你這登徒子，竟敢...罷了，此間之事不准外傳。', '區區煉氣期修士，也敢大言不慚。'], 
      ['這小子的功法倒是有些門道...', '別分心，好好守住陣眼，外圍交給我。'], 
      ['夫君，修仙路阻且長，切莫急於求成。', '你這冤家，一閉關就是這麼久，也不怕我擔心。', '有我在旁為你護法，大可安心衝關。'], 
      ['生死契闊，與子成說。夫君，婉兒定護你周全。', '誰若敢斷你大道，我必讓他血濺三尺！', '大道之巔，婉兒願與夫君並肩而立。'] 
    ] 
  },
  { 
    id: 'c_yuan', name: '元瑤', unlockIdx: 12, desc: '「韓兄大恩，元瑤沒齒難忘。」為救師姐不惜修煉陰陽輪迴訣，重情重義。', 
    buffType: 'hp', buffName: '陰陽秘術', buffDesc: '氣血上限加成', tiers: [5, 10, 20, 30],
    quotes: [
      ['青元子前輩的傳人？韓兄，小女子這廂有禮了。', '萍水相逢，多謝韓兄照應。'], 
      ['韓兄大恩，元瑤無以為報。', '有韓兄在，元瑤心裡踏實多了。'], 
      ['韓兄的法力越發深不可測了，元瑤定會努力跟上。', '只要能留在韓兄身邊，元瑤便心甘情願。', '每次看到韓兄平安出關，元瑤懸著的心才放得下。'], 
      ['哪怕化身鬼修，元瑤也要生生世世為韓兄護法！', '韓兄，這一次，換元瑤來保護你！', '萬載歲月又如何？元瑤的眼裡始終只有韓兄一人。'] 
    ] 
  },
  { 
    id: 'c_ziling', name: '紫靈仙子', unlockIdx: 14, desc: '「韓兄，亂星海一別，別來無恙？」妙音門門主，亂星海第一美女，紅顏知己。', 
    buffType: 'luck_floor', buffName: '妙音氣運', buffDesc: '氣運保底加成', tiers: [0.05, 0.10, 0.20, 0.30],
    quotes: [
      ['妙音門紫靈，見過前輩。', '這修仙界弱肉強食，紫靈深知其中險惡。'], 
      ['韓兄，你我聯手，這修仙界哪裡去不得？', '韓兄的心智與手段，紫靈實在佩服。'], 
      ['看著韓兄修煉的樣子，紫靈竟也有些痴了...', '這點機緣，比起韓兄的安危，又算得了什麼？', '在韓兄身邊，紫靈才覺得這修仙界並非只有算計。'], 
      ['紫靈此生，唯願與韓兄攜手傲視三界！', '哪怕捨棄這身絕世容顏，紫靈也要護你破劫！', '天道縹緲，唯你我之間的情分，真實不虛。'] 
    ] 
  },
  { 
    id: 'c_yinyue', name: '銀月', unlockIdx: 17, desc: '「主人，銀月會一直陪著你。」靈界銀狼一族，化為器靈長伴左右，共患難。', 
    buffType: 'crit_dmg', buffName: '天狼神擊', buffDesc: '爆擊傷害提升', tiers: [10, 20, 40, 60],
    quotes: [
      ['主人，銀月傷勢已無大礙，願為主人效勞。', '主人若有差遣，銀月萬死不辭。'], 
      ['嘻嘻，主人的神通又變強了，銀月也跟著沾光呢。', '有銀月在，主人安心打坐便是。'], 
      ['無論主人去哪裡，銀月都會化為器靈，寸步不離。', '只要能幫到主人，銀月做什麼都願意。', '看著主人一路走來，銀月心裡既驕傲又心疼。'], 
      ['主人！銀月為您護法，沒有任何宵小能靠近！', '誰敢傷我主人，銀月定要他神魂俱滅！', '哪怕銀狼一族覆滅，銀月也是主人永遠的器靈！'] 
    ] 
  },
  { 
    id: 'c_bingfeng', name: '冰鳳', unlockIdx: 21, desc: '「韓道友，你我聯手撕裂空間如何？」冰海之主，掌握空間法則的十級妖修。', 
    buffType: 'streak_cap', buffName: '破空靈羽', buffDesc: '連擊增傷上限', tiers: [10, 20, 40, 60],
    quotes: [
      ['閣下就是韓立？聽說你手中握有虛天鼎。', '人族修士，別以為本宮會輕易屈服。'], 
      ['哼，別誤會，為你護法只是為了我們能早日飛升罷了。', '這點靈氣波動就大驚小怪，真是沒見過世面。'], 
      ['你的空間造詣又提升了？看來本宮也不能懈怠。', '跟在你身邊，倒也不算太無趣。', '若有危險，本宮自會撕裂空間帶你走。'], 
      ['你若死了，本宮絕不獨活！專心突破，外敵交給我！', '萬年寒冰，也凍結不了你我之間的羈絆。', '九天十地，本宮只認你這一個道侶！'] 
    ] 
  },
  { 
    id: 'c_baohua', name: '寶花始祖', unlockIdx: 25, desc: '「你區區一名人族大乘，竟敢直視本座？」魔界三大始祖之一，與你亦敵亦友。', 
    buffType: 'def', buffName: '玄天聖樹', buffDesc: '護甲防禦加成', tiers: [5, 10, 20, 30],
    quotes: [
      ['人族修士，你身上竟有本座玄天聖樹的氣息？', '區區螻蟻，也敢直視本座？'], 
      ['能讓本座為你護法，你也算死而無憾了。', '你的法則之力，倒是勉強入得了本座的眼。'], 
      ['你的進步速度，確實出乎本座意料。', '咯咯，這點程度的天劫，在本座眼裡不過是兒戲。', '放心運功吧，有本座在，魔界無人敢動你。'], 
      ['魔界雖大，本座眼中卻只有你一人。', '誰敢動本座的盟友？吾必血洗他滿門！', '待你登臨仙界，本座定要與你再戰三百回合！'] 
    ] 
  }
];

const COMPANION_TIERS = [
  { req: 1, name: '初識' },
  { req: 250, name: '相知' },
  { req: 1250, name: '傾心' },
  { req: 2500, name: '生死相隨' }
];

const getCompanionTier = (exp) => {
  if (exp >= 2500) return 3;
  if (exp >= 1250) return 2;
  if (exp >= 250) return 1;
  if (exp >= 1) return 0;
  return -1;
};

// ==========================================
// 萬妖圖鑑 2.0 (Mob vs Boss)
// ==========================================
const MOB_POOLS = {
  '凡人': [
    { name: '地痞流氓', s: '揮拳', b: '暗算', q: '小子，把身上值錢的都交出來！' }, 
    { name: '猛虎野獸', s: '撲咬', b: '猛擊', q: '吼——！（飢腸轆轆地盯著你）' }, 
    { name: '野狼幫眾', s: '砍刀', b: '淬毒刃', q: '敢惹我們野狼幫？找死！' }
  ],
  '煉氣': [
    { name: '煉氣散修', s: '火彈術', b: '飛劍偷襲', q: '道友，借你項上人頭與儲物袋一用！' }, 
    { name: '低階妖獸', s: '爪擊', b: '妖氣吐息', q: '嘶嘶...（散發著陰冷的腥風）' }, 
    { name: '劫匪修士', s: '土刺術', b: '符籙連發', q: '區區偽靈根，也敢在外面亂晃？' }
  ],
  '築基': [
    { name: '築基邪修', s: '陰魂絲', b: '血祭術', q: '桀桀桀，正好缺個生魂來祭煉法器！' }, 
    { name: '二級妖獸', s: '毒液', b: '狂暴衝撞', q: '（狂躁地刨著地，妖氣沖天）' }, 
    { name: '魔道弟子', s: '魔氣斬', b: '煞氣入體', q: '能死在我聖門功法之下，是你的榮幸！' }
  ],
  '結丹': [
    { name: '結丹魔修', s: '魔火', b: '法寶重擊', q: '結丹期以下皆為螻蟻，給我碎！' }, 
    { name: '五級妖獸', s: '妖丹之力', b: '天賦本能', q: '（吐出妖丹，周圍靈氣瞬間暴走）' }, 
    { name: '海王族戰士', s: '水箭', b: '驚濤駭浪', q: '人族修士，膽敢踏入外星海！' }
  ],
  '元嬰': [
    { name: '元嬰老怪', s: '瞬移背刺', b: '嬰火灼燒', q: '老夫閉關百年，正好拿你來搜魂！' }, 
    { name: '化形妖獸', s: '妖力風暴', b: '真身降臨', q: '人類，你的元嬰大補啊...哈哈哈哈！' }, 
    { name: '慕蘭法士', s: '初級靈術', b: '高階五行術', q: '天南的修士，不過是一群烏合之眾！' }
  ],
  '化神': [
    { name: '化神修士', s: '天地元氣', b: '空間封鎖', q: '這方天地的元氣，已被本座徹底封鎖！' }, 
    { name: '高階古獸', s: '蠻荒之力', b: '毀滅吐息', q: '（一聲狂吼，震碎了方圓百里的山峰）' }, 
    { name: '陰羅宗長老', s: '幽冥鬼火', b: '萬魂噬體', q: '乖乖化為我鬼羅幡中的主魂吧！' }
  ],
  '煉虛': [
    { name: '煉虛異族', s: '空間裂縫', b: '法則皮毛', q: '連空間之力都不懂的下族，受死！' }, 
    { name: '虛空惡獸', s: '虛空吞噬', b: '空間風暴', q: '（從虛空中探出巨爪，毫無感情地凝視）' }, 
    { name: '靈界匪徒', s: '聯手法陣', b: '異寶轟殺', q: '肥羊上門了，兄弟們結陣！' }
  ],
  '合體': [
    { name: '合體尊者', s: '法相虛影', b: '天地同化', q: '法相一出，萬法皆滅！你拿什麼擋？' }, 
    { name: '蠻荒古獸', s: '真靈血脈', b: '毀天滅地', q: '（真靈之威擴散，令你神魂戰慄）' }, 
    { name: '角蚩族甲士', s: '圖騰之力', b: '戰陣合擊', q: '吾族稱霸靈界，爾等唯有臣服！' }
  ],
  '大乘': [
    { name: '大乘老怪', s: '法則壓制', b: '本源一擊', q: '本座即是天道，言出法隨，給我鎮！' }, 
    { name: '真靈遺種', s: '真靈法則', b: '吞噬天地', q: '（張開深淵巨口，連光線都被吞噬）' }, 
    { name: '跨界魔族', s: '真魔之氣', b: '天魔降臨', q: '聖祭開始！此界生靈，皆為祭品！' }
  ],
  '渡劫': [
    { name: '四九小天劫', s: '劫雷', b: '心魔幻象', q: '（劫雲密布，天威煌煌不可直視）' }, 
    { name: '九天罡風', s: '撕裂', b: '罡風柱', q: '（無形的罡風，彷彿要將肉身千刀萬剮）' }, 
    { name: '紅蓮業火', s: '灼魂', b: '焚盡八荒', q: '（業火自心底燃起，焚盡世間一切罪孽）' }
  ]
};

const BOSS_POOL = [
  { name: '凶人墨大夫', s: '銀針偷襲', b: '魔銀手', q: '嘿嘿，韓立，乖乖把軀殼交給老夫吧！' },
  { name: '野狼幫賈天龍', s: '金刃術', b: '鐵甲衝鋒', q: '七玄門今天必須滅門！殺！' },
  { name: '金光上人', s: '符籙火彈', b: '金光磚重砸', q: '我有仙家符寶，凡人拿什麼跟我鬥！' },
  { name: '陸師兄', s: '青風劍訣', b: '狂風絕息', q: '陳師妹是我的，你這廢物給我去死！' },
  { name: '狂人封岳', s: '黃羅傘', b: '踏雲靴突襲', q: '越國七派的弟子？正好拿來試刀！' },
  { name: '血色禁地・墨蛟', s: '巨尾掃擊', b: '黑色毒火', q: '吼——！（被激怒的恐怖毒蛟，眼中充滿暴虐）' },
  { name: '黑煞教徒', s: '煞氣侵蝕', b: '血祭妖功', q: '為教主獻上你們的精血吧！' },
  { name: '越皇化身', s: '血靈光波', b: '黑蛟血爪', q: '朕即是天！誰敢阻我結丹！' },
  { name: '鬼靈門王蟬', s: '幽冥鬼爪', b: '血靈大法', q: '我要把你抽魂煉魄，折磨百年！' },
  { name: '血線蛟', s: '血線纏繞', b: '嗜血毒液', q: '（潛伏在暗處，發出令人毛骨悚然的嘶嘶聲）' },
  { name: '雙尾人面蠍', s: '巨螯夾擊', b: '雙尾毒針', q: '（堅硬的甲殼摩擦，毒針閃爍著致命的藍光）' },
  { name: '溫天仁', s: '魔雷術', b: '八門金光鏡', q: '本少主看上的東西，還沒有得不到的！' },
  { name: '鐵甲煉屍', s: '屍毒噴濺', b: '銅皮鐵骨撞', q: '（毫無痛覺的怪物，發出低沉的屍吼）' },
  { name: '極陰祖師', s: '玄陰魔氣', b: '天都屍火', q: '小輩，交出虛天鼎，老祖我大發慈悲給你個痛快！' },
  { name: '裂風獸風希', s: '風刃亂舞', b: '裂風斬', q: '小子，能死在我的風雷翅下，也算你的造化！' },
  { name: '六道極聖', s: '魔道秘術', b: '真魔附體', q: '逆星盟辦事，順我者昌，逆我者亡！' },
  { name: '古魔血焰', s: '魔氣侵襲', b: '血焰魔刀', q: '這人界靈氣如此稀薄，真是令魔作嘔！' },
  { name: '陰羅宗宗主', s: '鬼羅幡動', b: '陰羅幽火', q: '敢殺我宗長老，我要你整個天南陪葬！' },
  { name: '化形毒蛟', s: '蛟龍水箭', b: '碧綠毒丹', q: '卑鄙的人類，竟敢貪圖本王的妖丹！' },
  { name: '夜叉族守衛', s: '飛叉突刺', b: '夜叉冥水', q: '擅闖異族領地者，殺無赦！' },
  { name: '角蚩族戰尊', s: '角蚩秘術', b: '圖騰真身', q: '在我角蚩大軍面前，爾等不過是擋車的螳螂！' },
  { name: '六翼霜蚣', s: '極寒冰刺', b: '絕對冰封', q: '（展開六翼，周圍的空間瞬間凍結成冰域）' },
  { name: '銀甲屍王', s: '銀甲霸體', b: '千年屍毒爆', q: '（沉睡千年的屍王甦醒，目光鎖定了你的元嬰）' },
  { name: '高階魔尊', s: '真魔之氣', b: '無相魔功', q: '靈界？很快就會變成我們聖界的牧場了！' },
  { name: '元剎聖祖化身', s: '黑魔匕首', b: '元剎魔域', q: '區區人族大乘，也敢直視本聖祖的真容？' },
  { name: '噬金蟲王', s: '金甲衝撞', b: '無物不噬', q: '（發出刺耳的蟲鳴，鋪天蓋地的蟲海向你湧來）' },
  { name: '海王族大乘', s: '覆海印', b: '驚濤駭浪', q: '大海的怒火，你承受得起嗎！' },
  { name: '六極聖祖', s: '六極幻影', b: '六道天魔境', q: '咯咯咯... 你的神魂，我就毫不客氣地收下了。' },
  { name: '降臨謫仙馬良', s: '仙家法術', b: '萬靈血璽', q: '下界螻蟻，也配讓本仙君親自動手？' },
  { name: '始印神尊', s: '神尊法印', b: '滅世法則', q: '吾乃此界真神，你的命運已然註定！' },
  { name: '游天鯤鵬', s: '裂空擊', b: '空間風暴', q: '（振翅之間，跨越無數位面，視你如微塵）' },
  { name: '真靈羅睺', s: '幽冥之氣', b: '吞天噬地', q: '（宛如星辰般巨大的黑影，緩緩睜開了雙眼）' },
  { name: '螟蟲之母', s: '螟蟲海', b: '天道毀滅', q: '嘶嘶... 吞噬... 毀滅一切法則...' },
  { name: '九九重劫', s: '五行神雷', b: '紫霄神雷劫', q: '轟隆隆！天道無情，逆天者，當受神雷洗禮！' }
];

/**
 * ========================================================
 * 2. 主組件 (App)
 * ========================================================
 */

export default function App() {
/**
   * ========================================================
   * 2. 玩家狀態與系統陣法 (Player State & Core Systems)
   * ========================================================
   */

  const defaultPlayerState = { 
    realmIndex: 0, qi: 0, qiToNext: 250, vitality: 100, baseMaxVitality: 100, coins: 0, baseCombat: 150, 
    artifacts: [], artifactLvls: {}, basicSkills: {}, secretBooks: {}, arrays: { qi: 0, def: 0 }, 
    streakCount: 0, streakShields: 0, luck: 1.0, totalFocusTime: 0, history: [], hasAscended: false,
    lifetimeStats: { kills: 0, focusCount: 0, totalCoins: 0 },
    unlockedTitles: [], equippedTitle: null, 
    dailyGacha: 0,    // ✨ 每日機緣 (上限 1)
    awardGacha: 0,    // ✨ 稱號功勳 (永久累積)
    epiphanyPills: 0, lastPillTime: 0,
    activeCompanion: null, companionKills: {},
    lastDailyTime: 0, // 紀錄上次領取每日機緣的時間戳
    logs: ['【天道印記】仙途漫漫，唯『靜心專注』方能證道。以現世之光陰，化此界之修為。'] 
  };

  const [player, setPlayer] = useState(() => {
    try {
      const saved = localStorage.getItem('xianxia_master_v69');
      if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              // 🔄 數據遷移：自動將舊版的 freeGacha 轉移至新的永久池 awardGacha
              if (parsed.freeGacha !== undefined) {
                parsed.awardGacha = (parsed.awardGacha || 0) + parsed.freeGacha;
                delete parsed.freeGacha;
              }
              return { ...defaultPlayerState, ...parsed };
          }
      }
      return defaultPlayerState;
    } catch (e) { return defaultPlayerState; }
  });

  // 🎵 音效陣法初始化 (保留原本 Ref)
  const focusEndAudioRef = useRef(null);
  const breakEndAudioRef = useRef(null);
  const activeRealmRef = useRef(null);
  useEffect(() => {
    focusEndAudioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/meditation_bell.ogg');
    breakEndAudioRef.current = new Audio('https://actions.google.com/sounds/v1/water/water_drop.ogg');
  }, []);

  // ⏰ 世界運轉計時器 (每秒刷新 now 狀態)
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // 💾 自動存檔與雲端同步 (帶 Debounce 邏輯)
  const [saveIndicator, setSaveIndicator] = useState(false);
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      localStorage.setItem('xianxia_master_v69', JSON.stringify(player));
      setSaveIndicator(true);
      setTimeout(() => setSaveIndicator(false), 2000);
    }, 1000);
    return () => clearTimeout(debounceTimer);
  }, [player]);

  // ☀️ 每日機緣重置陣法 (早上 08:00)
  useEffect(() => {
    const todayNow = new Date();
    const lastClaim = new Date(player.lastDailyTime || 0);
    
    // 計算邏輯：將時間減去 8 小時，若日期不同，則代表跨過了早上 8 點
    const getAdjustedDate = (date) => {
      const d = new Date(date);
      d.setHours(d.getHours() - 8);
      return d.toDateString();
    };

    if (getAdjustedDate(todayNow) !== getAdjustedDate(lastClaim)) {
      setPlayer(p => ({
        ...p,
        dailyGacha: 1, // ✨ 強制設為 1，不領取明日不補，不可累積
        lastDailyTime: Date.now()
      }));
      addLog("☀️ 【每日機緣】晨曦初露，今日份的保底尋寶機緣已就緒（提醒：每日機緣不可累積，不領則廢，請及時使用）。");
    }
  }, []); // 僅在開啟網頁時判定一次
  const generateMonsterState = (realmIdx, currentQi, qiToNext) => {
    const isBossReady = currentQi >= qiToNext;
    const nTier = realmIdx + 1;
    const isFinal = realmIdx === REALMS.length - 1;
    const majorName = REALMS[realmIdx].majorName;
    
    let mName, sAtkName, bAtkName, isBoss, mQuote;
    let bossMult = 1;

    if (isBossReady || isFinal) {
        const bData = BOSS_POOL[Math.min(nTier - 1, BOSS_POOL.length - 1)];
        mName = `${bData.name} [死劫/瓶頸]`;
        sAtkName = bData.s;
        bAtkName = bData.b;
        mQuote = bData.q; 
        isBoss = true;
        bossMult = isFinal ? 20 : 4; 
    } else {
        const pools = MOB_POOLS[majorName] || MOB_POOLS['凡人'];
        const mData = pools[Math.floor(Math.random() * pools.length)];
        mName = mData.name;
        sAtkName = mData.s;
        bAtkName = mData.b;
        mQuote = mData.q; 
        isBoss = false;
        bossMult = 1;
    }
    
    const nHp = Math.floor(120 * Math.pow(1.25, nTier - 1) * bossMult);
    const mAtk = Math.floor(30 * Math.pow(1.2, nTier - 1) * (isBoss ? 2.5 : 1) * (isFinal ? 10 : 1));
    
    if (isFinal && isBossReady) {
        mName = '【九九重劫】';
        sAtkName = '五行神雷';
        bAtkName = '紫霄神雷劫';
        mQuote = '轟隆隆！天道無情，逆天者，當受神雷洗禮！'; 
    }

    return { name: mName, hp: nHp, maxHp: nHp, tier: nTier, atk: mAtk, sAtkName, bAtkName, isBoss, quote: mQuote };
  };

  const [monster, setMonster] = useState(() => {
    try {
        const saved = localStorage.getItem('xianxia_monster_v69');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.tier === player.realmIndex + 1) {
                return parsed;
            }
        }
    } catch (e) {}
    return generateMonsterState(player.realmIndex, player.qi, player.qiToNext);
  });

  useEffect(() => {
      localStorage.setItem('xianxia_monster_v69', JSON.stringify(monster));
  }, [monster]);

  const totalSP = useMemo(() => {
    let total = 0;
    for (let i = 1; i <= player.realmIndex; i++) {
      total += REALMS[i]?.isMajor ? 5 : 3;
    }
    return total;
  }, [player.realmIndex]);

  const availableSP = useMemo(() => {
    const basicSpent = Object.values(player.basicSkills || {}).reduce((a, b) => a + b, 0);
    const secretSpent = Object.values(player.secretBooks || {}).reduce((a, b) => {
      return a + (b > 0 ? b - 1 : 0); 
    }, 0);
    return Math.max(0, totalSP - basicSpent - secretSpent);
  }, [totalSP, player.basicSkills, player.secretBooks]);

  const [globalStats, setGlobalStats] = useState({ focus: 0, ascensions: 0 });
  const sessionLockRef = useRef(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg, drops = []) => {
    setToast({ type, msg, drops });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    const statsRef = ref(database, 'globalStats');
    const unsubscribe = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        setGlobalStats({
          focus: data.totalFocusCount || 0,
          ascensions: data.totalAscensions || 0
        });
      }
    });
    return () => unsubscribe();
  }, []);

useEffect(() => {
    let newlyUnlocked = [];
    let addedAwardGacha = 0; // 紀錄本次新獲得的稱號次數
    
    TITLE_DATA.forEach(t => {
       if (!(player.unlockedTitles || []).includes(t.id)) {
          let conditionMet = false;
          if (t.cat === 'kill' && (player.lifetimeStats?.kills || 0) >= t.req) conditionMet = true;
          if (t.cat === 'focus' && (player.lifetimeStats?.focusCount || 0) >= t.req) conditionMet = true;
          if (t.cat === 'coin' && (player.lifetimeStats?.totalCoins || 0) >= t.req) conditionMet = true;
          if (t.cat === 'artifact' && (player.artifacts?.length || 0) >= t.req) conditionMet = true;
          if (t.cat === 'secret') {
             const unlockedSecrets = Object.keys(player.secretBooks || {}).filter(k => player.secretBooks[k] > 0).length;
             if (unlockedSecrets >= t.req) conditionMet = true;
          }
          if (t.cat === 'max') {
             let maxCount = 0;
             BASIC_SKILLS.forEach(s => { if ((player.basicSkills?.[s.id] || 0) >= s.maxLvl) maxCount++; });
             SECRET_BOOKS.forEach(s => { if ((player.secretBooks?.[s.id] || 0) >= 5) maxCount++; });
             if (maxCount >= t.req) conditionMet = true;
          }
          
          if (conditionMet) {
             newlyUnlocked.push(t.id);
             addedAwardGacha += 1;
          }
       }
    });
  
    if (newlyUnlocked.length > 0) {
       setPlayer(p => {
          const updatedUnlocked = [...(p.unlockedTitles || []), ...newlyUnlocked];
          const updatedLogs = [...(p.logs || [])];
          newlyUnlocked.forEach(id => {
             const titleName = TITLE_DATA.find(x => x.id === id).name;
             updatedLogs.unshift(`🏆 【天道恩賜】解鎖稱號「${titleName}」！獲贈永久尋寶次數 1 次！`);
          });
          return { 
            ...p, 
            unlockedTitles: updatedUnlocked, 
            awardGacha: (p.awardGacha || 0) + addedAwardGacha, // 注入永久功勳池
            logs: updatedLogs.slice(0, 200) 
          };
       });
    }
  }, [player.lifetimeStats, player.artifacts, player.basicSkills, player.secretBooks]);

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

// START PATCH [離線閉關與時空定序]
  const savedTimer = useMemo(() => {
      try { return JSON.parse(localStorage.getItem('xianxia_timer_v69')); } catch(e) { return null; }
  }, []);

  const [focusDuration, setFocusDuration] = useState(savedTimer?.focusDuration || 25 * 60);
  const [targetEndTime, setTargetEndTime] = useState(savedTimer?.targetEndTime || null);
  const [isActive, setIsActive] = useState(savedTimer?.isActive || false);
  const [mode, setMode] = useState(savedTimer?.mode || 'focus'); 
  const [timeLeft, setTimeLeft] = useState(() => {
      // 網頁重載時，精準校驗時間差
      if (savedTimer?.isActive && savedTimer?.targetEndTime) {
          const remain = Math.floor((savedTimer.targetEndTime - Date.now()) / 1000);
          return Math.max(0, remain); // 若已超時，回傳 0 以利後續直接觸發結算
      }
      return savedTimer?.focusDuration || 25 * 60;
  });

  // 自動將時空狀態烙印至識海
  useEffect(() => {
      localStorage.setItem('xianxia_timer_v69', JSON.stringify({
          focusDuration, targetEndTime, isActive, mode
      }));
  }, [focusDuration, targetEndTime, isActive, mode]);
// END PATCH [離線閉關與時空定序]
  const [activeTab, setActiveTab] = useState('log');
  const [showRealmGuide, setShowRealmGuide] = useState(false);
  const [showStatsReport, setShowStatsReport] = useState(false);
  const [activeStat, setActiveStat] = useState(null); // 紀錄當前選中的屬性

  // ✨ 神識自動對焦：當點擊屬性後，自動捲動至視窗中心 (解決手機端被擋住的問題)
  useEffect(() => {
    if (activeStat && showStatsReport) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`stat-row-${activeStat}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeStat, showStatsReport]);
  const [showGuide, setShowGuide] = useState(false); 
  const [showTitles, setShowTitles] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [importString, setImportString] = useState(''); 
  const [guideTab, setGuideTab] = useState('rules'); 
  const [celebration, setCelebration] = useState(null);
  const [showGiveUpWarning, setShowGiveUpWarning] = useState(false);

  const [isAttacking, setIsAttacking] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [isCritStrike, setIsCritStrike] = useState(false); 
  const [isKilling, setIsKilling] = useState(false); 
  const [isHealing, setIsHealing] = useState(false); 
  const [isGachaPulling, setIsGachaPulling] = useState(false); // ✨ 新增：尋寶懸念狀態
  
  useEffect(() => {
    if (!isActive && activeRealmRef.current) {
      activeRealmRef.current.scrollIntoView({
        behavior: 'smooth', 
        inline: 'center',   
        block: 'nearest'    
      });
    }
  }, [player.realmIndex, isActive]); 

  const sortedArtifacts = useMemo(() => {
    const weight = { 'COMMON': 1, 'UNCOMMON': 2, 'RARE': 3, 'EPIC': 4, 'LEGENDARY': 5, 'MYTHIC': 6, 'DIVINE': 7 };
    return [...ARTIFACT_POOL].sort((a, b) => {
      const ownedA = (player.artifacts || []).includes(a.id) ? 1 : 0;
      const ownedB = (player.artifacts || []).includes(b.id) ? 1 : 0;
      if (ownedA !== ownedB) return ownedB - ownedA;
      return weight[b.rarity] - weight[a.rarity];
    });
  }, [player.artifacts]);

  const sortedSecretBooks = useMemo(() => {
    const weight = { 'COMMON': 1, 'UNCOMMON': 2, 'RARE': 3, 'EPIC': 4, 'LEGENDARY': 5, 'MYTHIC': 6, 'DIVINE': 7 };
    return [...SECRET_BOOKS].sort((a, b) => {
      const ownedA = (player.secretBooks?.[a.id] > 0) ? 1 : 0;
      const ownedB = (player.secretBooks?.[b.id] > 0) ? 1 : 0;
      if (ownedA !== ownedB) return ownedB - ownedA;
      return weight[b.rarity] - weight[a.rarity];
    });
  }, [player.secretBooks]);

  const getMultiplier = (type) => {
    let mult = 1.0;
    BASIC_SKILLS.forEach(s => { if (player.basicSkills?.[s.id] > 0 && s.val?.[type]) mult += s.val[type] * player.basicSkills[s.id]; });
    Object.entries(player.secretBooks || {}).forEach(([id, lvl]) => { const book = SECRET_BOOKS.find(x => x.id === id); if (book?.val?.[type]) mult += book.val[type] * lvl; });
    (player.artifacts || []).forEach(id => { 
        const item = ARTIFACT_POOL.find(a => a.id === id); 
        if (item?.val?.[type]) mult += item.val[type];
    });
    if (player.equippedTitle) { const activeTitle = TITLE_DATA.find(t => t.id === player.equippedTitle); if (activeTitle?.val?.[type]) mult += activeTitle.val[type]; }
    if (type === 'atk' || type === 'streak_cap') { const swordCount = (player.artifacts || []).filter(id => ARTIFACT_POOL.find(a => a.id === id)?.tags?.includes('sword')).length; if (swordCount >= 2) mult += 0.2 * swordCount; }
    if (type === 'qi' && (player.arrays?.qi || 0)) mult += player.arrays.qi * 0.05;
    if (type === 'def' && (player.arrays?.def || 0)) mult += player.arrays.def * 0.05;
    
    if (player.activeCompanion) {
        const comp = COMPANIONS.find(c => c.id === player.activeCompanion);
        if (comp && comp.buffType === type) {
            const exp = player.companionKills?.[comp.id] || 0;
            const tierIdx = getCompanionTier(exp);
            if (tierIdx >= 0) {
                const buffVal = comp.tiers[tierIdx];
                if (['luck_floor'].includes(type)) {
                    mult += buffVal; 
                } else {
                    mult += buffVal / 100; 
                }
            }
        }
    }
    return mult;
  };

  const currentRealmData = REALMS[player.realmIndex];
  const activeColorClass = REALM_COLORS[currentRealmData.color] || REALM_COLORS.slate;

  const luckVal = getMultiplier('luck_floor');
  const currentFate = LUCK_FATES.find(f => luckVal >= f.min) || LUCK_FATES[LUCK_FATES.length - 1];
  
  const extraLuck = Math.max(0, luckVal - 1.0);
  const luckCritBonus = extraLuck * 0.015;  
  const luckEvadeBonus = extraLuck * 0.01;  
  const luckReviveBonus = extraLuck * 0.005; 

  const rawEvade = getMultiplier('evade') - 1 + luckEvadeBonus;
  const evadeRate = Math.min(0.75, rawEvade);
  const overflowEvade = Math.max(0, rawEvade - 0.75);
  
  const rawCrit = getMultiplier('crit') - 1 + luckCritBonus;
  const critRate = Math.min(0.95, rawCrit);
  const overflowCrit = Math.max(0, rawCrit - 0.95);
  
  const streakCap = Math.min(8.0, 0.5 + (getMultiplier('streak_cap') - 1) + (overflowEvade * 0.5)); 
  const streakEff = getMultiplier('streak_eff'); 
  const streakBonusMult = Math.min(streakCap, (player.streakCount || 0) * 0.05 * streakEff);
  const comboMultiplier = 1 + streakBonusMult;
  
  const maxStreakShields = Math.floor(getMultiplier('streak_shield') - 1);
  const critDmg = Math.min(20.0, 1.5 + (getMultiplier('crit_dmg') - 1) + (overflowCrit * 3.0));
  const reviveRate = Math.min(0.65, getMultiplier('revive') - 1 + luckReviveBonus);   
  const healPct = Math.min(0.80, 0.35 + (getMultiplier('heal_bonus') - 1));
  const defMultiplier = getMultiplier('def');
  const dmgTakenPct = (1 / defMultiplier) * 100;

  const currentCombatPower = Math.floor(player.baseCombat * getMultiplier('atk') * comboMultiplier);
  const maxVitality = Math.floor(player.baseMaxVitality * getMultiplier('hp'));
  const forgeDiscount = Math.max(0.1, 1 - (getMultiplier('forge_discount') - 1)); 

  const upgCostAtk = Math.floor(1000 * Math.pow(1.15, (player.baseCombat - 100) / 100) * forgeDiscount);
  const upgCostHp = Math.floor(1000 * Math.pow(1.15, (player.baseMaxVitality - 100) / 100) * forgeDiscount);
  const healCost = Math.floor((maxVitality * 1.0 + player.realmIndex * 100) * forgeDiscount);
  const arrayQiCost = Math.floor(5000 * Math.pow(1.35, (player.arrays?.qi || 0)) * forgeDiscount);
  const arrayDefCost = Math.floor(4000 * Math.pow(1.35, (player.arrays?.def || 0)) * forgeDiscount);
  const gachaCost = Math.floor(5000 * Math.pow(1.15, player.realmIndex) * forgeDiscount);

  const pillCooldownRemaining = player.lastPillTime ? Math.max(0, 3600 - Math.floor((now - player.lastPillTime) / 1000)) : 0;
  const canUsePill = (player.epiphanyPills || 0) > 0 && pillCooldownRemaining === 0;

  const comprehensiveCP = useMemo(() => {
    const offense = currentCombatPower * (1 + critRate * (critDmg - 1));
    const defense = (maxVitality / 100) * (100 / dmgTakenPct) * (1 + evadeRate);
    return Math.floor(offense * defense);
  }, [currentCombatPower, critRate, critDmg, maxVitality, dmgTakenPct, evadeRate]);

const combatPrediction = useMemo(() => {
    if (!monster) return null;
    
    // 基礎計算
    const baseAtk = currentCombatPower; 
    const minTimeMult = 0.6; // 15分鐘
    const maxTimeMult = 2.4; // 60分鐘

    // 這裡納入爆擊倍率計算潛力
    // 如果爆擊了，最高傷害會再乘以 critDmg
    const potentialMaxDmg = baseAtk * maxTimeMult * critDmg; 
    const stableMinDmg = baseAtk * minTimeMult;

    // 1. 兇險萬分：即使閉關 60 分鐘且觸發「爆擊」，傷害仍不足以擊殺妖獸
    if (potentialMaxDmg < monster.hp) {
      return { status: 'DANGER', text: "感應靈壓...兇險萬分...", color: "text-rose-500" };
    }

    // 2. 十拿九穩：只需短修 15 分鐘，且在「不爆擊」的情況下就能穩殺
    if (stableMinDmg >= monster.hp) {
      return { status: 'SAFE', text: "靈壓感應...十拿九穩...", color: "text-cyan-400" };
    }

    // 3. 或可一試：介於兩者之間。
    // 代表你可能需要更長的專注時間，或者需要賭那一記「爆擊」來破敵
    return { status: 'UNKNOWN', text: "靈壓感應...或可一試...", color: "text-amber-500" };
  }, [monster, currentCombatPower, critDmg]); // 記得把 critDmg 加入依賴陣列

  const getExportString = () => {
      try {
          const { logs, ...saveData } = player; 
          return btoa(encodeURIComponent(JSON.stringify(saveData)));
      } catch (e) {
          return "【天道異常】秘文生成失敗。";
      }
  };

  const handleExport = () => {
      const saveStr = getExportString();
      navigator.clipboard.writeText(saveStr).then(() => {
          alert("【玉簡秘文】已複製至剪貼簿！\n請傳送至另一台裝置，並在該處選擇「匯入秘文」。");
      }).catch(() => {
          alert("【複製失敗】請手動選取秘文框內的文字並複製。");
      });
  };

  const handleImport = () => {
      if (!importString.trim()) {
          alert("請先貼上秘文！");
          return;
      }
      try {
          const parsed = JSON.parse(decodeURIComponent(atob(importString.trim())));
          if (parsed && parsed.realmIndex !== undefined) {
              if (window.confirm("【奪舍警告】\n匯入將完全覆蓋當前裝置的進度，確定要注入神識嗎？")) {
                  setPlayer({ ...defaultPlayerState, ...parsed, logs: ['【天道】跨界奪舍成功，神識與記憶已完美融合。'] });
                  setImportString('');
                  setShowSaveModal(false);
                  alert("奪舍成功！進度已同步。");
              }
          } else {
              alert("秘文殘缺，無法解析真元！");
          }
      } catch (e) {
          alert("玉簡毀損，這不是正確的秘文格式！");
      }
  };

  const addLog = (text) => {
    const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    setPlayer(p => ({ ...p, logs: [`[${timeStr}] ${text}`, ...(p.logs || [])].slice(0, 200) }));
  };

  const handleHeal = () => {
    if (player.coins >= healCost && player.vitality < maxVitality) {
      const healAmount = Math.floor(maxVitality * 0.5);
      setPlayer(p => ({ ...p, coins: p.coins - healCost, vitality: Math.min(maxVitality, p.vitality + healAmount) }));
      setIsHealing(true); setTimeout(() => setIsHealing(false), 800);
      addLog(`[煉丹] 吞服回春丹，恢復 ${formatNumber(healAmount)} 點氣血。`);
    }
  };

  const handleRebuildBase = () => {
    if (player.realmIndex === 0) {
      alert("已是一介凡人，無可散功。");
      return;
    }
    if (window.confirm("【天道警告】\n散功重修將使境界跌落一級！\n\n副作用：當前境界累積的修為將歸零。\n獲得：重置基礎技能，機緣祕籍保留並降回 Lv.1，退還升級所耗的 SP。\n（您的生涯數據與道侶羈絆將永久保留）\n\n確認散功？")) {
      const newRealm = player.realmIndex - 1;
      const newQiToNext = Math.floor(250 * Math.pow(1.35, newRealm));
      
      const resetSecrets = Object.keys(player.secretBooks || {}).reduce((acc, key) => {
          acc[key] = 1; 
          return acc;
      }, {});

      setPlayer(p => ({ 
        ...p, 
        realmIndex: newRealm, 
        qi: 0, 
        qiToNext: newQiToNext, 
        basicSkills: {}, 
        secretBooks: resetSecrets, 
        activeCompanion: null 
      }));
      setMonster(generateMonsterState(newRealm, 0, newQiToNext));
      addLog(`⚡ 【散功重修】自廢修為，境界跌落至 ${REALMS[newRealm].name}，祕籍降至首級，SP 全數返還！`);
    }
  };

  const preCheckGiveUp = () => {
    const isBottleneck = monster.isBoss;
    if (isBottleneck) {
      setShowGiveUpWarning(true);
    } else {
      executeGiveUp();
    }
  };

  const executeGiveUp = () => {
    sessionLockRef.current = true; 
    setShowGiveUpWarning(false);
    setIsActive(false); 
    setTargetEndTime(null);
    
    const elapsedTime = focusDuration - timeLeft;

    if (elapsedTime <= 60) {
        showToast('focus', '【神識收攏】開陣未滿 1 分鐘，無傷退回。');
        addLog(`💨 【神識收攏】開陣未滿 1 分鐘，靈氣尚未入體，無傷退回。`);
        setTimeLeft(focusDuration);
        return; 
    }
    
    if (Math.random() < evadeRate) { 
      showToast('focus', '💨 【羅煙閃避】成功閃避反噬！連擊不墜！');
      addLog(`💨 【羅煙閃避】成功閃避反噬！連擊不墜！`); 
    } else {
      setIsCollapsing(true); setTimeout(() => setIsCollapsing(false), 1000);
      
      const senseDef = Math.min(0.9, getMultiplier('sense_def') - 1);
      let rawPenalty = Math.floor((maxVitality * 0.20 + monster.tier * 50 + monster.maxHp * 0.01) * (1 / defMultiplier) * (1 - senseDef));
      
      const progressRatio = Math.max(0.5, elapsedTime / focusDuration);
      let penaltyMult = 1.0;
      
      if (player.realmIndex === 2) {
          penaltyMult = 1.0 + (progressRatio * 0.5); 
      } else if (player.realmIndex >= 3) {
          penaltyMult = 1.0 + (progressRatio * 1.5); 
      }

      rawPenalty = Math.floor(rawPenalty * penaltyMult);
      const penalty = Math.min(rawPenalty, player.vitality * 0.8);
      
      let nextHp = player.vitality - penalty;
      let nextStreak = player.streakCount;
      let nextShields = player.streakShields;
      
      let logMsg = `🚨 【靈力反噬】神魂震盪，承受 ${formatNumber(penalty)} 傷害。`;
      if (penaltyMult > 1.0) {
          const isFloorTriggered = (elapsedTime / focusDuration) < 0.5;
          const cause = isFloorTriggered ? '陣法崩潰(半數保底)' : '靈氣暴走';
          logMsg = `🚨 【氣機牽引】強行收功導致${cause} (反噬加劇 ${(penaltyMult * 100 - 100).toFixed(0)}%)，承受 ${formatNumber(penalty)} 傷害。`;
      }

      if (nextHp <= 0) {
          if (nextShields > 0) {
              nextShields -= 1;
              nextHp = Math.floor(maxVitality * 0.1) || 1;
              addLog(`🛡️ 【法寶護主】替身傀儡粉碎，消耗 1 層護盾，鎖血 10% 擋下死劫！`);
              showToast('focus', '🛡️ 觸發【法寶護主】抵擋致命反噬！', [`消耗 1 層護盾，鎖血 10%`]);
          } else if (Math.random() < reviveRate) { 
              nextHp = maxVitality; 
              addLog(`✨ 【涅槃重生】轉危為安！`); 
              showToast('focus', '✨ 觸發【涅槃重生】轉危為安！', [`氣血完全恢復`]);
          } else { 
              nextHp = Math.floor(maxVitality * 0.5); 
              
              setPlayer(p => {
                  const downgradedQi = Math.floor(p.qi * 0.8);
                  if (monster.isBoss && downgradedQi < p.qiToNext) {
                      setTimeout(() => {
                          addLog(`📉 【境界跌落】底蘊受損，死劫消散！必須重新積累修為。`);
                          setMonster(generateMonsterState(p.realmIndex, downgradedQi, p.qiToNext));
                      }, 0);
                  } else {
                      setTimeout(() => setMonster(prev => ({...prev, hp: prev.maxHp})), 0);
                  }
                  return { ...p, qi: downgradedQi };
              });
              
              nextStreak = 0;
              addLog(`💀 【身死道消】反噬過重，氣血歸零，損失 20% 修為與連擊！`); 
              showToast('danger', '💀 【身死道消】反噬過重！', [`損失 20% 修為與連擊數`]);
          }
      } else { 
          addLog(logMsg);
          if (nextStreak > 0) {
              if (nextShields > 0) {
                  nextShields -= 1;
                  addLog(`🛡️ 【法寶護主】消耗 1 層護盾抵擋反噬，連擊未中斷！`);
                  showToast('danger', '【強行收功】靈力反噬！', [`承受 ${formatNumber(penalty)} 傷害`, `🛡️ 護盾抵擋，連擊未斷`]);
              } else {
                  nextStreak = 0;
                  addLog(`📉 靈壓潰散，連擊歸零。`);
                  showToast('danger', '【強行收功】靈氣暴走！', [`承受 ${formatNumber(penalty)} 傷害`, `📉 連擊歸零`]);
              }
          } else {
              showToast('danger', '【強行收功】靈氣暴走！', [`承受 ${formatNumber(penalty)} 傷害`]);
          }
      }
      
      setPlayer(p => ({ ...p, vitality: nextHp, streakCount: nextStreak, streakShields: nextShields }));
    }
    setTimeLeft(focusDuration);
  };

  const handleSkipBreak = () => {
    sessionLockRef.current = true; 
    setIsActive(false);
    setTargetEndTime(null);
    setMode('focus');
    setTimeLeft(focusDuration);
    addLog(`【調息結束】道友提前結束吐納，未獲取靈氣滋養。`);
  };

  const getUnownedPool = (rarityTarget, currentArts, currentBooks) => {
    const unownedArts = ARTIFACT_POOL.filter(a => a.rarity === rarityTarget && !currentArts.includes(a.id)).map(a => ({...a, poolType: 'art'}));
    const unownedBooks = SECRET_BOOKS.filter(b => b.rarity === rarityTarget && !currentBooks[b.id]).map(b => ({...b, poolType: 'book'}));
    return [...unownedArts, ...unownedBooks];
  };

const resolveDropWithMutation = (initialRarity, arts, books, baseCost) => {
      let originalIdx = RARITIES_ORDER.indexOf(initialRarity);
      let finalDrop = null;
      let compensationCoins = 0;
      let mutationLog = '';
      let currentTargetRarity = initialRarity;

      // 【階段一：順應天道，向下兼容】 (從當前階級開始，一路往下找)
      for (let i = originalIdx; i >= 0; i--) {
          let r = RARITIES_ORDER[i];
          let pool = getUnownedPool(r, arts, books);
          if (pool.length > 0) {
              finalDrop = pool[Math.floor(Math.random() * pool.length)];
              currentTargetRarity = r;
              // 如果是向下找到的，給予提示
              if (i < originalIdx) {
                  mutationLog += `【${RARITY[initialRarity].name}】圖鑑已滿，靈力向下逸散，尋得【${RARITY[r].name}】。`;
              }
              break;
          }
      }

      // 【階段二：量變引起質變，向上連鎖突變】 (如果向下的低階全滿了，強行往上找，直到抽滿)
      if (!finalDrop) {
          for (let i = originalIdx + 1; i < RARITIES_ORDER.length; i++) {
              let r = RARITIES_ORDER[i];
              let pool = getUnownedPool(r, arts, books);
              if (pool.length > 0) {
                  finalDrop = pool[Math.floor(Math.random() * pool.length)];
                  currentTargetRarity = r;
                  mutationLog += `【機緣爆發】低階寶物已盡，氣運牽引，連鎖突變為【${RARITY[r].name}】！`;
                  break;
              }
          }
      }

      // 【階段三：萬法歸一，靈石補償】 (如果連最高階都滿了，代表全圖鑑 100% 畢業)
      if (!finalDrop) {
          // 以「初始判定」的稀有度計算天價補償 (越稀有的保底，補償越恐怖)
          let compValue = Math.floor((baseCost * 1.5) / RARITY[initialRarity].weight);
          compensationCoins = compValue;
          mutationLog += `【天道盡頭】此界寶物已盡入你手，機緣化作 ${formatNumber(compValue)} 靈石！`;
      }

      return { 
          drop: finalDrop, 
          coins: compensationCoins, 
          log: mutationLog, 
          finalRarity: currentTargetRarity 
      };
  };

  const handleComplete = (usedPill = false) => {
    if (sessionLockRef.current) return; 
    sessionLockRef.current = true;  
  
    const isUsingPill = usedPill === true;
    
    setIsActive(false); 
    setTargetEndTime(null);
    let collectedDrops = []; 
    
    if (mode === 'focus') {
      if (focusEndAudioRef.current) focusEndAudioRef.current.play().catch(() => {});
      setIsAttacking(true); setTimeout(() => setIsAttacking(false), 500);

      try { update(ref(database, 'globalStats'), { totalFocusCount: increment(1) }); } catch (e) {}
      
      let nextPills = player.epiphanyPills || 0;
      let nextLastPillTime = player.lastPillTime;
      let nextHistory = [...(player.history || [])];
      let nextLifetime = { ...(player.lifetimeStats || { kills: 0, focusCount: 0, totalCoins: 0 }) };
      let nextTotalFocusTime = player.totalFocusTime || 0;
      let nextCompanionKills = { ...(player.companionKills || {}) };

      if (isUsingPill) {
          addLog(`💊 【歲月法則】吞服頓悟丹，瞬間出關！(此經歷不列入識海與生涯)`);
          nextPills -= 1;
          nextLastPillTime = Date.now(); 
      } else {
          nextLastPillTime = 0; 
          nextLifetime.focusCount += 1;
          nextTotalFocusTime += focusDuration;
      }

      const isCrit = Math.random() < critRate;
      const damageBase = Math.floor(currentCombatPower * (focusDuration / 1500));
      const actualDamage = isCrit ? Math.floor(damageBase * critDmg) : damageBase;
      
      if (isCrit) { setIsCritStrike(true); setTimeout(() => setIsCritStrike(false), 600); }

      const newHp = Math.max(0, monster.hp - actualDamage);
      const timeRatio = focusDuration / 1500;
      const passiveQi = Math.floor(50 * Math.pow(1.18, player.realmIndex + 1) * getMultiplier('qi') * timeRatio);
      const passiveCoin = Math.floor(50 * Math.pow(1.15, player.realmIndex + 1) * getMultiplier('stone') * luckVal * timeRatio);

      let nextQi = player.qi + passiveQi;
      let nextCoins = player.coins + passiveCoin;
      let nextVitality = player.vitality;
      let nextRealm = player.realmIndex;
      let nextQiToNext = player.qiToNext;
      let newArtifacts = [...(player.artifacts || [])];
      let newSecretBooks = { ...(player.secretBooks || {}) };
      let nextHasAscended = player.hasAscended;
      let nextBaseCombat = player.baseCombat;
      let nextBaseMaxVitality = player.baseMaxVitality;
      
      const addedStreak = Math.round(focusDuration / 900);
      let nextStreak = player.streakCount + addedStreak;
      let nextShields = maxStreakShields; 
      let isDeadFromCounter = false;

      if (!isUsingPill) nextLifetime.totalCoins += passiveCoin;
      
      if (isCrit && Math.random() < 0.30) {
        const lifesteal = Math.floor(maxVitality * (getMultiplier('lifesteal') - 1));
        if (lifesteal > 0) {
          nextVitality = Math.min(maxVitality, nextVitality + lifesteal);
          addLog(`💉 【真靈吸吮】爆擊恢復了 ${formatNumber(lifesteal)} 氣血！`);
        }
      }

      let compLog = '';
      if (player.activeCompanion) {
          const compId = player.activeCompanion;
          const oldExp = nextCompanionKills[compId] || 0; 
          const addedExp = Math.floor(focusDuration / 60);
          const newExp = oldExp + addedExp;
          nextCompanionKills[compId] = newExp;
          
          const compData = COMPANIONS.find(c => c.id === compId);
          const oldTier = getCompanionTier(oldExp);
          const newTier = getCompanionTier(newExp);
          
          const tierIdx = Math.max(0, Math.min(newTier, compData.quotes.length - 1));
          const quotePool = compData.quotes[tierIdx];
          const randomQuote = quotePool[Math.floor(Math.random() * quotePool.length)];
          
          if (newTier > oldTier) {
              const tierMsgs = [
                  `歷經歲月洗禮，你與【${compData.name}】的羈絆產生質變，達到「${COMPANION_TIERS[newTier].name}」！`,
                  `仙途崎嶇，【${compData.name}】對你的心意越發堅定，羈絆突破至「${COMPANION_TIERS[newTier].name}」！`,
                  `朝夕相處之下，【${compData.name}】眼中波光流轉，你們的羈絆達到了「${COMPANION_TIERS[newTier].name}」！`
              ];
              const sysMsg = tierMsgs[Math.floor(Math.random() * tierMsgs.length)];
              compLog = ` 🌸 【${compData.name}】：「${randomQuote}」 (${sysMsg})`;
              collectedDrops.push(`🌸 羈絆升級：【${compData.name}】達到「${COMPANION_TIERS[newTier].name}」`);
          } else {
              const normalMsgs = [
                  `大道漫漫，與【${compData.name}】共修 ${addedExp} 載，彼此氣息越發交融。`,
                  `歲月無聲，【${compData.name}】為你護法 ${addedExp} 載，默契暗生。`,
                  `洞中無日月，你與【${compData.name}】論道 ${addedExp} 載，情誼漸深。`
              ];
              const sysMsg = normalMsgs[Math.floor(Math.random() * normalMsgs.length)];
              compLog = ` 🍵 【${compData.name}】：「${randomQuote}」 (${sysMsg})`;
          }
      }

      let killLog = '';
      const isBossDefeated = monster.isBoss === true && newHp === 0;

      if (newHp === 0) {
        setIsKilling(true); setTimeout(() => setIsKilling(false), 800); 
        const killQi = Math.floor(300 * Math.pow(1.18, monster.tier) * getMultiplier('qi'));
        const killCoin = Math.floor(800 * Math.pow(1.15, monster.tier) * getMultiplier('stone') * luckVal);
        
        nextQi += killQi;
        nextCoins += killCoin;
        if (!isUsingPill) {
            nextLifetime.kills += 1;
            nextLifetime.totalCoins += killCoin;
        }

        const basePillRate = 0.10 * (focusDuration / 3600); 
        const finalPillRate = basePillRate * luckVal; 

        if (Math.random() < finalPillRate) {
            nextPills += 1;
            killLog += ` 💊 搜刮巢穴，獲得【頓悟丹】x1！`;
            collectedDrops.push(`💊 獲得【頓悟丹】x1`);
        }

        if (Math.random() < (0.20 * luckVal * timeRatio)) {
            const roll = Math.random();
            let targetRarity = 'COMMON';
            let accum = 0;
            const sortedRarities = Object.entries(RARITY).sort((a,b) => a[1].weight - b[1].weight);
            for (let [r, data] of sortedRarities) {
                accum += data.weight;
                if (roll < accum) {
                    targetRarity = r;
                    break;
                }
            }

            const result = resolveDropWithMutation(targetRarity, newArtifacts, newSecretBooks, gachaCost);
            
            nextCoins += result.coins;
            if (!isUsingPill) nextLifetime.totalCoins += result.coins;
            killLog += result.log;

            if (result.drop) {
                const drop = result.drop;
                if (drop.poolType === 'art') {
                    newArtifacts.push(drop.id);
                    killLog += ` 🎁 斬獲【${RARITY[result.finalRarity].name}】法寶「${drop.name}」！`;
                    collectedDrops.push(`🎁 ${RARITY[result.finalRarity].name}法寶：${drop.name}`);
                } else {
                    newSecretBooks[drop.id] = 1;
                    killLog += ` 📜 獲得【${RARITY[result.finalRarity].name}】功法「${drop.name}」！`;
                    collectedDrops.push(`📜 ${RARITY[result.finalRarity].name}功法：${drop.name}`);
                }
            }
            if (result.coins > 0) {
                collectedDrops.push(`💰 突變補償：${formatNumber(result.coins)} 靈石`);
            }
        }

        const isFinalBoss = monster.name === '【九九重劫】';

        if (isBossDefeated) {
            if (isFinalBoss && !player.hasAscended) {
                try { update(ref(database, 'globalStats'), { totalAscensions: increment(1) }); } catch(e) {}
                nextHasAscended = true;
                // ✨ 強化日誌：獨立顯示飛升，不跟戰鬥數據擠在一起
                addLog(`🌌 【破空飛升】恭賀道友位列仙班，成就真仙之位！`); 
                killLog = ` 🌌 渡劫成功！` + killLog; // 🛠️ 修正：拔除重複對白，改為純粹的擊殺判定
                
                const quoteMsg = FEEDBACK_TEXTS.boss[Math.floor(Math.random() * FEEDBACK_TEXTS.boss.length)];
                setCelebration({ name: '飛升仙界！成就真仙！', quote: quoteMsg, drops: collectedDrops });
            } else if (nextRealm < REALMS.length - 1) {
                nextRealm++;
                nextQi -= nextQiToNext;
                nextQiToNext = Math.floor(nextQiToNext * 1.35);
                if (!isUsingPill) nextHistory = [...nextHistory, { name: REALMS[nextRealm].name, time: nextTotalFocusTime }];
                
                // ✨ 天道修補：讓突破日誌獨立顯現，增加儀式感
                addLog(`☄️ 【境界突破】恭喜道友成功斬滅死劫，晉升至「${REALMS[nextRealm].name}」！`);

                const newCompanion = COMPANIONS.find(c => c.unlockIdx === nextRealm);
                if (newCompanion) {
                    collectedDrops.unshift(`🌸 結識紅緣：【${newCompanion.name}】`);
                    // 🛡️ 完整保留您原本的結緣文案！
                    addLog(`🏆 【仙緣】突破之際，你與【${newCompanion.name}】意外結識，可前往「道侶紅顏」邀其同行。`);
                }
                
                const quoteMsg = FEEDBACK_TEXTS.boss[Math.floor(Math.random() * FEEDBACK_TEXTS.boss.length)];
                setCelebration({ 
                    name: REALMS[nextRealm].name, 
                    quote: newCompanion ? `「${newCompanion.quotes[0][Math.floor(Math.random() * newCompanion.quotes[0].length)]}」` : quoteMsg, 
                    drops: collectedDrops 
                });
                killLog = ` 💀 斬滅死劫！` + killLog; // 🛠️ 修正：拔除重複對白，改為純粹的擊殺判定
            }
        } else {

            killLog = `⚔️ 【擊殺】奪得修為 ${formatNumber(killQi)}！` + killLog;
            if (nextQi >= nextQiToNext) {
                killLog += ` ⚡ 修為圓滿！死劫即將降臨，準備突破！`;
            }
            const msg = FEEDBACK_TEXTS.kill[Math.floor(Math.random() * FEEDBACK_TEXTS.kill.length)];
            showToast('kill', msg, collectedDrops);
        }
        
        setMonster(generateMonsterState(nextRealm, nextQi, nextQiToNext));
} else {
        const isBigAttack = Math.random() < 0.20; 
        const atkName = isBigAttack ? monster.bAtkName : monster.sAtkName;
        let nextMonsterHp = newHp; 
        
        if (Math.random() < evadeRate) {
            killLog = `💨 妖獸反撲！你身形如鬼魅，完美閃避【${atkName}】！`;
            const msg = FEEDBACK_TEXTS.focus[Math.floor(Math.random() * FEEDBACK_TEXTS.focus.length)];
            collectedDrops.push(`💨 完美閃避妖獸反撲`);
            showToast('focus', msg, collectedDrops);
        } else {
            setIsCollapsing(true); setTimeout(() => setIsCollapsing(false), 1000);
            const baseMod = isBigAttack ? 2.5 : 1.0;
            const variance = 1 + (Math.random() + Math.random() + Math.random() - 1.5) * 0.4;
            
            let enemyTimeScale = 1.0;
            if (timeRatio > 1.0) { 
                if (player.realmIndex === 2) enemyTimeScale = 1.0 + (timeRatio - 1.0) * 0.4;
                else if (player.realmIndex >= 3) enemyTimeScale = 1.0 + (timeRatio - 1.0) * 0.8;
            }
            
            if (monster.isBoss && enemyTimeScale > 1.0) {
                enemyTimeScale = 1.0 + (enemyTimeScale - 1.0) * 0.7;
            }

            const rawDamage = Math.floor(monster.atk * baseMod * variance * enemyTimeScale);
            const actualDamage = Math.max(1, Math.floor(rawDamage * (dmgTakenPct / 100)));
            
            nextVitality -= actualDamage;
            let scaleLog = enemyTimeScale > 1.1 ? ` (同步蓄力 ${(enemyTimeScale).toFixed(1)}倍)` : '';
            
            // ✨ 天道修補：嚴格的死亡順序判定
            if (nextVitality <= 0) {
                if (nextShields > 0) {
                    nextShields -= 1;
                    nextVitality = Math.floor(maxVitality * 0.1) || 1;
                    isDeadFromCounter = false;
                    killLog = `🛡️ 妖獸施展【${atkName}】${scaleLog}造成致命傷！【法寶護主】替身傀儡粉碎，鎖血 10% 擋下死劫！`;
                    showToast('danger', '妖獸反撲，觸發護主！', [`鎖血 10% 擋下死劫`]);
                } else if (Math.random() < reviveRate) {
                    nextVitality = maxVitality;
                    isDeadFromCounter = false;
                    killLog = `💥 妖獸餘威未減，施展【${atkName}】${scaleLog}造成致命傷！✨ 【涅槃重生】轉危為安！`;
                    showToast('danger', '妖獸反撲造成致命傷！', [`✨ 觸發涅槃重生`]);
                } else {
                    nextVitality = Math.floor(maxVitality * 0.5);
                    // 💀 死亡重罰：扣除 20% 當前總修為 (包含剛獲得的)
                    nextQi = Math.floor(nextQi * 0.8); 
                    nextStreak = 0;
                    nextShields = 0;
                    isDeadFromCounter = true;
                    
                    if (monster.isBoss && nextQi < nextQiToNext) {
                        nextMonsterHp = -1; 
                        killLog = `💀 施展【${atkName}】${scaleLog}造成 ${formatNumber(actualDamage)} 傷害！氣血歸零！📉 【境界跌落】修為受損，死劫消散！需重新歷練。`;
                    } else {
                        nextMonsterHp = monster.maxHp; 
                        killLog = `💀 施展【${atkName}】${scaleLog}造成 ${formatNumber(actualDamage)} 傷害！氣血歸零，損失 20% 修為與連擊！(妖獸趁機恢復了氣血)`;
                    }
                    showToast('danger', '💀 境界不穩，靈力崩潰！', [`承受致命反撲，損失 20% 修為`]);
                }
            } else {
                killLog = `💥 妖獸未死，發動【${atkName}】${scaleLog}反擊，造成 ${formatNumber(actualDamage)} 點傷害。`;
                const msg = FEEDBACK_TEXTS.focus[Math.floor(Math.random() * FEEDBACK_TEXTS.focus.length)];
                collectedDrops.push(`💥 承受反撲：${formatNumber(actualDamage)} 傷害`);
                showToast('focus', msg, collectedDrops);
            }
        }
        
        if (nextMonsterHp === -1) {
            setMonster(generateMonsterState(nextRealm, nextQi, nextQiToNext));
        } else {
            setMonster(prev => ({ ...prev, hp: nextMonsterHp }));
        }
      }

      // ... 奇遇判定 (保留不變)
      let fortuneLog = '';
      if (!isDeadFromCounter && Math.random() < (0.10 * luckVal * timeRatio)) {
        // ... (中間的奇遇 fRoll 邏輯完全保持原樣，不要動它) ...
        const fRoll = Math.random() * 100;
        if (fRoll < 25) {
            const extraQi = Math.floor(passiveQi * 2);
            nextQi += extraQi;
            fortuneLog = ` 🌈 【偶遇靈泉】額外獲 ${formatNumber(extraQi)} 修為！`;
            collectedDrops.push(`🌈 靈泉：修為 +${formatNumber(extraQi)}`);
        } else if (fRoll < 50) {
            const extraCoin = Math.floor(passiveCoin * 3);
            nextCoins += extraCoin;
            if (!isUsingPill) nextLifetime.totalCoins += extraCoin;
            fortuneLog = ` 🌈 【古修洞府】額外獲 ${formatNumber(extraCoin)} 靈石！`;
            collectedDrops.push(`🌈 洞府：靈石 +${formatNumber(extraCoin)}`);
        } else if (fRoll < 75) {
            const healAmount = Math.floor(maxVitality * 0.3);
            nextVitality = Math.min(maxVitality, nextVitality + healAmount);
            fortuneLog = ` 🌈 【天道頓悟】氣血恢復 ${formatNumber(healAmount)}！`;
            collectedDrops.push(`🌈 頓悟：氣血恢復 ${formatNumber(healAmount)}`);
        } else if (fRoll < 90) {
            nextPills += 1;
            fortuneLog = ` 🌈 【天降機緣】獲得【頓悟丹】x1！`;
            collectedDrops.push(`🌈 機緣：頓悟丹 x1`);
        } else if (fRoll < 98) {
            if (Math.random() < 0.5) {
                nextBaseCombat += 5;
                fortuneLog = ` ⚡ 【天雷淬體】肉身脫胎換骨，永久基礎戰力 +5！`;
                collectedDrops.push(`⚡ 淬體：基礎戰力 +5`);
            } else {
                nextBaseMaxVitality += 5;
                fortuneLog = ` ⚡ 【天雷淬體】經脈拓寬，永久氣血上限 +5！`;
                collectedDrops.push(`⚡ 淬體：氣血上限 +5`);
            }
        } else {
            const roll = Math.random();
            let targetRarity = 'COMMON';
            let accum = 0;
            const sortedRarities = Object.entries(RARITY).sort((a,b) => a[1].weight - b[1].weight);
            for (let [r, data] of sortedRarities) {
                accum += data.weight * luckVal; 
                if (roll < accum) {
                    targetRarity = r;
                    break;
                }
            }
            const result = resolveDropWithMutation(targetRarity, newArtifacts, newSecretBooks, gachaCost);
            nextCoins += result.coins;
            if (!isUsingPill) nextLifetime.totalCoins += result.coins;
            fortuneLog += result.log;
            if (result.drop) {
                const drop = result.drop;
                if (drop.poolType === 'art') {
                    newArtifacts.push(drop.id);
                    fortuneLog += ` 🏺 【異寶出世】霞光萬丈，喜獲【${RARITY[result.finalRarity].name}】法寶「${drop.name}」！`;
                    collectedDrops.push(`🏺 ${RARITY[result.finalRarity].name}法寶：${drop.name}`);
                } else {
                    newSecretBooks[drop.id] = 1;
                    fortuneLog += ` 📜 【殘卷現世】機緣巧合，領悟【${RARITY[result.finalRarity].name}】功法「${drop.name}」！`;
                    collectedDrops.push(`📜 ${RARITY[result.finalRarity].name}功法：${drop.name}`);
                }
            }
            if (result.coins > 0) {
                collectedDrops.push(`💰 突變補償：${formatNumber(result.coins)} 靈石`);
            }
        }
      }

      // ✨ 天道修補：嚴格的靈氣化晶判定 (必須在死亡判定之後)
      // 拔除了 !monster.isBoss 的豁免權。只要打完，修為超過上限，一律化晶！
      let bottleneckLog = '';
      if (nextQi > nextQiToNext) {
          const overflow = nextQi - nextQiToNext;
          nextQi = nextQiToNext; // 🔒 丹田鎖死，確保不會出現 1450 / 612 這種荒謬現象
          
          const crystalizedCoins = Math.floor(overflow * 0.3); 
          const finalCoins = Math.max(1, crystalizedCoins); 
          
          nextCoins += finalCoins;
          if (!isUsingPill) nextLifetime.totalCoins += finalCoins;
          
          bottleneckLog = ` ⚠️ 【境界瓶頸】丹田已滿，${formatNumber(overflow)} 點溢出靈氣劇烈消散，凝結出 ${formatNumber(finalCoins)} 顆靈石晶體。`;
          collectedDrops.push(`💎 靈氣化晶：${formatNumber(finalCoins)} 靈石`);
      }

      const dmgLog = isCrit ? `🔥 【爆擊】造成 ${formatNumber(actualDamage)} 傷害。` : `[運功] 造成 ${formatNumber(actualDamage)} 傷害。`;
      addLog(`${dmgLog} ${killLog || `獲修為 ${formatNumber(passiveQi)}。`}${fortuneLog}${compLog}${bottleneckLog}`);
      
      // ... 後續的 setPlayer 保持不變 ...

      setPlayer(p => ({
          ...p,
          realmIndex: nextRealm,
          qi: nextQi,
          qiToNext: nextQiToNext,
          coins: nextCoins,
          vitality: nextVitality,
          baseCombat: nextBaseCombat,
          baseMaxVitality: nextBaseMaxVitality,
          streakCount: nextStreak,
          streakShields: nextShields,
          totalFocusTime: nextTotalFocusTime,
          artifacts: newArtifacts,
          secretBooks: newSecretBooks,
          epiphanyPills: nextPills,
          lastPillTime: nextLastPillTime,
          companionKills: nextCompanionKills,
          history: nextHistory,
          hasAscended: nextHasAscended,
          lifetimeStats: nextLifetime
      }));

      setMode('break'); 
      setTimeLeft(5 * 60);

    } else { 
      if (breakEndAudioRef.current) breakEndAudioRef.current.play().catch(() => {});
      
      setMode('focus'); 
      setTimeLeft(focusDuration); 
      
      const heal = Math.floor(maxVitality * healPct);
      setPlayer(p => ({ 
        ...p, 
        vitality: Math.min(maxVitality, p.vitality + heal),
        streakShields: maxStreakShields 
      }));
      
      addLog(`🧘‍♂️ 【周天圓滿】吐納調息結束，靈氣滋養受損經脈，恢復了 ${formatNumber(heal)} 氣血。`); 
      
      const msg = FEEDBACK_TEXTS.break[Math.floor(Math.random() * FEEDBACK_TEXTS.break.length)];
      showToast('break', msg, [`🧘‍♂️ 恢復了 ${formatNumber(heal)} 氣血`]);
    }
  };

const handleGacha = () => {
    // ⚔️ 判斷機緣優先級：1. 每日機緣 (優先) -> 2. 稱號功勳 (次之)
    const useDaily = (player.dailyGacha || 0) > 0;
    const useAward = !useDaily && (player.awardGacha || 0) > 0;
    const isFree = useDaily || useAward;

    // 若無免費次數且靈石不足，則無法開陣
    if (!isFree && player.coins < gachaCost) return;
    
    // 🎲 天道演算：稀有度判定 (保留你原本的 luckVal 算法)
    const roll = Math.random(); 
    let targetRarity = 'COMMON';
    let accum = 0;
    const sortedRarities = Object.entries(RARITY).sort((a,b) => a[1].weight - b[1].weight);
    for (let [r, data] of sortedRarities) {
        accum += data.weight * luckVal; 
        if (roll < accum) {
            targetRarity = r;
            break;
        }
    }
    
    // ✨ 機緣保底：凡使用免費次數，強制法寶(RARE)起步，跳過凡/靈品
    if (isFree && ['COMMON', 'UNCOMMON'].includes(targetRarity)) {
      targetRarity = 'RARE';
    }
    
    // 🌀 連鎖突變機制 (保留原本的大一統掉落邏輯)
    const result = resolveDropWithMutation(targetRarity, player.artifacts || [], player.secretBooks || {}, gachaCost);

    setPlayer(p => {
        let nextCoins = (isFree ? p.coins : p.coins - gachaCost) + result.coins;
        
        // 💰 精準扣除次數：優先消耗每日，每日沒了才扣稱號
        let nextDaily = useDaily ? 0 : p.dailyGacha;
        let nextAward = useAward ? p.awardGacha - 1 : p.awardGacha;
        
        let nextArts = p.artifacts || [];
        let nextBooks = { ...p.secretBooks };

        if (result.drop) {
            if (result.drop.poolType === 'art') {
                nextArts = [...nextArts, result.drop.id];
            } else {
                nextBooks[result.drop.id] = 1;
            }
        }

        return { 
          ...p, 
          coins: nextCoins, 
          dailyGacha: nextDaily, 
          awardGacha: nextAward, 
          artifacts: nextArts, 
          secretBooks: nextBooks 
        };
    });

    // 🎊 顯化異象 (保留原本的慶祝與日誌邏輯)
    if (result.drop) {
        setCelebration({ 
          name: result.drop.name, 
          quote: '機緣已至，重寶出世！', 
drops: [`【${RARITY[result.finalRarity].name}級】${result.drop.poolType === 'art' ? '法寶' : '功法'}`]        });
        addLog(`[萬寶樓] ${result.log ? result.log + ' ' : ''}獲得【${RARITY[result.finalRarity].name}】${result.drop.poolType === 'art' ? '法寶' : '功法'}「${result.drop.name}」！`);
    } else {
        addLog(`[萬寶樓] ${result.log}`);
    }
  };

  const handleUpgradeSecret = (id) => {
    const lvl = player.secretBooks[id] || 0;
    const cost = Math.floor(10000 * Math.pow(2, lvl) * forgeDiscount);
    if (player.coins >= cost && lvl < 5 && availableSP >= 1) {
      setPlayer(p => ({ ...p, coins: p.coins - cost, secretBooks: { ...p.secretBooks, [id]: lvl + 1 } }));
      addLog(`[參悟] 耗費 1 SP，將【${SECRET_BOOKS.find(x=>x.id===id).name}】提昇至 Lv.${lvl + 1}。`);
    }
  };

const toggleTimer = () => { 
    if (!isActive) { 
      sessionLockRef.current = false;
      const endTime = Date.now() + (timeLeft * 1000);
      setIsActive(true); 
      setTargetEndTime(endTime);
      addLog(mode === 'focus' ? `[運轉] 靈力蓄積中...` : `[調息] 閉目凝神，運功療傷。`); 
    } 
  };

  // ✨ 天道修補 1：使用 Ref 鎖定最新的結算邏輯，避免閉包導致「專注期間的升級被吃掉」
  const latestHandleComplete = useRef(handleComplete);
  useEffect(() => {
    latestHandleComplete.current = handleComplete;
  }, [handleComplete]);

  // ✨ 天道修補 2：徹底封殺幽靈計時器
  useEffect(() => {
    const syncTime = () => {
      // 🛡️ 核心防禦：如果正在結算中，徹底封鎖任何計時器的幽靈信號！
      if (sessionLockRef.current) return; 

      if (isActive && targetEndTime && !showGiveUpWarning) {
        const remaining = Math.floor((targetEndTime - Date.now()) / 1000);
        if (remaining <= 0) {
          setTimeLeft(0);
          latestHandleComplete.current(false); // 調用最新狀態的結算
        } else {
          setTimeLeft(remaining);
        }
      }
    };
    if (isActive && !showGiveUpWarning) {
      const interval = setInterval(syncTime, 1000);
      document.addEventListener('visibilitychange', syncTime);
      return () => { clearInterval(interval); document.removeEventListener('visibilitychange', syncTime); };
    }
  }, [isActive, targetEndTime, showGiveUpWarning]); // 不依賴 handleComplete，確保計時器平滑運行

      const getStatBreakdown = useCallback((type) => {
        let breakdown = [];
        
        BASIC_SKILLS.forEach(s => {
          if (player.basicSkills?.[s.id] > 0 && s.val?.[type]) {
            breakdown.push({ label: `功法 (${s.name})`, val: s.val[type] * player.basicSkills[s.id] });
          }
        });
        Object.entries(player.secretBooks || {}).forEach(([id, lvl]) => {
          const book = SECRET_BOOKS.find(x => x.id === id);
          if (book?.val?.[type]) breakdown.push({ label: `祕籍 (${book.name})`, val: book.val[type] * lvl });
        });
        (player.artifacts || []).forEach(id => {
          const item = ARTIFACT_POOL.find(a => a.id === id);
          if (item?.val?.[type]) breakdown.push({ label: `法寶 (${item.name})`, val: item.val[type] });
        });
        if (player.equippedTitle) {
          const activeTitle = TITLE_DATA.find(t => t.id === player.equippedTitle);
          if (activeTitle?.val?.[type]) breakdown.push({ label: `稱號 (${activeTitle.name})`, val: activeTitle.val[type] });
        }
        if (type === 'atk' || type === 'streak_cap') {
          const swordCount = (player.artifacts || []).filter(id => ARTIFACT_POOL.find(a => a.id === id)?.tags?.includes('sword')).length;
          if (swordCount >= 2) breakdown.push({ label: `劍陣共鳴 (${swordCount}把劍)`, val: 0.2 * swordCount });
        }
        if (type === 'qi' && (player.arrays?.qi || 0)) breakdown.push({ label: `陣法 (聚靈大陣)`, val: player.arrays.qi * 0.05 });
        if (type === 'def' && (player.arrays?.def || 0)) breakdown.push({ label: `陣法 (顛倒五行)`, val: player.arrays.def * 0.05 });
        if (player.activeCompanion) {
          const comp = COMPANIONS.find(c => c.id === player.activeCompanion);
          if (comp && comp.buffType === type) {
            const exp = player.companionKills?.[comp.id] || 0;
            const tierIdx = getCompanionTier(exp);
            if (tierIdx >= 0) breakdown.push({ label: `道侶 (${comp.name})`, val: type === 'luck_floor' ? comp.tiers[tierIdx] : comp.tiers[tierIdx] / 100 });
          }
        }
        if (type === 'crit' && luckCritBonus > 0) breakdown.push({ label: `天道庇護 (氣運溢出)`, val: luckCritBonus });
        if (type === 'evade' && luckEvadeBonus > 0) breakdown.push({ label: `天道庇護 (氣運溢出)`, val: luckEvadeBonus });
        if (type === 'revive' && luckReviveBonus > 0) breakdown.push({ label: `天道庇護 (氣運溢出)`, val: luckReviveBonus });

        return breakdown;
      }, [player, luckCritBonus, luckEvadeBonus, luckReviveBonus]);

const renderStatRow = (title, type, displayValue, subtext, colorClass) => {
        const breakdown = getStatBreakdown(type);
        const isSelected = activeStat === type; // 檢查是否被選中

        return (
          <div 
            id={`stat-row-${type}`} // 👈 加上 ID 供自動對焦使用
            key={type}
            onClick={() => setActiveStat(isSelected ? null : type)} // 點擊切換
            className={`relative border-b border-white/5 py-4 px-2 transition-all cursor-pointer rounded-xl ${isSelected ? 'bg-white/5 ring-1 ring-white/10' : 'hover:bg-white/5'}`}
          >
            <div className="flex justify-between text-sm items-center">
              <span className="text-slate-300 font-bold flex flex-col">
                  <span className={`border-b border-dashed border-white/30 pb-0.5 inline-block w-fit ${isSelected ? 'text-emerald-400' : ''}`}>{title}</span>
                  {subtext && <span className="text-[10px] text-white/40 font-mono mt-1">{subtext}</span>}
              </span>
              <span className={`${colorClass} font-mono font-black text-base`}>{displayValue}</span>
            </div>
            
            {/* ✨ 改為：當選中時 (isSelected) 才原地展開內容 */}
            {isSelected && breakdown.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-black/80 border border-white/10 text-[11px] text-white/70 space-y-2 animate-pop-in">
                <div className="flex justify-between text-white/40 mb-1 border-b border-white/10 pb-1">
                   <span>來源拆解</span><span>加成數值</span>
                </div>
                {breakdown.map((b, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="font-bold">{b.label}</span>
                    <span className={colorClass}>+{displayValue.includes('x') ? b.val.toFixed(2) : (b.val * 100).toFixed(1) + '%'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      };

  const InsightsChart = () => {
    const data = player.history || [];
    if (data.length < 2) return <div className="h-full flex items-center justify-center text-white/10 uppercase tracking-widest font-bold text-xs">識海未成，尚無投影</div>;
    const maxT = Math.max(1, ...data.map(d => d.time || 0));
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.time || 0) / maxT) * 100;
      return `${isNaN(x) ? 0 : x},${isNaN(y) ? 0 : y}`;
    }).join(' ');
    
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <polyline fill="none" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1.5" points={points} />
        {data.map((d, i) => {
          const cx = (i / (data.length - 1)) * 100;
          const cy = 100 - ((d.time || 0) / maxT) * 100;
          return <circle key={i} cx={isNaN(cx) ? 0 : cx} cy={isNaN(cy) ? 0 : cy} r="1.5" fill="#fff" className="animate-pulse" />;
        })}
      </svg>
    );
  };

  return (
    <div className={`min-h-screen text-slate-300 font-mono p-4 flex flex-col items-center overflow-x-hidden relative transition-colors duration-300 ${isActive ? 'justify-center py-0' : 'pt-10'}
      ${isCollapsing ? 'bg-red-950/80 animate-shake' : 
        isKilling ? 'bg-emerald-950/60' :
        isCritStrike ? 'bg-rose-900/40' : 'bg-[#020617]'}`}
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      
      <div className={`fixed top-0 left-0 w-full bg-emerald-950/90 text-[10px] sm:text-xs py-2 text-center font-black tracking-widest z-[600] border-b border-emerald-500/30 flex-wrap items-center justify-center gap-x-6 gap-y-1 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-transform duration-500 ${isActive ? '-translate-y-full opacity-0 pointer-events-none' : 'flex translate-y-0 opacity-100'}`}>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Network size={14} className="animate-pulse" />
          <span>三千世界運轉:</span>
          <span className="text-white font-mono text-sm">{formatNumber(globalStats.focus)}</span>
        </div>
        <div className="hidden sm:block text-emerald-700">|</div>
        <div className="flex items-center gap-1.5 text-yellow-400">
          <Crown size={14} className="animate-pulse drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
          <span>飛升仙人:</span>
          <span className="text-white font-mono text-sm">{formatNumber(globalStats.ascensions)}</span>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-0 z-[500] flex items-center justify-center overflow-hidden">
        {isCritStrike && <Flame size={350} className="text-amber-500/30 animate-ping absolute mix-blend-color-dodge drop-shadow-[0_0_50px_rgba(245,158,11,0.8)]" />}
        {isKilling && <Sword size={450} className="text-emerald-500/40 animate-pulse absolute mix-blend-color-dodge -rotate-45 drop-shadow-[0_0_80px_rgba(16,185,129,0.8)]" />}
      </div>

      <div className="absolute inset-0 bg-[#020617]/85 backdrop-blur-[1px] z-0 transition-colors duration-300"></div>
      
      <style>{`
        .glow-streak { box-shadow: 0 0 30px rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        
        /* Toast 下降動畫 */
        @keyframes slideDown { 0% { transform: translate(-50%, -20px); opacity: 0; } 100% { transform: translate(-50%, 0); opacity: 1; } }
        .animate-slide-down { animation: slideDown 0.4s ease-out forwards; }
      `}</style>

      {/* 新增：非阻擋式動態橫幅 (Toast) */}
      {toast && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[700] px-6 py-5 rounded-2xl shadow-2xl border backdrop-blur-xl flex flex-col items-center text-center w-[90%] max-w-md transition-all duration-300 animate-slide-down pointer-events-none ${
          toast.type === 'kill' ? 'bg-rose-950/90 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.4)]' :
          toast.type === 'focus' ? 'bg-slate-900/90 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)]' :
          toast.type === 'break' ? 'bg-cyan-950/90 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)]' :
          'bg-red-950/95 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)]'
        }`}>
          <h3 className={`text-sm md:text-base font-black tracking-widest ${
              toast.type === 'kill' ? 'text-rose-100' :
              toast.type === 'focus' ? 'text-amber-100' :
              toast.type === 'break' ? 'text-cyan-100' : 'text-white'
          } ${toast.drops && toast.drops.length > 0 ? 'mb-3' : ''}`}>{toast.msg}</h3>
          
          {toast.drops && toast.drops.length > 0 && (
            <div className="w-full bg-black/40 rounded-xl p-3 border border-white/5 flex flex-col gap-1.5">
              {toast.drops.map((d, i) => (
                <div key={i} className="text-sm font-black text-yellow-400 drop-shadow-md">{d}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {showGiveUpWarning && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-2xl p-6 flex flex-col items-center justify-center font-bold">
          <div className="w-full max-w-lg bg-rose-950/80 p-8 rounded-2xl border border-rose-500/50 shadow-[0_0_80px_rgba(244,63,94,0.3)] flex flex-col items-center text-center animate-pop-in">
            <ShieldAlert size={64} className="text-rose-500 mb-6 animate-pulse"/>
            <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-4">天道警示</h2>
            <p className="text-rose-200 text-sm md:text-base leading-relaxed mb-8">當前正處於 <span className="text-white font-black underline decoration-rose-500 decoration-2">死劫/瓶頸</span>！<br/>此時強行收功將遭受極為嚴重的反噬。<br/><br/>確認要放棄本次蓄力嗎？</p>
            <div className="flex gap-4 w-full">
              <button onClick={() => setShowGiveUpWarning(false)} className="flex-1 py-4 bg-white/10 hover:bg-white text-white hover:text-black rounded-xl text-sm font-black transition-all border border-white/20">繼續運功</button>
              <button onClick={executeGiveUp} className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-black transition-all shadow-lg">強行收功</button>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-2xl p-6 flex flex-col items-center justify-center font-bold mt-8">
          <div className="w-full max-w-xl bg-slate-900/90 p-6 md:p-10 rounded-2xl border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col animate-pop-in relative">
            <button onClick={() => setShowSaveModal(false)} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"><X size={20}/></button>
            
            <h2 className="text-xl md:text-2xl font-black text-cyan-400 tracking-widest uppercase mb-2 flex items-center gap-3"><ScrollText className="fill-current"/> 玉簡傳功 (跨裝置同步)</h2>
            <p className="text-white/60 text-xs md:text-sm leading-relaxed mb-8">將當前境界凝聚為秘文，或注入他處傳來的神識，實現跨裝置無縫接軌。<br/>(警告：匯入秘文將完全覆蓋本機當前進度)</p>
            
            <div className="space-y-6">
                <div className="bg-black/50 p-4 rounded-xl border border-white/10">
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-emerald-400 text-sm font-black flex items-center gap-2"><Download size={16}/> 凝聚秘文 (匯出)</label>
                        <button onClick={handleExport} className="bg-emerald-900/60 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 border border-emerald-500/50"><Copy size={12}/> 複製秘文</button>
                    </div>
                    <textarea readOnly value={getExportString()} className="w-full h-24 bg-black/80 text-white/40 text-[10px] font-mono p-3 rounded-lg border border-white/5 focus:outline-none resize-none custom-scrollbar" />
                </div>
                
                <div className="bg-black/50 p-4 rounded-xl border border-white/10">
                    <label className="text-rose-400 text-sm font-black flex items-center gap-2 mb-3"><Activity size={16}/> 注入神識 (匯入)</label>
                    <textarea 
                        placeholder="請在此貼上其他裝置產生的玉簡秘文..." 
                        value={importString}
                        onChange={(e) => setImportString(e.target.value)}
                        className="w-full h-24 bg-black/80 text-white/90 text-xs font-mono p-3 rounded-lg border border-rose-500/30 focus:border-rose-400 focus:outline-none resize-none custom-scrollbar mb-4" 
                    />
                    <button onClick={handleImport} disabled={!importString.trim()} className="w-full py-4 bg-rose-900/60 hover:bg-rose-600 text-white font-black rounded-lg transition-colors disabled:opacity-30 border border-rose-500/50">
                        確認奪舍 (覆蓋本機進度)
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {showChangelog && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-xl p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center font-bold mt-8">
          <div className="w-full max-w-2xl bg-[#0a0a0a] p-4 sm:p-6 md:p-8 rounded-2xl border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)] flex flex-col max-h-[85vh] animate-pop-in">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 flex-shrink-0">
               <h2 className="text-xl md:text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3"><FileText className="text-emerald-500"/> 天道紀元 (版本演化)</h2>
               <button onClick={() => setShowChangelog(false)} className="p-4 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
               {CHANGELOG_DATA.map((log, index) => {
                 const isLatest = index === 0;
                 return (
                   <div key={log.version} className={`relative pl-6 sm:pl-8 py-2 ${!isLatest ? 'opacity-70' : ''}`}>
                      <div className={`absolute left-0 top-3 bottom-0 w-px ${isLatest ? 'bg-gradient-to-b from-emerald-500 to-emerald-500/0' : 'bg-white/10'}`}></div>
                      <div className={`absolute left-[-4px] top-3 w-2 h-2 rounded-full ${isLatest ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-white/30'}`}></div>
                      
                      <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2`}>
                        <span className={`text-sm font-mono font-black px-2 py-0.5 rounded ${isLatest ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/50' : 'bg-white/5 text-white/50'}`}>{log.version}</span>
                        <h3 className={`text-base md:text-lg font-black tracking-widest ${isLatest ? 'text-white' : 'text-white/70'}`}>{log.title}</h3>
                      </div>
                      <p className="text-xs text-white/40 italic mb-4">"{log.desc}"</p>
                      
                      <ul className="space-y-2">
                        {log.changes.map((change, cIdx) => (
                          <li key={cIdx} className="text-xs md:text-sm text-white/70 flex items-start gap-2 leading-relaxed">
                            <span className={`text-emerald-500/50 mt-0.5`}>▹</span> {change}
                          </li>
                        ))}
                      </ul>
                   </div>
                 );
               })}
            </div>
          </div>
        </div>
      )}

      <div className={`fixed top-14 right-4 z-50 flex items-center gap-2 bg-emerald-900/80 text-emerald-300 px-4 py-2 rounded-full text-xs font-bold border border-emerald-500/30 transition-opacity duration-500 ${saveIndicator && !isActive ? 'opacity-100' : 'opacity-0'} ${isActive ? 'hidden' : ''}`}>
        <Save size={14} className="animate-pulse"/> 天道已同步
      </div>

      {showTitles && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-xl p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center font-bold mt-8">
          <div className="w-full max-w-4xl bg-[#0a0a0a] p-4 sm:p-6 md:p-8 rounded-2xl border border-amber-500/30 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 flex-shrink-0">
               <h2 className="text-xl md:text-2xl font-black text-amber-400 tracking-widest uppercase flex items-center gap-3"><Award className="text-amber-500"/> 名號頭銜 (成就)</h2>
               <button onClick={() => setShowTitles(false)} className="p-4 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white"><X size={24}/></button>
            </div>
            
            <div className="flex justify-between md:justify-start gap-4 md:gap-12 mb-6 bg-black/40 p-4 rounded-xl border border-white/5 flex-shrink-0 overflow-x-auto">
               <div className="flex flex-col"><span className="text-[10px] text-white/40 uppercase tracking-widest">累計專注</span><span className="text-white font-mono">{formatNumber(player.lifetimeStats?.focusCount || 0)} 次</span></div>
               <div className="flex flex-col"><span className="text-[10px] text-white/40 uppercase tracking-widest">擊殺妖獸</span><span className="text-rose-400 font-mono">{formatNumber(player.lifetimeStats?.kills || 0)} 隻</span></div>
               <div className="flex flex-col"><span className="text-[10px] text-white/40 uppercase tracking-widest">累計靈石</span><span className="text-yellow-400 font-mono">{formatNumber(player.lifetimeStats?.totalCoins || 0)}</span></div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
               {TITLE_DATA.map(t => {
                 const isUnlocked = (player.unlockedTitles || []).includes(t.id);
                 const isEquipped = player.equippedTitle === t.id;
                 return (
                   <div key={t.id} className={`p-5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${isEquipped ? 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : isUnlocked ? 'bg-white/5 border-white/20' : 'bg-black/60 border-white/5 opacity-50'}`}>
                      <div className="flex-1">
                         <div className="flex items-center gap-3 mb-1">
                            <h4 className={`text-base font-black tracking-widest ${isUnlocked ? 'text-amber-400' : 'text-white/50'}`}>【{t.name}】</h4>
                            {isEquipped && <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded uppercase font-black tracking-widest">已裝備</span>}
                         </div>
                         <p className="text-xs text-white/70 italic mb-2">"{t.desc}"</p>
                         <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-[11px] font-mono">
                            <span className="text-cyan-400">條件：{t.cat === 'kill' ? '擊殺妖獸' : t.cat === 'focus' ? '運轉周天' : t.cat === 'coin' ? '獲得靈石' : t.cat === 'artifact' ? '收集法寶' : t.cat === 'secret' ? '解鎖祕籍' : '滿級功法'} {formatNumber(t.req)}</span>
                            <span className="text-emerald-400">被動：{t.buffDesc}</span>
                         </div>
                      </div>
                      {isUnlocked && !isEquipped && (
                        <button onClick={() => setPlayer(p => ({ ...p, equippedTitle: t.id }))} className="py-3 px-6 bg-white/10 hover:bg-amber-600 hover:text-white rounded-lg text-xs font-black border border-white/20 transition-all flex-shrink-0">
                          裝備稱號
                        </button>
                      )}
                   </div>
                 );
               })}
            </div>
          </div>
        </div>
      )}

      {showRealmGuide && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-xl p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center font-bold mt-8">
          <div className="w-full max-w-4xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 flex-shrink-0">
               <h2 className="text-xl md:text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3"><BookOpen className="text-emerald-500"/> 天道經緯 (境界全覽)</h2>
               <button onClick={() => setShowRealmGuide(false)} className="p-4 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white"><X size={24}/></button>
            </div>
            <div className="w-full overflow-y-auto custom-scrollbar bg-[#0a0a0a]/80 rounded-xl border border-white/5 flex-1 shadow-2xl">
              <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="text-xs text-white/30 uppercase tracking-widest border-b border-white/10 bg-black/50">
                      <th className="py-5 px-6 font-mono">位階範圍</th>
                      <th className="py-5 px-6">境界名號</th>
                      <th className="py-5 px-6">神識導讀</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GUIDE_REALMS.map((r, i) => (
                      <tr key={i} className={`border-b border-white/5 transition-colors hover:bg-white/5`}>
                        <td className="py-5 px-6 font-mono text-xs text-white/40">{r.range}</td>
                        <td className={`py-5 px-6 font-black text-sm text-white/90`}>{r.name}</td>
                        <td className="py-5 px-6 text-xs text-white/50 leading-relaxed italic font-bold">{r.desc}</td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-xl p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center font-bold mt-8">
          <div className="w-full max-w-2xl bg-[#0a0a0a] p-4 sm:p-6 md:p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 flex-shrink-0">
               <h2 className="text-lg md:text-xl font-black text-white tracking-widest uppercase flex items-center gap-3"><HelpCircle className="text-emerald-400"/> 修行指引與祕訣</h2>
               <button onClick={() => setShowGuide(false)} className="p-4 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-6">
              <div className="flex gap-2 bg-black/60 p-1 rounded-lg border border-white/5 flex-shrink-0">
                <button onClick={() => setGuideTab('rules')} className={`flex-1 py-4 text-xs md:text-sm font-bold rounded uppercase tracking-widest transition-all ${guideTab === 'rules' ? 'bg-white/10 text-white shadow-inner' : 'text-white/30 hover:text-white/80'}`}>基礎法則</button>
                <button onClick={() => setGuideTab('tips')} className={`flex-1 py-4 text-xs md:text-sm font-bold rounded uppercase tracking-widest transition-all ${guideTab === 'tips' ? 'bg-amber-900/30 text-amber-500 shadow-inner' : 'text-amber-500/30 hover:text-amber-400/80'}`}>機制與祕訣 (TIPS)</button>
              </div>

              {guideTab === 'rules' ? (
                <div className="space-y-4 text-sm leading-relaxed animate-pop-in">
                   <section className="bg-white/5 p-5 rounded-xl border-l-4 border-emerald-500 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-emerald-400 text-base flex items-center gap-2 font-black"><Play size={18}/> 核心玩法 (專注即戰力)</h3>
                     <p className="text-white/70 font-bold">這是一款結合「番茄鐘」的修仙RPG。你現實的「專注時間」就是戰力。點擊運轉周天去讀書/工作，結束後結算傷害與收益。支援離線運算，切換視窗不影響進度。</p>
                   </section>
                   <section className="bg-white/5 p-5 rounded-xl border-l-4 border-cyan-400 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-cyan-400 text-base flex items-center gap-2 font-black"><Shield size={18}/> 境界與死劫 (破關條件)</h3>
                     <p className="text-white/70 font-bold">平時遭遇隨機「道中妖獸」。當修為達 <span className="text-cyan-300">100%</span> 時，引發該境界的「守關死劫 (Boss)」。唯有擊殺 Boss 才能突破境界。若在死劫中身亡，修為跌落，死劫將消散需重新歷練。</p>
                   </section>
                   <section className="bg-white/5 p-5 rounded-xl border-l-4 border-rose-500 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-rose-400 text-base flex items-center gap-2 font-black"><Skull size={18}/> 戰鬥與死亡懲罰</h3>
                     <p className="text-white/70 font-bold">若專注時長太短導致無法擊殺妖獸，妖獸將發動反撲。氣血歸零若無護盾/復活，將<span className="text-rose-400">損失 20% 當前修為並清空連擊</span>。請在洞府隨時「煉製回春丹」保持健康。</p>
                   </section>
                   <section className="bg-white/5 p-5 rounded-xl border-l-4 border-yellow-400 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-yellow-400 text-base flex items-center gap-2 font-black"><RefreshCw size={18}/> 凡俗根基 (SP與散功)</h3>
                     <p className="text-white/70 font-bold">升級境界是獲取 SP (技能點) 的<span className="text-yellow-300">唯一途徑</span>。若點錯技能卡關，請使用「散功重修」。這會讓你跌落一個境界並退還所有 SP，但生涯數據與道侶將永久保留。</p>
                   </section>
                   <section className="bg-white/5 p-5 rounded-xl border-l-4 border-pink-400 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-pink-400 text-base flex items-center gap-2 font-black"><Heart size={18}/> 道侶與羈絆 (同行增益)</h3>
                     <p className="text-white/70 font-bold">境界提升可結識紅顏。手動點擊「邀其同行」後，道侶會為你護法。羈絆全看「相伴載數（專注分鐘數）」，陪伴越久，給予的被動增益越強大。</p>
                   </section>
                </div>
              ) : (
                <div className="space-y-4 text-sm leading-relaxed animate-pop-in">
                   <section className="bg-white/5 p-5 rounded-xl border-l-4 border-purple-500 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-purple-400 text-base flex items-center gap-2 font-black"><Activity size={18}/> 屬性溢出與劍陣 (流派構築)</h3>
                     <p className="text-white/70 font-bold">閃避率超過 75% 轉化為「連擊上限」；爆擊率超過 95% 以 3 倍轉化為「爆傷」。此外，裝備 2 把以上名劍觸發共鳴：每多一把全戰力 <span className="text-emerald-400">+20%</span> (集齊10把可達 +200%)。</p>
                   </section>
                   <section className="bg-white/5 p-5 rounded-xl border-l-4 border-rose-500 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-rose-400 text-base flex items-center gap-2 font-black"><AlertTriangle size={18}/> 高階博弈 (妖獸蓄力與反噬)</h3>
                     <p className="text-white/70 font-bold">【築基期】起，長時長專注會導致妖獸「同步蓄力」，反撲傷害倍增。【結丹期】起，強行收功將依「已流逝時間」產生氣機牽引，撐得越久才放棄，反噬越致命。</p>
                   </section>
                   <section className="bg-white/5 p-5 rounded-xl border-l-4 border-cyan-400 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-cyan-400 text-base flex items-center gap-2 font-black"><History size={18}/> 時長戰略 (15m vs 60m)</h3>
                     <p className="text-white/70 font-bold">道侶羈絆看「相伴時間」，不論短修或長關皆不浪費。但 <span className="text-amber-400">60m 具備 4 倍的掉寶率與奇遇機率</span>，是後期拼神寶與過死劫的唯一解。</p>
                   </section>
<section className="bg-white/5 p-5 rounded-xl border-l-4 border-yellow-500 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-yellow-400 text-base flex items-center gap-2 font-black"><Compass size={18}/> 連鎖突變與投資學</h3>
                     <p className="text-white/70 font-bold mb-2">前期靈石極缺，請優先升級「基礎戰力/氣血」與「陣法」，性價比最高。當你開始抽卡，若該階級圖鑑已滿，每次抽中將有 <span className="text-amber-400">20% 機率引發「突變」</span>躍升至下一階級！</p>
                     {/* ✨ 新增：稀有度排序指引 */}
                     <div className="bg-black/40 p-3 rounded-lg border border-white/5 mt-2">
                       <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">萬寶樓品階排序：</span>
                       <span className="text-xs font-mono font-bold flex flex-wrap gap-1.5">
                         <span className="text-slate-400">凡品</span> ➔ <span className="text-green-400">靈品</span> ➔ <span className="text-blue-400">法寶</span> ➔ <span className="text-purple-400">古寶</span> ➔ <span className="text-orange-400">通天靈寶</span> ➔ <span className="text-red-500">玄天之寶</span> ➔ <span className="text-yellow-400">造化至寶</span>
                       </span>
                     </div>
                   </section>
                   <section className="bg-white/5 p-5 rounded-xl border-l-4 border-amber-500 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-amber-500 text-base flex items-center gap-2 font-black"><Award size={18}/> 名號白嫖法 (免費尋寶)</h3>
                     <p className="text-white/70 font-bold">請時常點開「名號頭銜」。達成各項成就解鎖名號，不僅能裝備強大被動，每次解鎖還會贈送【免費保底尋寶 1 次】，這是前期無課獲取古寶的最佳途徑。</p>
                   </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showStatsReport && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-xl p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center font-bold mt-8">
          <div className="w-full max-w-3xl bg-[#0a0a0a] p-4 sm:p-6 md:p-10 rounded-2xl border border-cyan-900/50 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4 flex-shrink-0">
               <h2 className="text-lg md:text-xl font-black text-cyan-400 tracking-widest uppercase flex items-center gap-3"><BarChart3 size={24}/> 屬性極限與轉化報告</h2>
               <button onClick={() => setShowStatsReport(false)} className="p-4 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 pb-8">
                
                {/* --- 根基與倍率區 --- */}
                <div className="space-y-2">
                  <h3 className="text-xs text-white/50 uppercase border-b border-white/10 pb-2 mb-4 font-mono tracking-widest flex items-center gap-2"><ChevronsUp size={14}/> 根基與倍率 (BASE & MULTIPLIERS)</h3>
                  {renderStatRow('原始戰力', 'base_atk', formatNumber(player.baseCombat), null, 'text-rose-200')}
                  {renderStatRow('總戰力加成', 'atk', `x${getMultiplier('atk').toFixed(2)}`, null, 'text-rose-400')}
                  {renderStatRow('原始氣血上限', 'base_hp', formatNumber(player.baseMaxVitality), null, 'text-emerald-200')}
                  {renderStatRow('氣血上限加成', 'hp', `x${getMultiplier('hp').toFixed(2)}`, null, 'text-emerald-400')}
                  {renderStatRow('靈氣獲取倍率', 'qi', `x${getMultiplier('qi').toFixed(2)}`, null, 'text-cyan-400')}
                  {renderStatRow('靈石掉落倍率', 'stone', `x${getMultiplier('stone').toFixed(2)}`, null, 'text-yellow-400')}
                </div>
                
                {/* --- 戰鬥極限區 --- */}
                <div className="space-y-2">
                  <h3 className="text-xs text-white/50 uppercase border-b border-white/10 pb-2 mb-4 font-mono tracking-widest flex items-center gap-2"><Flame size={14}/> 戰鬥極限 (COMBAT CAPS)</h3>
                  {renderStatRow('爆擊率', 'crit', `${(critRate * 100).toFixed(1)}%`, '(溢出>95% 轉爆傷)', 'text-purple-400')}
                  {renderStatRow('爆擊傷害', 'crit_dmg', `${(critDmg * 100).toFixed(0)}%`, '(極限 2000%)', 'text-rose-400')}
                  {renderStatRow('連擊增傷上限', 'streak_cap', `+${((streakCap - 0.5) * 100).toFixed(0)}%`, '(極限 +800%)', 'text-rose-400')}
                  {renderStatRow('連擊效率倍率', 'streak_eff', `x${streakEff.toFixed(2)}`, null, 'text-rose-400')}
                </div>

                {/* --- 生存防禦區 --- */}
                <div className="space-y-2">
                  <h3 className="text-xs text-white/50 uppercase border-b border-white/10 pb-2 mb-4 font-mono tracking-widest flex items-center gap-2"><Shield size={14}/> 生存防禦 (DEFENSE)</h3>
                  {renderStatRow('閃避免傷率', 'evade', `${(evadeRate * 100).toFixed(1)}%`, '(溢出>75% 轉連擊)', 'text-emerald-400')}
                  {renderStatRow('涅槃復活率', 'revive', `${(reviveRate * 100).toFixed(1)}%`, '(極限 65%)', 'text-emerald-400')}
                  {renderStatRow('反噬承傷比例', 'def', `${dmgTakenPct.toFixed(1)}%`, '(由顛倒五行與防禦力計算)', 'text-yellow-500')}
                  {renderStatRow('神識感應減傷', 'sense_def', `${((Math.min(0.9, getMultiplier('sense_def') - 1)) * 100).toFixed(1)}%`, '(無視空間鎖定，極限 90%)', 'text-cyan-400')}
                </div>

                {/* --- 機緣經濟區 --- */}
                <div className="space-y-2">
                  <h3 className="text-xs text-white/50 uppercase border-b border-white/10 pb-2 mb-4 font-mono tracking-widest flex items-center gap-2"><Compass size={14}/> 機緣經濟 (ECONOMY)</h3>
                  {renderStatRow('氣運保底倍率', 'luck_floor', `x${getMultiplier('luck_floor').toFixed(2)}`, '(乘算奇遇與抽獎)', 'text-yellow-400')}
                  {renderStatRow('洞府成本折扣', 'forge_discount', `${(forgeDiscount * 100).toFixed(0)}%`, '(極限降至 10%)', 'text-yellow-500')}
                  {renderStatRow('真靈吸血比例', 'lifesteal', `${((getMultiplier('lifesteal') - 1) * 100).toFixed(1)}%`, '(爆擊時 30% 機率觸發)', 'text-rose-400')}
                  {renderStatRow('休息回血比例', 'heal_bonus', `${(healPct * 100).toFixed(1)}%`, '(極限 80%)', 'text-emerald-400')}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}


      {celebration && (
        <div className={`fixed inset-0 z-[800] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-12 cursor-pointer font-bold animate-pop-in ${['LEGENDARY', 'MYTHIC', 'DIVINE'].includes(celebration.rarity) ? 'animate-shake' : ''}`} onClick={() => setCelebration(null)}>
          
          {/* 特效背光 (高階專屬) */}
          {['LEGENDARY', 'MYTHIC', 'DIVINE'].includes(celebration.rarity) && (
             <div className={`absolute inset-0 bg-gradient-to-t from-transparent ${celebration.rarity === 'DIVINE' ? 'via-yellow-500/20' : celebration.rarity === 'MYTHIC' ? 'via-red-500/20' : 'via-orange-500/20'} to-transparent animate-pulse pointer-events-none`}></div>
          )}

          {celebration.isMutation ? (
            <Zap size={100} className="text-amber-400 mb-6 animate-ping drop-shadow-[0_0_40px_rgba(251,191,36,1)] relative z-10" />
          ) : (
            <Crown size={80} className={`${celebration.rarity ? RARITY[celebration.rarity].color : 'text-yellow-500/80'} mb-6 animate-bounce drop-shadow-[0_0_20px_currentColor] relative z-10`} />
          )}
          
          <h2 className={`text-3xl md:text-5xl font-black mb-2 uppercase tracking-widest text-center leading-tight relative z-10 ${celebration.isMutation ? 'text-amber-300 drop-shadow-[0_0_20px_rgba(252,211,77,0.8)]' : 'text-white'}`}>
            {celebration.name.includes('成就真仙') ? '渡劫成功' : celebration.name.includes('法寶') || celebration.name.includes('功法') ? '機緣出世' : '突破瓶頸'}
          </h2>
          
          <p className={`text-xl md:text-2xl font-light tracking-widest mb-8 relative z-10 ${celebration.rarity ? RARITY[celebration.rarity].color : 'text-emerald-400'} drop-shadow-md`}>
            【{celebration.name}】
          </p>
          
          {celebration.quote && (
             <p className="text-lg md:text-xl text-white/80 italic font-bold max-w-2xl text-center mb-8 leading-relaxed relative z-10">「{celebration.quote}」</p>
          )}
          
          {celebration.drops && celebration.drops.length > 0 && (
             <div className="flex flex-col items-center gap-3 mt-4 bg-black/60 p-6 rounded-2xl border border-white/20 shadow-2xl relative z-10">
                <span className="text-xs text-white/40 uppercase tracking-[0.5em] mb-2 font-black">- 天道恩賜 -</span>
                {celebration.drops.map((d, i) => (
                   <span key={i} className={`text-lg md:text-xl font-black tracking-widest drop-shadow-md ${celebration.rarity ? RARITY[celebration.rarity].color : 'text-yellow-400'}`}>{d}</span>
                ))}
             </div>
          )}
          
          <div className="mt-14 text-sm font-black text-white/30 animate-pulse tracking-widest uppercase relative z-10">點擊虛空任意處繼續</div>
        </div>
      )}

      <div className={`w-full max-w-4xl mb-6 transition-all duration-500 z-10 font-bold px-2 md:px-0 mt-10 ${isActive ? 'hidden' : 'block'}`}>
        <div className="flex flex-col items-center mb-8 h-10 justify-center">
          <h1 className="text-lg md:text-xl font-extralight tracking-[1.2em] text-white/30 uppercase font-bold drop-shadow-md">
            凡人修仙專注
          </h1>
          <div className="h-px w-48 bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4 opacity-50"></div>
        </div>
        
        {/* --- 狀態主面板 --- */}
        <div className={`bg-slate-900/50 backdrop-blur-3xl p-5 md:p-8 rounded-xl border ${activeColorClass.border} relative shadow-2xl transition-all duration-500`}>
          
          {/* 頂部資訊區塊 */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6 mb-6">
            
            {/* --- 左側 --- */}
            <div className="flex items-center gap-4 w-full md:flex-1 min-w-0">
                <Shield size={36} className={`${activeColorClass.text} flex-shrink-0`}/>
                
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase text-white drop-shadow-lg truncate flex items-center flex-wrap">
                    {player.equippedTitle && <span className="text-amber-400 mr-2 border border-amber-500/50 bg-amber-950/50 px-2 py-0.5 rounded text-[10px] sm:text-xs tracking-widest relative -top-0.5">[{TITLE_DATA.find(t=>t.id===player.equippedTitle)?.name}]</span>}
                    {currentRealmData.name}
                  </h2>
                  
<div className="flex flex-wrap items-center gap-3 mt-1">
                     <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-white/50 uppercase tracking-widest">戰力</span>
                        <span className="text-sm font-mono font-black text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] flex items-center gap-1">
                           <Sword size={12}/> {formatNumber(currentCombatPower)}
                        </span>
                     </div>
                     <span className="text-white/20 text-[10px]">|</span>
                     <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-white/50 uppercase tracking-widest">綜合靈壓</span>
                        <span className="text-sm font-mono font-black text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.8)] flex items-center gap-1">
                           <Activity size={12}/> {formatNumber(comprehensiveCP)}
                        </span>
                     </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/10 bg-black/40 text-[10px] sm:text-xs tracking-widest font-black ${currentFate.color}`}>
                      <Clover size={14} className="fill-current"/> 
                      {currentFate.name}
                    </div>

                    {player.activeCompanion && (
                      <span className="text-pink-400 border border-pink-500/50 bg-pink-950/50 px-2.5 py-1 rounded-md text-[10px] sm:text-xs tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                        <Heart size={14} className="fill-current animate-pulse"/> 
                        {COMPANIONS.find(c=>c.id===player.activeCompanion)?.name} ({getCompanionTier(player.companionKills?.[player.activeCompanion]||0) >= 0 ? COMPANION_TIERS[getCompanionTier(player.companionKills?.[player.activeCompanion]||0)].name : '未結緣'})
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-xs md:text-sm leading-tight ${activeColorClass.text} font-bold mt-2 opacity-90 italic drop-shadow-md truncate`}>
                    {currentRealmData.desc}
                  </p>
                </div>
            </div>

{/* --- 右側狀態列 --- */}
            <div className="grid grid-cols-3 sm:flex sm:flex-row sm:flex-nowrap justify-start md:justify-end items-start md:items-end gap-x-4 gap-y-4 w-full md:w-auto mt-4 md:mt-0">
               {/* 1. 靈石 */}
               <div className="flex flex-col items-start md:items-end">
                  <span className="text-xs text-yellow-500 uppercase font-black flex items-center gap-1.5 mb-1"><Coins size={12}/> 靈石</span>
                  <span className="text-base text-yellow-500 font-mono font-bold drop-shadow-md">{formatNumber(player.coins)}</span>
               </div>

               {/* 2. 頓悟丹 */}
               <div className="flex flex-col items-start md:items-end font-bold">
                  <span className="text-xs text-amber-500 uppercase font-black flex items-center gap-1.5 mb-1"><Pill size={12}/> 頓悟丹</span>
                  <span className="text-base text-amber-500 font-mono font-bold drop-shadow-md">{formatNumber(player.epiphanyPills || 0)}</span>
               </div>

               {/* 3. 連擊 */}
               <div className="flex flex-col items-start md:items-end">
                  <span className="text-xs text-rose-500 uppercase font-black flex items-center gap-1.5 mb-1"><Sword size={12}/> 連擊</span>
                  <span className={`text-base text-rose-500 font-mono font-bold drop-shadow-md transition-all duration-500 flex items-center gap-1 ${comboMultiplier > 2.0 ? 'text-rose-300 scale-110 animate-pulse drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]' : ''}`}>
                     x{comboMultiplier.toFixed(2)}
                     {maxStreakShields > 0 && <span className="text-cyan-400 text-xs ml-1 flex items-center">🛡️{player.streakShields}</span>}
                  </span>
               </div>
            </div>
</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-3 relative z-10">
                <div className="flex justify-between text-xs uppercase font-black opacity-60 tracking-widest text-white">
                    <span className="flex items-center gap-2">氣血真元</span>
                    <span>{formatNumber(player.vitality)} / {formatNumber(maxVitality)}</span>
                </div>
                <div className={`h-2.5 bg-black/60 rounded-full overflow-hidden shadow-inner transition-all duration-300 ${isHealing ? 'shadow-[0_0_15px_rgba(16,185,129,0.8)]' : ''}`}>
                    <div className="h-full bg-rose-500 transition-all duration-1000 shadow-[0_0_10px_#f43f5e]" style={{ width: `${Math.min(100, (player.vitality/maxVitality)*100)}%` }}></div>
                </div>
            </div>
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between text-xs uppercase font-black opacity-60 tracking-widest text-white"><span>修為進度</span><span>{formatNumber(player.qi)} / {formatNumber(player.qiToNext)}</span></div>
              <div className="h-2.5 bg-black/60 rounded-full overflow-hidden shadow-inner"><div className={`h-full ${activeColorClass.bg} transition-all duration-1000 shadow-[0_0_10px_currentColor]`} style={{ width: `${Math.min(100, (player.qi/player.qiToNext)*100)}%` }}></div></div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <div className="flex overflow-x-auto py-5 px-4 gap-8 bg-black/40 rounded-xl border border-white/10 flex-shrink-0 custom-scrollbar">
            {REALMS.map((r, i) => (
              <div 
                key={i} 
                ref={i === player.realmIndex ? activeRealmRef : null} 
                className={`flex flex-col items-center min-w-[90px] transition-all relative ${
                  i === player.realmIndex ? 'scale-110 opacity-100' : 'opacity-40'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-black text-sm rotate-45 transition-all ${
                  i === player.realmIndex ? 'bg-white text-black rotate-0 shadow-2xl' : 'border-white/20 text-white'
                }`}>
                  <span className={i === player.realmIndex ? '' : '-rotate-45'}>{i}</span>
                </div>
                <span className="text-xs font-black mt-5 whitespace-nowrap uppercase tracking-tighter">
                  {r.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`w-full max-w-4xl bg-slate-900/40 backdrop-blur-3xl p-8 md:p-14 rounded-2xl border ${mode === 'break' ? 'border-cyan-500/30' : 'border-white/10'} text-center z-10 shadow-2xl transition-all duration-700 ${isActive ? (mode === 'break' ? 'scale-[1.02] shadow-[0_0_50px_rgba(6,182,212,0.15)] my-auto' : 'scale-[1.02] shadow-[0_0_50px_rgba(16,185,129,0.15)] border-emerald-500/30 my-auto') : 'mb-8'}`}>
        
        <div className={`grid grid-cols-2 sm:flex sm:justify-center gap-4 md:gap-6 mb-12 font-bold max-w-[280px] sm:max-w-none mx-auto ${isActive ? 'hidden' : ''}`}>
           {FOCUS_OPTIONS.map(opt => (
             <button key={opt.value} onClick={() => { if(!isActive) { if(mode==='break') setMode('focus'); setFocusDuration(opt.value); setTimeLeft(opt.value); }}} className={`w-full sm:w-auto px-6 py-3.5 rounded-full text-sm font-black border transition-all ${focusDuration === opt.value && mode === 'focus' ? 'bg-white text-black border-white shadow-lg' : 'bg-black/40 text-white/50 border-white/20 hover:text-white/90 hover:bg-white/10'}`}>
               {opt.label}
             </button>
           ))}
        </div>
        
        {mode === 'focus' ? (
          <div className={isActive ? 'hidden' : 'block'}>
            <div className={`flex justify-center items-center gap-3 mb-2 text-sm md:text-base tracking-[0.6em] font-black uppercase transition-colors ${monster.name.includes('死劫') || monster.name.includes('劫') ? 'text-rose-500 animate-pulse' : 'text-rose-400'}`}>
              <Compass size={18}/> {monster.name}
            </div>

            <div className="text-xs md:text-sm text-rose-200/70 italic font-bold mb-4 tracking-widest drop-shadow-md px-4 leading-relaxed">
              「{monster.quote || '（惡狠狠的直盯著你，彷彿要將你生脫活剝...）'}」
            </div>

            <div className="w-full max-w-xs mx-auto bg-black/60 rounded-full h-2.5 mb-1 overflow-hidden border border-white/10 shadow-inner">
               <div className="bg-gradient-to-r from-rose-900 to-rose-500 h-full transition-all duration-500 shadow-[0_0_10px_#f43f5e]" style={{ width: `${Math.min(100, (monster.hp / monster.maxHp) * 100)}%` }}></div>
            </div>
            <div className="text-[10px] font-mono text-white/40 text-center mb-10">氣血 {formatNumber(monster.hp)} / {formatNumber(monster.maxHp)} ｜ 戰力 {formatNumber(monster.atk)}</div>
            
          </div>
        ) : (
          <div className={`flex justify-center items-center gap-3 mb-10 text-sm md:text-base tracking-[0.6em] font-black uppercase text-cyan-400 animate-pulse ${isActive ? 'hidden' : 'flex'}`}>
            <CloudLightning size={18}/> 靈氣反哺．吐納調息中
          </div>
        )}

        <div className={`text-[5.5rem] sm:text-8xl md:text-[12rem] font-mono leading-none font-black tracking-tighter mb-14 transition-all duration-700 ${isActive ? (mode === 'break' ? 'text-cyan-300 drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]' : 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]') : 'text-white/30'}`}>
          {formatTime(timeLeft)}
        </div>
        
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex justify-center gap-6 md:gap-8 font-bold w-full">
            {!isActive ? (
              <button onClick={toggleTimer} className={`flex items-center justify-center gap-3 sm:gap-4 px-6 sm:px-16 py-5 sm:py-7 hover:text-black border border-white/20 rounded-2xl text-base sm:text-xl font-black tracking-widest sm:tracking-[0.5em] uppercase transition-all shadow-2xl backdrop-blur-md w-full md:w-auto whitespace-nowrap ${mode === 'break' ? 'bg-cyan-900/40 text-cyan-300 hover:bg-cyan-400' : 'bg-white/10 hover:bg-white text-white'}`}>
                <Sparkles className="fill-current animate-pulse size-5 sm:size-6"/> {mode === 'focus' ? '運轉周天 (蓄力)' : '開始調息 (回血)'}
              </button>
            ) : mode === 'focus' ? (
              <button onClick={preCheckGiveUp} className="flex items-center justify-center gap-3 sm:gap-4 px-6 sm:px-16 py-5 sm:py-7 bg-rose-950/50 text-rose-400 hover:bg-rose-900/80 border border-rose-500/40 rounded-2xl text-base sm:text-xl font-black tracking-widest sm:tracking-[0.5em] uppercase active:scale-95 transition-all shadow-2xl backdrop-blur-md w-full md:w-auto whitespace-nowrap">
                <AlertTriangle className="fill-current size-5 sm:size-6"/> 強行收功
              </button>
            ) : (
              <button onClick={handleSkipBreak} className="flex items-center justify-center gap-3 sm:gap-4 px-6 sm:px-16 py-5 sm:py-7 bg-cyan-950/50 text-cyan-400 hover:bg-cyan-900/80 border border-cyan-500/40 rounded-2xl text-base sm:text-xl font-black tracking-widest sm:tracking-[0.5em] uppercase active:scale-95 transition-all shadow-2xl backdrop-blur-md w-full md:w-auto whitespace-nowrap">
                <Wind className="fill-current size-5 sm:size-6"/> 結束調息
              </button>
            )}
          </div>
{/* ✨ 沉浸式天機顯示 (極簡無框、慢速呼吸) */}
          {combatPrediction && !isActive && mode === 'focus' && (
            <div 
              className={`text-xs sm:text-sm font-bold tracking-widest italic opacity-40 ${combatPrediction.color} animate-pulse pointer-events-none -mt-2`}
              style={{ animationDuration: '4s' }}
            >
              「{combatPrediction.text}」
            </div>
          )}
          {(player.epiphanyPills || 0) > 0 && mode === 'focus' && (
            <button 
              onClick={() => canUsePill && handleComplete(true)} 
              disabled={!canUsePill}
              className={`flex items-center justify-center gap-2 px-8 py-4 rounded-full text-xs sm:text-sm font-black tracking-widest transition-all border shadow-[0_0_15px_rgba(245,158,11,0.2)] ${canUsePill ? 'bg-amber-900/50 text-amber-400 hover:bg-amber-600 hover:text-white border-amber-500/50 cursor-pointer' : 'bg-slate-900/80 text-slate-500 border-slate-700/50 cursor-not-allowed opacity-80'} ${isActive ? 'opacity-30 hover:opacity-100' : ''}`}
            >
              <Pill size={16} className={canUsePill ? "animate-pulse" : ""}/> 
              {canUsePill ? `吞服頓悟丹，瞬間出關 (餘 ${player.epiphanyPills})` : `丹毒未消 (需真實專注或待 ${formatTime(pillCooldownRemaining)})`}
            </button>
          )}
        </div>
      </div>

      <div className={`w-full max-w-4xl mt-4 transition-all duration-500 z-10 font-bold ${isActive ? 'hidden' : 'block'}`}>
        <div className="bg-slate-950/90 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-2xl flex flex-col h-[800px] overflow-hidden">
          <div className="flex bg-black/80 border-b border-white/10 p-2 gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
{[
  { id: 'log', label: '修行日誌', icon: History },
  { id: 'skills', label: '功法祕籍', icon: ScrollText, hasNotify: availableSP >= 1 }, // ✨ 新增：未使用的 SP 紅點提示
  { id: 'forge', label: '洞府淬煉', icon: Hammer, hasNotify: ((player.dailyGacha || 0) + (player.awardGacha || 0) > 0) }, 
  { id: 'artifacts', label: '法寶庫', icon: Box },
  { id: 'companions', label: '道侶紅顏', icon: Heart },
  { id: 'insights', label: '識海投影', icon: Activity }
].map(tab => (
  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-4 md:py-5 text-center transition-all relative flex flex-col items-center justify-center gap-2 ${activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}>
    <div className="relative">
      <tab.icon size={18} className={`${activeTab === tab.id ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ''}`} />
      {/* 🔴 呼吸紅色亮點 */}
      {tab.hasNotify && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_#f43f5e]" />
      )}
    </div>
    <span className="text-[10px] md:text-xs tracking-widest font-black whitespace-nowrap">{tab.label}</span>
  </button>
))}
          </div>

          <div className="p-5 md:p-10 overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'skills' && (
              <div className="space-y-14 animate-pop-in">
                <div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-white/20 pb-4 gap-4">
                    <h3 className="text-white/60 text-sm font-black uppercase tracking-widest">凡俗根基 (SP 研習)</h3>
                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                      <span className="text-cyan-400 font-mono">可用 SP: {formatNumber(availableSP)} / {totalSP}</span>
                      <button onClick={handleRebuildBase} className="px-4 py-2.5 bg-rose-900/40 hover:bg-rose-700 text-rose-300 hover:text-white rounded-lg text-xs font-black border border-rose-500/50 transition-all flex items-center gap-2 shadow-lg">
                        <RefreshCw size={14} /> 散功重修 (退SP)
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {BASIC_SKILLS.map(s => { const lvl = player.basicSkills?.[s.id] || 0; return (
                    <div key={s.id} className="p-5 rounded-xl border border-white/20 bg-white/5 flex flex-col justify-between h-56 shadow-inner group">
                        <div><h4 className="text-white font-bold text-sm tracking-widest uppercase">{s.name} <span className="opacity-50 float-right font-mono">Lv.{lvl}/{s.maxLvl}</span></h4><p className="text-xs text-white/60 mt-3 leading-relaxed italic">{s.desc}</p></div>
                        <button onClick={() => { if(availableSP >= 1 && lvl < s.maxLvl) setPlayer(p => ({...p, basicSkills: {...p.basicSkills, [s.id]: lvl+1}})) }} disabled={availableSP < 1 || lvl >= s.maxLvl} className="mt-5 w-full py-4 bg-white/10 hover:bg-cyan-600 hover:border-cyan-400 text-white rounded-lg text-xs font-black border border-white/20 transition-all disabled:opacity-30 disabled:hover:bg-white/10">研習 (1 SP)</button>
                    </div>
                  );})}
                  </div></div>
                  <div><h3 className="text-white/60 text-sm font-black uppercase border-b border-white/20 pb-4 mb-8 tracking-widest">機緣祕籍 (14 種)</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {sortedSecretBooks.map(book => { const lvl = player.secretBooks?.[book.id] || 0; const learned = lvl > 0; const upCost = Math.floor(10000 * Math.pow(2, lvl) * forgeDiscount); return (
                    <div key={book.id} className={`p-6 rounded-2xl border transition-all flex flex-col justify-between min-h-[16rem] ${learned ? 'bg-emerald-950/40 border-emerald-500/50 shadow-xl' : 'bg-black/60 border-white/10 opacity-60'}`}>
                        <div className="flex items-start gap-5"><div className={`p-4 rounded-xl ${learned ? 'bg-emerald-500 text-black shadow-lg' : 'bg-slate-800'}`}><BookOpen size={24}/></div><div className="flex-1"><h4 className="font-black text-base tracking-widest text-white">{book.name} {learned && <span className="text-xs opacity-60 ml-2 font-mono">Lv.{lvl}</span>}</h4><p className="text-sm opacity-70 leading-relaxed mt-2 text-white">{learned ? book.desc : '擊殺強敵機率獲得。'}</p></div></div>
                        {learned && lvl < 5 && <button onClick={() => handleUpgradeSecret(book.id)} disabled={player.coins < upCost || availableSP < 1} className="mt-6 w-full py-4 bg-white/10 hover:bg-emerald-600 text-white rounded-xl text-sm font-black border border-white/20 transition-all disabled:opacity-30">參悟升級 (${formatNumber(upCost)} 靈石 + 1 SP)</button>}
                    </div>
                  );})}
                  </div></div>
              </div>
            )}
            
            {activeTab === 'companions' && (
              <div className="space-y-8 animate-pop-in pb-10">
                <div className="bg-pink-950/30 border border-pink-500/30 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h3 className="text-pink-400 font-black text-lg tracking-widest flex items-center gap-2"><Heart size={20} className="fill-current"/> 仙途伴侶</h3>
                        <p className="text-white/60 text-xs mt-2 leading-relaxed">道侶解鎖與當前境界息息相關。選擇一位道侶同行，為你護法將提升羈絆，獲得強大增益。<br/>(羈絆階級：初識 1 / 相知 250 / 傾心 1250 / 生死相隨 2500 載)</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {COMPANIONS.map(comp => {
                        const isUnlocked = player.realmIndex >= comp.unlockIdx;
                        const isActive = player.activeCompanion === comp.id;
                        const exp = player.companionKills?.[comp.id] || 0;
                        const tierIdx = getCompanionTier(exp);
                        const currentBuff = tierIdx >= 0 ? comp.tiers[tierIdx] : 0;
                        
                        return isUnlocked ? (
                            <div key={comp.id} className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${isActive ? 'bg-pink-900/40 border-pink-500/50 shadow-[0_0_20px_rgba(244,114,182,0.2)]' : 'bg-black/60 border-white/10'}`}>
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-white font-black text-xl tracking-widest flex items-center gap-2">
                                            {comp.name} 
                                            {isActive && <span className="text-[10px] bg-pink-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest ml-2">同行中</span>}
                                        </h4>
                                        <div className="text-right">
                                            <div className="text-pink-400 font-mono text-sm">相伴 {exp} 載</div>
                                            <div className="text-white/40 text-[10px] uppercase tracking-widest mt-1">{tierIdx >= 0 ? COMPANION_TIERS[tierIdx].name : '未結緣'}</div>
                                        </div>
                                    </div>
                                    <p className="text-white/70 text-xs italic leading-relaxed mb-6 h-12">"{comp.desc}"</p>
                                    
                                    <div className="bg-black/40 rounded-xl p-4 border border-white/5 mb-6">
                                        <div className="text-pink-300 text-xs font-black mb-2 flex items-center gap-2">【{comp.buffName}】</div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-white/60 text-xs">{comp.buffDesc}</span>
                                            <span className="text-white font-mono text-base font-black">+{comp.buffType === 'luck_floor' ? currentBuff.toFixed(2) : `${currentBuff}%`}</span>
                                        </div>
                                        <div className="flex gap-1 mt-3">
                                            {comp.tiers.map((t, idx) => (
                                                <div key={idx} className={`h-1.5 flex-1 rounded-full ${idx <= tierIdx ? 'bg-pink-500' : 'bg-white/10'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {!isActive ? (
                                    <button 
                                      onClick={() => setPlayer(p => ({ ...p, activeCompanion: comp.id }))}
                                      className="w-full py-4 rounded-xl border border-white/20 text-xs font-black text-white/70 hover:bg-pink-600 hover:border-pink-400 hover:text-white transition-all mt-4">
                                      邀其同行
                                    </button>
                                ) : (
                                    <button 
                                      onClick={() => setPlayer(p => ({ ...p, activeCompanion: null }))}
                                      className="w-full py-4 rounded-xl border border-pink-500/30 text-xs font-black text-pink-400 hover:bg-pink-950 hover:text-pink-300 transition-all mt-4">
                                      請其回府 (取消同行)
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div key={comp.id} className="p-6 rounded-2xl border-2 border-dashed border-pink-900/30 bg-black/50 flex flex-col items-center justify-center min-h-[16rem] opacity-50">
                                <EyeOff size={40} className="text-pink-900/50 mb-5"/>
                                <p className="text-xs font-black text-pink-700/50 uppercase tracking-[0.3em]">仙影朦朧</p>
                                <div className="text-pink-900/40 text-[10px] mt-4 font-mono border border-pink-900/30 px-3 py-1 rounded-full">需突破至【{REALMS[comp.unlockIdx].name}】</div>
                            </div>
                        );
                    })}
                </div>
              </div>
            )}

            {activeTab === 'forge' && (
              <div className="space-y-14 animate-pop-in pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  <div className="p-8 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 min-h-[16rem] flex flex-col justify-between group shadow-xl shadow-emerald-900/20">
                    <div><h3 className="text-emerald-400 font-black text-xl tracking-tighter uppercase flex items-center gap-3"><Pill size={24}/> 煉製回春丹</h3><p className="text-white/70 text-sm mt-3 italic tracking-widest leading-relaxed">恢復 50% 最大氣血。</p></div>
                    <button onClick={handleHeal} disabled={player.coins < healCost || player.vitality >= maxVitality} className="w-full py-5 bg-emerald-900/80 hover:bg-emerald-600 text-emerald-100 rounded-xl font-black uppercase text-sm transition-all disabled:opacity-40 border border-emerald-500/50 mt-6">{player.vitality >= maxVitality ? '氣血已滿' : `煉丹 (${formatNumber(healCost)} 靈石)`}</button>
                  </div>
                  <div className="p-8 rounded-2xl bg-white/10 border border-white/20 min-h-[16rem] flex flex-col justify-between group">
                      <div><h3 className="text-white font-black text-xl tracking-tighter uppercase">凝練劍光</h3><p className="text-white/60 text-sm mt-3 italic tracking-widest">基礎戰力 +100。<br/>(花費指數提升，無極限)</p></div>
                      <button onClick={() => { if(player.coins >= upgCostAtk) setPlayer(p => ({ ...p, coins: p.coins - upgCostAtk, baseCombat: p.baseCombat + 100 })) }} disabled={player.coins < upgCostAtk} className="w-full py-5 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl font-black uppercase text-sm tracking-widest shadow-xl transition-all disabled:opacity-30 mt-6">祭煉 ({formatNumber(upgCostAtk)} 靈石)</button>
                  </div>
                  <div className="p-8 rounded-2xl bg-white/10 border border-white/20 min-h-[16rem] flex flex-col justify-between group">
                      <div><h3 className="text-white font-black text-xl tracking-tighter uppercase">熬煉肉身</h3><p className="text-white/60 text-sm mt-3 italic tracking-widest">氣血上限 +100。<br/>(花費指數提升，無極限)</p></div>
                      <button onClick={() => { if(player.coins >= upgCostHp) setPlayer(p => ({ ...p, coins: p.coins - upgCostHp, baseMaxVitality: p.baseMaxVitality + 100, vitality: p.vitality + 100 })) }} disabled={player.coins < upgCostHp} className="w-full py-5 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl font-black uppercase text-sm tracking-widest shadow-xl transition-all disabled:opacity-30 mt-6">熬煉 ({formatNumber(upgCostHp)} 靈石)</button>
                  </div>
                </div>
                <div className="space-y-6">
                   <h3 className="text-white/60 text-sm font-black uppercase border-b border-white/20 pb-4">陣法樞紐 (無上限)</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      <div className="bg-white/10 p-8 rounded-2xl border border-white/20 min-h-[14rem] flex flex-col justify-between shadow-inner"><div className="flex justify-between text-base text-white font-bold drop-shadow-md">聚靈大陣 <span className="opacity-60 font-mono">Lv.{player.arrays?.qi||0}</span></div><p className="text-sm opacity-70 italic mt-2">靈氣獲取提升 +5%/級</p><button onClick={() => { if(player.coins >= arrayQiCost) setPlayer(p => ({ ...p, coins: p.coins - arrayQiCost, arrays: {...p.arrays, qi: (p.arrays?.qi||0)+1} })) }} disabled={player.coins < arrayQiCost} className="w-full py-4 mt-6 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl text-sm font-black border border-white/20 transition-all disabled:opacity-30">升級 ({formatNumber(arrayQiCost)} 靈石)</button></div>
                      <div className="bg-white/10 p-8 rounded-2xl border border-white/20 min-h-[14rem] flex flex-col justify-between shadow-inner"><div className="flex justify-between text-base text-white font-bold drop-shadow-md">顛倒五行陣 <span className="opacity-60 font-mono">Lv.{player.arrays?.def||0}</span></div><p className="text-sm opacity-70 italic text-white mt-2">全域減傷提升 +5%/級</p><button onClick={() => { if(player.coins >= arrayDefCost) setPlayer(p => ({ ...p, coins: p.coins - arrayDefCost, arrays: {...p.arrays, def: (p.arrays?.def||0)+1} })) }} disabled={player.coins < arrayDefCost} className="w-full py-4 mt-6 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl text-sm font-black border border-white/20 transition-all disabled:opacity-30">升級 ({formatNumber(arrayDefCost)} 靈石)</button></div>
                   </div>
                </div>
<div className="bg-gradient-to-br from-white/10 to-transparent p-8 md:p-14 rounded-2xl border border-white/20 text-center relative overflow-hidden mt-8">
                  <h3 className="text-white font-black text-2xl uppercase mb-8 tracking-widest flex items-center justify-center gap-3"><Compass className="text-yellow-400"/> 萬寶樓尋寶</h3>
                  
                  {/* ✨ 雙軌制：計算總免費次數，並給予文字提示 */}
                  {((player.dailyGacha || 0) + (player.awardGacha || 0)) > 0 && (
                    <p className="text-amber-400 text-sm font-bold mb-6 animate-pulse flex flex-col gap-1 items-center justify-center">
                       <span>您有 {(player.dailyGacha || 0) + (player.awardGacha || 0)} 次【天道免費保底】抽獎機會！</span>
                       <span className="text-[10px] text-amber-500/70 font-mono">(將優先消耗每日限時機緣)</span>
                    </p>
                  )}
                  
                  <div className="flex justify-center gap-6 mb-12 overflow-x-auto pb-6 custom-scrollbar">
                     {Object.entries(RARITY).map(([k, r]) => (<div key={k} className="flex flex-col items-center min-w-[80px] opacity-80"><span className={`text-xs font-black uppercase ${r.color} drop-shadow-md`}>{r.name}</span><span className="text-sm font-mono mt-2 text-white">{(r.weight*100).toFixed(1)}%</span></div>))}
                  </div>
                  
{/* ✨ 雙軌制：按鈕判定更新 */}
                  <button 
                    onClick={handleGacha} 
                    disabled={isGachaPulling || (((player.dailyGacha || 0) + (player.awardGacha || 0)) <= 0 && player.coins < gachaCost)} 
                    className={`px-8 md:px-20 py-6 md:py-8 font-black rounded-2xl shadow-2xl transition-all whitespace-nowrap border flex items-center justify-center gap-4 mx-auto text-base md:text-lg ${isGachaPulling ? 'bg-amber-900/80 text-amber-200 border-amber-500/80 animate-pulse scale-105' : 'bg-white/15 hover:bg-white text-white hover:text-black border-white/30 disabled:opacity-30'}`}
                  >
                    {isGachaPulling ? (
                        <><RefreshCw className="animate-spin" size={24}/> 天機推演中...</>
                    ) : (
                        <><Sparkles size={24}/> {((player.dailyGacha || 0) + (player.awardGacha || 0)) > 0 ? '免費保底尋寶' : `尋寶 (${formatNumber(gachaCost)} 靈石)`}</>
                    )}
                  </button>
                </div>
              </div>
            )}
{activeTab === 'artifacts' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 animate-pop-in pb-10">
                {sortedArtifacts.map(art => {
                  const unlocked = (player.artifacts || []).includes(art.id);
                  return unlocked ? (
                    <div key={art.id} className={`p-8 rounded-2xl border bg-black/60 border-white/20 flex flex-col justify-center shadow-inner min-h-[14rem] relative overflow-hidden`}>
                        {/* ✨ 新增：右上角品階標籤 */}
                        <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black tracking-widest bg-white/10 ${RARITY[art.rarity].color} rounded-bl-xl border-b border-l border-white/10`}>
                          {RARITY[art.rarity].name}
                        </div>
                        
                        <h4 className={`font-black text-xl ${RARITY[art.rarity].color} tracking-tighter drop-shadow-md mb-4 mt-2`}>{art.name}</h4>
                        <p className="text-sm text-white/70 italic leading-relaxed uppercase tracking-widest">「{art.desc}」</p>
                    </div>
                  ) : <div key={art.id} className="p-8 rounded-2xl border-2 border-dashed border-white/10 bg-black/50 flex flex-col items-center justify-center opacity-50 min-h-[14rem]"><EyeOff size={40} className="text-white/30 mb-5"/><p className="text-xs font-black text-white/50 uppercase tracking-[0.3em]">寶光內斂：{RARITY[art.rarity].name}</p></div>;
                })}
              </div>
            )}
            {activeTab === 'insights' && (
              <div className="h-[500px] md:h-[600px] animate-pop-in bg-black/60 rounded-2xl border border-white/20 shadow-inner p-6 md:p-12 flex flex-col">
                <div className="flex justify-between items-center mb-10 opacity-70 text-xs font-black uppercase tracking-[0.4em] text-white"><span className="flex items-center gap-3"><Activity size={16}/> 識海投影 (修煉進程)</span><span>累計時間: {formatNumber(Math.floor((player.totalFocusTime || 0)/60))}m</span></div>
                <div className="flex-1 relative border-l-2 border-b-2 border-white/20"><InsightsChart /></div>
              </div>
            )}
            {activeTab === 'log' && (
              <div className="space-y-4 md:space-y-6 animate-pop-in pb-10">
                {(player.logs || []).map((e, i) => (<div key={i} className={`p-5 md:p-6 rounded-xl border border-white/20 text-xs md:text-sm leading-relaxed transition-all ${i===0?'bg-white/20 text-white shadow-xl animate-pulse':'bg-black/60 border-white/10 text-white/60'}`}>{e}</div>))}
              </div>
            )}
          </div>
        </div>

        <footer className="pt-20 pb-32 text-center text-xs font-light text-white/50 tracking-[0.5em] uppercase flex flex-col items-center gap-6 z-10 px-4 w-full">
          
          <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 mx-auto">
             <button onClick={() => setShowTitles(true)} className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black text-amber-400 hover:text-amber-300 transition-all bg-white/5 hover:bg-white/10 py-3 px-1 sm:px-4 sm:py-3.5 rounded-2xl sm:rounded-full border border-white/10 backdrop-blur-md shadow-lg tracking-widest">
               <Award size={16}/> <span className="whitespace-nowrap">名號頭銜</span>
             </button>
             <button onClick={() => setShowGuide(true)} className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black text-emerald-400 hover:text-emerald-300 transition-all bg-white/5 hover:bg-white/10 py-3 px-1 sm:px-4 sm:py-3.5 rounded-2xl sm:rounded-full border border-white/10 backdrop-blur-md shadow-lg tracking-widest">
               <HelpCircle size={16}/> <span className="whitespace-nowrap">修行指引</span>
             </button>
             <button onClick={() => setShowStatsReport(true)} className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black text-cyan-400 hover:text-cyan-300 transition-all bg-white/5 hover:bg-white/10 py-3 px-1 sm:px-4 sm:py-3.5 rounded-2xl sm:rounded-full border border-white/10 backdrop-blur-md shadow-lg tracking-widest">
               <BarChart3 size={16}/> <span className="whitespace-nowrap">屬性極限</span>
             </button>
             <button onClick={() => setShowRealmGuide(true)} className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black text-white/60 hover:text-white transition-all bg-white/5 hover:bg-white/10 py-3 px-1 sm:px-4 sm:py-3.5 rounded-2xl sm:rounded-full border border-white/10 backdrop-blur-md shadow-lg tracking-widest">
               <BookOpen size={16}/> <span className="whitespace-nowrap">境界全覽</span>
             </button>
          </div>

          <div className="w-full max-w-2xl mb-8 flex justify-center">
             <button onClick={() => setShowSaveModal(true)} className="flex items-center justify-center gap-2 text-cyan-400 hover:text-cyan-300 transition-all bg-cyan-950/40 hover:bg-cyan-900/60 py-3 px-6 rounded-full border border-cyan-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)] font-black tracking-widest">
               <ScrollText size={16}/> 玉簡傳功 (進度跨裝置同步)
             </button>
          </div>

          <p className="leading-relaxed">《凡人修仙傳》原著設定歸作者 忘語 所有</p>
          <p className="opacity-80 leading-loose">
            Created by <a href="https://www.facebook.com/profile.php?id=100084000897269" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline transition-all text-white">fb/指數三寶飯</a> 
            <br className="block sm:hidden mt-2" />
            <span className="sm:ml-3">with Gemini</span>
          </p>
          
          <div className="flex w-full max-w-md justify-center gap-3 mt-4">
              <button 
                onClick={() => setShowChangelog(true)} 
                className="flex-1 sm:flex-none opacity-60 hover:opacity-100 transition-all border border-white/30 py-3 px-2 sm:px-6 rounded-2xl text-xs tracking-widest hover:bg-emerald-900/60 hover:border-emerald-500/60 hover:text-emerald-200 flex flex-col items-center justify-center gap-1.5"
              >
                <span className="flex items-center gap-1.5 whitespace-nowrap"><FileText size={14}/> 天道紀元</span>
                <span className="text-[9px] opacity-50 whitespace-nowrap tracking-[0.2em] font-mono">(版本紀錄)</span>
              </button>
              
              <button 
                onClick={()=>{if(window.confirm('【天道輪迴】\n確定要刪除所有進度，重新投胎轉世嗎？\n所有成果將灰飛煙滅。')) { localStorage.clear(); window.location.reload(); }}} 
                className="flex-1 sm:flex-none opacity-60 hover:opacity-100 transition-all border border-white/30 py-3 px-2 sm:px-6 rounded-2xl text-xs tracking-widest hover:bg-rose-900/60 hover:border-rose-500/60 hover:text-rose-200 flex flex-col items-center justify-center gap-1.5"
              >
                <span className="flex items-center gap-1.5 whitespace-nowrap"><RefreshCw size={14}/> 輪迴轉世</span>
                <span className="text-[9px] opacity-50 whitespace-nowrap tracking-[0.2em] font-mono">(刪檔)</span>
              </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

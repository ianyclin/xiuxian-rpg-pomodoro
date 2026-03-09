import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Square, Skull, Shield, Zap, Flame, Wind, Coins, Hammer, Box, ScrollText, Network, AlertTriangle, EyeOff, Crown, ChevronsUp, RefreshCw, Zap as Lightning, CloudLightning, Info, Eye, Activity, Sparkles, Sword, Compass, Clover, Lock, BookOpen, X, History, BarChart3, Save, Pill, HelpCircle, ShieldAlert, Award, Heart, Copy, Download, FileText } from 'lucide-react';

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

// 重新分配：戰鬥磨血、擊殺、Boss、休息調息
const FEEDBACK_TEXTS = {
  focus: [
    "劍光閃爍，在妖獸身上留下一道深深的血痕。", 
    "法寶轟擊，震退了眼前的強敵！", 
    "攻勢如潮，妖獸的氣息隨之衰弱了幾分。", 
    "真元激盪，這一擊結結實實地打在了妖獸的破綻上。", 
    "趁其不備，凌厲的殺招狠狠命中了目標。",
    "激烈交鋒！你的法術成功穿透了它的防禦。", 
    "靈力爆發，妖獸的護體靈光被你強行撕裂。", 
    "一番纏鬥，妖獸的動作明顯遲緩了下來。", 
    "抓住破綻，連續的猛攻讓妖獸連連後退。", 
    "氣血翻湧，你的一擊讓妖獸發出了痛苦的嘶吼。"
  ],
  break: [
    "靈氣運轉一個周天，神清氣爽。", 
    "心無旁騖，道心更堅定了一分。", 
    "摒棄雜念，真元如臂使指。", 
    "吐納之間，修為暗暗增長。", 
    "一念不生，萬法無咎。",
    "神識清明，對天地法則的感悟加深了。", 
    "氣沉丹田，經脈中的靈力越發凝實。", 
    "歲月如梭，唯有苦修方能證得大道。", 
    "不驕不躁，平心靜氣地完成了一次循環。", 
    "周天圓滿，將外界喧囂盡數隔絕。"
  ],
  kill: [
    "劍氣如虹，妖血染紅了大地！", 
    "雷霆手段，瞬間將妖邪斬化為飛灰！", 
    "區區妖物，也敢擋我修仙之路！", 
    "真元爆發，摧枯拉朽般粉碎了敵人的防禦。", 
    "身法如電，在妖獸來不及反應前取其首級。"
  ],
  boss: [
    "逆天改命！硬生生踏破了這生死玄關！", 
    "天道不公，我便逆天！死劫已破！", 
    "千百次生死邊緣的試探，終於斬滅此瓶頸！", 
    "縱使九死一生，也絕不退縮半步！境界突破！", 
    "宿敵伏誅！從今往後，此界再無人能阻我！"
  ]
};

const CHANGELOG_DATA = [
  { version: "v4.2.0", title: "戰鬥與修心語錄重構", desc: "殺伐果斷與靜心悟道，方為修仙全貌。", changes: [ "重構【專注結束提示】：語句改為「對妖獸造成傷害與交鋒」的寫實描述。", "新增【調息結束提示】：將原有的靜心語錄移至休息結束時觸發，伴隨浮動橫幅提示。", "優化【橫幅視覺】：戰鬥磨血為赤紅色，擊殺為金橘色，休息為青藍色。" ] },
  { version: "v4.1.0", title: "真仙圓滿・無漏天衣", desc: "封裝最終邏輯，抹平飛升後的最後一道裂縫。", changes: [ "實裝【真仙位格】：飛升後自動切換為仙界狀態，不再遭遇死劫與反撲。", "修正【萬妖映射】：修復了渡劫期日常怪池可能出現的索引偏移。" ] },
  { version: "v4.0.0", title: "心流反饋與天道之音", desc: "修仙重在心境，每一次吐納都應有天地迴響。", changes: [ "實裝【動態神識提示】：專注結束彈出非阻擋式橫幅，包含10種隨機修仙語錄。", "優化【機緣可視化】：掉落物直接於畫面中央展示，不再隱藏於日誌。" ] },
  { version: "v3.5.0", title: "萬妖朝宗與登仙大劫", desc: "34大守關 Boss 全數降臨。", changes: [ "新增【34大死劫】：為每一個小境界/大境界配置了完全獨立的原著宿敵。" ] }
];

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

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  if (num >= 1e16) return (num / 1e16).toFixed(2) + ' 京';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + ' 兆';
  if (num >= 1e8) return (num / 1e8).toFixed(2) + ' 億';
  if (num >= 1e4) return (num / 1e4).toFixed(2) + ' 萬';
  return Math.floor(num).toLocaleString();
};

const FOCUS_OPTIONS = [ { label: '15m', value: 15 * 60 }, { label: '25m', value: 25 * 60 }, { label: '45m', value: 45 * 60 }, { label: '60m', value: 60 * 60 } ];

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

const ARTIFACT_POOL = [
  { id: 'a01', rarity: 'COMMON', name: '鐵木盾', desc: '抵禦外魔 (防禦減傷 +2%)', val: { def: 0.02 } },
  { id: 'a02', rarity: 'COMMON', name: '青銅戈', desc: '凡兵銳氣 (基礎戰力 +4%)', val: { atk: 0.04 } },
  { id: 'a03', rarity: 'COMMON', name: '凝神蒲團', desc: '固本培元 (回血+2%，修為+2%)', val: { heal_bonus: 0.02, qi: 0.02 } },
  { id: 'a04', rarity: 'COMMON', name: '粗糙靈石袋', desc: '聚財之陣 (靈石掉落 +5%)', val: { stone: 0.05 } },
  { id: 'a10', rarity: 'UNCOMMON', name: '神風舟', desc: '御風而行 (閃避率 +5%)', val: { evade: 0.05 } },
  { id: 'a11', rarity: 'UNCOMMON', name: '子母刃', desc: '奇門暗器 (戰力+8%，爆擊率+8%)', val: { atk: 0.08, crit: 0.08 }, tags: ['sword'] },
  { id: 'a12', rarity: 'UNCOMMON', name: '無形針', desc: '無影無蹤 (連擊效率+10%，爆擊+10%)', val: { streak_eff: 0.10, crit: 0.10 } },
  { id: 'a13', rarity: 'UNCOMMON', name: '血玉髓', desc: '氣血滋養 (休息回血比例 +5%)', val: { heal_bonus: 0.05 } },
  { id: 'a20', rarity: 'RARE', name: '青蛟旗', desc: '妖魂鎮壓 (戰力加成 +15%)', val: { atk: 0.15 } },
  { id: 'a21', rarity: 'RARE', name: '玄鐵飛天盾', desc: '堅不可摧 (防禦減傷 +15%)', val: { def: 0.15 } },
  { id: 'a22', rarity: 'RARE', name: '碧玉葫蘆', desc: '納寶空間 (靈石掉落 +30%)', val: { stone: 0.30 } },
  { id: 'a23', rarity: 'RARE', name: '金光磚', desc: '重擊崩碎 (爆擊傷害 +25%)', val: { crit_dmg: 0.25 } },
  { id: 'a24', rarity: 'RARE', name: '高階替身符', desc: '替死擋災 (復活機率 +5%)', val: { revive: 0.05 } },
  { id: 'a30', rarity: 'EPIC', name: '虛天鼎 (仿)', desc: '鎮壓氣運 (減傷+15%，氣運保底+0.15/級)', val: { def: 0.15, luck_floor: 0.15 } },
  { id: 'a31', rarity: 'EPIC', name: '風雷翅', desc: '迅捷如雷 (連擊效率+30%，閃避+8%)', val: { streak_eff: 0.30, evade: 0.08 } },
  { id: 'a32', rarity: 'EPIC', name: '紫羅極火', desc: '極寒之焰 (戰力+20%，爆傷+40%/級)', val: { atk: 0.20, crit_dmg: 0.40 } },
  { id: 'a33', rarity: 'EPIC', name: '嗜血幡', desc: '吸血魔器 (戰力+15%，回血+10%/級)', val: { atk: 0.15, heal_bonus: 0.10 } },
  { id: 'a40', rarity: 'LEGENDARY', name: '八靈尺', desc: '空間封鎖 (連擊上限+30%，閃避+10%/級)', val: { streak_cap: 0.30, evade: 0.10 } },
  { id: 'a41', rarity: 'LEGENDARY', name: '青竹蜂雲劍', desc: '本命劍陣 (戰力+50%，連擊效率+50%，爆擊+10%/級)', val: { atk: 0.50, streak_eff: 0.50, crit: 0.10 }, tags: ['sword'] },
  { id: 'a42', rarity: 'LEGENDARY', name: '大衍神君傀儡', desc: '替身擋災 (氣血+100%，連擊護盾+1/級)', val: { hp: 1.00, streak_shield: 1.0 } }, 
  { id: 'a43', rarity: 'LEGENDARY', name: '成熟體噬金蟲', desc: '無物不噬 (戰力+80%，爆傷+80%/級)', val: { atk: 0.80, crit_dmg: 0.80 } },
  { id: 'a50', rarity: 'MYTHIC', name: '玄天斬靈劍', desc: '法則破壞 (戰力+150%，爆傷+150%/級)', val: { atk: 1.50, crit_dmg: 1.50 }, tags: ['sword'] },
  { id: 'a51', rarity: 'MYTHIC', name: '元磁神山', desc: '五行重力場 (戰力與減傷 +80%/級)', val: { atk: 0.80, def: 0.80 } },
  { id: 'a52', rarity: 'MYTHIC', name: '虛天大鼎', desc: '鼎鎮山河 (減傷+80%，折扣-40%，氣運保底+0.5)', val: { def: 0.80, forge_discount: 0.40, luck_floor: 0.5 } },
  { id: 'a53', rarity: 'MYTHIC', name: '玄天如意刃', desc: '斬裂虛空 (連擊上限+80%，爆傷+80%/級)', val: { streak_cap: 0.80, crit_dmg: 0.80 }, tags: ['sword'] },
  { id: 'a60', rarity: 'DIVINE', name: '掌天瓶', desc: '奪天地造化 (靈氣+300%，靈石+150%/級)', val: { qi: 3.00, stone: 1.50 } },
  { id: 'a61', rarity: 'DIVINE', name: '游天鯤鵬翎', desc: '跨越界域 (閃避+15%，連擊效率+100%/級)', val: { evade: 0.15, streak_eff: 1.00 } },
  { id: 'a62', rarity: 'DIVINE', name: '涅槃真血', desc: '真靈不死 (免死+10%，連擊護盾+2/級)', val: { revive: 0.10, streak_shield: 2.0 } }, 
  { id: 'a63', rarity: 'DIVINE', name: '金闕玉書', desc: '降界天書 (靈石獲取+400%，氣運+0.5/級)', val: { stone: 4.00, luck_floor: 0.50 } },
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
  { id: 't_art_1', cat: 'artifact', req: 5, tier: 1, name: '身懷異寶', desc: '「財不露白，道友還是盡早將這些寶物收進儲物袋為妙。」', buffDesc: '氣運保底 +0.15', val: { luck_floor: 0.15 } },
  { id: 't_art_2', cat: 'artifact', req: 15, tier: 2, name: '一身是寶', desc: '「『不可能！你區區一介散修，身家怎會比老夫還要豐厚！』」', buffDesc: '連擊上限 +50%，氣運保底 +0.3', val: { streak_cap: 0.50, luck_floor: 0.30 } },
  { id: 't_art_3', cat: 'artifact', req: 25, tier: 3, name: '多寶天尊', desc: '「玄天之寶、造化至寶盡入你手，此界天道法則已被你徹底顛覆。」', buffDesc: '連擊上限 +150%，氣運保底 +0.8', val: { streak_cap: 1.50, luck_floor: 0.80 } },
  { id: 't_sec_1', cat: 'secret', req: 4, tier: 1, name: '博覽群書', desc: '「藏經閣內的玉簡被你翻了個遍，對各派功法皆有涉獵。」', buffDesc: '反噬基礎減傷 +10%', val: { sense_def: 0.10 } },
  { id: 't_sec_2', cat: 'secret', req: 9, tier: 2, name: '法體雙修', desc: '「功法龐雜卻互不衝突，靈力與肉身皆臻至化境，實力遠超同階修士。」', buffDesc: '氣血上限加成 +20%，神識減傷 +15%', val: { hp: 0.20, sense_def: 0.15 } },
  { id: 't_sec_3', cat: 'secret', req: 13, tier: 3, name: '萬法歸一', desc: '「天下萬般神仙妙法，在你眼中皆如掌上觀紋，直指大道本源。」', buffDesc: '氣血上限 +50%，反噬與神識減傷皆 +30%', val: { hp: 0.50, sense_def: 0.30, def: 0.30 } },
  { id: 't_max_1', cat: 'max', req: 1, tier: 1, name: '爐火純青', desc: '「將一門功法推演至極致，便足以在修仙界立足。」', buffDesc: '連擊效率倍率 +15%', val: { streak_eff: 0.15 } },
  { id: 't_max_2', cat: 'max', req: 4, tier: 2, name: '大衍傳人', desc: '「將數門頂級功法推演至極限，即便是大衍神君在世，也要讚你一聲奇才。」', buffDesc: '連擊效率倍率 +40%，總戰力 +20%', val: { streak_eff: 0.40, atk: 0.20 } },
  { id: 't_max_3', cat: 'max', req: 10, tier: 3, name: '開宗立派', desc: '「你對大道的理解已超越創造這些功法的前人，隨手一指便可為一界之尊。」', buffDesc: '連擊效率 +100%，戰力/氣血/靈石/靈氣全域 +30%', val: { streak_eff: 1.00, atk: 0.30, hp: 0.30, stone: 0.30, qi: 0.30 } }
];

const COMPANIONS = [
  { id: 'c_chen', name: '陳巧倩', unlockIdx: 4, desc: '「韓師弟，你真的不明白我的心意嗎？」落雲宗師姐，對你一往情深，至死未嫁。', buffType: 'atk', buffName: '痴情劍意', buffDesc: '總戰力加成', tiers: [5, 10, 20, 30] },
  { id: 'c_dong', name: '董萱兒', unlockIdx: 6, desc: '「師兄，你看看萱兒嘛。」紅拂仙子之女，天生媚骨，後轉修魔道。', buffType: 'evade', buffName: '幻媚之身', buffDesc: '閃避率提升', tiers: [2, 4, 8, 15] },
  { id: 'c_nangong', name: '南宮婉', unlockIdx: 9, desc: '「你這登徒子...」掩月宗長老，血色禁地結下不解之緣，唯一的正室妻子。', buffType: 'qi', buffName: '素女輪迴', buffDesc: '靈氣獲取倍率', tiers: [8, 15, 30, 50] },
  { id: 'c_yuan', name: '元瑤', unlockIdx: 12, desc: '「韓兄大恩，元瑤沒齒難忘。」為救師姐不惜修煉陰陽輪迴訣，重情重義。', buffType: 'hp', buffName: '陰陽秘術', buffDesc: '氣血上限加成', tiers: [5, 10, 20, 30] },
  { id: 'c_ziling', name: '紫靈仙子', unlockIdx: 14, desc: '「韓兄，亂星海一別，別來無恙？」妙音門門主，亂星海第一美女，紅顏知己。', buffType: 'luck_floor', buffName: '妙音氣運', buffDesc: '氣運保底加成', tiers: [0.05, 0.10, 0.20, 0.30] },
  { id: 'c_yinyue', name: '銀月', unlockIdx: 17, desc: '「主人，銀月會一直陪著你。」靈界銀狼一族，化為器靈長伴左右，共患難。', buffType: 'crit_dmg', buffName: '天狼神擊', buffDesc: '爆擊傷害提升', tiers: [10, 20, 40, 60] },
  { id: 'c_bingfeng', name: '冰鳳', unlockIdx: 21, desc: '「韓道友，你我聯手撕裂空間如何？」冰海之主，掌握空間法則的十級妖修。', buffType: 'streak_cap', buffName: '破空靈羽', buffDesc: '連擊增傷上限', tiers: [10, 20, 40, 60] },
  { id: 'c_baohua', name: '寶花始祖', unlockIdx: 25, desc: '「你區區一名人族大乘，竟敢直視本座？」魔界三大始祖之一，與你亦敵亦友。', buffType: 'def', buffName: '玄天聖樹', buffDesc: '護甲防禦加成', tiers: [5, 10, 20, 30] }
];

const COMPANION_TIERS = [ { req: 1, name: '初識' }, { req: 10, name: '相知' }, { req: 50, name: '傾心' }, { req: 100, name: '生死相隨' } ];
const getCompanionTier = (kills) => { if (kills >= 100) return 3; if (kills >= 50) return 2; if (kills >= 10) return 1; if (kills >= 1) return 0; return -1; };

const MONSTER_DATA = {
    mobs: {
        0: [ {n: '野狼幫眾', s:'大砍刀劈砍', b:'淬毒飛刀'}, {n: '猛虎野獸', s:'猛撲', b:'狂暴撕咬'}, {n: '地痞流氓', s:'悶棍重擊', b:'撒石灰致盲'} ],
        1: [ {n: '散修劫匪', s:'火彈術', b:'低階符籙'}, {n: '低階靈獸', s:'撕咬', b:'靈力衝擊'}, {n: '家族惡霸', s:'初級法器', b:'聯合陣法'} ],
        2: [ {n: '築基期魔修', s:'血魔功', b:'魔器自爆'}, {n: '二級妖獸', s:'毒液噴射', b:'妖丹衝擊'}, {n: '邪派探子', s:'暗器偷襲', b:'煞氣侵蝕'} ],
        3: [ {n: '結丹期散修', s:'丹火', b:'本命法寶'}, {n: '五級妖獸', s:'妖風', b:'本命妖術'}, {n: '海王族戰士', s:'水刺', b:'海王印'} ],
        4: [ {n: '元嬰期老怪', s:'瞬移偷襲', b:'嬰火'}, {n: '八級化形妖修', s:'化形之威', b:'天賦神通'}, {n: '慕蘭法士', s:'靈術', b:'高階靈術'} ],
        5: [ {n: '化神期修士', s:'天地元氣', b:'法則皮毛'}, {n: '十級大妖', s:'妖力風暴', b:'真靈血脈'}, {n: '高階魔族', s:'真魔之氣', b:'魔化變身'} ],
        6: [ {n: '煉虛期異族', s:'空間撕裂', b:'法相攻擊'}, {n: '地淵妖物', s:'地煞之氣', b:'地淵領域'}, {n: '靈界叛修', s:'高階法寶', b:'自爆元神'} ],
        7: [ {n: '合體期尊者', s:'法則之力', b:'本體法相'}, {n: '高階魔尊', s:'魔界法則', b:'魔尊降臨'}, {n: '真靈後裔', s:'血脈壓制', b:'真靈顯影'} ],
        8: [ {n: '大乘期老祖', s:'領域壓制', b:'法則本源'}, {n: '跨界真靈', s:'吞噬天地', b:'真靈領域'}, {n: '魔界聖祖化身', s:'聖祖威壓', b:'滅世魔光'} ],
        9: [ {n: '【雷劫】四九小天劫', s:'青色劫雷', b:'五行劫光'}, {n: '【風劫】九天罡風', s:'蝕骨陰風', b:'九幽黑風'}, {n: '【火劫】紅蓮業火', s:'業火灼燒', b:'焚天紅蓮'} ]
    },
    bosses: [
      { n: '【七玄門】墨大夫', s: '銀針偷襲', b: '魔銀手' }, { n: '【野狼幫主】賈天龍', s: '鐵衛護陣', b: '天羅地網' }, { n: '【黃楓谷】陸師兄', s: '青風劍訣', b: '狂風絕息' }, { n: '【天涯閣】狂人封岳', s: '黃羅傘護體', b: '踏雲靴突襲' }, { n: '【血色禁地】墨蛟', s: '巨尾掃擊', b: '黑色毒火' }, { n: '【鬼靈門少主】王蟬', s: '鬼靈步', b: '血靈大法' }, { n: '【燕家堡】燕家老祖', s: '燕家機關', b: '天羅陣' }, { n: '【黑煞教】血侍', s: '妖化之軀', b: '血咒術' }, { n: '【黑煞教主】越皇化身', s: '血靈光波', b: '黑蛟血爪' }, { n: '【極陰徒弟】烏丑', s: '玄陰魔氣', b: '極陰真火' }, { n: '【妙音門叛徒】趙長老', s: '迷音陣', b: '妙音殺網' }, { n: '【八級妖修】毒蛟', s: '蛟龍水箭', b: '碧綠毒丹' }, { n: '【六道傳人】溫天仁', s: '魔雷術', b: '八門金光鏡' }, { n: '【慕蘭神師】仲大仙師', s: '五行靈術', b: '木生大術' }, { n: '【陰羅宗主】房宗主', s: '鬼羅幡動', b: '陰羅幽火' }, { n: '【大晉皇族】葉家大長老', s: '皇家秘術', b: '天威降臨' }, { n: '【星海霸主】六道極聖', s: '魔道秘術', b: '六極真魔功' }, { n: '【冰海之主】冰鳳', s: '極寒冰刺', b: '絕對冰封' }, { n: '【突兀族】天瀾聖獸分身', s: '聖獸之威', b: '天瀾狂煞' }, { n: '【九幽宗】九幽老魔', s: '幽冥鬼氣', b: '九幽鎖魂' }, { n: '【昆吾魔化】元剎聖祖化身', s: '黑魔匕首', b: '元剎魔域' }, { n: '【飛靈聖子】赤魔', s: '赤魔炎', b: '飛靈聖火' }, { n: '【地淵妖物】木靈妖王', s: '木靈刺', b: '森羅萬象' }, { n: '【夜叉族】王級尊者', s: '夜叉冥水', b: '夜叉真身' }, { n: '【地淵霸主】地血老鬼', s: '血道秘術', b: '紫血傀儡爆' }, { n: '【角蚩族】長尊', s: '角蚩秘術', b: '圖騰真身' }, { n: '【魔族】血光聖祖化身', s: '血光印', b: '血魔大陣' }, { n: '【廣寒界】真靈遺骨', s: '真靈威壓', b: '毀滅之光' }, { n: '【魔界始祖】六極聖祖', s: '六極幻影', b: '六道天魔境' }, { n: '【蜉蝣族】大乘太上', s: '控蟲秘術', b: '蜉蝣撼樹' }, { n: '【兇司】兇司王', s: '兇絕斬', b: '兇界降臨' }, { n: '【蟲母】螟蟲之母分身', s: '螟蟲海', b: '天道毀滅' }, { n: '【下界真仙】謫仙馬良', s: '仙家法術', b: '萬靈血璽' }, { n: '【飛升大劫】九九重雷劫', s: '五行神雷', b: '紫霄神雷劫' }
];

export default function App() {
  const defaultPlayerState = { 
    realmIndex: 0, qi: 0, qiToNext: 250, vitality: 100, baseMaxVitality: 100, coins: 0, baseCombat: 150, 
    artifacts: [], artifactLvls: {}, basicSkills: {}, secretBooks: {}, arrays: { qi: 0, def: 0 }, 
    streakCount: 0, streakShields: 0, luck: 1.0, totalFocusTime: 0, history: [], hasAscended: false,
    lifetimeStats: { kills: 0, focusCount: 0, totalCoins: 0 },
    unlockedTitles: [], equippedTitle: null, freeGacha: 0, epiphanyPills: 0, lastPillTime: 0,
    activeCompanion: null, companionKills: {},
    logs: ['【天道印記】仙途漫漫，唯『靜心專注』方能證道。摒棄雜念，祝道友仙運隆昌。'] 
  };

  const [player, setPlayer] = useState(() => {
    try {
      const saved = localStorage.getItem('xianxia_master_v69');
      if (saved) return { ...defaultPlayerState, ...JSON.parse(saved) };
      return defaultPlayerState;
    } catch (e) { return defaultPlayerState; }
  });

  const bellAudioRef = useRef(null);
  const breakAudioRef = useRef(null);

  useEffect(() => {
    bellAudioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/meditation_bell.ogg');
    breakAudioRef.current = new Audio('https://actions.google.com/sounds/v1/water/droplet_reverb.ogg');
  }, []);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('xianxia_master_v69', JSON.stringify(player));
    setSaveIndicator(true);
    const timer = setTimeout(() => setSaveIndicator(false), 2000);
    return () => clearTimeout(timer);
  }, [player]);

  const availableSP = useMemo(() => {
    let totalEarned = 0;
    for (let i = 1; i <= player.realmIndex; i++) { totalEarned += REALMS[i]?.isMajor ? 5 : 3; }
    const basicSpent = Object.values(player.basicSkills || {}).reduce((a, b) => a + b, 0);
    const secretSpent = Object.values(player.secretBooks || {}).reduce((a, b) => a + b, 0);
    return Math.max(0, totalEarned - (basicSpent + secretSpent));
  }, [player.realmIndex, player.basicSkills, player.secretBooks]);

  const [saveIndicator, setSaveIndicator] = useState(false);
  const [globalStats, setGlobalStats] = useState({ focus: 0, ascensions: 0 });

  useEffect(() => {
    const statsRef = ref(database, 'globalStats');
    const unsubscribe = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) setGlobalStats({ focus: data.totalFocusCount || 0, ascensions: data.totalAscensions || 0 });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let newlyUnlocked = [];
    let newFreeGacha = player.freeGacha || 0;
    TITLE_DATA.forEach(t => {
       if (!(player.unlockedTitles || []).includes(t.id)) {
          let conditionMet = false;
          if (t.cat === 'kill' && (player.lifetimeStats?.kills || 0) >= t.req) conditionMet = true;
          if (t.cat === 'focus' && (player.lifetimeStats?.focusCount || 0) >= t.req) conditionMet = true;
          if (t.cat === 'coin' && (player.lifetimeStats?.totalCoins || 0) >= t.req) conditionMet = true;
          if (t.cat === 'artifact' && (player.artifacts?.length || 0) >= t.req) conditionMet = true;
          if (t.cat === 'secret' && Object.keys(player.secretBooks || {}).filter(k => player.secretBooks[k] > 0).length >= t.req) conditionMet = true;
          if (t.cat === 'max') {
             let maxCount = 0;
             BASIC_SKILLS.forEach(s => { if ((player.basicSkills?.[s.id] || 0) >= s.maxLvl) maxCount++; });
             SECRET_BOOKS.forEach(s => { if ((player.secretBooks?.[s.id] || 0) >= 5) maxCount++; });
             if (maxCount >= t.req) conditionMet = true;
          }
          if (conditionMet) { newlyUnlocked.push(t.id); newFreeGacha += 1; }
       }
    });
    if (newlyUnlocked.length > 0) {
       setPlayer(p => {
          const updatedUnlocked = [...(p.unlockedTitles || []), ...newlyUnlocked];
          const updatedLogs = [...p.logs];
          newlyUnlocked.forEach(id => {
             const titleName = TITLE_DATA.find(x => x.id === id).name;
             updatedLogs.unshift(`🏆 【天道恩賜】解鎖稱號「${titleName}」！獲贈免費尋寶 1 次！`);
          });
          return { ...p, unlockedTitles: updatedUnlocked, freeGacha: newFreeGacha, logs: updatedLogs.slice(0, 50) };
       });
    }
  }, [player.lifetimeStats, player.artifacts, player.basicSkills, player.secretBooks]);

  const generateMonsterState = (realmIdx, currentQi, qiToNext, hasAscended) => {
    if (hasAscended) {
        return { name: "【仙界巡禮・指點後輩】", hp: 999999, maxHp: 999999, tier: 99, atk: 0, sAtkName: "和風細雨", bAtkName: "仙氣灌頂", isBoss: false };
    }
    const isReadyToBreakthrough = currentQi >= qiToNext;
    const isMortal = realmIdx === 0;
    const isFinal = realmIdx === REALMS.length - 1;
    const isMajorBreakthrough = isMortal || isFinal || (realmIdx % 4 === 0 && realmIdx > 0);
    const majorRealmIdx = isMortal ? 0 : (isFinal ? 9 : Math.floor((realmIdx - 1) / 4) + 1);

    let mData;
    let isBoss = false;
    let bossMult = 1;
    let atkMult = 1;

    if (isReadyToBreakthrough) {
        isBoss = true;
        mData = BOSS_DATA[realmIdx];
        bossMult = isFinal ? 30 : (isMajorBreakthrough ? 6 : 2); 
        atkMult = isFinal ? 10.0 : (isMajorBreakthrough ? 2.5 : 1.5);
    } else {
        const mobList = MONSTER_DATA.mobs[majorRealmIdx];
        mData = mobList[Math.floor(Math.random() * mobList.length)];
    }
    const nHp = Math.floor(120 * Math.pow(1.25, realmIdx) * bossMult);
    const mAtk = Math.floor(30 * Math.pow(1.2, realmIdx) * atkMult);
    return { name: mData.n + (isBoss && !isMortal && !isFinal ? (isMajorBreakthrough ? ' [大瓶頸]' : ' [心魔死劫]') : ''), hp: nHp, maxHp: nHp, tier: realmIdx + 1, atk: mAtk, sAtkName: mData.s, bAtkName: mData.b, isBoss };
  };

  const [monster, setMonster] = useState(() => {
    try {
      const savedMonster = localStorage.getItem('xianxia_monster');
      if (savedMonster) return JSON.parse(savedMonster);
    } catch (e) {}
    return generateMonsterState(player.realmIndex, player.qi, player.qiToNext, player.hasAscended);
  });

  useEffect(() => { localStorage.setItem('xianxia_monster', JSON.stringify(monster)); }, [monster]);

  const [focusDuration, setFocusDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [targetEndTime, setTargetEndTime] = useState(null); 
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('focus'); 
  const [activeTab, setActiveTab] = useState('skills');
  const [showRealmGuide, setShowRealmGuide] = useState(false);
  const [showStatsReport, setShowStatsReport] = useState(false);
  const [showGuide, setShowGuide] = useState(false); 
  const [showTitles, setShowTitles] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false); 
  const [importString, setImportString] = useState(''); 
  const [guideTab, setGuideTab] = useState('rules'); 
  const [celebration, setCelebration] = useState(null); 
  const [toast, setToast] = useState(null); 
  const [showGiveUpWarning, setShowGiveUpWarning] = useState(false);

  const [isAttacking, setIsAttacking] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [isCritStrike, setIsCritStrike] = useState(false); 
  const [isKilling, setIsKilling] = useState(false); 
  const [isHealing, setIsHealing] = useState(false); 

  const getMultiplier = (type) => {
    let mult = 1.0;
    BASIC_SKILLS.forEach(s => { if (player.basicSkills?.[s.id] > 0 && s.val?.[type]) mult += s.val[type] * player.basicSkills[s.id]; });
    Object.entries(player.secretBooks || {}).forEach(([id, lvl]) => { const book = SECRET_BOOKS.find(x => x.id === id); if (book?.val?.[type]) mult += book.val[type] * lvl; });
    (player.artifacts || []).forEach(id => { const item = ARTIFACT_POOL.find(a => a.id === id); const lvl = player.artifactLvls?.[id] || 0; if (item?.val?.[type]) mult += item.val[type] * (1 + lvl * 0.5); });
    if (player.equippedTitle) { const t = TITLE_DATA.find(x => x.id === player.equippedTitle); if (t?.val?.[type]) mult += t.val[type]; }
    if ((type === 'atk' || type === 'streak_cap') && (player.artifacts || []).filter(id => ARTIFACT_POOL.find(a => a.id === id)?.tags?.includes('sword')).length >= 2) mult += 0.4;
    if (type === 'qi' && player.arrays?.qi) mult += player.arrays.qi * 0.05;
    if (type === 'def' && player.arrays?.def) mult += player.arrays.def * 0.05;
    if (player.activeCompanion) {
        const comp = COMPANIONS.find(c => c.id === player.activeCompanion);
        if (comp && comp.buffType === type) {
            const kills = player.companionKills?.[comp.id] || 0;
            const tIdx = getCompanionTier(kills);
            if (tIdx >= 0) mult += (comp.buffType === 'luck_floor' ? comp.tiers[tIdx] : comp.tiers[tIdx] / 100);
        }
    }
    return mult;
  };

  const currentRealmData = REALMS[player.realmIndex];
  const activeColorClass = REALM_COLORS[currentRealmData.color] || REALM_COLORS.slate;
  const rawEvade = getMultiplier('evade') - 1, evadeRate = Math.min(0.75, rawEvade), overflowEvade = Math.max(0, rawEvade - 0.75);
  const rawCrit = getMultiplier('crit') - 1, critRate = Math.min(0.95, rawCrit), overflowCrit = Math.max(0, rawCrit - 0.95);
  const streakCap = Math.min(8.0, 0.5 + (getMultiplier('streak_cap') - 1) + (overflowEvade * 0.5)); 
  const streakEff = getMultiplier('streak_eff'), comboMultiplier = 1 + Math.min(streakCap, (player.streakCount || 0) * 0.05 * streakEff);
  const critDmg = Math.min(20.0, 1.5 + (getMultiplier('crit_dmg') - 1) + (overflowCrit * 3.0));
  const reviveRate = Math.min(0.65, getMultiplier('revive') - 1), healPct = Math.min(0.80, 0.35 + (getMultiplier('heal_bonus') - 1));
  const defMultiplier = getMultiplier('def'), dmgTakenPct = (1 / defMultiplier) * 100; 
  const currentCombatPower = Math.floor(player.baseCombat * getMultiplier('atk') * comboMultiplier);
  const maxVitality = Math.floor(player.baseMaxVitality * getMultiplier('hp'));
  const forgeDiscount = Math.max(0.1, 1 - (getMultiplier('forge_discount') - 1)); 

  const upgCostAtk = Math.floor(1000 * Math.pow(1.15, (player.baseCombat - 150)/100) * forgeDiscount);
  const upgCostHp = Math.floor(1000 * Math.pow(1.15, (player.baseMaxVitality - 100)/100) * forgeDiscount);
  const healCost = Math.floor((maxVitality + player.realmIndex * 100) * forgeDiscount);
  const arrayQiCost = Math.floor(5000 * Math.pow(1.35, (player.arrays?.qi || 0)) * forgeDiscount);
  const arrayDefCost = Math.floor(4000 * Math.pow(1.35, (player.arrays?.def || 0)) * forgeDiscount);
  const gachaCost = Math.floor(5000 * Math.pow(1.15, player.realmIndex) * forgeDiscount);

  const pillCooldownRemaining = player.lastPillTime ? Math.max(0, 3600 - Math.floor((now - player.lastPillTime) / 1000)) : 0;
  const canUsePill = (player.epiphanyPills || 0) > 0 && pillCooldownRemaining === 0;

  const handleExport = () => {
    const { logs, ...saveData } = player;
    const saveStr = btoa(encodeURIComponent(JSON.stringify(saveData)));
    navigator.clipboard.writeText(saveStr).then(() => alert("【玉簡秘文】已複製至剪貼簿！")).catch(() => alert("複製失敗，請手動選取。"));
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(decodeURIComponent(atob(importString.trim())));
      if (parsed && parsed.realmIndex !== undefined) {
        if (window.confirm("【奪舍警告】匯入將完全覆蓋進度，確認？")) {
          setPlayer({ ...defaultPlayerState, ...parsed, logs: ['【天道】跨界奪舍成功，神識與記憶已融合。'] });
          setMonster(generateMonsterState(parsed.realmIndex, parsed.qi || 0, parsed.qiToNext || 250, parsed.hasAscended));
          setImportString(''); setShowSaveModal(false); alert("奪舍成功！");
        }
      } else alert("秘文殘缺！");
    } catch (e) { alert("玉簡毀損！"); }
  };

  const addLog = (text) => {
    const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    setPlayer(p => ({ ...p, logs: [`[${timeStr}] ${text}`, ...(p.logs || [])].slice(0, 50) }));
  };

  const handleComplete = (usedPill = false) => {
    const isUsingPill = usedPill === true; setIsActive(false); setTargetEndTime(null);
    if (mode === 'focus') {
      if (bellAudioRef.current) bellAudioRef.current.play().catch(e => {});
      setIsAttacking(true); setTimeout(() => setIsAttacking(false), 500);
      try { update(ref(database, 'globalStats'), { totalFocusCount: increment(1) }); } catch (e) {}
      
      let nextPills = player.epiphanyPills || 0, nextLastPillTime = isUsingPill ? Date.now() : 0;
      let nextLifetime = { ...player.lifetimeStats };
      let nextTotalFocusTime = player.totalFocusTime + (isUsingPill ? 0 : focusDuration);
      if (!isUsingPill) { nextLifetime.focusCount += 1; }

      const isCrit = Math.random() < critRate, damageBase = Math.floor(currentCombatPower * (focusDuration / 1500));
      const actualDamage = isCrit ? Math.floor(damageBase * critDmg) : damageBase;
      if (isCrit) { setIsCritStrike(true); setTimeout(() => setIsCritStrike(false), 600); }

      const newHp = Math.max(0, monster.hp - actualDamage), timeRatio = focusDuration / 1500, curLuck = getMultiplier('luck_floor');
      const passiveQi = Math.floor(50 * Math.pow(1.18, player.realmIndex + 1) * getMultiplier('qi') * timeRatio);
      const passiveCoin = Math.floor(50 * Math.pow(1.15, player.realmIndex + 1) * getMultiplier('stone') * curLuck * timeRatio);

      let nextQi = player.qi + passiveQi, nextCoins = player.coins + passiveCoin, nextVitality = player.vitality;
      let nextRealm = player.realmIndex, nextQiToNext = player.qiToNext, nextHasAscended = player.hasAscended;
      let newArtifacts = [...(player.artifacts || [])], newSecretBooks = { ...(player.secretBooks || {}) };
      let nextStreak = player.streakCount + 1, nextShields = maxStreakShields, isDeadFromCounter = false, isKilled = false, killedBoss = false, currentDrops = [];

      if (!isUsingPill) nextLifetime.totalCoins += passiveCoin;
      if (isCrit && Math.random() < 0.30) {
        const ls = Math.floor(maxVitality * (getMultiplier('lifesteal') - 1));
        if (ls > 0) { nextVitality = Math.min(maxVitality, nextVitality + ls); addLog(`💉 【真靈吸吮】恢復了 ${ls} 氣血！`); }
      }

      let killLog = '', compLog = '';
      if (newHp === 0) {
        isKilled = true; killedBoss = monster.isBoss; setIsKilling(true); setTimeout(() => setIsKilling(false), 800); 
        const kQi = Math.floor(300 * Math.pow(1.18, monster.tier) * getMultiplier('qi')), kCoin = Math.floor(800 * Math.pow(1.15, monster.tier) * getMultiplier('stone') * curLuck);
        nextQi += kQi; nextCoins += kCoin;
        if (!isUsingPill) { nextLifetime.kills += 1; nextLifetime.totalCoins += kCoin; }
        if (player.activeCompanion) {
            const cId = player.activeCompanion, oKills = player.companionKills?.[cId] || 0;
            setPlayer(p => ({ ...p, companionKills: { ...p.companionKills, [cId]: oKills + 1 } }));
            if ([1, 10, 50, 100].includes(oKills+1)) compLog = ` 🌸 與【${COMPANIONS.find(c=>c.id===cId).name}】羈絆達到「${COMPANION_TIERS[getCompanionTier(oKills+1)].name}」！`;
        }
        if (Math.random() < 0.10) { nextPills += 1; currentDrops.push('💊 頓悟丹'); }
        if (Math.random() < (0.20 * curLuck)) {
            let targetRarity = 'COMMON', accum = 0;
            const roll = Math.random(), sortedRarities = Object.entries(RARITY).sort((a,b) => a[1].weight - b[1].weight);
            for (let [r, data] of sortedRarities) { accum += data.weight; if (roll < accum) { targetRarity = r; break; } }
            let combinedPool = getUnownedPool(targetRarity, newArtifacts, newSecretBooks);
            if (combinedPool.length > 0) {
                const drop = combinedPool[Math.floor(Math.random() * combinedPool.length)];
                if (drop.poolType === 'art') { newArtifacts.push(drop.id); currentDrops.push(`🏺 ${RARITY[targetRarity].name}法寶「${drop.name}」`); }
                else { newSecretBooks[drop.id] = 1; currentDrops.push(`📜 ${RARITY[targetRarity].name}功法「${drop.name}」`); }
            }
        }
        if (monster.isBoss) {
            if (monster.name.includes('九九重雷劫') && !player.hasAscended) {
                try { update(ref(database, 'globalStats'), { totalAscensions: increment(1) }); } catch(e) {}
                nextHasAscended = true; setCelebration({ name: '飛升仙界！成就無上真仙！', desc: FEEDBACK_TEXTS.boss[0] });
            } else if (nextRealm < REALMS.length - 1) {
                nextRealm++; nextQi = Math.max(0, nextQi - nextQiToNext); nextQiToNext = Math.floor(nextQiToNext * 1.35);
                if (!isUsingPill) nextHistory.push({ name: REALMS[nextRealm].name, time: nextTotalFocusTime });
                setCelebration({ name: REALMS[nextRealm].name, desc: FEEDBACK_TEXTS.boss[Math.floor(Math.random() * FEEDBACK_TEXTS.boss.length)] });
            }
        }
        setMonster(generateMonsterState(nextRealm, nextQi, nextQiToNext, nextHasAscended));
      } else {
        setMonster(prev => ({ ...prev, hp: newHp }));
        if (monster.isBoss && nextHasAscended) { killLog = `平和指點後輩，不染塵埃。`; } // 飛升後和平模式
        else {
            const isBigAtk = Math.random() < 0.20, atkName = isBigAtk ? monster.bAtkName : monster.sAtkName;
            if (Math.random() < evadeRate) killLog = `💨 閃避了【${atkName}】！`;
            else {
                setIsCollapsing(true); setTimeout(() => setIsCollapsing(false), 1000);
                const rawDmg = Math.floor(monster.atk * (isBigAtk ? 2.5 : 1.0) * (1 + (Math.random() - 0.5)*0.4));
                const actualDmg = Math.max(1, Math.floor(rawDmg * (dmgTakenPct / 100)));
                nextVitality -= actualDmg;
                if (nextVitality <= 0) {
                    if (nextShields > 0) { nextShields -= 1; nextVitality = Math.floor(maxVitality * 0.1) || 1; killLog = `🛡️ 【法寶護主】鎖血 10%！`; }
                    else if (Math.random() < reviveRate) { nextVitality = maxVitality; killLog = `✨ 【涅槃重生】轉危為安！`; }
                    else { nextVitality = Math.floor(maxVitality * 0.5); nextQi = Math.floor(nextQi * 0.8); nextStreak = 0; isDeadFromCounter = true; killLog = `💀 身死道消，損失 20% 修為！`; }
                } else killLog = `💥 承受了 ${formatNumber(actualDmg)} 點反撲傷害。`;
            }
        }
      }
      if (isDeadFromCounter && monster.isBoss && nextQi < nextQiToNext && !nextHasAscended) setMonster(generateMonsterState(nextRealm, nextQi, nextQiToNext, nextHasAscended));
      
      // Toast 邏輯：打怪結束 (非擊殺Boss)
      if (!killedBoss) { 
          const t = isKilled ? 'kill' : 'focus'; 
          setToast({ type: t, text: FEEDBACK_TEXTS[t][Math.floor(Math.random() * FEEDBACK_TEXTS[t].length)], drops: currentDrops }); 
          setTimeout(() => setToast(null), 5000); 
      }
      
      setPlayer(p => ({ ...p, realmIndex: nextRealm, qi: nextQi, qiToNext: nextQiToNext, coins: nextCoins, vitality: nextVitality, streakCount: nextStreak, streakShields: nextShields, totalFocusTime: nextTotalFocusTime, artifacts: newArtifacts, secretBooks: newSecretBooks, epiphanyPills: nextPills, lastPillTime: nextLastPillTime, hasAscended: nextHasAscended, history: nextHistory, lifetimeStats: nextLifetime }));
      setMode('break'); setTimeLeft(5 * 60);
    } else { 
      if (breakAudioRef.current) breakAudioRef.current.play().catch(e => {});
      setMode('focus'); setTimeLeft(focusDuration); 
      setPlayer(p => ({ ...p, vitality: Math.min(maxVitality, p.vitality + Math.floor(maxVitality * healPct)), streakShields: maxStreakShields }));
      // Toast 邏輯：休息結束
      setToast({ type: 'break', text: FEEDBACK_TEXTS['break'][Math.floor(Math.random() * FEEDBACK_TEXTS['break'].length)] });
      setTimeout(() => setToast(null), 5000);
    }
  };

  const preCheckGiveUp = () => { if (monster.isBoss && !player.hasAscended) setShowGiveUpWarning(true); else executeGiveUp(); };
  const executeGiveUp = () => {
    setShowGiveUpWarning(false); setIsActive(false); setTargetEndTime(null);
    if (Math.random() < evadeRate) addLog(`💨 成功閃避反噬！`);
    else {
      setIsCollapsing(true); setTimeout(() => setIsCollapsing(false), 1000);
      const pen = Math.min(Math.floor(maxVitality * 0.20 * (1/defMultiplier)), player.vitality * 0.8);
      let nHp = player.vitality - pen, nS = player.streakCount, nQi = player.qi;
      if (nHp <= 0) {
        if (player.streakShields > 0) { nHp = Math.floor(maxVitality * 0.1); setPlayer(p => ({...p, streakShields: p.streakShields - 1})); }
        else { nHp = Math.floor(maxVitality * 0.5); nQi = Math.floor(player.qi * 0.8); nS = 0; }
      } else { if (nS > 0) { if (player.streakShields > 0) setPlayer(p => ({...p, streakShields: p.streakShields - 1})); else nS = 0; } }
      setPlayer(p => ({ ...p, vitality: nHp, streakCount: nS, qi: nQi }));
      if (nQi < player.qiToNext && monster.isBoss) setMonster(generateMonsterState(player.realmIndex, nQi, player.qiToNext, player.hasAscended));
    }
    setTimeLeft(focusDuration);
  };

  const handleSkipBreak = () => { setIsActive(false); setTargetEndTime(null); setMode('focus'); setTimeLeft(focusDuration); addLog(`【調息結束】道友提前結束吐納。`); };
  const toggleTimer = () => { if (!isActive) { const et = Date.now() + (timeLeft * 1000); setIsActive(true); setTargetEndTime(et); } };
  
  useEffect(() => {
    const sync = () => { if (isActive && targetEndTime && !showGiveUpWarning) { const rem = Math.max(0, Math.floor((targetEndTime - Date.now()) / 1000)); setTimeLeft(rem); if (rem === 0) handleComplete(false); } };
    if (isActive && !showGiveUpWarning) { const i = setInterval(sync, 1000); document.addEventListener('visibilitychange', sync); return () => { clearInterval(i); document.removeEventListener('visibilitychange', sync); }; }
  }, [isActive, targetEndTime, showGiveUpWarning]);

  const InsightsChart = () => {
    const data = player.history || [];
    if (data.length < 2) return <div className="h-full flex items-center justify-center text-white/10 uppercase tracking-widest font-bold text-xs">識海未成，尚無投影</div>;
    const maxT = Math.max(1, ...data.map(d => d.time || 0));
    const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d.time || 0) / maxT) * 100}`).join(' ');
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <polyline fill="none" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1.5" points={points} />
        {data.map((d, i) => ( <circle key={i} cx={(i / (data.length - 1)) * 100} cy={100 - ((d.time || 0) / maxT) * 100} r="1.5" fill="#fff" className="animate-pulse" /> ))}
      </svg>
    );
  };

  return (
    <div className={`min-h-screen text-slate-300 font-mono p-4 flex flex-col items-center overflow-x-hidden relative transition-colors duration-300 pt-10
      ${isCollapsing ? 'bg-red-950/80 animate-shake' : isKilling ? 'bg-emerald-950/60' : isCritStrike ? 'bg-rose-900/40' : 'bg-[#020617]'}`}
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[700] flex flex-col items-center p-4 sm:p-6 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border backdrop-blur-xl animate-fade-in-down transition-all max-w-[90%] w-full cursor-pointer
            ${toast.type === 'kill' ? 'bg-amber-950/80 border-amber-500/50 text-amber-200' :
              toast.type === 'focus' ? 'bg-rose-950/80 border-rose-500/50 text-rose-200' :
              'bg-cyan-950/80 border-cyan-500/50 text-cyan-200'}`} onClick={() => setToast(null)}>
            <div className="flex items-center gap-3 font-black tracking-widest text-sm sm:text-base mb-2 text-center">
                {toast.type === 'kill' ? <Sword size={20} className="text-amber-400 animate-bounce"/> :
                 toast.type === 'focus' ? <Flame size={20} className="text-rose-400 animate-pulse"/> :
                 <Wind size={20} className="text-cyan-400 animate-pulse"/>}
                {toast.text}
            </div>
            {toast.drops?.length > 0 && (
                <div className="flex flex-col items-center mt-3 pt-3 border-t border-white/20 w-full gap-2">
                    <span className="text-[10px] text-white/50 tracking-[0.3em]">天降機緣</span>
                    {toast.drops.map((d, i) => ( <div key={i} className="text-sm font-black text-yellow-400 animate-pulse">{d}</div> ))}
                </div>
            )}
        </div>
      )}

      <div className="fixed top-0 left-0 w-full bg-emerald-950/90 text-[10px] sm:text-xs py-2 text-center font-black tracking-widest z-[600] border-b border-emerald-500/30 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
        <div className="flex items-center gap-1.5 text-emerald-400"> <Network size={14}/> <span>世界運轉:</span> <span className="text-white font-mono text-sm">{formatNumber(globalStats.focus)}</span> </div>
        <div className="flex items-center gap-1.5 text-yellow-400"> <Crown size={14}/> <span>飛升仙人:</span> <span className="text-white font-mono text-sm">{formatNumber(globalStats.ascensions)}</span> </div>
      </div>

      <div className="absolute inset-0 bg-[#020617]/85 backdrop-blur-[1px] z-0"></div>
      <style>{` .glow-streak { box-shadow: 0 0 30px rgba(255,255,255,0.1); } .animate-shake { animation: shake 0.4s both; } .animate-fade-in-down { animation: fadeInDown 0.5s ease-out forwards; } @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } } @keyframes fadeInDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } } .custom-scrollbar::-webkit-scrollbar { width: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }`}</style>

      {showGiveUpWarning && (
        <div className="fixed inset-0 z-[800] bg-black/95 backdrop-blur-2xl p-6 flex flex-col items-center justify-center font-bold">
          <div className="w-full max-w-lg bg-rose-950/80 p-8 rounded-2xl border border-rose-500/50 shadow-[0_0_80px_rgba(244,63,94,0.3)] flex flex-col items-center text-center">
            <ShieldAlert size={64} className="text-rose-500 mb-6 animate-pulse"/>
            <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-4">天道警示</h2>
            <p className="text-rose-200 text-sm md:text-base leading-relaxed mb-8">當前正面臨突破死劫！強行收功將遭受極重反噬。確認放棄？</p>
            <div className="flex gap-4 w-full">
              <button onClick={() => setShowGiveUpWarning(false)} className="flex-1 py-4 bg-white/10 text-white rounded-xl text-sm font-black border border-white/20">繼續運功</button>
              <button onClick={executeGiveUp} className="flex-1 py-4 bg-rose-600 text-white rounded-xl text-sm font-black shadow-lg">強行收功</button>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-2xl p-6 flex flex-col items-center justify-center font-bold mt-8">
          <div className="w-full max-w-xl bg-slate-900/90 p-6 md:p-10 rounded-2xl border border-cyan-500/30 flex flex-col relative">
            <button onClick={() => setShowSaveModal(false)} className="absolute top-4 right-4 p-2 text-white/50"><X size={20}/></button>
            <h2 className="text-xl font-black text-cyan-400 tracking-widest mb-2 flex items-center gap-3"><ScrollText/> 玉簡傳功</h2>
            <div className="space-y-6">
                <div className="bg-black/50 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-3"> <label className="text-emerald-400 text-sm font-black">凝聚秘文</label> <button onClick={handleExport} className="bg-emerald-900/60 text-white px-4 py-2 rounded-lg text-xs border border-emerald-500/50"><Copy size={12}/> 複製</button> </div>
                    <textarea readOnly value={btoa(encodeURIComponent(JSON.stringify(player)))} className="w-full h-24 bg-black/80 text-white/40 text-[10px] p-3 rounded-lg border border-white/5 resize-none no-scrollbar" />
                </div>
                <div className="bg-black/50 p-4 rounded-xl">
                    <label className="text-rose-400 text-sm font-black mb-3 block">注入神識</label>
                    <textarea placeholder="貼上玉簡秘文..." value={importString} onChange={(e) => setImportString(e.target.value)} className="w-full h-24 bg-black/80 text-white/90 text-xs p-3 rounded-lg border border-rose-500/30 mb-4 no-scrollbar" />
                    <button onClick={handleImport} disabled={!importString.trim()} className="w-full py-4 bg-rose-900/60 text-white font-black rounded-lg border border-rose-500/50">確認奪舍</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {showChangelog && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-xl p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center font-bold mt-8">
          <div className="w-full max-w-2xl bg-[#0a0a0a] p-4 sm:p-6 md:p-8 rounded-2xl border border-white/20 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
               <h2 className="text-xl font-black text-white tracking-widest flex items-center gap-3"><FileText className="text-emerald-500"/> 天道紀元</h2>
               <button onClick={() => setShowChangelog(false)} className="p-4 text-white/50"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
               {CHANGELOG_DATA.map((log, idx) => (
                   <div key={idx} className={`relative pl-6 py-2 ${idx!==0?'opacity-70':''}`}>
                      <div className={`absolute left-0 top-3 bottom-0 w-px ${idx===0?'bg-emerald-500':'bg-white/10'}`}></div>
                      <div className={`absolute left-[-4px] top-3 w-2 h-2 rounded-full ${idx===0?'bg-emerald-400':'bg-white/30'}`}></div>
                      <div className={`flex items-center gap-4 mb-2`}> <span className="text-sm font-mono font-black text-emerald-400">{log.version}</span> <h3 className="text-base font-black tracking-widest text-white">{log.title}</h3> </div>
                      <ul className="space-y-2"> {log.changes.map((c, ci) => ( <li key={ci} className="text-xs text-white/70 flex items-start gap-2"> <span>▹</span> {c} </li> ))} </ul>
                   </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {celebration && (
        <div className="fixed inset-0 z-[800] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-12 cursor-pointer text-center animate-pop-in" onClick={() => setCelebration(null)}>
          <Crown size={80} className="text-yellow-500/80 mb-6 animate-bounce drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
          <h2 className="text-3xl font-black text-white mb-2 tracking-widest">{celebration.name.includes('無上真仙') ? '渡劫成功・羽化登仙' : '突破死劫'}</h2>
          <p className="text-xl text-emerald-400 tracking-widest mb-6">【{celebration.name}】</p>
          <p className="text-base text-rose-200 italic leading-loose tracking-widest max-w-lg mx-auto">「{celebration.desc}」</p>
          <p className="text-white/30 text-xs mt-12 animate-pulse">點擊畫面任意處繼續</p>
        </div>
      )}

      <div className="w-full max-w-4xl mb-6 z-10 font-bold px-2 mt-10">
        <div className="flex flex-col items-center mb-8 h-10 justify-center">
          <h1 className="text-lg md:text-xl tracking-[1.2em] text-white/30 uppercase font-black drop-shadow-md"> {mode === 'focus' ? '凡人修仙專注' : '靈氣反哺 (調息中)'} </h1>
          <div className="h-px w-48 bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4 opacity-50"></div>
        </div>
        
        <div className={`bg-slate-900/50 backdrop-blur-3xl p-5 md:p-8 rounded-xl border ${mode === 'break' ? 'border-cyan-500/30' : activeColorClass.border} relative shadow-2xl transition-all duration-500`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6 mb-6">
            <div className="flex items-center gap-4 w-full md:flex-1">
               <Shield size={36} className={`${mode === 'break' ? 'text-cyan-400' : activeColorClass.text}`}/>
               <div className="flex flex-col justify-center min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase text-white flex items-center flex-wrap">
                    {player.equippedTitle && <span className="text-amber-400 mr-2 border border-amber-500/50 bg-amber-950/50 px-2 py-0.5 rounded text-[10px] tracking-widest">[{TITLE_DATA.find(t=>t.id===player.equippedTitle)?.name}]</span>}
                    {currentRealmData.name}
                    {player.activeCompanion && ( <span className="ml-3 text-pink-400 border border-pink-500/50 bg-pink-950/50 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 mt-2 sm:mt-0"> <Heart size={12} className="fill-current animate-pulse"/> {COMPANIONS.find(c=>c.id===player.activeCompanion)?.name} </span> )}
                  </h2>
                  <p className={`text-xs md:text-sm leading-tight ${mode === 'break' ? 'text-cyan-300' : activeColorClass.text} mt-2 italic drop-shadow-md`}>{currentRealmData.desc}</p>
               </div>
            </div>
            
            <div className="grid grid-cols-3 sm:flex justify-start items-end gap-x-4 gap-y-4 w-full md:w-auto">
               <div className="flex flex-col items-start md:items-end"> <span className="text-[10px] text-yellow-500 uppercase font-black mb-1">靈石</span> <span className="text-base text-yellow-500 font-mono font-bold">{formatNumber(player.coins)}</span> </div>
               <div className="flex flex-col items-start md:items-end"> <span className="text-[10px] text-cyan-400 uppercase font-black mb-1">可用 SP</span> <span className="text-base text-cyan-400 font-mono font-bold">{formatNumber(availableSP)}</span> </div>
               <div className="flex flex-col items-start md:items-end"> <span className="text-[10px] text-rose-500 uppercase font-black mb-1">連擊乘區</span> <span className={`text-base text-rose-500 font-mono font-bold transition-all ${comboMultiplier > 2.0 ? 'text-rose-300 animate-pulse' : ''}`}>x{comboMultiplier.toFixed(2)}</span> </div>
               <div className="flex flex-col items-start md:items-end"> <span className="text-[10px] text-emerald-400 uppercase font-black mb-1">氣運保底</span> <span className="text-base text-emerald-400 font-mono font-bold">x{getMultiplier('luck_floor').toFixed(2)}</span> </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-3">
                <div className="flex justify-between text-[10px] uppercase font-black opacity-60 tracking-widest text-white"> <span>氣血真元</span> <span>{formatNumber(player.vitality)} / {formatNumber(maxVitality)}</span> </div>
                <div className="h-2 bg-black/60 rounded-full overflow-hidden shadow-inner"> <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${Math.min(100, (player.vitality/maxVitality)*100)}%` }}></div> </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] uppercase font-black opacity-60 tracking-widest text-white"> <span>修為進度 {monster.isBoss && !player.hasAscended && <span className="text-rose-400 ml-2 font-black">(突破死劫中)</span>}</span> <span>{formatNumber(player.qi)} / {formatNumber(player.qiToNext)}</span> </div>
              <div className="h-2 bg-black/60 rounded-full overflow-hidden shadow-inner"> <div className={`h-full ${mode === 'break' ? 'bg-cyan-500' : activeColorClass.bg} transition-all duration-1000`} style={{ width: `${Math.min(100, (player.qi/player.qiToNext)*100)}%` }}></div> </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex overflow-x-auto py-5 px-4 gap-8 bg-black/40 rounded-xl border border-white/10 no-scrollbar">
           {REALMS.map((r, i) => (<div key={i} className={`flex flex-col items-center min-w-[90px] transition-all relative ${i===player.realmIndex?'scale-110 opacity-100':'opacity-40'}`}><div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-black text-xs rotate-45 transition-all ${i===player.realmIndex?'bg-white text-black rotate-0 shadow-2xl':'border-white/20 text-white'}`}>{i}</div><span className="text-[10px] font-black mt-5 whitespace-nowrap uppercase">{r.name}</span></div>))}
        </div>
      </div>

      <div className={`w-full max-w-4xl bg-slate-900/40 backdrop-blur-3xl p-8 md:p-14 rounded-2xl border ${mode === 'break' ? 'border-cyan-500/30' : 'border-white/10'} text-center mb-8 z-10 shadow-2xl transition-all duration-700 ${isActive ? 'scale-[1.02] border-emerald-500/30' : ''}`}>
        <div className="grid grid-cols-2 sm:flex sm:justify-center gap-4 mb-12 font-bold max-w-[280px] sm:max-w-none mx-auto">
           {FOCUS_OPTIONS.map(opt => (
             <button key={opt.value} onClick={() => { if(!isActive) { if(mode==='break') setMode('focus'); setFocusDuration(opt.value); setTimeLeft(opt.value); }}} className={`w-full sm:w-auto px-6 py-3.5 rounded-full text-xs font-black border transition-all ${focusDuration === opt.value && mode === 'focus' ? 'bg-white text-black border-white shadow-lg' : 'bg-black/40 text-white/50 border-white/20 hover:bg-white/10'}`}> {opt.label} </button>
           ))}
        </div>
        
        {mode === 'focus' ? (
          <>
            <div className={`flex justify-center items-center gap-3 mb-2 text-sm tracking-[0.6em] font-black uppercase transition-colors ${monster.isBoss && !player.hasAscended ? 'text-rose-500 animate-pulse drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]' : 'text-emerald-400'}`}> <Compass size={18}/> {monster.name} </div>
            <div className="w-full max-w-xs mx-auto bg-black/60 rounded-full h-2 mb-1 overflow-hidden border border-white/10 shadow-inner">
               <div className={`h-full transition-all duration-500 ${monster.isBoss && !player.hasAscended ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (monster.hp / monster.maxHp) * 100)}%` }}></div>
            </div>
            <div className="text-[10px] font-mono text-white/40 mb-10">氣血 {formatNumber(monster.hp)} / {formatNumber(monster.maxHp)} ｜ 戰力 {formatNumber(monster.atk)}</div>
          </>
        ) : ( <div className="flex justify-center items-center gap-3 mb-10 text-sm tracking-[0.6em] font-black uppercase text-cyan-400 animate-pulse"> <CloudLightning size={18}/> 靈氣反哺．調息中 </div> )}

        <div className={`text-[5.5rem] sm:text-8xl md:text-[12rem] font-mono leading-none font-black tracking-tighter mb-14 transition-all duration-700 ${isActive ? 'text-white' : 'text-white/30'}`}> {formatTime(timeLeft)} </div>
        
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex justify-center gap-6 md:gap-8 font-bold w-full">
            {!isActive ? (
              <button onClick={toggleTimer} className={`flex items-center justify-center gap-4 px-16 py-7 hover:text-black border border-white/20 rounded-2xl text-base sm:text-xl font-black tracking-widest uppercase transition-all shadow-2xl backdrop-blur-md w-full md:w-auto ${mode === 'break' ? 'bg-cyan-900/40 text-cyan-300 hover:bg-cyan-400' : 'bg-white/10 hover:bg-white text-white'}`}>
                <Sparkles className="size-6"/> {mode === 'focus' ? '運轉周天 (蓄力)' : '開始調息 (回血)'}
              </button>
            ) : (
              <button onClick={preCheckGiveUp} className={`flex items-center justify-center gap-4 px-16 py-7 bg-rose-950/50 text-rose-400 hover:bg-rose-900 border border-rose-500/40 rounded-2xl text-base sm:text-xl font-black tracking-widest uppercase transition-all shadow-2xl backdrop-blur-md w-full md:w-auto`}>
                <AlertTriangle size={24}/> 強行收功
              </button>
            )}
          </div>
          {canUsePill && mode === 'focus' && (
            <button onClick={() => handleComplete(true)} className="flex items-center justify-center gap-2 px-8 py-4 rounded-full text-xs font-black tracking-widest bg-amber-900/50 text-amber-400 border border-amber-500/50 shadow-lg animate-pop-in"> <Pill size={16}/> 吞服頓悟丹，瞬間出關 (餘 {player.epiphanyPills}) </button>
          )}
        </div>
      </div>

      <div className={`w-full max-w-4xl mt-4 transition-all duration-500 z-10 font-bold ${isActive ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}>
        <div className="bg-slate-950/90 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-2xl flex flex-col h-[750px] overflow-hidden">
          <div className="flex bg-black/80 border-b border-white/10 p-2 gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
            {[ { id: 'skills', label: '功法', icon: ScrollText }, { id: 'forge', label: '淬煉', icon: Hammer }, { id: 'artifacts', label: '法寶', icon: Box }, { id: 'companions', label: '紅顏', icon: Heart }, { id: 'log', label: '日誌', icon: History } ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-4 rounded-xl text-xs font-black uppercase flex flex-col items-center gap-2 transition-all min-w-[75px] ${activeTab===tab.id ? 'bg-white/15 text-white border border-white/20' : 'text-white/40 hover:text-white/80'}`}> <tab.icon size={18}/> <span>{tab.label}</span> </button>
            ))}
          </div>
          <div className="p-5 md:p-10 overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'skills' && (
              <div className="space-y-12 animate-pop-in">
                <div> <div className="flex justify-between items-end mb-6 border-b border-white/20 pb-4"> <h3 className="text-white/60 text-[10px] font-black uppercase tracking-widest">凡俗根基 (SP 研習)</h3> <div className="flex items-center gap-4"> <span className="text-cyan-400 font-mono text-sm">SP: {availableSP}</span> <button onClick={handleRebuildBase} className="px-3 py-1.5 bg-rose-900/40 text-rose-300 rounded-lg text-[10px] font-black border border-rose-500/50"> <RefreshCw size={12} className="inline mr-1"/> 散功重修 </button> </div> </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> {BASIC_SKILLS.map(s => { const lvl = player.basicSkills?.[s.id] || 0; return (
                    <div key={s.id} className="p-5 rounded-xl border border-white/20 bg-white/5 flex flex-col justify-between h-48 shadow-inner">
                        <div><h4 className="text-white font-bold text-xs tracking-widest uppercase">{s.name} <span className="opacity-50 float-right">Lv.{lvl}</span></h4><p className="text-[10px] text-white/50 mt-3 leading-relaxed italic">{s.desc}</p></div>
                        <button onClick={() => { if(availableSP >= 1 && lvl < s.maxLvl) setPlayer(p => ({...p, basicSkills: {...p.basicSkills, [s.id]: lvl+1}})) }} disabled={availableSP < 1 || lvl >= s.maxLvl} className="w-full py-3 bg-white/10 hover:bg-cyan-600 text-white rounded-lg text-[10px] font-black border border-white/20 transition-all disabled:opacity-30">研習 (1 SP)</button>
                    </div> );})} </div> </div>
                <div> <h3 className="text-white/60 text-[10px] font-black uppercase border-b border-white/20 pb-4 mb-6 tracking-widest">機緣祕籍</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {SECRET_BOOKS.map(book => { const lvl = player.secretBooks?.[book.id] || 0, learned = lvl > 0, upCost = Math.floor(10000 * Math.pow(2, lvl) * forgeDiscount); return (
                    <div key={book.id} className={`p-6 rounded-2xl border transition-all flex flex-col justify-between min-h-[12rem] ${learned ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-black/60 border-white/10 opacity-60'}`}>
                        <div className="flex items-start gap-4"><div className={`p-3 rounded-xl ${learned ? 'bg-emerald-500 text-black' : 'bg-slate-800'}`}><BookOpen size={20}/></div><div className="flex-1"><h4 className="font-black text-sm tracking-widest text-white">{book.name} {learned && <span className="text-[10px] opacity-60 ml-2">Lv.{lvl}</span>}</h4><p className="text-[11px] opacity-70 mt-2 text-white">{learned ? book.desc : '歷練隨機獲得。'}</p></div></div>
                        {learned && lvl < 5 && <button onClick={() => handleUpgradeSecret(book.id)} disabled={player.coins < upCost || availableSP < 1} className="mt-4 w-full py-3 bg-white/10 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black border border-white/20 transition-all disabled:opacity-30">升級 (${formatNumber(upCost)} + 1 SP)</button>}
                    </div> );})} </div> </div>
              </div>
            )}
            {activeTab === 'forge' && (
              <div className="space-y-12 animate-pop-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 min-h-[14rem] flex flex-col justify-between shadow-xl">
                    <div><h3 className="text-emerald-400 font-black text-lg tracking-tighter flex items-center gap-2"><Pill size={20}/> 煉製回春丹</h3><p className="text-white/70 text-xs mt-3 italic leading-relaxed">恢復 50% 氣血。</p></div>
                    <button onClick={handleHeal} disabled={player.coins < healCost || player.vitality >= maxVitality} className="w-full py-4 bg-emerald-900/80 hover:bg-emerald-600 text-emerald-100 rounded-xl font-black text-xs transition-all border border-emerald-500/50">{player.vitality >= maxVitality ? '滿氣血' : `煉丹 (${formatNumber(healCost)})`}</button>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/10 border border-white/20 min-h-[14rem] flex flex-col justify-between shadow-inner">
                      <div><h3 className="text-white font-black text-lg">凝練劍光</h3><p className="text-white/60 text-xs mt-3 italic">基礎戰力 +100。</p></div>
                      <button onClick={() => { if(player.coins >= upgCostAtk) setPlayer(p => ({ ...p, coins: p.coins - upgCostAtk, baseCombat: p.baseCombat + 100 })) }} disabled={player.coins < upgCostAtk} className="w-full py-4 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl font-black text-xs transition-all shadow-xl mt-6">祭煉 ({formatNumber(upgCostAtk)})</button>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/10 border border-white/20 min-h-[14rem] flex flex-col justify-between shadow-inner">
                      <div><h3 className="text-white font-black text-lg">熬煉肉身</h3><p className="text-white/60 text-xs mt-3 italic">氣血上限 +100。</p></div>
                      <button onClick={() => { if(player.coins >= upgCostHp) setPlayer(p => ({ ...p, coins: p.coins - upgCostHp, baseMaxVitality: p.baseMaxVitality + 100, vitality: p.vitality + 100 })) }} disabled={player.coins < upgCostHp} className="w-full py-4 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl font-black text-xs transition-all shadow-xl mt-6">熬煉 ({formatNumber(upgCostHp)})</button>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-white/10 to-transparent p-8 rounded-2xl border border-white/20 text-center relative overflow-hidden mt-8">
                  <h3 className="text-white font-black text-xl mb-8 flex items-center justify-center gap-3"><Compass className="text-yellow-400"/> 萬寶樓尋寶</h3>
                  <div className="flex justify-center gap-4 mb-8 overflow-x-auto no-scrollbar">
                     {Object.entries(RARITY).map(([k, r]) => (<div key={k} className="flex flex-col items-center min-w-[70px] opacity-80"><span className={`text-[9px] font-black uppercase ${r.color}`}>{r.name}</span><span className="text-[10px] font-mono mt-1 text-white">{(r.weight*100).toFixed(1)}%</span></div>))}
                  </div>
                  <button onClick={handleGacha} disabled={player.freeGacha <= 0 && player.coins < gachaCost} className="px-16 py-6 bg-white/15 hover:bg-white text-white hover:text-black font-black rounded-2xl transition-all border border-white/30 text-sm">
                    {player.freeGacha > 0 ? `免費尋寶 (${player.freeGacha})` : `尋寶 (${formatNumber(gachaCost)})`}
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'artifacts' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pop-in">
                {ARTIFACT_POOL.map(art => {
                  const unlocked = (player.artifacts || []).includes(art.id), lvl = player.artifactLvls?.[art.id]||0, cost = Math.floor(RARITY_BASE_COST[art.rarity]*Math.pow(1.8,lvl)*forgeDiscount);
                  return unlocked ? (
                    <div key={art.id} className={`p-6 rounded-2xl border bg-black/60 border-white/20 flex flex-col justify-between min-h-[12rem] shadow-inner`}>
                        <div className="z-10"><h4 className={`font-black text-sm ${RARITY[art.rarity].color} flex justify-between`}>{art.name} <span>Lv.{lvl}</span></h4><p className="text-[10px] text-white/50 mt-4 leading-relaxed uppercase">「{art.desc}」</p></div>
                        {lvl < 5 && <button onClick={()=>handleUpgradeArtifact(art.id, art.rarity)} disabled={player.coins < cost} className="mt-6 w-full py-3 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl text-[10px] font-black border border-white/20 transition-all">血煉 (${formatNumber(cost)})</button>}
                    </div>
                  ) : <div key={art.id} className="p-6 rounded-2xl border-2 border-dashed border-white/10 bg-black/50 flex flex-col items-center justify-center opacity-40 min-h-[12rem]"><EyeOff size={32} className="text-white/20 mb-3"/><p className="text-[10px] font-black text-white/40 uppercase tracking-widest">寶光內斂：{RARITY[art.rarity].name}</p></div>;
                })}
              </div>
            )}
            {activeTab === 'companions' && (
              <div className="space-y-8 animate-pop-in pb-10">
                <div className="bg-pink-950/30 border border-pink-500/30 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div> <h3 className="text-pink-400 font-black text-lg flex items-center gap-2"><Heart size={20} className="fill-current"/> 仙途伴侶</h3> <p className="text-white/60 text-xs mt-2 italic leading-relaxed">道侶隨斬殺妖獸數量提升羈絆。(1/10/50/100)</p> </div>
                    {player.activeCompanion && ( <button onClick={() => setPlayer(p => ({ ...p, activeCompanion: null }))} className="px-6 py-2 bg-pink-900/60 text-pink-200 border border-pink-500/40 rounded-full text-xs font-black">請其回府</button> )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> {COMPANIONS.map(comp => {
                        const isU = player.realmIndex >= comp.unlockIdx, isA = player.activeCompanion === comp.id, k = player.companionKills?.[comp.id] || 0, tIdx = getCompanionTier(k);
                        return isU ? (
                            <div key={comp.id} className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${isA ? 'bg-pink-900/40 border-pink-500/50 shadow-xl' : 'bg-black/60 border-white/10'}`}>
                                <div> <div className="flex justify-between items-start mb-4"> <h4 className="text-white font-black text-lg">{comp.name} {isA && <span className="text-[10px] bg-pink-500 text-white px-2 rounded-full ml-2">同行中</span>}</h4> <div className="text-right"> <div className="text-pink-400 font-mono text-sm">{k} 斬</div> <div className="text-white/40 text-[10px]">{tIdx >= 0 ? COMPANION_TIERS[tIdx].name : '未結緣'}</div> </div> </div> <p className="text-white/70 text-[11px] italic leading-relaxed mb-6 h-10">"{comp.desc}"</p>
                                    <div className="bg-black/40 rounded-xl p-4 border border-white/5 mb-6 text-xs"> <div className="text-pink-300 font-black mb-2 flex items-center gap-2">【{comp.buffName}】</div> <div className="flex justify-between items-end"> <span className="text-white/60">{comp.buffDesc}</span> <span className="text-white font-mono font-black">+{comp.buffType === 'luck_floor' ? comp.tiers[Math.max(0,tIdx)].toFixed(2) : comp.tiers[Math.max(0,tIdx)]+'%'}</span> </div> <div className="flex gap-1 mt-3"> {comp.tiers.map((_, idx) => ( <div key={idx} className={`h-1 flex-1 rounded-full ${idx <= tIdx ? 'bg-pink-500' : 'bg-white/10'}`}></div> ))} </div> </div> </div>
                                {!isA && ( <button onClick={() => setPlayer(p => ({ ...p, activeCompanion: comp.id }))} className="w-full py-3 rounded-xl border border-white/20 text-[10px] font-black text-white/70 hover:bg-pink-600 transition-all">邀其同行</button> )}
                            </div> ) : ( <div key={comp.id} className="p-6 rounded-2xl border-2 border-dashed border-pink-900/20 bg-black/50 flex flex-col items-center justify-center min-h-[14rem] opacity-40"> <EyeOff size={32} className="text-pink-900/40 mb-4"/> <p className="text-[10px] font-black text-pink-700/50 uppercase tracking-widest">仙影朦朧</p> <div className="text-[9px] mt-4 text-pink-900/40">需突破至【{REALMS[comp.unlockIdx].name}】</div> </div> );
                    })} </div>
              </div>
            )}
            {activeTab === 'log' && ( <div className="space-y-4 animate-pop-in pb-10"> {(player.logs || []).map((e, i) => (<div key={i} className={`p-5 rounded-xl border border-white/20 text-[11px] leading-relaxed transition-all ${i===0?'bg-white/10 text-white':'bg-black/60 border-white/10 text-white/40'}`}>{e}</div>))} </div> )}
          </div>
        </div>

        <footer className="pt-20 pb-32 text-center text-[10px] font-light text-white/40 tracking-[0.5em] uppercase flex flex-col items-center gap-6 z-10 w-full">
          <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
             <button onClick={() => setShowTitles(true)} className="flex items-center justify-center gap-2 text-amber-400 bg-white/5 py-3.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg relative"> <Award size={14}/> 稱號 {player.freeGacha > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">{player.freeGacha}</span>} </button>
             <button onClick={() => setShowGuide(true)} className="flex items-center justify-center gap-2 text-emerald-400 bg-white/5 py-3.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg"> <HelpCircle size={14}/> 指引 </button>
             <button onClick={() => setShowStatsReport(true)} className="flex items-center justify-center gap-2 text-cyan-400 bg-white/5 py-3.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg"> <BarChart3 size={14}/> 屬性 </button>
             <button onClick={() => setShowRealmGuide(true)} className="flex items-center justify-center gap-2 text-white/60 bg-white/5 py-3.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg"> <BookOpen size={14}/> 境界 </button>
          </div>
          <button onClick={() => setShowSaveModal(true)} className="flex items-center justify-center gap-2 text-cyan-400 bg-cyan-950/40 py-3 px-8 rounded-full border border-cyan-500/30 font-black tracking-widest shadow-xl"> <ScrollText size={16}/> 玉簡傳功 (跨裝置同步) </button>
          <div className="flex items-center justify-center gap-6 mt-4">
              <button onClick={() => setShowChangelog(true)} className="hover:text-emerald-300 transition-colors flex items-center gap-1"><FileText size={12}/> 天道紀元</button>
              <button onClick={()=>{if(window.confirm('確定要輪迴轉世（刪除所有進度）嗎？')) { localStorage.clear(); window.location.reload(); }}} className="hover:text-rose-300 transition-colors flex items-center gap-1"><RefreshCw size={12}/> 輪迴轉世</button>
          </div>
          <p className="mt-8">Created by 指數三寶飯 with Gemini</p>
        </footer>
      </div>
    </div>
  );
}

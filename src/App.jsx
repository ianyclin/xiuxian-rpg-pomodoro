import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Shield, Flame, Wind, Hammer, Box, ScrollText, Network, AlertTriangle, 
  EyeOff, Crown, RefreshCw, Cloud, Activity, Sparkles, Sword, 
  Compass, BookOpen, X, History, BarChart, Pill, HelpCircle, Award, 
  Heart, Copy, FileText, Zap 
} from 'lucide-react';

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

const KARMA_TALENTS = [
  { id: 'k_qi', name: '天生靈體', desc: '靈氣親和。每級全局靈氣獲取永久 +2%。', cost: 1, maxLvl: 25, val: { qi: 0.02 } },
  { id: 'k_atk', name: '武道奇才', desc: '為戰而生。每級全局戰鬥力永久 +2%。', cost: 1, maxLvl: 25, val: { atk: 0.02 } },
  { id: 'k_hp', name: '不滅霸體', desc: '血氣如龍。每級氣血上限永久 +2%。', cost: 1, maxLvl: 25, val: { hp: 0.02 } },
  { id: 'k_stone', name: '點石成金', desc: '財神眷顧。每級靈石獲取永久 +3%。', cost: 1, maxLvl: 25, val: { stone: 0.03 } },
  { id: 'k_sense', name: '萬法不侵', desc: '神識固化。每級反噬減傷永久 +1%。', cost: 1, maxLvl: 20, val: { sense_def: 0.01 } },
  { id: 'k_streak', name: '空明之心', desc: '越戰越勇。每級連擊效率永久 +2%。', cost: 1, maxLvl: 25, val: { streak_eff: 0.02 } },
  { id: 'k_luck', name: '氣運之子', desc: '天道垂青。每級氣運保底永久 +0.02。', cost: 2, maxLvl: 15, val: { luck_floor: 0.02 } }
];

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
  { 
    version: "v6.12.0", 
    title: "天道圓滿・極致抗災", 
    desc: "根除了導致白屏與打包失敗的底層隱患。", 
    changes: [ 
        "修復【全白畫面】：移除可能導致舊版依賴庫崩潰的新版圖標，替換為最穩定的基礎圖標。", 
        "消除【編譯窒息】：重新展開所有龐大的數據陣列，徹底解決 Cloudflare 發布時的 Syntax Error。",
        "優化【飛升敘事】：真仙界巡禮不再觸發強制傷害的反撲錯誤。", 
        "新增【機緣指引】：每日免費尋寶刷新時，選單列會自動亮起紅點提示。" 
    ] 
  }
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
      { n: '【七玄門】墨大夫', s: '銀針偷襲', b: '魔銀手' }, 
      { n: '【野狼幫主】賈天龍', s: '鐵衛護陣', b: '天羅地網' }, 
      { n: '【黃楓谷】陸師兄', s: '青風劍訣', b: '狂風絕息' }, 
      { n: '【天涯閣】狂人封岳', s: '黃羅傘護體', b: '踏雲靴突襲' }, 
      { n: '【血色禁地】墨蛟', s: '巨尾掃擊', b: '黑色毒火' }, 
      { n: '【鬼靈門少主】王蟬', s: '鬼靈步', b: '血靈大法' }, 
      { n: '【燕家堡】燕家老祖', s: '燕家機關', b: '天羅陣' }, 
      { n: '【黑煞教】血侍', s: '妖化之軀', b: '血咒術' }, 
      { n: '【黑煞教主】越皇化身', s: '血靈光波', b: '黑蛟血爪' }, 
      { n: '【極陰徒弟】烏丑', s: '玄陰魔氣', b: '極陰真火' }, 
      { n: '【妙音門叛徒】趙長老', s: '迷音陣', b: '妙音殺網' }, 
      { n: '【八級妖修】毒蛟', s: '蛟龍水箭', b: '碧綠毒丹' }, 
      { n: '【六道傳人】溫天仁', s: '魔雷術', b: '八門金光鏡' }, 
      { n: '【慕蘭神師】仲大仙師', s: '五行靈術', b: '木生大術' }, 
      { n: '【陰羅宗主】房宗主', s: '鬼羅幡動', b: '陰羅幽火' }, 
      { n: '【大晉皇族】葉家大長老', s: '皇家秘術', b: '天威降臨' }, 
      { n: '【星海霸主】六道極聖', s: '魔道秘術', b: '六極真魔功' }, 
      { n: '【冰海之主】冰鳳', s: '極寒冰刺', b: '絕對冰封' }, 
      { n: '【突兀族】天瀾聖獸分身', s: '聖獸之威', b: '天瀾狂煞' }, 
      { n: '【九幽宗】九幽老魔', s: '幽冥鬼氣', b: '九幽鎖魂' }, 
      { n: '【昆吾魔化】元剎聖祖化身', s: '黑魔匕首', b: '元剎魔域' }, 
      { n: '【飛靈聖子】赤魔', s: '赤魔炎', b: '飛靈聖火' }, 
      { n: '【地淵妖物】木靈妖王', s: '木靈刺', b: '森羅萬象' }, 
      { n: '【夜叉族】王級尊者', s: '夜叉冥水', b: '夜叉真身' }, 
      { n: '【地淵霸主】地血老鬼', s: '血道秘術', b: '紫血傀儡爆' }, 
      { n: '【角蚩族】長尊', s: '角蚩秘術', b: '圖騰真身' }, 
      { n: '【魔族】血光聖祖化身', s: '血光印', b: '血魔大陣' }, 
      { n: '【廣寒界】真靈遺骨', s: '真靈威壓', b: '毀滅之光' }, 
      { n: '【魔界始祖】六極聖祖', s: '六極幻影', b: '六道天魔境' }, 
      { n: '【蜉蝣族】大乘太上', s: '控蟲秘術', b: '蜉蝣撼樹' }, 
      { n: '【兇司】兇司王', s: '兇絕斬', b: '兇界降臨' }, 
      { n: '【蟲母】螟蟲之母分身', s: '螟蟲海', b: '天道毀滅' }, 
      { n: '【下界真仙】謫仙馬良', s: '仙家法術', b: '萬靈血璽' }, 
      { n: '【飛升大劫】九九重雷劫', s: '五行神雷', b: '紫霄神雷劫' }
    ]
};

const getDailyResetTime = () => {
    const d = new Date();
    const r = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 8, 0, 0, 0); 
    if (d.getTime() < r.getTime()) r.setDate(r.getDate() - 1);
    return r.getTime();
};

export default function App() {
  const defaultPlayerState = { 
    realmIndex: 0, qi: 0, qiToNext: 250, vitality: 100, baseMaxVitality: 100, coins: 0, baseCombat: 150, 
    artifacts: [], artifactLvls: {}, basicSkills: {}, secretBooks: {}, arrays: { qi: 0, def: 0 }, 
    streakCount: 0, streakShields: 0, luck: 1.0, totalFocusTime: 0, history: [], hasAscended: false,
    lifetimeStats: { kills: 0, focusCount: 0, totalCoins: 0 },
    unlockedTitles: [], equippedTitle: null, freeGacha: 0, epiphanyPills: 0, lastPillTime: 0,
    activeCompanion: null, companionKills: {}, karma: 0, unlockedKarma: [], lastDailyGacha: 0,
    logs: ['[系統] 識海清明，天道印記已穩固。助道友仙運隆昌。']
  };

  const [player, setPlayer] = useState(() => {
    try {
      const saved = localStorage.getItem('xianxia_master_v69');
      if (saved && saved !== 'undefined' && saved !== 'null') {
          return { ...defaultPlayerState, ...JSON.parse(saved) };
      }
      return defaultPlayerState;
    } catch (e) { 
      return defaultPlayerState; 
    }
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
    try {
      const statsRef = ref(database, 'globalStats');
      const unsubscribe = onValue(statsRef, (snapshot) => {
        const data = snapshot.val();
        if (data !== null) setGlobalStats({ focus: data.totalFocusCount || 0, ascensions: data.totalAscensions || 0 });
      });
      return () => unsubscribe();
    } catch(e) {}
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
          const updatedLogs = [...(p.logs || [])];
          newlyUnlocked.forEach(id => {
             const titleName = TITLE_DATA.find(x => x.id === id).name;
             const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
             updatedLogs.unshift(`[${timeStr}] 🏆 【天道恩賜】解鎖稱號「${titleName}」！贈送保底尋寶 1 次！`);
          });
          return { ...p, unlockedTitles: updatedUnlocked, freeGacha: newFreeGacha, logs: updatedLogs.slice(0, 100) };
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

    let mData, isBoss = false, bossMult = 1, atkMult = 1;
    if (isReadyToBreakthrough) {
        isBoss = true; mData = BOSS_DATA[realmIdx];
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
      if (savedMonster && savedMonster !== 'undefined' && savedMonster !== 'null') {
          return JSON.parse(savedMonster);
      }
    } catch (e) {}
    return generateMonsterState(player.realmIndex, player.qi, player.qiToNext, player.hasAscended);
  });

  useEffect(() => { localStorage.setItem('xianxia_monster', JSON.stringify(monster)); }, [monster]);

  const [focusDuration, setFocusDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [targetEndTime, setTargetEndTime] = useState(null); 
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('focus'); 
  const [activeTab, setActiveTab] = useState('log'); 
  const [showRealmGuide, setShowRealmGuide] = useState(false);
  const [showStatsReport, setShowStatsReport] = useState(false);
  const [showGuide, setShowGuide] = useState(false); 
  const [showTitles, setShowTitles] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false); 
  const [showKarmaModal, setShowKarmaModal] = useState(false); 
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

  const sortedCompanions = useMemo(() => [...COMPANIONS].sort((a, b) => (player.realmIndex >= b.unlockIdx ? 1 : 0) - (player.realmIndex >= a.unlockIdx ? 1 : 0)), [player.realmIndex]);
  const sortedArtifacts = useMemo(() => [...ARTIFACT_POOL].sort((a, b) => ((player.artifacts || []).includes(b.id) ? 1 : 0) - ((player.artifacts || []).includes(a.id) ? 1 : 0)), [player.artifacts]);
  const sortedSecretBooks = useMemo(() => [...SECRET_BOOKS].sort((a, b) => ((player.secretBooks?.[b.id] || 0) > 0 ? 1 : 0) - ((player.secretBooks?.[a.id] || 0) > 0 ? 1 : 0)), [player.secretBooks]);

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
        const k = player.companionKills?.[player.activeCompanion] || 0;
        const comp = COMPANIONS.find(c => c.id === player.activeCompanion);
        const tIdx = getCompanionTier(k);
        if (comp && comp.buffType === type && tIdx >= 0) mult += (comp.buffType === 'luck_floor' ? comp.tiers[tIdx] : comp.tiers[tIdx] / 100);
    }
    (player.unlockedKarma || []).forEach(kId => { const talent = KARMA_TALENTS.find(t => t.id === kId); if (talent && talent.val?.[type]) mult += talent.val[type]; });
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

  const dailyResetTime = getDailyResetTime();
  const canDailyGacha = (player.lastDailyGacha || 0) < dailyResetTime;
  const totalFreeGacha = (canDailyGacha ? 1 : 0) + (player.freeGacha || 0);

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
          setPlayer({ ...defaultPlayerState, ...parsed, logs: ['[系統] 跨界奪舍成功，神識與記憶已融合。'] });
          setMonster(generateMonsterState(parsed.realmIndex, parsed.qi || 0, parsed.qiToNext || 250, parsed.hasAscended));
          setImportString(''); setShowSaveModal(false); alert("奪舍成功！");
        }
      } else alert("秘文殘缺！");
    } catch (e) { alert("玉簡毀損！"); }
  };

  const addLog = (textOrArray) => {
    const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    setPlayer(p => {
        const newEntries = Array.isArray(textOrArray) ? textOrArray.map(t => `[${timeStr}] ${t}`) : [`[${timeStr}] ${textOrArray}`];
        return { ...p, logs: [...newEntries, ...(p.logs || [])].slice(0, 100) };
    });
  };

  const handleReincarnation = () => {
    const isNascentSoul = player.realmIndex >= 13; 
    let earnedKarma = isNascentSoul ? Math.max(0, player.realmIndex - 12) + (player.hasAscended ? 10 : 0) : 0;
    let msg = isNascentSoul ? `【兵解輪迴】保留成就並獲取 ${earnedKarma} Karma？\n\n注意：境界、法寶、靈石將歸零。保留稱號、生涯數據與已解鎖靈根。` : "【天道無情】神魂不足以帶走因果，確定轉生？";
    if (window.confirm(msg)) {
        const nextKarma = (player.karma || 0) + earnedKarma;
        const meta = { karma: nextKarma, unlockedKarma: player.unlockedKarma || [], unlockedTitles: player.unlockedTitles || [], equippedTitle: player.equippedTitle, lifetimeStats: player.lifetimeStats, companionKills: player.companionKills, totalFocusTime: player.totalFocusTime, freeGacha: player.freeGacha, lastDailyGacha: player.lastDailyGacha };
        setPlayer({ ...defaultPlayerState, ...meta, logs: [`[${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}] 🔄 【輪迴】${isNascentSoul?'元嬰重生':'投胎轉世'}`] });
        setMonster(generateMonsterState(0, 0, 250, false)); if (isNascentSoul) setShowKarmaModal(true); 
    }
  };

  const unlockKarmaTalent = (talentId, cost) => {
      if ((player.karma || 0) >= cost) {
          setPlayer(p => ({ ...p, karma: p.karma - cost, unlockedKarma: [...(p.unlockedKarma || []), talentId] }));
      }
  };

  const handleHeal = () => {
    if (player.coins >= healCost && player.vitality < maxVitality) {
      const healAmount = Math.floor(maxVitality * 0.5);
      setPlayer(p => ({ ...p, coins: p.coins - healCost, vitality: Math.min(maxVitality, p.vitality + healAmount) }));
      setIsHealing(true); setTimeout(() => setIsHealing(false), 800);
      addLog(`💊 【煉丹】吞服回春丹，恢復 ${formatNumber(healAmount)} 點氣血。`);
    }
  };

  const handleRebuildBase = () => {
    if (player.realmIndex === 0) { alert("已是一介凡人，無可散功。"); return; }
    if (window.confirm("【天道警告】\n散功重修將使境界跌落一級！\n\n副作用：當前境界累積的修為將歸零。\n獲得：重置所有技能點與機緣祕籍，退還剩餘可用 SP。\n（您的生涯數據與道侶羈絆將永久保留）\n\n確認散功？")) {
      const newRealm = player.realmIndex - 1;
      const newQiToNext = Math.floor(250 * Math.pow(1.35, newRealm));
      setPlayer(p => ({ ...p, realmIndex: newRealm, qi: 0, qiToNext: newQiToNext, basicSkills: {}, secretBooks: {}, activeCompanion: null }));
      setMonster(generateMonsterState(newRealm, 0, newQiToNext, player.hasAscended)); 
      addLog(`⚡ 【散功重修】自廢修為，境界跌落至 ${REALMS[newRealm].name}，經脈重塑，SP 全數返還！`);
    }
  };

  const preCheckGiveUp = () => {
    if (monster.isBoss && !player.hasAscended) { setShowGiveUpWarning(true); } else { executeGiveUp(); }
  };

  const executeGiveUp = () => {
    setShowGiveUpWarning(false); setIsActive(false); setTargetEndTime(null);
    
    let actionLogs = [];
    if (Math.random() < evadeRate) { 
        actionLogs.push(`💨 【反撲】強行收功，但身法如鬼魅，成功閃避反噬！連擊不墜！`); 
    } else {
      setIsCollapsing(true); setTimeout(() => setIsCollapsing(false), 1000);
      const pen = Math.min(Math.floor(maxVitality * 0.20 * (1/defMultiplier)), player.vitality * 0.8);
      let nHp = player.vitality - pen, nS = player.streakCount, nQi = player.qi;
      let fellFromBreakthrough = false;
      
      if (nHp <= 0) {
          if (player.streakShields > 0) { 
              nHp = Math.floor(maxVitality * 0.1); 
              setPlayer(p => ({...p, streakShields: p.streakShields - 1})); 
              actionLogs.push(`🛡️ 【反撲】法寶護主！強行收功險些喪命，鎖血 10% 擋下死劫！`); 
          } else if (Math.random() < reviveRate) { 
              nHp = maxVitality; 
              actionLogs.push(`✨ 【反撲】強行收功致死！涅槃重生，轉危為安！`); 
          } else { 
              nHp = Math.floor(maxVitality * 0.5); nQi = Math.floor(player.qi * 0.8); nS = 0; 
              actionLogs.push(`💀 【反撲】反噬過重！身死道消，損失 20% 修為與連擊！`); 
              if (monster.isBoss && nQi < player.qiToNext && !player.hasAscended) fellFromBreakthrough = true;
          }
      } else { 
          actionLogs.push(`🚨 【反撲】強行收功導致神魂震盪，承受 ${formatNumber(pen)} 傷害。`);
          if (nS > 0) {
              if (player.streakShields > 0) { 
                  setPlayer(p => ({...p, streakShields: p.streakShields - 1})); 
                  actionLogs.push(`🛡️ 【反撲】消耗 1 層護盾抵擋反噬，連擊未中斷！`); 
              } else { 
                  nS = 0; actionLogs.push(`📉 【反撲】靈壓潰散，連擊歸零。`); 
              }
          }
      }
      setPlayer(p => ({ ...p, qi: nQi, vitality: nHp, streakCount: nS }));
      if (fellFromBreakthrough) {
          actionLogs.push(`📉 【死劫】境界不穩，跌落玄關，宿敵消散！需重新積累底蘊。`);
          setMonster(generateMonsterState(player.realmIndex, nQi, player.qiToNext, player.hasAscended));
      }
    }
    setTimeLeft(focusDuration);
    if (actionLogs.length > 0) addLog(actionLogs.reverse());
  };

  const handleSkipBreak = () => { setIsActive(false); setTargetEndTime(null); setMode('focus'); setTimeLeft(focusDuration); addLog(`[系統] 道友提前結束吐納。`); };

  const getUnownedPool = (rarityTarget, currentArts, currentBooks) => {
    const unownedArts = ARTIFACT_POOL.filter(a => a.rarity === rarityTarget && !currentArts.includes(a.id)).map(a => ({...a, poolType: 'art'}));
    const unownedBooks = SECRET_BOOKS.filter(b => b.rarity === rarityTarget && !currentBooks[b.id]).map(b => ({...b, poolType: 'book'}));
    return [...unownedArts, ...unownedBooks];
  };

  const handleComplete = (usedPill = false) => {
    const isUsingPill = usedPill === true; setIsActive(false); setTargetEndTime(null);
    if (mode === 'focus') {
      if (bellAudioRef.current) {
          const p = bellAudioRef.current.play();
          if (p !== undefined) p.catch(e => {});
      }
      setIsAttacking(true); setTimeout(() => setIsAttacking(false), 500);
      try { update(ref(database, 'globalStats'), { totalFocusCount: increment(1) }).catch(e=>{}); } catch (e) {}
      
      let nextPills = player.epiphanyPills || 0, nextLastPillTime = isUsingPill ? Date.now() : 0;
      let nextLifetime = { ...player.lifetimeStats };
      let nextTotalFocusTime = (player.totalFocusTime || 0) + (isUsingPill ? 0 : focusDuration);
      let nextCompanionKills = { ...(player.companionKills || {}) };
      let nextHistory = [...(player.history || [])];
      let newArtifacts = [...(player.artifacts || [])];
      let newSecretBooks = { ...(player.secretBooks || {}) };

      let currentDrops = []; 
      let actionLogs = [];

      if (isUsingPill) { actionLogs.push(`💊 【歲月法則】吞服頓悟丹，瞬間出關！(不列入識海)`); nextPills -= 1; } 
      else { nextLifetime.focusCount += 1; }

      const isCrit = Math.random() < critRate, damageBase = Math.floor(currentCombatPower * (focusDuration / 1500));
      const actualDamage = isCrit ? Math.floor(damageBase * critDmg) : damageBase;
      if (isCrit) { setIsCritStrike(true); setTimeout(() => setIsCritStrike(false), 600); }

      const newHp = Math.max(0, monster.hp - actualDamage);
      const timeRatio = focusDuration / 1500, curLuck = getMultiplier('luck_floor');
      const passiveQi = Math.floor(50 * Math.pow(1.18, player.realmIndex + 1) * getMultiplier('qi') * timeRatio);
      const passiveCoin = Math.floor(50 * Math.pow(1.15, player.realmIndex + 1) * getMultiplier('stone') * curLuck * timeRatio);

      let nextQi = (player.qi || 0) + passiveQi, nextCoins = (player.coins || 0) + passiveCoin, nextVitality = player.vitality || maxVitality;
      let nextRealm = player.realmIndex, nextQiToNext = player.qiToNext, nextHasAscended = player.hasAscended;
      let nextStreak = (player.streakCount || 0) + 1, nextShields = maxStreakShields;
      let isDeadFromCounter = false, isKilled = false, killedBoss = false, fellFromBreakthrough = false;

      if (!isUsingPill) nextLifetime.totalCoins += passiveCoin;
      
      if (isCrit && Math.random() < 0.30) {
        const ls = Math.floor(maxVitality * (getMultiplier('lifesteal') - 1));
        if (ls > 0) { nextVitality = Math.min(maxVitality, nextVitality + ls); actionLogs.push(`💉 【真靈吸吮】爆擊恢復了 ${formatNumber(ls)} 氣血！`); }
      }

      let dmgMsg = isCrit ? `🔥 【爆擊】造成 ${formatNumber(actualDamage)} 傷害。` : `⚔️ 【運功】造成 ${formatNumber(actualDamage)} 傷害。`;

      if (newHp === 0) {
        isKilled = true; killedBoss = monster.isBoss; setIsKilling(true); setTimeout(() => setIsKilling(false), 800); 
        const kQi = Math.floor(300 * Math.pow(1.18, monster.tier) * getMultiplier('qi')), kCoin = Math.floor(800 * Math.pow(1.15, monster.tier) * getMultiplier('stone') * curLuck);
        nextQi += kQi; nextCoins += kCoin;
        if (!isUsingPill) { nextLifetime.kills += 1; nextLifetime.totalCoins += kCoin; }
        
        let compLog = '';
        if (player.activeCompanion) {
            const cId = player.activeCompanion;
            const oKills = nextCompanionKills[cId] || 0;
            nextCompanionKills[cId] = oKills + 1;
            if ([1, 10, 50, 100].includes(oKills+1)) compLog = `🌸 與【${COMPANIONS.find(c=>c.id===cId).name}】羈絆達到「${COMPANION_TIERS[getCompanionTier(oKills+1)].name}」！`;
        }

        if (monster.isBoss) {
            if (monster.name.includes('九九重雷劫') && !player.hasAscended) {
                try { update(ref(database, 'globalStats'), { totalAscensions: increment(1) }).catch(e=>{}); } catch(e) {}
                nextHasAscended = true; actionLogs.push(`${dmgMsg} 🌌 【破空飛升】位列仙班！`);
                setCelebration({ name: '飛升仙界！成就無上真仙！', desc: FEEDBACK_TEXTS.boss[0] });
            } else if (nextRealm < REALMS.length - 1) {
                nextRealm++; nextQi = Math.max(0, nextQi - nextQiToNext); nextQiToNext = Math.floor(nextQiToNext * 1.35);
                nextVitality = maxVitality; 
                if (!isUsingPill) nextHistory.push({ name: REALMS[nextRealm].name, time: nextTotalFocusTime });
                actionLogs.push(`${dmgMsg} ☄️ 【突破死劫】晉升至${REALMS[nextRealm].name}！肉身重塑，氣血全滿！`);
                setCelebration({ name: REALMS[nextRealm].name, desc: FEEDBACK_TEXTS.boss[Math.floor(Math.random() * FEEDBACK_TEXTS.boss.length)] });
            }
        } else {
            actionLogs.push(`${dmgMsg} 🩸 【斬殺】成功擊敗${monster.name}！`);
        }

        actionLogs.push(`💰 【戰利品】奪得修為 ${formatNumber(passiveQi + kQi)}，靈石 ${formatNumber(passiveCoin + kCoin)}。`);

        let rareDrops = [];
        if (Math.random() < 0.10) { nextPills += 1; currentDrops.push('💊 頓悟丹'); rareDrops.push('【頓悟丹】x1'); }
        if (Math.random() < (0.20 * curLuck)) {
            let targetRarity = 'COMMON', accum = 0;
            const roll = Math.random(), sortedRarities = Object.entries(RARITY).sort((a,b) => a[1].weight - b[1].weight);
            for (let [r, data] of sortedRarities) { accum += data.weight * curLuck; if (roll < accum) { targetRarity = r; break; } }
            
            let combinedPool = getUnownedPool(targetRarity, newArtifacts, newSecretBooks);
            let searchRarity = targetRarity;
            let startIdx = RARITIES_ORDER.indexOf(targetRarity);

            if (combinedPool.length === 0) {
                for (let i = startIdx - 1; i >= 0; i--) {
                    combinedPool = getUnownedPool(RARITIES_ORDER[i], newArtifacts, newSecretBooks);
                    if (combinedPool.length > 0) { searchRarity = RARITIES_ORDER[i]; break; }
                }
            }

            if (combinedPool.length > 0) {
                const drop = combinedPool[Math.floor(Math.random() * combinedPool.length)];
                if (drop.poolType === 'art') { newArtifacts.push(drop.id); currentDrops.push(`🏺 ${RARITY[searchRarity].name}法寶「${drop.name}」`); rareDrops.push(`法寶「${drop.name}」`); }
                else { newSecretBooks[drop.id] = 1; currentDrops.push(`📜 ${RARITY[searchRarity].name}功法「${drop.name}」`); rareDrops.push(`功法「${drop.name}」`); }
            } else { 
                const cQi = Math.floor((100 * monster.tier) / RARITY[targetRarity].weight); nextQi += cQi; rareDrops.push(`本源修為 ${formatNumber(cQi)}`); 
            }
        }

        if (rareDrops.length > 0 || compLog) {
            let dropStr = rareDrops.length > 0 ? `🎁 【天降機緣】獲得 ${rareDrops.join('、')}！` : '';
            if (compLog) dropStr += ` ${compLog}`;
            actionLogs.push(dropStr.trim());
        }

      } else {
        if (monster.isBoss && nextHasAscended) {
            actionLogs.push(`${dmgMsg} 🌟 【仙界】仙氣縹緲，平和指點後輩，不染塵埃。`);
            actionLogs.push(`💨 【吐納】獲修為 ${formatNumber(passiveQi)}，靈石 ${formatNumber(passiveCoin)}。`);
        } else {
            actionLogs.push(`${dmgMsg} 妖獸剩餘 ${formatNumber(newHp)} 氣血。`);
            actionLogs.push(`💨 【吐納】獲修為 ${formatNumber(passiveQi)}，靈石 ${formatNumber(passiveCoin)}。`);

            const isBigAtk = Math.random() < 0.20, atkName = isBigAtk ? monster.bAtkName : monster.sAtkName;
            if (Math.random() < evadeRate) {
                actionLogs.push(`💨 【反撲】身形如鬼魅，閃避了【${atkName}】！`);
            } else {
                setIsCollapsing(true); setTimeout(() => setIsCollapsing(false), 1000);
                const rawDmg = Math.floor(monster.atk * (isBigAtk ? 2.5 : 1.0) * (1 + (Math.random() - 0.5)*0.4));
                const actualDmg = Math.max(1, Math.floor(rawDmg * (dmgTakenPct / 100)));
                nextVitality -= actualDmg;

                if (nextVitality <= 0) {
                    if (nextShields > 0) { nextShields -= 1; nextVitality = Math.floor(maxVitality * 0.1); actionLogs.push(`🛡️ 【反撲】妖獸施展【${atkName}】！法寶護主，鎖血 10% 擋下死劫！`); }
                    else if (Math.random() < reviveRate) { nextVitality = maxVitality; actionLogs.push(`✨ 【反撲】妖獸施展【${atkName}】造成致命傷！涅槃重生，轉危為安！`); }
                    else { 
                        nextVitality = Math.floor(maxVitality * 0.5); nextQi = Math.floor(nextQi * 0.8); nextStreak = 0; isDeadFromCounter = true; 
                        actionLogs.push(`💀 【反撲】妖獸施展【${atkName}】造成 ${formatNumber(actualDmg)} 傷害。身死道消，損失 20% 修為！`); 
                        if (monster.isBoss && nextQi < nextQiToNext && !nextHasAscended) fellFromBreakthrough = true;
                    }
                } else { actionLogs.push(`💥 【反撲】妖獸施展【${atkName}】，承受了 ${formatNumber(actualDmg)} 點傷害。`); }
            }
        }
      }
      
      if (fellFromBreakthrough) actionLogs.push(`📉 【死劫】境界不穩，跌落玄關，宿敵消散！需重新積累底蘊。`);

      if (!isDeadFromCounter && Math.random() < (0.10 * curLuck)) {
        const fRoll = Math.random() * 100;
        if (fRoll < 25) { const eQi = Math.floor(passiveQi * 2); nextQi += eQi; actionLogs.push(`🌈 【奇遇】偶遇靈泉，額外獲 ${formatNumber(eQi)} 修為！`); }
        else if (fRoll < 50) { const eC = Math.floor(passiveCoin * 3); nextCoins += eC; if (!isUsingPill) nextLifetime.totalCoins += eC; actionLogs.push(`🌈 【奇遇】發現古修洞府，獲 ${formatNumber(eC)} 靈石！`); }
        else if (fRoll < 75) { const h = Math.floor(maxVitality * 0.3); nextVitality = Math.min(maxVitality, nextVitality + h); actionLogs.push(`🌈 【奇遇】天道頓悟，恢復 ${formatNumber(h)} 氣血！`); }
        else if (fRoll < 90) { nextPills += 1; currentDrops.push('💊 頓悟丹'); actionLogs.push(`🌈 【奇遇】天降機緣，獲【頓悟丹】x1！`); }
        else if (fRoll < 98) { if (Math.random() < 0.5) { nextBaseCombat += 5; actionLogs.push(`⚡ 【天雷淬體】肉身脫胎換骨，永久戰力 +5！`); } else { nextBaseMaxVitality += 5; actionLogs.push(`⚡ 【天雷淬體】經脈拓寬，永久氣血上限 +5！`); } }
        else {
            let targetRarity = 'COMMON', accum = 0;
            const roll = Math.random(), sortedRarities = Object.entries(RARITY).sort((a,b) => a[1].weight - b[1].weight);
            for (let [r, data] of sortedRarities) { accum += data.weight * curLuck; if (roll < accum) { targetRarity = r; break; } }
            let combinedPool = getUnownedPool(targetRarity, newArtifacts, newSecretBooks);
            if (combinedPool.length === 0) { for (let i = RARITIES_ORDER.indexOf(targetRarity) - 1; i >= 0; i--) { combinedPool = getUnownedPool(RARITIES_ORDER[i], newArtifacts, newSecretBooks); if (combinedPool.length > 0) { targetRarity = RARITIES_ORDER[i]; break; } } }
            if (combinedPool.length === 0) { for (let i = RARITIES_ORDER.indexOf(targetRarity) + 1; i < RARITIES_ORDER.length; i++) { combinedPool = getUnownedPool(RARITIES_ORDER[i], newArtifacts, newSecretBooks); if (combinedPool.length > 0) { targetRarity = RARITIES_ORDER[i]; break; } } }
            if (combinedPool.length > 0) {
                const drop = combinedPool[Math.floor(Math.random() * combinedPool.length)];
                if (drop.poolType === 'art') { newArtifacts.push(drop.id); currentDrops.push(`🏺 ${RARITY[targetRarity].name}法寶「${drop.name}」`); actionLogs.push(`🏺 【異寶出世】霞光萬丈，喜獲法寶「${drop.name}」！`); }
                else { newSecretBooks[drop.id] = 1; currentDrops.push(`📜 ${RARITY[targetRarity].name}功法「${drop.name}」`); actionLogs.push(`📜 【殘卷現世】機緣巧合，領悟功法「${drop.name}」！`); }
            } else { const cCoins = Math.floor((0.1 * gachaCost) / RARITY[topRarity].weight); nextCoins += cCoins; if (!isUsingPill) nextLifetime.totalCoins += cCoins; actionLogs.push(`✨ 【天道反哺】此界寶物已盡數入您手中！補償 ${formatNumber(cCoins)} 靈石！`); }
        }
      }

      if (!killedBoss) { 
          const t = isKilled ? 'kill' : 'focus'; 
          setToast({ type: t, text: FEEDBACK_TEXTS[t][Math.floor(Math.random() * FEEDBACK_TEXTS[t].length)], drops: currentDrops }); 
          setTimeout(() => setToast(null), 5000); 
      }

      const nextMonster = (fellFromBreakthrough || newHp === 0 || (isDeadFromCounter && monster.isBoss && !nextHasAscended)) ? generateMonsterState(nextRealm, nextQi, nextQiToNext, nextHasAscended) : { ...monster, hp: newHp };
      setMonster(nextMonster);
      
      setPlayer(p => {
          const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
          const formattedLogs = actionLogs.reverse().map(msg => `[${timeStr}] ${msg}`);
          return { ...p, realmIndex: nextRealm, qi: nextQi, qiToNext: nextQiToNext, coins: nextCoins, vitality: nextVitality, baseCombat: nextBaseCombat, baseMaxVitality: nextBaseMaxVitality, streakCount: nextStreak, streakShields: nextShields, totalFocusTime: nextTotalFocusTime, artifacts: newArtifacts, secretBooks: newSecretBooks, epiphanyPills: nextPills, lastPillTime: nextLastPillTime, hasAscended: nextHasAscended, history: nextHistory, lifetimeStats: nextLifetime, companionKills: nextCompanionKills, logs: [...formattedLogs, ...(p.logs || [])].slice(0, 100) };
      });
      setMode('break'); setTimeLeft(5 * 60);

    } else { 
      if (breakAudioRef.current) { const p = breakAudioRef.current.play(); if (p !== undefined) p.catch(e => {}); }
      setMode('focus'); setTimeLeft(focusDuration); setToast({ type: 'break', text: FEEDBACK_TEXTS['break'][Math.floor(Math.random() * FEEDBACK_TEXTS['break'].length)] }); setTimeout(() => setToast(null), 5000);
      setPlayer(p => {
          const h = Math.floor(maxVitality * healPct);
          const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
          return { ...p, vitality: Math.min(maxVitality, p.vitality + h), streakShields: maxStreakShields, logs: [`[${timeStr}] 🌧️ 【靈雨降臨】吐納調息圓滿，恢復了 ${formatNumber(h)} 氣血。`, ...(p.logs || [])].slice(0, 100) };
      });
    }
  };

  const handleGacha = () => {
    let isDaily = canDailyGacha, isTitle = !isDaily && player.freeGacha > 0, isFree = isDaily || isTitle;
    if (!isFree && player.coins < gachaCost) return;
    const curLuck = getMultiplier('luck_floor'), sorted = Object.entries(RARITY).sort((a,b) => a[1].weight - b[1].weight);
    let targetRarity = 'COMMON', accum = 0, roll = Math.random();
    for (let [r, data] of sorted) { accum += data.weight * curLuck; if (roll < accum) { targetRarity = r; break; } }
    
    if (isTitle && ['COMMON', 'UNCOMMON'].includes(targetRarity)) targetRarity = 'RARE';
    
    let combined = getUnownedPool(targetRarity, player.artifacts || [], player.secretBooks || {});
    let searchRarity = targetRarity;
    let startIdx = RARITIES_ORDER.indexOf(targetRarity);

    if (combined.length === 0) {
        for (let i = startIdx - 1; i >= 0; i--) {
            combined = getUnownedPool(RARITIES_ORDER[i], player.artifacts||[], player.secretBooks||{});
            if (combined.length > 0) { searchRarity = RARITIES_ORDER[i]; break; }
        }
    }

    if (combined.length === 0 && isTitle) {
        for (let i = startIdx + 1; i < RARITIES_ORDER.length; i++) {
            combined = getUnownedPool(RARITIES_ORDER[i], player.artifacts||[], player.secretBooks||{});
            if (combined.length > 0) { searchRarity = RARITIES_ORDER[i]; break; }
        }
    }

    if (combined.length > 0) {
      const drop = combined[Math.floor(Math.random()*combined.length)];
      setPlayer(p => ({ ...p, coins: isFree ? p.coins : p.coins - gachaCost, freeGacha: isTitle ? p.freeGacha-1 : p.freeGacha, lastDailyGacha: isDaily ? Date.now() : p.lastDailyGacha, artifacts: drop.poolType === 'art' ? [...p.artifacts, drop.id] : p.artifacts, secretBooks: drop.poolType === 'book' ? {...p.secretBooks, [drop.id]: 1} : p.secretBooks }));
      setCelebration({ name: drop.name, desc: '萬寶樓霞光萬丈，喜獲異寶！' });
    } else {
      const comp = Math.floor(0.1 * gachaCost / RARITY[targetRarity].weight);
      setPlayer(p => ({ ...p, coins: (isFree?p.coins:p.coins-gachaCost)+comp, freeGacha: isTitle?p.freeGacha-1:p.freeGacha, lastDailyGacha: isDaily?Date.now():p.lastDailyGacha }));
      addLog(`[萬寶樓] 該品階與兼容寶物已盡數收入囊中！天道補償 ${formatNumber(comp)} 靈石。`);
    }
  };

  const toggleTimer = () => { 
      if (!isActive) { 
          if (bellAudioRef.current) { bellAudioRef.current.volume = 0; const p = bellAudioRef.current.play(); if (p !== undefined) p.then(() => { bellAudioRef.current.pause(); bellAudioRef.current.currentTime = 0; bellAudioRef.current.volume = 1; }).catch(()=>{}); }
          if (breakAudioRef.current) { breakAudioRef.current.volume = 0; const p = breakAudioRef.current.play(); if (p !== undefined) p.then(() => { breakAudioRef.current.pause(); breakAudioRef.current.currentTime = 0; breakAudioRef.current.volume = 1; }).catch(()=>{}); }
          setIsActive(true); setTargetEndTime(Date.now() + (timeLeft * 1000)); 
      } 
  };

  return (
    <div className={`min-h-screen text-slate-300 font-mono p-4 flex flex-col items-center overflow-x-hidden relative transition-colors duration-500 ${isActive ? 'justify-center py-4 bg-[#020617]' : 'pt-10'} ${isCollapsing ? 'bg-red-950/80 animate-shake' : isKilling ? 'bg-emerald-950/60' : isCritStrike ? 'bg-rose-900/40' : ''}`} style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }} data-v="eGlhbnhpYV9pbmRleDNiYW9mYW4=">
      <style>{` .animate-fade-in-down { animation: fadeInDown 0.5s ease-out forwards; } .animate-soft-fade-in { animation: softFadeIn 0.8s ease-out forwards; } @keyframes softFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @keyframes fadeInDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } } .animate-shake { animation: shake 0.4s both; } @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } } .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px;} .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; } .no-scrollbar::-webkit-scrollbar { display: none; } `}</style>

      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[700] flex flex-col items-center p-4 sm:p-6 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border backdrop-blur-xl animate-fade-in-down transition-all max-w-[90%] w-full cursor-pointer ${toast.type === 'kill' ? 'bg-amber-950/80 border-amber-500/50 text-amber-200' : toast.type === 'focus' ? 'bg-rose-950/80 border-rose-500/50 text-rose-200' : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200'}`} onClick={() => setToast(null)}>
            <div className="flex items-center gap-3 font-black tracking-widest text-sm mb-2 text-center"> {toast.type === 'kill' ? <Sword size={20} className="text-amber-400 animate-bounce"/> : toast.type === 'focus' ? <Flame size={20} className="text-rose-400 animate-pulse"/> : <Wind size={20} className="text-cyan-400 animate-pulse"/>} {toast.text} </div>
            {toast.drops?.length > 0 && <div className="flex flex-col items-center mt-3 pt-3 border-t border-white/20 w-full gap-2"> {toast.drops.map((d, i) => ( <div key={i} className="text-sm font-black text-yellow-400 animate-pulse">{d}</div> ))} </div>}
        </div>
      )}

      <div className={`fixed top-0 left-0 w-full bg-emerald-950/90 text-[10px] py-2 text-center font-black tracking-widest z-[600] border-b border-emerald-500/30 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-500 ${isActive ? 'opacity-0 pointer-events-none -translate-y-full' : ''}`}>
        <div className="flex items-center gap-1.5 text-emerald-400"> <Network size={14}/> <span>世界運轉:</span> <span className="text-white font-mono text-sm">{formatNumber(globalStats.focus)}</span> </div>
        <div className="flex items-center gap-1.5 text-yellow-400"> <Crown size={14}/> <span>飛升仙人:</span> <span className="text-white font-mono text-sm">{formatNumber(globalStats.ascensions)}</span> </div>
      </div>

      <div className="pointer-events-none fixed inset-0 z-[500] flex items-center justify-center overflow-hidden">
        {isCritStrike && <Flame size={350} className="text-amber-500/30 animate-ping absolute mix-blend-color-dodge drop-shadow-[0_0_50px_rgba(245,158,11,0.8)]" />}
        {isKilling && <Sword size={450} className="text-emerald-500/40 animate-pulse absolute mix-blend-color-dodge -rotate-45 drop-shadow-[0_0_80px_rgba(16,185,129,0.8)]" />}
      </div>

      {showGiveUpWarning && (
        <div className="fixed inset-0 z-[800] bg-black/95 backdrop-blur-2xl p-6 flex flex-col items-center justify-center font-bold">
          <div className="w-full max-w-lg bg-rose-950/80 p-8 rounded-2xl border border-rose-500/50 shadow-[0_0_80px_rgba(244,63,94,0.3)] flex flex-col items-center text-center">
            <AlertTriangle size={64} className="text-rose-500 mb-6 animate-pulse"/>
            <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-4">天道警示</h2>
            <p className="text-rose-200 text-sm mb-8">突破死劫中，強行收功將遭受極重反噬。確認放棄？</p>
            <div className="flex gap-4 w-full"> <button onClick={() => setShowGiveUpWarning(false)} className="flex-1 py-4 bg-white/10 text-white rounded-xl text-sm font-black border border-white/20">繼續運功</button> <button onClick={executeGiveUp} className="flex-1 py-4 bg-rose-600 text-white rounded-xl text-sm font-black shadow-lg">強行收功</button> </div>
          </div>
        </div>
      )}

      {showKarmaModal && (
        <div className="fixed inset-0 z-[700] bg-black/95 backdrop-blur-2xl p-4 flex flex-col items-center justify-center font-bold mt-8">
          <div className="w-full max-w-4xl bg-slate-900/90 p-6 md:p-8 rounded-2xl border border-purple-500/30 flex flex-col max-h-[85vh] shadow-[0_0_50px_rgba(168,85,247,0.2)] relative">
            <button onClick={() => setShowKarmaModal(false)} className="absolute top-4 right-4 p-2 text-white/50"><X size={24}/></button>
            <div className="flex flex-col items-center mb-8 border-b border-white/10 pb-6">
                <Activity size={32} className="text-purple-400 mb-3 animate-pulse"/>
                <h2 className="text-xl font-black text-purple-400 tracking-widest uppercase">輪迴靈根</h2>
                <div className="mt-4 bg-purple-950/50 border border-purple-500/50 px-6 py-2 rounded-full text-purple-200 font-mono text-lg font-black shadow-inner"> Karma: {player.karma || 0} </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {KARMA_TALENTS.map(t => {
                        const count = (player.unlockedKarma || []).filter(id => id === t.id).length, isMax = count >= t.maxLvl, canAfford = (player.karma || 0) >= t.cost;
                        return ( <div key={t.id} className={`p-5 rounded-xl border flex flex-col justify-between ${count > 0 ? 'bg-purple-950/20 border-purple-500/40' : 'bg-black/50 border-white/10'}`}> <div> <div className="flex justify-between items-start mb-2"> <h4 className={`font-black text-base ${count > 0 ? 'text-purple-300' : 'text-white'}`}>{t.name}</h4> <span className="text-white/50 font-mono text-xs">Lv.{count}/{t.maxLvl}</span> </div> <p className="text-xs text-white/60 leading-relaxed mb-4">{t.desc}</p> </div> <button onClick={() => unlockKarmaTalent(t.id, t.cost)} disabled={isMax || !canAfford} className="w-full py-3 rounded-lg text-xs font-black border border-white/20 disabled:opacity-30 bg-white/10 hover:bg-purple-600 transition-colors"> {isMax ? '已臻化境' : `領悟 (${t.cost} Karma)`} </button> </div> );
                    })}
                </div>
            </div>
          </div>
        </div>
      )}

      {celebration && (
        <div className="fixed inset-0 z-[800] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-12 cursor-pointer text-center" onClick={() => setCelebration(null)}>
          <Crown size={80} className="text-yellow-500/80 mb-6 animate-bounce drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
          <h2 className="text-3xl font-black text-white mb-2 tracking-widest">{celebration.name.includes('無上真仙') ? '渡劫成功・羽化登仙' : '突破死劫'}</h2>
          <p className="text-xl text-emerald-400 tracking-widest mb-6">【{celebration.name}】</p>
          <p className="text-base text-rose-200 italic leading-loose tracking-widest max-w-lg mx-auto">「{celebration.desc}」</p>
          {celebration.name.includes('無上真仙') && <div className="mt-8 border-t border-white/20 pt-8 max-w-lg"> <p className="text-sm text-yellow-200"> 💡 【天道提示】：您可以兵解輪迴，將修為化為 Karma 點數解鎖靈根天賦！ </p> </div>}
          <p className="text-white/30 text-xs mt-12 animate-pulse">點擊畫面繼續</p>
        </div>
      )}

      {!isActive && (
        <div className="w-full max-w-4xl mb-6 z-10 font-bold px-2 animate-soft-fade-in">
          <div className="flex flex-col items-center mb-8 h-10 justify-center"> <h1 className="text-lg tracking-[1.2em] text-white/30 uppercase font-black"> {mode === 'focus' ? '凡人修仙專注' : '靈氣反哺 (調息中)'} </h1> <div className="h-px w-48 bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4 opacity-50"></div> </div>
          <div className={`bg-slate-900/50 backdrop-blur-3xl p-5 md:p-8 rounded-xl border ${mode === 'break' ? 'border-cyan-500/30' : activeColorClass.border} shadow-2xl`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6 mb-6">
              <div className="flex items-center gap-4 w-full md:flex-1">
                 <Shield size={36} className={`${mode === 'break' ? 'text-cyan-400' : activeColorClass.text}`}/>
                 <div className="flex flex-col justify-center min-w-0">
                    <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase text-white flex items-center flex-wrap"> {player.equippedTitle && <span className="text-amber-400 mr-2 border border-amber-500/50 bg-amber-950/50 px-2 py-0.5 rounded text-[10px] tracking-widest">[{TITLE_DATA.find(t=>t.id===player.equippedTitle)?.name}]</span>} {currentRealmData.name} {player.activeCompanion && <span className="ml-3 text-pink-400 border border-pink-500/50 bg-pink-950/50 px-2 py-0.5 rounded text-[10px] flex items-center gap-1"> <Heart size={12} className="fill-current animate-pulse"/> {COMPANIONS.find(c=>c.id===player.activeCompanion)?.name} </span>} </h2>
                    <p className={`text-xs md:text-sm mt-2 italic ${mode === 'break' ? 'text-cyan-300' : activeColorClass.text}`}>{currentRealmData.desc}</p>
                 </div>
              </div>
              <div className="grid grid-cols-3 sm:flex justify-start items-end gap-x-4 gap-y-4 w-full md:w-auto">
                 <div className="flex flex-col items-start md:items-end"> <span className="text-[10px] text-yellow-500 uppercase font-black mb-1">靈石</span> <span className="text-base text-yellow-500 font-mono font-bold">{formatNumber(player.coins)}</span> </div>
                 <div className="flex flex-col items-start md:items-end"> <span className="text-[10px] text-cyan-400 uppercase font-black mb-1">SP</span> <span className="text-base text-cyan-400 font-mono font-bold">{formatNumber(availableSP)}</span> </div>
                 <div className="flex flex-col items-start md:items-end"> <span className="text-[10px] text-rose-500 uppercase font-black mb-1">連擊</span> <span className={`text-base text-rose-500 font-mono font-bold transition-all ${comboMultiplier > 2.0 ? 'text-rose-300 animate-pulse' : ''}`}>x{comboMultiplier.toFixed(2)}</span> </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-3"> <div className="flex justify-between text-[10px] uppercase font-black opacity-60 text-white"> <span>氣血真元</span> <span>{formatNumber(player.vitality)} / {formatNumber(maxVitality)}</span> </div> <div className="h-2 bg-black/60 rounded-full overflow-hidden shadow-inner"> <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${Math.min(100, (player.vitality/maxVitality)*100)}%` }}></div> </div> </div>
              <div className="space-y-3"> <div className="flex justify-between text-[10px] uppercase font-black opacity-60 text-white"> <span>修為進度 {monster.isBoss && !player.hasAscended && <span className="text-rose-400 ml-2 font-black">(突破死劫中)</span>}</span> <span>{formatNumber(player.qi)} / {formatNumber(player.qiToNext)}</span> </div> <div className="h-2 bg-black/60 rounded-full overflow-hidden shadow-inner"> <div className={`h-full ${mode === 'break' ? 'bg-cyan-500' : activeColorClass.bg} transition-all duration-1000`} style={{ width: `${Math.min(100, (player.qi/player.qiToNext)*100)}%` }}></div> </div> </div>
            </div>
          </div>
          <div className="mt-6 flex overflow-x-auto py-5 px-4 gap-8 bg-black/40 rounded-xl border border-white/10 no-scrollbar"> {REALMS.map((r, i) => (<div key={i} className={`flex flex-col items-center min-w-[90px] transition-all relative ${i===player.realmIndex?'scale-110 opacity-100':'opacity-40'}`}><div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-black text-xs rotate-45 transition-all ${i===player.realmIndex?'bg-white text-black rotate-0 shadow-2xl':'border-white/20 text-white'}`}>{i}</div><span className="text-[10px] font-black mt-5 whitespace-nowrap uppercase">{r.name}</span></div>))} </div>
        </div>
      )}

      <div className={`w-full max-w-4xl bg-slate-900/40 backdrop-blur-3xl p-8 md:p-14 rounded-2xl border ${mode === 'break' ? 'border-cyan-500/30' : 'border-white/10'} text-center z-10 shadow-2xl transition-all duration-700 flex flex-col justify-center ${isActive ? 'scale-[1.02] border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.15)] my-auto max-w-2xl' : 'mb-8'}`}>
        {!isActive && ( <div className="grid grid-cols-2 sm:flex sm:justify-center gap-4 mb-12 font-bold max-w-[280px] sm:max-w-none mx-auto"> {FOCUS_OPTIONS.map(opt => ( <button key={opt.value} onClick={() => { if(mode==='break') setMode('focus'); setFocusDuration(opt.value); setTimeLeft(opt.value); }} className={`w-full sm:w-auto px-6 py-3.5 rounded-full text-xs font-black border transition-all ${focusDuration === opt.value && mode === 'focus' ? 'bg-white text-black border-white shadow-lg' : 'bg-black/40 text-white/50 border-white/20 hover:bg-white/10'}`}> {opt.label} </button> ))} </div> )}
        {isActive ? ( <div className={`text-[10px] font-black tracking-[0.5em] uppercase mb-8 animate-pulse ${mode === 'focus' ? 'text-emerald-400/50' : 'text-cyan-400/50'}`}> {mode === 'focus' ? '【 運轉周天・摒棄雜念 】' : '【 吐納調息・靈氣反哺 】'} </div> ) : ( mode === 'focus' ? ( <div className="animate-soft-fade-in"> <div className={`flex justify-center items-center gap-3 mb-2 text-sm tracking-[0.6em] font-black uppercase transition-colors ${monster.isBoss && !player.hasAscended ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}> <Compass size={18}/> {monster.name} </div> <div className="w-full max-w-xs mx-auto bg-black/60 rounded-full h-2 mb-1 overflow-hidden border border-white/10 shadow-inner"> <div className={`h-full transition-all duration-500 ${monster.isBoss && !player.hasAscended ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (monster.hp / monster.maxHp) * 100)}%` }}></div> </div> <div className="text-[10px] font-mono text-white/40 mb-10">氣血 {formatNumber(monster.hp)} / {formatNumber(monster.maxHp)} ｜ 戰力 {formatNumber(monster.atk)}</div> </div> ) : ( <div className="flex justify-center items-center gap-3 mb-10 text-sm tracking-[0.6em] font-black uppercase text-cyan-400 animate-pulse"> <CloudLightning size={18}/> 靈氣反哺．調息中 </div> ) )}
        <div className={`text-[5.5rem] sm:text-8xl md:text-[12rem] font-mono leading-none font-black tracking-tighter transition-all duration-700 ${isActive ? 'text-white my-8 md:my-12' : 'text-white/30 mb-14'}`}> {formatTime(timeLeft)} </div>
        <div className="flex flex-col items-center justify-center gap-6"> <div className="flex justify-center gap-6 md:gap-8 font-bold w-full"> {!isActive ? ( <button onClick={toggleTimer} className={`flex items-center justify-center gap-4 px-16 py-7 hover:text-black border border-white/20 rounded-2xl text-base sm:text-xl font-black tracking-widest uppercase transition-all shadow-2xl backdrop-blur-md w-full md:w-auto ${mode === 'break' ? 'bg-cyan-900/40 text-cyan-300 hover:bg-cyan-400' : 'bg-white/10 hover:bg-white text-white'}`}> <Sparkles size={24}/> {mode === 'focus' ? '運轉周天' : '開始調息'} </button> ) : ( <button onClick={preCheckGiveUp} className="flex items-center justify-center gap-4 px-16 py-6 bg-rose-950/30 text-rose-500/50 hover:text-rose-300 hover:bg-rose-900 border border-rose-500/20 rounded-2xl text-sm font-black tracking-widest uppercase transition-all w-full md:w-auto"> <AlertTriangle size={20}/> 強行收功 </button> )} </div> </div>
      </div>

      {!isActive && (
        <div className="w-full max-w-4xl mt-4 z-10 font-bold animate-soft-fade-in">
          <div className="bg-slate-950/90 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-2xl flex flex-col h-[750px] overflow-hidden">
            <div className="flex bg-black/80 border-b border-white/10 p-2 gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
              {[ { id: 'log', label: '日誌', icon: History }, { id: 'skills', label: '功法', icon: ScrollText }, { id: 'forge', label: '淬煉', icon: Hammer }, { id: 'artifacts', label: '法寶', icon: Box }, { id: 'companions', label: '紅顏', icon: Heart } ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-4 rounded-xl text-xs font-black uppercase flex flex-col items-center gap-2 transition-all min-w-[75px] relative ${activeTab===tab.id ? 'bg-white/15 text-white border border-white/20' : 'text-white/40 hover:text-white/80'}`}> 
                    <tab.icon size={18}/> <span>{tab.label}</span> {tab.id === 'forge' && totalFreeGacha > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_5px_#f43f5e]"></span>}
                </button>
              ))}
            </div>
            <div className="p-5 md:p-10 overflow-y-auto flex-1 custom-scrollbar">
              {activeTab === 'log' && ( <div className="space-y-4 animate-pop-in pb-10"> {(player.logs || []).map((e, i) => (<div key={i} className={`p-5 rounded-xl border border-white/20 text-[11px] leading-relaxed transition-all ${i===0?'bg-white/10 text-white shadow-lg':'bg-black/60 border-white/10 text-white/40'}`}>{String(e)}</div>))} </div> )}
              {activeTab === 'skills' && ( <div className="space-y-12 animate-pop-in"> <div className="flex justify-between items-end mb-6 border-b border-white/20 pb-4"> <h3 className="text-white/60 text-[10px] uppercase tracking-widest">功法參悟</h3> <span className="text-cyan-400 font-mono text-sm">SP: {availableSP}</span> </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"> {BASIC_SKILLS.map(s => { const lvl = player.basicSkills?.[s.id] || 0; return ( <div key={s.id} className="p-5 rounded-xl border border-white/20 bg-white/5 flex flex-col justify-between h-44"> <div><h4 className="text-white font-bold text-xs uppercase">{s.name} <span className="opacity-50 float-right">Lv.{lvl}</span></h4><p className="text-[10px] text-white/50 mt-3 italic">{s.desc}</p></div> <button onClick={() => { if(availableSP >= 1 && lvl < s.maxLvl) setPlayer(p => ({...p, basicSkills: {...p.basicSkills, [s.id]: lvl+1}})) }} disabled={availableSP < 1 || lvl >= s.maxLvl} className="w-full py-3 bg-white/10 text-white rounded-lg text-[10px] font-black border border-white/20 disabled:opacity-30">研習 (1 SP)</button> </div> );})} </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {sortedSecretBooks.map(book => { const lvl = player.secretBooks?.[book.id] || 0, learned = lvl > 0, upCost = Math.floor(10000 * Math.pow(2, lvl) * forgeDiscount); return ( <div key={book.id} className={`p-6 rounded-2xl border transition-all flex flex-col justify-between min-h-[12rem] ${learned ? 'bg-emerald-950/40 border-emerald-500/50 shadow-xl' : 'bg-black/60 border-white/10 opacity-60'}`}> <div className="flex items-start gap-4"><div className={`p-3 rounded-xl ${learned ? 'bg-emerald-500 text-black' : 'bg-slate-800'}`}><BookOpen size={20}/></div><div className="flex-1"><h4 className="font-black text-sm tracking-widest text-white">{book.name} {learned && <span className="text-[10px] opacity-60 ml-2">Lv.{lvl}</span>}</h4><p className="text-[11px] opacity-70 mt-2 text-white">{learned ? book.desc : '歷練隨機獲得。'}</p></div></div> {learned && lvl < 5 && <button onClick={() => { const cost = Math.floor(10000 * Math.pow(2, lvl) * forgeDiscount); if (player.coins >= cost && availableSP >= 1) setPlayer(p => ({ ...p, coins: p.coins - cost, secretBooks: { ...p.secretBooks, [book.id]: lvl + 1 } })); }} disabled={player.coins < upCost || availableSP < 1} className="mt-4 w-full py-3 bg-white/10 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black border border-white/20 transition-all disabled:opacity-30">升級 (${formatNumber(upCost)} + 1 SP)</button>} </div> );})} </div> </div> )}
              {activeTab === 'forge' && ( <div className="space-y-12 animate-pop-in"> <div className="grid grid-cols-1 sm:grid-cols-3 gap-6"> {[{title:'回春丹',desc:'恢復 50% 氣血。',fn:handleHeal,cost:healCost,dis:player.vitality>=maxVitality}, {title:'凝練劍光',desc:'基礎戰力 +100。',fn:()=>player.coins>=upgCostAtk && setPlayer(p=>({...p,coins:p.coins-upgCostAtk,baseCombat:p.baseCombat+100})),cost:upgCostAtk}, {title:'熬煉肉身',desc:'氣血上限 +100。',fn:()=>player.coins>=upgCostHp && setPlayer(p=>({...p,coins:p.coins-upgCostHp,baseMaxVitality:p.baseMaxVitality+100,vitality:p.vitality+100})),cost:upgCostHp}].map((u,i)=>( <div key={i} className={`p-6 rounded-2xl border flex flex-col justify-between min-h-[14rem] ${i===0?'bg-emerald-950/40 border-emerald-500/40':'bg-white/10 border-white/20'}`}> <div><h3 className="text-white font-black text-lg">{u.title}</h3><p className="text-white/70 text-xs mt-3 italic">{u.desc}</p></div> <button onClick={u.fn} disabled={u.dis || player.coins<u.cost} className="w-full py-4 bg-white/10 hover:bg-white hover:text-black rounded-xl font-black text-xs transition-all border border-white/20 mt-6">{u.dis?'滿值':`祭煉 (${formatNumber(u.cost)})`}</button> </div> ))} </div> <div className="bg-gradient-to-br from-white/10 to-transparent p-8 rounded-2xl border border-white/20 text-center relative overflow-hidden mt-8"> <h3 className="text-white font-black text-xl mb-8 flex items-center justify-center gap-3"><Compass className="text-yellow-400"/> 萬寶樓尋寶</h3> <div className="flex justify-center gap-4 mb-8 overflow-x-auto no-scrollbar"> {Object.entries(RARITY).map(([k, r]) => (<div key={k} className="flex flex-col items-center min-w-[70px] opacity-80"><span className={`text-[9px] font-black uppercase ${r.color}`}>{r.name}</span><span className="text-[10px] font-mono mt-1 text-white">{(r.weight*100).toFixed(1)}%</span></div>))} </div> <button onClick={handleGacha} disabled={totalFreeGacha <= 0 && player.coins < gachaCost} className="px-16 py-6 bg-white/15 hover:bg-white text-white hover:text-black font-black rounded-2xl transition-all border border-white/30 text-sm"> {canDailyGacha ? `今日免費尋寶 (1/1)` : (player.freeGacha > 0 ? `免費保底尋寶 (${player.freeGacha})` : `尋寶 (${formatNumber(gachaCost)})`)} </button> </div> </div> )}
              {activeTab === 'artifacts' && ( <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pop-in"> {sortedArtifacts.map(art => { const u = (player.artifacts || []).includes(art.id), lvl = player.artifactLvls?.[art.id]||0, cost = Math.floor(RARITY_BASE_COST[art.rarity]*Math.pow(1.8,lvl)*forgeDiscount); return u ? ( <div key={art.id} className={`p-6 rounded-2xl border bg-black/60 border-white/20 flex flex-col justify-between min-h-[12rem] shadow-inner`}> <div className="z-10"><h4 className={`font-black text-sm ${RARITY[art.rarity].color} flex justify-between`}>{art.name} <span>Lv.{lvl}</span></h4><p className="text-[10px] text-white/50 mt-4 leading-relaxed uppercase">「{art.desc}」</p></div> {lvl < 5 && <button onClick={()=>{ if(player.coins>=cost) setPlayer(p=>({...p, coins:p.coins-cost, artifactLvls:{...p.artifactLvls, [art.id]:lvl+1}})); }} disabled={player.coins < cost} className="mt-6 w-full py-3 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl text-[10px] font-black border border-white/20">血煉 (${formatNumber(cost)})</button>} </div> ) : ( <div key={art.id} className="p-6 rounded-2xl border-2 border-dashed border-white/10 bg-black/50 flex flex-col items-center justify-center opacity-40 min-h-[12rem]"><EyeOff size={32} className="text-white/20 mb-3"/><p className="text-[10px] font-black text-white/40 uppercase">寶光內斂：{RARITY[art.rarity].name}</p></div> );})} </div> )}
              {activeTab === 'companions' && ( <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pop-in"> {sortedCompanions.map(comp => { const u = player.realmIndex >= comp.unlockIdx, a = player.activeCompanion === comp.id, k = player.companionKills?.[comp.id] || 0, t = getCompanionTier(k); return u ? ( <div key={comp.id} className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${a ? 'bg-pink-900/40 border-pink-500/50 shadow-xl' : 'bg-black/60 border-white/10'}`}> <div> <div className="flex justify-between items-start mb-4"> <h4 className="text-white font-black text-lg">{comp.name} {a && <span className="text-[10px] bg-pink-500 text-white px-2 rounded-full ml-2">同行</span>}</h4> <div className="text-right"> <div className="text-pink-400 font-mono text-sm">{k} 斬</div> <div className="text-white/40 text-[10px]">{t >= 0 ? COMPANION_TIERS[t].name : '未結緣'}</div> </div> </div> <p className="text-white/70 text-[11px] italic mb-6 h-10">"{comp.desc}"</p> <div className="bg-black/40 rounded-xl p-4 border border-white/5 text-xs"> <div className="text-pink-300 font-black mb-2 flex items-center gap-2">【{comp.buffName}】</div> <div className="flex justify-between items-end"> <span className="text-white/60">{comp.buffDesc}</span> <span className="text-white font-mono font-black">+{comp.buffType === 'luck_floor' ? comp.tiers[Math.max(0,t)].toFixed(2) : comp.tiers[Math.max(0,t)]+'%'}</span> </div> </div> </div> {!a && ( <button onClick={() => setPlayer(p => ({ ...p, activeCompanion: comp.id }))} className="w-full py-3 rounded-xl border border-white/20 text-[10px] font-black text-white/70 hover:bg-pink-600 transition-all mt-4">邀其同行</button> )} </div> ) : ( <div key={comp.id} className="p-6 rounded-2xl border-2 border-dashed border-pink-900/20 bg-black/50 flex flex-col items-center justify-center min-h-[14rem] opacity-40"><EyeOff size={32} className="text-pink-900/40 mb-4"/><p className="text-[10px] font-black text-pink-700/50 uppercase">需突破至【{REALMS[comp.unlockIdx].name}】</p></div> );})} </div> )}
            </div>

            <footer className="pt-16 pb-24 text-center text-[10px] font-light text-white/40 tracking-[0.5em] uppercase flex flex-col items-center gap-6 z-10 w-full relative">
              <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                 <button onClick={() => setShowTitles(true)} className="flex items-center justify-center gap-2 text-amber-400 bg-white/5 py-3.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg relative"> <Award size={14}/> 稱號 {player.freeGacha > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">{player.freeGacha}</span>} </button>
                 <button onClick={() => setShowGuide(true)} className="flex items-center justify-center gap-2 text-emerald-400 bg-white/5 py-3.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg"> <HelpCircle size={14}/> 指引 </button>
                 <button onClick={() => setShowStatsReport(true)} className="flex items-center justify-center gap-2 text-cyan-400 bg-white/5 py-3.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg"> <BarChart3 size={14}/> 屬性 </button>
                 <button onClick={() => setShowRealmGuide(true)} className="flex items-center justify-center gap-2 text-white/60 bg-white/5 py-3.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg"> <BookOpen size={14}/> 境界 </button>
              </div>
              <div className="flex gap-4">
                  <button onClick={() => setShowKarmaModal(true)} className={`flex items-center justify-center gap-2 text-purple-400 bg-purple-950/40 py-3 px-6 rounded-full border border-purple-500/30 font-black tracking-widest shadow-xl transition-all ${player.hasAscended ? 'animate-pulse ring-2 ring-purple-500' : ''}`}> <Activity size={16}/> 輪迴靈根 </button>
                  <button onClick={() => setShowSaveModal(true)} className="flex items-center justify-center gap-2 text-cyan-400 bg-cyan-950/40 py-3 px-6 rounded-full border border-cyan-500/30 font-black tracking-widest shadow-xl"> <ScrollText size={16}/> 玉簡傳功 </button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                  <button onClick={() => setShowChangelog(true)} className="hover:text-emerald-300 transition-colors flex items-center gap-1"><FileText size={12}/> 天道紀元</button>
                  <button onClick={handleReincarnation} className={`transition-colors flex items-center gap-1 ${player.hasAscended ? 'text-rose-400 hover:text-rose-300 font-black animate-pulse' : 'text-rose-500/60 hover:text-rose-400'}`}><RefreshCw size={12}/> 兵解輪迴</button>
              </div>
              <p className="mt-8 relative z-20">Created by 指數三寶飯 with Gemini</p>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

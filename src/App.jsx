import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Square, Skull, Shield, Zap, Flame, Wind, Coins, Hammer, Box, ScrollText, Network, AlertTriangle, EyeOff, Crown, ChevronsUp, RefreshCw, Zap as Lightning, CloudLightning, Info, Eye, Activity, Sparkles, Sword, Compass, Clover, Lock, BookOpen, X, History, BarChart3, Save, Pill, HelpCircle, Lightbulb, ShieldAlert } from 'lucide-react';

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
  COMMON: { name: '凡品', color: 'text-slate-400', weight: 0.45 },
  UNCOMMON: { name: '靈品', color: 'text-green-400', weight: 0.30 },
  RARE: { name: '法寶', color: 'text-blue-400', weight: 0.15 },
  EPIC: { name: '古寶', color: 'text-purple-400', weight: 0.07 },
  LEGENDARY: { name: '通天靈寶', color: 'text-orange-400', weight: 0.02 },
  MYTHIC: { name: '玄天之寶', color: 'text-red-500', weight: 0.009 },
  DIVINE: { name: '造化至寶', color: 'text-yellow-400', weight: 0.001 }
};

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
    REALMS.push({ 
      name: `${major.name.replace('境', '')}${suffix}`, 
      desc: major.desc, 
      isMajor: i === 0, 
      majorName: major.name.replace('境', ''), 
      color: major.color 
    });
  });
});
REALMS.push({ name: '渡劫', desc: '引動九九重雷劫，成則羽化登仙，敗則化為劫灰。', majorName: '渡劫', isMajor: true, color: 'rose' });

const GUIDE_REALMS = [
  { name: '一介凡人', desc: '凡夫俗子，尚未引氣入體，壽元百載。', range: 'Tier 1' },
  ...MAJOR_REALMS_DATA.map((r, i) => ({ name: r.name, desc: r.desc, range: `Tier ${i * 4 + 2} - ${i * 4 + 5}` })),
  { name: '渡劫期', desc: '引動九九重雷劫，成則羽化登仙，敗則化為劫灰。', range: 'Tier 34' }
];

const ARTIFACT_POOL = [
  { id: 'a01', rarity: 'COMMON', name: '鐵木盾', desc: '抵禦外魔 (反噬減傷 +2%)', val: { def: 0.02 } },
  { id: 'a02', rarity: 'COMMON', name: '青銅戈', desc: '凡兵銳氣 (基礎戰力 +4%)', val: { atk: 0.04 } },
  { id: 'a03', rarity: 'COMMON', name: '凝神蒲團', desc: '固本培元 (回血+2%，修為+2%)', val: { heal_bonus: 0.02, qi: 0.02 } },
  { id: 'a04', rarity: 'COMMON', name: '粗糙靈石袋', desc: '聚財之陣 (靈石掉落 +5%)', val: { stone: 0.05 } },
  { id: 'a10', rarity: 'UNCOMMON', name: '神風舟', desc: '御風而行 (閃避率 +5%)', val: { evade: 0.05 } },
  { id: 'a11', rarity: 'UNCOMMON', name: '子母刃', desc: '奇門暗器 (戰力+8%，爆擊率+8%)', val: { atk: 0.08, crit: 0.08 }, tags: ['sword'] },
  { id: 'a12', rarity: 'UNCOMMON', name: '無形針', desc: '無影無蹤 (連擊效率+10%，爆擊+10%)', val: { streak_eff: 0.10, crit: 0.10 } },
  { id: 'a13', rarity: 'UNCOMMON', name: '血玉髓', desc: '氣血滋養 (休息回血比例 +5%)', val: { heal_bonus: 0.05 } },
  { id: 'a20', rarity: 'RARE', name: '青蛟旗', desc: '妖魂鎮壓 (戰力加成 +15%)', val: { atk: 0.15 } },
  { id: 'a21', rarity: 'RARE', name: '玄鐵飛天盾', desc: '堅不可摧 (反噬減傷 +15%)', val: { def: 0.15 } },
  { id: 'a22', rarity: 'RARE', name: '碧玉葫蘆', desc: '納寶空間 (靈石掉落 +30%)', val: { stone: 0.30 } },
  { id: 'a23', rarity: 'RARE', name: '金光磚', desc: '重擊崩碎 (爆擊傷害 +25%)', val: { crit_dmg: 0.25 } },
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

/**
 * ========================================================
 * 2. 主組件 (App)
 * ========================================================
 */

export default function App() {
  const defaultPlayerState = { 
    realmIndex: 0, qi: 0, qiToNext: 250, vitality: 100, baseMaxVitality: 100, coins: 0, baseCombat: 150, 
    artifacts: [], artifactLvls: {}, basicSkills: {}, secretBooks: {}, arrays: { qi: 0, def: 0 }, 
    streakCount: 0, streakShields: 0, luck: 1.0, totalFocusTime: 0, history: [], hasAscended: false,
    logs: ['【天道印記】仙途漫漫，唯『靜心專注』方能證道。以現世之光陰，化此界之修為。摒棄雜念，祝道友仙運隆昌。'] 
  };

  const [player, setPlayer] = useState(() => {
    try {
      const saved = localStorage.getItem('xianxia_master_v69');
      if (saved) return { ...defaultPlayerState, ...JSON.parse(saved) };
      return defaultPlayerState;
    } catch (e) { return defaultPlayerState; }
  });

  const availableSP = useMemo(() => {
    let totalEarned = 0;
    for (let i = 1; i <= player.realmIndex; i++) {
      if (REALMS[i]?.isMajor) {
        totalEarned += 5; 
      } else {
        totalEarned += 3; 
      }
    }
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
      if (data !== null) {
        setGlobalStats({
          focus: data.totalFocusCount || 0,
          ascensions: data.totalAscensions || 0
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  
  const getMonsterName = (tier) => {
    const monsters = ['野狼幫眾', '墨大夫', '金光上人', '陸師兄', '黑煞教徒', '越皇化身', '鬼靈門王蟬', '血線蛟', '墨蛟', '土甲龍', '雙尾人面蠍', '溫天仁', '鐵甲煉屍', '慕蘭法士', '極陰祖師', '裂風獸風希', '六道極聖', '古魔血焰', '陰羅宗宗主', '化形毒蛟', '夜叉族守衛', '角蚩族戰尊', '六翼霜蚣', '銀甲屍王', '高階魔尊', '元剎聖祖化身', '噬金蟲王', '海王族大乘', '六極聖祖', '降臨謫仙馬良', '始印神尊', '游天鯤鵬', '真靈羅睺', '螟蟲之母'];
    const index = Math.min(Math.max(1, tier), monsters.length) - 1;
    return `${monsters[index]}`;
  };
  
  const generateMonsterState = (realmIdx) => {
    const nTier = realmIdx + 1;
    const isPeak = REALMS[realmIdx].name.includes('巔峰');
    const isFinal = realmIdx === REALMS.length - 1;
    const bossMult = isFinal ? 20 : (isPeak ? 4 : 1);
    const nHp = Math.floor(120 * Math.pow(1.25, nTier - 1) * bossMult);
    const mName = isFinal ? '【九九重劫】' : (isPeak ? `${getMonsterName(nTier)} [大瓶頸]` : getMonsterName(nTier));
    return { name: mName, hp: nHp, maxHp: nHp, tier: nTier };
  };

  const [monster, setMonster] = useState(() => generateMonsterState(player.realmIndex));
  const [focusDuration, setFocusDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [targetEndTime, setTargetEndTime] = useState(null); 
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('focus'); 
  const [activeTab, setActiveTab] = useState('skills');
  const [showRealmGuide, setShowRealmGuide] = useState(false);
  const [showStatsReport, setShowStatsReport] = useState(false);
  const [showGuide, setShowGuide] = useState(false); 
  const [guideTab, setGuideTab] = useState('rules'); 
  const [celebration, setCelebration] = useState(null);
  const [showGiveUpWarning, setShowGiveUpWarning] = useState(false);

  const [isAttacking, setIsAttacking] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [isCritStrike, setIsCritStrike] = useState(false); 
  const [isKilling, setIsKilling] = useState(false); 
  const [isHealing, setIsHealing] = useState(false); 

  useEffect(() => { 
    localStorage.setItem('xianxia_master_v69', JSON.stringify(player)); 
    setSaveIndicator(true);
    const timer = setTimeout(() => setSaveIndicator(false), 2000);
    return () => clearTimeout(timer);
  }, [player]);

  const getMultiplier = (type) => {
    let mult = 1.0;
    
    BASIC_SKILLS.forEach(s => { 
        if (player.basicSkills?.[s.id] > 0 && s.val?.[type]) mult += s.val[type] * player.basicSkills[s.id]; 
    });
    
    Object.entries(player.secretBooks || {}).forEach(([id, lvl]) => { 
        const book = SECRET_BOOKS.find(x => x.id === id);
        if (book?.val?.[type]) mult += book.val[type] * lvl;
    });

    (player.artifacts || []).forEach(id => { 
        const item = ARTIFACT_POOL.find(a => a.id === id);
        const lvl = player.artifactLvls?.[id] || 0;
        if (item?.val?.[type]) mult += item.val[type] * (1 + lvl * 0.5);
    });
    
    if (type === 'atk' || type === 'streak_cap') {
      const swordCount = (player.artifacts || []).filter(id => ARTIFACT_POOL.find(a => a.id === id)?.tags?.includes('sword')).length;
      if (swordCount >= 2) mult += 0.2 * swordCount; 
    }

    if (type === 'qi' && (player.arrays?.qi || 0)) mult += player.arrays.qi * 0.05;
    if (type === 'def' && (player.arrays?.def || 0)) mult += player.arrays.def * 0.05;
    return mult;
  };

  const currentRealmData = REALMS[player.realmIndex];
  
  const rawEvade = getMultiplier('evade') - 1;
  const evadeRate = Math.min(0.75, rawEvade);
  const overflowEvade = Math.max(0, rawEvade - 0.75);
  const rawCrit = getMultiplier('crit') - 1;
  const critRate = Math.min(0.95, rawCrit);
  const overflowCrit = Math.max(0, rawCrit - 0.95);
  
  const streakCap = Math.min(8.0, 0.5 + (getMultiplier('streak_cap') - 1) + (overflowEvade * 0.5)); 
  const streakEff = getMultiplier('streak_eff'); 
  const streakBonusMult = Math.min(streakCap, (player.streakCount || 0) * 0.05 * streakEff);
  const comboMultiplier = 1 + streakBonusMult;
  
  const maxStreakShields = Math.floor(getMultiplier('streak_shield') - 1);
  const critDmg = Math.min(20.0, 1.5 + (getMultiplier('crit_dmg') - 1) + (overflowCrit * 3.0));
  const reviveRate = Math.min(0.65, getMultiplier('revive') - 1);   
  const healPct = Math.min(0.80, 0.35 + (getMultiplier('heal_bonus') - 1));
  const defMultiplier = getMultiplier('def');
  const dmgTakenPct = (1 / defMultiplier) * 100; 

  const currentCombatPower = Math.floor(player.baseCombat * getMultiplier('atk') * comboMultiplier);
  const maxVitality = Math.floor(player.baseMaxVitality * getMultiplier('hp'));
  const forgeDiscount = Math.max(0.1, 1 - (getMultiplier('forge_discount') - 1)); 

  const upgCostAtk = Math.floor(1000 * Math.pow(1.15, (player.baseCombat - 100) / 100) * forgeDiscount);
  const upgCostHp = Math.floor(1000 * Math.pow(1.15, (player.baseMaxVitality - 100) / 100) * forgeDiscount);
  const healCost = Math.floor((maxVitality * 1.0 + player.realmIndex * 100) * forgeDiscount);
  const arrayQiCost = Math.floor(5000 * Math.pow(1.6, (player.arrays?.qi || 0)) * forgeDiscount);
  const arrayDefCost = Math.floor(4000 * Math.pow(1.6, (player.arrays?.def || 0)) * forgeDiscount);
  const gachaCost = Math.floor(5000 * Math.pow(1.15, player.realmIndex) * forgeDiscount);

  const addLog = (text) => {
    const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    setPlayer(p => ({ ...p, logs: [`[${timeStr}] ${text}`, ...(p.logs || [])].slice(0, 50) }));
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
    if (window.confirm("【天道警告】\n散功重修將使境界跌落一級！\n\n副作用：當前境界累積的修為將歸零。\n獲得：重置所有技能點與機緣祕籍，退還剩餘可用 SP。\n\n確認散功？")) {
      const newRealm = player.realmIndex - 1;
      const newQiToNext = Math.floor(250 * Math.pow(1.35, newRealm));
      setPlayer(p => ({ ...p, realmIndex: newRealm, qi: 0, qiToNext: newQiToNext, basicSkills: {}, secretBooks: {} }));
      addLog(`⚡ 【散功重修】自廢修為，境界跌落至 ${REALMS[newRealm].name}，經脈重塑，SP 全數返還！`);
    }
  };

  const preCheckGiveUp = () => {
    const isBottleneck = monster.name.includes('瓶頸') || monster.name.includes('劫');
    if (isBottleneck) {
      setShowGiveUpWarning(true);
    } else {
      executeGiveUp();
    }
  };

  const executeGiveUp = () => {
    setShowGiveUpWarning(false);
    setIsActive(false); 
    setTargetEndTime(null);
    
    if (Math.random() < evadeRate) { 
      addLog(`💨 【羅煙閃避】成功閃避反噬！連擊不墜！`); 
    } else {
      setIsCollapsing(true); setTimeout(() => setIsCollapsing(false), 1000);
      
      const senseDef = Math.min(0.9, getMultiplier('sense_def') - 1);
      const rawPenalty = Math.floor((maxVitality * 0.20 + monster.tier * 50 + monster.maxHp * 0.01) * (1 / defMultiplier) * (1 - senseDef));
      const penalty = Math.min(rawPenalty, player.vitality * 0.8);
      
      let nextHp = player.vitality - penalty;
      
      if (nextHp <= 0) {
        if (Math.random() < reviveRate) { 
          nextHp = maxVitality; 
          addLog(`✨ 【涅槃重生】轉危為安！`); 
        } else { 
          nextHp = Math.floor(maxVitality * 0.5); 
          setPlayer(p => ({ ...p, qi: Math.floor(p.qi * 0.8) })); 
          addLog(`💀 【身死道消】反噬過重，損失 20% 當前修為與連擊！`); 
        }
      } else { 
        addLog(`🚨 【靈力反噬】神魂震盪，承受 ${formatNumber(penalty)} 傷害。`); 
      }

      let nextStreak = 0;
      let nextShields = player.streakShields;
      
      if (player.streakCount > 0 && nextHp > 0) {
        if (player.streakShields > 0) {
          nextStreak = player.streakCount;
          nextShields = player.streakShields - 1;
          addLog(`🛡️ 【法寶護主】消耗 1 層連擊護盾抵擋反噬，連擊未中斷！`);
        } else {
          addLog(`📉 靈壓潰散，連擊歸零。`);
        }
      }
      setPlayer(p => ({ ...p, vitality: nextHp, streakCount: nextStreak, streakShields: nextShields }));
    }
    setTimeLeft(focusDuration);
  };

  const handleSkipBreak = () => {
    setIsActive(false);
    setTargetEndTime(null);
    setMode('focus');
    setTimeLeft(focusDuration);
    addLog(`【調息結束】道友提前結束吐納，未獲取靈雨滋養。`);
  };

  const handleComplete = () => {
    setIsActive(false); setTargetEndTime(null);
    
    if (mode === 'focus') {
      setIsAttacking(true); setTimeout(() => setIsAttacking(false), 500);

      try {
        const statsRef = ref(database, 'globalStats');
        update(statsRef, { totalFocusCount: increment(1) });
      } catch (e) { console.error(e); }
      
      const isCrit = Math.random() < critRate;
      const damageBase = Math.floor(currentCombatPower * (focusDuration / 1500));
      const actualDamage = isCrit ? Math.floor(damageBase * critDmg) : damageBase;
      
      if (isCrit) { setIsCritStrike(true); setTimeout(() => setIsCritStrike(false), 600); }

      const newHp = Math.max(0, monster.hp - actualDamage);
      const timeRatio = focusDuration / 1500;
      const currentLuck = getMultiplier('luck_floor');
      const passiveQi = Math.floor(50 * Math.pow(1.18, player.realmIndex + 1) * getMultiplier('qi') * timeRatio);
      const passiveCoin = Math.floor(50 * Math.pow(1.15, player.realmIndex + 1) * getMultiplier('stone') * currentLuck * timeRatio);

      let nextQi = player.qi + passiveQi;
      let nextCoins = player.coins + passiveCoin;
      let nextVitality = player.vitality;
      let nextRealm = player.realmIndex;
      let nextQiToNext = player.qiToNext;
      let nextHistory = player.history;
      let newArtifacts = [...(player.artifacts || [])];
      let nextHasAscended = player.hasAscended;
      
      if (isCrit && Math.random() < 0.30) {
        const lifesteal = Math.floor(maxVitality * (getMultiplier('lifesteal') - 1));
        if (lifesteal > 0) {
          nextVitality = Math.min(maxVitality, nextVitality + lifesteal);
          addLog(`💉 【真靈吸吮】爆擊恢復了 ${formatNumber(lifesteal)} 氣血！`);
        }
      }

      let killLog = '';

      if (newHp === 0) {
        setIsKilling(true); setTimeout(() => setIsKilling(false), 800); 
        const killQi = Math.floor(300 * Math.pow(1.18, monster.tier) * getMultiplier('qi'));
        const killCoin = Math.floor(800 * Math.pow(1.15, monster.tier) * getMultiplier('stone') * currentLuck);
        
        nextQi += killQi;
        nextCoins += killCoin;
        
        if (Math.random() < (0.15 * currentLuck)) {
            const potential = ARTIFACT_POOL.filter(a => !newArtifacts.includes(a.id));
            if (potential.length > 0) {
                newArtifacts.push(potential[0].id);
                killLog += ` 🎁 斬獲異寶【${potential[0].name}】！`;
            }
        }

        const isFinalBoss = monster.name === '【九九重劫】';
        if (isFinalBoss && !player.hasAscended) {
            try { update(ref(database, 'globalStats'), { totalAscensions: increment(1) }); } catch(e) {}
            nextHasAscended = true;
            killLog = `🌌 【破空飛升】位列仙班！ ` + killLog;
            setCelebration({ name: '飛升仙界！成就真仙！' });
        } else if (nextQi >= nextQiToNext && nextRealm < REALMS.length - 1) {
            nextRealm++;
            nextQi -= nextQiToNext;
            nextQiToNext = Math.floor(nextQiToNext * 1.35);
            nextHistory = [...(player.history || []), { name: REALMS[nextRealm].name, time: (player.totalFocusTime || 0) + focusDuration }];
            setCelebration({ name: REALMS[nextRealm].name });
            killLog = `☄️ 【突破】晉升至${REALMS[nextRealm].name}！` + killLog;
        } else {
            killLog = `⚔️ 【擊殺】奪得修為 ${formatNumber(killQi)}！` + killLog;
        }
        setMonster(generateMonsterState(nextRealm));
      } else {
        setMonster(prev => ({ ...prev, hp: newHp }));
      }

      let fortuneLog = '';
      if (Math.random() < (0.10 * currentLuck)) {
        const fortuneRoll = Math.random();
        if (fortuneRoll < 0.33) {
            const extraQi = Math.floor(passiveQi * 2);
            nextQi += extraQi;
            fortuneLog = ` 🌈 【氣運爆發】偶遇天地靈泉，額外獲 ${formatNumber(extraQi)} 修為！`;
        } else if (fortuneRoll < 0.66) {
            const extraCoin = Math.floor(passiveCoin * 3);
            nextCoins += extraCoin;
            fortuneLog = ` 🌈 【氣運爆發】發掘古修洞府，額外獲 ${formatNumber(extraCoin)} 靈石！`;
        } else {
            const healAmount = Math.floor(maxVitality * 0.3);
            nextVitality = Math.min(maxVitality, nextVitality + healAmount);
            fortuneLog = ` 🌈 【氣運爆發】陷入天道頓悟，氣血恢復 ${formatNumber(healAmount)}！`;
        }
      }

      const dmgLog = isCrit ? `🔥 【爆擊】造成 ${formatNumber(actualDamage)} 傷害。` : `[運功] 造成 ${formatNumber(actualDamage)} 傷害。`;
      addLog(`${dmgLog} ${killLog || `獲修為 ${formatNumber(passiveQi)}。`}${fortuneLog}`);

      setPlayer(p => ({
          ...p,
          realmIndex: nextRealm,
          qi: nextQi,
          qiToNext: nextQiToNext,
          coins: nextCoins,
          vitality: nextVitality,
          streakCount: p.streakCount + 1,
          streakShields: maxStreakShields,
          totalFocusTime: (p.totalFocusTime || 0) + focusDuration,
          artifacts: newArtifacts,
          history: nextHistory,
          hasAscended: nextHasAscended
      }));
      setMode('break'); setTimeLeft(5 * 60);

    } else { 
      setMode('focus'); setTimeLeft(focusDuration); 
      const heal = Math.floor(maxVitality * healPct);
      setPlayer(p => ({ 
        ...p, 
        vitality: Math.min(maxVitality, p.vitality + heal),
        streakShields: maxStreakShields 
      }));
      addLog(`🌧️ 【靈雨降臨】吐納調息圓滿，恢復了 ${formatNumber(heal)} 氣血。`); 
    }
  };

  const handleGacha = () => {
    if (player.coins < gachaCost) return;
    const currentLuck = getMultiplier('luck_floor');
    const roll = Math.random(); 
    let targetRarity = 'COMMON';
    
    if (roll < 0.001 * currentLuck) targetRarity = 'DIVINE'; 
    else if (roll < 0.01 * currentLuck) targetRarity = 'MYTHIC'; 
    else if (roll < 0.03 * currentLuck) targetRarity = 'LEGENDARY'; 
    else if (roll < 0.08 * currentLuck) targetRarity = 'EPIC'; 
    else if (roll < 0.18 * currentLuck) targetRarity = 'RARE'; 
    else if (roll < 0.4 * currentLuck) targetRarity = 'UNCOMMON';
    
    const candidates = ARTIFACT_POOL.filter(a => a.rarity === targetRarity && !(player.artifacts || []).includes(a.id));
    if (candidates.length > 0) {
      setPlayer(p => ({ ...p, coins: p.coins - gachaCost, artifacts: [...(p.artifacts || []), candidates[0].id] }));
      setCelebration({ name: candidates[0].name });
    } else { 
      setPlayer(p => ({ ...p, coins: p.coins - gachaCost, qi: p.qi + 100 })); 
      addLog(`[萬寶樓] 尋寶未果，獲補償修為 100 點。`); 
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

  const handleUpgradeArtifact = (artId, rarity) => {
    const currentLvl = player.artifactLvls[artId] || 0;
    const cost = Math.floor(RARITY_BASE_COST[rarity] * Math.pow(1.8, currentLvl) * forgeDiscount);
    if (player.coins >= cost && currentLvl < 5) { 
      setPlayer(p => ({ ...p, coins: p.coins - cost, artifactLvls: { ...p.artifactLvls, [artId]: currentLvl + 1 }, streakShields: maxStreakShields })); 
      addLog(`[血煉] 【${ARTIFACT_POOL.find(x=>x.id===artId).name}】至 Lv.${currentLvl + 1}。`);
    }
  };

  const toggleTimer = () => { 
    if (!isActive) { 
      const endTime = Date.now() + (timeLeft * 1000);
      setIsActive(true); 
      setTargetEndTime(endTime);
      addLog(mode === 'focus' ? `[運轉] 靈力蓄積中...` : `[調息] 閉目凝神，運功療傷。`); 
    } 
  };

  useEffect(() => {
    const syncTime = () => {
      if (isActive && targetEndTime && !showGiveUpWarning) {
        const remaining = Math.max(0, Math.floor((targetEndTime - Date.now()) / 1000));
        setTimeLeft(remaining); 
        if (remaining === 0) handleComplete();
      }
    };
    if (isActive && !showGiveUpWarning) {
      const interval = setInterval(syncTime, 1000);
      document.addEventListener('visibilitychange', syncTime);
      return () => { clearInterval(interval); document.removeEventListener('visibilitychange', syncTime); };
    }
  }, [isActive, targetEndTime, showGiveUpWarning]);

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
    <div className={`min-h-screen text-slate-300 font-mono p-4 flex flex-col items-center overflow-x-hidden relative transition-colors duration-300 pt-10
      ${isCollapsing ? 'bg-red-950/80 animate-shake' : 
        isKilling ? 'bg-emerald-950/60' :
        isCritStrike ? 'bg-rose-900/40' : 'bg-[#020617]'}`}
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      
      <div className="fixed top-0 left-0 w-full bg-emerald-950/90 text-[10px] sm:text-xs py-2 text-center font-black tracking-widest z-[600] border-b border-emerald-500/30 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
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
      `}</style>

      {showGiveUpWarning && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-2xl p-6 flex flex-col items-center justify-center font-bold">
          <div className="w-full max-w-lg bg-rose-950/80 p-8 rounded-2xl border border-rose-500/50 shadow-[0_0_80px_rgba(244,63,94,0.3)] flex flex-col items-center text-center animate-pop-in">
            <ShieldAlert size={64} className="text-rose-500 mb-6 animate-pulse"/>
            <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-4">天道警示</h2>
            <p className="text-rose-200 text-sm md:text-base leading-relaxed mb-8">當前正處於 <span className="text-white font-black underline decoration-rose-500 decoration-2">大瓶頸/雷劫</span>！<br/>此時強行收功將遭受極為嚴重的反噬。<br/><br/>確認要放棄本次蓄力嗎？</p>
            <div className="flex gap-4 w-full">
              <button onClick={() => setShowGiveUpWarning(false)} className="flex-1 py-4 bg-white/10 hover:bg-white text-white hover:text-black rounded-xl text-sm font-black transition-all border border-white/20">繼續運功</button>
              <button onClick={executeGiveUp} className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-black transition-all shadow-lg">強行收功</button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed top-14 right-4 z-50 flex items-center gap-2 bg-emerald-900/80 text-emerald-300 px-4 py-2 rounded-full text-xs font-bold border border-emerald-500/30 transition-opacity duration-500 ${saveIndicator ? 'opacity-100' : 'opacity-0'}`}>
        <Save size={14} className="animate-pulse"/> 天道已同步
      </div>

      {/* ==========================================
          天道經緯 (境界全覽)
          ========================================== */}
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

      {/* ==========================================
          修行指引與祕訣
          ========================================== */}
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
                     <h3 className="text-emerald-400 text-base flex items-center gap-2 font-black"><Play size={18}/> 運轉周天 (專注蓄力)</h3>
                     <p className="text-white/70 font-bold">點擊開始計時。完成後結算傷害並獲取靈氣機緣。支援離線運算，切換視窗不影響進度。</p>
                   </section>
                   <section className="bg-white/5 p-5 rounded-xl border-l-4 border-yellow-400 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-yellow-400 text-base flex items-center gap-2 font-black"><Sparkles size={18}/> 隨機氣運 (奇遇機制)</h3>
                     <p className="text-white/70 font-bold">每次專注完成時，有 10% 基礎機率觸發奇遇（受氣運倍率加成）。可能獲得：靈氣翻倍、靈石三倍、或瞬間恢復 30% 氣血的頓悟。</p>
                   </section>
                   <section className="bg-white/5 p-5 rounded-xl border-l-4 border-rose-500 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-rose-400 text-base flex items-center gap-2 font-black"><Square size={18}/> 強行收功與死亡</h3>
                     <p className="text-white/70 font-bold">中途強行收功會遭受反噬。氣血歸零若無「涅槃復活」將損失 20% 當前修為並清空連擊。請適時至洞府「煉製回春丹」。</p>
                   </section>
                   <section className="bg-white/5 p-5 rounded-xl border-l-4 border-cyan-400 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-cyan-400 text-base flex items-center gap-2 font-black"><Wind size={18}/> 吐納調息 (休息無懲罰)</h3>
                     <p className="text-white/70 font-bold">專注後進入 5 分鐘調息。調息結束可恢復大量氣血。若提前結束調息，只會放棄本次回血，【不會】受到反噬懲罰。</p>
                   </section>
                </div>
              ) : (
                <div className="space-y-4 text-sm leading-relaxed animate-pop-in">
                   <section className="bg-white/5 p-5 rounded-xl border-l-4 border-purple-500 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-purple-400 text-base flex items-center gap-2 font-black"><Activity size={18}/> 屬性溢出轉化 (核心)</h3>
                     <p className="text-white/70 font-bold">天道設有極限，但溢出的屬性不會浪費：<br/>• 閃避率上限 75%，溢出的閃避將以 <span className="text-emerald-400">1 : 0.5</span> 轉化為「連擊增幅上限」。<br/>• 爆擊率上限 95%，溢出的爆擊將以 <span className="text-rose-400">1 : 3</span> 轉化為「爆擊傷害」。</p>
                   </section>
                   <section className="bg-white/5 p-5 rounded-xl border-l-4 border-cyan-400 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-cyan-400 text-base flex items-center gap-2 font-black"><Sword size={18}/> 劍陣共鳴與護盾</h3>
                     <p className="text-white/70 font-bold">裝備 2 把以上「劍類」法寶，每把劍額外提升 20% 戰力與連擊上限。擁有「連擊護盾」時，強行收功不會中斷連擊倍率。</p>
                   </section>
                   <section className="bg-white/5 p-5 rounded-xl border-l-4 border-yellow-500 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-yellow-400 text-base flex items-center gap-2 font-black"><Compass size={18}/> 氣運與神識感應</h3>
                     <p className="text-white/70 font-bold">「氣運」直接乘算萬寶樓出紫金的機率與奇遇觸發率。研習《大衍決》的神識能抵銷走火入魔的基礎反噬傷害 (極限90%)。</p>
                   </section>
                   <section className="bg-white/5 p-5 rounded-xl border-l-4 border-rose-400 flex flex-col gap-2 shadow-inner">
                     <h3 className="text-rose-400 text-base flex items-center gap-2 font-black"><Pill size={18}/> 真靈吸血機制</h3>
                     <p className="text-white/70 font-bold">爆擊時有 30% 機率觸發吸血（若有相應功法），直接以氣血上限百分比進行回復，是後期續航關鍵。</p>
                   </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          屬性極限報告 (精準對接內部變數)
          ========================================== */}
      {showStatsReport && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-xl p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center font-bold mt-8">
          <div className="w-full max-w-3xl bg-[#0a0a0a] p-4 sm:p-6 md:p-10 rounded-2xl border border-cyan-900/50 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4 flex-shrink-0">
               <h2 className="text-lg md:text-xl font-black text-cyan-400 tracking-widest uppercase flex items-center gap-3"><BarChart3 size={24}/> 屬性極限與轉化報告</h2>
               <button onClick={() => setShowStatsReport(false)} className="p-4 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="space-y-4">
                  <h3 className="text-xs text-white/50 uppercase border-b border-white/10 pb-2 font-mono tracking-widest flex items-center gap-2"><ChevronsUp size={14}/> 基礎倍率 (BASE MULTIPLIERS)</h3>
                  <div className="flex justify-between text-sm items-center"><span className="text-slate-300 font-bold">總戰力加成</span><span className="text-rose-400 font-mono font-black text-base">x{getMultiplier('atk').toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm items-center"><span className="text-slate-300 font-bold">氣血上限加成</span><span className="text-emerald-400 font-mono font-black text-base">x{getMultiplier('hp').toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm items-center"><span className="text-slate-300 font-bold">靈氣獲取倍率</span><span className="text-cyan-400 font-mono font-black text-base">x{getMultiplier('qi').toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm items-center"><span className="text-slate-300 font-bold">靈石掉落倍率</span><span className="text-yellow-400 font-mono font-black text-base">x{getMultiplier('stone').toFixed(2)}</span></div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xs text-white/50 uppercase border-b border-white/10 pb-2 font-mono tracking-widest flex items-center gap-2"><Flame size={14}/> 戰鬥極限 (COMBAT CAPS)</h3>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-300 font-bold flex flex-col">爆擊率 <span className="text-[10px] text-purple-400/70 font-mono">(溢出&gt;95% 轉爆傷)</span></span>
                    <span className="text-purple-400 font-mono font-black text-base">{(critRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-300 font-bold flex flex-col">爆擊傷害 <span className="text-[10px] text-white/30 font-mono">(極限 2000%)</span></span>
                    <span className="text-rose-400 font-mono font-black text-base">{(critDmg * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-300 font-bold flex flex-col">連擊增傷上限 <span className="text-[10px] text-white/30 font-mono">(極限 +800%)</span></span>
                    <span className="text-rose-400 font-mono font-black text-base">+{((streakCap - 0.5) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-300 font-bold">連擊效率倍率</span>
                    <span className="text-rose-400 font-mono font-black text-base">x{streakEff.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs text-white/50 uppercase border-b border-white/10 pb-2 font-mono tracking-widest flex items-center gap-2"><Shield size={14}/> 生存防禦 (SURVIVAL & DEFENSE)</h3>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-300 font-bold flex flex-col">閃避免傷率 <span className="text-[10px] text-emerald-400/70 font-mono">(溢出&gt;75% 轉連擊)</span></span>
                    <span className="text-emerald-400 font-mono font-black text-base">{(evadeRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                     <span className="text-slate-300 font-bold">涅槃復活率 <span className="text-[10px] text-white/30 ml-1 font-mono">(極限 65%)</span></span>
                     <span className="text-emerald-400 font-mono font-black text-base">{(reviveRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                     <span className="text-slate-300 font-bold">反噬承傷比例 <span className="text-[10px] text-white/30 ml-1 font-mono">(1 / Def)</span></span>
                     <span className="text-yellow-500 font-mono font-black text-base">{dmgTakenPct.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                     <span className="text-slate-300 font-bold">神識感應減傷 <span className="text-[10px] text-white/30 ml-1 font-mono">(極限 90%)</span></span>
                     <span className="text-cyan-400 font-mono font-black text-base">{((Math.min(0.9, getMultiplier('sense_def') - 1)) * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs text-white/50 uppercase border-b border-white/10 pb-2 font-mono tracking-widest flex items-center gap-2"><Compass size={14}/> 機緣經濟 (FORTUNE & ECONOMY)</h3>
                  <div className="flex justify-between text-sm items-center">
                     <span className="text-slate-300 font-bold flex flex-col">氣運保底倍率 <span className="text-[10px] text-white/30 font-mono">(乘算奇遇與抽獎)</span></span>
                     <span className="text-yellow-400 font-mono font-black text-base">x{getMultiplier('luck_floor').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                     <span className="text-slate-300 font-bold">洞府成本折扣 <span className="text-[10px] text-white/30 ml-1 font-mono">(極限降至 10%)</span></span>
                     <span className="text-yellow-500 font-mono font-black text-base">{(forgeDiscount * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                     <span className="text-slate-300 font-bold">真靈吸血比例 <span className="text-[10px] text-white/30 ml-1 font-mono">(爆擊時 30% 觸發)</span></span>
                     <span className="text-rose-400 font-mono font-black text-base">{((getMultiplier('lifesteal') - 1) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                     <span className="text-slate-300 font-bold">休息回血比例 <span className="text-[10px] text-white/30 ml-1 font-mono">(極限 80%)</span></span>
                     <span className="text-emerald-400 font-mono font-black text-base">{(healPct * 100).toFixed(1)}%</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {celebration && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-12 cursor-pointer font-bold mt-8" onClick={() => setCelebration(null)}>
          <Crown size={80} className="text-yellow-500/80 mb-6 animate-bounce" />
          <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-widest">{celebration.name.includes('成就真仙') ? '渡劫成功' : '突破瓶頸'}</h2>
          <p className="text-xl text-emerald-400 font-light tracking-widest">【{celebration.name}】</p>
        </div>
      )}

      <div className="w-full max-w-4xl mb-6 transition-focus z-10 font-bold px-2 md:px-0 mt-10">
        <div className="flex flex-col items-center mb-8 h-10 justify-center">
          <h1 className="text-lg md:text-xl font-extralight tracking-[1.2em] text-white/30 uppercase font-bold drop-shadow-md">
            {mode === 'focus' ? '凡人修仙專注' : '靈氣反哺 (調息中)'}
          </h1>
          <div className="h-px w-48 bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4 opacity-50"></div>
        </div>
        
        <div className={`bg-slate-900/50 backdrop-blur-3xl p-5 md:p-8 rounded-xl border ${mode === 'break' ? 'border-cyan-500/30' : `border-${currentRealmData.color}-500/30`} relative shadow-2xl shadow-inner group transition-all duration-500`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6 mb-6">
            <div className="flex items-center gap-4 w-full md:flex-1 min-w-0">
               <Shield size={36} className={`${mode === 'break' ? 'text-cyan-400' : `text-${currentRealmData.color}-400`} flex-shrink-0`}/>
               <div className="flex flex-col justify-center flex-1 min-w-0">
                  <h2 className="text-2xl font-black tracking-widest uppercase text-white font-bold drop-shadow-lg truncate">{currentRealmData.name}</h2>
                  <p className={`text-xs md:text-sm leading-tight ${mode === 'break' ? 'text-cyan-300' : `text-${currentRealmData.color}-300`} font-bold mt-2 opacity-90 italic drop-shadow-md truncate`}>{currentRealmData.desc}</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-nowrap justify-start md:justify-end items-start md:items-end gap-x-4 gap-y-6 w-full md:w-auto mt-2 md:mt-0">
               <div className="flex flex-col items-start md:items-end">
                 <span className="text-xs text-yellow-500 uppercase font-black flex items-center gap-1.5 mb-1"><Coins size={12}/> 靈石</span>
                 <span className="text-base text-yellow-500 font-mono font-bold drop-shadow-md">{formatNumber(player.coins)}</span>
               </div>
               <div className="flex flex-col items-start md:items-end">
                 <span className="text-xs text-cyan-400 uppercase font-black flex items-center gap-1.5 mb-1"><Zap size={12}/> SP</span>
                 <span className="text-base text-cyan-400 font-mono font-bold drop-shadow-md">{formatNumber(availableSP)}</span>
               </div>
               <div className="flex flex-col items-start md:items-end">
                 <span className="text-xs text-rose-500 uppercase font-black flex items-center gap-1.5 mb-1"><Sword size={12}/> 連擊</span>
                 <span className={`text-base text-rose-500 font-mono font-bold drop-shadow-md transition-all duration-500 flex items-center gap-1 ${comboMultiplier > 2.0 ? 'text-rose-300 scale-110 animate-pulse drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]' : ''}`}>
                   x{comboMultiplier.toFixed(2)}
                   {maxStreakShields > 0 && <span className="text-cyan-400 text-xs ml-1 flex items-center">🛡️{player.streakShields}</span>}
                 </span>
               </div>
               <div className="flex flex-col items-start md:items-end font-bold">
                 <span className="text-xs text-emerald-400 uppercase font-black flex items-center gap-1.5 mb-1"><Clover size={12}/> 氣運</span>
                 <span className={`text-base text-emerald-400 font-mono font-bold drop-shadow-md transition-all duration-500 ${getMultiplier('luck_floor') > 1.5 ? 'text-yellow-400 scale-110 animate-bounce drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]' : ''}`}>
                   x{getMultiplier('luck_floor').toFixed(2)}
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
                    <div className="h-full bg-rose-500 transition-all duration-1000 shadow-[0_0_10px_#f43f5e]" style={{ width: `${(player.vitality/maxVitality)*100}%` }}></div>
                </div>
            </div>
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between text-xs uppercase font-black opacity-60 tracking-widest text-white"><span>修為進度</span><span>{formatNumber(player.qi)} / {formatNumber(player.qiToNext)}</span></div>
              <div className="h-2.5 bg-black/60 rounded-full overflow-hidden shadow-inner"><div className={`h-full ${mode === 'break' ? 'bg-cyan-500' : `bg-${currentRealmData.color}-500`} transition-all duration-1000 shadow-[0_0_10px_currentColor]`} style={{ width: `${(player.qi/player.qiToNext)*100}%` }}></div></div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-5">
           <div className="flex overflow-x-auto py-5 px-4 gap-8 bg-black/40 rounded-xl border border-white/10 flex-shrink-0 custom-scrollbar">
             {REALMS.map((r, i) => (<div key={i} className={`flex flex-col items-center min-w-[90px] transition-all relative ${i===player.realmIndex?'scale-110 opacity-100':'opacity-40'}`}><div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-black text-sm rotate-45 transition-all ${i===player.realmIndex?'bg-white text-black rotate-0 shadow-2xl':'border-white/20 text-white'}`}><span>{i}</span></div><span className="text-xs font-black mt-5 whitespace-nowrap uppercase tracking-tighter">{r.name}</span></div>))}
           </div>
        </div>
      </div>

      <div className={`w-full max-w-4xl bg-slate-900/40 backdrop-blur-3xl p-8 md:p-14 rounded-2xl border ${mode === 'break' ? 'border-cyan-500/30' : 'border-white/10'} text-center mb-8 z-10 shadow-2xl transition-all duration-700 ${isActive ? (mode === 'break' ? 'scale-[1.02] shadow-[0_0_50px_rgba(6,182,212,0.15)]' : 'scale-[1.02] shadow-[0_0_50px_rgba(16,185,129,0.15)] border-emerald-500/30') : ''}`}>
        
        <div className="grid grid-cols-2 sm:flex sm:justify-center gap-4 md:gap-6 mb-12 font-bold max-w-[280px] sm:max-w-none mx-auto">
           {FOCUS_OPTIONS.map(opt => (
             <button key={opt.value} onClick={() => { if(!isActive) { if(mode==='break') setMode('focus'); setFocusDuration(opt.value); setTimeLeft(opt.value); }}} className={`w-full sm:w-auto px-6 py-3.5 rounded-full text-sm font-black border transition-all ${focusDuration === opt.value && mode === 'focus' ? 'bg-white text-black border-white shadow-lg' : 'bg-black/40 text-white/50 border-white/20 hover:text-white/90 hover:bg-white/10'}`}>
               {opt.label}
             </button>
           ))}
        </div>
        
        {mode === 'focus' ? (
          <>
            <div className={`flex justify-center items-center gap-3 mb-2 text-sm md:text-base tracking-[0.6em] font-black uppercase transition-colors ${monster.name.includes('瓶頸') || monster.name.includes('劫') ? 'text-rose-500 animate-pulse' : 'text-rose-400'}`}>
              <Compass size={18}/> {monster.name}
            </div>
            <div className="w-full max-w-xs mx-auto bg-black/60 rounded-full h-2.5 mb-1 overflow-hidden border border-white/10 shadow-inner">
               <div className="bg-gradient-to-r from-rose-900 to-rose-500 h-full transition-all duration-500 shadow-[0_0_10px_#f43f5e]" style={{ width: `${(monster.hp / monster.maxHp) * 100}%` }}></div>
            </div>
            <div className="text-[10px] font-mono text-white/40 text-center mb-10">{formatNumber(monster.hp)} / {formatNumber(monster.maxHp)}</div>
          </>
        ) : (
          <div className="flex justify-center items-center gap-3 mb-10 text-sm md:text-base tracking-[0.6em] font-black uppercase text-cyan-400 animate-pulse">
            <CloudLightning size={18}/> 靈氣反哺．吐納調息中
          </div>
        )}

        <div className={`text-[5.5rem] sm:text-8xl md:text-[12rem] font-mono leading-none font-black tracking-tighter mb-14 transition-all duration-700 ${isActive ? (mode === 'break' ? 'text-cyan-300 drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]' : 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]') : 'text-white/30'}`}>
          {formatTime(timeLeft)}
        </div>
        
        <div className="flex justify-center gap-6 md:gap-8 font-bold">
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
      </div>

      <div className={`w-full max-w-4xl mt-4 transition-all duration-500 z-10 font-bold ${isActive ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}>
        <div className="bg-slate-950/90 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-2xl flex flex-col h-[800px] overflow-hidden">
          <div className="flex bg-black/80 border-b border-white/10 p-2 gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
            {[
              { id: 'skills', label: '功法祕籍', icon: ScrollText },
              { id: 'forge', label: '洞府淬煉', icon: Hammer },
              { id: 'artifacts', label: '法寶庫', icon: Box },
              { id: 'insights', label: '識海投影', icon: Activity },
              { id: 'log', label: '修行日誌', icon: History }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-4 md:py-5 rounded-xl text-xs md:text-sm font-black uppercase flex flex-col items-center justify-center gap-2 transition-all min-w-[80px] ${activeTab===tab.id ? 'bg-white/15 text-white shadow-inner border border-white/20' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}>
                <tab.icon size={18} className="md:size-[20px]"/> <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-5 md:p-10 overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'skills' && (
              <div className="space-y-14 animate-pop-in">
                <div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-white/20 pb-4 gap-4">
                    <h3 className="text-white/60 text-sm font-black uppercase tracking-widest">
                      凡俗根基 (SP 研習)
                    </h3>
                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                      <span className="text-cyan-400 font-mono">可用 SP: {formatNumber(availableSP)}</span>
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
                  <div><h3 className="text-white/60 text-sm font-black uppercase border-b border-white/20 pb-4 mb-8 tracking-widest">機緣祕籍 (13 種)</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {SECRET_BOOKS.map(book => { const lvl = player.secretBooks?.[book.id] || 0; const learned = lvl > 0; const upCost = Math.floor(10000 * Math.pow(2, lvl) * forgeDiscount); return (
                    <div key={book.id} className={`p-6 rounded-2xl border transition-all flex flex-col justify-between min-h-[16rem] ${learned ? 'bg-emerald-950/40 border-emerald-500/50 shadow-xl' : 'bg-black/60 border-white/10 opacity-60'}`}>
                        <div className="flex items-start gap-5"><div className={`p-4 rounded-xl ${learned ? 'bg-emerald-500 text-black shadow-lg' : 'bg-slate-800'}`}><BookOpen size={24}/></div><div className="flex-1"><h4 className="font-black text-base tracking-widest text-white">{book.name} {learned && <span className="text-xs opacity-60 ml-2 font-mono">Lv.{lvl}</span>}</h4><p className="text-sm opacity-70 leading-relaxed mt-2 text-white">{learned ? book.desc : '擊殺強敵機率獲得。'}</p></div></div>
                        {learned && lvl < 5 && <button onClick={() => handleUpgradeSecret(book.id)} disabled={player.coins < upCost || availableSP < 1} className="mt-6 w-full py-4 bg-white/10 hover:bg-emerald-600 text-white rounded-xl text-sm font-black border border-white/20 transition-all disabled:opacity-30">參悟升級 (${formatNumber(upCost)} 靈石 + 1 SP)</button>}
                    </div>
                  );})}
                  </div></div>
              </div>
            )}
            {activeTab === 'forge' && (
              <div className="space-y-14 animate-pop-in pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  <div className="p-8 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 min-h-[16rem] flex flex-col justify-between group shadow-xl shadow-emerald-900/20">
                    <div><h3 className="text-emerald-400 font-black text-xl tracking-tighter uppercase flex items-center gap-3"><Pill size={24}/> 煉製回春丹</h3><p className="text-white/70 text-sm mt-3 italic tracking-widest leading-relaxed">恢復 50% 最大氣血。</p></div>
                    <button onClick={handleHeal} disabled={player.coins < healCost || player.vitality >= maxVitality} className="w-full py-5 bg-emerald-900/80 hover:bg-emerald-600 text-emerald-100 rounded-xl font-black uppercase text-sm transition-all disabled:opacity-40 border border-emerald-500/50 mt-6">{player.vitality >= maxVitality ? '氣血已滿' : `煉丹 (${formatNumber(healCost)} 靈石)`}</button>
                  </div>
                  <div className="p-8 rounded-2xl bg-white/10 border border-white/20 min-h-[16rem] flex flex-col justify-between group"><div><h3 className="text-white font-black text-xl tracking-tighter uppercase">凝練劍光</h3><p className="text-white/60 text-sm mt-3 italic tracking-widest">基礎戰力 +100。</p></div><button onClick={() => { if(player.coins >= upgCostAtk) setPlayer(p => ({ ...p, coins: p.coins - upgCostAtk, baseCombat: p.baseCombat + 100 })) }} disabled={player.coins < upgCostAtk} className="w-full py-5 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl font-black uppercase text-sm tracking-widest shadow-xl transition-all disabled:opacity-30 mt-6">祭煉 ({formatNumber(upgCostAtk)} 靈石)</button></div>
                  <div className="p-8 rounded-2xl bg-white/10 border border-white/20 min-h-[16rem] flex flex-col justify-between group"><div><h3 className="text-white font-black text-xl tracking-tighter uppercase">熬煉肉身</h3><p className="text-white/60 text-sm mt-3 italic tracking-widest">氣血上限 +100。</p></div><button onClick={() => { if(player.coins >= upgCostHp) setPlayer(p => ({ ...p, coins: p.coins - upgCostHp, baseMaxVitality: p.baseMaxVitality + 100, vitality: p.vitality + 100 })) }} disabled={player.coins < upgCostHp} className="w-full py-5 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl font-black uppercase text-sm tracking-widest shadow-xl transition-all disabled:opacity-30 mt-6">熬煉 ({formatNumber(upgCostHp)} 靈石)</button></div>
                </div>
                <div className="space-y-6">
                   <h3 className="text-white/60 text-sm font-black uppercase border-b border-white/20 pb-4">陣法樞紐</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      <div className="bg-white/10 p-8 rounded-2xl border border-white/20 min-h-[14rem] flex flex-col justify-between shadow-inner"><div className="flex justify-between text-base text-white font-bold drop-shadow-md">聚靈大陣 <span className="opacity-60 font-mono">Lv.{player.arrays?.qi||0}</span></div><p className="text-sm opacity-70 italic mt-2">靈氣獲取提升 +5%/級</p><button onClick={() => { if(player.coins >= arrayQiCost) setPlayer(p => ({ ...p, coins: p.coins - arrayQiCost, arrays: {...p.arrays, qi: (p.arrays?.qi||0)+1} })) }} disabled={player.coins < arrayQiCost} className="w-full py-4 mt-6 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl text-sm font-black border border-white/20 transition-all disabled:opacity-30">升級 ({formatNumber(arrayQiCost)} 靈石)</button></div>
                      <div className="bg-white/10 p-8 rounded-2xl border border-white/20 min-h-[14rem] flex flex-col justify-between shadow-inner"><div className="flex justify-between text-base text-white font-bold drop-shadow-md">顛倒五行陣 <span className="opacity-60 font-mono">Lv.{player.arrays?.def||0}</span></div><p className="text-sm opacity-70 italic text-white mt-2">反噬減傷提升 +5%/級</p><button onClick={() => { if(player.coins >= arrayDefCost) setPlayer(p => ({ ...p, coins: p.coins - arrayDefCost, arrays: {...p.arrays, def: (p.arrays?.def||0)+1} })) }} disabled={player.coins < arrayDefCost} className="w-full py-4 mt-6 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl text-sm font-black border border-white/20 transition-all disabled:opacity-30">升級 ({formatNumber(arrayDefCost)} 靈石)</button></div>
                   </div>
                </div>
                <div className="bg-gradient-to-br from-white/10 to-transparent p-8 md:p-14 rounded-2xl border border-white/20 text-center relative overflow-hidden mt-8">
                  <h3 className="text-white font-black text-2xl uppercase mb-8 tracking-widest flex items-center justify-center gap-3"><Compass className="text-yellow-400"/> 萬寶樓尋寶</h3>
                  <div className="flex justify-center gap-6 mb-12 overflow-x-auto pb-6 custom-scrollbar">
                     {Object.entries(RARITY).map(([k, r]) => (<div key={k} className="flex flex-col items-center min-w-[80px] opacity-80"><span className={`text-xs font-black uppercase ${r.color} drop-shadow-md`}>{r.name}</span><span className="text-sm font-mono mt-2 text-white">{(r.weight*100*getMultiplier('luck_floor')).toFixed(1)}%</span></div>))}
                  </div>
                  <button onClick={handleGacha} disabled={player.coins < gachaCost} className="px-8 md:px-20 py-6 md:py-8 bg-white/15 hover:bg-white text-white hover:text-black font-black rounded-2xl shadow-2xl transition-all whitespace-nowrap border border-white/30 disabled:opacity-30 flex items-center justify-center gap-4 mx-auto text-base md:text-lg"><Sparkles size={24}/> 尋寶 ({formatNumber(gachaCost)} 靈石)</button>
                </div>
              </div>
            )}
            {activeTab === 'artifacts' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 animate-pop-in pb-10">
                {ARTIFACT_POOL.map(art => {
                  const unlocked = (player.artifacts || []).includes(art.id), lvl = player.artifactLvls?.[art.id]||0, cost = Math.floor(RARITY_BASE_COST[art.rarity]*Math.pow(1.8,lvl)*forgeDiscount);
                  return unlocked ? (
                    <div key={art.id} className={`p-8 rounded-2xl border bg-black/60 border-white/20 flex flex-col justify-between shadow-inner min-h-[16rem]`}><div className="z-10"><h4 className={`font-black text-xl ${RARITY[art.rarity].color} tracking-tighter drop-shadow-md`}>{art.name} <span className="opacity-60 text-xs float-right font-mono text-white mt-1">Lv.{lvl}</span></h4><p className="text-sm text-white/70 mt-5 italic leading-relaxed uppercase tracking-widest">「{art.desc}」</p></div>{lvl < 5 && <button onClick={()=>handleUpgradeArtifact(art.id, art.rarity)} disabled={player.coins < cost} className="mt-8 w-full py-4 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl text-sm font-black transition-all border border-white/20 disabled:opacity-30">血煉 ({formatNumber(cost)} 靈石)</button>}</div>
                  ) : <div key={art.id} className="p-8 rounded-2xl border-2 border-dashed border-white/10 bg-black/50 flex flex-col items-center justify-center opacity-50 min-h-[16rem]"><EyeOff size={40} className="text-white/30 mb-5"/><p className="text-xs font-black text-white/50 uppercase tracking-[0.3em]">寶光內斂：{RARITY[art.rarity].name}</p></div>;
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
          
          {/* ========== 系統說明按鈕列 (優化手機網格排版) ========== */}
          <div className="w-full max-w-md grid grid-cols-3 gap-2 sm:gap-4 mb-4 mx-auto">
             <button onClick={() => setShowGuide(true)} className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black text-emerald-400 hover:text-emerald-300 transition-all bg-white/5 hover:bg-white/10 py-3 px-1 sm:px-6 sm:py-3.5 rounded-2xl sm:rounded-full border border-white/10 backdrop-blur-md shadow-lg tracking-widest">
               <HelpCircle size={16}/> <span className="whitespace-nowrap">修行指引</span>
             </button>
             <button onClick={() => setShowStatsReport(true)} className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black text-cyan-400 hover:text-cyan-300 transition-all bg-white/5 hover:bg-white/10 py-3 px-1 sm:px-6 sm:py-3.5 rounded-2xl sm:rounded-full border border-white/10 backdrop-blur-md shadow-lg tracking-widest">
               <BarChart3 size={16}/> <span className="whitespace-nowrap">屬性極限</span>
             </button>
             <button onClick={() => setShowRealmGuide(true)} className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black text-white/60 hover:text-white transition-all bg-white/5 hover:bg-white/10 py-3 px-1 sm:px-6 sm:py-3.5 rounded-2xl sm:rounded-full border border-white/10 backdrop-blur-md shadow-lg tracking-widest">
               <BookOpen size={16}/> <span className="whitespace-nowrap">境界全覽</span>
             </button>
          </div>
          {/* ========================================== */}

          <p className="leading-relaxed">《凡人修仙傳》原著設定歸作者 忘語 所有</p>
          <p className="opacity-80 leading-loose">
            Created by <a href="https://www.facebook.com/profile.php?id=100084000897269" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline transition-all text-white">fb/指數三寶飯</a> 
            <br className="block sm:hidden mt-2" />
            <span className="sm:ml-3">with Gemini</span>
          </p>
          <button onClick={()=>{if(window.confirm('【天道輪迴】\n確定要刪除所有進度，重新投胎轉世嗎？\n所有成果將灰飛煙滅。')) { localStorage.clear(); window.location.reload(); }}} className="opacity-60 hover:opacity-100 transition-opacity border border-white/30 px-6 py-3 rounded-full text-xs tracking-widest hover:bg-rose-900/60 hover:border-rose-500/60 hover:text-rose-200 mt-4 flex items-center gap-2"><RefreshCw size={14}/> 輪迴轉世 (刪檔)</button>
        </footer>
      </div>
    </div>
  );
}

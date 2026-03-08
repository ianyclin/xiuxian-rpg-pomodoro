import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Square, Skull, Shield, Zap, Flame, Wind, Coins, Hammer, Box, ScrollText, Network, AlertTriangle, EyeOff, Crown, ChevronsUp, RefreshCw, Zap as Lightning, CloudLightning, Info, Eye, Activity, Sparkles, Sword, Compass, Clover, Lock, BookOpen, X, History, BarChart3, Save, Pill, HelpCircle, Lightbulb, ShieldAlert, ThermometerSun } from 'lucide-react';

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
  { id: 'a11', rarity: 'UNCOMMON', name: '子母刃', desc: '奇門暗器 (戰力+8%，爆擊率+8%)', val: { atk: 0.08, crit: 0.08 } },
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
  { id: 'a53', rarity: 'MYTHIC', name: '玄天如意刃', desc: '斬裂虛空 (連擊上限+80%，爆傷+80%/級)', val: { streak_cap: 0.80, crit_dmg: 0.80 } },
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
  { id: 's_10', rarity: 'LEGENDARY', name: '驚蟄十二變', desc: '變身真靈。氣血+35%，爆擊有機率回血2%', val: { hp: 0.35, lifesteal: 0.02 } },
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

export default function App() {
  const defaultPlayerState = { 
    realmIndex: 0, qi: 0, qiToNext: 250, vitality: 100, baseMaxVitality: 100, coins: 0, baseCombat: 150, 
    artifacts: [], artifactLvls: {}, basicSkills: {}, secretBooks: {}, arrays: { qi: 0, def: 0 }, 
    streakCount: 0, streakShields: 0, luck: 1.0, totalFocusTime: 0, history: [], hasAscended: false,
    logs: ['【系統】天道印記已連結，V69.4.0 登仙版載入。'] 
  };

  const [player, setPlayer] = useState(() => {
    try {
      const saved = localStorage.getItem('xianxia_master_v69_4');
      if (saved) return { ...defaultPlayerState, ...JSON.parse(saved) };
      return defaultPlayerState;
    } catch (e) { return defaultPlayerState; }
  });

  const [sessionLuck, setSessionLuck] = useState(1.0);
  useEffect(() => { setSessionLuck(0.8 + Math.random() * 0.5); }, []);

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

  const getMultiplier = (type) => {
    let mult = 1.0;
    BASIC_SKILLS.forEach(s => { if (player.basicSkills?.[s.id] > 0 && s.val?.[type]) mult += s.val[type] * player.basicSkills[s.id]; });
    const processItem = (item, lvl) => { if (item?.val?.[type]) mult += item.val[type] * (1 + lvl * 0.5); };
    Object.entries(player.secretBooks || {}).forEach(([id, lvl]) => { processItem(SECRET_BOOKS.find(x => x.id === id), lvl); });
    (player.artifacts || []).forEach(id => { processItem(ARTIFACT_POOL.find(a => a.id === id), (player.artifactLvls?.[id] || 0)); });
    
    // V69.4 Sword Synergy & Luck
    if (type === 'atk' || type === 'streak_cap') {
      const swordCount = (player.artifacts || []).filter(id => ARTIFACT_POOL.find(a => a.id === id)?.tags?.includes('sword')).length;
      if (swordCount >= 2) mult += 0.2 * (swordCount - 1);
    }
    if (type === 'luck_floor') mult *= sessionLuck;
    if (type === 'qi' && (player.arrays?.qi || 0)) mult += player.arrays.qi * 0.05;
    if (type === 'def' && (player.arrays?.def || 0)) mult += player.arrays.def * 0.05;
    return mult;
  };

  // Logic Calculations
  const rawEvade = getMultiplier('evade') - 1;
  const evadeRate = Math.min(0.75, rawEvade);
  const overflowEvade = Math.max(0, rawEvade - 0.75);
  const rawCrit = getMultiplier('crit') - 1;
  const critRate = Math.min(0.95, rawCrit);
  const overflowCrit = Math.max(0, rawCrit - 0.95);
  const streakCap = Math.min(4.0, 0.5 + (getMultiplier('streak_cap') - 1) + (overflowEvade * 0.5));
  const streakEff = getMultiplier('streak_eff');
  const comboMultiplier = 1 + Math.min(streakCap, (player.streakCount || 0) * 0.05 * streakEff);
  const critDmg = Math.min(20.0, 1.5 + (getMultiplier('crit_dmg') - 1) + (overflowCrit * 3.0));
  const currentCombatPower = Math.floor(player.baseCombat * getMultiplier('atk') * comboMultiplier);
  const maxVitality = Math.floor(player.baseMaxVitality * getMultiplier('hp'));
  const defMultiplier = getMultiplier('def');
  const forgeDiscount = Math.max(0.1, 1 - (getMultiplier('forge_discount') - 1));
  const healPct = Math.min(0.80, 0.35 + (getMultiplier('heal_bonus') - 1));
  const healCost = Math.floor((maxVitality * 1.0 + player.realmIndex * 100) * forgeDiscount);
  const gachaCost = Math.floor(5000 * Math.pow(1.15, player.realmIndex) * forgeDiscount);

  // States for Modals
  const [showRealmGuide, setShowRealmGuide] = useState(false);
  const [showStatsReport, setShowStatsReport] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideTab, setGuideTab] = useState('rules');
  const [activeTab, setActiveTab] = useState('skills');
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [targetEndTime, setTargetEndTime] = useState(null);
  const [monster, setMonster] = useState(() => ({ name: '墨大夫', hp: 120, maxHp: 120, tier: 1 }));
  const [showGiveUpWarning, setShowGiveUpWarning] = useState(false);
  const [celebration, setCelebration] = useState(null);

  // Sync Logic
  useEffect(() => { localStorage.setItem('xianxia_master_v69_4', JSON.stringify(player)); }, [player]);

  const addLog = (text) => {
    const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    setPlayer(p => ({ ...p, logs: [`[${timeStr}] ${text}`, ...(p.logs || [])].slice(0, 50) }));
  };

  const handleRegress = () => {
    if (player.realmIndex <= 0) return;
    if (window.confirm('散功重修將降低一個境界並洗去所有修為，換取重新配置技能點的機會。確認執行？')) {
        let newIdx = player.realmIndex - 1;
        let newQiToNext = 250;
        for(let i=0; i<newIdx; i++) newQiToNext = Math.floor(newQiToNext * 1.35);
        setPlayer(p => ({ ...p, realmIndex: newIdx, qi: 0, qiToNext: newQiToNext, basicSkills: {}, secretBooks: {}, logs: [`【散功】退回至 ${REALMS[newIdx].name}。`, ...(p.logs || [])] }));
    }
  };

  const handleComplete = () => {
    setIsActive(false); setTargetEndTime(null);
    const passiveQi = Math.floor(50 * Math.pow(1.18, player.realmIndex + 1) * getMultiplier('qi'));
    const passiveCoin = Math.floor(50 * Math.pow(1.15, player.realmIndex + 1) * getMultiplier('stone'));
    setPlayer(p => {
        let nQi = p.qi + passiveQi; let nRealm = p.realmIndex; let nQiToNext = p.qiToNext;
        if (nQi >= nQiToNext && nRealm < REALMS.length - 1) { nRealm++; nQi = 0; nQiToNext = Math.floor(nQiToNext * 1.35); setCelebration({ name: REALMS[nRealm].name }); }
        return { ...p, qi: nQi, realmIndex: nRealm, qiToNext: nQiToNext, coins: p.coins + passiveCoin, streakCount: p.streakCount + 1, totalFocusTime: p.totalFocusTime + (25*60) };
    });
    setSessionLuck(0.8 + Math.random() * 0.5);
    addLog(`[功成] 獲修為 ${passiveQi.toLocaleString()}，氣運重骰。`);
  };

  return (
    <div className="min-h-screen text-slate-300 font-mono p-4 flex flex-col items-center bg-[#020617] relative pt-10">
      
      {/* --- TOP BAR --- */}
      <div className="fixed top-0 left-0 w-full bg-emerald-950/90 text-[10px] sm:text-xs py-2 text-center font-black tracking-widest z-[600] border-b border-emerald-500/30 flex items-center justify-center gap-6 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
        <div className="flex items-center gap-1.5 text-emerald-400"><Network size={14} className="animate-pulse" /> <span>三千世界運轉: {globalStats.focus.toLocaleString()}</span></div>
        <div className="flex items-center gap-1.5 text-yellow-400"><Crown size={14} className="animate-pulse" /> <span>飛升仙人: {globalStats.ascensions.toLocaleString()}</span></div>
      </div>

      {/* --- FATE PILL --- */}
      <div className="fixed top-20 left-4 z-50 flex items-center gap-2 bg-purple-900/80 text-purple-200 px-4 py-2 rounded-full text-xs font-bold border border-purple-500/30">
        <ThermometerSun size={14} className="animate-spin-slow"/> 今日氣運: {sessionLuck.toFixed(2)}x
      </div>

      {/* --- REALM GUIDE MODAL --- */}
      {showRealmGuide && (
        <div className="fixed inset-0 z-[700] bg-black/95 backdrop-blur-xl p-4 md:p-8 flex flex-col items-center justify-center font-bold">
          <div className="w-full max-w-4xl flex flex-col max-h-[80vh] bg-slate-900/50 p-6 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 flex-shrink-0">
               <h2 className="text-xl md:text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3"><BookOpen className="text-emerald-500"/> 天道經緯 (境界全覽)</h2>
               <button onClick={() => setShowRealmGuide(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white"><X size={24}/></button>
            </div>
            <div className="w-full overflow-y-auto custom-scrollbar bg-black/40 rounded-xl border border-white/5 flex-1">
              <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead><tr className="text-xs text-white/30 uppercase border-b border-white/5"><th className="py-4 px-4">位階範圍</th><th className="py-4 px-4">境界名號</th><th className="py-4 px-4">神識導讀</th></tr></thead>
                  <tbody>{GUIDE_REALMS.map((r, i) => (<tr key={i} className="border-b border-white/5 hover:bg-white/5"><td className="py-4 px-4 font-mono text-xs text-white/30">{r.range}</td><td className="py-4 px-4 font-black text-sm text-white/80">{r.name}</td><td className="py-4 px-4 text-xs text-white/50 italic">{r.desc}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- STATS REPORT MODAL --- */}
      {showStatsReport && (
        <div className="fixed inset-0 z-[700] bg-black/95 backdrop-blur-xl p-4 flex flex-col items-center justify-center font-bold">
          <div className="w-full max-w-2xl bg-slate-900/50 p-8 rounded-2xl border border-cyan-900/50 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4 flex-shrink-0">
               <h2 className="text-xl font-black text-cyan-400 tracking-widest uppercase flex items-center gap-3"><BarChart3 size={24}/> 屬性極限與轉化報告</h2>
               <button onClick={() => setShowStatsReport(false)} className="p-2 hover:bg-white/10 rounded-full text-white/50"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xs text-white/40 uppercase border-b border-white/5 pb-2">基礎倍率</h3>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">總戰力加成</span><span className="text-rose-400 font-mono">x{getMultiplier('atk').toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">氣血上限加成</span><span className="text-rose-400 font-mono">x{getMultiplier('hp').toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">靈氣獲取倍率</span><span className="text-cyan-400 font-mono">x{getMultiplier('qi').toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">靈石掉落倍率</span><span className="text-yellow-400 font-mono">x{getMultiplier('stone').toFixed(2)}</span></div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs text-white/40 uppercase border-b border-white/5 pb-2">天道法則 (V69.4)</h3>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">休息回血比例</span><span className="text-emerald-400 font-mono">{(healPct * 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 flex flex-col">爆擊率 <span className="text-[10px] opacity-50">溢出爆傷 1:3</span></span>
                    <span className="text-purple-400 font-mono">{(critRate * 100).toFixed(1)}% (+{(overflowCrit*300).toFixed(0)}% 爆傷)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 flex flex-col">閃避免傷率 <span className="text-[10px] opacity-50">溢出連擊 1:0.5</span></span>
                    <span className="text-emerald-400 font-mono">{(evadeRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">連擊增傷上限</span><span className="text-rose-400 font-mono">+{((streakCap - 0.5) * 100).toFixed(0)}%</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- GUIDE MODAL --- */}
      {showGuide && (
        <div className="fixed inset-0 z-[700] bg-black/95 backdrop-blur-xl p-4 flex flex-col items-center justify-center font-bold">
          <div className="w-full max-w-2xl bg-slate-900/50 p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
               <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-3"><HelpCircle className="text-emerald-400"/> 修行指引</h2>
               <button onClick={() => setShowGuide(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/50"><X size={24}/></button>
            </div>
            <div className="flex gap-2 bg-black/40 p-1 rounded-lg mb-6 flex-shrink-0">
               <button onClick={() => setGuideTab('rules')} className={`flex-1 py-3 text-xs font-bold rounded ${guideTab === 'rules' ? 'bg-white/10 text-white' : 'text-white/40'}`}>基礎法則</button>
               <button onClick={() => setGuideTab('tips')} className={`flex-1 py-3 text-xs font-bold rounded ${guideTab === 'tips' ? 'bg-amber-500/20 text-amber-400' : 'text-amber-400/40'}`}>修行祕訣 (Tips)</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
              {guideTab === 'rules' ? (
                <>
                  <section className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <h3 className="text-emerald-400 text-sm mb-2 font-black flex items-center gap-2"><Play size={16}/> 運轉周天</h3>
                    <p className="text-xs text-white/70">完成計時唯有擊殺妖獸或運轉圓滿才能獲得爆量資源。</p>
                  </section>
                  <section className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <h3 className="text-rose-400 text-sm mb-2 font-black flex items-center gap-2"><Zap size={16}/> SP 獲取</h3>
                    <p className="text-xs text-white/70">每晉升一個大境界獲得 5 點，小境界獲得 3 點，用於研習功法。</p>
                  </section>
                </>
              ) : (
                <>
                  <section className="bg-white/5 p-4 rounded-lg border-l-4 border-emerald-500">
                    <h3 className="text-emerald-400 text-sm mb-2 font-black">青元劍陣 (V69.4)</h3>
                    <p className="text-xs text-white/70">裝備 2 把以上劍類法寶將觸發共鳴，每多一把劍，全體威力提升 20%。</p>
                  </section>
                  <section className="bg-white/5 p-4 rounded-lg border-l-4 border-rose-500">
                    <h3 className="text-rose-400 text-sm mb-2 font-black">屬性溢出轉化</h3>
                    <p className="text-xs text-white/70">爆擊超過 95% 或閃避超過 75% 時，多餘部分會按比例轉化為爆傷與連擊上限。</p>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- CELEBRATION MODAL --- */}
      {celebration && (
        <div className="fixed inset-0 z-[800] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-12 cursor-pointer font-bold" onClick={() => setCelebration(null)}>
          <Crown size={80} className="text-yellow-500 mb-6 animate-bounce" />
          <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-widest">突破瓶頸</h2>
          <p className="text-xl text-emerald-400 font-light">【{celebration.name}】</p>
        </div>
      )}

      {/* --- DASHBOARD --- */}
      <div className="w-full max-w-4xl mb-6 z-10 font-bold px-2 mt-10">
        <div className="bg-slate-900/50 backdrop-blur-3xl p-6 rounded-xl border border-white/10 relative shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-4">
               <Shield size={36} className="text-emerald-400"/>
               <div>
                  <h2 className="text-2xl font-black tracking-widest text-white uppercase">{REALMS[player.realmIndex].name}</h2>
                  <p className="text-xs text-emerald-400 opacity-80 italic">氣運: {getMultiplier('luck_floor').toFixed(2)}x | 連擊: x{comboMultiplier.toFixed(2)}</p>
               </div>
            </div>
            <div className="flex gap-6 text-right w-full md:w-auto justify-end">
                <div><span className="text-[10px] text-yellow-500 block uppercase font-black">靈石</span><span className="text-lg font-mono text-yellow-500">{Math.floor(player.coins).toLocaleString()}</span></div>
                <div><span className="text-[10px] text-cyan-400 block uppercase font-black">SP</span><span className="text-lg font-mono text-cyan-400">{availableSP}</span></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-white/50 uppercase"><span>氣血真元</span><span>{player.vitality} / {maxVitality}</span></div>
              <div className="h-2 bg-black/60 rounded-full overflow-hidden"><div className="h-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" style={{ width: `${(player.vitality/maxVitality)*100}%` }}></div></div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-white/50 uppercase"><span>修為進度</span><span>{player.qi} / {player.qiToNext}</span></div>
              <div className="h-2 bg-black/60 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" style={{ width: `${(player.qi/player.qiToNext)*100}%` }}></div></div>
            </div>
          </div>
          {/* Dashboard Actions */}
          <div className="flex flex-wrap justify-center md:justify-end gap-3">
             <button onClick={() => setShowGuide(true)} className="flex items-center gap-2 text-[10px] font-black text-emerald-400 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10"><HelpCircle size={14}/> 修行指引</button>
             <button onClick={() => setShowStatsReport(true)} className="flex items-center gap-2 text-[10px] font-black text-cyan-400 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10"><BarChart3 size={14}/> 屬性極限</button>
             <button onClick={() => setShowRealmGuide(true)} className="flex items-center gap-2 text-[10px] font-black text-white/60 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10"><BookOpen size={14}/> 境界全覽</button>
          </div>
        </div>
      </div>

      {/* --- TIMER SECTION --- */}
      <div className="w-full max-w-4xl bg-slate-900/40 backdrop-blur-3xl p-10 md:p-14 rounded-2xl border border-white/10 text-center mb-8 z-10 transition-all">
        <div className="text-sm tracking-[0.5em] text-white/30 uppercase mb-4 flex items-center justify-center gap-2"><Compass size={16}/> 當前對峙：{monster.name}</div>
        <div className="text-7xl md:text-9xl font-mono font-black tracking-tighter mb-10 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
          {Math.floor(timeLeft/60).toString().padStart(2,'0')}:{(timeLeft%60).toString().padStart(2,'0')}
        </div>
        <div className="flex justify-center gap-6">
          {!isActive ? (
            <button onClick={() => { setIsActive(true); setTargetEndTime(Date.now() + timeLeft*1000); addLog("[運轉] 靈壓激發。"); }} className="px-12 py-5 bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 rounded-2xl text-xl font-black transition-all shadow-xl">運轉周天</button>
          ) : (
            <button onClick={() => handleComplete()} className="px-12 py-5 bg-rose-950/50 text-rose-400 border border-rose-500/40 rounded-2xl text-xl font-black">強行出關</button>
          )}
        </div>
      </div>

      {/* --- TABS SECTION --- */}
      <div className="w-full max-w-4xl z-10 font-bold mb-20">
        <div className="bg-slate-950/90 backdrop-blur-3xl rounded-2xl border border-white/10 h-[700px] overflow-hidden flex flex-col shadow-2xl">
          <div className="flex bg-black/80 border-b border-white/10 p-2 gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'skills', label: '功法祕籍', icon: ScrollText },
              { id: 'forge', label: '洞府淬煉', icon: Hammer },
              { id: 'artifacts', label: '法寶庫', icon: Box },
              { id: 'log', label: '修行日誌', icon: History }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-4 px-6 rounded-xl text-[10px] font-black uppercase flex flex-col items-center gap-2 transition-all ${activeTab===tab.id ? 'bg-white/10 text-white border border-white/20' : 'text-white/40'}`}>
                <tab.icon size={18}/> <span>{tab.label}</span>
              </button>
            ))}
          </div>
          
          <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'skills' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pop-in">
                <div className="col-span-full border-b border-white/10 pb-4 mb-4 flex justify-between items-center">
                  <h3 className="text-white/60 text-xs font-black uppercase tracking-widest">功法研習 (可用 SP: {availableSP})</h3>
                  {player.realmIndex > 0 && <button onClick={handleRegress} className="text-[10px] px-3 py-1 bg-rose-900/30 text-rose-400 border border-rose-500/30 rounded hover:bg-rose-500 transition-all">散功重修</button>}
                </div>
                {BASIC_SKILLS.map(s => {
                  const lvl = player.basicSkills?.[s.id] || 0;
                  return (
                    <div key={s.id} className="p-5 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center group">
                      <div><h4 className="text-white text-sm font-black">{s.name}</h4><p className="text-[10px] text-white/50 italic">{s.desc}</p></div>
                      <button onClick={() => availableSP >= 1 && lvl < s.maxLvl && setPlayer(p => ({...p, basicSkills: {...p.basicSkills, [s.id]: lvl+1}}))} disabled={availableSP < 1 || lvl >= s.maxLvl} className="px-4 py-2 bg-cyan-900/50 text-cyan-400 rounded-lg text-xs font-black disabled:opacity-20">研習 Lv.{lvl}</button>
                    </div>
                  );
                })}
              </div>
            )}
            
            {activeTab === 'forge' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pop-in">
                <div className="p-6 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex flex-col justify-between h-40">
                  <div><h4 className="text-emerald-400 font-black mb-2 flex items-center gap-2"><Pill size={16}/> 煉製回春丹</h4><p className="text-[10px] text-emerald-400/60 uppercase">瞬間恢復 100% 氣血</p></div>
                  <button onClick={() => player.coins >= healCost && setPlayer(p=>({...p, coins: p.coins-healCost, vitality: maxVitality}))} className="w-full py-3 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-black border border-emerald-500/30">服用 ({healCost.toLocaleString()} 靈石)</button>
                </div>
              </div>
            )}

            {activeTab === 'artifacts' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pop-in">
                {ARTIFACT_POOL.map(art => {
                  const unlocked = player.artifacts.includes(art.id);
                  return (
                    <div key={art.id} className={`p-4 border rounded-xl text-center flex flex-col items-center justify-center gap-2 ${unlocked ? 'border-white/20 bg-white/5' : 'border-dashed border-white/5 opacity-20'}`}>
                      <Box size={24} className={unlocked ? RARITY[art.rarity].color : 'text-white/20'}/>
                      <div className="text-[10px] font-black uppercase tracking-tighter">{unlocked ? art.name : '未獲得'}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'log' && (
              <div className="space-y-3 animate-pop-in">
                {player.logs.map((log, i) => <div key={i} className={`text-xs p-3 rounded-lg ${i===0?'bg-white/10 text-white':'text-white/40'}`}>{log}</div>)}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="py-20 text-center text-[10px] text-white/20 tracking-[0.5em] uppercase z-10 flex flex-col items-center gap-4">
          <p>© 2026 修仙專注 V69.4.0-Final-Alpha | 氣運：{sessionLuck.toFixed(2)}</p>
          <button onClick={()=>{if(window.confirm('確認進入輪迴？')) { localStorage.clear(); window.location.reload(); }}} className="border border-white/10 px-8 py-2 rounded-full hover:bg-rose-900 transition-all">輪迴轉世 (Reset All)</button>
      </footer>

    </div>
  );
}

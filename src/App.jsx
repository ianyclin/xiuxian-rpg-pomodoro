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
  { name: '煉氣境', desc: '吸納天地靈氣，洗髓易經。', color: 'emerald' },
  { name: '築基境', desc: '靈氣化液，凝結道基。', color: 'teal' },
  { name: '結丹境', desc: '丹田結丹，靈力固化。', color: 'blue' },
  { name: '元嬰境', desc: '碎丹成嬰，神魂不滅。', color: 'indigo' },
  { name: '化神境', desc: '溝通天地，具備飛升資格。', color: 'purple' },
  { name: '煉虛境', desc: '五行合一，化實為虛。', color: 'violet' },
  { name: '合體境', desc: '天人合一，法相實體化。', color: 'amber' },
  { name: '大乘境', desc: '掌握天地法則，道臻巔峰。', color: 'orange' }
];

const REALMS = [{ name: '一介凡人', desc: '凡夫俗子，尚未引氣入體。', majorName: '凡人', color: 'slate', isMajor: true }];
MAJOR_REALMS_DATA.forEach(major => {
  ['初期', '中期', '後期', '巔峰'].forEach((suffix, i) => {
    REALMS.push({ name: `${major.name.replace('境', '')}${suffix}`, desc: major.desc, isMajor: i === 0, majorName: major.name.replace('境', ''), color: major.color });
  });
});
REALMS.push({ name: '渡劫', desc: '九九重劫，成則登仙。', majorName: '渡劫', isMajor: true, color: 'rose' });

const ARTIFACT_POOL = [
  { id: 'a01', rarity: 'COMMON', name: '鐵木盾', desc: '抵禦外魔 (反噬減傷 +2%)', val: { def: 0.02 } },
  { id: 'a02', rarity: 'COMMON', name: '青銅戈', desc: '凡兵銳氣 (基礎戰力 +5%)', val: { atk: 0.05 } },
  { id: 'a03', rarity: 'COMMON', name: '凝神蒲團', desc: '固本培元 (回血+3%，修為+2%)', val: { heal_bonus: 0.03, qi: 0.02 } },
  { id: 'a04', rarity: 'COMMON', name: '粗糙靈石袋', desc: '聚財之陣 (靈石掉落 +8%)', val: { stone: 0.08 } },
  { id: 'a10', rarity: 'UNCOMMON', name: '神風舟', desc: '御風而行 (閃避率 +5%)', val: { evade: 0.05 } },
  { id: 'a11', rarity: 'UNCOMMON', name: '子母刃', desc: '奇門暗器 (戰力+10%，爆擊率+8%)', val: { atk: 0.10, crit: 0.08 } },
  { id: 'a12', rarity: 'UNCOMMON', name: '無形針', desc: '無影無蹤 (連擊效率+15%，爆擊+10%)', val: { streak_eff: 0.15, crit: 0.10 } },
  { id: 'a20', rarity: 'RARE', name: '青蛟旗', desc: '妖魂鎮壓 (戰力加成 +18%)', val: { atk: 0.18 } },
  { id: 'a21', rarity: 'RARE', name: '玄鐵飛天盾', desc: '堅不可摧 (反噬減傷 +20%)', val: { def: 0.20 } },
  { id: 'a30', rarity: 'EPIC', name: '虛天鼎 (仿)', desc: '鎮壓氣運 (減傷+20%，氣運保底+0.2)', val: { def: 0.20, luck_floor: 0.20 } },
  { id: 'a31', rarity: 'EPIC', name: '風雷翅', desc: '迅捷如雷 (連擊效率+40%，閃避+10%)', val: { streak_eff: 0.40, evade: 0.10 } },
  { id: 'a40', rarity: 'LEGENDARY', name: '八靈尺', desc: '空間封鎖 (連擊上限+40%，抵消雷劫反噬)', val: { streak_cap: 0.40, sense_def: 0.20 } },
  { id: 'a41', rarity: 'LEGENDARY', name: '青竹蜂雲劍', desc: '本命劍陣 (戰力+60%，效率+50%)', val: { atk: 0.60, streak_eff: 0.50, crit: 0.12 }, tags: ['sword'] },
  { id: 'a42', rarity: 'LEGENDARY', name: '大衍神君傀儡', desc: '替身擋災 (氣血+100%，護盾+1/級)', val: { hp: 1.00, streak_shield: 1.0 } }, 
  { id: 'a50', rarity: 'MYTHIC', name: '玄天斬靈劍', desc: '法則破壞 (戰力+180%，爆傷+180%)', val: { atk: 1.80, crit_dmg: 1.80 }, tags: ['sword'] },
  { id: 'a51', rarity: 'MYTHIC', name: '元磁神山', desc: '五行重力 (戰力/減傷 +100%)', val: { atk: 1.00, def: 1.00 } },
  { id: 'a52', rarity: 'MYTHIC', name: '虛天大鼎', desc: '鼎鎮山河 (折扣-50%，氣運保底+0.6)', val: { forge_discount: 0.50, luck_floor: 0.6 } }, 
  { id: 'a60', rarity: 'DIVINE', name: '掌天瓶', desc: '奪造化 (靈氣+400%，休息全恢復)', val: { qi: 4.00, stone: 2.00, auto_heal: 1.0 } },
  { id: 'a63', rarity: 'DIVINE', name: '金闕玉書', desc: '天書 (靈石+500%，氣運+0.8)', val: { stone: 5.00, luck_floor: 0.8 } },
];

const SECRET_BOOKS = [
  { id: 's_01', rarity: 'UNCOMMON', name: '羅煙步', desc: '閃避靈壓。閃避率 +10%/級', val: { evade: 0.10 } },
  { id: 's_03', rarity: 'RARE', name: '大衍決', desc: '神識預判。效率+20%，反噬減傷+20%/級', val: { streak_eff: 0.20, sense_def: 0.20 } }, 
  { id: 's_10', rarity: 'LEGENDARY', name: '驚蟄十二變', desc: '真靈變。氣血+40%，爆擊恢復3%', val: { hp: 0.40, lifesteal: 0.03 } }, 
  { id: 's_12', rarity: 'RARE', name: '百脈煉寶訣', desc: '肉身融寶。成本 -8%/級', val: { forge_discount: 0.08 } },
];

const BASIC_SKILLS = [
  { id: 'b_qi', name: '長春功', desc: '基礎靈氣提升 +15%/級', val: { qi: 0.15 }, maxLvl: 20 },
  { id: 'b_atk', name: '青元劍訣', desc: '基礎戰力提升 +15%/級', val: { atk: 0.15 }, maxLvl: 20 },
  { id: 'b_hp', name: '明王訣', desc: '基礎氣血提升 +15%/級', val: { hp: 0.15 }, maxLvl: 20 },
  { id: 'b_stone', name: '天眼術', desc: '靈石收益提升 +20%/級', val: { stone: 0.20 }, maxLvl: 20 },
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
    logs: ['【系統】天道印記連結，V71 資源均衡法則載入。'] 
  };

  const [player, setPlayer] = useState(() => {
    try {
      const saved = localStorage.getItem('xianxia_master_v71');
      if (saved) return { ...defaultPlayerState, ...JSON.parse(saved) };
      return defaultPlayerState;
    } catch (e) { return defaultPlayerState; }
  });

  const [saveIndicator, setSaveIndicator] = useState(false);
  const [globalStats, setGlobalStats] = useState({ focus: 0, ascensions: 0 });

  useEffect(() => {
    const statsRef = ref(database, 'globalStats');
    const unsubscribe = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setGlobalStats({ focus: data.totalFocusCount || 0, ascensions: data.totalAscensions || 0 });
    });
    return () => unsubscribe();
  }, []);

  const formatNum = (n) => Math.floor(n).toLocaleString('en-US');
  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  
  const generateMonsterState = (realmIdx) => {
    const nTier = realmIdx + 1;
    const isPeak = REALMS[realmIdx].name.includes('巔峰');
    const isFinal = realmIdx === REALMS.length - 1;
    const bossMult = isFinal ? 20 : (isPeak ? 4 : 1);
    const nHp = Math.floor(120 * Math.pow(1.22, nTier) * bossMult); // V71 Adjusted Curve
    const monsters = ['野狼幫眾', '墨大夫', '金光上人', '陸師兄', '黑煞教徒', '越皇化身', '鬼靈門王蟬', '血線蛟', '墨蛟', '土甲龍', '雙尾人面蠍', '溫天仁', '鐵甲煉屍', '慕蘭法士', '極陰祖師', '裂風獸風希', '六道極聖', '古魔血焰', '陰羅宗宗主', '化形毒蛟', '夜叉族守衛', '角蚩族戰尊', '六翼霜蚣', '銀甲屍王', '高階魔尊', '元剎聖祖化身', '噬金蟲王', '海王族大乘', '六極聖祖', '謫仙馬良', '始印神尊', '游天鯤鵬', '真靈羅睺', '螟蟲之母'];
    const mName = isFinal ? '【九九重劫】' : (isPeak ? `${monsters[Math.min(nTier, monsters.length-1)]} [大瓶頸]` : monsters[Math.min(nTier, monsters.length-1)]);
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
    localStorage.setItem('xianxia_master_v71', JSON.stringify(player)); 
    setSaveIndicator(true);
    const timer = setTimeout(() => setSaveIndicator(false), 2000);
    return () => clearTimeout(timer);
  }, [player]);

  const getMultiplier = (type) => {
    let mult = 1.0;
    BASIC_SKILLS.forEach(s => { if (player.basicSkills?.[s.id] > 0 && s.val?.[type]) mult += s.val[type] * player.basicSkills[s.id]; });
    const processItem = (item, lvl) => { if (item?.val?.[type]) mult += item.val[type] * (1 + lvl * 0.8); }; // V71 Blood Refining Buff
    Object.entries(player.secretBooks || {}).forEach(([id, lvl]) => { processItem(SECRET_BOOKS.find(x => x.id === id), lvl); });
    (player.artifacts || []).forEach(id => { processItem(ARTIFACT_POOL.find(a => a.id === id), (player.artifactLvls?.[id] || 0)); });
    
    // V71 Multi-Layered Resonance
    if (type === 'atk' || type === 'streak_cap') {
      const swordCount = (player.artifacts || []).filter(id => ARTIFACT_POOL.find(a => a.id === id)?.tags?.includes('sword')).length;
      if (swordCount >= 2) mult *= (1 + 0.15 * swordCount); 
    }
    return mult;
  };

  const currentRealmData = REALMS[player.realmIndex];
  const themeColorClass = `text-${currentRealmData.color}-400`;
  const themeBorderClass = `border-${currentRealmData.color}-500/20`;

  const rawEvade = getMultiplier('evade') - 1;
  const evadeRate = Math.min(0.75, rawEvade);
  const overflowEvade = Math.max(0, rawEvade - 0.75);

  const rawCrit = getMultiplier('crit') - 1;
  const critRate = Math.min(0.95, rawCrit);
  const overflowCrit = Math.max(0, rawCrit - 0.95);

  const streakCap = Math.min(6.0, 0.5 + (getMultiplier('streak_cap') - 1) + (overflowEvade * 0.5)); 
  const comboMultiplier = 1 + Math.min(streakCap, (player.streakCount || 0) * 0.06 * getMultiplier('streak_eff'));
  
  const maxStreakShields = Math.floor(getMultiplier('streak_shield') - 1);
  const critDmg = Math.min(25.0, 1.5 + (getMultiplier('crit_dmg') - 1) + (overflowCrit * 4.0)); 
  const reviveRate = Math.min(0.70, getMultiplier('revive') - 1);   
  const healPct = Math.min(0.90, 0.40 + (getMultiplier('heal_bonus') - 1));
  const defMultiplier = getMultiplier('def');
  const availableSP = (player.realmIndex * 2) - Object.values(player.basicSkills || {}).reduce((a, b) => a + b, 0);

  const upgCostAtk = Math.floor(1000 * Math.pow(1.18, (player.baseCombat - 150) / 100) * (1 / getMultiplier('forge_discount')));
  const upgCostHp = Math.floor(1000 * Math.pow(1.18, (player.baseMaxVitality - 100) / 100) * (1 / getMultiplier('forge_discount')));
  const gachaCost = Math.floor(5000 * Math.pow(1.12, player.realmIndex) * (1 / getMultiplier('forge_discount')));

  const addLog = (text) => {
    const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    setPlayer(p => ({ ...p, logs: [`[${timeStr}] ${text}`, ...(p.logs || [])].slice(0, 50) }));
  };

  const handleHeal = () => {
    const cost = Math.floor((player.baseMaxVitality * 0.5) * (1 / getMultiplier('forge_discount')));
    if (player.coins >= cost && player.vitality < (player.baseMaxVitality * getMultiplier('hp'))) {
      setPlayer(p => ({ ...p, coins: p.coins - cost, vitality: Math.min(p.baseMaxVitality * getMultiplier('hp'), p.vitality + (p.baseMaxVitality * getMultiplier('hp') * 0.5)) }));
      setIsHealing(true); setTimeout(() => setIsHealing(false), 800);
      addLog(`[煉丹] 吞服回春丹，耗費 ${cost.toLocaleString()} 靈石。`);
    }
  };

  const preCheckGiveUp = () => { if (monster.name.includes('瓶頸') || monster.name.includes('劫')) setShowGiveUpWarning(true); else executeGiveUp(); };

  const executeGiveUp = () => {
    setShowGiveUpWarning(false); setIsActive(false); setTargetEndTime(null);
    if (Math.random() < evadeRate) { addLog(`💨 【羅煙閃避】成功閃避神魂震盪！`); }
    else {
      setIsCollapsing(true); setTimeout(() => setIsCollapsing(false), 1000);
      const senseDef = getMultiplier('sense_def') - 1;
      const rawPenalty = Math.floor(((player.baseMaxVitality * getMultiplier('hp')) * 0.25 + monster.maxHp * 0.015) * (1 / defMultiplier) * (1 - senseDef));
      const penalty = Math.min(rawPenalty, player.vitality * 0.85);
      let nextHp = player.vitality - penalty;
      if (nextHp <= 0) {
        if (Math.random() < reviveRate) { nextHp = (player.baseMaxVitality * getMultiplier('hp')); addLog(`✨ 【涅槃重生】化險為夷！`); }
        else { nextHp = (player.baseMaxVitality * getMultiplier('hp')) * 0.5; setPlayer(p => ({ ...p, qi: Math.floor(p.qi * 0.75) })); addLog(`💀 【道基受損】損失 25% 當前修為。`); }
      } else { addLog(`🚨 【天道反噬】神魂震盪，承受 ${penalty.toLocaleString()} 傷害。`); }
      let nextStreak = (player.streakShields > 0) ? player.streakCount : 0;
      let nextShields = (player.streakShields > 0) ? player.streakShields - 1 : 0;
      if (player.streakShields > 0) addLog(`🛡️ 【法寶護主】消耗 1 層護盾，連擊存續！`);
      setPlayer(p => ({ ...p, vitality: nextHp, streakCount: nextStreak, streakShields: nextShields }));
    }
    setTimeLeft(focusDuration);
  };

  const handleComplete = () => {
    setIsActive(false); setTargetEndTime(null);
    if (mode === 'focus') {
      setIsAttacking(true); setTimeout(() => setIsAttacking(false), 500);
      try { update(ref(database, 'globalStats'), { totalFocusCount: increment(1) }); } catch (e) {}
      const isCrit = Math.random() < critRate;
      const actualDamage = Math.floor(player.baseCombat * getMultiplier('atk') * comboMultiplier * (focusDuration / 1500) * (isCrit ? critDmg : 1));
      if (isCrit) setIsCritStrike(true);
      const newHp = Math.max(0, monster.hp - actualDamage);
      const currentLuck = getMultiplier('luck_floor');
      const passiveQi = Math.floor(60 * Math.pow(1.18, player.realmIndex) * getMultiplier('qi') * (focusDuration / 1500));
      const passiveCoin = Math.floor(60 * Math.pow(1.15, player.realmIndex) * getMultiplier('stone') * currentLuck * (focusDuration / 1500));

      let nextQi = player.qi + passiveQi; let nextCoins = player.coins + passiveCoin;
      let nextVitality = (getMultiplier('auto_heal') > 1) ? (player.baseMaxVitality * getMultiplier('hp')) : player.vitality;
      let nextRealm = player.realmIndex; let nextQiToNext = player.qiToNext;
      let nextHasAscended = player.hasAscended;

      if (isCrit && Math.random() < 0.25) nextVitality = Math.min(player.baseMaxVitality * getMultiplier('hp'), nextVitality + (player.baseMaxVitality * getMultiplier('hp') * (getMultiplier('lifesteal') - 1)));

      let killLog = '';
      if (newHp === 0) {
        setIsKilling(true);
        const killQi = Math.floor(350 * Math.pow(1.18, monster.tier) * getMultiplier('qi'));
        const killCoin = Math.floor(900 * Math.pow(1.15, monster.tier) * getMultiplier('stone') * currentLuck);
        nextQi += killQi; nextCoins += killCoin;
        if (monster.name === '【九九重劫】' && !player.hasAscended) {
            try { update(ref(database, 'globalStats'), { totalAscensions: increment(1) }); } catch(e) {}
            nextHasAscended = true; setCelebration({ name: '飛升仙界！成就真仙！' });
        } else if (nextQi >= nextQiToNext && nextRealm < REALMS.length - 1) {
            nextRealm++; nextQi -= nextQiToNext; nextQiToNext = Math.floor(nextQiToNext * 1.35);
            setCelebration({ name: REALMS[nextRealm].name });
        }
        setMonster(generateMonsterState(nextRealm));
      } else { setMonster(prev => ({ ...prev, hp: newHp })); }
      addLog(`${isCrit ? '🔥 爆擊' : '⚔️ 運功'}：${actualDamage.toLocaleString()} 傷害。${newHp === 0 ? '擊殺！' : ''}`);
      setPlayer(p => ({ ...p, realmIndex: nextRealm, qi: nextQi, qiToNext: nextQiToNext, coins: nextCoins, vitality: nextVitality, streakCount: p.streakCount + 1, streakShields: maxStreakShields, totalFocusTime: (p.totalFocusTime || 0) + focusDuration, artifacts: [...(p.artifacts || [])], hasAscended: nextHasAscended }));
      setMode('break'); setTimeLeft(5 * 60);
    } else { 
      setMode('focus'); setTimeLeft(focusDuration); 
      const heal = Math.floor((player.baseMaxVitality * getMultiplier('hp')) * healPct);
      setPlayer(p => ({ ...p, vitality: Math.min(player.baseMaxVitality * getMultiplier('hp'), p.vitality + heal), streakShields: maxStreakShields }));
      addLog(`🌧️ 【靈雨降臨】氣血恢復 ${heal.toLocaleString()}。`); 
    }
  };

  const handleGacha = () => {
    if (player.coins < gachaCost) return;
    const luck = getMultiplier('luck_floor');
    const roll = Math.random(); let rarity = 'COMMON';
    if (roll < 0.001 * luck) rarity = 'DIVINE'; else if (roll < 0.01 * luck) rarity = 'MYTHIC'; else if (roll < 0.03 * luck) rarity = 'LEGENDARY'; else if (roll < 0.08 * luck) rarity = 'EPIC'; else if (roll < 0.18 * luck) rarity = 'RARE'; else if (roll < 0.4 * luck) rarity = 'UNCOMMON';
    const candidates = ARTIFACT_POOL.filter(a => a.rarity === rarity && !(player.artifacts || []).includes(a.id));
    if (candidates.length > 0) {
      setPlayer(p => ({ ...p, coins: p.coins - gachaCost, artifacts: [...(p.artifacts || []), candidates[0].id] }));
      setCelebration({ name: candidates[0].name });
    } else { setPlayer(p => ({ ...p, coins: p.coins - gachaCost, qi: p.qi + 200 })); addLog(`[萬寶樓] 獲贈修行感悟。`); }
  };

  const toggleTimer = () => { if (!isActive) { setTargetEndTime(Date.now() + (timeLeft * 1000)); setIsActive(true); addLog(`[啟動] 靈壓激發。`); } };
  useEffect(() => {
    const sync = () => { if (isActive && targetEndTime && !showGiveUpWarning) { const r = Math.max(0, Math.floor((targetEndTime - Date.now()) / 1000)); setTimeLeft(r); if (r === 0) handleComplete(); } };
    const interval = setInterval(sync, 1000);
    return () => clearInterval(interval);
  }, [isActive, targetEndTime, showGiveUpWarning]);

  return (
    <div className={`min-h-screen text-slate-300 font-mono p-4 flex flex-col items-center overflow-x-hidden relative transition-colors duration-500 pt-10 ${isCollapsing ? 'bg-red-950/80 animate-shake' : isKilling ? 'bg-emerald-950/60' : isCritStrike ? 'bg-rose-900/40' : 'bg-[#020617]'}`} style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <div className="fixed top-0 left-0 w-full bg-emerald-950/90 text-[10px] sm:text-xs py-2 text-center font-black tracking-widest z-[600] border-b border-emerald-500/30 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
        <div className="flex items-center gap-1.5 text-emerald-400"><Network size={14} className="animate-pulse" /><span>世界運轉:</span><span className="text-white font-mono text-sm">{globalStats.focus.toLocaleString()}</span></div>
        <div className="hidden sm:block text-emerald-700">|</div>
        <div className="flex items-center gap-1.5 text-yellow-400"><Crown size={14} className="animate-pulse" /><span>飛升仙人:</span><span className="text-white font-mono text-sm">{globalStats.ascensions.toLocaleString()}</span></div>
      </div>
      <div className="pointer-events-none fixed inset-0 z-[500] flex items-center justify-center overflow-hidden">
        {isCritStrike && <Flame size={350} className="text-amber-500/30 animate-ping absolute mix-blend-color-dodge drop-shadow-[0_0_50px_rgba(245,158,11,0.8)]" />}
        {isKilling && <Sword size={450} className="text-emerald-500/40 animate-pulse absolute mix-blend-color-dodge -rotate-45 drop-shadow-[0_0_80px_rgba(16,185,129,0.8)]" />}
      </div>
      <div className="absolute inset-0 bg-[#020617]/85 backdrop-blur-[1px] z-0 transition-colors duration-300"></div>
      <style>{`.animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; } @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } } .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }`}</style>
      {showGiveUpWarning && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-2xl p-6 flex flex-col items-center justify-center font-bold">
          <div className="w-full max-w-lg bg-rose-950/80 p-8 rounded-2xl border border-rose-500/50 shadow-[0_0_80px_rgba(244,63,94,0.3)] flex flex-col items-center text-center">
            <ShieldAlert size={64} className="text-rose-500 mb-6 animate-pulse"/><h2 className="text-2xl font-black text-white tracking-widest uppercase mb-4">天道警示</h2>
            <p className="text-rose-200 text-sm md:text-base leading-relaxed mb-8">強行出關將遭受極為嚴重的反噬，可能導致道基受損。</p>
            <div className="flex gap-4 w-full"><button onClick={() => setShowGiveUpWarning(false)} className="flex-1 py-4 bg-white/10 hover:bg-white text-white hover:text-black rounded-xl text-sm font-black transition-all border border-white/20">繼續運功</button><button onClick={executeGiveUp} className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-black transition-all shadow-lg">強行中斷</button></div>
          </div>
        </div>
      )}
      <div className={`fixed top-14 right-4 z-50 flex items-center gap-2 bg-emerald-900/80 text-emerald-300 px-4 py-2 rounded-full text-xs font-bold border border-emerald-500/30 transition-opacity duration-500 ${saveIndicator ? 'opacity-100' : 'opacity-0'}`}><Save size={14}/> 天道已同步</div>
      <div className="w-full max-w-4xl mb-6 transition-focus z-10 font-bold px-2 md:px-0 mt-10">
        <div className="flex flex-col items-center mb-8 h-10 justify-center"><h1 className="text-lg md:text-xl font-extralight tracking-[1.2em] text-white/30 uppercase font-bold">凡人修仙專注</h1><div className="h-px w-48 bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4 opacity-50"></div></div>
        <div className={`bg-slate-900/50 backdrop-blur-3xl p-5 md:p-8 rounded-xl border ${themeBorderClass} relative shadow-2xl transition-all duration-500`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6 mb-6">
            <div className="flex items-center gap-4 w-full md:flex-1 min-w-0"><Shield size={36} className={`${themeColorClass} flex-shrink-0`}/><div className="flex flex-col justify-center flex-1 min-w-0"><h2 className="text-2xl font-black tracking-widest uppercase text-white truncate">{currentRealmData.name}</h2><p className={`text-xs md:text-sm ${themeColorClass} font-bold mt-1 opacity-90 italic truncate`}>{currentRealmData.desc}</p></div></div>
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-x-4 gap-y-6 w-full md:w-auto">
               <div className="flex flex-col items-start md:items-end"><span className="text-xs text-yellow-500 font-black flex items-center gap-1.5 mb-1"><Coins size={12}/> 靈石</span><span className="text-base text-yellow-500 font-mono font-bold">{formatNum(player.coins)}</span></div>
               <div className="flex flex-col items-start md:items-end"><span className="text-xs text-cyan-400 font-black flex items-center gap-1.5 mb-1"><Zap size={12}/> SP</span><span className="text-base text-cyan-400 font-mono font-bold">{availableSP}</span></div>
               <div className="flex flex-col items-start md:items-end"><span className="text-xs text-rose-500 font-black flex items-center gap-1.5 mb-1"><Sword size={12}/> 連擊</span><span className="text-base text-rose-500 font-mono font-bold">x{comboMultiplier.toFixed(2)}</span></div>
               <div className="flex flex-col items-start md:items-end font-bold"><span className="text-xs text-emerald-400 font-black flex items-center gap-1.5 mb-1"><Clover size={12}/> 氣運</span><span className="text-base text-emerald-400 font-mono font-bold">x{getMultiplier('luck_floor').toFixed(2)}</span></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-3 relative z-10">
                <div className="flex justify-between text-xs uppercase font-black opacity-60 text-white"><span>氣血真元 {player.vitality < (player.baseMaxVitality * getMultiplier('hp')) && <span className="text-emerald-400 animate-pulse">(可煉丹)</span>}</span><span>{formatNum(player.vitality)} / {formatNum(player.baseMaxVitality * getMultiplier('hp'))}</span></div>
                <div className="h-2.5 bg-black/60 rounded-full overflow-hidden shadow-inner transition-all duration-300"><div className="h-full bg-rose-500 transition-all duration-1000 shadow-[0_0_10px_#f43f5e]" style={{ width: `${(player.vitality/(player.baseMaxVitality * getMultiplier('hp')))*100}%` }}></div></div>
            </div>
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between text-xs uppercase font-black opacity-60 text-white"><span>修為進度</span><span>{formatNum(player.qi)} / {formatNum(player.qiToNext)}</span></div>
              <div className="h-2.5 bg-black/60 rounded-full overflow-hidden shadow-inner"><div className={`h-full bg-${currentRealmData.color}-500 transition-all duration-1000`} style={{ width: `${(player.qi/player.qiToNext)*100}%` }}></div></div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center md:justify-end gap-4">
             <button onClick={() => setShowGuide(true)} className="flex items-center gap-2 text-xs font-black text-emerald-400 bg-white/5 px-5 py-3 rounded-full border border-white/10 uppercase tracking-tighter hover:bg-emerald-500/10"><HelpCircle size={16}/> 修行指引</button>
             <button onClick={() => setShowStatsReport(true)} className="flex items-center gap-2 text-xs font-black text-cyan-400 bg-white/5 px-5 py-3 rounded-full border border-white/10 uppercase tracking-tighter hover:bg-cyan-500/10"><BarChart3 size={16}/> 屬性極限</button>
             <button onClick={() => setShowRealmGuide(true)} className="flex items-center gap-2 text-xs font-black text-white/60 bg-white/5 px-5 py-3 rounded-full border border-white/10 uppercase tracking-tighter hover:bg-white/10"><BookOpen size={16}/> 境界全覽</button>
        </div>
      </div>
      <div className={`w-full max-w-4xl bg-slate-900/40 backdrop-blur-3xl p-8 md:p-14 rounded-2xl border border-white/10 text-center mb-8 z-10 shadow-2xl transition-all duration-700 ${isActive ? 'scale-[1.02] shadow-[0_0_50px_rgba(16,185,129,0.15)]' : ''}`}>
        <div className="grid grid-cols-2 sm:flex sm:justify-center gap-4 md:gap-6 mb-12 font-bold max-w-[280px] sm:max-w-none mx-auto">
           {FOCUS_OPTIONS.map(opt => (<button key={opt.value} onClick={() => { if(!isActive) { setFocusDuration(opt.value); setTimeLeft(opt.value); }}} className={`w-full sm:w-auto px-6 py-3.5 rounded-full text-sm font-black border transition-all ${focusDuration === opt.value ? 'bg-white text-black border-white shadow-lg' : 'bg-black/40 text-white/50 border-white/20 hover:text-white/90 hover:bg-white/10'}`}>{opt.label}</button>))}
        </div>
        <div className={`flex justify-center items-center gap-3 mb-8 text-sm md:text-base tracking-[0.6em] font-black uppercase ${monster.name.includes('瓶頸') ? 'text-rose-500 animate-pulse' : 'text-white/50'}`}><Compass size={18}/> {monster.name} ({formatNum(monster.hp)} HP)</div>
        <div className={`text-7xl sm:text-9xl md:text-[12rem] font-mono leading-none font-black tracking-tighter mb-14 transition-all duration-700 ${isActive ? 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]' : 'text-white/30'}`}>{formatTime(timeLeft)}</div>
        <div className="flex justify-center font-bold">
          {!isActive ? (<button onClick={toggleTimer} className="flex items-center justify-center gap-4 px-10 md:px-16 py-5 md:py-7 bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 rounded-2xl text-lg md:text-xl font-black tracking-[0.5em] uppercase transition-all shadow-2xl w-full md:w-auto"><Sparkles size={24}/> 運轉周天</button>) : (
            <button onClick={preCheckGiveUp} className="flex items-center justify-center gap-4 px-10 md:px-16 py-5 md:py-7 bg-rose-950/50 text-rose-400 hover:bg-rose-900/80 border border-rose-500/40 rounded-2xl text-lg md:text-xl font-black uppercase transition-all w-full md:w-auto"><AlertTriangle size={24}/> 強行出關</button>
          )}
        </div>
      </div>
      <div className={`w-full max-w-4xl mt-4 transition-all duration-500 z-10 font-bold ${isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="bg-slate-950/90 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-2xl flex flex-col h-[800px] overflow-hidden">
          <div className="flex bg-black/80 border-b border-white/10 p-2 gap-2 overflow-x-auto no-scrollbar">
            {[{ id: 'skills', label: '功法', icon: ScrollText }, { id: 'forge', label: '洞府', icon: Hammer }, { id: 'artifacts', label: '法寶', icon: Box }, { id: 'insights', label: '識海', icon: Activity }, { id: 'log', label: '日誌', icon: History }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-4 rounded-xl text-xs md:text-sm font-black uppercase flex flex-col items-center justify-center gap-2 transition-all min-w-[80px] ${activeTab===tab.id ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/80'}`}><tab.icon size={18}/> <span>{tab.label}</span></button>
            ))}
          </div>
          <div className="p-5 md:p-10 overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'skills' && (
              <div className="space-y-14 animate-pop-in">
                <div><h3 className="text-white/60 text-sm font-black uppercase border-b border-white/20 pb-4 mb-8 tracking-widest flex justify-between"><span>凡俗根基 (SP 研習)</span><span className="text-cyan-400">SP: {availableSP}</span></h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{BASIC_SKILLS.map(s => { const lvl = player.basicSkills?.[s.id] || 0; return (
                    <div key={s.id} className="p-5 rounded-xl border border-white/20 bg-white/5 flex flex-col justify-between h-56 shadow-inner">
                       <div><h4 className="text-white font-bold text-sm">{s.name} <span className="opacity-50 float-right font-mono">Lv.{lvl}</span></h4><p className="text-xs text-white/60 mt-3 italic">{s.desc}</p></div>
                       <button onClick={() => { if(availableSP >= 1 && lvl < s.maxLvl) setPlayer(p => ({...p, basicSkills: {...p.basicSkills, [s.id]: lvl+1}})) }} disabled={availableSP < 1 || lvl >= s.maxLvl} className="mt-5 w-full py-4 bg-white/10 hover:bg-cyan-600 text-white rounded-lg text-xs font-black transition-all">研習 (1 SP)</button>
                    </div>);})}</div>
                </div>
                <div><h3 className="text-white/60 text-sm font-black uppercase border-b border-white/20 pb-4 mb-8 tracking-widest">機緣祕籍 (13 種)</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{SECRET_BOOKS.map(book => { const lvl = player.secretBooks?.[book.id] || 0; const learned = lvl > 0; const upCost = Math.floor(10000 * Math.pow(2.2, lvl) * (1 / getMultiplier('forge_discount'))); return (
                    <div key={book.id} className={`p-6 rounded-2xl border transition-all flex flex-col justify-between min-h-[16rem] ${learned ? 'bg-emerald-950/40 border-emerald-500/50 shadow-xl' : 'bg-black/60 border-white/10 opacity-60'}`}>
                       <div className="flex items-start gap-5"><div className={`p-4 rounded-xl ${learned ? 'bg-emerald-500 text-black shadow-lg' : 'bg-slate-800'}`}><BookOpen size={24}/></div><div className="flex-1"><h4 className="font-black text-base text-white">{book.name} {learned && <span className="text-xs opacity-60 ml-2 font-mono">Lv.{lvl}</span>}</h4><p className="text-sm opacity-70 mt-2 text-white">{learned ? book.desc : '擊殺妖獸獲取。'}</p></div></div>
                       {learned && lvl < 5 && <button onClick={() => { if(player.coins >= upCost) setPlayer(p => ({...p, coins: p.coins - upCost, secretBooks: {...p.secretBooks, [book.id]: lvl+1}})) }} disabled={player.coins < upCost} className="mt-6 w-full py-4 bg-white/10 hover:bg-emerald-600 text-white rounded-xl text-sm font-black border border-white/20 transition-all">參悟升級 ({formatNum(upCost)} 靈石)</button>}
                    </div>);})}</div>
                </div>
              </div>
            )}
            {activeTab === 'forge' && (
              <div className="space-y-14 animate-pop-in pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="p-8 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 min-h-[16rem] flex flex-col justify-between shadow-xl">
                    <div><h3 className="text-emerald-400 font-black text-xl uppercase flex items-center gap-3"><Pill size={24}/> 煉製回春丹</h3><p className="text-white/70 text-sm mt-3 italic">瞬間恢復 50% 最大氣血。</p></div>
                    <button onClick={handleHeal} disabled={player.vitality >= (player.baseMaxVitality * getMultiplier('hp'))} className="w-full py-5 bg-emerald-900/80 hover:bg-emerald-600 text-emerald-100 rounded-xl font-black text-sm transition-all border border-emerald-500/50 mt-6">{player.vitality >= (player.baseMaxVitality * getMultiplier('hp')) ? '氣血已滿' : `煉丹 (${formatNum((player.baseMaxVitality * 0.5) * (1 / getMultiplier('forge_discount')))} 靈石)`}</button>
                  </div>
                  <div className="p-8 rounded-2xl bg-white/10 border border-white/20 min-h-[16rem] flex flex-col justify-between"><div><h3 className="text-white font-black text-xl uppercase">祭煉劍光</h3><p className="text-white/60 text-sm mt-3 italic">基礎戰力 +150。</p></div><button onClick={() => { if(player.coins >= upgCostAtk) setPlayer(p => ({ ...p, coins: p.coins - upgCostAtk, baseCombat: p.baseCombat + 150 })) }} disabled={player.coins < upgCostAtk} className="w-full py-5 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl font-black text-sm transition-all mt-6">祭煉 ({formatNum(upgCostAtk)} 靈石)</button></div>
                  <div className="p-8 rounded-2xl bg-white/10 border border-white/20 min-h-[16rem] flex flex-col justify-between"><div><h3 className="text-white font-black text-xl uppercase">熬煉肉身</h3><p className="text-white/60 text-sm mt-3 italic">基礎氣血 +150。</p></div><button onClick={() => { if(player.coins >= upgCostHp) setPlayer(p => ({ ...p, coins: p.coins - upgCostHp, baseMaxVitality: p.baseMaxVitality + 150, vitality: p.vitality + 150 })) }} disabled={player.coins < upgCostHp} className="w-full py-5 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl font-black text-sm transition-all mt-6">熬煉 ({formatNum(upgCostHp)} 靈石)</button></div>
                </div>
                <div className="bg-gradient-to-br from-white/10 to-transparent p-8 md:p-14 rounded-2xl border border-white/20 text-center relative overflow-hidden mt-8"><h3 className="text-white font-black text-2xl uppercase mb-8 tracking-widest flex items-center justify-center gap-3"><Compass className="text-yellow-400"/> 萬寶樓尋寶</h3>
                  <div className="flex justify-center gap-6 mb-12 overflow-x-auto pb-6 custom-scrollbar">{Object.entries(RARITY).map(([k, r]) => (<div key={k} className="flex flex-col items-center min-w-[80px] opacity-80"><span className={`text-xs font-black uppercase ${r.color}`}>{r.name}</span><span className="text-sm font-mono mt-2 text-white">{(r.weight*100*getMultiplier('luck_floor')).toFixed(1)}%</span></div>))}</div>
                  <button onClick={handleGacha} disabled={player.coins < gachaCost} className="px-8 md:px-20 py-6 md:py-8 bg-white/15 hover:bg-white text-white hover:text-black font-black rounded-2xl shadow-2xl transition-all border border-white/30 disabled:opacity-30 flex items-center justify-center gap-4 mx-auto text-base md:text-lg uppercase tracking-[0.4em]"><Sparkles size={24}/> 尋寶 ({formatNum(gachaCost)} 靈石)</button>
                </div>
              </div>
            )}
            {activeTab === 'artifacts' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pop-in pb-10">{ARTIFACT_POOL.map(art => {
                  const unlocked = (player.artifacts || []).includes(art.id), lvl = player.artifactLvls?.[art.id]||0, cost = Math.floor(RARITY_BASE_COST[art.rarity]*Math.pow(2.0,lvl) * (1 / getMultiplier('forge_discount')));
                  return unlocked ? (<div key={art.id} className={`p-8 rounded-2xl border bg-black/60 border-white/20 flex flex-col justify-between shadow-inner min-h-[16rem]`}><div className="z-10"><h4 className={`font-black text-xl ${RARITY[art.rarity].color} tracking-tighter drop-shadow-md`}>{art.name} <span className="opacity-60 text-xs float-right font-mono text-white mt-1">Lv.{lvl}</span></h4><p className="text-sm text-white/70 mt-5 italic leading-relaxed uppercase tracking-widest">「{art.desc}」</p></div>{lvl < 5 && <button onClick={()=>handleUpgradeArtifact(art.id, art.rarity)} disabled={player.coins < cost} className="mt-8 w-full py-4 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl text-sm font-black transition-all border border-white/20 disabled:opacity-30">血煉 ({formatNum(cost)} 靈石)</button>}</div>
                  ) : <div key={art.id} className="p-8 rounded-2xl border-2 border-dashed border-white/10 bg-black/50 flex flex-col items-center justify-center opacity-50 min-h-[16rem]"><EyeOff size={40} className="text-white/30 mb-5"/><p className="text-xs font-black text-white/50 uppercase tracking-[0.3em]">寶光內斂：{RARITY[art.rarity].name}</p></div>;
                })}</div>
            )}
            {activeTab === 'insights' && (
              <div className="h-[500px] md:h-[600px] animate-pop-in bg-black/60 rounded-2xl border border-white/20 shadow-inner p-6 md:p-12 flex flex-col"><div className="flex justify-between items-center mb-10 opacity-70 text-xs font-black uppercase tracking-[0.4em] text-white"><span className="flex items-center gap-3"><Activity size={16}/> 識海投影 (修煉進程)</span><span>累計時間: {formatNum((player.totalFocusTime || 0)/60)}m</span></div><div className="flex-1 relative border-l-2 border-b-2 border-white/20"><InsightsChart /></div></div>
            )}
            {activeTab === 'log' && (
              <div className="space-y-4 animate-pop-in pb-10">{(player.logs || []).map((e, i) => (<div key={i} className={`p-5 rounded-xl border border-white/20 text-xs md:text-sm leading-relaxed transition-all ${i===0?'bg-white/20 text-white shadow-xl animate-pulse':'bg-black/60 border-white/10 text-white/60'}`}>{e}</div>))}</div>
            )}
          </div>
        </div>
        <footer className="pt-20 pb-32 text-center text-xs font-light text-white/50 tracking-[0.5em] uppercase flex flex-col items-center gap-6 z-10 px-4">
          <p className="leading-relaxed">《凡人修仙傳》原著設定歸作者 忘語 所有</p>
          <p className="opacity-80 leading-loose">Created by <a href="https://www.facebook.com/profile.php?id=100084000897269" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline transition-all text-white">fb/指數三寶飯</a> <br className="block sm:hidden mt-2" /> <span className="sm:ml-3">with Gemini</span></p>
          <button onClick={()=>{if(window.confirm('確定重置修行？所有成果將遺失。')) { localStorage.clear(); window.location.reload(); }}} className="opacity-60 hover:opacity-100 transition-opacity border border-white/30 px-6 py-3 rounded-full text-xs tracking-widest hover:bg-rose-900/60 hover:border-rose-500/60 hover:text-rose-200 mt-4 uppercase">散功重修</button>
        </footer>
      </div>
    </div>
  );
}

const DEFAULT_PLAYER = { realmIndex: 0, qi: 0, qiToNext: 250, vitality: 100, baseMaxVitality: 100, coins: 0, baseCombat: 150, artifacts: [], artifactLvls: {}, basicSkills: {}, secretBooks: {}, arrays: { qi: 0, def: 0 }, streakCount: 0, streakShields: 0, luck: 1.0, totalFocusTime: 0, history: [], hasAscended: false };

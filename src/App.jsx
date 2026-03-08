import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Square, Skull, Shield, Zap, Flame, Wind, Coins, Hammer, Box, ScrollText, Network, AlertTriangle, EyeOff, Crown, ChevronsUp, RefreshCw, Zap as Lightning, CloudLightning, Info, Eye, Activity, Sparkles, Sword, Compass, Clover, Lock, BookOpen, X, History, BarChart3, Save, Pill, HelpCircle, Lightbulb } from 'lucide-react';

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
  { name: '煉氣境', desc: '天地靈氣入體，洗髓易經。', color: 'emerald' },
  { name: '築基境', desc: '靈氣化液，凝結道基。', color: 'teal' },
  { name: '結丹境', desc: '丹田結丹，靈力固化。', color: 'blue' },
  { name: '元嬰境', desc: '碎丹成嬰，神魂不滅。', color: 'indigo' },
  { name: '化神境', desc: '掌控天地元氣，具備飛升資格。', color: 'purple' },
  { name: '煉虛境', desc: '五行合一，掌控空間。', color: 'violet' },
  { name: '合體境', desc: '法相實體化，靈界霸主。', color: 'amber' },
  { name: '大乘境', desc: '道臻巔峰，萬法不侵。', color: 'orange' }
];

const REALMS = [{ name: '一介凡人', desc: '尚未引氣入體。', majorName: '凡人', color: 'slate', isMajor: true }];
MAJOR_REALMS_DATA.forEach(major => {
  ['初期', '中期', '後期', '巔峰'].forEach((suffix, i) => {
    REALMS.push({ name: `${major.name.replace('境', '')}${suffix}`, desc: major.desc, isMajor: i === 0, majorName: major.name.replace('境', ''), color: major.color });
  });
});
REALMS.push({ name: '渡劫', desc: '引動九九重雷劫，成則羽化登仙。', majorName: '渡劫', isMajor: true, color: 'rose' });

const GUIDE_REALMS = [
  { name: '一介凡人', range: 'Tier 1' },
  ...MAJOR_REALMS_DATA.map((r, i) => ({ name: r.name, range: `Tier ${i * 4 + 2} - ${i * 4 + 5}` })),
  { name: '渡劫期', range: 'Tier 34' }
];

const ARTIFACT_POOL = [
  { id: 'a01', rarity: 'COMMON', name: '鐵木盾', desc: '基礎防禦。反噬減傷 +2%', val: { def: 0.02 } },
  { id: 'a02', rarity: 'COMMON', name: '青銅戈', desc: '基礎鋒利。戰力加成 +2%', val: { atk: 0.02 } },
  { id: 'a03', rarity: 'COMMON', name: '凝神蒲團', desc: '固本培元。回血+2%，修為獲取+2%', val: { heal_bonus: 0.02, qi: 0.02 } },
  { id: 'a04', rarity: 'COMMON', name: '粗糙靈石袋', desc: '聚財之術。靈石掉落 +5%', val: { stone: 0.05 } },
  { id: 'a10', rarity: 'UNCOMMON', name: '神風舟', desc: '御風飞行。閃避率 +5%', val: { evade: 0.05 } },
  { id: 'a11', rarity: 'UNCOMMON', name: '子母刃', desc: '奇門暗器。戰力+5%，爆擊率+3%', val: { atk: 0.05, crit: 0.03 } },
  { id: 'a12', rarity: 'UNCOMMON', name: '無形針', desc: '無影無蹤。連擊效率+10%，爆擊率+5%', val: { streak_eff: 0.10, crit: 0.05 } },
  { id: 'a13', rarity: 'UNCOMMON', name: '血玉髓', desc: '氣血滋養。休息回血比例 +5%', val: { heal_bonus: 0.05 } },
  { id: 'a20', rarity: 'RARE', name: '青蛟旗', desc: '妖魂鎮壓。戰力加成 +15%', val: { atk: 0.15 } },
  { id: 'a21', rarity: 'RARE', name: '玄鐵飛天盾', desc: '堅不可摧。反噬減傷 +15%', val: { def: 0.15 } },
  { id: 'a22', rarity: 'RARE', name: '碧玉葫蘆', desc: '納寶空間。靈石掉落 +30%', val: { stone: 0.30 } },
  { id: 'a23', rarity: 'RARE', name: '金光磚', desc: '勢大力沉。爆擊傷害 +25%', val: { crit_dmg: 0.25 } },
  { id: 'a30', rarity: 'EPIC', name: '虛天鼎 (仿)', desc: '鼎鎮山河。減傷+15%，氣運保底+0.15/級', val: { def: 0.15, luck_floor: 0.15 } },
  { id: 'a31', rarity: 'EPIC', name: '風雷翅', desc: '風雷遁術。連擊效率+30%，閃避+8%', val: { streak_eff: 0.30, evade: 0.08 } },
  { id: 'a32', rarity: 'EPIC', name: '紫羅極火', desc: '極寒之焰。戰力+20%，爆擊傷害+80%/級', val: { atk: 0.20, crit_dmg: 0.80 } },
  { id: 'a33', rarity: 'EPIC', name: '嗜血幡', desc: '以戰養戰。戰力+15%，擊殺回血+10%', val: { atk: 0.15, kill_heal: 0.10 } },
  { id: 'a40', rarity: 'LEGENDARY', name: '黑風旗', desc: '空間隱匿。閃避率+15%，減傷+15%/級', val: { evade: 0.15, def: 0.15 } },
  { id: 'a41', rarity: 'LEGENDARY', name: '青竹蜂雲劍', desc: '本命劍陣。戰力+50%，連擊效率+50%，爆擊+5%/級', val: { atk: 0.50, streak_eff: 0.50, crit: 0.05 } },
  { id: 'a42', rarity: 'LEGENDARY', name: '大衍神君傀儡', desc: '替身擋災。氣血上限+100%，免死+5%/級', val: { hp: 1.00, revive: 0.05 } },
  { id: 'a43', rarity: 'LEGENDARY', name: '成熟體噬金蟲', desc: '無物不噬。戰力+100%，爆傷+60%/級', val: { atk: 1.00, crit_dmg: 0.60 } },
  { id: 'a50', rarity: 'MYTHIC', name: '玄天斬靈劍', desc: '法則破壞。戰力+250%，爆傷+250%/級', val: { atk: 2.50, crit_dmg: 2.50 } },
  { id: 'a51', rarity: 'MYTHIC', name: '元磁神山', desc: '五行重力場。戰力與減傷 +80%/級', val: { atk: 0.80, def: 0.80 } },
  { id: 'a52', rarity: 'MYTHIC', name: '虛天大鼎', desc: '鼎鎮靈界。減傷+80%，氣運+0.2，成本-40%', val: { def: 0.80, luck_floor: 0.20, forge_discount: 0.40 } },
  { id: 'a53', rarity: 'MYTHIC', name: '玄天如意刃', desc: '斬裂虛空。連擊上限+100%，爆傷+100%/級', val: { streak_cap: 1.00, crit_dmg: 1.00 } },
  { id: 'a60', rarity: 'DIVINE', name: '掌天瓶', desc: '奪天地造化。靈氣+200%，靈石+100%', val: { qi: 2.00, stone: 1.00 } },
  { id: 'a61', rarity: 'DIVINE', name: '游天鯤鵬翎', desc: '真靈遁術。閃避+20%，連擊效率+100%/級', val: { evade: 0.20, streak_eff: 1.00 } },
  { id: 'a62', rarity: 'DIVINE', name: '涅槃真血', desc: '真靈不死。血量+50%，氣運+1.0，免死+10%/級', val: { hp: 0.50, luck_floor: 1.00, revive: 0.10 } },
  { id: 'a63', rarity: 'DIVINE', name: '金闕玉書', desc: '降界天書。靈石+400%，氣運+0.5, 爆擊+10%', val: { stone: 4.00, luck_floor: 0.50, crit: 0.10, forge_discount: 0.20 } },
];

const SECRET_BOOKS = [
  { id: 's_01', rarity: 'UNCOMMON', name: '羅煙步', desc: '閃避靈壓。閃避率 +8%/級', val: { evade: 0.08 } },
  { id: 's_02', rarity: 'RARE', name: '血靈鑽', desc: '爆擊加成。爆擊傷害 +40%/級', val: { crit_dmg: 0.40 } },
  { id: 's_03', rarity: 'RARE', name: '大衍決', desc: '神識分化。連擊效率+15%，氣運+0.05/級', val: { streak_eff: 0.15, luck_floor: 0.05 } },
  { id: 's_04', rarity: 'EPIC', name: '大庚劍陣', desc: '無堅不摧。戰力+30%，連擊上限+30%/級', val: { atk: 0.30, streak_cap: 0.30 } },
  { id: 's_05', rarity: 'LEGENDARY', name: '元磁神光', desc: '克制五行。戰力與減傷 +20%/級', val: { atk: 0.20, def: 0.20 } },
  { id: 's_06', rarity: 'MYTHIC', name: '梵聖真魔功', desc: '法相金身。戰力+50%，減傷+10%/級', val: { atk: 0.50, def: 0.10 } },
  { id: 's_07', rarity: 'RARE', name: '辟邪神雷', desc: '至陽之雷。爆擊率+5%，爆傷+30%/級', val: { crit: 0.05, crit_dmg: 0.30 } },
  { id: 's_08', rarity: 'EPIC', name: '搜魂術', desc: '抽取記憶。擊殺靈氣 +20%/級', val: { qi: 0.20 } },
  { id: 's_09', rarity: 'UNCOMMON', name: '枯木逢春訣', desc: '生生不息。休息回血比例 +5%/級', val: { heal_bonus: 0.05 } },
  { id: 's_10', rarity: 'LEGENDARY', name: '驚蟄十二變', desc: '變身真靈。氣血上限+35%，爆傷+20%/級', val: { hp: 0.35, crit_dmg: 0.20 } },
  { id: 's_11', rarity: 'DIVINE', name: '涅槃金身', desc: '不死不滅。復活機率 +8%/級', val: { revive: 0.08 } },
  { id: 's_12', rarity: 'RARE', name: '百脈煉寶訣', desc: '肉身融寶。洞府成本 -8%/級', val: { forge_discount: 0.08 } },
  { id: 's_13', rarity: 'EPIC', name: '明清靈目', desc: '看破虛妄。氣運保底+0.1，爆擊率+5%/級', val: { luck_floor: 0.10, crit: 0.05 } },
];

const BASIC_SKILLS = [
  { id: 'b_qi', name: '長春功', desc: '修為加成 +10%/級', val: { qi: 0.1 }, maxLvl: 20 },
  { id: 'b_atk', name: '青元劍訣', desc: '戰鬥加成 +10%/級', val: { atk: 0.1 }, maxLvl: 20 },
  { id: 'b_hp', name: '明王訣', desc: '氣血加成 +10%/級', val: { hp: 0.1 }, maxLvl: 20 },
  { id: 'b_stone', name: '天眼術', desc: '靈石加成 +15%/級', val: { stone: 0.15 }, maxLvl: 20 },
];

const RARITY_BASE_COST = { COMMON: 1000, UNCOMMON: 5000, RARE: 25000, EPIC: 100000, LEGENDARY: 500000, MYTHIC: 2500000, DIVINE: 10000000 };

/**
 * ========================================================
 * 2. 主組件 (App)
 * ========================================================
 */

export default function App() {
  const defaultPlayerState = { realmIndex: 0, qi: 0, qiToNext: 250, vitality: 100, baseMaxVitality: 100, coins: 0, baseCombat: 150, artifacts: [], artifactLvls: {}, basicSkills: {}, secretBooks: {}, arrays: { qi: 0, def: 0 }, streakCount: 0, luck: 1.0, totalFocusTime: 0, history: [], logs: ['【系統】天道印記已連結，修行進度已自動保存。'] };

  const [player, setPlayer] = useState(() => {
    try {
      const saved = localStorage.getItem('xianxia_master_v67_final');
      if (saved) return JSON.parse(saved);
      return defaultPlayerState;
    } catch (e) { return defaultPlayerState; }
  });

  const [saveIndicator, setSaveIndicator] = useState(false);
  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  
  const generateMonsterState = (realmIdx) => {
    const nTier = realmIdx + 1;
    const isPeak = REALMS[realmIdx].name.includes('巔峰');
    const isFinal = realmIdx === REALMS.length - 1;
    const bossMult = isFinal ? 20 : (isPeak ? 4 : 1);
    const nHp = Math.floor(150 * Math.pow(1.30, nTier - 1) * bossMult);
    const monsters = ['野狼幫眾', '墨大夫', '金光上人', '陸師兄', '黑煞教徒', '越皇化身', '王蟬', '血線蛟', '墨蛟', '土甲龍', '雙尾蠍', '溫天仁', '鐵甲煉屍', '慕蘭法士', '極陰祖師', '風希', '六道極聖', '血焰古魔', '陰羅宗主', '化形毒蛟', '夜叉守衛', '角蚩戰尊', '六翼霜蚣', '銀甲屍王', '高階魔尊', '元剎聖祖', '噬金蟲王', '海王大乘', '六極聖祖', '謫仙馬良', '始印神尊', '游天鯤鵬', '真靈羅睺', '螟蟲之母'];
    const mName = isFinal ? '【九九重劫】' : (isPeak ? `${monsters[Math.min(nTier-1, monsters.length-1)]} [大瓶頸]` : monsters[Math.min(nTier-1, monsters.length-1)]);
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
  const [celebration, setCelebration] = useState(null);
  
  const [isAttacking, setIsAttacking] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [isCritStrike, setIsCritStrike] = useState(false); 
  const [isKilling, setIsKilling] = useState(false); 
  const [isHealing, setIsHealing] = useState(false); 

  useEffect(() => { 
    localStorage.setItem('xianxia_master_v67_final', JSON.stringify(player)); 
    setSaveIndicator(true);
    const timer = setTimeout(() => setSaveIndicator(false), 2000);
    return () => clearTimeout(timer);
  }, [player]);

  const getMultiplier = (type) => {
    let mult = 1.0;
    BASIC_SKILLS.forEach(s => { if (player.basicSkills?.[s.id] > 0 && s.val?.[type]) mult += s.val[type] * player.basicSkills[s.id]; });
    const processItem = (item, lvl) => { if (item?.val?.[type] !== undefined) mult += item.val[type] * lvl; };
    Object.entries(player.secretBooks || {}).forEach(([id, lvl]) => { const book = SECRET_BOOKS.find(x => x.id === id); if (book) processItem(book, lvl); });
    (player.artifacts || []).forEach(id => { const art = ARTIFACT_POOL.find(a => a.id === id); const lvl = 1 + (player.artifactLvls?.[id] || 0) * 0.6; if (art) processItem(art, lvl); });
    if (type === 'qi' && (player.arrays?.qi || 0)) mult += player.arrays.qi * 0.05;
    if (type === 'def' && (player.arrays?.def || 0)) mult += player.arrays.def * 0.05;
    return mult;
  };

  const currentRealmData = REALMS[player.realmIndex];
  const themeColorClass = `text-${currentRealmData.color}-400`;
  const themeBorderClass = `border-${currentRealmData.color}-500/20`;

  const streakCap = Math.min(5.0, 0.5 + (getMultiplier('streak_cap') - 1)); 
  const comboMultiplier = 1 + Math.min(streakCap, (player.streakCount || 0) * 0.05 * getMultiplier('streak_eff'));
  
  const critRate = Math.min(0.85, getMultiplier('crit') - 1);       
  const critDmg = Math.min(25.0, 2.0 + (getMultiplier('crit_dmg') - 1)); 
  const evadeRate = Math.min(0.75, getMultiplier('evade') - 1);     
  const reviveRate = Math.min(0.65, getMultiplier('revive') - 1);   
  const healPct = Math.min(0.60, 0.20 + (getMultiplier('heal_bonus') - 1)); 
  const defMultiplier = getMultiplier('def');
  const dmgTakenPct = Math.max(10.0, (1 / defMultiplier) * 100); 

  const currentCombatPower = Math.floor(player.baseCombat * getMultiplier('atk') * comboMultiplier);
  const maxVitality = Math.floor(player.baseMaxVitality * getMultiplier('hp'));
  const forgeDiscount = Math.max(0.1, 1 - (getMultiplier('forge_discount') - 1)); 
  const availableSP = (player.realmIndex * 2) - Object.values(player.basicSkills || {}).reduce((a, b) => a + b, 0);

  const healCost = Math.floor(maxVitality * 1.5 * forgeDiscount);
  const gachaCost = Math.floor(5000 * Math.pow(1.18, player.realmIndex) * forgeDiscount);

  const addLog = (text) => {
    const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    setPlayer(p => ({ ...p, logs: [`[${timeStr}] ${text}`, ...(p.logs || [])].slice(0, 50) }));
  };

  const handleHeal = () => {
    if (player.coins >= healCost && player.vitality < maxVitality) {
      setPlayer(p => ({ ...p, coins: p.coins - healCost, vitality: Math.min(maxVitality, p.vitality + Math.floor(maxVitality * 0.5)) }));
      setIsHealing(true); setTimeout(() => setIsHealing(false), 800);
      addLog(`[煉丹] 吞服回春丹，體內靈力充盈。`);
    }
  };

  const handleGiveUp = () => {
    setIsActive(false); setTargetEndTime(null);
    if (Math.random() < evadeRate) { addLog(`💨 【羅煙閃避】遁入虛空，成功避開反噬！`); }
    else {
      setIsCollapsing(true); setTimeout(() => setIsCollapsing(false), 1000);
      const penalty = Math.floor((maxVitality * 0.20 + monster.tier * 50) * (dmgTakenPct / 100));
      let nextHp = player.vitality - penalty, nextQi = player.qi;
      if (nextHp <= 0) {
        if (Math.random() < reviveRate) { nextHp = maxVitality; addLog(`✨ 【涅槃重生】重生歸來！`); }
        else { nextHp = Math.floor(maxVitality * 0.5); nextQi = Math.floor(nextQi * 0.8); addLog(`💀 【身死道消】損失 20% 當前修為！`); }
      } else { addLog(`🚨 【靈力反噬】扣除 ${penalty} 氣血。`); }
      setPlayer(p => ({ ...p, vitality: nextHp, qi: nextQi, streakCount: 0 }));
    }
    setTimeLeft(focusDuration);
  };

  const handleComplete = () => {
    setIsActive(false); setTargetEndTime(null);
    if (mode === 'focus') {
      setIsAttacking(true); setTimeout(() => setIsAttacking(false), 500);
      const isCrit = Math.random() < critRate;
      const damageBase = Math.floor(currentCombatPower * (focusDuration / 1500));
      const actualDamage = isCrit ? Math.floor(damageBase * critDmg) : damageBase;
      if (isCrit) { setIsCritStrike(true); setTimeout(() => setIsCritStrike(false), 600); }
      const newHp = Math.max(0, monster.hp - actualDamage);
      const timeRatio = focusDuration / 1500;
      const currentLuck = getMultiplier('luck_floor');
      const passiveQi = Math.floor(50 * Math.pow(1.18, player.realmIndex + 1) * getMultiplier('qi') * timeRatio);
      const passiveCoin = Math.floor(50 * Math.pow(1.15, player.realmIndex + 1) * getMultiplier('stone') * currentLuck * timeRatio);
      let nextQi = player.qi + passiveQi, nextCoins = player.coins + passiveCoin, nextRealm = player.realmIndex, nextQiToNext = player.qiToNext, nextHistory = player.history, nextVitality = player.vitality;
      let newArtifacts = [...(player.artifacts || [])], killLog = '';

      if (newHp === 0) {
        setIsKilling(true); setTimeout(() => setIsKilling(false), 800); 
        const killQi = Math.floor(300 * Math.pow(1.18, monster.tier) * getMultiplier('qi'));
        const killCoin = Math.floor(800 * Math.pow(1.15, monster.tier) * getMultiplier('stone') * currentLuck);
        nextQi += killQi; nextCoins += killCoin;
        const killHealPct = getMultiplier('kill_heal') - 1;
        if (killHealPct > 0) nextVitality = Math.min(maxVitality, nextVitality + Math.floor(maxVitality * killHealPct));
        if (Math.random() < (0.15 * currentLuck)) {
            const potential = ARTIFACT_POOL.filter(a => !newArtifacts.includes(a.id));
            if (potential.length > 0) { newArtifacts.push(potential[0].id); killLog += ` 🎁 獲異寶【${potential[0].name}】！`; }
        }
        if (nextQi >= nextQiToNext && nextRealm < REALMS.length - 1) {
            nextRealm++; nextQi -= nextQiToNext; nextQiToNext = Math.floor(nextQiToNext * 1.35);
            nextHistory = [...(player.history || []), { name: REALMS[nextRealm].name, time: (player.totalFocusTime || 0) + focusDuration }];
            setCelebration({ name: REALMS[nextRealm].name }); killLog = `☄️ 【突破】晉升！獲修為 ${killQi}。` + killLog;
        } else { killLog = `⚔️ 【擊殺】斬殺！獲額外修為 ${killQi}。` + killLog; }
        setMonster(generateMonsterState(nextRealm));
      } else { setMonster(prev => ({ ...prev, hp: newHp })); }
      const dmgLog = isCrit ? `🔥 【爆擊】造成 ${actualDamage} 點毀滅傷害。` : `[運功] 造成 ${actualDamage} 點傷害。`;
      addLog(killLog !== '' ? `${dmgLog} ${killLog}` : `${dmgLog} 獲基礎修為 ${passiveQi}。`);
      setPlayer(p => ({ ...p, realmIndex: nextRealm, qi: nextQi, qiToNext: nextQiToNext, coins: nextCoins, vitality: nextVitality, streakCount: p.streakCount + 1, totalFocusTime: (p.totalFocusTime || 0) + focusDuration, artifacts: newArtifacts, history: nextHistory }));
      setMode('break'); setTimeLeft(5 * 60);
    } else { 
      setMode('focus'); setTimeLeft(focusDuration); 
      setPlayer(p => ({ ...p, vitality: Math.min(maxVitality, p.vitality + Math.floor(maxVitality * healPct)) }));
      addLog(`[吐納] 感悟天地，恢復氣血。`); 
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
    } else { setPlayer(p => ({ ...p, coins: p.coins - gachaCost, qi: p.qi + 100 })); addLog(`[萬寶樓] 尋寶未果。`); }
  };

  const handleUpgradeArtifact = (artId, rarity) => {
    const currentLvl = player.artifactLvls[artId] || 0;
    const cost = Math.floor(RARITY_BASE_COST[rarity] * Math.pow(1.8, currentLvl) * forgeDiscount);
    if (player.coins >= cost && currentLvl < 5) { 
      setPlayer(p => ({ ...p, coins: p.coins - cost, artifactLvls: { ...p.artifactLvls, [artId]: currentLvl + 1 } })); 
      addLog(`[血煉] 法寶神通提升。`);
    }
  };

  const toggleTimer = () => { if (!isActive) { setTargetEndTime(Date.now() + (timeLeft * 1000)); setIsActive(true); addLog(`[運轉] 靈壓激發。`); } };

  useEffect(() => {
    const syncTime = () => { if (isActive && targetEndTime) { const remaining = Math.max(0, Math.floor((targetEndTime - Date.now()) / 1000)); setTimeLeft(remaining); if (remaining === 0) handleComplete(); } };
    if (isActive) { const interval = setInterval(syncTime, 1000); document.addEventListener('visibilitychange', syncTime); return () => { clearInterval(interval); document.removeEventListener('visibilitychange', syncTime); }; }
  }, [isActive, targetEndTime]);

  return (
    <div className={`min-h-screen text-slate-300 font-mono p-4 flex flex-col items-center overflow-x-hidden relative transition-colors duration-300 
      ${isCollapsing ? 'bg-red-950/80 animate-shake' : isKilling ? 'bg-emerald-950/60' : isCritStrike ? 'bg-rose-900/40' : 'bg-[#020617]'}`}
         style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      
      {/* 視覺特效層：脫離文檔流，防止抖動 */}
      <div className="pointer-events-none fixed inset-0 z-[500] flex items-center justify-center overflow-hidden">
        {isCritStrike && <Flame size={350} className="text-amber-500/30 animate-ping absolute drop-shadow-[0_0_50px_rgba(245,158,11,0.8)] mix-blend-color-dodge" />}
        {isKilling && <Sword size={450} className="text-emerald-500/40 animate-pulse absolute -rotate-45 drop-shadow-[0_0_80px_rgba(16,185,129,0.8)] mix-blend-color-dodge" />}
        {(player.vitality / maxVitality < 0.3) && <div className="absolute inset-0 border-[20px] border-red-600/10 animate-pulse"></div>}
      </div>

      <div className="absolute inset-0 bg-[#020617]/85 backdrop-blur-[1px] z-0 transition-colors duration-300"></div>
      <style>{`.animate-shake { animation: shake 0.4s both; } @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } } .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }`}</style>

      <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-900/80 text-emerald-300 px-3 py-1.5 rounded-full text-[10px] font-bold border border-emerald-500/30 transition-opacity duration-500 ${saveIndicator ? 'opacity-100' : 'opacity-0'}`}><Save size={12}/> 天道已同步</div>

      {/* 境界資訊 */}
      <div className="w-full max-w-4xl mb-6 transition-focus z-10 font-bold px-2 md:px-0">
        <div className="flex flex-col items-center mb-10 h-10 justify-center"><h1 className="text-xl tracking-[1.2em] text-white/20 uppercase font-bold">凡人修仙專注</h1><div className="h-px w-48 bg-gradient-to-r from-transparent via-white/10 to-transparent mt-4 opacity-30"></div></div>
        <div className={`bg-slate-900/50 backdrop-blur-3xl p-4 md:p-6 rounded-xl border ${themeBorderClass} relative shadow-2xl`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/5 pb-6 mb-6">
            <div className="flex items-center gap-3 md:gap-5 w-full md:flex-1 min-w-0"><Shield size={28} className={`${themeColorClass} flex-shrink-0`}/><div className="flex flex-col justify-center flex-1 min-w-0"><h2 className="text-xl md:text-2xl font-black tracking-widest text-white font-bold drop-shadow-lg truncate">{currentRealmData.name}</h2><p className={`text-[11px] md:text-[12.5px] leading-tight ${themeColorClass} font-bold mt-1.5 opacity-90 truncate`}>{currentRealmData.desc}</p></div></div>
            <div className="flex flex-row flex-wrap md:flex-nowrap justify-center md:justify-end items-end gap-x-6 md:gap-x-8 gap-y-3 w-full md:w-auto font-mono text-xs">
               <div className="flex flex-col items-center md:items-end min-w-[65px] text-yellow-500 font-bold"><span className="text-[7px] uppercase font-black"><Coins size={8}/> 靈石</span><span>{Math.floor(player.coins)}</span></div>
               <div className="flex flex-col items-center md:items-end min-w-[50px] text-cyan-400 font-bold"><span className="text-[7px] uppercase font-black"><Zap size={8}/> SP</span><span>{availableSP}</span></div>
               <div className="flex flex-col items-center md:items-end min-w-[70px] text-rose-500 font-bold"><span className="text-[7px] uppercase font-black"><Sword size={8}/> 連擊</span><span className={comboMultiplier > 2.0 ? 'animate-pulse text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : ''}>x{comboMultiplier.toFixed(2)}</span></div>
               <div className="flex flex-col items-center md:items-end min-w-[70px] text-yellow-400 font-bold"><span className="text-[7px] uppercase font-black"><Clover size={8}/> 氣運</span><span>x{getMultiplier('luck_floor').toFixed(2)}</span></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 relative z-10">
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] uppercase font-black opacity-40 tracking-widest"><span>氣血真元</span><span>{Math.floor(player.vitality)} / {maxVitality}</span></div>
              <div className={`h-1.5 bg-black/60 rounded-full overflow-hidden transition-all duration-300 ${isHealing ? 'shadow-[0_0_15px_rgba(16,185,129,0.8)]' : ''}`}><div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${(player.vitality/maxVitality)*100}%` }}></div></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] uppercase font-black opacity-40 tracking-widest"><span>修為進度</span><span>{Math.floor(player.qi)} / {player.qiToNext}</span></div>
              <div className="h-1.5 bg-black/60 rounded-full overflow-hidden shadow-inner"><div className={`h-full bg-${currentRealmData.color}-500 transition-all duration-1000 shadow-[0_0_10px_currentColor]`} style={{ width: `${(player.qi/player.qiToNext)*100}%` }}></div></div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-4">
           <div className="flex overflow-x-auto py-4 px-4 gap-6 bg-black/30 rounded-xl border border-white/5 flex-shrink-0 custom-scrollbar">{REALMS.map((r, i) => (<div key={i} className={`flex flex-col items-center min-w-[80px] transition-all relative ${i===player.realmIndex?'scale-110 opacity-100':'opacity-30'}`}><div className={`w-8 h-8 rounded border flex items-center justify-center font-black text-[10px] rotate-45 transition-all ${i===player.realmIndex?'bg-white text-black rotate-0 shadow-2xl':'border-white/10 text-white'}`}><span>{i}</span></div><span className="text-[8px] font-black mt-6 whitespace-nowrap uppercase">{r.name}</span></div>))}</div>
           <div className="flex flex-wrap justify-center md:justify-end gap-3 mt-2 font-bold">
             <button onClick={() => setShowGuide(true)} className="flex items-center gap-2 text-[10px] text-emerald-400/50 hover:text-emerald-400 transition-all bg-white/5 px-4 py-2 rounded-full border border-white/10"><HelpCircle size={14}/> 修行指引</button>
             <button onClick={() => setShowStatsReport(true)} className="flex items-center gap-2 text-[10px] text-cyan-400/50 hover:text-cyan-400 transition-all bg-white/5 px-4 py-2 rounded-full border border-white/10"><BarChart3 size={14}/> 屬性分析</button>
           </div>
        </div>
      </div>

      <div className={`w-full max-w-4xl bg-slate-900/30 backdrop-blur-3xl p-6 md:p-12 rounded-xl border border-white/5 text-center mb-8 z-10 shadow-2xl transition-all duration-700 ${isActive ? 'scale-[1.02] border-emerald-500/20' : ''}`}>
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-10 font-bold">{FOCUS_OPTIONS.map(opt => (<button key={opt.value} onClick={() => { if(!isActive) { setFocusDuration(opt.value); setTimeLeft(opt.value); }}} className={`px-4 py-1.5 rounded-full text-[10px] font-black border transition-all ${focusDuration === opt.value ? 'bg-white text-black border-white' : 'bg-black/40 text-white/40 border-white/10 hover:text-white/80'}`}>{opt.label}</button>))}</div>
        <div className={`flex justify-center items-center gap-4 mb-8 text-[10px] tracking-[0.6em] font-black uppercase transition-colors ${monster.name.includes('瓶頸') || monster.name.includes('劫') ? 'text-rose-500 animate-pulse' : 'opacity-30'}`}><Compass size={14}/> {monster.name}</div>
        <div className={`text-6xl sm:text-8xl md:text-[11rem] font-mono leading-none font-black tracking-tighter mb-12 transition-all duration-700 ${isActive ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'text-white/20'}`}>{formatTime(timeLeft)}</div>
        <div className="flex justify-center gap-4 md:gap-8 font-bold">
          {!isActive ? (<button onClick={toggleTimer} className="flex items-center gap-3 px-8 md:px-14 py-4 md:py-6 bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 rounded-xl text-base md:text-lg font-black tracking-[0.5em] transition-all shadow-2xl backdrop-blur-md"><Sparkles size={20} className="animate-pulse"/> 運轉周天</button>) : (<button onClick={handleGiveUp} className="flex items-center gap-3 px-8 md:px-14 py-4 md:py-6 bg-rose-950/40 text-rose-400 border border-rose-500/30 rounded-xl text-base md:text-lg font-black active:scale-95 transition-all shadow-2xl backdrop-blur-md"><AlertTriangle size={20}/> 強行出關</button>)}
        </div>
      </div>

      <div className={`w-full max-w-4xl mt-4 transition-all duration-500 z-10 font-bold ${isActive ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}>
        <div className="bg-slate-950/80 backdrop-blur-3xl rounded-xl border border-white/5 shadow-2xl flex flex-col h-[750px] overflow-hidden">
          <div className="flex bg-black/60 border-b border-white/5 p-1 gap-1 flex-shrink-0">{[{ id: 'skills', label: '功法', icon: ScrollText }, { id: 'forge', label: '淬煉', icon: Hammer }, { id: 'artifacts', label: '法寶', icon: Box }, { id: 'insights', label: '識海', icon: Activity }, { id: 'log', label: '日誌', icon: History }].map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-4 rounded-lg text-[9px] font-black flex flex-col items-center justify-center gap-1 transition-all ${activeTab===tab.id ? 'bg-white/10 text-white shadow-inner' : 'text-white/30 hover:text-white/60'}`}><tab.icon size={16}/> <span>{tab.label}</span></button>))}</div>
          <div className="p-4 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'skills' && (
              <div className="space-y-12 animate-pop-in">
                <div><h3 className="text-white/50 text-[10px] font-black uppercase border-b border-white/10 pb-4 mb-8 flex justify-between"><span>基礎根基 (SP 研習)</span><span className="text-cyan-400 font-mono">Available: {availableSP}</span></h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{BASIC_SKILLS.map(s => { const lvl = player.basicSkills?.[s.id]||0; return (<div key={s.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col justify-between h-48 group"><div><h4 className="text-white font-bold text-xs uppercase">{s.name} <span className="opacity-30 float-right font-mono">Lv.{lvl}/20</span></h4><p className="text-[9px] text-white/40 mt-2 italic">{s.desc}</p></div><button onClick={() => { if(availableSP >= 1 && lvl < 20) setPlayer(p => ({...p, basicSkills: {...p.basicSkills, [s.id]: lvl+1}})) }} disabled={availableSP < 1 || lvl >= 20} className="mt-4 w-full py-2 bg-white/10 hover:bg-cyan-500 text-white hover:text-black rounded text-[9px] font-black border border-white/10 transition-all disabled:opacity-30">研習 (1 SP)</button></div>); })}</div></div>
                <div><h3 className="text-white/50 text-[10px] font-black uppercase border-b border-white/10 pb-4 mb-8">機緣秘籍 (參悟)</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{SECRET_BOOKS.map(book => { const lvl = player.secretBooks?.[book.id] || 0; return (<div key={book.id} className={`p-5 rounded-xl border transition-all flex flex-col justify-between h-56 ${lvl > 0 ? 'bg-emerald-950/30 border-emerald-500/40 shadow-lg' : 'bg-black/50 border-white/5 opacity-40'}`}><div className="flex items-center gap-4"><div className={`p-4 rounded-lg ${lvl > 0 ? 'bg-emerald-500 text-black' : 'bg-slate-800'}`}><BookOpen size={20}/></div><div><h4 className="font-black text-sm tracking-widest text-white">{book.name} {lvl > 0 && <span className="text-[9px] opacity-50 ml-2 font-mono">Lv.{lvl}</span>}</h4><p className="text-[10px] opacity-60 mt-1 text-white">{lvl > 0 ? book.desc : '尚未參透此法。'}</p></div></div>{lvl > 0 && lvl < 5 && <button onClick={() => { const cost = Math.floor(10000 * Math.pow(2, lvl) * forgeDiscount); if(player.coins >= cost) setPlayer(p => ({...p, coins: p.coins - cost, secretBooks: {...p.secretBooks, [book.id]: lvl+1}})) }} disabled={player.coins < Math.floor(10000 * Math.pow(2, lvl) * forgeDiscount)} className="mt-4 w-full py-2 bg-white/10 hover:bg-emerald-500 text-white hover:text-black rounded text-[9px] font-black border border-white/10 transition-all disabled:opacity-30">參悟升級</button>}</div>);})}</div></div>
              </div>
            )}
            {activeTab === 'forge' && (
              <div className="space-y-12 animate-pop-in pb-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-bold">
                  <div className="p-8 rounded-xl bg-emerald-950/30 border border-emerald-500/30 h-64 flex flex-col justify-between shadow-lg shadow-emerald-500/10"><div><h3 className="text-emerald-400 font-black text-xl flex items-center gap-2"><Pill size={20}/> 回春丹</h3><p className="text-white/60 text-[10px] mt-2 italic">恢復 50% 氣血。</p></div><button onClick={handleHeal} disabled={player.coins < healCost || player.vitality >= maxVitality} className="w-full py-5 bg-emerald-900/60 hover:bg-emerald-600 text-emerald-100 rounded font-black text-xs border border-emerald-500/50">煉丹 ({healCost} 靈石)</button></div>
                  <div className="p-8 rounded-xl bg-white/5 border border-white/10 h-64 flex flex-col justify-between"><div><h3 className="text-white font-black text-xl">祭煉戰力</h3><p className="text-white/50 text-[10px] mt-2 italic">+100 基礎攻擊。</p></div><button onClick={() => { const cost = Math.floor(1000 * Math.pow(1.18, (player.baseCombat - 150) / 100) * forgeDiscount); if(player.coins >= cost) setPlayer(p => ({ ...p, coins: p.coins - cost, baseCombat: p.baseCombat + 100 })) }} className="w-full py-5 bg-white/10 hover:bg-white text-white hover:text-black rounded font-black text-xs shadow-xl transition-all disabled:opacity-30">祭煉 ({Math.floor(1000 * Math.pow(1.18, (player.baseCombat - 150) / 100) * forgeDiscount)} 靈石)</button></div>
                  <div className="p-8 rounded-xl bg-white/5 border border-white/10 h-64 flex flex-col justify-between"><div><h3 className="text-white font-black text-xl">熬煉體魄</h3><p className="text-white/50 text-[10px] mt-2 italic">+100 基礎氣血。</p></div><button onClick={() => { const cost = Math.floor(1000 * Math.pow(1.18, (player.baseMaxVitality - 100) / 100) * forgeDiscount); if(player.coins >= cost) setPlayer(p => ({ ...p, coins: p.coins - cost, baseMaxVitality: p.baseMaxVitality + 100, vitality: p.vitality + 100 })) }} className="w-full py-5 bg-white/10 hover:bg-white text-white hover:text-black rounded font-black text-xs shadow-xl transition-all disabled:opacity-30">熬煉 ({Math.floor(1000 * Math.pow(1.18, (player.baseMaxVitality - 100) / 100) * forgeDiscount)} 靈石)</button></div>
                </div>
                <div className="space-y-6">
                   <h3 className="text-white/40 text-[10px] font-black uppercase border-b border-white/10 pb-4 tracking-widest">陣法大陣</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-bold">
                      <div className="bg-white/5 p-6 rounded-xl border border-white/10 h-48 flex flex-col justify-between shadow-inner"><div className="flex justify-between text-sm text-white font-bold">聚靈大陣 <span className="opacity-50 font-mono">Lv.{player.arrays?.qi||0}</span></div><p className="text-[10px] opacity-60 italic">修為加成 +5%/級</p><button onClick={() => { if(player.coins >= arrayQiCost) setPlayer(p => ({ ...p, coins: p.coins - arrayQiCost, arrays: {...p.arrays, qi: (p.arrays?.qi||0)+1} })) }} disabled={player.coins < arrayQiCost} className="w-full py-3 bg-white/10 hover:bg-white text-white rounded text-[9px] font-black border border-white/10">升級 ({arrayQiCost} 靈石)</button></div>
                      <div className="bg-white/5 p-6 rounded-xl border border-white/10 h-48 flex flex-col justify-between shadow-inner"><div className="flex justify-between text-sm text-white font-bold">顛倒五行陣 <span className="opacity-50 font-mono">Lv.{player.arrays?.def||0}</span></div><p className="text-[10px] opacity-60 italic text-white">反噬減傷 +5%/級</p><button onClick={() => { if(player.coins >= arrayDefCost) setPlayer(p => ({ ...p, coins: p.coins - arrayDefCost, arrays: {...p.arrays, def: (p.arrays?.def||0)+1} })) }} disabled={player.coins < arrayDefCost} className="w-full py-3 bg-white/10 hover:bg-white text-white rounded text-[9px] font-black border border-white/10">升級 ({arrayDefCost} 靈石)</button></div>
                   </div>
                </div>
                <div className="bg-gradient-to-br from-white/5 to-transparent p-6 md:p-12 rounded-xl border border-white/10 text-center relative overflow-hidden font-bold">
                  <h3 className="text-white font-black text-2xl uppercase mb-6 flex items-center justify-center gap-3"><Compass className="text-yellow-400"/> 萬寶樓尋寶</h3>
                  <div className="flex justify-center gap-4 mb-10 overflow-x-auto pb-4 font-bold">{Object.entries(RARITY).map(([k, r]) => (<div key={k} className="flex flex-col items-center min-w-[70px] opacity-60 font-bold"><span className={`text-[7px] uppercase ${r.color}`}>{r.name}</span><span className="text-[10px] font-mono mt-1 text-white">{(r.weight*100*getMultiplier('luck_floor')).toFixed(1)}%</span></div>))}</div>
                  <button onClick={handleGacha} disabled={player.coins < gachaCost} className="px-6 md:px-16 py-6 md:py-8 bg-white/10 hover:bg-white text-white hover:text-black font-black rounded-xl shadow-2xl border border-white/20 transition-all flex items-center justify-center gap-3 mx-auto"><Sparkles size={18}/> 尋寶 ({Math.floor(gachaCost)} 靈石)</button>
                </div>
              </div>
            )}
            {activeTab === 'artifacts' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pop-in pb-10">
                {ARTIFACT_POOL.map(art => { const unlocked = (player.artifacts || []).includes(art.id); const lvl = player.artifactLvls?.[art.id]||0; const upCost = Math.floor(RARITY_BASE_COST[art.rarity]*Math.pow(1.8,lvl)*forgeDiscount); return unlocked ? (<div key={art.id} className="p-6 rounded-xl border bg-black/50 border-white/10 flex flex-col justify-between shadow-inner font-bold"><div><h4 className={`font-black text-lg ${RARITY[art.rarity].color}`}>{art.name} <span className="opacity-50 text-[9px] float-right font-mono text-white">Lv.{lvl}</span></h4><p className="text-[10px] text-white/60 mt-4 italic leading-relaxed">「{art.desc}」</p></div>{lvl < 5 && <button onClick={()=>handleUpgradeArtifact(art.id, art.rarity)} disabled={player.coins < upCost} className="mt-6 w-full py-3 bg-white/10 hover:bg-white text-white hover:text-black rounded text-[9px] font-black border border-white/10 transition-all">血煉 ({upCost} 靈石)</button>}</div>) : (<div key={art.id} className="p-8 rounded-xl border border-dashed border-white/10 bg-black/40 flex flex-col items-center justify-center opacity-40 font-bold"><EyeOff size={32} className="text-white/20 mb-4"/><p className="text-[8px] font-black text-white/40 uppercase">尚未尋得：{RARITY[art.rarity].name}</p></div>); })}
              </div>
            )}
            {activeTab === 'insights' && (<div className="h-[400px] md:h-[500px] animate-pop-in bg-black/40 rounded-xl border border-white/10 shadow-inner p-4 md:p-10 flex flex-col font-bold"><div className="flex justify-between items-center mb-10 opacity-50 text-[9px] uppercase tracking-[0.4em] text-white"><span>識海投影</span><span>累計時間: {Math.floor((player.totalFocusTime || 0)/60)}m</span></div><div className="flex-1 relative border-l border-b border-white/10"><InsightsChart /></div></div>)}
            {activeTab === 'log' && (<div className="space-y-4 animate-pop-in pb-10 font-bold">{(player.logs || []).map((e, i) => (<div key={i} className={`p-4 rounded border border-white/10 text-[10px] leading-relaxed transition-all ${i===0?'bg-white/20 text-white shadow-xl animate-pulse':'bg-black/40 border-white/5 text-white/40'}`}>{e}</div>))}</div>)}
          </div>
        </div>
        <footer className="pt-16 pb-24 text-center text-[9px] font-light text-white/40 tracking-[0.8em] uppercase flex flex-col items-center gap-4">
          <p>《凡人修仙傳》原著設定歸作者 忘語 所有 | V67 最終封神收官版</p>
          <button onClick={()=>{if(window.confirm('確定重置修行？所有成果將遺失。')) { localStorage.clear(); window.location.reload(); }}} className="opacity-50 hover:opacity-100 transition-opacity border border-white/20 px-4 py-1.5 rounded-full text-[8px] tracking-widest hover:bg-rose-900/50">散功重修</button>
        </footer>
      </div>
    </div>
  );
}

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
  COMMON: { name: '凡品', color: 'text-slate-400', weight: 0.45, qiWeight: 0.005 },
  UNCOMMON: { name: '靈品', color: 'text-green-400', weight: 0.30, qiWeight: 0.01 },
  RARE: { name: '法寶', color: 'text-blue-400', weight: 0.15, qiWeight: 0.03 },
  EPIC: { name: '古寶', color: 'text-purple-400', weight: 0.07, qiWeight: 0.07 },
  LEGENDARY: { name: '通天靈寶', color: 'text-orange-400', weight: 0.02, qiWeight: 0.15 },
  MYTHIC: { name: '玄天之寶', color: 'text-red-500', weight: 0.009, qiWeight: 0.30 },
  DIVINE: { name: '造化至寶', color: 'text-yellow-400', weight: 0.001, qiWeight: 0.50 }
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
  { id: 'a01', rarity: 'COMMON', name: '鐵木盾', desc: '抵禦外魔 (反噬減傷 +2%)', type: 'def', val: 0.02 },
  { id: 'a02', rarity: 'COMMON', name: '青銅戈', desc: '凡兵銳氣 (基礎戰力 +2%)', type: 'atk', val: 0.02 },
  { id: 'a03', rarity: 'COMMON', name: '凝神蒲團', desc: '固本培元 (休息回血比例 +2%)', type: 'heal_bonus', val: 0.02 },
  { id: 'a04', rarity: 'COMMON', name: '粗糙靈石袋', desc: '聚財之陣 (靈石掉落 +5%)', type: 'stone', val: 0.05 },
  { id: 'a10', rarity: 'UNCOMMON', name: '神風舟', desc: '御風而行 (反噬減傷 +5%)', type: 'def', val: 0.05 },
  { id: 'a11', rarity: 'UNCOMMON', name: '子母刃', desc: '奇門兵器 (戰力加成 +8%)', type: 'atk', val: 0.08 },
  { id: 'a12', rarity: 'UNCOMMON', name: '飛針法器', desc: '穿透防線 (爆擊率 +3%)', type: 'crit', val: 0.03 },
  { id: 'a13', rarity: 'UNCOMMON', name: '血玉髓', desc: '氣血滋養 (休息回血比例 +5%)', type: 'heal_bonus', val: 0.05 },
  { id: 'a20', rarity: 'RARE', name: '青蛟旗', desc: '妖魂鎮壓 (戰力加成 +15%)', type: 'atk', val: 0.15 },
  { id: 'a21', rarity: 'RARE', name: '玄鐵飛天盾', desc: '堅不可摧 (反噬減傷 +15%)', type: 'def', val: 0.15 },
  { id: 'a22', rarity: 'RARE', name: '碧玉葫蘆', desc: '納寶空間 (靈石掉落 +30%)', type: 'stone', val: 0.30 },
  { id: 'a23', rarity: 'RARE', name: '金光磚', desc: '重擊崩碎 (爆擊傷害 +25%)', type: 'crit_dmg', val: 0.25 },
  { id: 'a30', rarity: 'EPIC', name: '虛天鼎 (仿)', desc: '鎮壓氣運 (全基礎屬性加成 +15%)', type: 'all', val: 0.15 },
  { id: 'a31', rarity: 'EPIC', name: '風雷翅', desc: '迅捷如雷 (連擊疊加效率 +25%)', type: 'streak_eff', val: 0.25 },
  { id: 'a32', rarity: 'EPIC', name: '天雷竹', desc: '辟邪神雷 (戰力加成 +40%)', type: 'atk', val: 0.40 },
  { id: 'a33', rarity: 'EPIC', name: '血魔劍', desc: '嗜血渴望 (爆擊率 +15%)', type: 'crit', val: 0.15 },
  { id: 'a40', rarity: 'LEGENDARY', name: '八靈尺', desc: '空間封鎖 (反噬減傷 +50%)', type: 'def', val: 0.50 },
  { id: 'a41', rarity: 'LEGENDARY', name: '青竹蜂雲劍', desc: '本命劍陣 (戰力加成 +100%)', type: 'atk', val: 1.00 },
  { id: 'a42', rarity: 'LEGENDARY', name: '大衍神君傀儡', desc: '替身擋災 (氣血上限 +100%)', type: 'hp', val: 1.00 },
  { id: 'a43', rarity: 'LEGENDARY', name: '成熟體噬金蟲', desc: '傷害提升 +120%', type: 'atk', val: 1.20 },
  { id: 'a50', rarity: 'MYTHIC', name: '玄天斬靈劍', desc: '法則破壞 (戰力加成 +300%)', type: 'atk', val: 3.00 },
  { id: 'a51', rarity: 'MYTHIC', name: '元磁神山', desc: '五行重力場 (全基礎屬性加成 +100%)', type: 'all', val: 1.00 },
  { id: 'a52', rarity: 'MYTHIC', name: '乾坤鼎', desc: '逆轉造化 (洞府成本 -40%)', type: 'forge_discount', val: 0.40 },
  { id: 'a53', rarity: 'MYTHIC', name: '七彩珠', desc: '突破極限 (連擊上限提升 100%)', type: 'streak_cap', val: 1.00 },
  { id: 'a60', rarity: 'DIVINE', name: '掌天瓶', desc: '奪天地造化 (靈氣獲取 +500%)', type: 'qi', val: 5.00 },
  { id: 'a61', rarity: 'DIVINE', name: '混沌鐘', desc: '時空凝滯 (全基礎屬性加成 +200%)', type: 'all', val: 2.00 },
  { id: 'a62', rarity: 'DIVINE', name: '補天石', desc: '天道補缺 (氣運底限 +1.0)', type: 'luck_floor', val: 1.00 },
  { id: 'a63', rarity: 'DIVINE', name: '混元瓶', desc: '容納萬物 (靈石獲取 +400%)', type: 'stone', val: 4.00 },
];

const SECRET_BOOKS = [
  { id: 's_01', rarity: 'UNCOMMON', name: '羅煙步', desc: '閃避靈壓。閃避率 +5%/級', type: 'evade', val: 0.05, hide: '【縹緲無跡】' },
  { id: 's_02', rarity: 'RARE', name: '血靈鑽', desc: '爆擊加成。爆擊傷害 +40%/級', type: 'crit_dmg', val: 0.40, hide: '【血影遁術】' },
  { id: 's_03', rarity: 'RARE', name: '大衍決', desc: '神識強化。氣運保底 +0.1/級', type: 'luck_floor', val: 0.10, hide: '【神識分化】' },
  { id: 's_04', rarity: 'EPIC', name: '大庚劍陣', desc: '連擊上限。連擊增傷上限 +20%/級', type: 'streak_cap', val: 0.20, hide: '【劍影分身】' },
  { id: 's_05', rarity: 'LEGENDARY', name: '元磁神光', desc: '克制五行。全基礎屬性加成 +15%/級', type: 'all', val: 0.15, hide: '【五行破滅】' },
  { id: 's_06', rarity: 'MYTHIC', name: '梵聖真魔功', desc: '三頭六臂。戰力加成 +60%/級', type: 'atk', val: 0.60, hide: '【涅槃再生】' },
  { id: 's_07', rarity: 'RARE', name: '辟邪神雷', desc: '至陽之雷。爆擊率 +8%/級', type: 'crit', val: 0.08, hide: '【破魔金雷】' },
  { id: 's_08', rarity: 'EPIC', name: '拘魂術', desc: '掠奪靈氣。擊殺靈氣 +20%/級', type: 'qi', val: 0.20, hide: '【役使鬼神】' },
  { id: 's_09', rarity: 'UNCOMMON', name: '青木訣', desc: '生生不息。休息回血比例 +2%/級', type: 'heal_bonus', val: 0.02, hide: '【枯木逢春】' },
  { id: 's_10', rarity: 'LEGENDARY', name: '驚蟄十二變', desc: '變身真靈。氣血上限 +35%/級', type: 'hp', val: 0.35, hide: '【真靈血脈】' },
  { id: 's_11', rarity: 'DIVINE', name: '涅槃金身', desc: '不死不滅。復活機率 +10%/級', type: 'revive', val: 0.10, hide: '【金身永固】' },
  { id: 's_12', rarity: 'RARE', name: '太乙煉器訣', desc: '器道真解。洞府成本 -8%/級', type: 'forge_discount', val: 0.08, hide: '【造化神工】' },
];

const BASIC_SKILLS = [
  { id: 'b_qi', name: '長春功', desc: '基礎靈氣獲取提升 +10%/級', type: 'qi', val: 0.1, maxLvl: 10, hide: '【木系真元】' },
  { id: 'b_atk', name: '青元劍訣', desc: '基礎戰鬥力提升 +10%/級', type: 'atk', val: 0.1, maxLvl: 10, hide: '【劍意化形】' },
  { id: 'b_hp', name: '象甲功', desc: '基礎氣血上限提升 +10%/級', type: 'hp', val: 0.1, maxLvl: 10, hide: '【金剛不壞】' },
  { id: 'b_stone', name: '尋靈術', desc: '任務靈石收益提升 +15%/級', type: 'stone', val: 0.15, maxLvl: 10, hide: '【法眼如炬】' },
];

const RARITY_BASE_COST = { COMMON: 1000, UNCOMMON: 5000, RARE: 25000, EPIC: 100000, LEGENDARY: 500000, MYTHIC: 2500000, DIVINE: 10000000 };

/**
 * ========================================================
 * 2. 主組件 (App)
 * ========================================================
 */

export default function App() {
  const defaultPlayerState = { realmIndex: 0, qi: 0, qiToNext: 250, vitality: 100, baseMaxVitality: 100, coins: 0, baseCombat: 100, artifacts: [], artifactLvls: {}, basicSkills: {}, secretBooks: {}, arrays: { qi: 0, def: 0 }, streakCount: 0, luck: 1.0, totalFocusTime: 0, history: [], logs: ['【系統】天道印記已連結，修行進度與日誌皆已自動保存。'] };

  const [player, setPlayer] = useState(() => {
    try {
      const saved = localStorage.getItem('xianxia_master_v49_final');
      if (saved) return JSON.parse(saved);
      return defaultPlayerState;
    } catch (e) { return defaultPlayerState; }
  });

  const [saveIndicator, setSaveIndicator] = useState(false);
  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  
  // 核心：34 階怪物清單完整還原
  const getMonsterName = (tier) => {
    const monsters = [
      '野狼幫眾', '墨大夫', '金光上人', '陸師兄', 
      '黑煞教徒', '越皇化身', '鬼靈門王蟬', '血線蛟', 
      '墨蛟', '土甲龍', '雙尾人面蠍', '溫天仁', 
      '鐵甲煉屍', '慕蘭法士', '極陰祖師', '裂風獸風希', 
      '六道極聖', '古魔血焰', '陰羅宗宗主', '化形毒蛟', 
      '夜叉族守衛', '角蚩族戰尊', '六翼霜蚣', '銀甲屍王', 
      '高階魔尊', '元剎聖祖化身', '噬金蟲王', '海王族大乘', 
      '六極聖祖', '降臨謫仙馬良', '始印神尊', '游天鯤鵬', 
      '真靈羅睺', '螟蟲之母' 
    ];
    const index = Math.min(Math.max(1, tier), monsters.length) - 1;
    return `${monsters[index]} (Tier ${tier})`;
  };
  
  const generateMonsterState = (realmIdx) => {
    const nTier = realmIdx + 1;
    const nHp = Math.floor(150 * Math.pow(1.20, nTier - 1) * (realmIdx === REALMS.length - 2 ? 15 : 1));
    return { name: realmIdx === REALMS.length - 2 ? '【九九重劫】' : getMonsterName(nTier), hp: nHp, maxHp: nHp, tier: nTier };
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
  const [isAttacking, setIsAttacking] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [isHealing, setIsHealing] = useState(false); 

  useEffect(() => { 
    localStorage.setItem('xianxia_master_v49_final', JSON.stringify(player)); 
    setSaveIndicator(true);
    const timer = setTimeout(() => setSaveIndicator(false), 2000);
    return () => clearTimeout(timer);
  }, [player]);

  const getMultiplier = (type) => {
    let mult = 1.0;
    BASIC_SKILLS.forEach(s => { if (player.basicSkills?.[s.id] > 0 && s.type === type) mult += s.val * player.basicSkills[s.id]; });
    const processItem = (item, lvl) => {
       if (!item) return;
       if (item.type === type) mult += item.val * lvl;
       else if (item.type === 'all' && ['atk', 'hp', 'qi', 'stone', 'def'].includes(type)) mult += item.val * lvl;
    };
    Object.entries(player.secretBooks || {}).forEach(([id, lvl]) => { processItem(SECRET_BOOKS.find(x => x.id === id), lvl); });
    (player.artifacts || []).forEach(id => { processItem(ARTIFACT_POOL.find(a => a.id === id), 1 + (player.artifactLvls?.[id] || 0) * 0.5); });
    if (type === 'qi' && (player.arrays?.qi || 0)) mult += player.arrays.qi * 0.05;
    if (type === 'def' && (player.arrays?.def || 0)) mult += player.arrays.def * 0.05;
    return mult;
  };

  const currentRealmData = REALMS[player.realmIndex];
  const themeColorClass = `text-${currentRealmData.color}-400`;
  const themeBorderClass = `border-${currentRealmData.color}-500/20`;

  const streakCap = Math.min(3.0, 0.5 + (getMultiplier('streak_cap') - 1)); 
  const streakEff = getMultiplier('streak_eff'); 
  const comboMultiplier = 1 + Math.min(streakCap, (player.streakCount || 0) * 0.05 * streakEff);
  
  const critRate = Math.min(0.75, getMultiplier('crit') - 1); 
  const critDmg = Math.min(5.0, 2.0 + (getMultiplier('crit_dmg') - 1)); 
  const evadeRate = Math.min(0.60, getMultiplier('evade') - 1); 
  const reviveRate = Math.min(0.50, getMultiplier('revive') - 1); 
  const healPct = Math.min(0.50, 0.20 + (getMultiplier('heal_bonus') - 1));
  const defMultiplier = getMultiplier('def');
  const dmgTakenPct = (1 / defMultiplier) * 100; 

  const currentCombatPower = Math.floor(player.baseCombat * getMultiplier('atk') * comboMultiplier);
  const maxVitality = Math.floor(player.baseMaxVitality * getMultiplier('hp'));
  const forgeDiscount = Math.max(0.1, 1 - (getMultiplier('forge_discount') - 1)); 
  const availableSP = (player.realmIndex * 2) - Object.values(player.basicSkills || {}).reduce((a, b) => a + b, 0);

  const upgCostAtk = Math.floor(1000 * Math.pow(1.25, (player.baseCombat - 100) / 100) * forgeDiscount);
  const upgCostHp = Math.floor(1000 * Math.pow(1.25, (player.baseMaxVitality - 100) / 100) * forgeDiscount);
  const healCost = Math.floor(maxVitality * 1.5 * forgeDiscount);
  const arrayQiCost = Math.floor(5000 * Math.pow(1.8, (player.arrays?.qi || 0)) * forgeDiscount);
  const arrayDefCost = Math.floor(4000 * Math.pow(1.8, (player.arrays?.def || 0)) * forgeDiscount);
  const gachaCost = Math.floor(10000 * Math.pow(1.15, player.realmIndex) * forgeDiscount);

  const addLog = (text) => {
    const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    setPlayer(p => ({ ...p, logs: [`[${timeStr}] ${text}`, ...(p.logs || [])].slice(0, 50) }));
  };

  const handleHeal = () => {
    if (player.coins >= healCost && player.vitality < maxVitality) {
      const healAmount = Math.floor(maxVitality * 0.5);
      setPlayer(p => ({ ...p, coins: p.coins - healCost, vitality: Math.min(maxVitality, p.vitality + healAmount) }));
      setIsHealing(true); setTimeout(() => setIsHealing(false), 800);
      addLog(`[煉丹] 吞服回春丹，恢復 ${healAmount} 點氣血。`);
    }
  };

  const handleGiveUp = () => {
    setIsActive(false); setTargetEndTime(null);
    if (Math.random() < evadeRate) { addLog(`💨 【羅煙閃避】成功閃避反噬！`); }
    else {
      setIsCollapsing(true); setTimeout(() => setIsCollapsing(false), 1000);
      const penalty = Math.floor(monster.tier * 30 * (1 / defMultiplier));
      let nextHp = player.vitality - penalty;
      if (nextHp <= 0) {
        if (Math.random() < reviveRate) { nextHp = maxVitality; addLog(`✨ 【涅槃重生】轉危為安！`); }
        else { nextHp = Math.floor(maxVitality * 0.5); setPlayer(p => ({ ...p, qi: Math.floor(p.qi * 0.8) })); addLog(`💀 【身死道消】損失修為，連擊盡失。`); }
      } else { addLog(`🚨 【靈力反噬】扣除 ${penalty} 氣血。`); }
      setPlayer(p => ({ ...p, vitality: nextHp, streakCount: 0 }));
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
      const newHp = Math.max(0, monster.hp - actualDamage);
      if (newHp === 0) handleDefeat();
      else { setMonster(prev => ({ ...prev, hp: newHp })); setMode('break'); setTimeLeft(5 * 60); }
      addLog(isCrit ? `🔥 【爆擊】造成 ${actualDamage} 點毀滅傷害！` : `[運功] 造成 ${actualDamage} 點傷害。`);
    } else { 
      setMode('focus'); setTimeLeft(focusDuration); 
      const heal = Math.floor(maxVitality * healPct);
      setPlayer(p => ({ ...p, vitality: Math.min(maxVitality, p.vitality + heal) }));
      addLog(`[吐納] 完成休息，恢復 ${heal} 氣血。`); 
    }
  };

  const handleDefeat = () => {
    const timeBonus = focusDuration >= 3600 ? 1.25 : 1.0;
    const baseQi = 100 * Math.pow(1.12, monster.tier);
    const baseCoin = Math.floor(200 * Math.pow(1.15, monster.tier) * player.luck);
    let nQi = player.qi + Math.floor(baseQi * getMultiplier('qi') * timeBonus);
    let upgraded = false, nRealm = player.realmIndex;
    if (nQi >= player.qiToNext && nRealm < REALMS.length - 1) { nRealm++; nQi -= player.qiToNext; upgraded = true; }
    setPlayer(p => ({ ...p, realmIndex: nRealm, qi: nQi, qiToNext: upgraded ? Math.floor(p.qiToNext * 1.35) : p.qiToNext, coins: p.coins + Math.floor(baseCoin * getMultiplier('stone')), streakCount: p.streakCount + 1, totalFocusTime: p.totalFocusTime + focusDuration }));
    if (upgraded) setCelebration({ name: REALMS[nRealm].name });
    setMonster(generateMonsterState(nRealm)); setMode('break'); setTimeLeft(5 * 60);
  };

  const handleGacha = () => {
    if (player.coins < gachaCost) return;
    const candidates = ARTIFACT_POOL.filter(a => !player.artifacts.includes(a.id));
    if (candidates.length > 0) {
      setPlayer(p => ({ ...p, coins: p.coins - gachaCost, artifacts: [...p.artifacts, candidates[0].id] }));
      setCelebration({ name: candidates[0].name });
    }
  };

  const toggleTimer = () => { 
    if (!isActive) { 
      const endTime = Date.now() + (timeLeft * 1000);
      setIsActive(true); 
      setTargetEndTime(endTime);
      addLog(`[運轉] 靈壓激發。`); 
    } 
  };

  useEffect(() => {
    const syncTime = () => {
      if (isActive && targetEndTime) {
        const remaining = Math.max(0, Math.floor((targetEndTime - Date.now()) / 1000));
        setTimeLeft(remaining); if (remaining === 0) handleComplete();
      }
    };
    if (isActive) {
      const interval = setInterval(syncTime, 1000);
      document.addEventListener('visibilitychange', syncTime);
      return () => { clearInterval(interval); document.removeEventListener('visibilitychange', syncTime); };
    }
  }, [isActive, targetEndTime]);

  return (
    <div className={`min-h-screen bg-[#020617] text-slate-300 font-mono p-4 flex flex-col items-center overflow-x-hidden relative transition-all duration-700 ${isCollapsing ? 'bg-red-950/80 animate-shake' : ''}`}
         style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      
      <div className="absolute inset-0 bg-[#020617]/85 backdrop-blur-[1px] z-0"></div>
      
      <style>{`
        .glow-streak { box-shadow: 0 0 30px rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* 狀態同步標籤 */}
      <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-900/80 text-emerald-300 px-3 py-1.5 rounded-full text-[10px] font-bold border border-emerald-500/30 transition-opacity duration-500 ${saveIndicator ? 'opacity-100' : 'opacity-0'}`}>
        <Save size={12} className="animate-pulse"/> 天道同步
      </div>

      {/* 修行指引 Modal (完整還原 + 滑動修正) */}
      {showGuide && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-xl p-4 flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl bg-slate-900/50 p-6 md:p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 flex-shrink-0">
               <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-3"><HelpCircle className="text-emerald-400"/> 修行指引與祕訣</h2>
               <button onClick={() => setShowGuide(false)} className="p-2 hover:bg-white/10 rounded-full text-white/50"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
              <div className="flex gap-2 bg-black/40 p-1 rounded-lg border border-white/5 flex-shrink-0">
                <button onClick={() => setGuideTab('rules')} className={`flex-1 py-2 text-xs font-bold rounded uppercase tracking-widest transition-all ${guideTab === 'rules' ? 'bg-white/10 text-white shadow-inner' : 'text-white/40 hover:text-white/80'}`}>基礎法則</button>
                <button onClick={() => setGuideTab('tips')} className={`flex-1 py-2 text-xs font-bold rounded uppercase tracking-widest transition-all ${guideTab === 'tips' ? 'bg-amber-500/20 text-amber-400 shadow-inner' : 'text-amber-400/40 hover:text-amber-400/80'}`}>修行祕訣 (Tips)</button>
              </div>
              {guideTab === 'rules' ? (
                <div className="space-y-4 text-sm leading-relaxed animate-pop-in">
                   <section className="bg-white/5 p-4 rounded-lg border border-white/5">
                     <h3 className="text-emerald-400 text-base mb-2 flex items-center gap-2 font-black font-bold"><Play size={16}/> 運轉周天 (專注計時)</h3>
                     <p className="text-white/70">點擊開始計時。完成後獲取靈氣與靈石機緣。專注越久收穫越高。此版本支援螢幕關閉後自動補償進度。</p>
                   </section>
                   <section className="bg-white/5 p-4 rounded-lg border border-white/5">
                     <h3 className="text-cyan-400 text-base mb-2 flex items-center gap-2 font-black font-bold"><RefreshCw size={16}/> 吐納回血 (休息時間)</h3>
                     <p className="text-white/70">完成 5 分鐘休息即算吐納成功，自動恢復 20%~50% 氣血。</p>
                   </section>
                   <section className="bg-white/5 p-4 rounded-lg border border-white/5">
                     <h3 className="text-rose-400 text-base mb-2 flex items-center gap-2 font-black font-bold"><Square size={16}/> 走火入魔 (強行出關)</h3>
                     <p className="text-white/70">計時中途放棄會遭受反噬扣血，頻繁中斷將導致身死道消。</p>
                   </section>
                   <section className="bg-white/5 p-4 rounded-lg border border-white/5">
                     <h3 className="text-purple-400 text-base mb-2 flex items-center gap-2 font-black font-bold"><Skull size={16}/> 身死道消 (死亡懲罰)</h3>
                     <p className="text-white/70">氣血歸零時若復活失敗，將失去 20% 當前修為與所有連擊，且氣血僅重置至 50%。請務必至洞府煉丹維持狀態。</p>
                   </section>
                   <section className="bg-white/5 p-4 rounded-lg border border-white/5">
                     <h3 className="text-yellow-400 text-base mb-2 flex items-center gap-2 font-black font-bold"><Pill size={16}/> 靈丹妙藥 (主動恢復)</h3>
                     <p className="text-white/70">在「洞府淬煉」分頁可煉製回春丹。消耗靈石即可瞬間拉回 50% 血線，是應對現實頻繁干擾的最佳備選。</p>
                   </section>
                </div>
              ) : (
                <div className="space-y-4 text-sm leading-relaxed animate-pop-in">
                   <section className="bg-white/5 p-4 rounded-lg border-l-2 border-yellow-500">
                     <h3 className="text-yellow-400 text-base mb-2 flex items-center gap-2 font-black font-bold font-bold"><Lightbulb size={16}/> 經濟通膨防禦</h3>
                     <p className="text-white/70">洞府成本呈指數成長。請優先投資 <span className="text-emerald-300">《尋靈術》</span> 與 <span className="text-emerald-300">《太乙煉器訣》</span>。</p>
                   </section>
                   <section className="bg-white/5 p-4 rounded-lg border-l-2 border-emerald-500">
                     <h3 className="text-emerald-400 text-base mb-2 flex items-center gap-2 font-black font-bold font-bold"><Lightbulb size={16}/> 氣運尋寶時機</h3>
                     <p className="text-white/70">萬寶樓爆率直接乘上氣運值。請在戰鬥結束氣運高漲時前往尋寶。</p>
                   </section>
                   <section className="bg-white/5 p-4 rounded-lg border-l-2 border-rose-500">
                     <h3 className="text-rose-400 text-base mb-2 flex items-center gap-2 font-black font-bold font-bold"><Lightbulb size={16}/> 沉沒成本與極限容錯</h3>
                     <p className="text-white/70">若現實中頻繁被打斷（例如孩子哭鬧），請善用 <span className="text-emerald-300">《羅煙步》</span> 的閃避機率。此外，每次成功完成「5分鐘休息」可免費恢復大量氣血。打坐與煉丹並行，方能度過九九重劫。</p>
                   </section>
                   <section className="bg-white/5 p-4 rounded-lg border-l-2 border-purple-500">
                     <h3 className="text-purple-400 text-base mb-2 flex items-center gap-2 font-black font-bold font-bold"><Lightbulb size={16}/> 天道法則上限</h3>
                     <p className="text-white/70">請注意屬性上限以避免浪費資源：閃避極限 <span className="text-white font-mono">60%</span>，復活極限 <span className="text-white font-mono">50%</span>，爆擊率極限 <span className="text-white font-mono">75%</span>。可在「屬性加成報告」中實時監控。</p>
                   </section>
                </div>
              )}
              <div className="h-10 flex-shrink-0"></div>
            </div>
          </div>
        </div>
      )}

      {/* 屬性報告 Modal (修正標籤方向) */}
      {showStatsReport && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-xl p-4 flex flex-col items-center justify-center font-bold">
          <div className="w-full max-w-2xl bg-slate-900/50 p-6 md:p-8 rounded-2xl border border-cyan-900/50 shadow-2xl overflow-y-auto max-h-[85vh] mb-10">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
               <h2 className="text-xl font-black text-cyan-400 tracking-widest uppercase flex items-center gap-3"><BarChart3 size={24}/> 屬性極限報告</h2>
               <button onClick={() => setShowStatsReport(false)} className="p-2 hover:bg-white/10 rounded-full text-white/50"><X size={24}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xs text-white/40 uppercase border-b border-white/5 pb-2">基礎倍率</h3>
                <div className="flex justify-between text-sm"><span className="text-slate-400">總戰力加成</span><span className="text-rose-400 font-mono font-bold">x{getMultiplier('atk').toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">氣血上限加成</span><span className="text-rose-400 font-mono font-bold">x{getMultiplier('hp').toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">靈氣獲取倍率</span><span className="text-cyan-400 font-mono font-bold">x{getMultiplier('qi').toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">靈石掉落倍率</span><span className="text-yellow-400 font-mono font-bold">x{getMultiplier('stone').toFixed(2)}</span></div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs text-white/40 uppercase border-b border-white/5 pb-2">天道法則</h3>
                <div className="flex justify-between text-sm"><span className="text-slate-400">休息回血比例</span><span className="text-emerald-400 font-mono font-bold">{(healPct * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">爆擊率</span><span className="text-purple-400 font-mono font-bold">{(critRate * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">閃避免傷率</span><span className="text-emerald-400 font-mono font-bold">{(evadeRate * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">連擊增傷上限</span><span className="text-rose-400 font-mono font-bold">+{((streakCap - 0.5) * 100).toFixed(0)}%</span></div>
              </div>
              <div className="space-y-4 md:col-span-2 mt-2 pt-4 border-t border-white/5">
                <h3 className="text-xs text-white/40 uppercase pb-2">抗性與經濟</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                  <div className="flex justify-between text-sm font-bold"><span className="text-slate-400">反噬承傷比例</span><span className="text-amber-400 font-mono font-bold">{dmgTakenPct.toFixed(1)}%</span></div>
                  <div className="flex justify-between text-sm font-bold"><span className="text-slate-400">洞府成本折扣</span><span className="text-yellow-500 font-mono font-bold">{(forgeDiscount * 100).toFixed(0)}%</span></div>
                  <div className="flex justify-between text-sm font-bold"><span className="text-slate-400">氣運保底</span><span className="text-emerald-400 font-mono font-bold">{getMultiplier('luck_floor').toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 頂部玩家資訊區 (修正電腦版橫向整齊排列) */}
      <div className="w-full max-w-4xl mb-6 z-10 font-bold px-2 md:px-0">
        <div className="flex flex-col items-center mb-10 h-10 justify-center">
          <h1 className="text-lg md:text-xl font-extralight tracking-[1.2em] text-white/20 uppercase font-bold drop-shadow-md">凡人修仙專注</h1>
          <div className="h-px w-48 bg-gradient-to-r from-transparent via-white/10 to-transparent mt-4 opacity-30"></div>
        </div>
        
        <div className={`bg-slate-900/50 backdrop-blur-3xl p-4 md:p-6 rounded-xl border ${themeBorderClass} relative shadow-2xl`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/5 pb-6 mb-6">
            <div className="flex items-center gap-3 w-full md:flex-1 min-w-0">
               <Shield size={28} className={`${themeColorClass} flex-shrink-0`}/>
               <div className="flex flex-col flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-black tracking-widest text-white truncate drop-shadow-lg">{currentRealmData.name}</h2>
                  <p className={`text-[11px] md:text-[12.5px] ${themeColorClass} font-bold opacity-90 truncate italic drop-shadow-md`}>{currentRealmData.desc}</p>
               </div>
            </div>

            <div className="flex flex-row flex-wrap md:flex-nowrap justify-center md:justify-end items-end gap-x-6 md:gap-x-10 gap-y-3 w-full md:w-auto font-bold">
               <div className="flex flex-col items-center md:items-end min-w-[70px]">
                 <span className="text-[7px] text-yellow-500 uppercase flex items-center gap-1 font-black"><Coins size={8}/> 靈石</span>
                 <span className="text-sm text-yellow-500 font-mono font-bold drop-shadow-md">{Math.floor(player.coins)}</span>
               </div>
               <div className="flex flex-col items-center md:items-end min-w-[50px]">
                 <span className="text-[7px] text-cyan-400 uppercase flex items-center gap-1 font-black"><Zap size={8}/> SP</span>
                 <span className="text-sm text-cyan-400 font-mono font-bold drop-shadow-md">{availableSP}</span>
               </div>
               <div className="flex flex-col items-center md:items-end min-w-[70px]">
                 <span className="text-[7px] text-rose-500 uppercase flex items-center gap-1 font-black"><Sword size={8}/> 連擊</span>
                 <span className="text-sm text-rose-500 font-mono font-bold drop-shadow-md">x{comboMultiplier.toFixed(2)}</span>
               </div>
               <div className="flex flex-col items-center md:items-end min-w-[70px]">
                 <span className="text-[7px] text-emerald-400 uppercase flex items-center gap-1 font-black"><Clover size={8}/> 氣運</span>
                 <span className="text-sm text-emerald-400 font-mono font-bold drop-shadow-md">x{player.luck.toFixed(2)}</span>
               </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 relative z-10">
            <div className="space-y-3">
                <div className="flex justify-between text-[10px] uppercase font-black opacity-40 tracking-widest font-bold">
                    <span className="flex items-center gap-2">氣血真元 {player.vitality < maxVitality && <span className="text-emerald-400 animate-pulse">(可煉丹)</span>}</span>
                    <span>{Math.floor(player.vitality)} / {maxVitality}</span>
                </div>
                <div className="h-1.5 bg-black/60 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-rose-500 transition-all duration-1000 shadow-[0_0_10px_#f43f5e]" style={{ width: `${(player.vitality/maxVitality)*100}%` }}></div>
                </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] uppercase font-black opacity-40 tracking-widest font-bold"><span>修為進度</span><span>{Math.floor(player.qi)} / {player.qiToNext}</span></div>
              <div className="h-1.5 bg-black/60 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full bg-${currentRealmData.color}-500 transition-all duration-1000`} style={{ width: `${(player.qi/player.qiToNext)*100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 計時器主區塊 */}
      <div className={`w-full max-w-4xl bg-slate-900/30 backdrop-blur-3xl p-6 md:p-12 rounded-xl border border-white/5 text-center mb-8 z-10 shadow-2xl`}>
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-10 font-bold">
           {FOCUS_OPTIONS.map(opt => (<button key={opt.value} onClick={() => { if(!isActive) { setFocusDuration(opt.value); setTimeLeft(opt.value); }}} className={`px-4 py-1.5 rounded-full text-[10px] font-black border transition-all font-bold ${focusDuration === opt.value ? 'bg-white text-black border-white' : 'bg-black/40 text-white/40 border-white/10 hover:text-white/80'}`}>{opt.label}</button>))}
        </div>
        <div className="flex justify-center items-center gap-4 mb-8 opacity-30 text-[10px] tracking-[0.6em] font-black uppercase font-bold"><Compass size={14}/> {monster.name}</div>
        
        <div className={`text-6xl sm:text-8xl md:text-[11rem] font-mono leading-none font-black tracking-tighter mb-12 transition-all duration-700 ${isActive ? 'text-white drop-shadow-2xl' : 'text-white/20'}`}>{formatTime(timeLeft)}</div>
        
        <div className="flex justify-center gap-4 md:gap-8 font-bold">
          {!isActive ? (
            <button onClick={toggleTimer} className="flex items-center gap-3 px-8 md:px-14 py-4 md:py-6 bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 rounded-xl text-base md:text-lg font-black tracking-[0.5em] uppercase transition-all shadow-2xl backdrop-blur-md">
              <Sparkles size={20} className="fill-current animate-pulse"/> 運轉周天
            </button>
          ) : (
            <button onClick={handleGiveUp} className="flex items-center gap-3 px-8 md:px-14 py-4 md:py-6 bg-rose-950/40 text-rose-400 border border-rose-500/30 rounded-xl text-base md:text-lg font-black uppercase active:scale-95 transition-all shadow-2xl backdrop-blur-md">
              <Skull size={20} className="fill-current"/> 強行出關
            </button>
          )}
        </div>
      </div>

      {/* 底部面板 100% 完整還原 (功法、洞府、法寶、識海、日誌) */}
      <div className={`w-full max-w-4xl mt-4 transition-all z-10 font-bold ${isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="bg-slate-950/80 backdrop-blur-3xl rounded-xl border border-white/5 shadow-2xl flex flex-col h-[750px] overflow-hidden">
          <div className="flex bg-black/60 border-b border-white/5 p-1 gap-1 overflow-x-auto no-scrollbar flex-shrink-0">
            {[
              { id: 'skills', label: '功法祕籍', icon: ScrollText },
              { id: 'forge', label: '洞府淬煉', icon: Hammer },
              { id: 'artifacts', label: '法寶庫', icon: Box },
              { id: 'insights', label: '識海投影', icon: Activity },
              { id: 'log', label: '修行日誌', icon: History }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-3 md:py-4 rounded-lg text-[8px] md:text-[9px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all ${activeTab===tab.id ? 'bg-white/10 text-white shadow-inner border border-white/10' : 'text-white/30 hover:text-white/60'}`}>
                <tab.icon size={14} className="md:size-[16px]"/> <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4 md:p-8 overflow-y-auto flex-1 custom-scrollbar font-bold">
            {activeTab === 'skills' && (
              <div className="space-y-12 animate-pop-in font-bold">
                <div><h3 className="text-white/50 text-[10px] font-black uppercase border-b border-white/10 pb-4 mb-8 tracking-widest font-bold">凡俗根基 (SP 研習)</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-bold">
                  {BASIC_SKILLS.map(s => { const lvl = player.basicSkills?.[s.id] || 0; return (
                    <div key={s.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col justify-between h-48 shadow-inner group">
                       <div><h4 className="text-white font-bold text-xs tracking-widest uppercase">{s.name} <span className="opacity-30 float-right font-mono font-bold">Lv.{lvl}</span></h4><p className="text-[9px] text-white/40 mt-2 leading-relaxed italic">{s.desc}</p></div>
                       <button onClick={() => { if(availableSP >= 1 && lvl < 10) setPlayer(p => ({...p, basicSkills: {...p.basicSkills, [s.id]: lvl+1}})) }} disabled={availableSP < 1 || lvl >= 10} className="mt-4 w-full py-2 bg-white/10 hover:bg-white text-white hover:text-black rounded text-[9px] font-black border border-white/10 transition-all font-bold">研習 (1 SP)</button>
                    </div>
                  );})}
                </div></div>
                <div><h3 className="text-white/50 text-[10px] font-black uppercase border-b border-white/10 pb-4 mb-8 tracking-widest font-bold">機緣祕籍 (12 種)</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-bold">
                  {SECRET_BOOKS.map(book => { const lvl = player.secretBooks?.[book.id] || 0; const learned = lvl > 0; const upCost = Math.floor(10000 * Math.pow(2, lvl) * forgeDiscount); return (
                    <div key={book.id} className={`p-5 rounded-xl border transition-all flex flex-col justify-between h-56 ${learned ? 'bg-emerald-950/30 border-emerald-500/40 shadow-lg' : 'bg-black/50 border-white/5 opacity-40'}`}>
                       <div className="flex items-center gap-4 font-bold"><div className={`p-4 rounded-lg ${learned ? 'bg-emerald-500 text-black shadow-lg' : 'bg-slate-800'}`}><BookOpen size={20}/></div><div><h4 className="font-black text-sm tracking-widest font-bold text-white">{book.name} {learned && <span className="text-[9px] opacity-50 ml-2 font-mono font-bold">Lv.{lvl}</span>}</h4><p className="text-[10px] opacity-60 leading-relaxed mt-1 font-bold text-white">{learned ? book.desc : '擊殺強敵機率獲得。'}</p></div></div>
                       {learned && lvl < 5 && <button onClick={() => { if(player.coins >= upCost) setPlayer(p => ({...p, coins: p.coins - upCost, secretBooks: {...p.secretBooks, [book.id]: lvl+1}})) }} disabled={player.coins < upCost} className="mt-4 w-full py-2 bg-white/10 hover:bg-emerald-500 text-white hover:text-black rounded text-[9px] font-black border border-white/10 transition-all disabled:opacity-30 font-bold">參悟升級 ({upCost} 靈石)</button>}
                    </div>
                  );})}
                </div></div>
              </div>
            )}
            {activeTab === 'forge' && (
              <div className="space-y-12 animate-pop-in pb-10 font-bold">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-bold">
                  <div className="p-8 rounded-xl bg-emerald-950/30 border border-emerald-500/30 h-64 flex flex-col justify-between group font-bold shadow-lg shadow-emerald-900/20">
                    <div><h3 className="text-emerald-400 font-black text-xl tracking-tighter uppercase font-bold flex items-center gap-2"><Pill size={20}/> 煉製回春丹</h3><p className="text-white/60 text-[10px] mt-2 italic tracking-widest">恢復 50% 最大氣血。</p></div>
                    <button onClick={handleHeal} disabled={player.coins < healCost || player.vitality >= maxVitality} className="w-full py-5 bg-emerald-900/60 hover:bg-emerald-600 text-emerald-100 rounded font-black uppercase text-xs transition-all disabled:opacity-30 border border-emerald-500/50 font-bold">{player.vitality >= maxVitality ? '氣血已滿' : `煉丹 (${healCost} 靈石)`}</button>
                  </div>
                  <div className="p-8 rounded-xl bg-white/5 border border-white/10 h-64 flex flex-col justify-between group font-bold"><div><h3 className="text-white font-black text-xl tracking-tighter uppercase font-bold">凝練劍光</h3><p className="text-white/50 text-[10px] mt-2 italic tracking-widest">基礎戰力 +100。</p></div><button onClick={() => { if(player.coins >= upgCostAtk) setPlayer(p => ({ ...p, coins: p.coins - upgCostAtk, baseCombat: p.baseCombat + 100 })) }} disabled={player.coins < upgCostAtk} className="w-full py-5 bg-white/10 hover:bg-white text-white hover:text-black rounded font-black uppercase text-xs transition-all font-bold">祭煉 ({upgCostAtk} 靈石)</button></div>
                  <div className="p-8 rounded-xl bg-white/5 border border-white/10 h-64 flex flex-col justify-between group font-bold"><div><h3 className="text-white font-black text-xl tracking-tighter uppercase font-bold">熬煉肉身</h3><p className="text-white/50 text-[10px] mt-2 italic tracking-widest">氣血上限 +100。</p></div><button onClick={() => { if(player.coins >= upgCostHp) setPlayer(p => ({ ...p, coins: p.coins - upgCostHp, baseMaxVitality: p.baseMaxVitality + 100, vitality: p.vitality + 100 })) }} disabled={player.coins < upgCostHp} className="w-full py-5 bg-white/10 hover:bg-white text-white hover:text-black rounded font-black uppercase text-xs transition-all font-bold">熬煉 ({upgCostHp} 靈石)</button></div>
                </div>
                <div className="space-y-6 font-bold">
                   <h3 className="text-white/40 text-[10px] font-black uppercase border-b border-white/10 pb-4 font-bold">陣法樞紐</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-bold">
                      <div className="bg-white/5 p-6 rounded-xl border border-white/10 h-48 flex flex-col justify-between shadow-inner font-bold"><div className="flex justify-between font-bold text-sm font-bold text-white">聚靈大陣 <span className="opacity-50 font-mono font-bold">Lv.{player.arrays?.qi||0}</span></div><p className="text-[10px] opacity-60 italic font-bold">靈氣獲取提升 +5%/級</p><button onClick={() => { if(player.coins >= arrayQiCost) setPlayer(p => ({ ...p, coins: p.coins - arrayQiCost, arrays: {...p.arrays, qi: (p.arrays?.qi||0)+1} })) }} disabled={player.coins < arrayQiCost} className="w-full py-3 bg-white/10 hover:bg-white text-white rounded text-[9px] font-black border border-white/10 transition-all font-bold">升級 ({arrayQiCost} 靈石)</button></div>
                      <div className="bg-white/5 p-6 rounded-xl border border-white/10 h-48 flex flex-col justify-between shadow-inner font-bold"><div className="flex justify-between font-bold text-sm font-bold text-white">護府大陣 <span className="opacity-50 font-mono font-bold">Lv.{player.arrays?.def||0}</span></div><p className="text-[10px] opacity-60 italic font-bold text-white">反噬減傷提升 +5%/級</p><button onClick={() => { if(player.coins >= arrayDefCost) setPlayer(p => ({ ...p, coins: p.coins - arrayDefCost, arrays: {...p.arrays, def: (p.arrays?.def||0)+1} })) }} disabled={player.coins < arrayDefCost} className="w-full py-3 bg-white/10 hover:bg-white text-white rounded text-[9px] font-black border border-white/10 transition-all font-bold">升級 ({arrayDefCost} 靈石)</button></div>
                   </div>
                </div>
                <div className="bg-gradient-to-br from-white/5 to-transparent p-6 md:p-12 rounded-xl border border-white/10 text-center relative overflow-hidden font-bold">
                  <h3 className="text-white font-black text-2xl uppercase mb-6 tracking-widest font-bold">萬寶樓尋寶</h3>
                  <div className="flex justify-center gap-4 mb-10 overflow-x-auto pb-4 custom-scrollbar font-bold">
                     {Object.entries(RARITY).map(([k, r]) => (<div key={k} className="flex flex-col items-center min-w-[70px] opacity-60 font-bold"><span className={`text-[7px] font-black uppercase ${r.color} font-bold drop-shadow-md`}>{r.name}</span><span className="text-[10px] font-mono mt-1 font-bold text-white">{(r.weight*100*player.luck).toFixed(1)}%</span></div>))}
                  </div>
                  <button onClick={handleGacha} disabled={player.coins < gachaCost} className="px-6 md:px-16 py-6 md:py-8 bg-white/10 hover:bg-white text-white hover:text-black font-black rounded-xl shadow-2xl transition-all whitespace-nowrap border border-white/20 font-bold">尋寶 ({Math.floor(gachaCost)} 靈石)</button>
                </div>
              </div>
            )}
            {activeTab === 'artifacts' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pop-in pb-10 font-bold">
                {ARTIFACT_POOL.map(art => {
                  const unlocked = player.artifacts?.includes(art.id), lvl = player.artifactLvls?.[art.id]||0, cost = Math.floor(RARITY_BASE_COST[art.rarity]*Math.pow(1.8,lvl)*forgeDiscount);
                  return unlocked ? (
                    <div key={art.id} className={`p-6 rounded-xl border bg-black/50 border-white/10 flex flex-col justify-between shadow-inner font-bold`}><div className="z-10 font-bold"><h4 className={`font-black text-lg ${RARITY[art.rarity].color} tracking-tighter drop-shadow-md font-bold`}>{art.name} <span className="opacity-50 text-[9px] float-right font-mono font-bold text-white">Lv.{lvl}</span></h4><p className="text-[10px] text-white/60 mt-4 italic leading-relaxed uppercase tracking-tighter font-bold">「{art.desc}」</p></div>{lvl < 5 && <button onClick={()=>handleUpgradeArtifact(art.id, art.rarity)} disabled={player.coins < cost} className="mt-6 w-full py-3 bg-white/10 hover:bg-white text-white hover:text-black rounded text-[9px] font-black transition-all border border-white/10 font-bold">血煉 ({cost} 靈石)</button>}</div>
                  ) : <div key={art.id} className="p-8 rounded-xl border border-dashed border-white/10 bg-black/40 flex flex-col items-center justify-center opacity-40 font-bold"><EyeOff size={32} className="text-white/20 mb-4 font-bold"/><p className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em] font-bold">寶光內斂：{RARITY[art.rarity].name}</p></div>;
                })}
              </div>
            )}
            {activeTab === 'insights' && (
              <div className="h-[400px] md:h-[500px] animate-pop-in bg-black/40 rounded-xl border border-white/10 shadow-inner p-4 md:p-10 flex flex-col font-bold">
                <div className="flex justify-between items-center mb-10 opacity-50 text-[9px] font-black uppercase tracking-[0.4em] text-white font-bold"><span className="flex items-center gap-2 font-bold"><Activity size={12}/> 識海投影 (修煉進程)</span><span>累計: {Math.floor(player.totalFocusTime/60)}m</span></div>
                <div className="flex-1 relative border-l border-b border-white/10 font-bold"><InsightsChart /></div>
              </div>
            )}
            {activeTab === 'log' && (
              <div className="space-y-4 animate-pop-in pb-10 font-bold">
                {(player.logs || []).map((e, i) => (<div key={i} className={`p-4 md:p-5 rounded border border-white/10 text-[10px] leading-relaxed transition-all ${i===0?'bg-white/20 text-white shadow-xl animate-pulse font-bold':'bg-black/40 border-white/5 text-white/40'}`}>{e}</div>))}
              </div>
            )}
          </div>
        </div>

        <footer className="pt-16 pb-24 text-center text-[9px] font-light text-white/40 tracking-[0.8em] uppercase flex flex-col items-center gap-4 z-10 font-bold">
          <p>《凡人修仙傳》原著設定歸作者 忘語 所有</p>
          <p className="opacity-80">Created by <a href="https://www.facebook.com/profile.php?id=100084000897269" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline transition-all font-bold">fb/指數三寶飯</a> with Gemini</p>
          <button onClick={()=>{if(window.confirm('確定重置修行？所有成果將遺失。')) { localStorage.clear(); window.location.reload(); }}} className="opacity-50 hover:opacity-100 transition-opacity border border-white/20 px-4 py-1.5 rounded-full text-[8px] uppercase tracking-widest font-bold hover:bg-rose-900/50 hover:border-rose-500/50 hover:text-rose-200">散功重修</button>
        </footer>
      </div>
    </div>
  );
}

const DEFAULT_PLAYER = { realmIndex: 0, qi: 0, qiToNext: 250, vitality: 100, baseMaxVitality: 100, coins: 0, baseCombat: 100, artifacts: [], artifactLvls: {}, basicSkills: {}, secretBooks: {}, arrays: { qi: 0, def: 0 }, streakCount: 0, luck: 1.0, totalFocusTime: 0, history: [] };

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Play, Square, Skull, Shield, Zap, Flame, Wind, Coins, Hammer, Box, ScrollText, Network, AlertTriangle, EyeOff, Crown, ChevronsUp, RefreshCw, Zap as Lightning, CloudLightning, Info, Eye, Activity, Sparkles, Sword, Compass, Clover, Lock, BookOpen, X, History, BarChart3, Save, Pill, HelpCircle, ShieldAlert, Award, Heart, Copy, Download, FileText, Trophy } from 'lucide-react';/**
 * ========================================================
 * 0. 天道雲端初始化 (Firebase Setup)
 * ========================================================
 */
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update, increment } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDamtpmaAYF0NSIGWbvcSzQ9EW3QkDI8-w",
  authDomain: "xiuxian-rpg-pomodoro.firebaseapp.com",
  databaseURL: "https://xiuxian-rpg-pomodoro-default-rtdb.asia-southeast1.firebasedatabase.app",
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
 * 1. 靜態數據定義 (Lore & Database) - 自 GameData 引入
 * ========================================================
 */
import {
  CHANGELOG_DATA, FEEDBACK_TEXTS, REALM_COLORS, LUCK_FATES, formatNumber,
  FOCUS_OPTIONS, RARITY, RARITIES_ORDER, MAJOR_REALMS_DATA, REALMS,
  GUIDE_REALMS, ARTIFACT_POOL, SECRET_BOOKS, PET_POOL, BASIC_SKILLS,
  RARITY_BASE_COST, TITLE_DATA, COMPANIONS, COMPANION_TIERS, getCompanionTier,
  MOB_POOLS, BOSS_POOL
} from './GameData';

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
    dailyGacha: 0,    
    awardGacha: 0,    
    epiphanyPills: 0, lastPillTime: 0,
    activeCompanion: null, companionKills: {},
    lastDailyTime: 0, 
    // ✨ 新增：萬仙榜道號與 ID
    nickname: "", lastNicknameChange: 0, userId: crypto.randomUUID(),
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
// ✨ 新增：萬仙榜的狀態與拉取函數
  const [showRankings, setShowRankings] = useState(false);
  const [rankings, setRankings] = useState({ realm: [], focus: [], power: [] });
  const [activeRankTab, setActiveRankTab] = useState('realm');
  const [isLoadingRank, setIsLoadingRank] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
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
        mName = `${bData.name} [死劫]`;
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

// ✨ Patch 2 開始：抓取全域數據 (因果刷新，取代原本的 onValue 監聽)
  const fetchGlobalStats = async () => {
    try {
      import('firebase/database').then(({ get, ref }) => {
        get(ref(database, 'globalStats')).then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setGlobalStats({ focus: data.totalFocusCount || 0, ascensions: data.totalAscensions || 0 });
          }
        });
      });
    } catch (e) { console.error("天道感應失敗", e); }
  };

  // 初始載入時抓取一次全域數據
  useEffect(() => { fetchGlobalStats(); }, []);

  // 抓取萬仙榜資料
  const fetchRankings = async () => {
    setIsLoadingRank(true);
    try {
      const { get, child, ref } = await import('firebase/database');
      const snapshot = await get(child(ref(database), 'rankings'));
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val());
        setRankings({
          realm: [...data].sort((a, b) => b.realmIndex - a.realmIndex || b.qi - a.qi).slice(0, 50),
          focus: [...data].sort((a, b) => b.totalFocusTime - a.totalFocusTime).slice(0, 50),
          power: [...data].sort((a, b) => b.comprehensiveCP - a.comprehensiveCP).slice(0, 50),
        });
      }
    } catch (e) { console.error("萬仙榜感應失敗", e); }
    setIsLoadingRank(false);
  };

  // 登錄道號邏輯
  const handleSetNickname = () => {
    const cooldown = 72 * 60 * 60 * 1000;
    if (now - (player.lastNicknameChange || 0) < cooldown) {
      alert("名諱凝定中，請待三日後再試。"); return;
    }
    if (nicknameInput.trim().length < 2 || nicknameInput.trim().length > 8) {
      alert("道號需為 2 至 8 字。"); return;
    }
    setPlayer(p => ({ ...p, nickname: nicknameInput.trim(), lastNicknameChange: Date.now() }));
    alert("道號已登錄天道玉牒！");
  };

  // 上傳至萬仙榜
  const uploadRanking = useCallback(async (p, cp) => {
    if (!p.nickname) return;
    try {
      const { update, ref } = await import('firebase/database');
      const updateData = {};
      const activeTitleName = p.equippedTitle ? TITLE_DATA.find(t=>t.id===p.equippedTitle)?.name : "隱世散修";
      updateData[`rankings/${p.userId}`] = {
        nickname: p.nickname, realmIndex: p.realmIndex, qi: p.qi,
        totalFocusTime: p.totalFocusTime, comprehensiveCP: cp,
        title: activeTitleName, lastUpdate: Date.now()
      };
      await update(ref(database), updateData);
    } catch (e) { console.error("天道烙印失敗", e); }
  }, []);
  // ✨ Patch 2 結束

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
  const [treasureTab, setTreasureTab] = useState('arts'); // ✨ 新增：藏寶閣次標籤
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
    // ✨ 靈寵被動屬性加成
    if (player.activePet && player.pets?.[player.activePet]) {
        const pet = PET_POOL.find(p => p.id === player.activePet);
        const lvl = player.pets[player.activePet].lvl;
        if (pet && pet.val?.[type]) {
            mult += pet.val[type] + (lvl - 1) * pet.growth[type];
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
      showToast('focus', '💨 【羅煙閃避】成功閃避反噬！連擊層數未斷！');
      addLog(`💨 【羅煙閃避】成功閃避反噬！連擊層數未斷！`); 
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
              addLog(`💀 【身死道消】反噬過重，氣血歸零，損失 20% 修為並連擊歸零！`); 
              showToast('danger', '💀 【身死道消】反噬過重！', [`損失 20% 修為並連擊歸零`]);
          }
      } else { 
          addLog(logMsg);
          if (nextStreak > 0) {
              if (nextShields > 0) {
                  nextShields -= 1;
                  addLog(`🛡️ 【法寶護主】消耗 1 層護盾抵擋反噬，連擊層數未斷！`);
                  showToast('danger', '【強行收功】靈力反噬！', [`承受 ${formatNumber(penalty)} 傷害`, `🛡️ 護盾抵擋，連擊層數未斷`]);
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

  const getUnownedPool = (rarityTarget, currentArts, currentBooks, currentPets) => {
    const unownedArts = ARTIFACT_POOL.filter(a => a.rarity === rarityTarget && !currentArts.includes(a.id)).map(a => ({...a, poolType: 'art'}));
    const unownedBooks = SECRET_BOOKS.filter(b => b.rarity === rarityTarget && !currentBooks[b.id]).map(b => ({...b, poolType: 'book'}));
    const unownedPets = PET_POOL.filter(p => p.rarity === rarityTarget && !currentPets[p.id]).map(p => ({...p, poolType: 'pet'}));
    return [...unownedArts, ...unownedBooks, ...unownedPets];
  };

  const resolveDropWithMutation = (initialRarity, arts, books, pets, baseCost) => {
      let originalIdx = RARITIES_ORDER.indexOf(initialRarity);
      let finalDrop = null;
      let compensationCoins = 0;
      let mutationLog = '';
      let currentTargetRarity = initialRarity;

      for (let i = originalIdx; i >= 0; i--) {
          let r = RARITIES_ORDER[i];
          let pool = getUnownedPool(r, arts, books, pets);
          if (pool.length > 0) {
              finalDrop = pool[Math.floor(Math.random() * pool.length)];
              currentTargetRarity = r;
              if (i < originalIdx) mutationLog += `【${RARITY[initialRarity].name}】圖鑑已滿，靈力逸散，尋得【${RARITY[r].name}】。`;
              break;
          }
      }

      if (!finalDrop) {
          for (let i = originalIdx + 1; i < RARITIES_ORDER.length; i++) {
              let r = RARITIES_ORDER[i];
              let pool = getUnownedPool(r, arts, books, pets);
              if (pool.length > 0) {
                  finalDrop = pool[Math.floor(Math.random() * pool.length)];
                  currentTargetRarity = r;
                  mutationLog += `【機緣爆發】氣運牽引，連鎖突變為【${RARITY[r].name}】！`;
                  break;
              }
          }
      }

      if (!finalDrop) {
          let compValue = Math.floor((baseCost * 1.5) / RARITY[initialRarity].weight);
          compensationCoins = compValue;
          mutationLog += `【天道盡頭】此界寶物已盡入你手，機緣化作 ${formatNumber(compValue)} 靈石！`;
      }

      return { drop: finalDrop, coins: compensationCoins, log: mutationLog, finalRarity: currentTargetRarity };
  };

const handleComplete = (usedPill = false) => {
    if (sessionLockRef.current) return; 
    sessionLockRef.current = true;  
  
    const isUsingPill = usedPill === true;
    
    // ✨ 關鍵改動：定義「有效時長」。若是用丹，強制設定為 1500 秒 (25分)
    const effFocusDuration = isUsingPill ? 1500 : focusDuration;
    // ✨ 關鍵改動：若是用丹，強制視為 'focus' (蓄力) 模式執行戰鬥
    const currentMode = isUsingPill ? 'focus' : mode;
    
    setIsActive(false); 
    setTargetEndTime(null);
    let collectedDrops = []; 
    
    if (currentMode === 'focus') {
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
          // 文案更新：符合道友要求的瞬發攻擊感
          addLog(`💊 【歲月法則】吞服頓悟丹，發動等同 25 分鐘之蓄力一擊！`);
          nextPills -= 1;
          nextLastPillTime = Date.now(); 
      } else {
          nextLastPillTime = 0; 
          nextLifetime.focusCount += 1;
          nextTotalFocusTime += effFocusDuration;
      }

      const isCrit = Math.random() < critRate;
      // ⚠️ 注意：這裡的計算全部改用 effFocusDuration
      const damageBase = Math.floor(currentCombatPower * (effFocusDuration / 1500));
      let actualDamage = isCrit ? Math.floor(damageBase * critDmg) : damageBase;
      
      if (isCrit) { setIsCritStrike(true); setTimeout(() => setIsCritStrike(false), 600); }

      const timeRatio = effFocusDuration / 1500;
      const passiveQi = Math.floor(50 * Math.pow(1.18, player.realmIndex + 1) * getMultiplier('qi') * timeRatio);
      const passiveCoin = Math.floor(50 * Math.pow(1.15, player.realmIndex + 1) * getMultiplier('stone') * luckVal * timeRatio);

      // ✨ 【萬獸覺醒：靈獸結算與神通觸發】
      let petLog = '';
      let petBlockCounter = false;
      let petDamage = 0;
      let damageMultiplier = 1.0;
      let petExtraCoins = 0;
      let petHeal = 0;
      let petExtraQi = 0;

      let nextPets = { ...(player.pets || {}) };
      if (player.activePet && nextPets[player.activePet]) {
          const petData = PET_POOL.find(p => p.id === player.activePet);
          const petInfo = nextPets[player.activePet];
          const lvl = petInfo.lvl || 1;

          // 🐾 注入歲月歷練 (真實專注才給經驗)
          if (!isUsingPill && lvl < 10) {
              petInfo.exp = (petInfo.exp || 0) + Math.floor(focusDuration / 60);
          }

          // 🐾 神通觸發判定
          const triggerRate = petData.triggerBase + (lvl - 1) * petData.triggerGrowth;
          if (Math.random() < triggerRate) {
              const eff = petData.effectBase + (lvl - 1) * petData.effectGrowth;
              
              if (petData.id === 'p_mouse') {
                  petExtraCoins = Math.floor(passiveCoin * eff);
                  petLog += ` 🐾 【${petData.name}】發動「尋寶天賦」，額外尋得 ${formatNumber(petExtraCoins)} 靈石！`;
              } else if (petData.id === 'p_spider') {
                  petBlockCounter = true;
              } else if (petData.id === 'p_leopard') {
                  petDamage = Math.floor(actualDamage * eff);
                  petLog += ` 🐾 【${petData.name}】化作雷光發動「雷迅瞬殺」，造成 ${formatNumber(petDamage)} 額外雷傷！`;
              } else if (petData.id === 'p_centipede') {
                  damageMultiplier = eff;
                  petLog += ` 🐾 【${petData.name}】吐出「絕對冰封」，本次傷害暴增 ${eff.toFixed(1)} 倍！`;
              } else if (petData.id === 'p_beetle') {
                  petDamage = Math.floor(monster.maxHp * eff);
                  petLog += ` 🐾 【${petData.name}】群湧而出「無物不噬」，直接啃食妖獸 ${formatNumber(petDamage)} 氣血！`;
              } else if (petData.id === 'p_soul') {
                  petHeal = Math.floor(maxVitality * eff);
                  petExtraQi = Math.floor(passiveQi * 1.5); // 掠奪額外修為
                  // 補血與修為要在確認擊殺後才生效，這邊先打標記
              }
          }
      }

      // 結算最終傷害
      actualDamage = Math.floor(actualDamage * damageMultiplier) + petDamage;
      const newHp = Math.max(0, monster.hp - actualDamage);

      let nextQi = player.qi + passiveQi + petExtraQi;
      let nextCoins = player.coins + passiveCoin + petExtraCoins;
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

      if (!isUsingPill) {
          nextLifetime.totalCoins += passiveCoin + petExtraCoins;
      }
      
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

        // 🐾 啼魂獸結算判定
        if (petHeal > 0) {
            nextVitality = Math.min(maxVitality, nextVitality + petHeal);
            killLog += ` 🐾 【啼魂獸】發動「刑獸噬魂」，吞噬精魄恢復 ${formatNumber(petHeal)} 氣血，並掠奪大量修為！`;
            collectedDrops.push(`🐾 啼魂獸：恢復 ${formatNumber(petHeal)} 氣血`);
        }

const finalPillRate = 0.10 * (focusDuration / 3600);

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

            // ✨ 擊殺掉落：帶入 nextPets
            const result = resolveDropWithMutation(targetRarity, newArtifacts, newSecretBooks, nextPets, gachaCost);
            
            nextCoins += result.coins;
            if (!isUsingPill) nextLifetime.totalCoins += result.coins;
            killLog += result.log;

if (result.drop) {
                const drop = result.drop;
                const rarityName = RARITY[result.finalRarity].name;
                const dropDisplay = `【${rarityName}】${drop.name}`; // 統一格式
                
                if (drop.poolType === 'art') {
                    newArtifacts.push(drop.id);
                    killLog += ` 🎁 斬獲${dropDisplay}！`;
                } else if (drop.poolType === 'book') {
                    newSecretBooks[drop.id] = 1;
                    killLog += ` 📜 獲得${dropDisplay}！`;
                } else if (drop.poolType === 'pet') {
                    nextPets[drop.id] = { lvl: 1, exp: 0 };
                    killLog += ` 🐾 降伏${dropDisplay}！`;
                }
                collectedDrops.push(dropDisplay); // 統一加入結算清單
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
                addLog(`🌌 【破空飛升】恭賀道友位列仙班，成就真仙之位！`); 
                killLog = ` 🌌 渡劫成功！` + killLog;
                
                const quoteMsg = FEEDBACK_TEXTS.boss[Math.floor(Math.random() * FEEDBACK_TEXTS.boss.length)];
                setCelebration({ name: '飛升仙界！成就真仙！', quote: quoteMsg, drops: collectedDrops });
            } else if (nextRealm < REALMS.length - 1) {
                nextRealm++;
                nextQi -= nextQiToNext;
                nextQiToNext = Math.floor(nextQiToNext * 1.35);
                if (!isUsingPill) nextHistory = [...nextHistory, { name: REALMS[nextRealm].name, time: nextTotalFocusTime }];
                
                addLog(`☄️ 【境界突破】恭喜道友成功斬滅死劫，晉升至「${REALMS[nextRealm].name}」！`);

                const newCompanion = COMPANIONS.find(c => c.unlockIdx === nextRealm);
                if (newCompanion) {
                    collectedDrops.unshift(`🌸 結識紅緣：【${newCompanion.name}】`);
                    addLog(`🏆 【仙緣】突破之際，你與【${newCompanion.name}】意外結識，可前往「道侶紅顏」邀其同行。`);
                }
                
                const quoteMsg = FEEDBACK_TEXTS.boss[Math.floor(Math.random() * FEEDBACK_TEXTS.boss.length)];
                setCelebration({ 
                    name: REALMS[nextRealm].name, 
                    quote: newCompanion ? `「${newCompanion.quotes[0][Math.floor(Math.random() * newCompanion.quotes[0].length)]}」` : quoteMsg, 
                    drops: collectedDrops 
                });
                killLog = ` 💀 斬滅死劫！` + killLog;
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
        
        // 🐾 蜘蛛擋刀判定加入
        if (Math.random() < evadeRate || petBlockCounter) {
            killLog = petBlockCounter ? `🐾 妖獸反撲！【血玉蜘蛛】吐出堅網，完美抵擋了【${atkName}】！` : `💨 妖獸反撲！你身形如鬼魅，完美閃避【${atkName}】！`;
            const msg = FEEDBACK_TEXTS.focus[Math.floor(Math.random() * FEEDBACK_TEXTS.focus.length)];
            collectedDrops.push(petBlockCounter ? `🐾 蜘蛛堅網抵擋傷害` : `💨 完美閃避妖獸反撲`);
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
                    nextQi = Math.floor(nextQi * 0.8); 
                    nextStreak = 0;
                    nextShields = 0;
                    isDeadFromCounter = true;
                    
                    if (monster.isBoss && nextQi < nextQiToNext) {
                        nextMonsterHp = -1; 
                        killLog = `💀 施展【${atkName}】${scaleLog}造成 ${formatNumber(actualDamage)} 傷害！氣血歸零！📉 【境界跌落】修為受損，死劫消散！需重新歷練。`;
                    } else {
                        nextMonsterHp = monster.maxHp; 
                        killLog = `💀 施展【${atkName}】${scaleLog}造成 ${formatNumber(actualDamage)} 傷害！氣血歸零，損失 20% 修為並連擊歸零！(妖獸趁機恢復了氣血)`;
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

      let fortuneLog = '';
      if (!isDeadFromCounter && Math.random() < (0.10 * luckVal * timeRatio)) {
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
                fortuneLog = ` ⚡ 【天雷淬體】肉身脫胎換骨，戰力 +5！`;
                collectedDrops.push(`⚡ 淬體：戰力 +5`);
            } else {
                nextBaseMaxVitality += 5;
                fortuneLog = ` ⚡ 【天雷淬體】經脈拓寬，氣血上限 +5！`;
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
            
            // ✨ 奇遇掉落：帶入 nextPets
            const result = resolveDropWithMutation(targetRarity, newArtifacts, newSecretBooks, nextPets, gachaCost);
            nextCoins += result.coins;
            if (!isUsingPill) nextLifetime.totalCoins += result.coins;
            fortuneLog += result.log;
if (result.drop) {
                const drop = result.drop;
                const rarityName = RARITY[result.finalRarity].name;
                const dropDisplay = `【${rarityName}】${drop.name}`;
                
                if (drop.poolType === 'art') {
                    newArtifacts.push(drop.id);
                    fortuneLog += ` 🏺 【異寶出世】喜獲${dropDisplay}！`;
                } else if (drop.poolType === 'book') {
                    newSecretBooks[drop.id] = 1;
                    fortuneLog += ` 📜 【殘卷現世】領悟${dropDisplay}！`;
                } else if (drop.poolType === 'pet') {
                    nextPets[drop.id] = { lvl: 1, exp: 0 };
                    fortuneLog += ` 🐾 【靈獸認主】獲得${dropDisplay}！`;
                }
                collectedDrops.push(dropDisplay);
            }
            if (result.coins > 0) {
                collectedDrops.push(`💰 突變補償：${formatNumber(result.coins)} 靈石`);
            }
        }
      }

      let bottleneckLog = '';
      if (nextQi > nextQiToNext) {
          const overflow = nextQi - nextQiToNext;
          nextQi = nextQiToNext; 
          
          const crystalizedCoins = Math.floor(overflow * 0.3); 
          const finalCoins = Math.max(1, crystalizedCoins); 
          
          nextCoins += finalCoins;
          if (!isUsingPill) nextLifetime.totalCoins += finalCoins;
          
          bottleneckLog = ` ⚠️ 【境界瓶頸】丹田已滿，${formatNumber(overflow)} 點溢出靈氣劇烈消散，凝結出 ${formatNumber(finalCoins)} 顆靈石晶體。`;
          collectedDrops.push(`💎 靈氣化晶：${formatNumber(finalCoins)} 靈石`);
      }

// START PATCH [19.1 戰報段落化重構]
      // 1. 定義基礎傷害訊息
      const dmgLog = isCrit ? `🔥 【爆擊】造成 ${formatNumber(actualDamage)} 傷害。` : `[運功] 造成 ${formatNumber(actualDamage)} 傷害。`;
      
      // 2. 將所有戰鬥段落放入陣列，並清理前後空格
      const logSections = [
          dmgLog,
          killLog ? killLog.trim() : `獲修為 ${formatNumber(passiveQi)}。`, // 若沒擊殺則顯示獲取修為
          petLog ? petLog.trim() : "",
          fortuneLog ? fortuneLog.trim() : "",
          compLog ? compLog.trim() : "",
          bottleneckLog ? bottleneckLog.trim() : ""
      ].filter(section => section.length > 0); // 篩選出有內容的段落

      // 3. 使用 \n (物理換行) 拼接並發送到日誌
      addLog(logSections.join('\n'));
// END PATCH [19.1 戰報段落化重構]
      
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
          lifetimeStats: nextLifetime,
          pets: nextPets // ✨ 萬獸覺醒：寫入靈獸歷練進度與新寵物
      }));
// ✨ 在這裡加入上傳萬仙榜與刷新全局人數的邏輯
      uploadRanking({ ...player, realmIndex: nextRealm, qi: nextQi, totalFocusTime: nextTotalFocusTime }, comprehensiveCP);
      fetchGlobalStats();
      
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
// START PATCH [修正萬寶樓尋寶靈獸掉落邏輯]
  const handleGacha = () => {
    // ⚔️ 判斷機緣優先級：1. 每日機緣 (優先) -> 2. 稱號功勳 (次之)
    const useDaily = (player.dailyGacha || 0) > 0;
    const useAward = !useDaily && (player.awardGacha || 0) > 0;
    const isFree = useDaily || useAward;

    // 若無免費次數且靈石不足，則無法開陣
    if (!isFree && player.coins < gachaCost) return;
    
    // 🎲 天道演算：稀有度判定
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
    
    // 🌀 連鎖突變機制 
    const result = resolveDropWithMutation(targetRarity, player.artifacts || [], player.secretBooks || {}, player.pets || {}, gachaCost);

    setPlayer(p => {
        let nextCoins = (isFree ? p.coins : p.coins - gachaCost) + result.coins;
        
        // 💰 精準扣除次數：優先消耗每日，每日沒了才扣稱號
        let nextDaily = useDaily ? 0 : p.dailyGacha;
        let nextAward = useAward ? p.awardGacha - 1 : p.awardGacha;
        
        let nextArts = p.artifacts || [];
        let nextBooks = { ...p.secretBooks };
        let nextPets = { ...(p.pets || {}) }; // ✨ 新增：讀取靈獸池

        if (result.drop) {
            if (result.drop.poolType === 'art') {
                nextArts = [...nextArts, result.drop.id];
            } else if (result.drop.poolType === 'book') {
                nextBooks[result.drop.id] = 1;
            } else if (result.drop.poolType === 'pet') {
                nextPets[result.drop.id] = { lvl: 1, exp: 0 }; // ✨ 新增：靈寵正確寫入
            }
        }

        return { 
          ...p, 
          coins: nextCoins, 
          dailyGacha: nextDaily, 
          awardGacha: nextAward, 
          artifacts: nextArts, 
          secretBooks: nextBooks,
          pets: nextPets // ✨ 新增：回存靈獸池
        };
    });

    // 🎊 顯化異象與日誌
    if (result.drop) {
        const dropTypeName = result.drop.poolType === 'art' ? '法寶' : result.drop.poolType === 'book' ? '功法' : '靈寵';
        setCelebration({ 
          name: result.drop.name, 
          quote: '機緣已至，重寶出世！', 
          drops: [`【${RARITY[result.finalRarity].name}級】${dropTypeName}`] 
        });
        addLog(`[萬寶樓] ${result.log ? result.log + ' ' : ''}獲得【${RARITY[result.finalRarity].name}】${dropTypeName}「${result.drop.name}」！`);
    } else {
        addLog(`[萬寶樓] ${result.log}`);
    }
  };
// END PATCH [修正萬寶樓尋寶靈獸掉落邏輯]

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

// START PATCH [5. 靈獸 UI 狀態與升級邏輯]
  
  // 屬性名稱轉譯器
const getStatName = (k) => ({stone:'靈石掉落',qi:'修為獲取',hp:'氣血上限',def:'防禦減傷',evade:'閃避率',crit:'爆擊率',sense_def:'反噬減傷',revive:'復活機率',streak_cap:'連擊上限',streak_eff:'連擊效率',atk:'戰力',crit_dmg:'爆擊傷害'}[k] || k);
  const handleUpgradePet = (id) => {
    const pet = PET_POOL.find(p => p.id === id);
    const petInfo = player.pets[id];
    const lvl = petInfo.lvl;
    const reqExp = lvl * 60;
    const upCost = Math.floor(pet.baseCost * Math.pow(pet.costMult, lvl - 1) * forgeDiscount);

    if (petInfo.exp >= reqExp && player.coins >= upCost && lvl < 10) {
        setPlayer(p => {
            const nextPets = { ...p.pets };
            nextPets[id] = {
                ...nextPets[id],
                lvl: lvl + 1,
                exp: nextPets[id].exp - reqExp // 扣除歷練，允許溢出保留
            };
            return { ...p, coins: p.coins - upCost, pets: nextPets };
        });
        addLog(`🐾 【萬獸突破】耗費 ${formatNumber(upCost)} 靈石，【${pet.name}】突破至 Lv.${lvl + 1}！`);
    }
  };
// END PATCH [5. 靈獸 UI 狀態與升級邏輯]

// START PATCH [8. 識海投影縱軸與邏輯重構]
  const InsightsChart = () => {
    const data = player.history || [];
    if (data.length < 2) return <div className="h-full flex items-center justify-center text-white/10 uppercase tracking-widest font-bold text-xs">識海未成，尚無投影</div>;
    
    const maxT = Math.max(1, ...data.map(d => d.time || 0));
    const maxIdx = Math.max(1, data.length - 1);

    // X軸為時間 (0% -> 100%)，Y軸為境界進度 (100% -> 0%，從下到上)
    const points = data.map((d, i) => {
      const x = ((d.time || 0) / maxT) * 100;
      const y = 100 - (i / maxIdx) * 100;
      return `${isNaN(x) ? 0 : x},${isNaN(y) ? 0 : y}`;
    }).join(' ');

    // 提取大境界作為 Y 軸的刻度標籤
    const majorMilestones = data.map((d, i) => {
      if (d.name === '一介凡人' || d.name === '渡劫' || d.name.includes('初期')) {
         const y = 100 - (i / maxIdx) * 100;
         const cleanName = d.name.includes('初期') ? d.name.replace('初期', '境') : d.name;
         return { name: cleanName, y };
      }
      return null;
    }).filter(Boolean);

    return (
      <>
        {/* Y 軸大境界標籤與水平虛線 */}
        {majorMilestones.map((m, i) => (
          <div key={`y-${i}`} className="absolute w-full flex items-center pointer-events-none" style={{ top: `${m.y}%`, transform: 'translateY(-50%)', left: 0 }}>
            <div className="absolute right-full mr-2 text-[10px] md:text-xs text-emerald-400 font-bold tracking-widest whitespace-nowrap drop-shadow-md">
              {m.name}
            </div>
            <div className="w-full border-b border-dashed border-white/10" />
          </div>
        ))}

        {/* 成長曲線與節點繪製 */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <polyline fill="none" stroke="rgba(16, 185, 129, 0.6)" strokeWidth="1.5" points={points} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          {data.map((d, i) => {
            const x = ((d.time || 0) / maxT) * 100;
            const y = 100 - (i / maxIdx) * 100;
            const isMajor = d.name === '一介凡人' || d.name === '渡劫' || d.name.includes('初期');
            return (
              <circle 
                key={i} 
                cx={isNaN(x) ? 0 : x} 
                cy={isNaN(y) ? 0 : y} 
                r={isMajor ? "2" : "1.2"} 
                fill={isMajor ? "#34d399" : "#ffffff"} 
                className={isMajor ? "animate-pulse shadow-[0_0_5px_#34d399]" : "opacity-30"} 
              />
            );
          })}
        </svg>

        {/* X 軸時間刻度 */}
        <div className="absolute top-full w-full flex justify-between text-[10px] text-white/40 font-mono mt-2 pt-1">
           <span>0m (開局)</span>
           <span className="text-right tracking-widest">總耗時 {formatNumber(Math.floor(maxT / 60))}m</span>
        </div>
      </>
    );
  };
// END PATCH [8. 識海投影縱軸與邏輯重構]

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
            
<div className="flex justify-start gap-6 md:gap-12 mb-6 bg-black/40 p-4 rounded-xl border border-white/5 flex-shrink-0 overflow-x-auto custom-scrollbar">
               <div className="flex flex-col">
                   <span className="text-[10px] text-white/40 uppercase tracking-widest whitespace-nowrap">累計專注</span>
                   <span className="text-white font-mono whitespace-nowrap">{formatNumber(player.lifetimeStats?.focusCount || 0)} 次</span>
               </div>
               <div className="flex flex-col">
                   <span className="text-[10px] text-white/40 uppercase tracking-widest whitespace-nowrap">擊殺妖獸</span>
                   <span className="text-rose-400 font-mono whitespace-nowrap">{formatNumber(player.lifetimeStats?.kills || 0)} 隻</span>
               </div>
               <div className="flex flex-col">
                   <span className="text-[10px] text-white/40 uppercase tracking-widest whitespace-nowrap">累計靈石</span>
                   <span className="text-yellow-400 font-mono whitespace-nowrap">{formatNumber(player.lifetimeStats?.totalCoins || 0)}</span>
               </div>
               <div className="flex flex-col">
                   <span className="text-[10px] text-white/40 uppercase tracking-widest whitespace-nowrap">收集法寶</span>
                   <span className="text-cyan-400 font-mono whitespace-nowrap">{(player.artifacts || []).length} / {ARTIFACT_POOL.length}</span>
               </div>
               <div className="flex flex-col">
                   <span className="text-[10px] text-white/40 uppercase tracking-widest whitespace-nowrap">領悟祕籍</span>
                   <span className="text-emerald-400 font-mono whitespace-nowrap">{Object.keys(player.secretBooks || {}).filter(k => player.secretBooks[k] > 0).length} / {SECRET_BOOKS.length}</span>
               </div>
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
{showGuide && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-xl p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center font-bold mt-8">
          <div className="w-full max-w-4xl bg-[#0a0a0a] p-4 sm:p-6 md:p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[80vh] animate-pop-in">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 flex-shrink-0">
               <h2 className="text-lg md:text-xl font-black text-white tracking-widest uppercase flex items-center gap-3"><HelpCircle className="text-emerald-400"/> 修行指引與經緯</h2>
               <button onClick={() => setShowGuide(false)} className="p-4 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white"><X size={24}/></button>
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex gap-2 bg-black/60 p-1 rounded-lg border border-white/5 flex-shrink-0 mb-6">
                <button onClick={() => setGuideTab('rules')} className={`flex-1 py-4 text-xs md:text-sm font-bold rounded uppercase tracking-widest transition-all ${guideTab === 'rules' ? 'bg-white/10 text-white shadow-inner' : 'text-white/30 hover:text-white/80'}`}>修行秘聞</button>
                <button onClick={() => setGuideTab('realms')} className={`flex-1 py-4 text-xs md:text-sm font-bold rounded uppercase tracking-widest transition-all ${guideTab === 'realms' ? 'bg-emerald-900/30 text-emerald-400 shadow-inner' : 'text-emerald-500/30 hover:text-emerald-400/80'}`}>天道經緯 (境界表)</button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
                {guideTab === 'rules' ? (
                  <div className="space-y-4 text-sm leading-relaxed animate-pop-in">
                     {/* 原本的 Rules */}
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

                     {/* 原本的 Tips 接續在下方 */}
                     <section className="bg-white/5 p-5 rounded-xl border-l-4 border-purple-500 flex flex-col gap-2 shadow-inner mt-6">
                       <h3 className="text-purple-400 text-base flex items-center gap-2 font-black"><Activity size={18}/> 屬性溢出與劍陣 (流派構築)</h3>
                       <p className="text-white/70 font-bold">閃避率超過 75% 轉化為「連擊上限」；爆擊率超過 95% 以 3 倍轉化為「爆擊傷害」。此外，裝備 2 把以上名劍觸發共鳴：每多一把戰力 <span className="text-emerald-400">+20%</span> (集齊10把可達 +200%)。</p>
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
                       <p className="text-white/70 font-bold mb-2">前期靈石極缺，請優先升級「戰力/氣血」與「陣法」，性價比最高。當你開始抽卡，若該階級圖鑑已滿，每次抽中將有 <span className="text-amber-400">20% 機率引發「突變」</span>躍升至下一階級！</p>
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
                ) : (
                  <div className="w-full bg-[#0a0a0a]/80 rounded-xl border border-white/5 shadow-2xl animate-pop-in">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className="text-xs text-white/30 uppercase tracking-widest border-b border-white/10 bg-black/50">
                              <th className="py-5 px-6 font-mono w-28">位階範圍</th>
                              <th className="py-5 px-6 w-36">境界名號</th>
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
                )}
              </div>
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
                  {renderStatRow('戰力加成', 'atk', `x${getMultiplier('atk').toFixed(2)}`, null, 'text-rose-400')}
                  {renderStatRow('原始氣血上限', 'base_hp', formatNumber(player.baseMaxVitality), null, 'text-emerald-200')}
                  {renderStatRow('氣血上限加成', 'hp', `x${getMultiplier('hp').toFixed(2)}`, null, 'text-emerald-400')}
                  {renderStatRow('修為獲取倍率', 'qi', `x${getMultiplier('qi').toFixed(2)}`, null, 'text-cyan-400')}
                  {renderStatRow('靈石掉落倍率', 'stone', `x${getMultiplier('stone').toFixed(2)}`, null, 'text-yellow-400')}
                </div>
                
                {/* --- 戰鬥極限區 --- */}
                <div className="space-y-2">
                  <h3 className="text-xs text-white/50 uppercase border-b border-white/10 pb-2 mb-4 font-mono tracking-widest flex items-center gap-2"><Flame size={14}/> 戰鬥極限 (COMBAT CAPS)</h3>
                  {renderStatRow('爆擊率', 'crit', `${(critRate * 100).toFixed(1)}%`, '(>95% 溢出轉爆擊傷害)', 'text-purple-300')}
                  {renderStatRow('爆擊傷害', 'crit_dmg', `${(critDmg * 100).toFixed(0)}%`, '(上限 2000%)', 'text-purple-500')}
                  {renderStatRow('連擊上限', 'streak_cap', `+${((streakCap - 0.5) * 100).toFixed(0)}%`, '(上限 800%)', 'text-orange-300')}
                  {renderStatRow('連擊效率加成', 'streak_eff', `x${streakEff.toFixed(2)}`, null, 'text-orange-500')}
                </div>

                {/* --- 生存防禦區 --- */}
                <div className="space-y-2">
                  <h3 className="text-xs text-white/50 uppercase border-b border-white/10 pb-2 mb-4 font-mono tracking-widest flex items-center gap-2"><Shield size={14}/> 生存防禦 (DEFENSE)</h3>
                  {renderStatRow('閃避率', 'evade', `${(evadeRate * 100).toFixed(1)}%`, '(>75% 溢出轉連擊上限)', 'text-teal-300')}
                  {renderStatRow('復活機率', 'revive', `${(reviveRate * 100).toFixed(1)}%`, '(上限 65%)', 'text-teal-500')}
                  {renderStatRow('防禦減傷比例', 'def', `${dmgTakenPct.toFixed(1)}%`, '(由顛倒五行與防禦力計算)', 'text-blue-300')}
                  {renderStatRow('反噬減傷', 'sense_def', `${((Math.min(0.9, getMultiplier('sense_def') - 1)) * 100).toFixed(1)}%`, '(無視空間鎖定，上限 90%)', 'text-blue-500')}
                  {renderStatRow('護盾', 'streak_shield', `${player.streakShields} 層`, '(由法寶或特殊功法提供)', 'text-cyan-400')}
                </div>

                {/* --- 機緣經濟區 --- */}
                <div className="space-y-2">
                  <h3 className="text-xs text-white/50 uppercase border-b border-white/10 pb-2 mb-4 font-mono tracking-widest flex items-center gap-2"><Compass size={14}/> 機緣經濟 (ECONOMY)</h3>
                  {renderStatRow('氣運保底倍率', 'luck_floor', `x${getMultiplier('luck_floor').toFixed(2)}`, '(乘算奇遇與抽獎)', 'text-amber-300')}
                  {renderStatRow('洞府成本', 'forge_discount', `${(forgeDiscount * 100).toFixed(0)}%`, '(底限 10%)', 'text-amber-500')}
                  {renderStatRow('吸血率', 'lifesteal', `${((getMultiplier('lifesteal') - 1) * 100).toFixed(1)}%`, '(爆擊時 30% 機率觸發)', 'text-pink-400')}
                  {renderStatRow('打坐回血', 'heal_bonus', `${(healPct * 100).toFixed(1)}%`, '(上限 80%)', 'text-emerald-300')}
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

<div className={`w-full max-w-4xl transition-all duration-700 ease-in-out z-10 font-bold px-2 md:px-0 ${isActive ? 'opacity-0 max-h-0 overflow-hidden m-0 p-0 pointer-events-none' : 'opacity-100 max-h-[1500px] mb-6 mt-10'}`}>        <div className="flex flex-col items-center mb-8 h-10 justify-center">
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
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase text-white drop-shadow-lg">
                      {currentRealmData.name}
                    </h2>
                    {player.equippedTitle && (
                      <span className="inline-flex items-center text-amber-400 border border-amber-500/50 bg-amber-950/50 px-2 py-0.5 rounded text-[10px] sm:text-xs tracking-widest font-black shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                        [{TITLE_DATA.find(t=>t.id===player.equippedTitle)?.name}]
                      </span>
                    )}
                  </div>
                  
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
                  
                    {player.activePet && player.pets?.[player.activePet] && (
                      <span className="text-amber-400 border border-amber-500/50 bg-amber-950/50 px-2.5 py-1 rounded-md text-[10px] sm:text-xs tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                        🐾 {PET_POOL.find(p=>p.id===player.activePet)?.name} (Lv.{player.pets[player.activePet].lvl})
                      </span>
                    )}

                  </div>
                  
                  <p className={`text-xs md:text-sm leading-tight ${activeColorClass.text} font-bold mt-2 opacity-90 italic drop-shadow-md truncate`}>
                    {currentRealmData.desc}
                  </p>
                </div>
            </div>

{/* --- 右側狀態列 --- */}
            <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-nowrap justify-start md:justify-end items-start md:items-end gap-x-6 gap-y-4 w-full md:w-auto mt-4 md:mt-0">
               {/* 1. 靈石 */}
               <div className="flex flex-col items-start md:items-end">
                  <span className="text-xs text-yellow-500 uppercase font-black flex items-center gap-1.5 mb-1"><Coins size={12}/> 靈石</span>
                  <span className="text-base text-yellow-500 font-mono font-bold drop-shadow-md">{formatNumber(player.coins)}</span>
               </div>

{/* 2. 連擊 (支援點按/懸浮顯示演算公式) */}
<div className="flex flex-col items-start md:items-end relative group cursor-pointer outline-none" tabIndex="0">
   <span className="text-xs text-rose-500 uppercase font-black flex items-center gap-1.5 mb-1 transition-colors group-hover:text-rose-400">
      <Sword size={12}/> 連擊 <Info size={12} className="text-rose-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
   </span>
   
   {/* 雙軌顯示：層數 + 總增傷百分比 */}
   <span className={`text-base text-rose-500 font-mono font-bold drop-shadow-md transition-all duration-500 flex flex-wrap items-center gap-1.5 justify-end ${comboMultiplier > 2.0 ? 'text-rose-300 scale-110 animate-pulse drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]' : ''}`}>
      <span>{player.streakCount || 0} 層</span>
      {(player.streakCount || 0) > 0 && (
          <span className="text-[10px] text-rose-400/90 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30 font-black shadow-sm">
              +{((comboMultiplier - 1) * 100).toFixed(0)}%
          </span>
      )}
      {maxStreakShields > 0 && <span className="text-cyan-400 text-xs ml-1 flex items-center">🛡️{player.streakShields}</span>}
   </span>

   {/* 懸浮/點按展開之演算公式面板 */}
   <div className="absolute top-full right-0 mt-2 w-56 bg-black/95 border border-rose-500/50 rounded-xl p-3 shadow-[0_0_30px_rgba(244,63,94,0.3)] opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus:opacity-100 group-focus:visible transition-all duration-300 z-[100] pointer-events-none backdrop-blur-md">
      <div className="text-[10px] text-rose-400/60 mb-1 border-b border-rose-500/20 pb-1 font-black tracking-widest uppercase flex justify-between">
         <span>天道演算</span>
         <span>連擊增傷</span>
      </div>
      <div className="text-[9px] text-rose-300/40 mb-3 font-mono tracking-widest">
         公式：層數 × 5% × 效率加成
      </div>
      
      <div className="text-xs font-mono text-rose-200 flex flex-col gap-1.5">
         <div className="flex justify-between items-center">
            <span className="text-white/60">當前層數</span>
            <span>{player.streakCount || 0} 層</span>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-white/60">基礎增傷</span>
            <span>5%</span>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-white/60">連擊效率加成</span>
            <span>x{streakEff.toFixed(2)}</span>
         </div>
         
         <div className="my-1 border-t border-rose-500/20 border-dashed"></div>
         
         <div className="flex justify-between items-center font-black text-rose-400 text-sm drop-shadow-md">
            <span>面板總增傷</span>
            <span>+{((comboMultiplier - 1) * 100).toFixed(0)}%</span>
         </div>
         
         {/* 封頂提示 */}
         <div className="flex justify-between items-center text-[10px] font-bold text-orange-400 mt-2 bg-orange-950/40 px-2 py-1.5 rounded border border-orange-500/20">
            <span>天花板 (連擊上限)</span>
            <span>+{((streakCap - 0.5) * 100).toFixed(0)}%</span>
         </div>
      </div>
   </div>
</div>
            </div>
</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-3 relative z-10">
                <div className="flex justify-between text-xs uppercase font-black opacity-60 tracking-widest text-white">
                    <span className="flex items-center gap-2">氣血</span>
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
<div className={`flex justify-center items-center flex-wrap gap-x-2 gap-y-1 mb-2 px-2 text-sm md:text-base tracking-widest sm:tracking-[0.3em] font-black uppercase transition-colors text-center leading-normal ${monster.name.includes('死劫') || monster.name.includes('劫') ? 'text-rose-500 animate-pulse' : 'text-rose-400'}`}>
              <Compass size={18} className="flex-shrink-0"/> 
              <span>{monster.name.replace(' [死劫/瓶頸]', ' [死劫]')}</span>
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

        </div>
      </div>

<div className={`w-full max-w-4xl transition-all duration-700 ease-in-out z-10 font-bold ${isActive ? 'opacity-0 max-h-0 overflow-hidden m-0 p-0 pointer-events-none' : 'opacity-100 max-h-[2500px] mt-4'}`}>        <div className="bg-slate-950/90 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-2xl flex flex-col h-[800px] overflow-hidden">
          <div className="flex bg-black/80 border-b border-white/10 p-2 gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
{[
  { id: 'log', label: '修行日誌', icon: History },
  { id: 'skills', label: '功法祕籍', icon: ScrollText, hasNotify: availableSP >= 1 }, // ✨ 新增：未使用的 SP 紅點提示
  { id: 'forge', label: '洞府淬煉', icon: Hammer, hasNotify: ((player.dailyGacha || 0) + (player.awardGacha || 0) > 0) || (player.epiphanyPills || 0) > 0 },
  { id: 'artifacts', label: '藏寶閣', icon: Box },
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
                {/* 將 grid-cols-4 改為 md:grid-cols-2 實現 2x2 佈局 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className={`p-8 rounded-2xl border min-h-[16rem] flex flex-col justify-between group transition-all ${player.epiphanyPills > 0 ? 'bg-orange-950/40 border-orange-500/40 shadow-xl shadow-orange-900/20' : 'bg-white/10 border-white/20'}`}>
                    <div>
                      <h3 className={`font-black text-xl md:text-2xl tracking-tighter uppercase flex items-center gap-3 whitespace-nowrap ${player.epiphanyPills > 0 ? 'text-orange-400' : 'text-white'}`}>
                        <Pill size={24} className="flex-shrink-0"/> 頓悟丹 {player.epiphanyPills > 0 ? `${player.epiphanyPills} 枚` : '0 枚'}
                      </h3>
                      <p className={`text-sm mt-3 italic tracking-widest leading-relaxed ${player.epiphanyPills > 0 ? 'text-white/70' : 'text-white/60'}`}>
                        點按可直接發動一次 25m 的蓄力攻擊。
                        {pillCooldownRemaining > 0 && <span className="block text-rose-400 mt-1 font-mono">丹毒未消：{formatTime(pillCooldownRemaining)}</span>}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleComplete(true)} 
                      disabled={!canUsePill} 
                      className={`w-full py-5 rounded-xl font-black uppercase text-sm transition-all border mt-6 tracking-widest ${canUsePill ? 'bg-orange-600 hover:bg-orange-500 text-white border-orange-400 shadow-lg' : 'bg-black/40 text-white/30 border-white/10 cursor-not-allowed'}`}
                    >
                      {player.epiphanyPills > 0 ? (canUsePill ? '吞服' : '丹毒未消') : '尚無丹藥'}
                    </button>
                  </div>
                  <div className="p-8 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 min-h-[16rem] flex flex-col justify-between group shadow-xl shadow-emerald-900/20">
                    <div><h3 className="text-emerald-400 font-black text-xl md:text-2xl tracking-tighter uppercase flex items-center gap-3 whitespace-nowrap"><Pill size={24} className="flex-shrink-0"/> 煉製回春丹</h3><p className="text-white/70 text-sm mt-3 italic tracking-widest leading-relaxed">恢復 50% 氣血。</p></div>
                    <button onClick={handleHeal} disabled={player.coins < healCost || player.vitality >= maxVitality} className="w-full py-5 bg-emerald-900/80 hover:bg-emerald-600 text-emerald-100 rounded-xl font-black uppercase text-sm transition-all disabled:opacity-40 border border-emerald-500/50 mt-6 whitespace-nowrap">{player.vitality >= maxVitality ? '氣血已滿' : `煉丹 (${formatNumber(healCost)} 靈石)`}</button>
                  </div>
                  <div className="p-8 rounded-2xl bg-white/10 border border-white/20 min-h-[16rem] flex flex-col justify-between group">
                      <div><h3 className="text-white font-black text-xl md:text-2xl tracking-tighter uppercase whitespace-nowrap">凝練劍光</h3><p className="text-white/60 text-sm mt-3 italic tracking-widest">戰力 +100。<br/>(花費指數提升，無極限)</p></div>
                      <button onClick={() => { if(player.coins >= upgCostAtk) setPlayer(p => ({ ...p, coins: p.coins - upgCostAtk, baseCombat: p.baseCombat + 100 })) }} disabled={player.coins < upgCostAtk} className="w-full py-5 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl font-black uppercase text-sm tracking-widest shadow-xl transition-all disabled:opacity-30 mt-6 whitespace-nowrap">祭煉 ({formatNumber(upgCostAtk)} 靈石)</button>
                  </div>
                  <div className="p-8 rounded-2xl bg-white/10 border border-white/20 min-h-[16rem] flex flex-col justify-between group">
                      <div><h3 className="text-white font-black text-xl md:text-2xl tracking-tighter uppercase whitespace-nowrap">熬煉肉身</h3><p className="text-white/60 text-sm mt-3 italic tracking-widest">氣血上限 +100。<br/>(花費指數提升，無極限)</p></div>
                      <button onClick={() => { if(player.coins >= upgCostHp) setPlayer(p => ({ ...p, coins: p.coins - upgCostHp, baseMaxVitality: p.baseMaxVitality + 100, vitality: p.vitality + 100 })) }} disabled={player.coins < upgCostHp} className="w-full py-5 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl font-black uppercase text-sm tracking-widest shadow-xl transition-all disabled:opacity-30 mt-6 whitespace-nowrap">熬煉 ({formatNumber(upgCostHp)} 靈石)</button>
                  </div>
                </div>
                
                <div className="space-y-6">
                   <h3 className="text-white/60 text-sm font-black uppercase border-b border-white/20 pb-4">陣法樞紐 (無上限)</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      <div className="bg-white/10 p-8 rounded-2xl border border-white/20 min-h-[14rem] flex flex-col justify-between shadow-inner"><div className="flex justify-between text-base text-white font-bold drop-shadow-md">聚靈大陣 <span className="opacity-60 font-mono">Lv.{player.arrays?.qi||0}</span></div><p className="text-sm opacity-70 italic mt-2">靈氣獲取提升 +5%/級</p><button onClick={() => { if(player.coins >= arrayQiCost) setPlayer(p => ({ ...p, coins: p.coins - arrayQiCost, arrays: {...p.arrays, qi: (p.arrays?.qi||0)+1} })) }} disabled={player.coins < arrayQiCost} className="w-full py-4 mt-6 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl text-sm font-black border border-white/20 transition-all disabled:opacity-30">升級 ({formatNumber(arrayQiCost)} 靈石)</button></div>
                      <div className="bg-white/10 p-8 rounded-2xl border border-white/20 min-h-[14rem] flex flex-col justify-between shadow-inner"><div className="flex justify-between text-base text-white font-bold drop-shadow-md">顛倒五行陣 <span className="opacity-60 font-mono">Lv.{player.arrays?.def||0}</span></div><p className="text-sm opacity-70 italic text-white mt-2">防禦減傷提升 +5%/級</p><button onClick={() => { if(player.coins >= arrayDefCost) setPlayer(p => ({ ...p, coins: p.coins - arrayDefCost, arrays: {...p.arrays, def: (p.arrays?.def||0)+1} })) }} disabled={player.coins < arrayDefCost} className="w-full py-4 mt-6 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl text-sm font-black border border-white/20 transition-all disabled:opacity-30">升級 ({formatNumber(arrayDefCost)} 靈石)</button></div>
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
              <div className="flex flex-col animate-pop-in pb-10">
                <div className="flex gap-2 bg-black/60 p-1 rounded-lg border border-white/5 flex-shrink-0 mb-8 w-full max-w-sm mx-auto shadow-inner">
                  <button onClick={() => setTreasureTab('arts')} className={`flex-1 py-3 text-xs md:text-sm font-bold rounded uppercase tracking-widest transition-all ${treasureTab === 'arts' ? 'bg-white/10 text-white shadow-md' : 'text-white/30 hover:text-white/80'}`}>萬寶圖鑑</button>
                  <button onClick={() => setTreasureTab('pets')} className={`flex-1 py-3 text-xs md:text-sm font-bold rounded uppercase tracking-widest transition-all ${treasureTab === 'pets' ? 'bg-amber-900/40 text-amber-500 shadow-md' : 'text-amber-500/30 hover:text-amber-400/80'}`}>靈獸空間</button>
                </div>

                {treasureTab === 'arts' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 animate-pop-in">
                    {sortedArtifacts.map(art => {
                      const unlocked = (player.artifacts || []).includes(art.id);
                      return unlocked ? (
                        <div key={art.id} className={`p-8 rounded-2xl border bg-black/60 border-white/20 flex flex-col justify-center shadow-inner min-h-[14rem] relative overflow-hidden group`}>
                            <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black tracking-widest bg-white/10 ${RARITY[art.rarity].color} rounded-bl-xl border-b border-l border-white/10`}>
                              {RARITY[art.rarity].name}
                            </div>
                            <h4 className={`font-black text-xl ${RARITY[art.rarity].color} tracking-tighter drop-shadow-md mb-4 mt-2`}>{art.name}</h4>
                            <p className="text-sm text-white/70 italic leading-relaxed uppercase tracking-widest">「{art.desc}」</p>
                        </div>
                      ) : <div key={art.id} className="p-8 rounded-2xl border-2 border-dashed border-white/10 bg-black/50 flex flex-col items-center justify-center opacity-50 min-h-[14rem]"><EyeOff size={40} className="text-white/30 mb-5"/><p className="text-xs font-black text-white/50 uppercase tracking-[0.3em]">寶光內斂：{RARITY[art.rarity].name}</p></div>;
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-pop-in">
                    {PET_POOL.map(pet => {
                      const petInfo = player.pets?.[pet.id];
                      const unlocked = !!petInfo;
                      
                      if (!unlocked) {
                          return (
                              <div key={pet.id} className="p-8 rounded-2xl border-2 border-dashed border-amber-900/30 bg-black/50 flex flex-col items-center justify-center opacity-50 min-h-[18rem]">
                                  <EyeOff size={40} className="text-amber-900/50 mb-5"/>
                                  <p className="text-xs font-black text-amber-700/50 uppercase tracking-[0.3em]">獸影朦朧：{RARITY[pet.rarity].name}</p>
                              </div>
                          );
                      }

                      const lvl = petInfo.lvl;
                      const exp = petInfo.exp || 0;
                      const reqExp = lvl * 60;
                      const isMax = lvl >= 10;
                      const isActive = player.activePet === pet.id;
                      const upCost = Math.floor(pet.baseCost * Math.pow(pet.costMult, lvl - 1) * forgeDiscount);

                      return (
                        <div key={pet.id} className={`p-6 md:p-8 rounded-2xl border transition-all flex flex-col justify-between min-h-[18rem] relative overflow-hidden ${isActive ? 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'bg-black/60 border-white/10'}`}>
                            <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black tracking-widest bg-white/10 ${RARITY[pet.rarity].color} rounded-bl-xl border-b border-l border-white/10`}>
                              {RARITY[pet.rarity].name}
                            </div>
                            
                            <div className="flex justify-between items-start mb-4 mt-1">
                                <div>
                                    <h4 className={`font-black text-xl md:text-2xl tracking-widest flex items-center gap-2 ${RARITY[pet.rarity].color} drop-shadow-md`}>
                                        {pet.name} 
                                        {isActive && <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded-full uppercase tracking-widest ml-2 animate-pulse">護法中</span>}
                                    </h4>
                                    <div className="text-white/50 text-[10px] font-mono mt-2 tracking-widest">當前境界：Lv.{lvl} {isMax && '(已臻化境)'}</div>
                                </div>
                            </div>
                            
                            <div className="bg-black/40 rounded-xl p-4 md:p-5 border border-white/5 mb-5 flex-1 shadow-inner">
                                <div className="text-[11px] md:text-xs space-y-2.5">
                                    {Object.keys(pet.val).map(k => (
                                       <div key={k} className="flex justify-between text-white/70 border-b border-white/5 pb-1.5">
                                           <span>被動 [{getStatName(k)}]:</span>
                                           <span className="font-mono text-emerald-400 font-bold drop-shadow-md">
                                               {k === 'streak_cap' ? '+' + (pet.val[k] + (lvl-1)*pet.growth[k]).toFixed(2) : '+' + ((pet.val[k] + (lvl-1)*pet.growth[k])*100).toFixed(0) + '%'}
                                           </span>
                                       </div>
                                    ))}
                                    <div className="flex justify-between text-white/70 border-b border-white/5 pb-1.5 pt-1">
                                        <span className="text-amber-400/90 font-bold">神通 [{pet.triggerName}]:</span>
                                        <span className="font-mono text-amber-400 font-black drop-shadow-md">觸發率 {((pet.triggerBase + (lvl-1)*pet.triggerGrowth)*100).toFixed(0)}%</span>
                                    </div>
                                    <div className="text-white/40 italic mt-3 leading-relaxed">"{pet.triggerDesc}"</div>
                                </div>
                            </div>

                            <div className="bg-black/60 p-4 rounded-xl border border-white/5 text-xs shadow-inner">
                                <div className="flex justify-between mb-2 text-[10px] uppercase tracking-widest">
                                    <span className="text-white/50">相伴歷練 (專注)</span>
                                    <span className="font-mono text-white/80">{isMax ? '∞' : `${exp} / ${reqExp} 載`}</span>
                                </div>
                                <div className="w-full bg-black/80 rounded-full h-1.5 mb-4 overflow-hidden border border-white/10">
                                    <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full transition-all duration-1000 shadow-[0_0_10px_#fbbf24]" style={{width: isMax ? '100%' : `${Math.min(100, (exp/reqExp)*100)}%`}}></div>
                                </div>
                                
                                <div className="flex gap-3">
                                    <button onClick={() => setPlayer(p => ({...p, activePet: isActive ? null : pet.id}))} className={`flex-1 py-3.5 rounded-lg border font-black transition-all text-[11px] tracking-widest ${isActive ? 'bg-amber-900/60 text-amber-400 border-amber-500/50 hover:bg-amber-950' : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'}`}>
                                        {isActive ? '召回洞府' : '隨身護法'}
                                    </button>
                                    {!isMax && (
                                        <button onClick={() => handleUpgradePet(pet.id)} disabled={exp < reqExp || player.coins < upCost} className={`flex-[1.5] py-3.5 rounded-lg border font-black transition-all text-[11px] tracking-widest ${exp >= reqExp && player.coins >= upCost ? 'bg-emerald-900/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600 hover:text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-black/50 text-white/30 border-white/5 cursor-not-allowed'}`}>
                                            {exp < reqExp ? `歷練不足` : `投餵突破 (${formatNumber(upCost)})`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                {(player.logs || []).map((e, i) => (
                  <div key={i} className={`p-5 md:p-6 rounded-xl border leading-relaxed transition-all whitespace-pre-wrap text-xs md:text-sm ${i === 0 ? 'bg-white/20 text-white shadow-xl animate-pulse border-white/20' : 'bg-black/60 border-white/10 text-white/60'}`}>
                    {e}
                  </div>
                ))}
              </div>
            )}
          </div> {/* 1. 閉合 Tab Content Container */}
        </div> {/* 2. 閉合 Tab Box Card */}
      </div> {/* 3. 閉合 Tab Wrapper */}

{/* ✨ Patch 4 開始：萬仙榜彈窗 UI 與 底部導覽列重構 ✨ */}
      {showRankings && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-xl p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center font-bold mt-8">
          <div className="w-full max-w-4xl bg-[#0a0a0a] p-4 sm:p-6 md:p-8 rounded-2xl border border-amber-500/30 shadow-2xl flex flex-col max-h-[85vh] animate-pop-in">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 flex-shrink-0">
               <h2 className="text-xl md:text-2xl font-black text-amber-400 tracking-widest uppercase flex items-center gap-3"><Trophy className="text-amber-500"/> 萬仙爭鋒榜</h2>
               <button onClick={() => setShowRankings(false)} className="p-4 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white"><X size={24}/></button>
            </div>
            
            {/* 道號登錄區 */}
            {!player.nickname ? (
              <div className="p-6 md:p-10 text-center bg-amber-950/20 border border-amber-900/50 rounded-xl mb-4">
                <p className="text-sm md:text-base text-amber-200 mb-6 leading-relaxed">欲在萬仙榜留名青史，請先賜下道號。<br/><span className="text-xs text-white/50">(2-8字，受天道法則限制，每三日僅能更名一次)</span></p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input value={nicknameInput} onChange={e=>setNicknameInput(e.target.value)} className="bg-black/80 border border-white/20 px-6 py-4 flex-1 rounded-xl text-white text-center sm:text-left focus:border-amber-500 outline-none" placeholder="輸入道號..."/>
                  <button onClick={handleSetNickname} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-4 rounded-xl font-black transition-colors whitespace-nowrap">刻錄天道</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-start gap-4 mb-6 bg-black/40 p-2 rounded-xl border border-white/5 flex-shrink-0 overflow-x-auto custom-scrollbar">
                <button onClick={()=>setActiveRankTab('realm')} className={`flex-1 min-w-[100px] py-4 text-xs md:text-sm font-bold rounded-lg uppercase tracking-widest transition-all ${activeRankTab==='realm'?'bg-amber-600 text-white shadow-md':'text-white/40 hover:text-white/80'}`}>境界榜</button>
                <button onClick={()=>setActiveRankTab('focus')} className={`flex-1 min-w-[100px] py-4 text-xs md:text-sm font-bold rounded-lg uppercase tracking-widest transition-all ${activeRankTab==='focus'?'bg-amber-600 text-white shadow-md':'text-white/40 hover:text-white/80'}`}>歲月榜</button>
                <button onClick={()=>setActiveRankTab('power')} className={`flex-1 min-w-[100px] py-4 text-xs md:text-sm font-bold rounded-lg uppercase tracking-widest transition-all ${activeRankTab==='power'?'bg-amber-600 text-white shadow-md':'text-white/40 hover:text-white/80'}`}>實力榜</button>
              </div>
            )}

            {/* 榜單列表 */}
            {player.nickname && (
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {rankings[activeRankTab].map((user, idx) => (
                  <div key={idx} className={`p-4 md:p-5 rounded-xl flex items-center justify-between border transition-all ${idx === 0 ? 'bg-yellow-950/40 border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.2)] scale-[1.02]' : idx === 1 ? 'bg-slate-800/60 border-slate-400/50' : idx === 2 ? 'bg-amber-950/30 border-amber-700/50' : 'bg-black/60 border-white/5'}`}>
                    <div className="flex items-center gap-4 md:gap-6">
                      <span className={`text-lg md:text-2xl font-black w-8 text-center ${idx === 0 ? 'text-yellow-400 drop-shadow-md' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-white/20'}`}>{idx + 1}</span>
                      <div>
                        <div className="text-sm md:text-base font-black text-white tracking-widest mb-1">{user.nickname} <span className="text-[10px] md:text-xs text-amber-500/70 border border-amber-500/30 bg-amber-950/50 px-1.5 py-0.5 rounded ml-1">[{user.title}]</span></div>
                        <div className={`text-[10px] md:text-xs font-bold ${idx < 3 ? 'text-emerald-400' : 'text-white/50'}`}>{REALMS[user.realmIndex]?.name || '未知境界'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{activeRankTab === 'realm' ? '修為' : activeRankTab === 'focus' ? '總時長' : '綜合靈壓'}</div>
                      <div className="text-sm md:text-base font-mono font-black text-cyan-400 drop-shadow-md">
                        {activeRankTab === 'realm' ? formatNumber(user.qi) : activeRankTab === 'focus' ? `${formatNumber(Math.floor((user.totalFocusTime||0)/60))}m` : formatNumber(user.comprehensiveCP)}
                      </div>
                    </div>
                  </div>
                ))}
                {rankings[activeRankTab].length === 0 && !isLoadingRank && <div className="text-center text-white/30 py-10 tracking-widest">天道茫茫，尚未有人登榜。</div>}
              </div>
            )}
            
            {player.nickname && (
              <button onClick={fetchRankings} className="mt-6 py-4 w-full bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 flex-shrink-0">
                <RefreshCw size={16} className={isLoadingRank ? 'animate-spin' : ''}/> 感應最新天機
              </button>
            )}
          </div>
        </div>
      )}

      {/* 底部導覽列 */}
<footer className={`text-center text-xs font-light text-white/50 tracking-[0.5em] uppercase flex flex-col items-center z-10 px-4 w-full transition-all duration-700 ease-in-out ${isActive ? 'opacity-0 max-h-0 overflow-hidden m-0 p-0 gap-0 pointer-events-none' : 'opacity-100 max-h-[1000px] pt-20 pb-32 gap-6'}`}>        <div className="w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 mb-4 mx-auto">
           <button onClick={() => setShowTitles(true)} className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-black text-amber-400 hover:text-amber-300 transition-all bg-white/5 hover:bg-white/10 py-4 px-2 sm:px-6 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg tracking-widest"><Award size={18}/> <span className="whitespace-nowrap">名號頭銜</span></button>
           
           <button onClick={() => { setShowGuide(true); setGuideTab('rules'); }} className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-black text-emerald-400 hover:text-emerald-300 transition-all bg-white/5 hover:bg-white/10 py-4 px-2 sm:px-6 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg tracking-widest"><HelpCircle size={18}/> <span className="whitespace-nowrap">修行指引</span></button>
           
           <button onClick={() => setShowStatsReport(true)} className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-black text-cyan-400 hover:text-cyan-300 transition-all bg-white/5 hover:bg-white/10 py-4 px-2 sm:px-6 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg tracking-widest"><BarChart3 size={18}/> <span className="whitespace-nowrap">屬性極限</span></button>
           
           <button onClick={() => { setShowRankings(true); fetchRankings(); }} className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-black text-yellow-500 hover:text-yellow-400 transition-all bg-yellow-950/30 hover:bg-yellow-900/50 border border-yellow-500/30 py-4 px-2 sm:px-6 rounded-2xl backdrop-blur-md shadow-[0_0_15px_rgba(234,179,8,0.2)] tracking-widest relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <Trophy size={18} className="animate-pulse"/> <span className="whitespace-nowrap">萬仙爭鋒</span>
           </button>
        </div>

        <div className="w-full max-w-2xl mb-8 flex justify-center">
           <button onClick={() => setShowSaveModal(true)} className="flex items-center justify-center gap-2 text-cyan-400 hover:text-cyan-300 transition-all bg-cyan-950/40 hover:bg-cyan-900/60 py-3 px-6 rounded-full border border-cyan-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)] font-black tracking-widest"><ScrollText size={16}/> 玉簡傳功 (進度跨裝置同步)</button>
        </div>
        <p className="leading-relaxed">《凡人修仙傳》原著設定歸作者 忘語 所有</p>
        <p className="opacity-80 leading-loose">Created by <a href="https://www.facebook.com/profile.php?id=100084000897269" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline transition-all text-white">fb/指數三寶飯</a> <br className="block sm:hidden mt-2" /><span className="sm:ml-3">with Gemini</span></p>
        <div className="flex w-full max-w-md justify-center gap-3 mt-4">
            <button onClick={() => setShowChangelog(true)} className="flex-1 sm:flex-none opacity-60 hover:opacity-100 transition-all border border-white/30 py-3 px-2 sm:px-6 rounded-2xl text-xs tracking-widest hover:bg-emerald-900/60 hover:border-emerald-500/60 hover:text-emerald-200 flex flex-col items-center justify-center gap-1.5"><FileText size={14}/> <span>天道紀元</span><span className="text-[9px] opacity-50 font-mono">(版本紀錄)</span></button>
            <button onClick={()=>{if(window.confirm('【天道輪迴】\n確定要刪除所有進度，重新投胎轉世嗎？\n所有成果將灰飛煙滅。')) { localStorage.clear(); window.location.reload(); }}} className="flex-1 sm:flex-none opacity-60 hover:opacity-100 transition-all border border-white/30 py-3 px-2 sm:px-6 rounded-2xl text-xs tracking-widest hover:bg-rose-900/60 hover:border-rose-500/60 hover:text-rose-200 flex flex-col items-center justify-center gap-1.5"><RefreshCw size={14}/> <span>輪迴轉世</span><span className="text-[9px] opacity-50 font-mono">(刪檔)</span></button>
        </div>
      </footer>
      {/* ✨ Patch 4 結束 ✨ */}
    </div> // 4. 閉合根節點 Root Div (min-h-screen)
  );
}

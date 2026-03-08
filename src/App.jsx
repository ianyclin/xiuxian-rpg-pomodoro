import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Square, Skull, Shield, Zap, Flame, Wind, Coins, Hammer, Box, ScrollText, Network, AlertTriangle, EyeOff, Crown, ChevronsUp, RefreshCw, Zap as Lightning, CloudLightning, Info, Eye, Activity, Sparkles, Sword, Compass, Clover, Lock, BookOpen, X, History, BarChart3, Save, Pill, HelpCircle, Lightbulb, ShieldAlert, Dice6 } from 'lucide-react';

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
 * 1. 靜態數據定義
 * ========================================================
 */

const FOCUS_OPTIONS = [
  { label: '15m', value: 15 * 60 },
  { label: '25m', value: 25 * 60 },
  { label: '45m', value: 45 * 60 },
  { label: '60m', value: 60 * 60 }
];

const FORTUNES = [
  { name: '天道寵兒', color: 'text-yellow-400', luck: 0.5, desc: '諸事順遂，氣運保底大幅提升。' },
  { name: '靈氣親和', color: 'text-emerald-400', luck: 0.2, desc: '感應天地，修為獲取小幅提升。' },
  { name: '劍意通心', color: 'text-rose-400', luck: 0.1, desc: '殺伐果斷，戰鬥傷害與爆擊提升。' },
  { name: '凡夫俗子', color: 'text-slate-400', luck: 0.0, desc: '平平無奇，唯有苦修方能成道。' },
  { name: '福禍相依', color: 'text-purple-400', luck: 0.15, desc: '氣運雖增，但反噬傷害加重。' },
  { name: '機緣不彰', color: 'text-blue-400', luck: -0.1, desc: '近期運勢低迷，尋寶不易。' },
  { name: '霉運當頭', color: 'text-red-500', luck: -0.25, desc: '天道棄子，反噬機率提升，氣運降低。' }
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

const ARTIFACT_POOL = [
  { id: 'a01', rarity: 'COMMON', name: '鐵木盾', desc: '抵禦外魔 (反噬減傷 +2%)', val: { def: 0.02 } },
  { id: 'a02', rarity: 'COMMON', name: '青銅戈', desc: '凡兵銳氣 (基礎戰力 +4%)', val: { atk: 0.04 } },
  { id: 'a03', rarity: 'COMMON', name: '凝神蒲團', desc: '固本培元 (回血+2%，修為+2%)', val: { heal_bonus: 0.02, qi: 0.02 } },
  { id: 'a10', rarity: 'UNCOMMON', name: '神風舟', desc: '御風而行 (閃避率 +5%)', val: { evade: 0.05 } },
  { id: 'a20', rarity: 'RARE', name: '青蛟旗', desc: '妖魂鎮壓 (戰力加成 +15%)', val: { atk: 0.15 } },
  { id: 'a30', rarity: 'EPIC', name: '虛天鼎 (仿)', desc: '鎮壓氣運 (減傷+15%，氣運保底+0.15/級)', val: { def: 0.15, luck_floor: 0.15 } },
  { id: 'a41', rarity: 'LEGENDARY', name: '青竹蜂雲劍', desc: '本命劍陣 (戰力+50%，連擊效率+50%，爆擊+10%/級)', val: { atk: 0.50, streak_eff: 0.50, crit: 0.10 }, tags: ['sword'] },
  { id: 'a50', rarity: 'MYTHIC', name: '玄天斬靈劍', desc: '法則破壞 (戰力+150%，爆傷+150%/級)', val: { atk: 1.50, crit_dmg: 1.50 }, tags: ['sword'] },
  { id: 'a60', rarity: 'DIVINE', name: '掌天瓶', desc: '奪天地造化 (靈氣+300%，靈石+150%/級)', val: { qi: 3.00, stone: 1.50 } },
];

const SECRET_BOOKS = [
  { id: 's_01', rarity: 'UNCOMMON', name: '羅煙步', desc: '閃避靈壓。閃避率 +8%/級', val: { evade: 0.08 } },
  { id: 's_02', rarity: 'RARE', name: '血靈鑽', desc: '爆擊加成。爆擊傷害 +40%/級', val: { crit_dmg: 0.40 } },
  { id: 's_03', rarity: 'RARE', name: '大衍決', desc: '神識預判。效率+15%，反噬基礎減傷+15%/級', val: { streak_eff: 0.15, sense_def: 0.15 } },
  { id: 's_04', rarity: 'EPIC', name: '大庚劍陣', desc: '無堅不摧。戰力+30%，連擊上限+30%/級', val: { atk: 0.30, streak_cap: 0.30 } },
  { id: 's_05', rarity: 'LEGENDARY', name: '元磁神光', desc: '克制五行。戰力與減傷 +20%/級', val: { atk: 0.20, def: 0.20 } },
  { id: 's_06', rarity: 'MYTHIC', name: '梵聖真魔功', desc: '法相金身。戰力+50%，減傷+10%/級', val: { atk: 0.50, def: 0.10 } },
  { id: 's_11', rarity: 'DIVINE', name: '涅槃金身', desc: '不死不滅。復活機率 +8%/級', val: { revive: 0.08 } },
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
    streakCount: 0, streakShields: 0, fortuneIndex: 3, totalFocusTime: 0, history: [], hasAscended: false,
    logs: ['【系統】天道印記已連結，V69.5 散功重修版載入中。'] 
  };

  const [player, setPlayer] = useState(() => {
    try {
      const saved = localStorage.getItem('xianxia_master_v69_5');
      if (saved) return { ...defaultPlayerState, ...JSON.parse(saved) };
      return defaultPlayerState;
    } catch (e) { return defaultPlayerState; }
  });

  const availableSP = useMemo(() => {
    let totalEarned = 0;
    for (let i = 1; i <= player.realmIndex; i++) {
      totalEarned += REALMS[i]?.isMajor ? 5 : 3;
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
      if (data !== null) setGlobalStats({ focus: data.totalFocusCount || 0, ascensions: data.totalAscensions || 0 });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { 
    localStorage.setItem('xianxia_master_v69_5', JSON.stringify(player)); 
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2000);
  }, [player]);

  const rollFortune = () => {
    const idx = Math.floor(Math.random() * FORTUNES.length);
    setPlayer(p => ({ ...p, fortuneIndex: idx }));
    addLog(`✨ 【氣運洗牌】天道感應，當前命格轉為：${FORTUNES[idx].name}`);
  };

  const handleCultivationReset = () => {
    if (player.realmIndex <= 0) return;
    if (window.confirm('確定要「散功重修」嗎？這將降低一個境界、清空靈氣並還原所有功法點數。')) {
      setPlayer(p => ({
        ...p,
        realmIndex: p.realmIndex - 1,
        qi: 0,
        qiToNext: Math.floor(p.qiToNext / 1.35), 
        basicSkills: {},
        secretBooks: {},
        streakCount: 0,
        logs: [`⚠️ 【散功重修】散去當前境界修為，退回至 ${REALMS[p.realmIndex - 1].name}，重塑道基。`, ...(p.logs || [])]
      }));
    }
  };

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const getMultiplier = (type) => {
    let mult = 1.0;
    const currentFortune = FORTUNES[player.fortuneIndex];
    if (type === 'luck_floor') mult += currentFortune.luck;
    if (type === 'qi' && currentFortune.name === '靈氣親和') mult += 0.2;
    if (type === 'atk' && currentFortune.name === '劍意通心') mult += 0.2;

    BASIC_SKILLS.forEach(s => { if (player.basicSkills?.[s.id] > 0 && s.val?.[type]) mult += s.val[type] * player.basicSkills[s.id]; });
    Object.entries(player.secretBooks || {}).forEach(([id, lvl]) => { 
      const book = SECRET_BOOKS.find(x => x.id === id);
      if (book?.val?.[type]) mult += book.val[type] * (1 + lvl * 0.5);
    });
    (player.artifacts || []).forEach(id => { 
      const art = ARTIFACT_POOL.find(a => a.id === id);
      const lvl = player.artifactLvls?.[id] || 0;
      if (art?.val?.[type]) mult += art.val[type] * (1 + lvl * 0.5);
    });
    if (type === 'qi' && (player.arrays?.qi || 0)) mult += player.arrays.qi * 0.05;
    if (type === 'def' && (player.arrays?.def || 0)) mult += player.arrays.def * 0.05;
    return mult;
  };

  const currentRealmData = REALMS[player.realmIndex];
  const themeColorClass = `text-${currentRealmData.color}-400`;
  const themeBorderClass = `border-${currentRealmData.color}-500/30`;
  const comboMultiplier = 1 + Math.min(4.0, (player.streakCount || 0) * 0.05 * getMultiplier('streak_eff'));
  const currentCombatPower = Math.floor(player.baseCombat * getMultiplier('atk') * comboMultiplier);
  const maxVitality = Math.floor(player.baseMaxVitality * getMultiplier('hp'));

  // --- 戰鬥與計時狀態 ---
  const [monster, setMonster] = useState(() => ({ name: '野狼幫眾', hp: 120, maxHp: 120 }));
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [targetEndTime, setTargetEndTime] = useState(null);
  const [activeTab, setActiveTab] = useState('skills');

  const addLog = (text) => {
    const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    setPlayer(p => ({ ...p, logs: [`[${timeStr}] ${text}`, ...(p.logs || [])].slice(0, 50) }));
  };

  const handleComplete = () => {
    setIsActive(false); setTargetEndTime(null);
    const damage = Math.floor(currentCombatPower * (25 * 60 / 1500));
    const passiveQi = Math.floor(50 * Math.pow(1.18, player.realmIndex + 1) * getMultiplier('qi'));
    
    let nextQi = player.qi + passiveQi;
    let nextRealm = player.realmIndex;
    let nextQiToNext = player.qiToNext;

    if (nextQi >= nextQiToNext && nextRealm < REALMS.length - 1) {
      nextRealm++;
      nextQi -= nextQiToNext;
      nextQiToNext = Math.floor(nextQiToNext * 1.35);
      rollFortune();
    }

    setPlayer(p => ({ ...p, realmIndex: nextRealm, qi: nextQi, qiToNext: nextQiToNext, streakCount: p.streakCount + 1 }));
    setTimeLeft(25 * 60);
  };

  useEffect(() => {
    if (isActive && targetEndTime) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((targetEndTime - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) handleComplete();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isActive, targetEndTime]);

  return (
    <div className="min-h-screen text-slate-300 font-mono p-4 flex flex-col items-center bg-[#020617] pt-10"
         style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80")', backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      <div className="absolute inset-0 bg-[#020617]/85 backdrop-blur-[1px] z-0"></div>

      <div className="fixed top-0 left-0 w-full bg-emerald-950/90 text-xs py-2 text-center font-black tracking-widest z-[600] border-b border-emerald-500/30 flex items-center justify-center gap-6">
        <div className="flex items-center gap-1.5 text-emerald-400"><Network size={14} /> <span>三千世界運轉: {globalStats.focus.toLocaleString()}</span></div>
        <div className="flex items-center gap-1.5 text-yellow-400"><Crown size={14} /> <span>飛升仙人: {globalStats.ascensions.toLocaleString()}</span></div>
      </div>

      <div className="w-full max-w-4xl mb-6 z-10 px-2 mt-10">
        <div className={`bg-slate-900/50 backdrop-blur-3xl p-6 md:p-8 rounded-xl border ${themeBorderClass} shadow-2xl`}>
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-white/10 pb-6 mb-6">
            <div className="flex items-center gap-4 flex-1">
               <Shield size={36} className={themeColorClass}/>
               <div>
                  <h2 className="text-2xl font-black text-white">{currentRealmData.name}</h2>
                  <div className={`flex items-center gap-2 text-xs mt-1 ${FORTUNES[player.fortuneIndex].color}`}>
                    <Dice6 size={12}/> 命格：{FORTUNES[player.fortuneIndex].name}
                  </div>
               </div>
            </div>
            <div className="flex gap-4 items-end">
               <div className="flex flex-col items-end"><span className="text-xs text-yellow-500 font-black">靈石</span><span className="text-base text-yellow-500 font-mono">{Math.floor(player.coins).toLocaleString()}</span></div>
               <div className="flex flex-col items-end"><span className="text-xs text-cyan-400 font-black">可用 SP</span><span className="text-base text-cyan-400 font-mono">{availableSP}</span></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
                <div className="flex justify-between text-xs font-black text-white/60"><span>修為進度</span><span>{Math.floor(player.qi)} / {player.qiToNext}</span></div>
                <div className="h-2 bg-black/60 rounded-full overflow-hidden"><div className={`h-full bg-${currentRealmData.color}-500`} style={{ width: `${(player.qi/player.qiToNext)*100}%` }}></div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl bg-slate-900/40 backdrop-blur-3xl p-10 rounded-2xl border border-white/10 text-center mb-8 z-10">
        <div className="text-8xl sm:text-9xl font-mono font-black mb-10 text-white">{formatTime(timeLeft)}</div>
        <button onClick={() => { if(!isActive){ setIsActive(true); setTargetEndTime(Date.now() + timeLeft*1000); }}} className="px-16 py-6 bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 rounded-xl text-xl font-black transition-all">
          {isActive ? '修煉中...' : '運轉周天'}
        </button>
      </div>

      <div className={`w-full max-w-4xl z-10 ${isActive ? 'opacity-0' : 'opacity-100'}`}>
        <div className="bg-slate-950/90 backdrop-blur-3xl rounded-2xl border border-white/10 overflow-hidden h-[600px] flex flex-col">
          <div className="flex bg-black/80 border-b border-white/10">
            {['skills', 'forge', 'log'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-xs font-black uppercase ${activeTab===tab ? 'bg-white/15 text-white' : 'text-white/40'}`}>{tab === 'skills' ? '功法祕籍' : tab === 'forge' ? '洞府淬煉' : '修行日誌'}</button>
            ))}
          </div>

          <div className="p-8 overflow-y-auto flex-1">
            {activeTab === 'skills' && (
              <div className="space-y-10">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <h3 className="text-white/60 text-sm font-black">境界功法 (可用 SP: {availableSP})</h3>
                  <button onClick={handleCultivationReset} className="text-xs bg-rose-900/40 hover:bg-rose-600 text-rose-200 px-4 py-2 rounded border border-rose-500/50 transition-all">散功重修 (還原點數)</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {BASIC_SKILLS.map(s => {
                    const lvl = player.basicSkills[s.id] || 0;
                    return (
                      <div key={s.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col justify-between h-40">
                        <div className="text-xs text-white font-black">{s.name} <span className="float-right text-white/40">Lv.{lvl}</span></div>
                        <button onClick={() => availableSP >= 1 && lvl < s.maxLvl && setPlayer(p => ({...p, basicSkills: {...p.basicSkills, [s.id]: lvl+1}}))} className="w-full py-2 bg-cyan-900/50 hover:bg-cyan-600 text-white rounded text-[10px] font-black">研習 (1 SP)</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {activeTab === 'log' && (
              <div className="space-y-3">
                {player.logs.map((log, i) => <div key={i} className="p-4 rounded border border-white/10 text-xs text-white/50">{log}</div>)}
              </div>
            )}
          </div>
        </div>

        <footer className="pt-20 pb-32 text-center text-xs font-light text-white/50 tracking-[0.5em] flex flex-col items-center gap-6">
          <p>《凡人修仙傳》原著設定歸作者 忘語 所有</p>
          <button onClick={() => { if(window.confirm('確定要輪迴轉世？這將抹除所有記憶與修為。')) { localStorage.clear(); window.location.reload(); }}} className="opacity-60 hover:opacity-100 border border-white/30 px-6 py-2 rounded-full text-[10px] hover:bg-rose-900/40 transition-all">輪迴轉世</button>
        </footer>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Shield, Zap, Flame, Coins, Hammer, Box, ScrollText, AlertTriangle, EyeOff, Sparkles, Sword, Compass, Clover, BookOpen, History, BarChart3, Save, Pill, HelpCircle, X, Activity, ChevronRight } from 'lucide-react';

/**
 * ========================================================
 * 1. 核心數據定義 (Lore & Multipliers)
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

const MAJOR_REALMS = [
  { name: '煉氣境', desc: '吸納天地靈氣，洗髓易經，初窺仙道。', color: 'emerald' },
  { name: '築基境', desc: '靈氣化液，凝結道基，壽元大增。', color: 'teal' },
  { name: '結丹境', desc: '丹田結丹，靈力固化，可煉本命法寶。', color: 'blue' },
  { name: '元嬰境', desc: '碎丹成嬰，神魂不滅，瞬移離體。', color: 'indigo' },
  { name: '化神境', desc: '掌控天地元氣，具備飛升資格。', color: 'purple' },
  { name: '煉虛境', desc: '五行合一，化實為虛，初步掌控空間。', color: 'violet' },
  { name: '合體境', desc: '天人合一，法相實體化，靈界霸主。', color: 'amber' },
  { name: '大乘境', desc: '掌握天地法則，道臻巔峰，萬法不侵。', color: 'orange' }
];

const REALMS = [{ name: '一介凡人', desc: '凡夫俗子，尚未引氣入體。', majorName: '凡人', color: 'slate' }];
MAJOR_REALMS.forEach(m => {
  ['初期', '中期', '後期', '巔峰'].forEach(s => {
    REALMS.push({ name: `${m.name.replace('境', '')}${s}`, desc: m.desc, majorName: m.name.replace('境', ''), color: m.color });
  });
});
REALMS.push({ name: '渡劫期', desc: '引動九九重雷劫，成則羽化登仙，敗則化為劫灰。', majorName: '渡劫', color: 'rose' });

const ARTIFACT_POOL = [
  { id: 'a01', rarity: 'COMMON', name: '鐵木盾', desc: '基礎防禦。反噬減傷 +2%', val: { def: 0.02 } },
  { id: 'a12', rarity: 'UNCOMMON', name: '無形針', desc: '奇門暗器。連擊效率+10%，爆擊率+5%', val: { streak_eff: 0.10, crit: 0.05 } },
  { id: 'a21', rarity: 'RARE', name: '玄鐵飛天盾', desc: '堅不可摧。反噬減傷 +15%', val: { def: 0.15 } },
  { id: 'a32', rarity: 'EPIC', name: '紫羅極火', desc: '極寒之焰。戰力+20%，爆擊傷害+80%', val: { atk: 0.20, crit_dmg: 0.80 } },
  { id: 'a41', rarity: 'LEGENDARY', name: '青竹蜂雲劍', desc: '本命劍陣。戰力+50%，連擊效率+50%，爆擊+5%', val: { atk: 0.50, streak_eff: 0.50, crit: 0.05 } },
  { id: 'a52', rarity: 'MYTHIC', name: '虛天大鼎', desc: '人界第一至寶。減傷+80%，氣運+0.2，成本-40%', val: { def: 0.80, luck_floor: 0.20, forge_discount: 0.40 } },
  { id: 'a63', rarity: 'DIVINE', name: '金闕玉書', desc: '降界天書。靈石+400%，氣運+0.5, 爆擊+10%', val: { stone: 4.00, luck_floor: 0.50, crit: 0.10, forge_discount: 0.20 } },
];

const BASIC_SKILLS = [
  { id: 'b_qi', name: '長春功', desc: '修為加成 +10%/級', val: { qi: 0.1 }, maxLvl: 20 },
  { id: 'b_atk', name: '青元劍訣', desc: '戰鬥加成 +10%/級', val: { atk: 0.1 }, maxLvl: 20 },
  { id: 'b_hp', name: '明王訣', desc: '氣血加成 +10%/級', val: { hp: 0.1 }, maxLvl: 20 },
  { id: 'b_stone', name: '天眼術', desc: '靈石加成 +15%/級', val: { stone: 0.15 }, maxLvl: 20 },
];

/**
 * ========================================================
 * 2. 主組件 (App)
 * ========================================================
 */

export default function App() {
  const [player, setPlayer] = useState(() => {
    const saved = localStorage.getItem('xianxia_zenith_v71');
    if (saved) return JSON.parse(saved);
    return { realmIndex: 0, qi: 0, qiToNext: 250, vitality: 100, baseMaxVitality: 100, coins: 0, baseCombat: 150, artifacts: [], artifactLvls: {}, basicSkills: { b_qi: 0, b_atk: 0, b_hp: 0, b_stone: 0 }, secretBooks: {}, arrays: { qi: 0, def: 0 }, streakCount: 0, totalFocusTime: 0, logs: ['【系統】天道印記已連結，修行進度自動保存。'] };
  });

  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [targetEndTime, setTargetEndTime] = useState(null);
  const [focusDuration, setFocusDuration] = useState(25 * 60);
  const [activeTab, setActiveTab] = useState('skills');
  const [showGuide, setShowGuide] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState(false);

  // 視覺回饋狀態
  const [isAttacking, setIsAttacking] = useState(false);
  const [isCritStrike, setIsCritStrike] = useState(false);

  useEffect(() => {
    localStorage.setItem('xianxia_zenith_v71', JSON.stringify(player));
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1500);
  }, [player]);

  const getMultiplier = useCallback((type) => {
    let mult = 1.0;
    BASIC_SKILLS.forEach(s => { if (player.basicSkills?.[s.id] > 0) mult += (s.val[type] || 0) * player.basicSkills[s.id]; });
    player.artifacts.forEach(id => {
      const art = ARTIFACT_POOL.find(a => a.id === id);
      const lvl = 1 + (player.artifactLvls[id] || 0) * 0.6;
      if (art && art.val[type]) mult += art.val[type] * lvl;
    });
    if (type === 'qi' && player.arrays?.qi) mult += player.arrays.qi * 0.05;
    if (type === 'def' && player.arrays?.def) mult += player.arrays.def * 0.05;
    return mult;
  }, [player]);

  const currentRealm = REALMS[player.realmIndex];
  const maxVitality = Math.floor(player.baseMaxVitality * getMultiplier('hp'));
  const comboMult = 1 + Math.min(5.0, player.streakCount * 0.05 * getMultiplier('streak_eff'));
  const currentCombat = Math.floor(player.baseCombat * getMultiplier('atk') * comboMult);
  const availableSP = (player.realmIndex * 2) - Object.values(player.basicSkills).reduce((a, b) => a + b, 0);
  const forgeDiscount = Math.max(0.1, 1 - (getMultiplier('forge_discount') - 1));

  const arrayQiCost = Math.floor(10000 * Math.pow(1.5, (player.arrays?.qi || 0)) * forgeDiscount);
  const arrayDefCost = Math.floor(10000 * Math.pow(1.5, (player.arrays?.def || 0)) * forgeDiscount);
  const healCost = Math.floor(maxVitality * 1.5 * forgeDiscount);
  const gachaCost = Math.floor(5000 * Math.pow(1.18, player.realmIndex) * forgeDiscount);

  useEffect(() => {
    let interval;
    if (isActive && targetEndTime) {
      interval = setInterval(() => {
        const diff = Math.max(0, Math.floor((targetEndTime - Date.now()) / 1000));
        setTimeLeft(diff);
        if (diff === 0) {
          clearInterval(interval);
          handleComplete();
        }
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isActive, targetEndTime]);

  const handleComplete = () => {
    setIsActive(false);
    setIsAttacking(true);
    const isCrit = Math.random() < (getMultiplier('crit') - 1);
    if (isCrit) setIsCritStrike(true);

    const qiGain = Math.floor(100 * (focusDuration / 1500) * getMultiplier('qi'));
    const coinGain = Math.floor(200 * (focusDuration / 1500) * getMultiplier('stone') * getMultiplier('luck_floor'));

    setTimeout(() => {
      setIsAttacking(false);
      setIsCritStrike(false);
      setPlayer(p => {
        let nQi = p.qi + qiGain;
        let nRealm = p.realmIndex;
        let nQiToNext = p.qiToNext;
        let nLogs = [`[收穫] 專注結束，獲得修為 ${qiGain}，靈石 ${coinGain}。`, ...p.logs].slice(0, 50);
        
        if (nQi >= nQiToNext && nRealm < REALMS.length - 1) {
          nRealm++;
          nQi = 0;
          nQiToNext = Math.floor(nQiToNext * 1.4);
          nLogs = [`☄️ 【突破】成功晉升至 ${REALMS[nRealm].name}！`, ...nLogs];
        }
        return { ...p, qi: nQi, realmIndex: nRealm, qiToNext: nQiToNext, coins: p.coins + coinGain, streakCount: p.streakCount + 1, totalFocusTime: p.totalFocusTime + focusDuration, logs: nLogs };
      });
    }, 600);
  };

  const toggleTimer = () => {
    if (!isActive) {
      setTargetEndTime(Date.now() + (timeLeft * 1000));
      setIsActive(true);
    } else {
      if (window.confirm('強行中止將會失去當前連擊次數並遭受反噬，確定嗎？')) {
        setIsActive(false);
        setTargetEndTime(null);
        setPlayer(p => ({ ...p, streakCount: 0, vitality: Math.max(1, p.vitality - 50), logs: ['🚨 [中斷] 運功強行中止，連擊已斷，氣血受損。', ...p.logs] }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-mono p-4 flex flex-col items-center relative overflow-hidden">
      {/* 動畫層 */}
      <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center">
        {isCritStrike && <Flame size={400} className="text-amber-500/30 animate-ping absolute" />}
        {isAttacking && <Sword size={500} className="text-emerald-500/10 animate-pulse absolute -rotate-45" />}
      </div>

      <div className={`fixed top-4 right-4 z-[110] flex items-center gap-2 bg-emerald-950/80 text-emerald-300 px-3 py-1.5 rounded-full text-[10px] font-bold border border-emerald-500/30 transition-opacity ${saveIndicator ? 'opacity-100' : 'opacity-0'}`}>
        <Save size={12}/> 天道同步中
      </div>

      {/* 境界卡片 */}
      <div className="w-full max-w-4xl z-10 mt-6">
        <div className={`bg-slate-900/60 backdrop-blur-2xl p-6 rounded-3xl border border-${currentRealm.color}-500/20 shadow-2xl`}>
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl bg-${currentRealm.color}-500/10 border border-${currentRealm.color}-500/20 shadow-inner`}><Shield size={36} className={`text-${currentRealm.color}-400`}/></div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">{currentRealm.name}</h2>
                <p className={`text-xs text-${currentRealm.color}-400/80 mt-1 font-bold italic`}>{currentRealm.desc}</p>
              </div>
            </div>
            <div className="flex gap-6 items-center justify-end font-black">
              <div className="text-yellow-500 flex flex-col items-end"><span className="text-[9px] opacity-40 uppercase tracking-widest">靈石儲備</span><span className="text-xl">{(player.coins).toLocaleString()}</span></div>
              <div className="text-cyan-400 flex flex-col items-end"><span className="text-[9px] opacity-40 uppercase tracking-widest">可用 SP</span><span className="text-xl">{availableSP}</span></div>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            <div className="flex justify-between text-[10px] font-black opacity-30 uppercase tracking-widest"><span>修為進度 (Exp)</span><span>{Math.floor(player.qi)} / {player.qiToNext}</span></div>
            <div className="h-3 bg-black/60 rounded-full overflow-hidden border border-white/5"><div className={`h-full bg-${currentRealm.color}-500 transition-all duration-1000 shadow-[0_0_20px_rgba(255,255,255,0.2)]`} style={{ width: `${(player.qi/player.qiToNext)*100}%` }}></div></div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={() => setShowGuide(true)} className="flex items-center gap-2 text-[11px] font-black bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-5 py-2.5 rounded-full border border-emerald-500/20 transition-all"><HelpCircle size={14}/> 修行指引</button>
          <button onClick={() => setShowStats(true)} className="flex items-center gap-2 text-[11px] font-black bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-5 py-2.5 rounded-full border border-cyan-500/20 transition-all"><BarChart3 size={14}/> 屬性分析</button>
        </div>
      </div>

      {/* 計時器 */}
      <div className="w-full max-w-4xl py-14 text-center z-10 flex flex-col items-center">
        <div className="flex justify-center gap-3 mb-12">
          {FOCUS_OPTIONS.map(o => (
            <button key={o.value} onClick={() => !isActive && (setFocusDuration(o.value), setTimeLeft(o.value))} className={`px-6 py-2.5 rounded-full text-[11px] font-black transition-all border ${focusDuration === o.value ? 'bg-white text-black border-white scale-110' : 'bg-white/5 text-white/40 border-white/10 hover:text-white/60'}`}>{o.label}</button>
          ))}
        </div>
        <div className={`text-[120px] md:text-[180px] font-black leading-none mb-12 transition-all tracking-tighter tabular-nums ${isActive ? 'text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.3)]' : 'text-white/10'}`}>
          {Math.floor(timeLeft/60).toString().padStart(2,'0')}:{(timeLeft%60).toString().padStart(2,'0')}
        </div>
        <button onClick={toggleTimer} className={`px-24 py-7 rounded-3xl text-2xl font-black tracking-[0.5em] transition-all transform active:scale-95 shadow-2xl ${isActive ? 'bg-rose-950/40 text-rose-500 border border-rose-500/30' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
          {isActive ? '強行出關' : '運轉周天'}
        </button>
      </div>

      {/* 功能面板 */}
      <div className={`w-full max-w-4xl mt-6 bg-slate-900/80 backdrop-blur-3xl rounded-3xl border border-white/5 h-[680px] overflow-hidden flex flex-col z-10 shadow-inner transition-all ${isActive ? 'opacity-20 pointer-events-none grayscale' : 'opacity-100'}`}>
        <div className="flex bg-black/40 p-1.5 border-b border-white/5">
          {[{id:'skills', label:'功法修煉', icon:ScrollText}, {id:'forge', label:'洞府淬煉', icon:Hammer}, {id:'artifacts', label:'法寶血煉', icon:Box}, {id:'log', label:'修行日誌', icon:History}].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 py-5 rounded-2xl flex flex-col items-center gap-1.5 text-[11px] font-black transition-all ${activeTab===t.id ? 'bg-white/10 text-white shadow-inner' : 'text-white/30 hover:text-white/60'}`}>
              <t.icon size={20}/> {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          {activeTab === 'skills' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-4">
              {BASIC_SKILLS.map(s => {
                const lvl = player.basicSkills[s.id] || 0;
                return (
                  <div key={s.id} className="p-6 bg-white/5 rounded-3xl border border-white/10 flex flex-col justify-between h-48 hover:bg-white/10 transition-all group">
                    <div>
                      <div className="flex justify-between items-center"><span className="text-base font-black text-white uppercase tracking-tight">{s.name}</span><span className="text-[11px] font-mono text-cyan-500">Lv.{lvl}/20</span></div>
                      <p className="text-[11px] opacity-40 mt-3 italic leading-relaxed">{s.desc}</p>
                    </div>
                    <button onClick={() => availableSP > 0 && lvl < 20 && setPlayer(p => ({...p, basicSkills: {...p.basicSkills, [s.id]: lvl+1}}))} disabled={availableSP <= 0 || lvl >= 20} className="w-full py-3.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black rounded-2xl text-[11px] font-black border border-cyan-500/20 transition-all disabled:opacity-20 uppercase tracking-widest">研習心法 (1 SP)</button>
                  </div>
                )
              })}
            </div>
          )}
          {activeTab === 'forge' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-6 bg-emerald-950/20 rounded-3xl border border-emerald-500/20 flex flex-col justify-between h-60">
                   <div><h3 className="text-emerald-400 font-black text-xl flex items-center gap-2"><Pill size={22}/> 回春丹</h3><p className="text-[11px] opacity-40 mt-3">修復專注造成的神魂損傷，瞬間恢復全量氣血。</p></div>
                   <button onClick={() => player.coins >= healCost && setPlayer(p => ({...p, coins: p.coins - healCost, vitality: maxVitality}))} disabled={player.coins < healCost} className="w-full py-4 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-2xl text-[11px] font-black border border-emerald-500/30">服用 ({healCost})</button>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex flex-col justify-between h-60">
                   <div className="flex justify-between font-black items-center"><span className="text-white">聚靈陣</span><span className="text-cyan-500 text-xs font-mono">Lv.{player.arrays.qi}</span></div>
                   <p className="text-[11px] opacity-40 mt-3">提升天地靈氣轉化效率。修為加成 +5%/級。</p>
                   <button onClick={() => player.coins >= arrayQiCost && setPlayer(p => ({...p, coins: p.coins - arrayQiCost, arrays: {...p.arrays, qi: p.arrays.qi+1}}))} disabled={player.coins < arrayQiCost} className="w-full py-4 bg-white/10 hover:bg-white text-white hover:text-black rounded-2xl text-[11px] font-black border border-white/20">佈陣 ({arrayQiCost})</button>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex flex-col justify-between h-60">
                   <div className="flex justify-between font-black items-center"><span className="text-white">防禦陣</span><span className="text-cyan-500 text-xs font-mono">Lv.{player.arrays.def}</span></div>
                   <p className="text-[11px] opacity-40 mt-3">降低靈力反噬風險。減傷加成 +5%/級。</p>
                   <button onClick={() => player.coins >= arrayDefCost && setPlayer(p => ({...p, coins: p.coins - arrayDefCost, arrays: {...p.arrays, def: p.arrays.def+1}}))} disabled={player.coins < arrayDefCost} className="w-full py-4 bg-white/10 hover:bg-white text-white hover:text-black rounded-2xl text-[11px] font-black border border-white/20">佈陣 ({arrayDefCost})</button>
                </div>
              </div>
              <div className="p-12 bg-gradient-to-br from-white/5 to-transparent rounded-3xl border border-white/10 text-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <h3 className="text-white font-black text-2xl flex items-center justify-center gap-3 mb-6"><Compass className="text-yellow-500"/> 萬寶樓閣尋寶</h3>
                 <p className="text-white/40 text-xs mb-8">耗費巨資感應天地珍寶，有機率獲得傳說級法寶。</p>
                 <button onClick={() => player.coins >= gachaCost && setPlayer(p => ({...p, coins: p.coins - gachaCost}))} className="px-16 py-5 bg-white/10 hover:bg-white text-white hover:text-black rounded-2xl font-black transition-all border border-white/20 text-sm">祭出靈石 ({gachaCost})</button>
              </div>
            </div>
          )}
          {activeTab === 'artifacts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in">
              {ARTIFACT_POOL.map(art => {
                const unlocked = player.artifacts.includes(art.id);
                const lvl = player.artifactLvls[art.id] || 0;
                const cost = Math.floor(RARITY_BASE_COST[art.rarity] * Math.pow(1.8, lvl) * forgeDiscount);
                return unlocked ? (
                  <div key={art.id} className="p-6 bg-black/40 rounded-3xl border border-white/10 flex flex-col justify-between h-52 hover:border-white/20 transition-all">
                    <div><h4 className={`text-base font-black ${RARITY[art.rarity].color} flex justify-between`}>{art.name} <span className="text-[10px] font-mono opacity-40">Lv.{lvl}</span></h4><p className="text-[11px] opacity-50 mt-3 leading-relaxed italic">「{art.desc}」</p></div>
                    <button onClick={() => player.coins >= cost && lvl < 5 && setPlayer(p => ({...p, coins: p.coins - cost, artifactLvls: {...p.artifactLvls, [art.id]: lvl+1}}))} disabled={player.coins < cost || lvl >= 5} className="w-full py-3.5 bg-white/5 hover:bg-white text-white hover:text-black rounded-2xl text-[11px] font-black border border-white/10 transition-all">精煉 ({cost})</button>
                  </div>
                ) : <div key={art.id} className="p-12 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center opacity-20"><EyeOff size={28} className="mb-3"/><span className="text-[10px] font-black uppercase tracking-tighter">此機緣尚未開啟</span></div>
              })}
            </div>
          )}
          {activeTab === 'log' && (
            <div className="space-y-3 font-bold">
              {player.logs.map((l, i) => <div key={i} className={`p-4 rounded-2xl text-[11px] leading-relaxed ${i===0?'bg-white/15 text-white shadow-xl border border-white/10':'text-white/30 bg-white/5'}`}>{l}</div>)}
            </div>
          )}
        </div>
      </div>

      {/* 彈窗：修行指引 */}
      {showGuide && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in">
          <div className="bg-slate-900 w-full max-w-2xl rounded-[40px] border border-white/10 p-10 shadow-2xl relative">
            <button onClick={() => setShowGuide(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"><X size={32}/></button>
            <h3 className="text-3xl font-black text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-3"><HelpCircle className="text-emerald-400"/> 修行手冊 (V71)</h3>
            <div className="space-y-8 text-sm leading-relaxed text-white/70 overflow-y-auto max-h-[500px] pr-4 custom-scrollbar">
               <section>
                 <h4 className="text-emerald-400 font-black mb-3 text-base flex items-center gap-2">● 關於 SP (分神點)</h4>
                 <p>每提升一個小境界可獲 2 點 SP。功法全滿需 80 點，但修煉至大乘巔峰僅能獲得 66 點。這種 **14 點 SP 缺口** 是故意設計的，這要求你必須在攻擊、防禦、氣運之間做出戰略取捨。</p>
               </section>
               <section>
                 <h4 className="text-amber-400 font-black mb-3 text-base flex items-center gap-2">● 連擊與氣運</h4>
                 <p>不中斷的專注可以累積連擊倍率（最高 5.0x）。氣運決定了靈石的掉落與稀有法寶的獲取機率。造化至寶【金闕玉書】是唯一的氣運質變核心。</p>
               </section>
               <section>
                 <h4 className="text-rose-400 font-black mb-3 text-base flex items-center gap-2">● 渡劫生死線</h4>
                 <p>邁向 Tier 34 渡劫期時，反噬傷害將產生質變。若無高級防禦陣法與強大法寶，單次專注失敗可能導致你身死道消。</p>
               </section>
            </div>
          </div>
        </div>
      )}

      {/* 彈窗：屬性分析 */}
      {showStats && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in">
          <div className="bg-slate-900 w-full max-w-2xl rounded-[40px] border border-white/10 p-10 shadow-2xl relative">
            <button onClick={() => setShowStats(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"><X size={32}/></button>
            <h3 className="text-3xl font-black text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-3"><Activity className="text-cyan-400"/> 識海屬性掃描</h3>
            <div className="grid grid-cols-2 gap-5">
               {[
                 {l:'基礎戰力', v: Math.floor(player.baseCombat), c:'text-white'},
                 {l:'戰鬥倍率', v: `x${getMultiplier('atk').toFixed(2)}`, c:'text-white'},
                 {l:'當前總戰力', v: currentCombat, c:'text-emerald-400'},
                 {l:'連擊傷害上限', v: `x${comboMult.toFixed(2)}`, c:'text-rose-400'},
                 {l:'反噬實質減傷', v: `${((1 - 1/getMultiplier('def'))*100).toFixed(1)}%`, c:'text-cyan-400'},
                 {l:'爆擊機率', v: `${((getMultiplier('crit')-1)*100).toFixed(1)}%`, c:'text-amber-400'},
                 {l:'氣運獲取係數', v: `x${getMultiplier('luck_floor').toFixed(2)}`, c:'text-yellow-500'},
                 {l:'煉器資源折扣', v: `${((1-forgeDiscount)*100).toFixed(1)}%`, c:'text-slate-400'}
               ].map(s => (
                 <div key={s.l} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-1">
                   <span className="text-[10px] opacity-40 uppercase font-black tracking-widest">{s.l}</span>
                   <span className={`text-xl font-black ${s.c}`}>{s.v}</span>
                 </div>
               ))}
            </div>
            <p className="mt-10 text-[10px] text-white/20 text-center uppercase tracking-[0.5em]">數據同步自天道法則 V71</p>
          </div>
        </div>
      )}

      <footer className="py-12 text-[9px] opacity-10 tracking-[1.2em] uppercase font-bold text-center">
        MORTAL CULTIVATION FOCUS SYSTEM · ZENITH STABLE EDITION
      </footer>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Shield, Zap, Flame, Coins, Hammer, Box, ScrollText, AlertTriangle, EyeOff, Sparkles, Sword, Compass, Clover, BookOpen, History, BarChart3, Save, Pill, HelpCircle, X, Activity } from 'lucide-react';

/**
 * ========================================================
 * 1. 靜態數據定義 (Lore & Database)
 * ========================================================
 */

const FOCUS_OPTIONS = [{ label: '15m', value: 15 * 60 }, { label: '25m', value: 25 * 60 }, { label: '45m', value: 45 * 60 }, { label: '60m', value: 60 * 60 }];

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
  { name: '化神境', desc: '掌控天地元氣，具備飛升資格。', color: 'purple' },
  { name: '煉虛境', desc: '五行合一，掌控空間法則。', color: 'violet' },
  { name: '合體境', desc: '法相實體化，靈界霸主。', color: 'amber' },
  { name: '大乘境', desc: '掌握天地法則，萬法不侵。', color: 'orange' }
];

const REALMS = [{ name: '一介凡人', desc: '尚未引氣入體。', majorName: '凡人', color: 'slate' }];
MAJOR_REALMS_DATA.forEach(m => ['初期', '中期', '後期', '巔峰'].forEach(s => REALMS.push({ name: `${m.name.replace('境', '')}${s}`, desc: m.desc, majorName: m.name.replace('境', ''), color: m.color })));
REALMS.push({ name: '渡劫', desc: '引動九九重雷劫，成則羽化登仙。', majorName: '渡劫', color: 'rose' });

const ARTIFACT_POOL = [
  { id: 'a01', rarity: 'COMMON', name: '鐵木盾', desc: '基礎防禦。反噬減傷 +2%', val: { def: 0.02 } },
  { id: 'a12', rarity: 'UNCOMMON', name: '無形針', desc: '連擊效率+10%，爆擊率+5%', val: { streak_eff: 0.10, crit: 0.05 } },
  { id: 'a32', rarity: 'EPIC', name: '紫羅極火', desc: '戰力+20%，爆擊傷害+80%', val: { atk: 0.20, crit_dmg: 0.80 } },
  { id: 'a52', rarity: 'MYTHIC', name: '虛天大鼎', desc: '減傷+80%，氣運+0.2，成本-40%', val: { def: 0.80, luck_floor: 0.20, forge_discount: 0.40 } },
  { id: 'a63', rarity: 'DIVINE', name: '金闕玉書', desc: '靈石+400%，氣運+0.5，爆擊+10%', val: { stone: 4.00, luck_floor: 0.50, crit: 0.10, forge_discount: 0.20 } },
];

const SECRET_BOOKS = [
  { id: 's_01', rarity: 'UNCOMMON', name: '羅煙步', desc: '閃避率 +8%/級', val: { evade: 0.08 } },
  { id: 's_05', rarity: 'LEGENDARY', name: '元磁神光', desc: '戰力與減傷 +20%/級', val: { atk: 0.20, def: 0.20 } },
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
  const [player, setPlayer] = useState(() => {
    const saved = localStorage.getItem('xianxia_master_v70');
    if (!saved) return { realmIndex: 0, qi: 0, qiToNext: 250, vitality: 100, baseMaxVitality: 100, coins: 0, baseCombat: 150, artifacts: [], artifactLvls: {}, basicSkills: { b_qi: 0, b_atk: 0, b_hp: 0, b_stone: 0 }, secretBooks: {}, arrays: { qi: 0, def: 0 }, streakCount: 0, totalFocusTime: 0, history: [], logs: ['【系統】天道印記已連結。'] };
    return JSON.parse(saved);
  });

  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [targetEndTime, setTargetEndTime] = useState(null);
  const [focusDuration, setFocusDuration] = useState(25 * 60);
  const [activeTab, setActiveTab] = useState('skills');
  const [showGuide, setShowGuide] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState(false);

  // 視覺效果狀態
  const [isAttacking, setIsAttacking] = useState(false);
  const [isCritStrike, setIsCritStrike] = useState(false);

  useEffect(() => {
    localStorage.setItem('xianxia_master_v70', JSON.stringify(player));
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2000);
  }, [player]);

  const getMultiplier = useCallback((type) => {
    let mult = 1.0;
    BASIC_SKILLS.forEach(s => { if (player.basicSkills?.[s.id] > 0) mult += (s.val[type] || 0) * player.basicSkills[s.id]; });
    Object.entries(player.secretBooks || {}).forEach(([id, lvl]) => { const b = SECRET_BOOKS.find(x => x.id === id); if (b && b.val[type]) mult += b.val[type] * lvl; });
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
  const comboMultiplier = 1 + Math.min(5.0, player.streakCount * 0.05 * getMultiplier('streak_eff'));
  const currentCombatPower = Math.floor(player.baseCombat * getMultiplier('atk') * comboMultiplier);
  const maxVitality = Math.floor(player.baseMaxVitality * getMultiplier('hp'));
  const availableSP = (player.realmIndex * 2) - Object.values(player.basicSkills).reduce((a, b) => a + b, 0);
  const forgeDiscount = Math.max(0.1, 1 - (getMultiplier('forge_discount') - 1));

  // 修正 V68 缺失的成本變數
  const arrayQiCost = Math.floor(10000 * Math.pow(1.5, (player.arrays?.qi || 0)) * forgeDiscount);
  const arrayDefCost = Math.floor(10000 * Math.pow(1.5, (player.arrays?.def || 0)) * forgeDiscount);
  const healCost = Math.floor(maxVitality * 1.5 * forgeDiscount);
  const gachaCost = Math.floor(5000 * Math.pow(1.18, player.realmIndex) * forgeDiscount);

  // 定時器：基於 Date.now() 校準
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

  const toggleTimer = () => {
    if (!isActive) {
      setTargetEndTime(Date.now() + (timeLeft * 1000));
      setIsActive(true);
    } else {
      if (window.confirm('強行出關會遭受靈力反噬，確定嗎？')) {
        setIsActive(false);
        setTargetEndTime(null);
        setPlayer(p => ({ ...p, streakCount: 0, vitality: Math.max(1, p.vitality - 50) }));
      }
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    setIsAttacking(true);
    const isCrit = Math.random() < (getMultiplier('crit') - 1);
    if (isCrit) setIsCritStrike(true);

    const qiGain = Math.floor(100 * (focusDuration / 1500) * getMultiplier('qi'));
    const coinGain = Math.floor(200 * (focusDuration / 1500) * getMultiplier('stone'));

    setTimeout(() => {
      setIsAttacking(false);
      setIsCritStrike(false);
      setPlayer(p => {
        let nQi = p.qi + qiGain;
        let nRealm = p.realmIndex;
        let nQiToNext = p.qiToNext;
        if (nQi >= nQiToNext && nRealm < REALMS.length - 1) {
          nRealm++;
          nQi -= nQiToNext;
          nQiToNext = Math.floor(nQiToNext * 1.5);
        }
        return { ...p, qi: nQi, realmIndex: nRealm, qiToNext: nQiToNext, coins: p.coins + coinGain, streakCount: p.streakCount + 1, totalFocusTime: p.totalFocusTime + focusDuration };
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-mono p-4 flex flex-col items-center relative overflow-hidden">
      {/* 視覺特效層：pointer-events-none 確保不擋住按鈕 */}
      <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center">
        {isCritStrike && <Flame size={400} className="text-amber-500/30 animate-ping absolute" />}
        {isAttacking && <Sword size={500} className="text-emerald-500/10 animate-pulse absolute -rotate-45" />}
      </div>

      <div className={`fixed top-4 right-4 z-[60] flex items-center gap-2 bg-emerald-900/80 text-emerald-300 px-3 py-1.5 rounded-full text-[10px] font-bold border border-emerald-500/30 transition-opacity ${saveIndicator ? 'opacity-100' : 'opacity-0'}`}>
        <Save size={12}/> 天道同步
      </div>

      {/* 頂部境界資訊卡 */}
      <div className="w-full max-w-4xl z-10 mt-6">
        <div className={`bg-slate-900/50 backdrop-blur-2xl p-6 rounded-2xl border border-${currentRealm.color}-500/20 shadow-2xl relative overflow-hidden`}>
          <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-xl bg-${currentRealm.color}-500/10 border border-${currentRealm.color}-500/20`}><Shield size={32} className={`text-${currentRealm.color}-400`}/></div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter">{currentRealm.name}</h2>
                <p className={`text-xs text-${currentRealm.color}-400/80 mt-1 font-bold`}>{currentRealm.desc}</p>
              </div>
            </div>
            <div className="flex gap-6 items-center justify-end font-bold">
              <div className="text-yellow-500 flex flex-col items-end"><span className="text-[8px] opacity-50 uppercase">靈石儲備</span><span className="text-lg"><Coins size={14} className="inline mr-1"/>{Math.floor(player.coins)}</span></div>
              <div className="text-cyan-400 flex flex-col items-end"><span className="text-[8px] opacity-50 uppercase">可用 SP</span><span className="text-lg"><Zap size={14} className="inline mr-1"/>{availableSP}</span></div>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-[10px] font-black opacity-40 uppercase tracking-widest"><span>修為進度</span><span>{Math.floor(player.qi)} / {player.qiToNext}</span></div>
            <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5"><div className={`h-full bg-${currentRealm.color}-500 transition-all duration-1000 shadow-[0_0_15px_currentColor]`} style={{ width: `${(player.qi/player.qiToNext)*100}%` }}></div></div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={() => setShowGuide(true)} className="flex items-center gap-2 text-[10px] font-black bg-white/5 hover:bg-white/10 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/20 transition-all"><HelpCircle size={14}/> 修行指引</button>
          <button onClick={() => setShowStats(true)} className="flex items-center gap-2 text-[10px] font-black bg-white/5 hover:bg-white/10 text-cyan-400 px-4 py-2 rounded-full border border-cyan-500/20 transition-all"><BarChart3 size={14}/> 屬性分析</button>
        </div>
      </div>

      {/* 計時器 */}
      <div className="w-full max-w-4xl py-12 text-center z-10 flex flex-col items-center">
        <div className="flex justify-center gap-3 mb-10">
          {FOCUS_OPTIONS.map(o => (
            <button key={o.value} onClick={() => !isActive && (setFocusDuration(o.value), setTimeLeft(o.value))} className={`px-5 py-2 rounded-full text-[10px] font-black transition-all border ${focusDuration === o.value ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10'}`}>{o.label}</button>
          ))}
        </div>
        <div className={`text-[120px] md:text-[160px] font-black leading-none mb-10 transition-all tracking-tighter ${isActive ? 'text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]' : 'text-white/10'}`}>
          {Math.floor(timeLeft/60).toString().padStart(2,'0')}:{(timeLeft%60).toString().padStart(2,'0')}
        </div>
        <button onClick={toggleTimer} className={`px-20 py-6 rounded-2xl text-xl font-black tracking-[0.5em] transition-all transform active:scale-95 ${isActive ? 'bg-rose-950/40 text-rose-500 border border-rose-500/30' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]'}`}>
          {isActive ? '強行出關' : '運轉周天'}
        </button>
      </div>

      {/* 底部功能區塊 */}
      <div className={`w-full max-w-4xl mt-4 bg-slate-950/80 rounded-2xl border border-white/5 h-[650px] overflow-hidden flex flex-col z-10 transition-all ${isActive ? 'opacity-20 pointer-events-none grayscale' : 'opacity-100'}`}>
        <div className="flex bg-black/60 p-1 border-b border-white/5">
          {[{id:'skills', label:'功法修煉', icon:ScrollText}, {id:'forge', label:'洞府淬煉', icon:Hammer}, {id:'artifacts', label:'法寶血煉', icon:Box}, {id:'log', label:'修行日誌', icon:History}].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 py-4 rounded-xl flex flex-col items-center gap-1 text-[10px] font-black transition-all ${activeTab===t.id ? 'bg-white/10 text-white shadow-inner' : 'text-white/30 hover:text-white/60'}`}>
              <t.icon size={18}/> {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          {activeTab === 'skills' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BASIC_SKILLS.map(s => {
                  const lvl = player.basicSkills[s.id] || 0;
                  return (
                    <div key={s.id} className="p-5 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-between h-44 hover:bg-white/10 transition-all">
                      <div><div className="flex justify-between items-center"><span className="text-sm font-black text-white uppercase">{s.name}</span><span className="text-[10px] font-mono opacity-40">Lv.{lvl}/20</span></div><p className="text-[10px] opacity-50 mt-2 italic leading-relaxed">{s.desc}</p></div>
                      <button onClick={() => availableSP > 0 && lvl < 20 && setPlayer(p => ({...p, basicSkills: {...p.basicSkills, [s.id]: lvl+1}}))} disabled={availableSP <= 0 || lvl >= 20} className="w-full py-3 bg-cyan-900/40 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-xl text-[10px] font-black border border-cyan-500/20 transition-all disabled:opacity-20 uppercase tracking-widest">研習 (1 SP)</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {activeTab === 'forge' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-emerald-950/20 rounded-2xl border border-emerald-500/20 flex flex-col justify-between h-56">
                   <div><h3 className="text-emerald-400 font-black text-lg flex items-center gap-2"><Pill size={18}/> 回春丹</h3><p className="text-[10px] opacity-50 mt-2">瞬間恢復氣血，無後遺症。</p></div>
                   <button onClick={() => player.coins >= healCost && setPlayer(p => ({...p, coins: p.coins - healCost, vitality: maxVitality}))} disabled={player.coins < healCost} className="w-full py-4 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl text-[10px] font-black border border-emerald-500/30">服用 ({healCost} 靈石)</button>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-between h-56">
                   <div className="flex justify-between font-black"><span className="text-white">聚靈陣</span><span className="opacity-40 text-xs">Lv.{player.arrays.qi}</span></div>
                   <button onClick={() => player.coins >= arrayQiCost && setPlayer(p => ({...p, coins: p.coins - arrayQiCost, arrays: {...p.arrays, qi: p.arrays.qi+1}}))} disabled={player.coins < arrayQiCost} className="w-full py-4 bg-white/10 hover:bg-white text-white hover:text-black rounded-xl text-[10px] font-black border border-white/20">升級 ({arrayQiCost} 靈石)</button>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-between h-56">
                   <div className="flex justify-between font-black"><span className="text-white">防禦陣</span><span className="opacity-40 text-xs">Lv.{player.arrays.def}</span></div>
                   <button onClick={() => player.coins >= arrayDefCost && setPlayer(p => ({...p, coins: p.coins - arrayDefCost, arrays: {...p.arrays, def: p.arrays.def+1}}))} disabled={player.coins < arrayDefCost} className="w-full py-4 bg-white/10 hover:bg-white text-white hover:text-black rounded-xl text-[10px] font-black border border-white/20">升級 ({arrayDefCost} 靈石)</button>
                </div>
              </div>
              <div className="p-10 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/10 text-center">
                 <h3 className="text-white font-black text-xl flex items-center justify-center gap-3 mb-6"><Compass className="text-yellow-500"/> 萬寶樓尋寶</h3>
                 <button onClick={() => player.coins >= gachaCost && setPlayer(p => ({...p, coins: p.coins - gachaCost}))} className="px-12 py-5 bg-white/10 hover:bg-white text-white hover:text-black rounded-xl font-black transition-all border border-white/20">開始尋寶 ({gachaCost} 靈石)</button>
              </div>
            </div>
          )}
          {activeTab === 'artifacts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
              {ARTIFACT_POOL.map(art => {
                const unlocked = player.artifacts.includes(art.id);
                const lvl = player.artifactLvls[art.id] || 0;
                const cost = Math.floor(RARITY_BASE_COST[art.rarity] * Math.pow(1.8, lvl) * forgeDiscount);
                return unlocked ? (
                  <div key={art.id} className="p-5 bg-black/40 rounded-2xl border border-white/10 flex flex-col justify-between h-48">
                    <div><h4 className={`font-black ${RARITY[art.rarity].color}`}>{art.name} <span className="float-right text-[10px] opacity-40">Lv.{lvl}</span></h4><p className="text-[10px] opacity-50 mt-2 leading-relaxed italic">「{art.desc}」</p></div>
                    <button onClick={() => player.coins >= cost && lvl < 5 && setPlayer(p => ({...p, coins: p.coins - cost, artifactLvls: {...p.artifactLvls, [art.id]: lvl+1}}))} className="w-full py-3 bg-white/5 hover:bg-white text-white hover:text-black rounded-xl text-[10px] font-black border border-white/10">血煉 ({cost} 靈石)</button>
                  </div>
                ) : <div key={art.id} className="p-10 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center opacity-20"><EyeOff size={24}/><span className="text-[8px] mt-2 font-black uppercase">機緣未到</span></div>
              })}
            </div>
          )}
          {activeTab === 'log' && (
            <div className="space-y-3 font-bold">
              {player.logs.map((l, i) => <div key={i} className={`p-4 rounded-xl text-[10px] ${i===0?'bg-white/10 text-white shadow-lg':'text-white/30 bg-white/5'}`}>{l}</div>)}
            </div>
          )}
        </div>
      </div>

      {/* 彈窗：修行指引 */}
      {showGuide && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-white/10 p-8 shadow-2xl relative">
            <button onClick={() => setShowGuide(false)} className="absolute top-6 right-6 text-white/40 hover:text-white"><X size={24}/></button>
            <h3 className="text-2xl font-black text-white mb-8 border-b border-white/5 pb-4">修行指南 (V70)</h3>
            <div className="space-y-6 text-xs leading-relaxed text-white/70 overflow-y-auto max-h-[500px] pr-4 custom-scrollbar">
               <p className="text-emerald-400 font-bold">1. 關於 SP 點數：</p>
               <p>每提升一個小境界可獲得 2 點 SP。總功法滿級需 80 點，但滿級境界僅能獲得 66 點。這意味著你必須在「戰力」與「資源獲取」間做出取捨。</p>
               <p className="text-rose-400 font-bold">2. 渡劫機制：</p>
               <p>Tier 34 為最終渡劫期。Boss 血量極高，若無「玄天之寶」或滿級功法護身，反噬傷害將足以瞬間清空氣血。</p>
            </div>
          </div>
        </div>
      )}

      {/* 彈窗：屬性分析 */}
      {showStats && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-white/10 p-8 shadow-2xl relative">
            <button onClick={() => setShowStats(false)} className="absolute top-6 right-6 text-white/40 hover:text-white"><X size={24}/></button>
            <h3 className="text-2xl font-black text-white mb-8 border-b border-white/5 pb-4">識海屬性掃描</h3>
            <div className="grid grid-cols-2 gap-4">
               {[
                 {l:'戰鬥倍率', v: `x${getMultiplier('atk').toFixed(2)}`},
                 {l:'連擊加成', v: `x${comboMultiplier.toFixed(2)}`},
                 {l:'反噬減傷', v: `${((1 - 1/getMultiplier('def'))*100).toFixed(1)}%`},
                 {l:'爆擊機率', v: `${((getMultiplier('crit')-1)*100).toFixed(1)}%`},
                 {l:'氣運保底', v: `+${(getMultiplier('luck_floor')-1).toFixed(2)}`},
                 {l:'煉器折扣', v: `${((1-forgeDiscount)*100).toFixed(1)}%`}
               ].map(s => (
                 <div key={s.l} className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center font-bold">
                   <span className="text-[10px] opacity-40 uppercase">{s.l}</span>
                   <span className="text-white text-sm">{s.v}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      <footer className="py-10 text-[8px] opacity-20 tracking-[1em] uppercase font-bold text-center">凡人修仙專注 · V70 FINAL STABLE</footer>
    </div>
  );
}

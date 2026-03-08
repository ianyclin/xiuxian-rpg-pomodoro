import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Zap, Flame, Coins, Hammer, Box, ScrollText, AlertTriangle, EyeOff, Sparkles, Sword, Compass, Clover, BookOpen, History, BarChart3, Save, Pill, HelpCircle } from 'lucide-react';

/**
 * ========================================================
 * 1. 靜態數據定義 (Lore & Database) - 保持 V68 核心邏輯
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
  { name: '煉氣境', desc: '吸納天地靈氣。', color: 'emerald' }, { name: '築基境', desc: '凝結道基。', color: 'teal' },
  { name: '結丹境', desc: '丹田結丹。', color: 'blue' }, { name: '元嬰境', desc: '碎丹成嬰。', color: 'indigo' },
  { name: '化神境', desc: '掌控天地元氣。', color: 'purple' }, { name: '煉虛境', desc: '化實為虛。', color: 'violet' },
  { name: '合體境', desc: '靈界霸主。', color: 'amber' }, { name: '大乘境', desc: '萬法不侵。', color: 'orange' }
];

const REALMS = [{ name: '一介凡人', desc: '尚未引氣入體。', majorName: '凡人', color: 'slate' }];
MAJOR_REALMS_DATA.forEach(m => ['初期', '中期', '後期', '巔峰'].forEach(s => REALMS.push({ name: `${m.name.replace('境', '')}${s}`, desc: m.desc, majorName: m.name.replace('境', ''), color: m.color })));
REALMS.push({ name: '渡劫', desc: '引動九九雷劫。', majorName: '渡劫', color: 'rose' });

const ARTIFACT_POOL = [
  { id: 'a01', rarity: 'COMMON', name: '鐵木盾', desc: '減傷+2%', val: { def: 0.02 } },
  { id: 'a12', rarity: 'UNCOMMON', name: '無形針', desc: '效率+10%，爆擊+5%', val: { streak_eff: 0.10, crit: 0.05 } },
  { id: 'a32', rarity: 'EPIC', name: '紫羅極火', desc: '戰力+20%，爆傷+80%', val: { atk: 0.20, crit_dmg: 0.80 } },
  { id: 'a52', rarity: 'MYTHIC', name: '虛天大鼎', desc: '減傷+80%，氣運+0.2，成本-40%', val: { def: 0.80, luck_floor: 0.20, forge_discount: 0.40 } },
  { id: 'a63', rarity: 'DIVINE', name: '金闕玉書', desc: '靈石+400%，氣運+0.5，爆擊+10%', val: { stone: 4.00, luck_floor: 0.50, crit: 0.10, forge_discount: 0.20 } },
];

const BASIC_SKILLS = [
  { id: 'b_qi', name: '長春功', val: { qi: 0.1 }, maxLvl: 20 },
  { id: 'b_atk', name: '青元劍訣', val: { atk: 0.1 }, maxLvl: 20 },
  { id: 'b_hp', name: '明王訣', val: { hp: 0.1 }, maxLvl: 20 },
  { id: 'b_stone', name: '天眼術', val: { stone: 0.15 }, maxLvl: 20 },
];

/**
 * ========================================================
 * 2. 主組件 (App)
 * ========================================================
 */

export default function App() {
  const version = "V69";
  const defaultState = { realmIndex: 0, qi: 0, qiToNext: 250, vitality: 100, baseMaxVitality: 100, coins: 0, baseCombat: 150, artifacts: [], artifactLvls: {}, basicSkills: {}, secretBooks: {}, arrays: { qi: 0, def: 0 }, streakCount: 0, totalFocusTime: 0, logs: [`【系統】${version} 天道印記已載入。`] };

  const [player, setPlayer] = useState(() => {
    const saved = localStorage.getItem('xianxia_master_final');
    if (!saved) return defaultState;
    try { 
      const parsed = JSON.parse(saved);
      return parsed.realmIndex !== undefined ? parsed : defaultState;
    } catch { return defaultState; }
  });

  const [saveIndicator, setSaveIndicator] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [targetEndTime, setTargetEndTime] = useState(null);
  const [focusDuration, setFocusDuration] = useState(25 * 60);
  const [mode, setMode] = useState('focus');
  const [activeTab, setActiveTab] = useState('skills');

  // 動畫與特效狀態 (確保 pointer-events-none)
  const [isAttacking, setIsAttacking] = useState(false);
  const [isCritStrike, setIsCritStrike] = useState(false);
  const [isKilling, setIsKilling] = useState(false);
  const [isHealing, setIsHealing] = useState(false);

  useEffect(() => {
    localStorage.setItem('xianxia_master_final', JSON.stringify(player));
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2000);
  }, [player]);

  const getMultiplier = useCallback((type) => {
    let mult = 1.0;
    BASIC_SKILLS.forEach(s => { if (player.basicSkills?.[s.id] > 0) mult += (s.val[type] || 0) * player.basicSkills[s.id]; });
    player.artifacts.forEach(id => {
      const art = ARTIFACT_POOL.find(a => a.id === id);
      const lvlMult = 1 + (player.artifactLvls[id] || 0) * 0.6;
      if (art && art.val[type]) mult += art.val[type] * lvlMult;
    });
    if (type === 'qi' && player.arrays?.qi) mult += player.arrays.qi * 0.05;
    if (type === 'def' && player.arrays?.def) mult += player.arrays.def * 0.05;
    return mult;
  }, [player]);

  const streakCap = 0.5 + (getMultiplier('streak_cap') - 1);
  const comboMultiplier = 1 + Math.min(5.0, player.streakCount * 0.05 * getMultiplier('streak_eff'));
  const currentCombatPower = Math.floor(player.baseCombat * getMultiplier('atk') * comboMultiplier);
  const maxVitality = Math.floor(player.baseMaxVitality * getMultiplier('hp'));
  const availableSP = (player.realmIndex * 2) - Object.values(player.basicSkills).reduce((a, b) => a + b, 0);

  // 定時器邏輯：使用系統時鐘校準
  useEffect(() => {
    let interval;
    if (isActive && targetEndTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((targetEndTime - now) / 1000));
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
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    if (mode === 'focus') {
      setIsAttacking(true);
      const isCrit = Math.random() < (getMultiplier('crit') - 1);
      if (isCrit) setIsCritStrike(true);
      
      const damage = isCrit ? currentCombatPower * 2.5 : currentCombatPower;
      const qiGain = Math.floor(100 * getMultiplier('qi'));
      const coinGain = Math.floor(200 * getMultiplier('stone'));

      setTimeout(() => {
        setIsAttacking(false);
        setIsCritStrike(false);
        setPlayer(p => ({
          ...p,
          qi: p.qi + qiGain,
          coins: p.coins + coinGain,
          streakCount: p.streakCount + 1,
          totalFocusTime: p.totalFocusTime + focusDuration
        }));
        // 突破邏輯
        if (player.qi + qiGain >= player.qiToNext && player.realmIndex < REALMS.length - 1) {
          setPlayer(p => ({ ...p, realmIndex: p.realmIndex + 1, qi: 0, qiToNext: Math.floor(p.qiToNext * 1.5) }));
        }
      }, 500);

      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      setMode('focus');
      setTimeLeft(focusDuration);
    }
  };

  const currentRealm = REALMS[player.realmIndex];

  return (
    <div className={`min-h-screen bg-[#020617] text-slate-300 font-mono p-4 flex flex-col items-center relative overflow-hidden transition-all duration-500`}>
      {/* 視覺特效層 - 關鍵修復: pointer-events-none */}
      <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center">
        {isCritStrike && <Flame size={300} className="text-amber-500/40 animate-ping absolute drop-shadow-[0_0_50px_rgba(245,158,11,0.8)]" />}
        {isAttacking && <Sword size={400} className="text-emerald-500/20 animate-pulse absolute -rotate-45" />}
        {player.vitality < maxVitality * 0.3 && <div className="absolute inset-0 border-[20px] border-red-600/10 animate-pulse"></div>}
      </div>

      {/* 頂部同步狀態 */}
      <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-900/80 text-emerald-300 px-3 py-1.5 rounded-full text-[10px] font-bold border border-emerald-500/30 transition-opacity ${saveIndicator ? 'opacity-100' : 'opacity-0'}`}>
        <Save size={12}/> 天道同步中
      </div>

      {/* 境界資訊卡片 */}
      <div className="w-full max-w-4xl z-10 mt-10">
        <div className={`bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-${currentRealm.color}-500/20 shadow-2xl`}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Shield size={32} className={`text-${currentRealm.color}-400`}/>
              <div>
                <h2 className="text-2xl font-black text-white">{currentRealm.name}</h2>
                <p className="text-xs opacity-60 italic">{currentRealm.desc}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-yellow-500 font-bold flex items-center justify-end gap-1"><Coins size={14}/> {Math.floor(player.coins)}</div>
              <div className="text-cyan-400 text-[10px] font-bold">可用 SP: {availableSP}</div>
            </div>
          </div>
          {/* 進度條 */}
          <div className="space-y-4">
            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
              <div className={`h-full bg-${currentRealm.color}-500 transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]`} style={{ width: `${(player.qi/player.qiToNext)*100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 計時器主區塊 */}
      <div className="w-full max-w-4xl py-12 text-center z-10">
        <div className="flex justify-center gap-4 mb-8">
          {FOCUS_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => !isActive && (setFocusDuration(opt.value), setTimeLeft(opt.value))} className={`px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all ${focusDuration === opt.value ? 'bg-white text-black' : 'bg-white/5 text-white/40 border-white/10'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        <div className={`text-[120px] md:text-[180px] font-black leading-none mb-10 transition-all ${isActive ? 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'text-white/20'}`}>
          {Math.floor(timeLeft/60).toString().padStart(2,'0')}:{(timeLeft%60).toString().padStart(2,'0')}
        </div>
        <button onClick={toggleTimer} className={`px-16 py-6 rounded-2xl text-xl font-black tracking-widest transition-all ${isActive ? 'bg-rose-900/40 text-rose-400 border border-rose-500/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'}`}>
          {isActive ? '強行出關' : '運轉周天'}
        </button>
      </div>

      {/* 底部功能面板 */}
      <div className={`w-full max-w-4xl mt-10 bg-slate-950/80 rounded-2xl border border-white/5 h-[600px] overflow-hidden flex flex-col z-10 transition-all ${isActive ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex bg-black/40 p-1 border-b border-white/5">
          {[{id:'skills', label:'功法', icon:ScrollText}, {id:'forge', label:'淬煉', icon:Hammer}, {id:'artifacts', label:'法寶', icon:Box}, {id:'log', label:'日誌', icon:History}].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 py-4 rounded-xl flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${activeTab===t.id ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'}`}>
              <t.icon size={18}/> {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {activeTab === 'skills' && (
            <div className="grid grid-cols-2 gap-4">
              {BASIC_SKILLS.map(s => {
                const lvl = player.basicSkills[s.id] || 0;
                return (
                  <div key={s.id} className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-white">{s.name}</span>
                      <span className="text-[10px] opacity-40">Lv.{lvl}</span>
                    </div>
                    <button onClick={() => availableSP > 0 && setPlayer(p => ({...p, basicSkills: {...p.basicSkills, [s.id]: lvl+1}}))} disabled={availableSP <= 0} className="w-full py-2 bg-cyan-900/40 text-cyan-300 rounded-lg text-[10px] font-bold disabled:opacity-20">研習 (1 SP)</button>
                  </div>
                )
              })}
            </div>
          )}
          {activeTab === 'log' && (
            <div className="space-y-2">
              {player.logs.map((l, i) => <div key={i} className="text-[10px] opacity-50 bg-white/5 p-2 rounded">{l}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

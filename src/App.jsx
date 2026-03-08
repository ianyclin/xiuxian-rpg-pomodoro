import React, { useState, useEffect, useRef, useMemo } from 'react'; import { Play, Square, Skull, Shield, Zap, Flame, Wind, Coins, Hammer, Box, ScrollText, Network, AlertTriangle, EyeOff, Crown, ChevronsUp, RefreshCw, Zap as Lightning, CloudLightning, Info, Eye, Activity, Sparkles, Sword, Compass, Clover, Lock, BookOpen, X, History, BarChart3, Save, Pill, HelpCircle, Lightbulb } from 'lucide-react'; /** * ======================================================== * 1. �𨀣��豢�摰𡁶儔 (Lore & Database) * ======================================================== */ const FOCUS_OPTIONS = [ { label: '15m', value: 15 * 60 }, { label: '25m', value: 25 * 60 }, { label: '45m', value: 45 * 60 }, { label: '60m', value: 60 * 60 } ]; const RARITY = { COMMON: { name: '�∪�', color: 'text-slate-400', weight: 0.45, qiWeight: 0.005 }, UNCOMMON: { name: '���', color: 'text-green-400', weight: 0.30, qiWeight: 0.01 }, RARE: { name: '瘜訫窄', color: 'text-blue-400', weight: 0.15, qiWeight: 0.03 }, EPIC: { name: '�文窄', color: 'text-purple-400', weight: 0.07, qiWeight: 0.07 }, LEGENDARY: { name: '�𡁜予��窄', color: 'text-orange-400', weight: 0.02, qiWeight: 0.15 }, MYTHIC: { name: '��予銋见窄', color: 'text-red-500', weight: 0.009, qiWeight: 0.30 }, DIVINE: { name: '�惩��喳窄', color: 'text-yellow-400', weight: 0.001, qiWeight: 0.50 } }; const MAJOR_REALMS_DATA = [ { name: '�㗇除憓�', desc: '�貊�憭拙𧑐��除嚗峕�擃𤘪�蝬橒��萘的隞䠷���敺㻫��', color: 'emerald' }, { name: '蝭匧抅憓�', desc: '��除�𡝗雯嚗��蝯鞾��綽�憯賢�憭批�嚗諹��文𥣞�汿��', color: 'teal' }, { name: '蝯𣂷號憓�', desc: '銝寧眎蝯𣂷號嚗屸��𥕦𤐄�吔��舐�鋆賣𧋦�賣�撖嗚��', color: 'blue' }, { name: '��為憓�', desc: '蝣𦒘號�𣂼為嚗��戭啣虾�祉宏�ａ�嚗𣬚�擳��皛���', color: 'indigo' }, { name: '�𣇉�憓�', desc: '皞嗪�𡁜予�堆��脲郊�峕綉憭拙𧑐��除嚗���䠷�����潦��', color: 'purple' }, { name: '�㕑�憓�', desc: '鈭磰����嚗��撖衣��𨥈��脲郊�峕綉蝛粹�銋见���', color: 'violet' }, { name: '���憓�', desc: '憭拐犖���嚗峕��詨祕擃𥪜�嚗峕��粹��屸𤨪銝颯��', color: 'amber' }, { name: '憭找�憓�', desc: '�峕𨘥憭拙𧑐瘜訫�嚗屸��餃�撜堆��祆�銝滢噩��', color: 'orange' } ]; const REALMS = [{ name: '銝�隞见𥣞鈭�', desc: '�∪井靽堒�嚗���芸�瘞��擃䈑�憯賢��曇���', majorName: '�∩犖', color: 'slate', isMajor: true }]; MAJOR_REALMS_DATA.forEach(major => { ['�脲�', '銝剜�', '敺峕�', '撌𥪜陸'].forEach((suffix, i) => { REALMS.push({ name: `${major.name.replace('憓�', '')}${suffix}`, desc: major.desc, isMajor: i === 0, majorName: major.name.replace('憓�', ''), color: major.color }); }); }); REALMS.push({ name: '皜∪�', desc: '撘訫�銋苷��漤𡺨�恬��𣂼�蝢賢��颱�嚗峕�����箏��啜��', majorName: '皜∪�', isMajor: true, color: 'rose' }); const GUIDE_REALMS = [ { name: '銝�隞见𥣞鈭�', desc: '�∪井靽堒�嚗���芸�瘞��擃䈑�憯賢��曇���', range: 'Tier 1' }, ...MAJOR_REALMS_DATA.map((r, i) => ({ name: r.name, desc: r.desc, range: `Tier ${i * 4 + 2} - ${i * 4 + 5}` })), { name: '皜∪���', desc: '撘訫�銋苷��漤𡺨�恬��𣂼�蝢賢��颱�嚗峕�����箏��啜��', range: 'Tier 34' } ]; const ARTIFACT_POOL = [ { id: 'a01', rarity: 'COMMON', name: '�菜銁��', desc: '�萇戌憭㚚� (�滚艔皜𥕦� +2%)', type: 'def', val: 0.02 }, { id: 'a02', rarity: 'COMMON', name: '�㘾���', desc: '�∪��單除 (�箇��啣� +2%)', type: 'atk', val: 0.02 }, { id: 'a03', rarity: 'COMMON', name: '�萘��脣�', desc: '�箸𧋦�孵� (隡烐��噼�瘥𥪯� +2%)', type: 'heal_bonus', val: 0.02 }, { id: 'a04', rarity: 'COMMON', name: '蝎㛖���𨺗鋡�', desc: '�朞瓷銋钅腼 (��𨺗�㕑氜 +5%)', type: 'stone', val: 0.05 }, { id: 'a10', rarity: 'UNCOMMON', name: '蟡鮋◢��', desc: '敺⊿◢�諹� (�滚艔皜𥕦� +5%)', type: 'def', val: 0.05 }, { id: 'a11', rarity: 'UNCOMMON', name: '摮鞉���', desc: '憟���萄膥 (�啣��䭾� +8%)', type: 'atk', val: 0.08 }, { id: 'a12', rarity: 'UNCOMMON', name: '憌偦�瘜訫膥', desc: '蝛輸�誯俈蝺� (����� +3%)', type: 'crit', val: 0.03 }, { id: 'a13', rarity: 'UNCOMMON', name: '銵��厰�', desc: '瘞��皛钅� (隡烐��噼�瘥𥪯� +5%)', type: 'heal_bonus', val: 0.05 }, { id: 'a20', rarity: 'RARE', name: '�坿���', desc: '憒㚚��桀� (�啣��䭾� +15%)', type: 'atk', val: 0.15 }, { id: 'a21', rarity: 'RARE', name: '��閠憌𥕦予��', desc: '����舀鴹 (�滚艔皜𥕦� +15%)', type: 'def', val: 0.15 }, { id: 'a22', rarity: 'RARE', name: '蝣抒��怨�', desc: '蝝滚窄蝛粹� (��𨺗�㕑氜 +30%)', type: 'stone', val: 0.30 }, { id: 'a23', rarity: 'RARE', name: '�穃�蝤�', desc: '�齿�撏拍� (����瑕拿 +25%)', type: 'crit_dmg', val: 0.25 }, { id: 'a30', rarity: 'EPIC', name: '�𥕦予曌� (隞�)', desc: '�桀�瘞�� (�典抅蝷𤾸惇�批��� +15%)', type: 'all', val: 0.15 }, { id: 'a31', rarity: 'EPIC', name: '憸券𡺨蝧�', desc: '餈�㭘憒�𡺨 (����𠰴���� +25%)', type: 'streak_eff', val: 0.25 }, { id: 'a32', rarity: 'EPIC', name: '憭拚𡺨蝡�', desc: '颲罸�蟡鮋𡺨 (�啣��䭾� +40%)', type: 'atk', val: 0.40 }, { id: 'a33', rarity: 'EPIC', name: '銵�擳𥪜�', desc: '�𡏭�皜湔� (����� +15%)', type: 'crit', val: 0.15 }, { id: 'a40', rarity: 'LEGENDARY', name: '�恍�撠�', desc: '蝛粹�撠�� (�滚艔皜𥕦� +50%)', type: 'def', val: 0.50 }, { id: 'a41', rarity: 'LEGENDARY', name: '�垍姘��𤩅��', desc: '�砍𦶢�漤腼 (�啣��䭾� +100%)', type: 'atk', val: 1.00 }, { id: 'a42', rarity: 'LEGENDARY', name: '憭扯�蟡𧼮�����', desc: '�輯澈�讠� (瘞��銝𢠃� +100%)', type: 'hp', val: 1.00 }, { id: 'a43', rarity: 'LEGENDARY', name: '�鞟�擃𥪜艔�𤏸酑', desc: '�瑕拿�𣂼� +120%', type: 'atk', val: 1.20 }, { id: 'a50', rarity: 'MYTHIC', name: '��予�祇���', desc: '瘜訫��游� (�啣��䭾� +300%)', type: 'atk', val: 3.00 }, { id: 'a51', rarity: 'MYTHIC', name: '���蟡𧼮控', desc: '鈭磰��滚��� (�典抅蝷𤾸惇�批��� +100%)', type: 'all', val: 1.00 }, { id: 'a52', rarity: 'MYTHIC', name: '銋曉𤪓曌�', desc: '����惩� (瘣𧼮��鞉𧋦 -40%)', type: 'forge_discount', val: 0.40 }, { id: 'a53', rarity: 'MYTHIC', name: '銝�蔗��', desc: '蝒�聦璆菟� (���銝𢠃��𣂼� 100%)', type: 'streak_cap', val: 1.00 }, { id: 'a60', rarity: 'DIVINE', name: '��予��', desc: '憟芸予�圈�惩� (��除�脣� +500%)', type: 'qi', val: 5.00 }, { id: 'a61', rarity: 'DIVINE', name: '瘛瑟���', desc: '��征�脲趙 (�典抅蝷𤾸惇�批��� +200%)', type: 'all', val: 2.00 }, { id: 'a62', rarity: 'DIVINE', name: '鋆𨅯予��', desc: '憭拚�鋆𦦵撩 (瘞��摨閖� +1.0)', type: 'luck_floor', val: 1.00 }, { id: 'a63', rarity: 'DIVINE', name: '瘛瑕���', desc: '摰寧��祉� (��𨺗�脣� +400%)', type: 'stone', val: 4.00 }, ]; const SECRET_BOOKS = [ { id: 's_01', rarity: 'UNCOMMON', name: '蝢��甇�', desc: '����������輻� +5%/蝝�', type: 'evade', val: 0.05, hide: '�鞟號蝺脩�頝～��' }, { id: 's_02', rarity: 'RARE', name: '銵���𦶢', desc: '����䭾�����𠰴�摰� +40%/蝝�', type: 'crit_dmg', val: 0.40, hide: '�鞱�敶梢�銵瓐��' }, { id: 's_03', rarity: 'RARE', name: '憭扯�瘙�', desc: '蟡噼�撘瑕���除�衤�摨� +0.1/蝝�', type: 'luck_floor', val: 0.10, hide: '�鞟�霅睃��硔��' }, { id: 's_04', rarity: 'EPIC', name: '憭批��漤腼', desc: '���銝𢠃������憓𧼮�銝𢠃� +20%/蝝�', type: 'streak_cap', val: 0.20, hide: '�𣂼�敶勗�頨怒��' }, { id: 's_05', rarity: 'LEGENDARY', name: '���蟡𧼮�', desc: '�见�鈭磰�����箇�撅祆�批��� +15%/蝝�', type: 'all', val: 0.15, hide: '�𣂷�銵𣬚聦皛���' }, { id: 's_06', rarity: 'MYTHIC', name: '璇菔��罸���', desc: '銝厰��剛�����𥕦��� +60%/蝝�', type: 'atk', val: 0.60, hide: '�鞉�瑽���麄��' }, { id: 's_07', rarity: 'RARE', name: '颲罸�蟡鮋𡺨', desc: '�喲蒾銋钅𡺨����羓� +8%/蝝�', type: 'crit', val: 0.08, hide: '�鞟聦擳娪��瑯��' }, { id: 's_08', rarity: 'EPIC', name: '�㗛�銵�', desc: '�惩左��除���畾粹�瘞� +20%/蝝�', type: 'qi', val: 0.20, hide: '�𣂼蝴雿輸狩蟡𠺶��' }, { id: 's_09', rarity: 'UNCOMMON', name: '�埝銁閮�', desc: '�毺�銝齿�����臬�銵�瘥𥪯� +2%/蝝�', type: 'heal_bonus', val: 0.02, hide: '�鞉熣�券�Ｘ坾��' }, { id: 's_10', rarity: 'LEGENDARY', name: '撽朞����霈�', desc: '霈𡃏澈�罸���除銵�銝𢠃� +35%/蝝�', type: 'hp', val: 0.35, hide: '�鞟��������' }, { id: 's_11', rarity: 'DIVINE', name: '瘨���𤏸澈', desc: '銝齿香銝齿���儔瘣餅��� +10%/蝝�', type: 'revive', val: 0.10, hide: '�鞾�頨急偶�箝��' }, { id: 's_12', rarity: 'RARE', name: '憭芯��匧膥閮�', desc: '�券��蠘圾���摨𨀣��� -8%/蝝�', type: 'forge_discount', val: 0.08, hide: '�鞾�惩�蟡𧼮極��' }, ]; const BASIC_SKILLS = [ { id: 'b_qi', name: '�瑟坾��', desc: '�箇���除�脣��𣂼� +10%/蝝�', type: 'qi', val: 0.1, maxLvl: 10, hide: '�鞉銁蝟餌�����' }, { id: 'b_atk', name: '�鍦��滩見', desc: '�箇��圈洛�𥟇��� +10%/蝝�', type: 'atk', val: 0.1, maxLvl: 10, hide: '�𣂼��誩�敶Ｕ��' }, { id: 'b_hp', name: '鞊∠睻��', desc: '�箇�瘞��銝𢠃��𣂼� +10%/蝝�', type: 'hp', val: 0.1, maxLvl: 10, hide: '�鞾��𥕢�憯𠺶��' }, { id: 'b_stone', name: '撠钅�銵�', desc: '隞餃���𨺗�嗥��𣂼� +15%/蝝�', type: 'stone', val: 0.15, maxLvl: 10, hide: '�鞉��澆��研��' }, ]; const RARITY_BASE_COST = { COMMON: 1000, UNCOMMON: 5000, RARE: 25000, EPIC: 100000, LEGENDARY: 500000, MYTHIC: 2500000, DIVINE: 10000000 }; /** * ======================================================== * 2. 銝餌�隞� (App) * ======================================================== */ export default function App() { const defaultPlayerState = { realmIndex: 0, qi: 0, qiToNext: 250, vitality: 100, baseMaxVitality: 100, coins: 0, baseCombat: 100, artifacts: [], artifactLvls: {}, basicSkills: {}, secretBooks: {}, arrays: { qi: 0, def: 0 }, streakCount: 0, luck: 1.0, totalFocusTime: 0, history: [], logs: ['�鞟頂蝯晞�穃予�枏㫲閮睃歇���嚗䔶耨銵屸�脣漲��𠯫隤𣬚�撌脰䌊�蓥�摮塩��'] }; const [player, setPlayer] = useState(() => { try { const saved = localStorage.getItem('xianxia_master_v49_final'); if (saved) { const parsed = JSON.parse(saved); if (!parsed.logs) parsed.logs = defaultPlayerState.logs; return parsed; } return defaultPlayerState; } catch (e) { return defaultPlayerState; } }); const [saveIndicator, setSaveIndicator] = useState(false); const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`; const getMonsterName = (tier) => ['�𡒊𣄽撟怎䔿', '暺𤑳��坔�', '憓刻�', '銵�蝺朞�', '�潮���', '�剝��喃犖', '鋆�◢��', '�啁�摰烾𩑈��', '�罸�蝢�亚', '�蠘酑銋𧢲�'][Math.min(Math.floor((tier-1)/3), 9)] + ` (Tier ${tier})`; const generateMonsterState = (realmIdx) => { const nTier = realmIdx + 1; const nHp = Math.floor(150 * Math.pow(1.20, nTier - 1) * (realmIdx === REALMS.length - 2 ? 15 : 1)); return { name: realmIdx === REALMS.length - 2 ? '�𣂷�銋嗪��怒��' : getMonsterName(nTier), hp: nHp, maxHp: nHp, tier: nTier }; }; const [monster, setMonster] = useState(() => generateMonsterState(player.realmIndex)); const [focusDuration, setFocusDuration] = useState(25 * 60); const [timeLeft, setTimeLeft] = useState(25 * 60); const [isActive, setIsActive] = useState(false); const [mode, setMode] = useState('focus'); const [activeTab, setActiveTab] = useState('skills'); const [showRealmGuide, setShowRealmGuide] = useState(false); const [showStatsReport, setShowStatsReport] = useState(false); const [showGuide, setShowGuide] = useState(false); const [guideTab, setGuideTab] = useState('rules'); const [hoveredRealmIdx, setHoveredRealmIdx] = useState(null); const [celebration, setCelebration] = useState(null); const [isAttacking, setIsAttacking] = useState(false); const [isCollapsing, setIsCollapsing] = useState(false); const [isHealing, setIsHealing] = useState(false); useEffect(() => { try { localStorage.setItem('xianxia_master_v49_final', JSON.stringify(player)); setSaveIndicator(true); const timer = setTimeout(() => setSaveIndicator(false), 2000); return () => clearTimeout(timer); } catch (e) { console.error(e); } }, [player]); const getMultiplier = (type) => { let mult = 1.0; BASIC_SKILLS.forEach(s => { if (player.basicSkills?.[s.id] > 0 && s.type === type) mult += s.val * player.basicSkills[s.id]; }); const processItem = (item, lvl) => { if (!item) return; if (item.type === type) mult += item.val * lvl; else if (item.type === 'all' && ['atk', 'hp', 'qi', 'stone', 'def'].includes(type)) mult += item.val * lvl; }; Object.entries(player.secretBooks || {}).forEach(([id, lvl]) => { processItem(SECRET_BOOKS.find(x => x.id === id), lvl); }); (player.artifacts || []).forEach(id => { processItem(ARTIFACT_POOL.find(a => a.id === id), 1 + (player.artifactLvls?.[id] || 0) * 0.5); }); if (type === 'qi' && (player.arrays?.qi || 0)) mult += player.arrays.qi * 0.05; if (type === 'def' && (player.arrays?.def || 0)) mult += player.arrays.def * 0.05; return mult; }; const currentRealmData = REALMS[player.realmIndex]; const themeColorClass = `text-${currentRealmData.color}-400`; const themeBorderClass = `border-${currentRealmData.color}-500/20`; const streakCap = Math.min(3.0, 0.5 + (getMultiplier('streak_cap') - 1)); const streakEff = getMultiplier('streak_eff'); const streakBonusMult = Math.min(streakCap, (player.streakCount || 0) * 0.05 * streakEff); const comboMultiplier = 1 + streakBonusMult; const critRate = Math.min(0.75, getMultiplier('crit') - 1); const critDmg = Math.min(5.0, 2.0 + (getMultiplier('crit_dmg') - 1)); const evadeRate = Math.min(0.60, getMultiplier('evade') - 1); const reviveRate = Math.min(0.50, getMultiplier('revive') - 1); const healPct = Math.min(0.50, 0.20 + (getMultiplier('heal_bonus') - 1)); const defMultiplier = getMultiplier('def'); const dmgTakenPct = (1 / defMultiplier) * 100; const currentCombatPower = Math.floor(player.baseCombat * getMultiplier('atk') * comboMultiplier); const maxVitality = Math.floor(player.baseMaxVitality * getMultiplier('hp')); const forgeDiscount = Math.max(0.1, 1 - (getMultiplier('forge_discount') - 1)); const availableSP = (player.realmIndex * 2) - Object.values(player.basicSkills || {}).reduce((a, b) => a + b, 0); const upgCostAtk = Math.floor(1000 * Math.pow(1.25, (player.baseCombat - 100) / 100) * forgeDiscount); const upgCostHp = Math.floor(1000 * Math.pow(1.25, (player.baseMaxVitality - 100) / 100) * forgeDiscount); const healCost = Math.floor(maxVitality * 1.5 * forgeDiscount); const arrayQiCost = Math.floor(5000 * Math.pow(1.8, (player.arrays?.qi || 0)) * forgeDiscount); const arrayDefCost = Math.floor(4000 * Math.pow(1.8, (player.arrays?.def || 0)) * forgeDiscount); const gachaCost = Math.floor(10000 * Math.pow(1.15, player.realmIndex) * forgeDiscount); const addLog = (text) => { const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); setPlayer(p => ({ ...p, logs: [`[${timeStr}] ${text}`, ...(p.logs || [])].slice(0, 50) })); }; const toggleTimer = () => { if (!isActive) { setIsActive(true); addLog(`[�贝�] ���瞈��潦��); } }; const triggerHealEffect = () => { setIsHealing(true); setTimeout(() => setIsHealing(false), 800); }; const handleHeal = () => { if (player.coins >= healCost && player.vitality < maxVitality) { const healAmount = Math.floor(maxVitality * 0.5); setPlayer(p => ({ ...p, coins: p.coins - healCost, vitality: Math.min(maxVitality, p.vitality + healAmount) })); triggerHealEffect(); addLog(`[�劐號] �墧��墧坾銝對��Ｗ儔 ${healAmount} 暺墧除銵���); } }; const handleGiveUp = () => { setIsActive(false); if (Math.random() < evadeRate) { addLog(`�倮 �鞟��䠷��踴�烐��罸��踹��穿�`); } else { setIsCollapsing(true); setTimeout(() => setIsCollapsing(false), 1000); const penalty = Math.floor(monster.tier * 30 * (1 / defMultiplier)); let nextHp = player.vitality - penalty; if (nextHp <= 0) { if (Math.random() < reviveRate) { nextHp = maxVitality; triggerHealEffect(); addLog(`�� �鞉�瑽���麄�𤏸��梁�摰㚁�`); } else { nextHp = Math.floor(maxVitality * 0.5); setPlayer(p => ({ ...p, qi: Math.floor(p.qi * 0.8) })); addLog(`�� �鞱澈甇駁�瘨��烐�憭曹耨�綽�����∪仃��); } } else { addLog(`�辶 �𣂼��誩援瞏啜�烐緍�� ${penalty} 瘞����); } setPlayer(p => ({ ...p, vitality: nextHp, streakCount: 0 })); } setTimeLeft(focusDuration); }; const handleComplete = () => { setIsActive(false); if (mode === 'focus') { setIsAttacking(true); setTimeout(() => setIsAttacking(false), 500); const isCrit = Math.random() < critRate; const damageBase = Math.floor(currentCombatPower * (focusDuration / 1500)); const actualDamage = isCrit ? Math.floor(damageBase * critDmg) : damageBase; const newHp = Math.max(0, monster.hp - actualDamage); if (newHp === 0) handleDefeat(); else { setMonster(prev => ({ ...prev, hp: newHp })); setMode('break'); setTimeLeft(5 * 60); } addLog(isCrit ? `�𤣳 �鞟��𨳍�煾�䭾� ${actualDamage} 暺墧�皛��摰喉�` : `[�见�] �䭾� ${actualDamage} 暺𧼮�摰喋��); } else { setMode('focus'); setTimeLeft(focusDuration); const passiveHeal = Math.floor(maxVitality * healPct); setPlayer(p => ({ ...p, vitality: Math.min(maxVitality, p.vitality + passiveHeal) })); triggerHealEffect(); addLog(`[蝯鞉�] �鞟�摰峕�嚗峕�敺� ${passiveHeal} 暺墧除銵���); } }; const handleDefeat = () => { const timeBonus = focusDuration >= 3600 ? 1.25 : 1.0; const baseQi = 100 * Math.pow(1.12, monster.tier); const baseCoin = Math.floor(200 * Math.pow(1.15, monster.tier) * player.luck); let qiGain = Math.floor(baseQi * getMultiplier('qi') * timeBonus); let coinGain = Math.floor(baseCoin * getMultiplier('stone')); let nQi = player.qi + qiGain, nRealm = player.realmIndex, upgraded = false; if (nQi >= player.qiToNext && nRealm < REALMS.length - 1) { nRealm++; nQi -= player.qiToNext; upgraded = true; } let newArtifacts = [...player.artifacts]; if (Math.random() < (0.12 * player.luck)) { const potential = ARTIFACT_POOL.filter(a => !newArtifacts.includes(a.id)); if (potential.length > 0) { newArtifacts.push(potential[0].id); addLog(`�� �鞉�蝺��𤑳㬢敺㛖㺭撖塚���${potential[0].name}�𡢅�`); } } setPlayer(p => ({ ...p, realmIndex: nRealm, qi: nQi, qiToNext: upgraded ? Math.floor(p.qiToNext * 1.35) : p.qiToNext, coins: p.coins + coinGain, streakCount: p.streakCount + 1, totalFocusTime: p.totalFocusTime + focusDuration, artifacts: newArtifacts, history: upgraded ? [...p.history, { name: REALMS[nRealm].name, time: p.totalFocusTime }] : p.history })); if (upgraded) setCelebration({ name: REALMS[nRealm].name, type: 'up' }); setMonster(generateMonsterState(nRealm)); setMode('break'); setTimeLeft(5 * 60); }; const handleGacha = () => { if (player.coins < gachaCost) return; const roll = Math.random(); const lck = player.luck; let targetRarity = 'COMMON'; if (roll < 0.001 * lck) targetRarity = 'DIVINE'; else if (roll < 0.01 * lck) targetRarity = 'MYTHIC'; else if (roll < 0.03 * lck) targetRarity = 'LEGENDARY'; else if (roll < 0.08 * lck) targetRarity = 'EPIC'; else if (roll < 0.18 * lck) targetRarity = 'RARE'; else if (roll < 0.4 * lck) targetRarity = 'UNCOMMON'; const candidates = ARTIFACT_POOL.filter(a => a.rarity === targetRarity && !player.artifacts.includes(a.id)); if (candidates.length > 0) { setPlayer(p => ({ ...p, coins: p.coins - gachaCost, artifacts: [...p.artifacts, candidates[0].id] })); setCelebration({ name: candidates[0].name, type: 'artifact' }); } else { setPlayer(p => ({ ...p, coins: p.coins - gachaCost, qi: p.qi + 100 })); addLog(`[�砍窄璅𨩇 �脰��煺耨�箝��); } }; const handleUpgradeSecret = (id) => { const lvl = player.secretBooks[id] || 0; const cost = Math.floor(10000 * Math.pow(2, lvl) * forgeDiscount); if (player.coins >= cost && lvl < 5) { setPlayer(p => ({ ...p, coins: p.coins - cost, secretBooks: { ...p.secretBooks, [id]: lvl + 1 } })); addLog(`[���] ��${SECRET_BOOKS.find(x=>x.id===id).name}�𤏸秐 Lv.${lvl + 1}��); } }; const handleUpgradeArtifact = (artId, rarity) => { const currentLvl = player.artifactLvls[artId] || 0; const cost = Math.floor(RARITY_BASE_COST[rarity] * Math.pow(1.8, currentLvl) * forgeDiscount); if (player.coins >= cost && currentLvl < 5) { setPlayer(p => ({ ...p, coins: p.coins - cost, artifactLvls: { ...p.artifactLvls, [artId]: currentLvl + 1 } })); addLog(`[銵��处 瘜訫窄�� Lv.${currentLvl + 1}��); } }; useEffect(() => { let interval = null; if (isActive && timeLeft > 0) interval = setInterval(() => setTimeLeft(t => t - 1), 1000); else if (isActive && timeLeft === 0) handleComplete(); return () => clearInterval(interval); }, [isActive, timeLeft]); // --- SVG �𤥁”蝯�辣 --- const InsightsChart = () => { const data = player.history || []; if (data.length < 2) return
霅䀹絲�芣�嚗���⊥�敶�
; const maxT = Math.max(...data.map(d => d.time)) || 1; const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d.time / maxT) * 100}`).join(' '); return ( ); }; return (
{/* GitHub Pages Save Indicator */}
撌脣�甇亙予��
{showRealmGuide && (
憭拚�蝬梶楝 (憓���刻汗)

setShowRealmGuide(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white">
{GUIDE_REALMS.map((r, i) => ())}
雿漤�蝭��	憓���滩�	蟡噼�撠舘�
{r.range}	{r.name}	{r.desc}
)} {showGuide && (
靽株�������閮�

setShowGuide(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white">
setGuideTab('rules')} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded uppercase tracking-widest transition-all ${guideTab === 'rules' ? 'bg-white/10 text-white shadow-inner' : 'text-white/40 hover:text-white/80'}`}>�箇�瘜訫� setGuideTab('tips')} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded uppercase tracking-widest transition-all ${guideTab === 'tips' ? 'bg-amber-500/20 text-amber-400 shadow-inner' : 'text-amber-400/40 hover:text-amber-400/80'}`}>靽株�蟡閗見 (Tips)
{guideTab === 'rules' ? (
�贝��典予 (撠�釣閮��)

暺墧��见�閮������𣂼��脣���除����單�蝺����瘜刻�銋�𤣰蝛怨�擃塩��

�鞟��噼� (隡烐����)

**摰峕� 5 ���隡烐��喟��鞟��𣂼�**嚗諹䌊�閙�敺� 20%~50% 瘞����

韏啁��仿� (撘瑁��粹�)

閮��銝剝�娍𦆮璉���剖��滚艔���嚗屸朌蝜�葉�瑕�撠舘稲頨急香�𤘪���

頨急香�𤘪� (甇颱滿�脩蔑)

瘞��甇賊妟��𥅾敺拇暑憭望�嚗��憭勗縧 **20% �嗅�靽桃�** ����厰���嚗䔶�瘞�����蝵株秐 50%����坔��單�摨𦦵�銝寧雁����卝��

��號憒躰𠯫 (銝餃��Ｗ儔)

�具�峕�摨𨀣楓�剹�滚���虾�㕑ˊ�墧坾銝嫘����烾��喳朖�舐��𤘪��� 50% 銵�蝺𡄯��舀�撠滨𣶹撖阡朌蝜�僕�曄���雿喳��詻��

) : (
蝬𤘪��朞��脩戌

瘣𧼮��鞉𧋦����豢��瑯����芸��閗� �𠰴������ �� �𠰴云銋嗵��刻見����

瘞��撠见窄���

�砍窄璅梶���凒�乩�銝𦠜除�见�潦����冽�擛亦���除�钅�瞍脫��滚�撠见窄��

瘝㗇��鞉𧋦��扔�𣂼捆��

�亦𣶹撖虫葉�餌�鋡急��瘀�靘见�摮拙��剝洹嚗㚁�隢见��� �羓��蹱郊�� ����踵�����迨憭吔�瘥𤩺活�𣂼�摰峕���5���隡烐��滚虾�滩祥�Ｗ儔憭折�瘞������鞱��劐號銝西�嚗峕䲮�賢漲�𦒘�銋嗪��怒��

憭拚�瘜訫�銝𢠃�

隢𧢲釣�誩惇�找��𣂷誑�踹�瘚芾祥鞈��嚗𡁻��踵扔�� 60%嚗�儔瘣餅扔�� 50%嚗𣬚��羓�璆菟� 75%��虾�具��惇�批��𣂼𥼚�𨳍�滢葉撖行���綉��

)}
)} {showStatsReport && (
撅祆�批��鞱�璆菟��勗�

setShowStatsReport(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white">
�箇��滨� (Base Multipliers)

蝮賣��𥕦���x{getMultiplier('atk').toFixed(2)}
瘞��銝𢠃��䭾�x{getMultiplier('hp').toFixed(2)}
��除�脣��滨�x{getMultiplier('qi').toFixed(2)}
��𨺗�㕑氜�滨�x{getMultiplier('stone').toFixed(2)}
憭拚�瘜訫� (Hard Capped Stats)

隡烐��噼�瘥𥪯� (璆菟� 50%){(healPct * 100).toFixed(1)}%
����� (璆菟� 75%){(critRate * 100).toFixed(1)}%
����滚��� (璆菟� 60%){(evadeRate * 100).toFixed(1)}%
瘨��敺拇暑�� (璆菟� 50%){(reviveRate * 100).toFixed(1)}%
���憓𧼮�銝𢠃� (璆菟� +300%)+{((streakCap - 0.5) * 100).toFixed(0)}%
�埈�扯�蝬𤘪� (Defense & Economy)

�滚艔�踹�瘥𥪯� (1/Def){dmgTakenPct.toFixed(1)}%
瘣𧼮��鞉𧋦瘥𥪯� (璆菟� 10%){(forgeDiscount * 100).toFixed(0)}%
瘞��靽嘥� (Luck Floor){getMultiplier('luck_floor').toFixed(2)}
)} {celebration && (
setCelebration(null)}>
蝒�聦�園瓲

�𨫆celebration.name}��

)}
�∩犖靽桐�撠�釣

{currentRealmData.name}

{currentRealmData.desc}

��𨺗{Math.floor(player.coins)}
SP{availableSP}
���x{comboMultiplier.toFixed(2)}
瘞��x{player.luck.toFixed(2)}
{isHealing &&
}
瘞���笔� {player.vitality < maxVitality && (�舐�銝寞�敺�)} {Math.floor(player.vitality)} / {maxVitality}
靽桃��脣漲{Math.floor(player.qi)} / {player.qiToNext}
{REALMS.map((r, i) => (
{i}
{r.name}
))}
setShowGuide(true)} className="flex items-center gap-2 text-[10px] font-black text-emerald-400/50 hover:text-emerald-400 transition-all bg-white/10 px-4 py-2 rounded-full border border-white/10 font-bold backdrop-blur-md"> 靽株���� setShowStatsReport(true)} className="flex items-center gap-2 text-[10px] font-black text-cyan-400/50 hover:text-cyan-400 transition-all bg-white/10 px-4 py-2 rounded-full border border-white/10 font-bold backdrop-blur-md"> 撅祆�批��� setShowRealmGuide(true)} className="flex items-center gap-2 text-[10px] font-black text-white/30 hover:text-white transition-all bg-white/10 px-4 py-2 rounded-full border border-white/10 font-bold backdrop-blur-md"> 憓���刻汗
{FOCUS_OPTIONS.map(opt => ({ if(!isActive) { setFocusDuration(opt.value); setTimeLeft(opt.value); }}} className={`px-4 py-1.5 rounded-full text-[10px] font-black border transition-all font-bold ${focusDuration === opt.value ? 'bg-white text-black border-white' : 'bg-black/40 text-white/40 border-white/10 hover:text-white/80'}`}>{opt.label}))}
{monster.name}
{formatTime(timeLeft)}
{!isActive ? (  �贝��典予  ) : (  撘瑁��粹�  )}
{[ { id: 'skills', label: '���蟡閧�', icon: ScrollText }, { id: 'forge', label: '瘣𧼮�瘛祉�', icon: Hammer }, { id: 'artifacts', label: '瘜訫窄摨�', icon: Box }, { id: 'insights', label: '霅䀹絲�訫蔣', icon: Activity }, { id: 'log', label: '靽株��亥�', icon: History } ].map(tab => ( setActiveTab(tab.id)} className={`flex-1 py-4 rounded-lg text-[9px] font-black uppercase tracking-[0.3em] flex flex-col items-center justify-center gap-1 transition-all font-bold ${activeTab===tab.id ? 'bg-white/10 text-white shadow-inner border border-white/10' : 'text-white/30 hover:text-white/60'}`}> {tab.label} ))}
{activeTab === 'skills' && (
�∩��孵抅 (SP �𠉛�)

{BASIC_SKILLS.map(s => { const lvl = player.basicSkills?.[s.id] || 0; return (
{s.name} Lv.{lvl}

{s.desc}

{ if(availableSP >= 1 && lvl < 10) setPlayer(p => ({...p, basicSkills: {...p.basicSkills, [s.id]: lvl+1}})) }} disabled={availableSP < 1 || lvl >= 10} className="mt-4 w-full py-2 bg-white/10 hover:bg-white text-white hover:text-black rounded text-[9px] font-black border border-white/10 font-bold disabled:opacity-30 transition-all">�𠉛� (1 SP)
);})}
璈毺楠蟡閧� (12 蝔�)

{SECRET_BOOKS.map(book => { const lvl = player.secretBooks?.[book.id] || 0; const learned = lvl > 0; const upCost = Math.floor(10000 * Math.pow(2, lvl) * forgeDiscount); return (
{book.name} {learned && Lv.{lvl}}

{learned ? book.desc : '�𦠜捏撘瑟訽璈毺��脣���'}

{learned && lvl < 5 && { if(player.coins >= upCost) setPlayer(p => ({...p, coins: p.coins - upCost, secretBooks: {...p.secretBooks, [book.id]: lvl+1}})) }} disabled={player.coins < upCost} className="mt-4 w-full py-2 bg-white/10 hover:bg-emerald-500 text-white hover:text-black rounded text-[9px] font-black border border-white/10 font-bold transition-all disabled:opacity-30">������ ({upCost} ��𨺗)}
);})}
)} {activeTab === 'forge' && (
�㕑ˊ�墧坾銝�

�Ｗ儔 50% ��憭扳除銵���

= maxVitality} className="w-full py-5 bg-emerald-900/60 hover:bg-emerald-600 text-emerald-100 rounded font-black uppercase text-xs transition-all disabled:opacity-30 border border-emerald-500/50">{player.vitality >= maxVitality ? '瘞��撌脫遛' : `�劐號 (${healCost} ��𨺗)`}
�萘毀�滚�

�箇��啣� +100��

{ if(player.coins >= upgCostAtk) setPlayer(p => ({ ...p, coins: p.coins - upgCostAtk, baseCombat: p.baseCombat + 100 })) }} disabled={player.coins < upgCostAtk} className="w-full py-5 bg-white/10 hover:bg-white text-white hover:text-black rounded font-black uppercase text-xs tracking-widest shadow-xl transition-all font-bold disabled:opacity-30">蟡剔� ({upgCostAtk} ��𨺗)
�祉��㕑澈

瘞��銝𢠃� +100��

{ if(player.coins >= upgCostHp) setPlayer(p => ({ ...p, coins: p.coins - upgCostHp, baseMaxVitality: p.baseMaxVitality + 100, vitality: p.vitality + 100 })) }} disabled={player.coins < upgCostHp} className="w-full py-5 bg-white/10 hover:bg-white text-white hover:text-black rounded font-black uppercase text-xs tracking-widest shadow-xl transition-all font-bold disabled:opacity-30">�祉� ({upgCostHp} ��𨺗)
���璅䂿�

�𡁻�憭折腼 Lv.{player.arrays?.qi||0}
��除��� +5%/蝝�

{ if(player.coins >= arrayQiCost) setPlayer(p => ({ ...p, coins: p.coins - arrayQiCost, arrays: {...p.arrays, qi: (p.arrays?.qi||0)+1} })) }} disabled={player.coins < arrayQiCost} className="w-full py-3 bg-white/10 hover:bg-white text-white rounded text-[9px] font-black border border-white/10 transition-all font-bold disabled:opacity-30">��� ({arrayQiCost} ��𨺗)
霅瑕�憭折腼 Lv.{player.arrays?.def||0}
�滚艔 -5%/蝝�

{ if(player.coins >= arrayDefCost) setPlayer(p => ({ ...p, coins: p.coins - arrayDefCost, arrays: {...p.arrays, def: (p.arrays?.def||0)+1} })) }} disabled={player.coins < arrayDefCost} className="w-full py-3 bg-white/10 hover:bg-white text-white rounded text-[9px] font-black border border-white/10 transition-all font-bold disabled:opacity-30">��� ({arrayDefCost} ��𨺗)
�砍窄璅枏�撖�

{Object.entries(RARITY).map(([k, r]) => (
{r.name}{(r.weight*100*player.luck).toFixed(1)}%
))}
撠见窄 ({Math.floor(gachaCost)} ��𨺗)
)} {activeTab === 'artifacts' && (
{ARTIFACT_POOL.map(art => { const unlocked = player.artifacts.includes(art.id), lvl = player.artifactLvls?.[art.id]||0, cost = Math.floor(RARITY_BASE_COST[art.rarity]*Math.pow(1.8,lvl)*forgeDiscount); return unlocked ? (
{art.name} Lv.{lvl}

�庙art.desc}��

{lvl < 5 && handleUpgradeArtifact(art.id, art.rarity)} disabled={player.coins < cost} className="mt-6 w-full py-3 bg-white/10 hover:bg-white text-white hover:text-black rounded text-[9px] font-black transition-all border border-white/10 font-bold disabled:opacity-30">銵��� ({cost} ��𨺗)}
) :
撖嗅��扳�嚗㝯RARITY[art.rarity].name}

; })}
)} {activeTab === 'insights' && (
霅䀹絲�訫蔣 (靽桃��脩�)蝝航����: {Math.floor(player.totalFocusTime/60)}m
)} {activeTab === 'log' && (
{(player.logs || []).map((e, i) => (
{e}
))}
)}
�𠰴𥣞鈭箔耨隞坔��见��𡑒身摰𡁏飛雿𡏭�� 敹䁅� ����

Created by fb/��彍銝匧窄憌� with Gemini

{if(window.confirm('蝣箏��滨蔭靽株�嚗���㗇��𨅯��箏仃��')) { localStorage.clear(); window.location.reload(); }}} className="opacity-50 hover:opacity-100 transition-opacity border border-white/20 px-4 py-1.5 rounded-full text-[8px] uppercase tracking-widest font-bold hover:bg-rose-900/50 hover:border-rose-500/50 hover:text-rose-200">����滢耨
); } const DEFAULT_PLAYER = { realmIndex: 0, qi: 0, qiToNext: 250, vitality: 100, baseMaxVitality: 100, coins: 0, baseCombat: 100, artifacts: [], artifactLvls: {}, basicSkills: {}, secretBooks: {}, arrays: { qi: 0, def: 0 }, streakCount: 0, luck: 1.0, totalFocusTime: 0, history: [] };

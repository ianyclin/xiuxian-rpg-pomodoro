import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Shield, Flame, Wind, Hammer, Box, ScrollText, Network, AlertTriangle, 
  EyeOff, Crown, RefreshCw, Activity, Sparkles, Sword, 
  Compass, BookOpen, X, History, BarChart3, Pill, HelpCircle, Award, 
  Heart, Copy, Download, FileText 
} from 'lucide-react';

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

const KARMA_TALENTS = [
  { id: 'k_qi', name: '天生靈體', desc: '靈氣親和。每級全局靈氣獲取永久 +2%。', cost: 1, maxLvl: 25, val: { qi: 0.02 } },
  { id: 'k_atk', name: '武道奇才', desc: '為戰而生。每級全局戰鬥力永久 +2%。', cost: 1, maxLvl: 25, val: { atk: 0.02 } },
  { id: 'k_hp', name: '不滅霸體', desc: '血氣如龍。每級氣血上限永久 +2%。', cost: 1, maxLvl: 25, val: { hp: 0.02 } },
  { id: 'k_stone', name: '點石成金', desc: '財神眷顧。每級靈石獲取永久 +3%。', cost: 1, maxLvl: 25, val: { stone: 0.03 } },
  { id: 'k_sense', name: '萬法不侵', desc: '神識固化。每級反噬減傷永久 +1%。', cost: 1, maxLvl: 20, val: { sense_def: 0.01 } },
  { id: 'k_streak', name: '空明之心', desc: '越戰越勇。每級連擊效率永久 +2%。', cost: 1, maxLvl: 25, val: { streak_eff: 0.02 } },
  { id: 'k_luck', name: '氣運之子', desc: '天道垂青。每級氣運保底永久 +0.02。', cost: 2, maxLvl: 15, val: { luck_floor: 0.02 } }
];

const FEEDBACK_TEXTS = {
  focus: [
    "劍光閃爍，在妖獸身上留下一道深深的血痕。",
    "法寶轟擊，震退了眼前的強敵！",
    "攻勢如潮，妖獸的氣息隨之衰弱了幾分。",
    "真元激盪，這一擊結結實實地打在了妖獸的破綻上。",
    "趁其不備，凌厲的殺招狠狠命中了目標。",
    "激烈交鋒！你的法術成功穿透了它的防禦。",
    "靈力爆發，妖獸的護體靈光被你強行撕裂。",
    "一番纏鬥，妖獸的動作明顯遲緩了下來。",
    "抓住破綻，連續的猛攻讓妖獸連連後退。",
    "氣血翻湧，你的一擊讓妖獸發出了痛苦的嘶吼。"
  ],
  break: [
    "靈氣運轉一個周天，神清氣爽。",
    "心無旁騖，道心更堅定了一分。",
    "摒棄雜念，真元如臂使指。",
    "吐納之間，修為暗暗增長。",
    "一念不生，萬法無咎。",
    "神識清明，對天地法則的感悟加深了。",
    "氣沉丹田，經脈中的靈力越發凝實。",
    "歲月如梭，唯有苦修方能證得大道。",
    "不驕不躁，平心靜氣地完成了一次蓄力。",
    "周天圓滿，將外界喧囂盡數隔絕。"
  ],
  kill: [
    "劍氣如虹，妖血染紅了大地！",
    "雷霆手段，瞬間將妖邪斬化為飛灰！",
    "區區妖物，也敢擋我修仙之路！",
    "真元爆發，摧枯拉朽般粉碎了敵人的防禦。",
    "身法如電，在妖獸來不及反應前取其首級。"
  ],
  boss: [
    "逆天改命！硬生生踏破了這生死玄關！",
    "天道不公，我便逆天！死劫已破！",
    "千百次生死邊緣的試探，終於斬滅此瓶頸！",
    "縱使九死一生，也絕不退縮半步！境界突破！",
    "宿敵伏誅！從今往後，此界再無人能阻我！"
  ]
};

const BOSS_DATA = [
  { n: '【七玄門】墨大夫', s: '銀針偷襲', b: '魔銀手' },
  { n: '【野狼幫主】賈天龍', s: '鐵衛護陣', b: '天羅地網' },
  { n: '【黃楓谷】陸師兄', s: '青風劍訣', b: '狂風絕息' },
  { n: '【天涯閣】狂人封岳', s: '黃羅傘護體', b: '踏雲靴突襲' },
  { n: '【血色禁地】墨蛟', s: '巨尾掃擊', b: '黑色毒火' },
  { n: '【鬼靈門少主】王蟬', s: '鬼靈步', b: '血靈大法' },
  { n: '【燕家堡】燕家老祖', s: '燕家機關', b: '天羅陣' },
  { n: '【黑煞教】血侍', s: '妖化之軀', b: '血咒術' },
  { n: '【黑煞教主】越皇化身', s: '血靈光波', b: '黑蛟血爪' },
  { n: '【極陰徒弟】烏丑', s: '玄陰魔氣', b: '極陰真火' },
  { n: '【妙音門叛徒】趙長老', s: '迷音陣', b: '妙音殺網' },
  { n: '【八級妖修】毒蛟', s: '蛟龍水箭', b: '碧綠毒丹' },
  { n: '【六道傳人】溫天仁', s: '魔雷術', b: '八門金光鏡' },
  { n: '【慕蘭神師】仲大仙師', s: '五行靈術', b: '木生大術' },
  { n: '【陰羅宗主】房宗主', s: '鬼羅幡動', b: '陰羅幽火' },
  { n: '【大晉皇族】葉家大長老', s: '皇家秘術', b: '天威降臨' },
  { n: '【星海霸主】六道極聖', s: '魔道秘術', b: '六極真魔功' },
  { n: '【冰海之主】冰鳳', s: '極寒冰刺', b: '絕對冰封' },
  { n: '【突兀族】天瀾聖獸分身', s: '聖獸之威', b: '天瀾狂煞' },
  { n: '【九幽宗】九幽老魔', s: '幽冥鬼氣', b: '九幽鎖魂' },
  { n: '【昆吾魔化】元剎聖祖化身', s: '黑魔匕首', b: '元剎魔域' },
  { n: '【飛靈聖子】赤魔', s: '赤魔炎', b: '飛靈聖火' },
  { n: '【地淵妖物】木靈妖王', s: '木靈刺', b: '森羅萬象' },
  { n: '【夜叉族】王級尊者', s: '夜叉冥水', b: '夜叉真身' },
  { n: '【地淵霸主】地血老鬼', s: '血道秘術', b: '紫血傀儡爆' },
  { n: '【角蚩族】長尊', s: '角蚩秘術', b: '圖騰真身' },
  { n: '【魔族】血光聖祖化身', s: '血光印', b: '血魔大陣' },
  { n: '【廣寒界】真靈遺骨', s: '真靈威壓', b: '毀滅之光' },
  { n: '【魔界始祖】六極聖祖', s: '六極幻影', b: '六道天魔境' },
  { n: '【蜉蝣族】大乘太上', s: '控蟲秘術', b: '蜉蝣撼樹' },
  { n: '【兇司】兇司王', s: '兇絕斬', b: '兇界降臨' },
  { n: '【蟲母】螟蟲之母分身', s: '螟蟲海', b: '天道毀滅' },
  { n: '【下界真仙】謫仙馬良', s: '仙家法術', b: '萬靈血璽' },
  { n: '【飛升大劫】九九重雷劫', s: '五行神雷', b: '紫霄神雷劫' }
];

const MONSTER_DATA = {
    mobs: {
        0: [ {n: '野狼幫眾', s:'大砍刀劈砍', b:'淬毒飛刀'}, {n: '猛虎野獸', s:'猛撲', b:'狂暴撕咬'}, {n: '地痞流氓', s:'悶棍重擊', b:'撒石灰致盲'} ],
        1: [ {n: '散修劫匪', s:'火彈術', b:'低階符籙'}, {n: '低階靈獸', s:'撕咬', b:'靈力衝擊'}, {n: '家族惡霸', s:'初級法器', b:'聯合陣法'} ],
        2: [ {n: '築基期魔修', s:'血魔功', b:'魔器自爆'}, {n: '二級妖獸', s:'毒液噴射', b:'妖丹衝擊'}, {n: '邪派探子', s:'暗器偷襲', b:'煞氣侵蝕'} ],
        3: [ {n: '結丹期散修', s:'丹火', b:'本命法寶'}, {n: '五級妖獸', s:'妖風', b:'本命妖術'}, {n: '海王族戰士', s:'水刺', b:'海王印'} ],
        4: [ {n: '元嬰期老怪', s:'瞬移偷襲', b:'嬰火'}, {n: '八級化形妖修', s:'化形之威', b:'天賦神通'}, {n: '慕蘭法士', s:'靈術', b:'高階靈術'} ],
        5: [ {n: '化神期修士', s:'天地元氣', b:'法則皮毛'}, {n: '十級大妖', s:'妖力風暴', b:'真靈血脈'}, {n: '高階魔族', s:'真魔之氣', b:'魔化變身'} ],
        6: [ {n: '煉虛期異族', s:'空間撕裂', b:'法相攻擊'}, {n: '地淵妖物', s:'地煞之氣', b:'地淵領域'}, {n: '靈界叛修', s:'高階法寶', b:'自爆元神'} ],
        7: [ {n: '合體期尊者', s:'法則之力', b:'本體法相'}, {n: '高階魔尊', s:'魔界法則', b:'魔尊降臨'}, {n: '真靈後裔', s:'血脈壓制', b:'真靈顯影'} ],
        8: [ {n: '大乘期老祖', s:'領域壓制', b:'法則本源'}, {n: '跨界真靈', s:'吞噬天地', b:'真靈領域'}, {n: '魔界聖祖化身', s:'聖祖威壓', b:'滅世魔光'} ],
        9: [ {n: '【雷劫】四九小天劫', s:'青色劫雷', b:'五行劫光'}, {n: '【風劫】九天罡風', s:'蝕骨陰風', b:'九幽黑風'}, {n: '【火劫】紅蓮業火', s:'業火灼燒', b:'焚天紅蓮'} ]
    }
};

const TITLE_DATA = [
  { id: 't_kill_1', cat: 'kill', req: 50, tier: 1, name: '同階無敵', desc: '「死在閣下手下的同階修士，已不在少數。」', buffDesc: '總戰力加成 +10%', val: { atk: 0.10 } },
  { id: 't_kill_2', cat: 'kill', req: 200, tier: 2, name: '厲飛雨', desc: '「殺人放火厲飛雨，萬人敬仰韓天尊。道友，借個名號用用。」', buffDesc: '爆擊率 +10%，真靈吸血 +5%', val: { crit: 0.10, lifesteal: 0.05 } },
  { id: 't_kill_3', cat: 'kill', req: 1000, tier: 3, name: '修羅煞星', desc: '「百萬屍山血海中踏出的殺道。所過之處，即便是八級化形大妖也要退避三舍。」', buffDesc: '總戰力加成 +30%，爆擊傷害 +200%', val: { atk: 0.30, crit_dmg: 2.00 } },
  { id: 't_focus_1', cat: 'focus', req: 50, tier: 1, name: '向道之心', desc: '「資質平庸的偽靈根又如何？唯有堅如磐石的向道之心，方能走到最後。」', buffDesc: '靈氣獲取倍率 +15%', val: { qi: 0.15 } },
  { id: 't_focus_2', cat: 'focus', req: 200, tier: 2, name: '苦修之士', desc: '「閉關動輒數十載，世間繁華不過過眼雲煙。」', buffDesc: '靈氣獲取倍率 +30%，休息回血 +10%', val: { qi: 0.30, heal_bonus: 0.10 } },
  { id: 't_focus_3', cat: 'focus', req: 500, tier: 3, name: '歲月仙尊', desc: '「紅顏白骨，故人皆逝。你獨坐洞府，笑看滄海桑田，已與天地同壽。」', buffDesc: '靈氣獲取倍率 +80%，閃避免傷 +10%', val: { qi: 0.80, evade: 0.10 } },
  { id: 't_coin_1', cat: 'coin', req: 1000000, tier: 1, name: '身家豐厚', desc: '「在低階散修眼中，你已經是个不折不扣的大土豪了。」', buffDesc: '靈石掉落倍率 +15%', val: { stone: 0.15 } },
  { id: 't_coin_2', cat: 'coin', req: 10000000, tier: 2, name: '天南巨富', desc: '「靈石成山。這等身家，哪怕在天南修仙界也足以橫著走了。」', buffDesc: '靈石掉落倍率 +40%', val: { stone: 0.40 } },
  { id: 't_coin_3', cat: 'coin', req: 500000000, tier: 3, name: '財可通神', desc: '「連靈界大乘期老怪看到你的儲物袋，也會忍不住生出殺人奪寶的心思。」', buffDesc: '靈石倍率 +150%，氣運保底 +0.5', val: { stone: 1.50, luck_floor: 0.50 } },
  { id: 't_art_1', cat: 'artifact', req: 5, tier: 1, name: '身懷異寶', desc: '「財不露白，道友還是盡早將這些寶物收進儲物袋為妙。」', buffDesc: '氣運保底 +0.15', val: { luck_floor: 0.15 } },
  { id: 't_art_2', cat: 'artifact', req: 15, tier: 2, name: '一身是寶', desc: '「『不可能！你區區一介散修，身家怎會比老夫還要豐厚！』」', buffDesc: '連擊上限 +50%，氣運保底 +0.3', val: { streak_cap: 0.50, luck_floor: 0.30 } },
  { id: 't_art_3', cat: 'artifact', req: 25, tier: 3, name: '多寶天尊', desc: '「玄天之寶、造化至寶盡入你手，此界天道法則已被你徹底顛覆。」', buffDesc: '連擊上限 +150%，氣運保底 +0.8', val: { streak_cap: 1.50, luck_floor: 0.80 } },
  { id: 't_sec_1', cat: 'secret', req: 4, tier: 1, name: '博覽群書', desc: '「藏經閣內的玉簡被你翻了個遍，對各派功法皆有涉獵。」', buffDesc: '反噬基礎減傷 +10%', val: { sense_def: 0.10 } },
  { id: 't_sec_2', cat: 'secret', req: 9, tier: 2, name: '法體雙修', desc: '「功法龐雜卻互不衝突，靈力與肉身皆臻至化境，實力遠超同階修士。」', buffDesc: '氣血上限加成 +20%，神識減傷 +15%', val: { hp: 0.20, sense_def: 0.15 } },
  { id: 't_sec_3', cat: 'secret', req: 13, tier: 3, name: '萬法歸一', desc: '「天下萬般神仙妙法，在你眼中皆如掌上觀紋，直指大道本源。」', buffDesc: '氣血上限 +50%，反噬與神識減傷皆 +30%', val: { hp: 0.50, sense_def: 0.30, def: 0.30 } },
  { id: 't_max_1', cat: 'max', req: 1, tier: 1, name: '爐火純青', desc: '「將一門功法推演至極致，便足以在修仙界立足。」', buffDesc: '連擊效率倍率 +15%', val: { streak_eff: 0.15 } },
  { id: 't_max_2', cat: 'max', req: 4, tier: 2, name: '大衍傳人', desc: '「將數門頂級功法推演至極限，即便是大衍神君在世，也要讚你一聲奇才。」', buffDesc: '連擊效率倍率 +40%，總戰力 +20%', val: { streak_eff: 0.40, atk: 0.20 } },
  { id: 't_max_3', cat: 'max', req: 10, tier: 3, name: '開宗立派', desc: '「你對大道的理解已超越創造這些功法的前人，隨手一指便可為一界之尊。」', buffDesc: '連擊效率 +100%，戰力/氣血/靈石/靈氣全域 +30%', val: { streak_eff: 1.00, atk: 0.30, hp: 0.30, stone: 0.30, qi: 0.30 } }
];

const getDailyResetTime = () => {
    const d = new Date();
    const r = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 8, 0, 0, 0); 
    if (d.getTime() < r.getTime()) r.setDate(r.getDate() - 1);
    return r.getTime();
};

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
    lifetimeStats: { kills: 0, focusCount: 0, totalCoins: 0 },
    unlockedTitles: [], equippedTitle: null, freeGacha: 0, epiphanyPills: 0, lastPillTime: 0,
    activeCompanion: null, companionKills: {}, karma: 0, unlockedKarma: [], lastDailyGacha: 0,
    logs: ['[系統] 識海清明，天道印記已穩固。祝道友仙運隆昌。'],
    _t: "Index3BaoFan"
  };

  const [player, setPlayer] = useState(() => {
    try {
      const saved = localStorage.getItem('xianxia_master_v69');
      if (saved && saved !== 'undefined' && saved !== 'null') {
          return { ...defaultPlayerState, ...JSON.parse(saved) };
      }
      return defaultPlayerState;
    } catch (e) { return defaultPlayerState; }
  });

  const bellAudioRef = useRef(null);
  const breakAudioRef = useRef(null);

  useEffect(() => {
    bellAudioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/meditation_bell.ogg');
    breakAudioRef.current = new Audio('https://actions.google.com/sounds/v1/water/droplet_reverb.ogg');
  }, []);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('xianxia_master_v69', JSON.stringify(player));
    setSaveIndicator(true);
    const timer = setTimeout(() => setSaveIndicator(false), 2000);
    return () => clearTimeout(timer);
  }, [player]);

  const availableSP = useMemo(() => {
    let totalEarned = 0;
    for (let i = 1; i <= player.realmIndex; i++) {
      if (REALMS[i]?.isMajor) { totalEarned += 5; } else { totalEarned += 3; }
    }
    const basicSpent = Object.values(player.basicSkills || {}).reduce((a, b) => a + b, 0);
    const secretSpent = Object.values(player.secretBooks || {}).reduce((a, b) => a + b, 0);
    return Math.max(0, totalEarned - (basicSpent + secretSpent));
  }, [player.realmIndex, player.basicSkills, player.secretBooks]);

  const [saveIndicator, setSaveIndicator] = useState(false);
  const [globalStats, setGlobalStats] = useState({ focus: 0, ascensions: 0 });

  useEffect(() => {
    try {
      const statsRef = ref(database, 'globalStats');
      const unsubscribe = onValue(statsRef, (snapshot) => {
        const data = snapshot.val();
        if (data !== null) setGlobalStats({ focus: data.totalFocusCount || 0, ascensions: data.totalAscensions || 0 });
      });
      return () => unsubscribe();
    } catch(e) {}
  }, []);

  useEffect(() => {
    let newlyUnlocked = [];
    let newFreeGacha = player.freeGacha || 0;
    TITLE_DATA.forEach(t => {
       if (!(player.unlockedTitles || []).includes(t.id)) {
          let conditionMet = false;
          if (t.cat === 'kill' && (player.lifetimeStats?.kills || 0) >= t.req) conditionMet = true;
          if (t.cat === 'focus' && (player.lifetimeStats?.focusCount || 0) >= t.req) conditionMet = true;
          if (t.cat === 'coin' && (player.lifetimeStats?.totalCoins || 0) >= t.req) conditionMet = true;
          if (t.cat === 'artifact' && (player.artifacts?.length || 0) >= t.req) conditionMet = true;
          if (t.cat === 'secret' && Object.keys(player.secretBooks || {}).filter(k => player.secretBooks[k] > 0).length >= t.req) conditionMet = true;
          if (t.cat === 'max') {
             let maxCount = 0;
             BASIC_SKILLS.forEach(s => { if ((player.basicSkills?.[s.id] || 0) >= s.maxLvl) maxCount++; });
             SECRET_BOOKS.forEach(s => { if ((player.secretBooks?.[s.id] || 0) >= 5) maxCount++; });
             if (maxCount >= t.req) conditionMet = true;
          }
          if (conditionMet) { newlyUnlocked.push(t.id); newFreeGacha += 1; }
       }
    });
    if (newlyUnlocked.length > 0) {
       setPlayer(p => {
          const updatedUnlocked = [...(p.unlockedTitles || []), ...newlyUnlocked];
          const updatedLogs = [...(p.logs || [])];
          newlyUnlocked.forEach(id => {
             const titleName = TITLE_DATA.find(x => x.id === id).name;
             const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
             updatedLogs.unshift(`[${timeStr}] 🏆 【成就】解鎖名號「${titleName}」！贈送保底尋寶 1 次！`);
          });
          return { ...p, unlockedTitles: updatedUnlocked, freeGacha: newFreeGacha, logs: updatedLogs.slice(0, 100) };
       });
    }
  }, [player.lifetimeStats, player.artifacts, player.basicSkills, player.secretBooks]);

  const generateMonsterState = (realmIdx, currentQi, qiToNext, hasAscended) => {
    if (hasAscended) {
        return { name: "【仙界巡禮・指點後輩】", hp: 999999, maxHp: 999999, tier: 99, atk: 0, sAtkName: "和風細雨", bAtkName: "仙氣灌頂", isBoss: false };
    }
    const isReadyToBreakthrough = currentQi >= qiToNext;
    const isMortal = realmIdx === 0;
    const isFinal = realmIdx === REALMS.length - 1;
    const isMajorBreakthrough = isMortal || isFinal || (realmIdx % 4 === 0 && realmIdx > 0);
    const majorRealmIdx = isMortal ? 0 : (isFinal ? 9 : Math.floor((realmIdx - 1) / 4) + 1);
    let mData, isBoss = false, bossMult = 1, atkMult = 1;
    if (isReadyToBreakthrough) {
        isBoss = true; mData = BOSS_DATA[realmIdx];
        bossMult = isFinal ? 30 : (isMajorBreakthrough ? 5 : 2); 
        atkMult = isFinal ? 8.0 : (isMajorBreakthrough ? 2.0 : 1.2);
        if (isMortal) { bossMult = 1.5; atkMult = 0.8; }
    } else {
        const mobList = MONSTER_DATA.mobs[majorRealmIdx];
        mData = mobList[Math.floor(Math.random() * mobList.length)];
    }
    const baseAtk = 20; 
    const nHp = Math.floor(120 * Math.pow(1.25, realmIdx) * bossMult);
    const mAtk = Math.floor(baseAtk * Math.pow(1.2, realmIdx) * atkMult);
    return { name: mData.n + (isBoss && !isMortal && !isFinal ? (isMajorBreakthrough ? ' [大瓶頸]' : ' [心魔死劫]') : ''), hp: nHp, maxHp: nHp, tier: realmIdx + 1, atk: mAtk, sAtkName: mData.s, bAtkName: mData.b, isBoss };
  };

  const [monster, setMonster] = useState(() => {
    try {
      const savedMonster = localStorage.getItem('xianxia_monster');
      if (savedMonster && savedMonster !== 'undefined' && savedMonster !== 'null') {
          return JSON.parse(savedMonster);
      }
    } catch (e) {}
    return generateMonsterState(player.realmIndex, player.qi, player.qiToNext, player.hasAscended);
  });

  useEffect(() => { localStorage.setItem('xianxia_monster', JSON.stringify(monster)); }, [monster]);

  const [focusDuration, setFocusDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [targetEndTime, setTargetEndTime] = useState(null); 
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('focus'); 
  const [activeTab, setActiveTab] = useState('log'); 
  const [showRealmGuide, setShowRealmGuide] = useState(false);
  const [showStatsReport, setShowStatsReport] = useState(false);
  const [showGuide, setShowGuide] = useState(false); 
  const [showTitles, setShowTitles] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false); 
  const [showKarmaModal, setShowKarmaModal] = useState(false); 
  const [importString, setImportString] = useState(''); 
  const [guideTab, setGuideTab] = useState('rules'); 
  const [toast, setToast] = useState(null); 
  const [celebration, setCelebration] = useState(null); 
  const [showGiveUpWarning, setShowGiveUpWarning] = useState(false);

  const [isAttacking, setIsAttacking] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [isCritStrike, setIsCritStrike] = useState(false); 
  const [isKilling, setIsKilling] = useState(false); 
  const [isHealing, setIsHealing] = useState(false); 

  const sortedCompanions = useMemo(() => [...COMPANIONS].sort((a, b) => (player.realmIndex >= b.unlockIdx ? 1 : 0) - (player.realmIndex >= a.unlockIdx ? 1 : 0)), [player.realmIndex]);
  const sortedArtifacts = useMemo(() => [...ARTIFACT_POOL].sort((a, b) => ((player.artifacts || []).includes(b.id) ? 1 : 0) - ((player.artifacts || []).includes(a.id) ? 1 : 0)), [player.artifacts]);
  const sortedSecretBooks = useMemo(() => [...SECRET_BOOKS].sort((a, b) => ((player.secretBooks?.[b.id] || 0) > 0 ? 1 : 0) - ((player.secretBooks?.[a.id] || 0) > 0 ? 1 : 0)), [player.secretBooks]);

  const getMultiplier = (type) => {
    let baseMult = 1.0;
    BASIC_SKILLS.forEach(s => { if (player.basicSkills?.[s.id] > 0 && s.val?.[type]) baseMult += s.val[type] * player.basicSkills[s.id]; });
    Object.entries(player.secretBooks || {}).forEach(([id, lvl]) => { const book = SECRET_BOOKS.find(x => x.id === id); if (book?.val?.[type]) baseMult += book.val[type] * lvl; });
    (player.artifacts || []).forEach(id => { const item = ARTIFACT_POOL.find(a => a.id === id); const lvl = player.artifactLvls?.[id] || 0; if (item?.val?.[type]) baseMult += item.val[type] * (1 + lvl * 0.5); });
    if (player.equippedTitle) { const t = TITLE_DATA.find(x => x.id === player.equippedTitle); if (t?.val?.[type]) baseMult += t.val[type]; }
    if (type === 'atk' || type === 'streak_cap') { const swordCount = (player.artifacts || []).filter(id => ARTIFACT_POOL.find(a => a.id === id)?.tags?.includes('sword')).length; if (swordCount >= 2) baseMult += 0.2 * swordCount; }
    if (type === 'qi' && player.arrays?.qi) baseMult += player.arrays.qi * 0.05;
    if (type === 'def' && player.arrays?.def) baseMult += player.arrays.def * 0.05;
    if (player.activeCompanion) {
        const k = player.companionKills?.[player.activeCompanion] || 0;
        const comp = COMPANIONS.find(c => c.id === player.activeCompanion);
        const tIdx = getCompanionTier(k);
        if (comp && comp.buffType === type && tIdx >= 0) baseMult += (comp.buffType === 'luck_floor' ? comp.tiers[tIdx] : comp.tiers[tIdx] / 100);
    }
    
    // 【核心修正：靈根天賦獨立乘區】
    let karmaMult = 1.0;
    (player.unlockedKarma || []).forEach(kId => { const talent = KARMA_TALENTS.find(t => t.id === kId); if (talent && talent.val?.[type]) karmaMult += talent.val[type]; });
    return baseMult * karmaMult;
  };

  const currentRealmData = REALMS[player.realmIndex];
  const activeColorClass = REALM_COLORS[currentRealmData.color] || REALM_COLORS.slate;
  const rawEvade = getMultiplier('evade') - 1, evadeRate = Math.min(0.75, rawEvade), overflowEvade = Math.max(0, rawEvade - 0.75);
  const rawCrit = getMultiplier('crit') - 1, critRate = Math.min(0.95, rawCrit), overflowCrit = Math.max(0, rawCrit - 0.95);
  const streakCap = Math.min(8.0, 0.5 + (getMultiplier('streak_cap') - 1) + (overflowEvade * 0.5)); 
  const streakEff = getMultiplier('streak_eff'), comboMultiplier = 1 + Math.min(streakCap, (player.streakCount || 0) * 0.05 * streakEff);
  const critDmg = Math.min(20.0, 1.5 + (getMultiplier('crit_dmg') - 1) + (overflowCrit * 3.0));
  const reviveRate = Math.min(0.65, getMultiplier('revive') - 1), healPct = Math.min(0.80, 0.35 + (getMultiplier('heal_bonus') - 1));
  const defMultiplier = getMultiplier('def'), dmgTakenPct = (1 / defMultiplier) * 100; 
  const currentCombatPower = Math.floor(player.baseCombat * getMultiplier('atk') * comboMultiplier);
  const maxVitality = Math.floor(player.baseMaxVitality * getMultiplier('hp'));
  const forgeDiscount = Math.max(0.1, 1 - (getMultiplier('forge_discount') - 1)); 

  const upgCostAtk = Math.floor(1000 * Math.pow(1.15, (player.baseCombat - 150)/100) * forgeDiscount);
  const upgCostHp = Math.floor(1000 * Math.pow(1.15, (player.baseMaxVitality - 100)/100) * forgeDiscount);
  const healCost = Math.floor((maxVitality * 1.0 + player.realmIndex * 100) * forgeDiscount);
  const arrayQiCost = Math.floor(5000 * Math.pow(1.35, (player.arrays?.qi || 0)) * forgeDiscount);
  const arrayDefCost = Math.floor(4000 * Math.pow(1.35, (player.arrays?.def || 0)) * forgeDiscount);
  const gachaCost = Math.floor(5000 * Math.pow(1.15, player.realmIndex) * forgeDiscount);

  const pillCooldownRemaining = player.lastPillTime ? Math.max(0, 3600 - Math.floor((now - player.lastPillTime) / 1000)) : 0;
  const canUsePill = (player.epiphanyPills || 0) > 0 && pillCooldownRemaining === 0;

  const dailyResetTime = getDailyResetTime();
  const canDailyGacha = (player.lastDailyGacha || 0) < dailyResetTime;
  const totalFreeGacha = (canDailyGacha ? 1 : 0) + (player.freeGacha || 0);

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const addLog = (textOrArray) => {
    const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    setPlayer(p => {
        const newEntries = Array.isArray(textOrArray) ? textOrArray.map(t => `[${timeStr}] ${t}`) : [`[${timeStr}] ${textOrArray}`];
        return { ...p, logs: [...newEntries, ...(p.logs || [])].slice(0, 100) };
    });
  };

  const executeReincarnation = (karmaToTake) => {
      const meta = { karma: karmaToTake, unlockedKarma: player.unlockedKarma || [], unlockedTitles: player.unlockedTitles || [], equippedTitle: player.equippedTitle, lifetimeStats: player.lifetimeStats, companionKills: player.companionKills, totalFocusTime: player.totalFocusTime, freeGacha: player.freeGacha, lastDailyGacha: player.lastDailyGacha };
      setPlayer({ ...defaultPlayerState, ...meta, logs: [`[${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}] 🔄 【輪迴】重踏仙途。`] });
      setMonster(generateMonsterState(0, 0, 250, false));
  };

  const handleReincarnation = () => {
    const isNascentSoul = player.realmIndex >= 13; 
    let earnedKarma = isNascentSoul ? Math.max(0, player.realmIndex - 12) + (player.hasAscended ? 10 : 0) : 0;
    if (isNascentSoul) {
        if (window.confirm(`【兵解輪迴】\n您已修至元嬰之上，可將修為轉化為 ${earnedKarma} 點 Karma 帶走！\n\n[確定]：化為因果，解鎖天賦。\n[取消]：放棄因果，純粹重生。`)) {
            executeReincarnation((player.karma || 0) + earnedKarma); setShowKarmaModal(true);
        } else if (window.confirm(`【放棄因果】\n確定不帶走 Karma 直接重生？(將清空進度)`)) {
            executeReincarnation(player.karma || 0);
        }
    } else if (window.confirm(`【天道無情】\n元嬰未成無法帶走因果，確定要放棄此生重新投胎？`)) {
        executeReincarnation(player.karma || 0);
    }
  };

  const handleComplete = (usedPill = false) => {
    const isUsingPill = usedPill === true; setIsActive(false); setTargetEndTime(null);
    if (mode === 'focus') {
      if (bellAudioRef.current) { const p = bellAudioRef.current.play(); if (p !== undefined) p.catch(e => {}); }
      setIsAttacking(true); setTimeout(() => setIsAttacking(false), 500);
      try { update(ref(database, 'globalStats'), { totalFocusCount: increment(1) }).catch(e=>{}); } catch (e) {}
      
      let nextPills = player.epiphanyPills || 0, nextLifetime = { ...player.lifetimeStats };
      let nextTotalFocusTime = (player.totalFocusTime || 0) + (isUsingPill ? 0 : focusDuration);
      if (isUsingPill) { nextPills -= 1; } else { nextLifetime.focusCount += 1; }

      const isCrit = Math.random() < critRate, damageBase = Math.floor(currentCombatPower * (focusDuration / 1500));
      const actualDamage = isCrit ? Math.floor(damageBase * critDmg) : damageBase;
      if (isCrit) { setIsCritStrike(true); setTimeout(() => setIsCritStrike(false), 600); }

      const newHp = Math.max(0, monster.hp - actualDamage), timeRatio = focusDuration / 1500, curLuck = getMultiplier('luck_floor');
      const passiveQi = Math.floor(50 * Math.pow(1.18, player.realmIndex + 1) * getMultiplier('qi') * timeRatio);
      const passiveCoin = Math.floor(50 * Math.pow(1.15, player.realmIndex + 1) * getMultiplier('stone') * curLuck * timeRatio);

      let nextQi = (player.qi || 0) + passiveQi, nextCoins = (player.coins || 0) + passiveCoin, nextVitality = player.vitality || maxVitality;
      let nextRealm = player.realmIndex, nextQiToNext = player.qiToNext, nextHasAscended = player.hasAscended;
      let nextStreak = (player.streakCount || 0) + 1, nextShields = maxStreakShields;
      let isDeadFromCounter = false, isKilled = false, killedBoss = false, currentDrops = [], actionLogs = [];

      if (!isUsingPill) nextLifetime.totalCoins += passiveCoin;
      let dmgMsg = isCrit ? `🔥 【爆擊】造成 ${formatNumber(actualDamage)} 傷害。` : `⚔️ 【運功】造成 ${formatNumber(actualDamage)} 傷害。`;

      if (newHp === 0) {
        isKilled = true; killedBoss = monster.isBoss; setIsKilling(true); setTimeout(() => setIsKilling(false), 800); 
        const kQi = Math.floor(300 * Math.pow(1.18, monster.tier) * getMultiplier('qi')), kCoin = Math.floor(800 * Math.pow(1.15, monster.tier) * getMultiplier('stone') * curLuck);
        nextQi += kQi; nextCoins += kCoin; if (!isUsingPill) { nextLifetime.kills += 1; nextLifetime.totalCoins += kCoin; }
        
        if (monster.isBoss && !nextHasAscended) {
            if (monster.name.includes('九九重雷劫')) {
                try { update(ref(database, 'globalStats'), { totalAscensions: increment(1) }).catch(e=>{}); } catch(e) {}
                nextHasAscended = true; actionLogs.push(`${dmgMsg} 🌌 【破空飛升】位列仙班！`);
                setCelebration({ name: '飛升仙界！成就無上真仙！', desc: FEEDBACK_TEXTS.boss[0] });
            } else {
                nextRealm++; nextQi = Math.max(0, nextQi - nextQiToNext); nextQiToNext = Math.floor(nextQiToNext * 1.35);
                nextVitality = maxVitality; // 洗髓滿血
                actionLogs.push(`${dmgMsg} ☄️ 【突破死劫】晉升至${REALMS[nextRealm].name}！肉身重塑，氣血全滿！`);
                setCelebration({ name: REALMS[nextRealm].name, desc: FEEDBACK_TEXTS.boss[Math.floor(Math.random() * FEEDBACK_TEXTS.boss.length)] });
            }
        } else { actionLogs.push(`${dmgMsg} 🩸 【斬殺】成功擊敗${monster.name}！`); }
        actionLogs.push(`💰 【戰利品】奪得修為 ${formatNumber(passiveQi + kQi)}，靈石 ${formatNumber(passiveCoin + kCoin)}。`);
        if (Math.random() < 0.10) { nextPills += 1; currentDrops.push('💊 頓悟丹'); actionLogs.push(`🎁 【機緣】獲得【頓悟丹】x1！`); }
      } else {
        if (monster.isBoss && nextHasAscended) { actionLogs.push(`${dmgMsg} 🌟 仙氣縹緲，平和指點後輩，不染塵埃。`); } 
        else {
            actionLogs.push(`${dmgMsg} 妖獸剩餘 ${formatNumber(newHp)} 氣血。`);
            const isBigAtk = Math.random() < 0.20, atkName = isBigAtk ? monster.bAtkName : monster.sAtkName;
            if (Math.random() < evadeRate) actionLogs.push(`💨 【反撲】閃避了【${atkName}】！`);
            else {
                setIsCollapsing(true); setTimeout(() => setIsCollapsing(false), 1000);
                const actualDmg = Math.max(1, Math.floor(Math.floor(monster.atk * (isBigAtk ? 2.5 : 1.0)) * (dmgTakenPct / 100)));
                nextVitality -= actualDmg;
                if (nextVitality <= 0) {
                    if (nextShields > 0) { nextShields -= 1; nextVitality = Math.floor(maxVitality * 0.1); actionLogs.push(`🛡️ 【反護】法寶鎖血 10%！`); }
                    else if (Math.random() < reviveRate) { nextVitality = maxVitality; actionLogs.push(`✨ 【反護】涅槃重生！`); }
                    else { nextVitality = Math.floor(maxVitality * 0.5); nextQi = Math.floor(nextQi * 0.8); nextStreak = 0; isDeadFromCounter = true; actionLogs.push(`💀 【反撲】不幸身死，修為損失 20%！`); }
                } else actionLogs.push(`💥 【反撲】承受了 ${formatNumber(actualDmg)} 傷害。`);
            }
        }
        actionLogs.push(`💨 【吐納】獲修為 ${formatNumber(passiveQi)}，靈石 ${formatNumber(passiveCoin)}。`);
      }
      if (!killedBoss) { const t = isKilled ? 'kill' : 'focus'; setToast({ type: t, text: FEEDBACK_TEXTS[t][Math.floor(Math.random() * FEEDBACK_TEXTS[t].length)], drops: currentDrops }); setTimeout(() => setToast(null), 5000); }
      const nextMonster = (newHp === 0 || (isDeadFromCounter && monster.isBoss && !nextHasAscended)) ? generateMonsterState(nextRealm, nextQi, nextQiToNext, nextHasAscended) : { ...monster, hp: newHp };
      setMonster(nextMonster);
      setPlayer(p => ({ ...p, realmIndex: nextRealm, qi: nextQi, qiToNext: nextQiToNext, coins: nextCoins, vitality: nextVitality, baseCombat: nextBaseCombat, baseMaxVitality: nextBaseMaxVitality, streakCount: nextStreak, streakShields: nextShields, totalFocusTime: nextTotalFocusTime, epiphanyPills: nextPills, hasAscended: nextHasAscended, logs: [...actionLogs.reverse().map(m => `[${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}] ${m}`), ...(p.logs || [])].slice(0, 100) }));
      setMode('break'); setTimeLeft(5 * 60);
    } else { 
      if (breakAudioRef.current) { const p = breakAudioRef.current.play(); if (p !== undefined) p.catch(e => {}); }
      setMode('focus'); setTimeLeft(focusDuration); 
      const randomText = FEEDBACK_TEXTS['break'][Math.floor(Math.random() * FEEDBACK_TEXTS['break'].length)];
      setToast({ type: 'break', text: randomText }); setTimeout(() => setToast(null), 5000);
      setPlayer(p => ({ ...p, vitality: Math.min(maxVitality, p.vitality + Math.floor(maxVitality * healPct)), streakShields: maxStreakShields }));
    }
  };

  const handleGacha = () => {
    let isDaily = canDailyGacha, isTitle = !isDaily && player.freeGacha > 0, isFree = isDaily || isTitle;
    if (!isFree && player.coins < gachaCost) return;
    const curLuck = getMultiplier('luck_floor'), sorted = Object.entries(RARITY).sort((a,b) => a[1].weight - b[1].weight);
    let targetRarity = 'COMMON', accum = 0, roll = Math.random();
    for (let [r, data] of sorted) { accum += data.weight * curLuck; if (roll < accum) { targetRarity = r; break; } }
    if (isTitle && ['COMMON', 'UNCOMMON'].includes(targetRarity)) targetRarity = 'RARE';
    let combined = getUnownedPool(targetRarity, player.artifacts || [], player.secretBooks || {});
    let searchRarity = targetRarity;
    if (combined.length === 0) { for (let i = RARITIES_ORDER.indexOf(targetRarity)-1; i>=0; i--) { combined = getUnownedPool(RARITIES_ORDER[i], player.artifacts||[], player.secretBooks||{}); if (combined.length>0) { searchRarity = RARITIES_ORDER[i]; break; } } }
    if (combined.length === 0 && isTitle) { for (let i = RARITIES_ORDER.indexOf(targetRarity)+1; i<RARITIES_ORDER.length; i++) { combined = getUnownedPool(RARITIES_ORDER[i], player.artifacts||[], player.secretBooks||{}); if (combined.length>0) { searchRarity = RARITIES_ORDER[i]; break; } } }

    if (combined.length > 0) {
      const drop = combined[Math.floor(Math.random()*combined.length)];
      setPlayer(p => ({ ...p, coins: isFree ? p.coins : p.coins - gachaCost, freeGacha: isTitle ? p.freeGacha-1 : p.freeGacha, lastDailyGacha: isDaily ? Date.now() : p.lastDailyGacha, artifacts: drop.poolType === 'art' ? [...p.artifacts, drop.id] : p.artifacts, secretBooks: drop.poolType === 'book' ? {...p.secretBooks, [drop.id]: 1} : p.secretBooks }));
      setCelebration({ name: drop.name, desc: '萬寶樓霞光萬丈，喜獲異寶！' });
    } else {
      const comp = Math.floor(0.1 * gachaCost / RARITY[targetRarity].weight);
      setPlayer(p => ({ ...p, coins: (isFree?p.coins:p.coins-gachaCost)+comp, freeGacha: isTitle?p.freeGacha-1:p.freeGacha, lastDailyGacha: isDaily?Date.now():p.lastDailyGacha }));
    }
  };

  const toggleTimer = () => { 
      if (!isActive) { 
          if (bellAudioRef.current) { bellAudioRef.current.volume = 0; const p = bellAudioRef.current.play(); if (p !== undefined) p.then(() => { bellAudioRef.current.pause(); bellAudioRef.current.currentTime = 0; bellAudioRef.current.volume = 1; }).catch(()=>{}); }
          if (breakAudioRef.current) { breakAudioRef.current.volume = 0; const p = breakAudioRef.current.play(); if (p !== undefined) p.then(() => { breakAudioRef.current.pause(); breakAudioRef.current.currentTime = 0; breakAudioRef.current.volume = 1; }).catch(()=>{}); }
          setIsActive(true); setTargetEndTime(Date.now() + (timeLeft * 1000)); 
      } 
  };

  return (
    <div className={`min-h-screen text-slate-300 font-mono p-4 flex flex-col items-center overflow-x-hidden relative transition-colors duration-500 ${isActive ? 'justify-center py-4 bg-[#020617]' : 'pt-10'} ${isCollapsing ? 'bg-red-950/80 animate-shake' : isKilling ? 'bg-emerald-950/60' : isCritStrike ? 'bg-rose-900/40' : ''}`} style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }} data-v="eGlhbnhpYV9pbmRleDNiYW9mYW4=">
      <style>{` .animate-fade-in-down { animation: fadeInDown 0.5s ease-out forwards; } .animate-soft-fade-in { animation: softFadeIn 0.8s ease-out forwards; } @keyframes softFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @keyframes fadeInDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } } .animate-shake { animation: shake 0.4s both; } @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } } .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px;} .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; } .no-scrollbar::-webkit-scrollbar { display: none; } `}</style>

      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[700] flex flex-col items-center p-4 sm:p-6 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border backdrop-blur-xl animate-fade-in-down transition-all max-w-[90%] w-full cursor-pointer ${toast.type === 'kill' ? 'bg-amber-950/80 border-amber-500/50 text-amber-200' : toast.type === 'focus' ? 'bg-rose-950/80 border-rose-500/50 text-rose-200' : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200'}`} onClick={() => setToast(null)}>
            <div className="flex items-center gap-3 font-black text-sm mb-2 text-center"> {toast.type === 'kill' ? <Sword size={20} className="text-amber-400 animate-bounce"/> : toast.type === 'focus' ? <Flame size={20} className="text-rose-400 animate-pulse"/> : <Wind size={20} className="text-cyan-400 animate-pulse"/>} {toast.text} </div>
            {toast.drops?.length > 0 && <div className="flex flex-col items-center mt-3 pt-3 border-t border-white/20 w-full gap-2"> {toast.drops.map((d, i) => ( <div key={i} className="text-sm font-black text-yellow-400 animate-pulse">{d}</div> ))} </div>}
        </div>
      )}

      {!isActive && (
        <div className={`fixed top-0 left-0 w-full bg-emerald-950/90 text-[10px] py-2 text-center font-black tracking-widest z-[600] border-b border-emerald-500/30 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 shadow-[0_0:15px_rgba(16,185,129,0.3)] transition-all duration-500`}>
          <div className="flex items-center gap-1.5 text-emerald-400"> <Network size={14}/> <span>世界運轉:</span> <span className="text-white font-mono text-sm">{formatNumber(globalStats.focus)}</span> </div>
          <div className="flex items-center gap-1.5 text-yellow-400"> <Crown size={14}/> <span>飛升仙人:</span> <span className="text-white font-mono text-sm">{formatNumber(globalStats.ascensions)}</span> </div>
        </div>
      )}

      {showGiveUpWarning && (
        <div className="fixed inset-0 z-[800] bg-black/95 backdrop-blur-2xl p-6 flex flex-col items-center justify-center font-bold">
          <div className="w-full max-w-lg bg-rose-950/80 p-8 rounded-2xl border border-rose-500/50 shadow-[0_0_80px_rgba(244,63,94,0.3)] flex flex-col items-center text-center">
            <AlertTriangle size={64} className="text-rose-500 mb-6 animate-pulse"/>
            <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-4">天道警示</h2>
            <p className="text-rose-200 text-sm mb-8">死劫當前，強行收功將遭受極重反噬。確認放棄？</p>
            <div className="flex gap-4 w-full"> <button onClick={() => setShowGiveUpWarning(false)} className="flex-1 py-4 bg-white/10 text-white rounded-xl text-sm font-black border border-white/20">繼續運功</button> <button onClick={executeGiveUp} className="flex-1 py-4 bg-rose-600 text-white rounded-xl text-sm font-black shadow-lg">強行收功</button> </div>
          </div>
        </div>
      )}

      {showKarmaModal && (
        <div className="fixed inset-0 z-[700] bg-black/95 backdrop-blur-2xl p-4 flex flex-col items-center justify-center font-bold mt-8">
          <div className="w-full max-w-4xl bg-slate-900/90 p-6 md:p-8 rounded-2xl border border-purple-500/30 flex flex-col max-h-[85vh] shadow-[0_0_50px_rgba(168,85,247,0.2)] relative">
            <button onClick={() => setShowKarmaModal(false)} className="absolute top-4 right-4 p-2 text-white/50"><X size={24}/></button>
            <div className="flex flex-col items-center mb-8 border-b border-white/10 pb-6">
                <Activity size={32} className="text-purple-400 mb-3 animate-pulse"/>
                <h2 className="text-xl font-black text-purple-400 tracking-widest uppercase">輪迴靈根</h2>
                <div className="mt-4 bg-purple-950/50 border border-purple-500/50 px-6 py-2 rounded-full text-purple-200 font-mono text-lg font-black shadow-inner"> Karma: {player.karma || 0} </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {KARMA_TALENTS.map(t => {
                        const count = (player.unlockedKarma || []).filter(id => id === t.id).length, isMax = count >= t.maxLvl, canAfford = (player.karma || 0) >= t.cost;
                        return ( <div key={t.id} className={`p-5 rounded-xl border flex flex-col justify-between ${count > 0 ? 'bg-purple-950/20 border-purple-500/40' : 'bg-black/50 border-white/10'}`}> <div> <div className="flex justify-between items-start mb-2"> <h4 className={`font-black text-base ${count > 0 ? 'text-purple-300' : 'text-white'}`}>{t.name}</h4> <span className="text-white/50 font-mono text-xs">Lv.{count}/{t.maxLvl}</span> </div> <p className="text-xs text-white/60 leading-relaxed mb-4">{t.desc}</p> </div> <button onClick={() => unlockKarmaTalent(t.id, t.cost)} disabled={isMax || !canAfford} className="w-full py-3 rounded-lg text-xs font-black border border-white/20 disabled:opacity-30 bg-white/10 hover:bg-purple-600 transition-colors"> {isMax ? '已臻化境' : `領悟 (${t.cost} Karma)`} </button> </div> );
                    })}
                </div>
            </div>
          </div>
        </div>
      )}

      {celebration && (
        <div className="fixed inset-0 z-[800] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-12 cursor-pointer text-center animate-soft-fade-in" onClick={() => setCelebration(null)}>
          <Crown size={80} className="text-yellow-500/80 mb-6 animate-bounce drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
          <h2 className="text-3xl font-black text-white mb-2 tracking-widest">{celebration.name.includes('無上真仙') ? '渡劫成功・羽化登仙' : '突破死劫'}</h2>
          <p className="text-xl text-emerald-400 tracking-widest mb-6">【{celebration.name}】</p>
          {celebration.desc && <p className="text-base text-rose-200 italic leading-loose tracking-widest max-w-lg mx-auto">「{celebration.desc}」</p>}
          {celebration.name.includes('無上真仙') && <div className="mt-8 border-t border-white/20 pt-8 max-w-lg"> <p className="text-sm text-yellow-200"> 💡 【天道提示】：您可以兵解輪迴，將修為化為 Karma 點數解鎖靈根天賦！ </p> </div>}
          <p className="text-white/30 text-xs mt-12 animate-pulse">點擊畫面繼續</p>
        </div>
      )}

      {!isActive && (
        <div className="w-full max-w-4xl mb-6 z-10 font-bold px-2 animate-soft-fade-in">
          <div className="flex flex-col items-center mb-8 h-10 justify-center"> <h1 className="text-lg md:text-xl tracking-[1.2em] text-white/30 uppercase font-black"> {mode === 'focus' ? '凡人修仙專注' : '靈氣反哺 (調息中)'} </h1> <div className="h-px w-48 bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4 opacity-50"></div> </div>
          <div className={`bg-slate-900/50 backdrop-blur-3xl p-5 md:p-8 rounded-xl border ${mode === 'break' ? 'border-cyan-500/30' : activeColorClass.border} shadow-2xl`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6 mb-6">
              <div className="flex items-center gap-4 w-full md:flex-1">
                 <Shield size={36} className={`${mode === 'break' ? 'text-cyan-400' : activeColorClass.text}`}/>
                 <div className="flex flex-col justify-center min-w-0">
                    <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase text-white flex items-center flex-wrap"> {player.equippedTitle && <span className="text-amber-400 mr-2 border border-amber-500/50 bg-amber-950/50 px-2 py-0.5 rounded text-[10px] tracking-widest">[{TITLE_DATA.find(t=>t.id===player.equippedTitle)?.name}]</span>} {currentRealmData.name} {player.activeCompanion && <span className="ml-3 text-pink-400 border border-pink-500/50 bg-pink-950/50 px-2 py-0.5 rounded text-[10px] flex items-center gap-1"> <Heart size={12} className="fill-current animate-pulse"/> {COMPANIONS.find(c=>c.id===player.activeCompanion)?.name} </span>} </h2>
                    <p className={`text-xs md:text-sm mt-2 italic ${mode === 'break' ? 'text-cyan-300' : activeColorClass.text}`}>{currentRealmData.desc}</p>
                 </div>
              </div>
              <div className="grid grid-cols-3 sm:flex justify-start items-end gap-x-4 gap-y-4 w-full md:w-auto">
                 <div className="flex flex-col items-start md:items-end"> <span className="text-[10px] text-yellow-500 uppercase font-black mb-1">靈石</span> <span className="text-base text-yellow-500 font-mono font-bold">{formatNumber(player.coins)}</span> </div>
                 <div className="flex flex-col items-start md:items-end"> <span className="text-[10px] text-cyan-400 uppercase font-black mb-1">可用 SP</span> <span className="text-base text-cyan-400 font-mono font-bold">{formatNumber(availableSP)}</span> </div>
                 <div className="flex flex-col items-start md:items-end"> <span className="text-[10px] text-rose-500 uppercase font-black mb-1">連擊</span> <span className={`text-base text-rose-500 font-mono font-bold transition-all ${comboMultiplier > 2.0 ? 'text-rose-300 animate-pulse' : ''}`}>x{comboMultiplier.toFixed(2)}</span> </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-3"> <div className="flex justify-between text-[10px] uppercase font-black opacity-60 text-white"> <span>氣血真元</span> <span>{formatNumber(player.vitality)} / {formatNumber(maxVitality)}</span> </div> <div className="h-2 bg-black/60 rounded-full overflow-hidden shadow-inner"> <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${Math.min(100, (player.vitality/maxVitality)*100)}%` }}></div> </div> </div>
              <div className="space-y-3"> <div className="flex justify-between text-[10px] uppercase font-black opacity-60 text-white"> <span>修為進度 {monster.isBoss && !player.hasAscended && <span className="text-rose-400 ml-2 font-black">(突破死劫中)</span>}</span> <span>{formatNumber(player.qi)} / {formatNumber(player.qiToNext)}</span> </div> <div className="h-2 bg-black/60 rounded-full overflow-hidden shadow-inner"> <div className={`h-full ${mode === 'break' ? 'bg-cyan-500' : activeColorClass.bg} transition-all duration-1000`} style={{ width: `${Math.min(100, (player.qi/player.qiToNext)*100)}%` }}></div> </div> </div>
            </div>
          </div>
          <div className="mt-6 flex overflow-x-auto py-5 px-4 gap-8 bg-black/40 rounded-xl border border-white/10 no-scrollbar"> {REALMS.map((r, i) => (<div key={i} className={`flex flex-col items-center min-w-[90px] transition-all relative ${i===player.realmIndex?'scale-110 opacity-100':'opacity-40'}`}><div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-black text-xs rotate-45 transition-all ${i===player.realmIndex?'bg-white text-black rotate-0 shadow-2xl':'border-white/20 text-white'}`}>{i}</div><span className="text-[10px] font-black mt-5 whitespace-nowrap uppercase">{r.name}</span></div>))} </div>
        </div>
      )}

      <div className={`w-full max-w-4xl bg-slate-900/40 backdrop-blur-3xl p-8 md:p-14 rounded-2xl border ${mode === 'break' ? 'border-cyan-500/30' : 'border-white/10'} text-center z-10 shadow-2xl transition-all duration-700 ${isActive ? 'scale-[1.02] border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.15)] my-auto max-w-2xl' : 'mb-8'}`}>
        {!isActive && ( <div className="grid grid-cols-2 sm:flex sm:justify-center gap-4 mb-12 font-bold max-w-[280px] sm:max-w-none mx-auto"> {FOCUS_OPTIONS.map(opt => ( <button key={opt.value} onClick={() => { if(!isActive) { if(mode==='break') setMode('focus'); setFocusDuration(opt.value); setTimeLeft(opt.value); }}} className={`w-full sm:w-auto px-6 py-3.5 rounded-full text-xs font-black border transition-all ${focusDuration === opt.value && mode === 'focus' ? 'bg-white text-black border-white shadow-lg' : 'bg-black/40 text-white/50 border-white/20 hover:bg-white/10'}`}> {opt.label} </button> ))} </div> )}
        {isActive ? ( <div className={`text-[10px] font-black tracking-[0.5em] uppercase mb-8 animate-pulse ${mode === 'focus' ? 'text-emerald-400/50' : 'text-cyan-400/50'}`}> {mode === 'focus' ? '【 運轉周天・摒棄雜念 】' : '【 吐納調息・靈氣反哺 】'} </div> ) : ( mode === 'focus' ? ( <div className="animate-soft-fade-in"> <div className={`flex justify-center items-center gap-3 mb-2 text-sm tracking-[0.6em] font-black uppercase transition-colors ${monster.isBoss && !player.hasAscended ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}> <Compass size={18}/> {monster.name} </div> <div className="w-full max-w-xs mx-auto bg-black/60 rounded-full h-2 mb-1 overflow-hidden border border-white/10 shadow-inner"> <div className={`h-full transition-all duration-500 ${monster.isBoss && !player.hasAscended ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (monster.hp / monster.maxHp) * 100)}%` }}></div> </div> <div className="text-[10px] font-mono text-white/40 mb-10">氣血 {formatNumber(monster.hp)} / {formatNumber(monster.maxHp)} ｜ 戰力 {formatNumber(monster.atk)}</div> </div> ) : ( <div className="flex justify-center items-center gap-3 mb-10 text-sm tracking-[0.6em] font-black uppercase text-cyan-400 animate-pulse"> <Cloud size={18}/> 靈氣反哺．調息中 </div> ) )}
        <div className={`text-[5.5rem] sm:text-8xl md:text-[12rem] font-mono leading-none font-black tracking-tighter transition-all duration-700 ${isActive ? 'text-white my-8 md:my-12' : 'text-white/30 mb-14'}`}> {formatTime(timeLeft)} </div>
        <div className="flex flex-col items-center justify-center gap-6"> <div className="flex justify-center gap-6 md:gap-8 font-bold w-full"> {!isActive ? ( <button onClick={toggleTimer} className={`flex items-center justify-center gap-4 px-16 py-7 hover:text-black border border-white/20 rounded-2xl text-base sm:text-xl font-black tracking-widest uppercase transition-all shadow-2xl backdrop-blur-md w-full md:w-auto ${mode === 'break' ? 'bg-cyan-900/40 text-cyan-300 hover:bg-cyan-400' : 'bg-white/10 hover:bg-white text-white'}`}> <Sparkles size={24}/> {mode === 'focus' ? '運轉周天' : '開始調息'} </button> ) : ( <button onClick={preCheckGiveUp} className="flex items-center justify-center gap-4 px-16 py-6 bg-rose-950/30 text-rose-500/50 hover:text-rose-300 hover:bg-rose-900 border border-rose-500/20 rounded-2xl text-sm font-black tracking-widest uppercase transition-all w-full md:w-auto"> <AlertTriangle size={20}/> 強行收功 </button> )} </div> </div>
      </div>

      {!isActive && (
        <div className="w-full max-w-4xl mt-4 z-10 font-bold animate-soft-fade-in">
          <div className="bg-slate-950/90 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-2xl flex flex-col h-[750px] overflow-hidden">
            <div className="flex bg-black/80 border-b border-white/10 p-2 gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
              {[ { id: 'log', label: '日誌', icon: History }, { id: 'skills', label: '功法', icon: ScrollText }, { id: 'forge', label: '淬煉', icon: Hammer }, { id: 'artifacts', label: '法寶', icon: Box }, { id: 'companions', label: '紅顏', icon: Heart } ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-4 rounded-xl text-xs font-black uppercase flex flex-col items-center justify-center gap-2 transition-all min-w-[80px] relative ${activeTab===tab.id ? 'bg-white/15 text-white border border-white/20' : 'text-white/40 hover:text-white/80'}`}> 
                    <tab.icon size={18}/> <span>{tab.label}</span> {tab.id === 'forge' && totalFreeGacha > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>}
                </button>
              ))}
            </div>
            <div className="p-5 md:p-10 overflow-y-auto flex-1 custom-scrollbar">
              {activeTab === 'log' && ( <div className="space-y-4 animate-pop-in pb-10"> {(player.logs || []).map((e, i) => (<div key={i} className={`p-5 rounded-xl border border-white/20 text-[11px] leading-relaxed transition-all ${i===0?'bg-white/10 text-white shadow-lg':'bg-black/60 border-white/10 text-white/40'}`}>{String(e)}</div>))} </div> )}
              {activeTab === 'skills' && ( <div className="space-y-12 animate-pop-in"> <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"> {BASIC_SKILLS.map(s => { const lvl = player.basicSkills?.[s.id] || 0; return ( <div key={s.id} className="p-5 rounded-xl border border-white/20 bg-white/5 flex flex-col justify-between h-44"> <div><h4 className="text-white font-bold text-xs uppercase">{s.name} <span className="opacity-50 float-right font-mono">Lv.{lvl}</span></h4><p className="text-[10px] text-white/50 mt-3 italic">{s.desc}</p></div> <button onClick={() => { if(availableSP >= 1 && lvl < s.maxLvl) setPlayer(p => ({...p, basicSkills: {...p.basicSkills, [s.id]: lvl+1}})) }} disabled={availableSP < 1 || lvl >= s.maxLvl} className="w-full py-3 bg-white/10 text-white rounded-lg text-xs font-black border border-white/20 disabled:opacity-30">研習 (1 SP)</button> </div> );})} </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {sortedSecretBooks.map(book => { const lvl = player.secretBooks?.[book.id] || 0, learned = lvl > 0, upCost = Math.floor(10000 * Math.pow(2, lvl) * forgeDiscount); return ( <div key={book.id} className={`p-6 rounded-2xl border transition-all flex flex-col justify-between min-h-[12rem] ${learned ? 'bg-emerald-950/40 border-emerald-500/50 shadow-xl' : 'bg-black/60 border-white/10 opacity-60'}`}> <div className="flex items-start gap-4"><div className={`p-3 rounded-xl ${learned ? 'bg-emerald-500 text-black' : 'bg-slate-800'}`}><BookOpen size={20}/></div><div className="flex-1"><h4 className="font-black text-sm tracking-widest text-white">{book.name} {learned && <span className="text-[10px] opacity-60 ml-2">Lv.{lvl}</span>}</h4><p className="text-[11px] opacity-70 mt-2 text-white">{learned ? book.desc : '歷練隨機獲得。'}</p></div></div> {learned && lvl < 5 && <button onClick={() => { const cost = Math.floor(10000 * Math.pow(2, lvl) * forgeDiscount); if (player.coins >= cost && availableSP >= 1) setPlayer(p => ({ ...p, coins: p.coins - cost, secretBooks: { ...p.secretBooks, [book.id]: lvl + 1 } })); }} disabled={player.coins < upCost || availableSP < 1} className="mt-4 w-full py-3 bg-white/10 hover:bg-emerald-600 text-white rounded-xl text-sm font-black border border-white/20 transition-all disabled:opacity-30">升級 (${formatNumber(upCost)} + 1 SP)</button>} </div> );})} </div> </div> )}
              {activeTab === 'forge' && ( <div className="space-y-12 animate-pop-in"> <div className="grid grid-cols-1 sm:grid-cols-3 gap-6"> {[{title:'回春丹',desc:'恢復 50% 氣血。',fn:handleHeal,cost:healCost,dis:player.vitality>=maxVitality}, {title:'凝練劍光',desc:'基礎戰力 +100。',fn:()=>player.coins>=upgCostAtk && setPlayer(p=>({...p,coins:p.coins-upgCostAtk,baseCombat:p.baseCombat+100})),cost:upgCostAtk}, {title:'熬煉肉身',desc:'氣血上限 +100。',fn:()=>player.coins>=upgCostHp && setPlayer(p=>({...p,coins:p.coins-upgCostHp,baseMaxVitality:p.baseMaxVitality+100,vitality:p.vitality+100})),cost:upgCostHp}].map((u,i)=>( <div key={i} className={`p-6 rounded-2xl border flex flex-col justify-between min-h-[14rem] ${i===0?'bg-emerald-950/40 border-emerald-500/40':'bg-white/10 border-white/20'}`}> <div><h3 className="text-white font-black text-lg">{u.title}</h3><p className="text-white/70 text-xs mt-3 italic">{u.desc}</p></div> <button onClick={u.fn} disabled={u.dis || player.coins<u.cost} className="w-full py-4 bg-white/10 hover:bg-white hover:text-black rounded-xl font-black text-xs transition-all border border-white/20 mt-6">{u.dis?'滿值':`祭煉 (${formatNumber(u.cost)})`}</button> </div> ))} </div> <div className="bg-gradient-to-br from-white/10 to-transparent p-8 rounded-2xl border border-white/20 text-center relative overflow-hidden mt-8"> <h3 className="text-white font-black text-xl mb-8 flex items-center justify-center gap-3"><Compass className="text-yellow-400"/> 萬寶樓尋寶</h3> <button onClick={handleGacha} disabled={totalFreeGacha <= 0 && player.coins < gachaCost} className="px-16 py-6 bg-white/15 hover:bg-white text-white hover:text-black font-black rounded-2xl transition-all border border-white/30 text-sm"> {canDailyGacha ? `今日免費尋寶 (1/1)` : (player.freeGacha > 0 ? `免費保底尋寶 (${player.freeGacha})` : `尋寶 (${formatNumber(gachaCost)})`)} </button> </div> </div> )}
              {activeTab === 'artifacts' && ( <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pop-in"> {sortedArtifacts.map(art => { const u = (player.artifacts || []).includes(art.id), lvl = player.artifactLvls?.[art.id]||0, cost = Math.floor(RARITY_BASE_COST[art.rarity]*Math.pow(1.8,lvl)*forgeDiscount); return u ? ( <div key={art.id} className={`p-6 rounded-2xl border bg-black/60 border-white/20 flex flex-col justify-between min-h-[12rem] shadow-inner`}> <div className="z-10"><h4 className={`font-black text-sm ${RARITY[art.rarity].color} flex justify-between`}>{art.name} <span className="font-mono">Lv.{lvl}</span></h4><p className="text-[10px] text-white/50 mt-4 leading-relaxed uppercase">「{art.desc}」</p></div> {lvl < 5 && <button onClick={()=>{ if(player.coins>=cost) setPlayer(p=>({...p, coins:p.coins-cost, artifactLvls:{...p.artifactLvls, [art.id]:lvl+1}})); }} disabled={player.coins < cost} className="mt-6 w-full py-3 bg-white/15 hover:bg-white text-white rounded-xl text-xs font-black border border-white/20">血煉 (${formatNumber(cost)})</button>} </div> ) : ( <div key={art.id} className="p-6 rounded-2xl border-2 border-dashed border-white/10 bg-black/50 flex flex-col items-center justify-center opacity-40 min-h-[12rem]"><EyeOff size={32} className="text-white/20 mb-3"/><p className="text-[10px] font-black text-white/40 uppercase">寶光內斂：{RARITY[art.rarity].name}</p></div> );})} </div> )}
              {activeTab === 'companions' && ( <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pop-in"> {sortedCompanions.map(comp => { const u = player.realmIndex >= comp.unlockIdx, a = player.activeCompanion === comp.id, k = player.companionKills?.[comp.id] || 0, t = getCompanionTier(k); return u ? ( <div key={comp.id} className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${a ? 'bg-pink-900/40 border-pink-500/50 shadow-xl' : 'bg-black/60 border-white/10'}`}> <div> <div className="flex justify-between items-start mb-4"> <h4 className="text-white font-black text-lg">{comp.name} {a && <span className="text-[10px] bg-pink-500 text-white px-2 rounded-full ml-2">同行</span>}</h4> <div className="text-right"> <div className="text-pink-400 font-mono text-sm">{k} 斬</div> <div className="text-white/40 text-[10px]">{t >= 0 ? COMPANION_TIERS[t].name : '未結緣'}</div> </div> </div> <p className="text-white/70 text-[11px] italic mb-6 h-10">"{comp.desc}"</p> <div className="bg-black/40 rounded-xl p-4 border border-white/5 text-xs"> <div className="text-pink-300 font-black mb-2 flex items-center gap-2">【{comp.buffName}】</div> <div className="flex justify-between items-end"> <span className="text-white/60">{comp.buffDesc}</span> <span className="text-white font-mono font-black">+{comp.buffType === 'luck_floor' ? comp.tiers[Math.max(0,t)].toFixed(2) : comp.tiers[Math.max(0,t)]+'%'}</span> </div> </div> </div> {!a && ( <button onClick={() => setPlayer(p => ({ ...p, activeCompanion: comp.id }))} className="w-full py-3 rounded-xl border border-white/20 text-xs font-black text-white/70 hover:bg-pink-600 transition-all mt-4">邀其同行</button> )} </div> ) : ( <div key={comp.id} className="p-6 rounded-2xl border-2 border-dashed border-pink-900/20 bg-black/50 flex flex-col items-center justify-center min-h-[14rem] opacity-40"><EyeOff size={32} className="text-pink-900/40 mb-4"/><p className="text-[10px] font-black text-pink-700/50 uppercase">需突破至【{REALMS[comp.unlockIdx].name}】</p></div> );})} </div> )}
            </div>

            <footer className="pt-16 pb-24 text-center text-[10px] font-light text-white/40 tracking-[0.5em] uppercase flex flex-col items-center gap-6 z-10 w-full relative">
              <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 mx-auto px-4">
                 <button onClick={() => setShowTitles(true)} className="flex items-center justify-center gap-2 text-amber-400 bg-white/5 py-3.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg relative min-w-[80px]"> <Award size={14}/> 稱號 {player.freeGacha > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">{player.freeGacha}</span>} </button>
                 <button onClick={() => setShowGuide(true)} className="flex items-center justify-center gap-2 text-emerald-400 bg-white/5 py-3.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg min-w-[80px]"> <HelpCircle size={14}/> 指引 </button>
                 <button onClick={() => setShowStatsReport(true)} className="flex items-center justify-center gap-2 text-cyan-400 bg-white/5 py-3.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg min-w-[80px]"> <BarChart3 size={14}/> 屬性 </button>
                 <button onClick={() => setShowRealmGuide(true)} className="flex items-center justify-center gap-2 text-white/60 bg-white/5 py-3.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg min-w-[80px]"> <BookOpen size={14}/> 境界 </button>
              </div>
              <div className="flex gap-4">
                  <button onClick={() => setShowKarmaModal(true)} className={`flex items-center justify-center gap-2 text-purple-400 bg-purple-950/40 py-3 px-6 rounded-full border border-purple-500/30 font-black tracking-widest shadow-xl transition-all ${player.hasAscended ? 'animate-pulse ring-2 ring-purple-500' : ''}`}> <Activity size={16}/> 輪迴靈根 </button>
                  <button onClick={() => setShowSaveModal(true)} className="flex items-center justify-center gap-2 text-cyan-400 bg-cyan-950/40 py-3 px-6 rounded-full border border-cyan-500/30 font-black tracking-widest shadow-xl"> <ScrollText size={16}/> 玉簡傳功 </button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                  <button onClick={() => setShowChangelog(true)} className="hover:text-emerald-300 transition-colors flex items-center gap-1 text-[10px]"><FileText size={12}/> 天道紀元</button>
                  <button onClick={handleReincarnation} className={`transition-colors flex items-center gap-1 text-[10px] ${player.hasAscended ? 'text-rose-400 hover:text-rose-300 font-black animate-pulse' : 'text-rose-500/60 hover:text-rose-400'}`}><RefreshCw size={12}/> 兵解輪迴</button>
              </div>
              <p className="mt-8 relative z-20">Created by 指數三寶飯 with Gemini</p>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

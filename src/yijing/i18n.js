/** UI strings for the yi jing table, following the repo's data-i18n convention. */

/** English short titles (Wilhelm-Baynes convention), keyed by the engine's Chinese 卦名. */
export const EN_NAMES = {
  乾为天: 'The Creative', 坤为地: 'The Receptive', 水雷屯: 'Difficulty at the Beginning',
  山水蒙: 'Youthful Folly', 水天需: 'Waiting', 天水讼: 'Conflict', 地水师: 'The Army',
  水地比: 'Holding Together', 风天小畜: 'Small Taming', 天泽履: 'Treading',
  地天泰: 'Peace', 天地否: 'Standstill', 天火同人: 'Fellowship', 火天大有: 'Great Possession',
  地山谦: 'Modesty', 雷地豫: 'Enthusiasm', 泽雷随: 'Following', 山风蛊: 'Work on the Decayed',
  地泽临: 'Approach', 风地观: 'Contemplation', 火雷噬嗑: 'Biting Through', 山火贲: 'Grace',
  山地剥: 'Splitting Apart', 地雷复: 'Return', 天雷无妄: 'Innocence', 山天大畜: 'Great Taming',
  山雷颐: 'Nourishment', 泽风大过: 'Great Exceeding', 坎为水: 'The Abysmal Water',
  离为火: 'The Clinging Fire', 泽山咸: 'Influence', 雷风恒: 'Duration',
  雷天大壮: 'Great Power', 火地晋: 'Progress', 地火明夷: 'Darkening of the Light', 天山遯: 'Retreat',
  风火家人: 'The Family', 火泽睽: 'Opposition', 水山蹇: 'Obstruction', 雷水解: 'Deliverance',
  山泽损: 'Decrease', 风雷益: 'Increase', 泽天夬: 'Breakthrough', 天风姤: 'Coming to Meet',
  泽地萃: 'Gathering Together', 地风升: 'Pushing Upward', 泽水困: 'Oppression',
  水风井: 'The Well', 泽火革: 'Revolution', 火风鼎: 'The Cauldron', 震为雷: 'The Arousing',
  艮为山: 'Keeping Still', 风山渐: 'Development', 雷泽归妹: 'The Marrying Maiden',
  雷火丰: 'Abundance', 火山旅: 'The Wanderer', 巽为风: 'The Gentle', 兑为泽: 'The Joyous',
  风水涣: 'Dispersion', 水泽节: 'Limitation', 风泽中孚: 'Inner Truth', 雷山小过: 'Small Exceeding',
  水火既济: 'After Completion', 火水未济: 'Before Completion',
};

/** Trigram lookup keyed by its 3-bit line code, bottom line first. */
export const TRIGRAMS = {
  111: { zh: '乾', natureZh: '天', en: 'Heaven' },
  110: { zh: '兑', natureZh: '泽', en: 'Lake' },
  101: { zh: '离', natureZh: '火', en: 'Fire' },
  100: { zh: '震', natureZh: '雷', en: 'Thunder' },
  '011': { zh: '巽', natureZh: '风', en: 'Wind' },
  '010': { zh: '坎', natureZh: '水', en: 'Water' },
  '001': { zh: '艮', natureZh: '山', en: 'Mountain' },
  '000': { zh: '坤', natureZh: '地', en: 'Earth' },
};

export const copy = {
  zh: {
    pageTitle: '占卜',
    kicker: 'YI JING DIVINATION',
    greeting: '心有所问，卦有所答',
    tabCoins: '摇卦 · 铜钱',
    tabLot: '抽签 · 卦签',
    questionPlaceholder: '所问何事（可留空）',
    tossOf: (n) => `第 ${n} 掷 · 共 6 掷`,
    tossAction: '掷铜钱',
    drawAction: '抽一支签',
    againCoins: '再占一次',
    againLot: '再抽一支',
    castFirst: '连掷六次铜钱，卦象自下而上自成',
    drawFirst: '默念所问，然后抽一支签',
    hexOriginal: '本卦',
    hexChanged: '变卦',
    zhi: '之',
    movingLines: (n) => `${n} 爻动`,
    quietHex: '静卦 · 无动爻',
    palace: '卦宫',
    element: '五行',
    trigramPair: (up, down) => `上${up}下${down}`,
    toastDone: '卦已成，静观其辞',
    toastSwitch: '已换方式，可重新起卦',
    hintDrag: '拖拽换个角度 · 滚轮靠近',
    hintTapCoins: '点击铜钱或下方按钮，掷出一爻',
    hintTapCup: '点击签筒或下方按钮，抽一支签',
    soundOn: '声音已开启',
    soundOff: '声音已关闭',
    soundUnavailable: '当前浏览器无法播放声音，占卜体验不受影响。',
    loading: '正在备下铜钱与卦签',
    disclaimer: '仅供自我探索与文化体验，非专业建议',
    engineNote: '卦名与卦辞出自本地太卜引擎推算结果',
  },
  en: {
    pageTitle: 'Yi Jing',
    kicker: '易经占卜 · YI JING',
    greeting: 'Ask with a quiet mind',
    tabCoins: 'Coins · Cast',
    tabLot: 'Lots · Draw',
    questionPlaceholder: 'Your question (optional)',
    tossOf: (n) => `Toss ${n} of 6`,
    tossAction: 'Toss the Coins',
    drawAction: 'Draw a Lot',
    againCoins: 'Cast Again',
    againLot: 'Draw Again',
    castFirst: 'Six tosses build the hexagram from below',
    drawFirst: 'Hold your question in mind, then draw',
    hexOriginal: 'Present',
    hexChanged: 'Changed',
    zhi: '→',
    movingLines: (n) => `${n} moving line${n > 1 ? 's' : ''}`,
    quietHex: 'Still hexagram · no moving lines',
    palace: 'Palace',
    element: 'Element',
    trigramPair: (up, down) => `${up} above, ${down} below`,
    toastDone: 'The hexagram is complete — read its words slowly',
    toastSwitch: 'Method changed — start a fresh cast',
    hintDrag: 'Drag to look around · scroll to move closer',
    hintTapCoins: 'Tap the coins or the button below to toss',
    hintTapCup: 'Tap the bamboo cup or the button below to draw',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    soundUnavailable: 'Audio is unavailable in this browser; the table still works.',
    loading: 'Setting out coins and lots',
    disclaimer: 'For self-exploration and cultural experience only — not professional advice',
    engineNote: 'Names and judgments computed locally by the TaiBu engine',
  },
};

export function createI18n(onChange) {
  let lang = window.localStorage.getItem('daora-oracle-lang') || 'zh';

  function apply(root = document) {
    root.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    root.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      const value = copy[lang][key];
      if (value === undefined) return;
      if (typeof value === 'string') node.innerHTML = value;
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      const key = node.getAttribute('data-i18n-placeholder');
      const value = copy[lang][key];
      if (typeof value === 'string') node.placeholder = value;
    });
  }

  return {
    get lang() { return lang; },
    t(key, ...args) {
      const value = copy[lang][key];
      if (typeof value === 'function') return value(...args);
      return value ?? key;
    },
    toggle() {
      lang = lang === 'zh' ? 'en' : 'zh';
      window.localStorage.setItem('daora-oracle-lang', lang);
      apply();
      if (onChange) onChange(lang);
      return lang;
    },
    apply,
  };
}

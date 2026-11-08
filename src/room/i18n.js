const copy = {
  zh: {
    loading: '正在布置静室',
    pageTitle: '四门静室',
    kicker: 'FOUR GATES',
    greeting: '一室四门，各通一方',
    lede: '点击案上的器物，走进对应的门。',
    gateDivination: '占卜',
    gateDivinationSub: '易经 · 摇卦与卦签',
    gateChart: '命盘',
    gateChartSub: '八字 · 紫微',
    gateFengshui: '风水',
    gateFengshuiSub: '宅盘 · 方位宜忌',
    gateSpirit: '通灵',
    gateSpiritSub: '大师 · 咨询预约',
    statusOpen: '已开放',
    statusSoon: '布置中',
    toastComing: '「{name}」尚在布置，敬请期待。',
    hintDrag: '拖拽换个角度 · 滚轮靠近 · 点击器物进入',
    disclaimer: '仅供自我探索与文化体验，非专业建议',
  },
  en: {
    loading: 'Preparing the hall',
    pageTitle: 'The Four Gates',
    kicker: '四门静室',
    greeting: 'One room, four gates',
    lede: 'Tap an object on the desk to enter its gate.',
    gateDivination: 'Divination',
    gateDivinationSub: 'Yi Jing · Coins & lots',
    gateChart: 'Birth Chart',
    gateChartSub: 'BaZi · Zi Wei',
    gateFengshui: 'Feng Shui',
    gateFengshuiSub: 'Compass · Directions',
    gateSpirit: 'Medium',
    gateSpiritSub: 'Masters · Booking',
    statusOpen: 'Open',
    statusSoon: 'Coming soon',
    toastComing: '“{name}” is still being prepared.',
    hintDrag: 'Drag to look around · Scroll to zoom · Tap an object to enter',
    disclaimer: 'For self-exploration and cultural experience only',
  },
};

const GATE_KEY = { divination: 'gateDivination', chart: 'gateChart', fengshui: 'gateFengshui', spirit: 'gateSpirit' };
const KEY = 'daora-oracle-lang';

export function createI18n() {
  let lang = localStorage.getItem(KEY) || 'zh';

  function t(key, vars) {
    let v = copy[lang][key] ?? copy.zh[key] ?? key;
    if (vars) v = v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
    return v;
  }

  function apply() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    // station tooltip names per gate
    const label = document.getElementById('station-label');
    if (label) {
      for (const [id, key] of Object.entries(GATE_KEY)) label.dataset[id] = t(key);
    }
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    const langLabel = document.getElementById('lang-label');
    if (langLabel) langLabel.textContent = lang === 'zh' ? 'EN' : '中';
  }

  function toggle() {
    lang = lang === 'zh' ? 'en' : 'zh';
    localStorage.setItem(KEY, lang);
    apply();
  }

  return {
    t, apply, toggle,
    gateName: (id) => t(GATE_KEY[id] || id),
    get lang() { return lang; },
  };
}

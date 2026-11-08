/** UI strings for the oracle table, following the repo's data-i18n convention. */
export const copy = {
  zh: {
    pageTitle: '占卜桌',
    kicker: 'THE ORACLE TABLE',
    greeting: '静心，然后抽一张牌',
    newDraw: '换一组牌',
    hintDrag: '拖拽换个角度 · 滚轮靠近',
    hintPick: '点击牌面，翻开它',
    soundOn: '声音已开启',
    soundOff: '声音已关闭',
    soundUnavailable: '当前浏览器无法播放声音，占卜体验不受影响。',
    loading: '正在铺开牌阵',
    upright: '正位',
    drawAgain: '这一组已合上，新的一组正在路上',
    disclaimer: '仅供自我探索与文化体验，非专业建议',
    backToRoom: '返回道场',
  },
  en: {
    pageTitle: 'Oracle Table',
    kicker: '占卜桌 · THE ORACLE TABLE',
    greeting: 'Quiet your mind, then draw',
    newDraw: 'New Draw',
    hintDrag: 'Drag to look around · scroll to move closer',
    hintPick: 'Tap a card to turn it over',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    soundUnavailable: 'Audio is unavailable in this browser; the table still works.',
    loading: 'Laying out the cards',
    upright: 'Upright',
    drawAgain: 'The old spread rests — a new one is on its way',
    disclaimer: 'For self-exploration and cultural experience only — not professional advice',
    backToRoom: 'Back to the Room',
  },
};

export function createI18n(onChange) {
  let lang = window.localStorage.getItem('daora-oracle-lang') || 'zh';

  function apply(root = document) {
    root.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    root.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (copy[lang][key] !== undefined) node.innerHTML = copy[lang][key];
    });
  }

  return {
    get lang() { return lang; },
    t(key) { return copy[lang][key] ?? key; },
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

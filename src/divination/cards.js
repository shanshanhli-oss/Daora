/** The 22 Major Arcana. Upright keywords are cultural shorthand, not predictions. */
export const ARCANA = [
  { id: 0,  numeral: '0',    zh: '愚人',     en: 'The Fool',           keywords: { zh: '开始 · 自由 · 信任', en: 'beginnings · freedom · trust' } },
  { id: 1,  numeral: 'I',    zh: '魔术师',   en: 'The Magician',       keywords: { zh: '创造 · 意志 · 行动', en: 'willpower · creation · action' } },
  { id: 2,  numeral: 'II',   zh: '女祭司',   en: 'The High Priestess', keywords: { zh: '直觉 · 静谧 · 潜意识', en: 'intuition · stillness · mystery' } },
  { id: 3,  numeral: 'III',  zh: '女皇',     en: 'The Empress',        keywords: { zh: '丰饶 · 滋养 · 感官', en: 'abundance · nurture · senses' } },
  { id: 4,  numeral: 'IV',   zh: '皇帝',     en: 'The Emperor',        keywords: { zh: '秩序 · 担当 · 结构', en: 'structure · authority · stability' } },
  { id: 5,  numeral: 'V',    zh: '教皇',     en: 'The Hierophant',     keywords: { zh: '传承 · 信念 · 指引', en: 'tradition · belief · guidance' } },
  { id: 6,  numeral: 'VI',   zh: '恋人',     en: 'The Lovers',         keywords: { zh: '联结 · 选择 · 真诚', en: 'union · choice · honesty' } },
  { id: 7,  numeral: 'VII',  zh: '战车',     en: 'The Chariot',        keywords: { zh: '方向 · 掌控 · 前进', en: 'direction · drive · victory' } },
  { id: 8,  numeral: 'VIII', zh: '力量',     en: 'Strength',           keywords: { zh: '柔韧 · 勇气 · 耐心', en: 'courage · patience · gentle force' } },
  { id: 9,  numeral: 'IX',   zh: '隐士',     en: 'The Hermit',         keywords: { zh: '内省 · 独行 · 灯火', en: 'solitude · reflection · inner light' } },
  { id: 10, numeral: 'X',    zh: '命运之轮', en: 'Wheel of Fortune',   keywords: { zh: '转机 · 循环 · 时势', en: 'turning point · cycles · fate' } },
  { id: 11, numeral: 'XI',   zh: '正义',     en: 'Justice',            keywords: { zh: '平衡 · 清明 · 因果', en: 'balance · clarity · cause & effect' } },
  { id: 12, numeral: 'XII',  zh: '倒吊人',   en: 'The Hanged Man',     keywords: { zh: '停顿 · 换位 · 放下', en: 'pause · new angle · letting go' } },
  { id: 13, numeral: 'XIII', zh: '死神',     en: 'Death',              keywords: { zh: '结束 · 转化 · 新生', en: 'endings · transformation · renewal' } },
  { id: 14, numeral: 'XIV',  zh: '节制',     en: 'Temperance',         keywords: { zh: '调和 · 节奏 · 中庸', en: 'harmony · moderation · alchemy' } },
  { id: 15, numeral: 'XV',   zh: '恶魔',     en: 'The Devil',          keywords: { zh: '束缚 · 欲望 · 觉察', en: 'attachment · desire · awareness' } },
  { id: 16, numeral: 'XVI',  zh: '高塔',     en: 'The Tower',          keywords: { zh: '撼动 · 真相 · 重建', en: 'upheaval · truth · rebuilding' } },
  { id: 17, numeral: 'XVII', zh: '星星',     en: 'The Star',           keywords: { zh: '希望 · 疗愈 · 清澈', en: 'hope · healing · clarity' } },
  { id: 18, numeral: 'XVIII',zh: '月亮',     en: 'The Moon',           keywords: { zh: '梦境 · 情绪 · 迷雾', en: 'dreams · emotion · the unseen' } },
  { id: 19, numeral: 'XIX',  zh: '太阳',     en: 'The Sun',            keywords: { zh: '喜悦 · 活力 · 坦荡', en: 'joy · vitality · openness' } },
  { id: 20, numeral: 'XX',   zh: '审判',     en: 'Judgement',          keywords: { zh: '唤醒 · 回响 · 召唤', en: 'awakening · reckoning · calling' } },
  { id: 21, numeral: 'XXI',  zh: '世界',     en: 'The World',          keywords: { zh: '圆满 · 整合 · 抵达', en: 'completion · wholeness · arrival' } },
];

/** Draw `count` distinct cards, uniformly at random. */
export function drawCards(count, rng = Math.random) {
  const pool = [...ARCANA];
  const drawn = [];
  while (drawn.length < count && pool.length) {
    const index = Math.floor(rng() * pool.length);
    drawn.push(pool.splice(index, 1)[0]);
  }
  return drawn;
}

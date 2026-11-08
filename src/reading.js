/**
 * Readings for 八字, 紫微 and a hexagram.
 *
 * If the browser has an endpoint in local settings, the client calls an
 * OpenAI-compatible chat completion. The key, when the user types one,
 * stays in localStorage and is sent only as an Authorization header.
 * It is never written into the prompt, the repository, or a fallback.
 * With no endpoint, a template built from the chart is returned, so the
 * panel always works and never needs a paid key.
 */

export const SETTINGS_KEY = 'daora-ai-settings';

export const SYSTEM_PROMPT = [
  '你是 DAORA 的解读者。只根据用户给出的盘面事实说话，不增造干支、星曜或爻辞。',
  '用安静、清楚的中文，先说结构，再说一个可以自己去做的观察。',
  '八字只谈日主、十神、五行强弱与大运的方向，不判断旺衰为吉凶判决。',
  '紫微只谈宫位、主星与四化的关系。',
  '卦只谈本卦、动爻与变卦的古典句子，以及它们如何并读。',
  '明确这不是医疗、心理、法律或财务建议。不要索要联系方式，不要承诺改运。',
].join('');

const GOD_WORD = {
  正印: '正印偏于承接与学习',
  偏印: '偏印偏于独自琢磨',
  食神: '食神偏于从容地表达',
  伤官: '伤官偏于把话说得锐一点',
  正财: '正财偏于可握住的资源',
  偏财: '偏财偏于流动的资源',
  正官: '正官偏于规矩与职责',
  七杀: '七杀偏于压力与决断',
  比肩: '比肩偏于同辈的力气',
  劫财: '劫财偏于争夺与分用',
};

export function readSettings(storage) {
  try {
    const raw = JSON.parse(storage.getItem(SETTINGS_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return { endpoint: '', model: '', apiKey: '' };
    return {
      endpoint: typeof raw.endpoint === 'string' ? raw.endpoint.trim() : '',
      model: typeof raw.model === 'string' ? raw.model.trim() : '',
      apiKey: typeof raw.apiKey === 'string' ? raw.apiKey : '',
    };
  } catch {
    return { endpoint: '', model: '', apiKey: '' };
  }
}

export function writeSettings(settings, storage) {
  const next = {
    endpoint: String(settings.endpoint || '').trim(),
    model: String(settings.model || '').trim(),
    apiKey: String(settings.apiKey || ''),
  };
  storage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function usableEndpoint(endpoint) {
  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function godLine(chart, lang) {
  const parts = ['year', 'month', 'hour'].map((key) => {
    const god = chart.tenGods?.[key];
    if (!god || god === '日主') return '';
    const word = lang === 'en' ? god : `${god}${GOD_WORD[god] ? `（${GOD_WORD[god]}）` : ''}`;
    return `${chart.pillars?.[key] || ''} ${word}`.trim();
  }).filter(Boolean);
  return parts.join(lang === 'en' ? '; ' : '；');
}

function palaceLine(ziwei) {
  if (!ziwei?.available) return '';
  const life = ziwei.palaces?.find((palace) => palace.name === '命宫');
  const names = (life?.major || []).map((star) => star.name).join('、') || '无主星';
  return `${ziwei.fiveElementsClass || ''} 命宫 ${names}`.trim();
}

export function baziFacts(chart) {
  const scores = chart.strength?.scores || {};
  const scoreText = ['木', '火', '土', '金', '水'].map((name) => `${name}${Number(scores[name] || 0).toFixed(1)}`).join(' ');
  return {
    kind: 'bazi',
    dayMaster: chart.dayMaster || '',
    element: chart.dayMasterElement || '',
    pillars: chart.pillars || {},
    tenGods: chart.tenGods || {},
    dominant: chart.dominant || '',
    scores: scoreText,
    gods: godLine(chart, 'zh'),
  };
}

export function ziweiFacts(ziwei) {
  return {
    kind: 'ziwei',
    available: Boolean(ziwei?.available),
    className: ziwei?.fiveElementsClass || '',
    soul: ziwei?.soul || '',
    body: ziwei?.body || '',
    life: palaceLine(ziwei),
    transformations: (ziwei?.transformations || []).map((item) => `${item.star}${item.mutagen}·${item.palace}`),
  };
}

export function hexagramFacts(cast) {
  const moving = (cast?.moving || []).map(({ index, line }) => ({
    index,
    title: cast.primary?.lines?.[index]?.title || '',
    text: cast.primary?.lines?.[index]?.text || '',
    kind: line?.zh || line?.kind || '',
  }));
  return {
    kind: 'hexagram',
    name: cast?.primary?.name || '',
    judgment: cast?.primary?.judgment || '',
    image: cast?.primary?.image || '',
    moving,
    changed: cast?.changed?.name || '',
    changedJudgment: cast?.changed?.judgment || '',
  };
}

export function templateReading(payload, lang = 'zh') {
  const en = lang === 'en';
  if (payload.kind === 'bazi') {
    const pillars = ['year', 'month', 'day', 'hour'].map((key) => payload.pillars?.[key] || '').filter(Boolean).join(' ');
    if (en) {
      return `Day master ${payload.dayMaster || '—'} belongs to ${payload.element || '—'}. The four pillars are ${pillars}. ${payload.gods || 'The ten gods are quiet.'} The strongest weighted element is ${payload.dominant || '—'} (${payload.scores || ''}), and that is only the room’s palette, not a verdict of luck. Notice which of these roles you already practise this week, and which one you keep postponing. This is a calendar mirror, not medical, psychological, legal or financial advice.`;
    }
    return `日主是${payload.dayMaster || '—'}，五行属${payload.element || '—'}。四柱为 ${pillars}。${payload.gods || '十神不明显。'}加权之后最强的是${payload.dominant || '—'}（${payload.scores || ''}）。这只决定房间的色调，不是旺衰判决。这一周可以观察：这些角色里，你已经在做的是哪一个，一直推迟的又是哪一个。供对照，不是医疗、心理、法律或财务建议。`;
  }
  if (payload.kind === 'ziwei') {
    if (!payload.available) {
      return en
        ? 'Zi Wei needs the traditional calendar parameter before a palace reading can be written. The four pillars above still stand on their own.'
        : '紫微需要传统历法参数才能写宫位。上面的四柱仍然可以单独看。';
    }
    const changes = (payload.transformations || []).slice(0, 4).join(en ? ', ' : '、');
    if (en) {
      return `${payload.className}. Soul star ${payload.soul}, body star ${payload.body}. ${payload.life}. Transformations: ${changes || 'none recorded'}. Read the life palace together with wealth, career and travel, not as a rank. This is not advice about health, money or work.`;
    }
    return `${payload.className}。命主${payload.soul}，身主${payload.body}。${payload.life}。四化：${changes || '未见'}。命宫要和财帛、官禄、迁移一起看，不是官阶。不是关于健康、金钱或工作的建议。`;
  }
  if (payload.kind === 'hexagram') {
    const moves = (payload.moving || []).map((line) => `${line.title || ''} ${line.text || ''}`.trim()).filter(Boolean);
    if (en) {
      const changed = payload.changed ? ` The changed figure is ${payload.changed}: ${payload.changedJudgment}` : ' No line moves, so there is no changed figure.';
      return `${payload.name}. Judgment: ${payload.judgment} Image: ${payload.image} Moving lines: ${moves.join(' / ') || 'none.'}${changed} Read the moving line first, then the changed judgment as where that line points. For reflection only.`;
    }
    const changed = payload.changed ? `变卦是${payload.changed}：${payload.changedJudgment}` : '没有动爻，所以没有变卦。';
    return `${payload.name}。卦辞：${payload.judgment}象曰：${payload.image}动爻：${moves.join(' / ') || '无。'}${changed}先读动爻，再把变卦的卦辞当作那一爻指过去的地方。只供对照。`;
  }
  return en ? 'There is not enough on the chart to read yet.' : '盘面还不够，暂无可读。';
}

function payloadText(payload) {
  return JSON.stringify(payload);
}

export async function createReading(payload, settings = {}, { lang = 'zh', fetchImpl = globalThis.fetch } = {}) {
  const template = templateReading(payload, lang);
  const endpoint = settings.endpoint || '';
  if (!endpoint || !usableEndpoint(endpoint)) {
    return { source: 'template', text: template };
  }
  const key = settings.apiKey || '';
  const body = {
    model: settings.model || 'gpt-4o-mini',
    temperature: 0.4,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: payloadText(payload) },
    ],
  };
  if (key && JSON.stringify(body).includes(key)) {
    return { source: 'template', text: template, error: 'key-leaked' };
  }
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (key) headers.Authorization = `Bearer ${key}`;
    const response = await fetchImpl(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!response?.ok) return { source: 'template', text: template, fallback: true };
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text || typeof text !== 'string') return { source: 'template', text: template, fallback: true };
    return { source: 'model', text: text.trim() };
  } catch {
    return { source: 'template', text: template, fallback: true };
  }
}

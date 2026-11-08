import { PLACES, assemble, dailyHexagram, drawLot, tossCoins } from './hexagrams.js';
import { t } from './copy.js';
import { createReading, hexagramFacts, readSettings, writeSettings } from '../reading.js';

const STORAGE = 'daora-daily-hexagram';
const TOSS_LABELS = {
  zh: ['摇初爻', '摇二爻', '摇三爻', '摇四爻', '摇五爻', '摇上爻'],
  en: ['Toss the first line', 'Toss the second line', 'Toss the third line', 'Toss the fourth line', 'Toss the fifth line', 'Toss the top line'],
};
const STEP_READY = {
  zh: ['准备摇初爻', '准备摇二爻', '准备摇三爻', '准备摇四爻', '准备摇五爻', '准备摇上爻'],
  en: ['Ready for the first line', 'Ready for the second line', 'Ready for the third line', 'Ready for the fourth line', 'Ready for the fifth line', 'Ready for the top line'],
};
const AFTER = {
  zh: ['已得初爻，继续摇二爻', '已得二爻，继续摇三爻', '已得三爻，继续摇四爻', '已得四爻，继续摇五爻', '已得五爻，继续摇上爻', '六爻已齐'],
  en: ['First line set. Toss the second.', 'Second line set. Toss the third.', 'Third line set. Toss the fourth.', 'Fourth line set. Toss the fifth.', 'Fifth line set. Toss the top.', 'All six lines are set'],
};

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(lang) {
  const date = new Date();
  if (lang === 'en') return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function validLine(line) {
  return line && (line.kind === 'yin' || line.kind === 'yang') && typeof line.moving === 'boolean' && Number.isFinite(line.sum);
}

function readSaved() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE) || 'null');
    if (!data || data.date !== todayKey() || !Array.isArray(data.lines) || data.lines.length !== 6 || !data.lines.every(validLine)) return null;
    return data;
  } catch {
    return null;
  }
}

function writeSaved(lines, question) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify({ date: todayKey(), lines, question }));
  } catch { /* private mode */ }
}

function lineFigure(line) {
  const bar = line.kind === 'yang'
    ? '<i class="yao yao-yang"></i>'
    : '<i class="yao yao-yin"><b></b><b></b></i>';
  const mark = line.moving ? (line.kind === 'yang' ? '<em>○</em>' : '<em>×</em>') : '<em class="yao-quiet"></em>';
  return `<span class="yao-wrap">${bar}${mark}</span>`;
}

function figureBlock(entry, lines, lang) {
  const gloss = lang === 'en' ? entry.glossEn : entry.glossZh;
  const name = lang === 'en' ? `${entry.name} · ${entry.en}` : entry.name;
  const rows = lines
    ? lines.map((line, index) => `<div class="cast-fig-row"><span>${PLACES[index][lang === 'en' ? 'en' : 'zh']}</span>${lineFigure(line)}<small>${line.sum}</small></div>`).reverse().join('')
    : `<div class="cast-fig-name">${name}</div>`;
  const explain = lang === 'en' ? entry.explainEn : entry.explainZh;
  return `<article class="cast-fig"><header><small>${entry.symbol} ${entry.no}</small><b>${name}</b></header>${lines ? `<div class="cast-fig-lines">${rows}</div>` : ''}<p class="cast-classic">${entry.judgment}</p><p class="cast-classic">${entry.image}</p><p>${explain}</p><p class="cast-note">${gloss}</p></article>`;
}

function dailyCard(lang) {
  const entry = dailyHexagram(new Date());
  const explain = lang === 'en' ? entry.explainEn : entry.explainZh;
  return `<section class="daily-hex"><p class="cast-label">${t(lang, 'dailyTitle')}</p><h3>${entry.symbol} ${entry.name}</h3><p class="cast-classic">${entry.judgment}</p><p>${explain}</p><button type="button" class="btn ghost" data-action="ai-daily">${t(lang, 'aiReading')}</button><div class="reading-slot" data-reading-slot="daily"></div></section>`;
}

function changedLines(lines) {
  return lines.map((line) => {
    if (!line.moving) return line;
    const kind = line.kind === 'yang' ? 'yin' : 'yang';
    return { ...line, kind, moving: false, sum: kind === 'yang' ? 7 : 8, zh: kind === 'yang' ? '少阳' : '少阴', en: kind === 'yang' ? 'Young yang' : 'Young yin' };
  });
}

export function mountDivine(root, { reduced = false } = {}) {
  const state = {
    lang: 'zh',
    mode: 'lines',
    lines: [],
    question: '',
    latest: null,
    spinning: false,
    lot: null,
    restored: false,
  };
  const saved = readSaved();
  if (saved) {
    state.lines = saved.lines;
    state.question = saved.question || '';
    state.restored = true;
  }

  function placeName(index) {
    return PLACES[index][state.lang === 'en' ? 'en' : 'zh'];
  }

  function paint() {
    const lang = state.lang;
    const done = state.lines.length === 6;
    const cast = done ? assemble(state.lines) : null;
    const next = state.lines.length;
    root.innerHTML = `
      <div class="cast">
        ${dailyCard(lang)}
        <div class="cast-modes" role="tablist">
          <button type="button" data-cast="lines" aria-pressed="${state.mode === 'lines'}">${t(lang, 'castModeLines')}</button>
          <button type="button" data-cast="lot" aria-pressed="${state.mode === 'lot'}">${t(lang, 'castModeLot')}</button>
        </div>
        ${state.mode === 'lot' ? lotView(lang) : done ? resultView(lang, cast) : castingView(lang, next)}
      </div>`;
    bind();
  }

  function lotView(lang) {
    const card = state.lot ? figureBlock(state.lot, null, lang) : '';
    return `
      <p class="cast-lead">${t(lang, 'castLotLead')}</p>
      <div class="cast-lot">${card}</div>
      ${state.lot ? `<p class="cast-note">${t(lang, 'castLotResult')}</p><button type="button" class="btn ghost" data-action="ai-lot">${t(lang, 'aiReading')}</button><div class="reading-slot" data-reading-slot="lot"></div>` : ''}
      <button type="button" class="btn gold cast-action" data-action="lot">${state.lot ? t(lang, 'castLotAgain') : t(lang, 'castLotButton')}</button>
      <p class="cast-disclaimer">${t(lang, 'castDisclaimer')}</p>`;
  }

  function castingView(lang, next) {
    const rows = PLACES.map((place, index) => {
      const line = state.lines[index];
      const label = place[lang === 'en' ? 'en' : 'zh'];
      if (!line) return `<li class="is-wait"><span>${label}</span><i class="leader"></i><em>${t(lang, 'castWaiting')}</em></li>`;
      return `<li class="${line.moving ? 'is-moving' : ''}"><span>${label}</span>${lineFigure(line)}<em>${lang === 'en' ? line.en : line.zh}</em></li>`;
    }).reverse().join('');
    const coins = state.latest ? state.latest.coins : null;
    const coinHtml = [0, 1, 2].map((index) => {
      const value = coins ? coins[index] : null;
      const face = value === 3 ? 'zi' : value === 2 ? 'bei' : '';
      const text = value === 3 ? t(lang, 'castFaceYang') : value === 2 ? t(lang, 'castFaceYin') : '';
      return `<div class="coin ${face ? `is-${face}` : ''} ${state.spinning ? 'is-spinning' : ''}"><span class="coin-face">${text || ''}<i></i></span></div>`;
    }).join('');
    const headline = state.lines.length ? AFTER[lang][state.lines.length - 1] : t(lang, 'castQuiet');
    const shownIndex = state.spinning ? state.lines.length : state.lines.length - 1;
    return `
      <header class="cast-head">
        <div>
          <p class="cast-date">${t(lang, 'castKicker')} · ${formatDate(lang)}</p>
          <h3>${state.lines.length ? headline : t(lang, 'castKicker')}</h3>
          <p>${state.lines.length ? (lang === 'zh' ? '六爻由下向上排列，继续完成余下的爻。' : 'The lines stack upward. Continue with the lines that remain.') : headline}</p>
        </div>
        <div class="cast-count" aria-live="polite"><b>${state.lines.length}</b><span>/ 6</span></div>
      </header>
      ${state.lines.length === 0 ? `<label class="cast-q"><span>${t(lang, 'castQuestion')}</span><input name="question" maxlength="80" value="${escapeAttr(state.question)}" /></label>` : ''}
      <div class="cast-grid">
        <ol class="cast-lines">
          <li class="cast-lines-cap"><span>${t(lang, 'castProgress')}</span><span>${t(lang, 'castUpward')}</span></li>
          ${rows}
        </ol>
        <div class="cast-stage">
          <div class="cast-stage-cap"><span>${state.latest ? placeName(shownIndex) : t(lang, 'castStep')}</span><span>${state.latest ? t(lang, 'castCoins') : STEP_READY[lang][next]}</span></div>
          <div class="coins" aria-hidden="true">${coinHtml}</div>
          <p class="cast-sum">${state.latest ? `${state.lang === 'en' ? state.latest.en : state.latest.zh} · ${state.latest.sum} ${t(lang, 'castPoint')} · ${placeName(shownIndex)}` : t(lang, 'castAwait')}</p>
          <button type="button" class="btn gold cast-action" data-action="toss" ${state.spinning ? 'disabled' : ''}>${TOSS_LABELS[lang][next]}</button>
        </div>
      </div>
      <p class="cast-convention">${t(lang, 'castConvention')}</p>`;
  }

  function resultView(lang, cast) {
    const changedFigures = cast.changed ? changedLines(cast.lines) : null;
    const moving = cast.moving.length
      ? `<section class="cast-moving"><h4>${t(lang, 'castMoving')}</h4><ul>${cast.moving.map(({ index, line }) => {
        const yao = cast.primary.lines[index];
        const words = lang === 'en' ? yao.explainEn : yao.explainZh;
        return `<li><b>${yao.title} · ${placeName(index)}</b><span>${escapeText(yao.text)}</span><small>${lang === 'en' ? line.en : line.zh} · ${line.sum}</small><p>${escapeText(words)}</p></li>`;
      }).join('')}</ul></section>`
      : `<section class="cast-moving"><h4>${t(lang, 'castStill')}</h4><p>${t(lang, 'castNoChange')}</p></section>`;
    return `
      <header class="cast-head">
        <div>
          <p class="cast-date">${t(lang, 'castKicker')} · ${formatDate(lang)}</p>
          <h3>${cast.primary.name}</h3>
          ${state.question ? `<p class="cast-held">“${escapeText(state.question)}”</p>` : ''}
          ${state.restored ? `<p>${t(lang, 'castSaved')}</p>` : ''}
        </div>
      </header>
      <div class="cast-results">
        <div><p class="cast-label">${t(lang, 'castPrimary')}</p>${figureBlock(cast.primary, cast.lines, lang)}</div>
        <div><p class="cast-label">${t(lang, 'castChanged')}</p>${cast.changed ? figureBlock(cast.changed, changedFigures, lang) : `<article class="cast-fig is-empty"><p>${t(lang, 'castStill')}</p><p>${t(lang, 'castNoChange')}</p></article>`}</div>
      </div>
      ${moving}
      <section class="cast-nuclear"><p class="cast-label">${t(lang, 'castNuclear')}</p>${figureBlock(cast.nuclear, null, lang)}<p class="cast-note">${t(lang, 'castNuclearNote')}</p></section>
      <p class="cast-image-label">${t(lang, 'castImage')}</p>
      <p class="cast-tuan">${cast.primary.tuan}</p>
      <p class="cast-disclaimer">${t(lang, 'castDisclaimer')}</p>
      <button type="button" class="btn ghost cast-action" data-action="ai-cast">${t(lang, 'aiReading')}</button>
      <div class="reading-slot" data-reading-slot="cast"></div>
      <button type="button" class="btn ghost cast-action" data-action="reset">${t(lang, 'castAgain')}</button>`;
  }

  function bind() {
    root.querySelectorAll('[data-cast]').forEach((button) => {
      button.addEventListener('click', () => {
        state.mode = button.dataset.cast;
        paint();
      });
    });
    const question = root.querySelector('[name="question"]');
    question?.addEventListener('input', () => { state.question = question.value.slice(0, 80); });
    root.querySelector('[data-action="toss"]')?.addEventListener('click', toss);
    root.querySelector('[data-action="lot"]')?.addEventListener('click', () => {
      state.lot = drawLot();
      paint();
    });
    root.querySelector('[data-action="ai-daily"]')?.addEventListener('click', () => {
      const entry = dailyHexagram(new Date());
      askReading('daily', { primary: entry, moving: [], changed: null });
    });
    root.querySelector('[data-action="ai-cast"]')?.addEventListener('click', () => {
      if (state.lines.length === 6) askReading('cast', assemble(state.lines));
    });
    root.querySelector('[data-action="ai-lot"]')?.addEventListener('click', () => {
      if (state.lot) askReading('lot', { primary: state.lot, moving: [], changed: null });
    });
    root.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
      state.lines = [];
      state.latest = null;
      state.restored = false;
      state.question = '';
      try { localStorage.removeItem(STORAGE); } catch { /* ignore */ }
      paint();
    });
  }

  async function askReading(slot, cast) {
    const host = root.querySelector(`[data-reading-slot="${slot}"]`);
    if (!host) return;
    host.innerHTML = `<p class="cast-note">${t(state.lang, 'aiWaiting')}</p>`;
    const settings = readSettings(localStorage);
    const result = await createReading(hexagramFacts(cast), settings, { lang: state.lang });
    const badge = result.source === 'model' ? t(state.lang, 'aiModel') : t(state.lang, 'aiTemplate');
    const note = result.fallback ? `<p class="cast-note">${t(state.lang, 'aiFallback')}</p>` : '';
    host.innerHTML = `<article class="reading-card"><p class="eyebrow">${badge}</p>${note}<p>${escapeText(result.text)}</p></article><form class="ai-settings"><p>${t(state.lang, 'aiNote')}</p><label>${t(state.lang, 'aiEndpoint')}<input name="endpoint" type="url" value="${escapeAttr(settings.endpoint)}"></label><label>${t(state.lang, 'aiModelName')}<input name="model" value="${escapeAttr(settings.model)}"></label><label>${t(state.lang, 'aiKey')}<input name="apiKey" type="password" autocomplete="off"></label><button type="submit" class="btn ghost">${t(state.lang, 'aiSave')}</button></form>`;
    host.querySelector('form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.target);
      const previous = readSettings(localStorage);
      writeSettings({
        endpoint: data.get('endpoint'),
        model: data.get('model'),
        apiKey: String(data.get('apiKey') || '') || previous.apiKey,
      }, localStorage);
    });
  }

  function toss() {
    if (state.spinning || state.lines.length >= 6) return;
    const line = tossCoins();
    state.spinning = true;
    state.latest = line;
    paint();
    const wait = reduced ? 0 : 720;
    window.setTimeout(() => {
      state.lines = [...state.lines, line];
      state.spinning = false;
      state.restored = false;
      if (state.lines.length === 6) writeSaved(state.lines, state.question);
      paint();
    }, wait);
  }

  paint();
  return {
    setLanguage(lang) {
      state.lang = lang === 'en' ? 'en' : 'zh';
      paint();
    },
  };
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function escapeAttr(value) { return escapeText(value); }

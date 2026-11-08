import { createOracleTable } from './table.js';
import { CardAudio } from './audio.js';
import { createI18n } from './i18n.js';
import { drawCards } from './cards.js';
import './styles.css';

const audio = new CardAudio();

const reading = document.getElementById('reading');
const readingEmpty = document.getElementById('reading-empty');
const readingCard = document.getElementById('reading-card');
const toast = document.getElementById('toast');
let toastTimer = null;

function showToast(message) {
  toast.querySelector('span').textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2200);
}

function renderReading(card, flipped) {
  if (!card || !flipped) {
    readingCard.classList.add('hidden');
    readingEmpty.classList.remove('hidden');
    return;
  }
  const lang = i18n.lang;
  readingCard.querySelector('.reading-numeral').textContent = `${card.numeral} · ${i18n.t('upright')}`;
  readingCard.querySelector('.reading-name').textContent = lang === 'zh' ? card.zh : card.en;
  readingCard.querySelector('.reading-sub').textContent = lang === 'zh' ? card.en : card.zh;
  readingCard.querySelector('.reading-keywords').textContent = card.keywords[lang];
  readingEmpty.classList.add('hidden');
  readingCard.classList.remove('hidden');
}

const table = createOracleTable(document.getElementById('scene'), {
  audio,
  getLang: () => i18n.lang,
  onPick: renderReading,
});

const i18n = createI18n(() => {
  table.setLanguage();
  document.getElementById('lang-label').textContent = i18n.lang === 'zh' ? 'EN' : '中';
});
i18n.apply();
document.getElementById('lang-label').textContent = i18n.lang === 'zh' ? 'EN' : '中';

// first spread
table.deal(drawCards(3));

// tiny handle for the smoke tests (and future shortcuts)
window.__ORACLE__ = {
  flip: (i) => table.flipSlot(i),
  project: (i) => table.projectSlot(i),
  newDraw: () => table.newDraw(drawCards(3)),
};

// ---------- controls ----------
document.querySelectorAll('[data-action="language"]').forEach((btn) => {
  btn.addEventListener('click', () => i18n.toggle());
});

const soundButtons = document.querySelectorAll('[data-action="sound"]');
soundButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const on = await audio.toggle();
    if (!on && !audio.context) {
      showToast(i18n.t('soundUnavailable'));
      return;
    }
    soundButtons.forEach((b) => {
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('active', on);
    });
    showToast(i18n.t(on ? 'soundOn' : 'soundOff'));
  });
});

const drawButton = document.getElementById('new-draw');
drawButton.addEventListener('click', async () => {
  if (table.busy) return;
  drawButton.disabled = true;
  await table.newDraw(drawCards(3));
  showToast(i18n.t('drawAgain'));
  drawButton.disabled = false;
});

// hide the loading veil once the first frame is up
const loading = document.getElementById('loading');
const veil = () => {
  if (window.__SCENE_READY__) {
    loading.classList.add('done');
    document.getElementById('table-ui').classList.remove('hidden');
  } else {
    requestAnimationFrame(veil);
  }
};
veil();

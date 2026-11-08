import { createYiTable } from './scene.js';
import { YiAudio } from './audio.js';
import { createI18n, EN_NAMES, TRIGRAMS } from './i18n.js';
import HEXAGRAMS from './hexagrams.json';
import './styles.css';

const audio = new YiAudio();
const HEX_CODES = Object.keys(HEXAGRAMS);

// ---------- DOM ----------
const actionButton = document.getElementById('action');
const actionLabel = actionButton.querySelector('span');
const tossStatus = document.getElementById('toss-status');
const linesBox = document.getElementById('lines');
const panelHint = document.getElementById('panel-hint');
const result = document.getElementById('result');
const resultEyebrow = result.querySelector('.result-eyebrow');
const resultName = result.querySelector('.result-name');
const resultSub = result.querySelector('.result-sub');
const resultJudgment = result.querySelector('.result-judgment');
const resultTags = result.querySelector('.result-tags');
const resultMoving = result.querySelector('.result-moving');
const resultChanged = result.querySelector('.result-changed');
const questionInput = document.getElementById('question');
const toast = document.getElementById('toast');
let toastTimer = null;

function showToast(message) {
  toast.querySelector('span').textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2400);
}

// ---------- cast state ----------
let mode = 'coins';          // 'coins' | 'lot'
let tosses = [];             // six values: 6 老阴, 7 少阳, 8 少阴, 9 老阳
let lotCode = null;          // drawn hexagram code in lot mode
let busy = false;

const done = () => (mode === 'coins' ? tosses.length === 6 : lotCode !== null);
const currentCode = () => (mode === 'coins' && tosses.length === 6
  ? tosses.map((v) => (v === 7 || v === 9 ? '1' : '0')).join('')
  : lotCode);

// ---------- rendering ----------
function renderAction() {
  const key = mode === 'coins'
    ? (done() ? 'againCoins' : 'tossAction')
    : (done() ? 'againLot' : 'drawAction');
  actionLabel.textContent = i18n.t(key);
}

function renderStatus() {
  if (mode === 'coins') {
    tossStatus.textContent = done() ? '' : i18n.t('tossOf', tosses.length + 1);
  } else {
    tossStatus.textContent = '';
  }
}

function renderHint() {
  if (done()) {
    panelHint.classList.add('hidden');
    return;
  }
  panelHint.classList.remove('hidden');
  panelHint.textContent = i18n.t(mode === 'coins' ? 'castFirst' : 'drawFirst');
}

function lineNode(value) {
  const yang = value === 7 || value === 9;
  const moving = value === 6 || value === 9;
  const node = document.createElement('div');
  node.className = `hex-line ${yang ? 'yang' : 'yin'}`;
  const bars = document.createElement('span');
  bars.className = 'bars';
  if (yang) {
    bars.innerHTML = '<i class="bar"></i>';
  } else {
    bars.innerHTML = '<i class="bar half"></i><i class="bar half"></i>';
  }
  node.appendChild(bars);
  if (moving) {
    const mark = document.createElement('em');
    mark.className = 'mark';
    mark.textContent = value === 9 ? '○' : '×';
    node.appendChild(mark);
  }
  return node;
}

function addLine(value) {
  // the box stacks bottom-up (column-reverse): the first empty slot is the next yao
  const slot = linesBox.querySelector('.hex-line.empty');
  if (slot) slot.replaceWith(lineNode(value));
}

function trigramTag(code) {
  const up = TRIGRAMS[code.slice(3, 6)];
  const down = TRIGRAMS[code.slice(0, 3)];
  return i18n.lang === 'zh'
    ? i18n.t('trigramPair', `${up.zh}·${up.natureZh}`, `${down.zh}·${down.natureZh}`)
    : i18n.t('trigramPair', up.en, down.en);
}

function renderResult() {
  const code = currentCode();
  if (!code) return;
  const g = HEXAGRAMS[code];
  const zhName = g.name;
  const enName = EN_NAMES[zhName] || '';

  resultEyebrow.textContent = i18n.t('hexOriginal');
  resultName.textContent = i18n.lang === 'zh' ? zhName : enName;
  resultSub.textContent = i18n.lang === 'zh' ? enName : zhName;
  resultJudgment.textContent = g.judgment;
  resultTags.textContent = `${i18n.t('palace')} ${g.palace} · ${i18n.t('element')} ${g.element} · ${trigramTag(code)}`;

  if (mode === 'coins') {
    const moving = tosses.filter((v) => v === 6 || v === 9).length;
    resultMoving.textContent = moving ? i18n.t('movingLines', moving) : i18n.t('quietHex');
    if (moving) {
      const changedCode = tosses.map((v) => {
        if (v === 9) return '0';
        if (v === 6) return '1';
        return v === 7 ? '1' : '0';
      }).join('');
      const cg = HEXAGRAMS[changedCode];
      const changedName = i18n.lang === 'zh' ? cg.name : (EN_NAMES[cg.name] || cg.name);
      resultChanged.textContent = `${i18n.t('zhi')} ${changedName} — ${i18n.t('hexChanged')}`;
      resultChanged.classList.remove('hidden');
    } else {
      resultChanged.classList.add('hidden');
    }
  } else {
    resultMoving.textContent = i18n.t('quietHex');
    resultChanged.classList.add('hidden');
    // a drawn lot shows its six still lines in the panel
    linesBox.innerHTML = '';
    [...code].forEach((bit) => linesBox.appendChild(lineNode(bit === '1' ? 7 : 8)));
  }

  result.classList.remove('hidden');
  panelHint.classList.add('hidden');
}

function clearPanel() {
  linesBox.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const slot = document.createElement('div');
    slot.className = 'hex-line empty';
    slot.innerHTML = '<span class="bars"><i class="bar ghost"></i></span>';
    linesBox.appendChild(slot);
  }
  result.classList.add('hidden');
}

// ---------- flows ----------
async function doToss() {
  if (busy || mode !== 'coins') return;
  if (done()) { await resetFlow(); return; }
  busy = true;
  actionButton.disabled = true;
  const faces = [Math.random() < 0.5, Math.random() < 0.5, Math.random() < 0.5];
  await scene.toss(faces);
  const value = faces.reduce((sum, f) => sum + (f ? 3 : 2), 0); // 字面=3，背面=2 → 6/7/8/9
  tosses.push(value);
  addLine(value);
  if (done()) {
    renderResult();
    audio.reveal();
    showToast(i18n.t('toastDone'));
  }
  busy = false;
  actionButton.disabled = false;
  renderAction();
  renderStatus();
  renderHint();
}

async function doDraw() {
  if (busy || mode !== 'lot') return;
  if (done()) { await resetFlow(); return; }
  busy = true;
  actionButton.disabled = true;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  lotCode = HEX_CODES[buf[0] % HEX_CODES.length];
  await scene.drawLot(lotCode, HEXAGRAMS[lotCode].name);
  renderResult();
  showToast(i18n.t('toastDone'));
  busy = false;
  actionButton.disabled = false;
  renderAction();
  renderStatus();
  renderHint();
}

async function resetFlow() {
  if (mode === 'coins') {
    tosses = [];
    await scene.resetCoins();
  } else {
    lotCode = null;
    await scene.resetLot();
  }
  clearPanel();
  renderAction();
  renderStatus();
  renderHint();
}

async function switchMode(next) {
  if (busy || next === mode) return;
  busy = true;
  if (done()) {
    if (mode === 'coins') { tosses = []; await scene.resetCoins(); }
    else { lotCode = null; }
  }
  await scene.setMode(next);
  mode = next;
  clearPanel();
  document.querySelectorAll('[data-mode]').forEach((tab) => {
    const active = tab.getAttribute('data-mode') === mode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  document.getElementById('hint-tap').textContent = i18n.t(mode === 'coins' ? 'hintTapCoins' : 'hintTapCup');
  busy = false;
  renderAction();
  renderStatus();
  renderHint();
}

// ---------- scene ----------
const scene = createYiTable(document.getElementById('scene'), {
  audio,
  onCoinsTap: doToss,
  onCupTap: doDraw,
});

// ---------- i18n ----------
const i18n = createI18n(() => {
  document.getElementById('lang-label').textContent = i18n.lang === 'zh' ? 'EN' : '中';
  renderAction();
  renderStatus();
  renderHint();
  document.getElementById('hint-tap').textContent = i18n.t(mode === 'coins' ? 'hintTapCoins' : 'hintTapCup');
  if (done()) renderResult();
});
i18n.apply();
document.getElementById('lang-label').textContent = i18n.lang === 'zh' ? 'EN' : '中';
renderAction();
renderStatus();
renderHint();
clearPanel();

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

document.querySelectorAll('[data-mode]').forEach((tab) => {
  tab.addEventListener('click', () => switchMode(tab.getAttribute('data-mode')));
});

actionButton.addEventListener('click', () => (mode === 'coins' ? doToss() : doDraw()));

questionInput.value = window.localStorage.getItem('daora-yijing-question') || '';
questionInput.addEventListener('input', () => {
  window.localStorage.setItem('daora-yijing-question', questionInput.value);
});

// smoke-test hooks
window.__YIJING__ = {
  toss: doToss,
  draw: doDraw,
  reset: resetFlow,
  setMode: switchMode,
  projectCoin: (i) => scene.projectCoin(i),
  projectCup: () => scene.projectCup(),
  state: () => ({
    mode,
    tossCount: tosses.length,
    tosses: [...tosses],
    done: done(),
    resultName: done() ? HEXAGRAMS[currentCode()].name : null,
  }),
};

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

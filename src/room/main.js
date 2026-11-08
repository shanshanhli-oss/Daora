import './styles.css';
import { createHall } from './scene.js';
import { createI18n } from './i18n.js';
import { createRoomAudio } from './audio.js';

const i18n = createI18n();
const audio = createRoomAudio();

const GATE_URL = { divination: './yijing.html' };

let toastTimer = 0;
function toast(text) {
  const el = document.getElementById('toast');
  el.querySelector('span').textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

function enterGate(id) {
  if (GATE_URL[id]) {
    audio.enter();
    // brief pause so the chime is heard before navigation
    setTimeout(() => { window.location.href = GATE_URL[id]; }, 260);
  } else {
    audio.knock();
    toast(i18n.t('toastComing', { name: i18n.gateName(id) }));
  }
}

const hall = createHall(document.getElementById('scene'), { onGate: enterGate });

// ---------- chrome ----------
i18n.apply();

const soundBtn = document.querySelector('[data-action="sound"]');
function paintSound() {
  soundBtn.setAttribute('aria-pressed', String(audio.enabled));
  soundBtn.classList.toggle('muted', !audio.enabled);
}
paintSound();

document.querySelector('[data-action="language"]').addEventListener('click', () => {
  audio.tick();
  i18n.toggle();
});
soundBtn.addEventListener('click', () => {
  audio.toggle();
  paintSound();
  if (audio.enabled) audio.tick();
});

document.querySelectorAll('.gate-item').forEach((btn) => {
  btn.addEventListener('click', () => enterGate(btn.dataset.gate));
});

// ---------- reveal ----------
function reveal() {
  document.getElementById('loading').classList.add('done');
  document.getElementById('table-ui').classList.remove('hidden');
}
if (window.__SCENE_READY__) reveal();
else {
  const t0 = performance.now();
  (function wait() {
    if (window.__SCENE_READY__ || performance.now() - t0 > 4000) reveal();
    else requestAnimationFrame(wait);
  })();
}

// test / console hooks
window.__HALL__ = {
  enter: enterGate,
  project: (id) => hall.projectStation(id),
  debugCast: (x, y) => hall.debugCast(x, y),
  stations: hall.stationIds,
  toast,
};

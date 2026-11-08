import './landing.css';
document.documentElement.classList.add('has-js');
import { t } from './copy.js';
import { mountHero } from './hero.js';
import { mountZones } from './zones.js';
import { mountDivine } from './divine.js';
import { mountCosmos } from './cosmos.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

let lang = 'zh';
try {
  const saved = localStorage.getItem('daora-landing-lang');
  if (saved === 'en' || saved === 'zh') lang = saved;
} catch { /* ignore */ }

const divine = mountDivine($('#divine-root'), { reduced });
mountCosmos($('#cosmos'), { reduced });
let zones = null;
let hero = null;

function apply(next) {
  lang = next === 'en' ? 'en' : 'zh';
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  document.body.dataset.lang = lang;
  $$('[data-i18n]').forEach((element) => {
    element.textContent = t(lang, element.dataset.i18n);
  });
  const select = $('[name="tradition"]');
  if (select) {
    const value = select.value || '0';
    select.replaceChildren(...t(lang, 'traditions').map((label, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = label;
      return option;
    }));
    select.value = value;
  }
  $('[data-action="language"]')?.setAttribute('aria-label', t(lang, 'langLabel'));
  $('[data-action="heart"]')?.setAttribute('aria-label', t(lang, 'heartLabel'));
  $('#hero-mount')?.setAttribute('aria-label', t(lang, 'heroLabel'));
  $('.lang')?.querySelector('[data-lang="zh"]')?.classList.toggle('is-on', lang === 'zh');
  $('.lang')?.querySelector('[data-lang="en"]')?.classList.toggle('is-on', lang === 'en');
  divine.setLanguage(lang);
  try {
    localStorage.setItem('daora-landing-lang', lang);
    const raw = JSON.parse(localStorage.getItem('daora-sanctuary-v1') || '{}');
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      raw.language = lang;
      localStorage.setItem('daora-sanctuary-v1', JSON.stringify(raw));
    }
  } catch { /* ignore */ }
}

function openZone(id) {
  ensureZones();
  zones?.focus(id);
  const panel = $('#zone-panel');
  panel.hidden = false;
  $$('[data-zone-panel]').forEach((element) => { element.hidden = element.dataset.zonePanel !== id; });
  $$('[data-zone]').forEach((button) => {
    const on = button.dataset.zone === id;
    button.setAttribute('aria-selected', String(on));
    button.classList.toggle('is-on', on);
  });
  if (!reduced) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeZone() {
  $('#zone-panel').hidden = true;
  $$('[data-zone]').forEach((button) => {
    button.setAttribute('aria-selected', 'false');
    button.classList.remove('is-on');
  });
  zones?.focus('overview');
}

function ensureZones() {
  if (zones) return;
  const mount = $('#zone-mount');
  if (!mount) return;
  zones = mountZones(mount, {
    onSelect: openZone,
    onHover(id) {
      $$('[data-zone]').forEach((button) => button.classList.toggle('is-hot', Boolean(id) && button.dataset.zone === id));
    },
  });
}

function bind() {
  $('[data-action="language"]')?.addEventListener('click', () => apply(lang === 'zh' ? 'en' : 'zh'));
  $('[data-action="menu"]')?.addEventListener('click', (event) => {
    const open = event.currentTarget.getAttribute('aria-expanded') !== 'true';
    event.currentTarget.setAttribute('aria-expanded', String(open));
    $('#site-nav').classList.toggle('is-open', open);
    event.currentTarget.querySelector('span').textContent = t(lang, open ? 'closeMenu' : 'menu');
  });
  $$('#site-nav a').forEach((link) => link.addEventListener('click', () => {
    $('#site-nav').classList.remove('is-open');
    $('[data-action="menu"]')?.setAttribute('aria-expanded', 'false');
  }));

  const heart = $('[data-action="heart"]');
  const heartCount = $('#heart-count');
  let hearts = 0;
  try { hearts = Math.max(0, Number(localStorage.getItem('daora-landing-heart')) || 0); } catch { /* ignore */ }
  const paintHeart = () => {
    heartCount.textContent = String(hearts);
    heart.setAttribute('aria-pressed', hearts > 0 ? 'true' : 'false');
  };
  paintHeart();
  heart?.addEventListener('click', () => {
    hearts += 1;
    paintHeart();
    try { localStorage.setItem('daora-landing-heart', String(hearts)); } catch { /* ignore */ }
  });

  const toggle = $('[data-action="request-toggle"]');
  const form = $('#request-panel');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    form.hidden = !open;
  });
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const entry = {
      tradition: String(data.get('tradition') || '0'),
      note: String(data.get('note') || '').trim().slice(0, 400),
      at: new Date().toISOString(),
    };
    try {
      const list = JSON.parse(localStorage.getItem('daora-landing-interest') || '[]');
      const next = Array.isArray(list) ? list.slice(0, 19) : [];
      next.unshift(entry);
      localStorage.setItem('daora-landing-interest', JSON.stringify(next));
    } catch { /* ignore */ }
    $('#request-done').hidden = false;
    form.querySelector('textarea').value = '';
  });

  $$('[data-zone]').forEach((button) => button.addEventListener('click', () => openZone(button.dataset.zone)));
  $('[data-action="close-zone"]')?.addEventListener('click', closeZone);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !$('#zone-panel').hidden) closeZone();
  });

  const heroSection = $('.hero');
  const sticky = $('.sticky-cta');
  if (heroSection && sticky) {
    const watcher = new IntersectionObserver(([entry]) => {
      sticky.classList.toggle('is-on', !entry.isIntersecting);
    }, { threshold: 0.15 });
    watcher.observe(heroSection);
  }

  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('is-in'); });
  }, { threshold: 0.18 });
  $$('.reveal').forEach((element) => reveal.observe(element));

  const zoneSection = $('#zones');
  if (zoneSection) {
    const zoneWatcher = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        ensureZones();
        zoneWatcher.disconnect();
      }
    }, { rootMargin: '240px' });
    zoneWatcher.observe(zoneSection);
  }

  document.addEventListener('visibilitychange', () => {
    const hidden = document.hidden;
    hero?.setPaused(hidden);
    zones?.setPaused(hidden);
  });
}

apply(lang);
bind();
hero = mountHero($('#hero-mount'));
const heroWatch = new IntersectionObserver(([entry]) => hero?.setPaused(!entry.isIntersecting), { threshold: 0.05 });
heroWatch.observe($('.hero'));

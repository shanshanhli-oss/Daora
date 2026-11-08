/** Card faces and backs are drawn on canvas at runtime — no image downloads, fully local. */

export const CARD_W = 512;
export const CARD_H = 864;

const SERIF = '"Noto Serif CJK SC", "Songti SC", "STSong", "SimSun", Georgia, serif';
const GOLD = '#c7aa75';
const GOLD_DIM = 'rgba(199, 170, 117, .55)';
const GOLD_FAINT = 'rgba(199, 170, 117, .28)';

function makeCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  return canvas;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A quiet geometric seal: concentric ring, diamond and eight rays. */
function drawSeal(ctx, cx, cy, radius, alpha) {
  ctx.save();
  ctx.strokeStyle = `rgba(199, 170, 117, ${alpha})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath(); // diamond
  ctx.moveTo(cx, cy - radius * 0.72);
  ctx.lineTo(cx + radius * 0.72, cy);
  ctx.lineTo(cx, cy + radius * 0.72);
  ctx.lineTo(cx - radius * 0.72, cy);
  ctx.closePath();
  ctx.stroke();
  for (let i = 0; i < 8; i++) { // rays
    const a = (Math.PI / 4) * i + Math.PI / 8;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * radius * 0.78, cy + Math.sin(a) * radius * 0.78);
    ctx.lineTo(cx + Math.cos(a) * radius * 0.94, cy + Math.sin(a) * radius * 0.94);
    ctx.stroke();
  }
  ctx.beginPath(); // center dot
  ctx.fillStyle = `rgba(223, 197, 145, ${alpha})`;
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

let backCanvas = null;

/** Deep plum back with a gold seal — one shared canvas for every card. */
export function drawCardBack() {
  if (backCanvas) return backCanvas;
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(CARD_W / 2, CARD_H / 2, 60, CARD_W / 2, CARD_H / 2, CARD_H * 0.72);
  g.addColorStop(0, '#2c2129');
  g.addColorStop(1, '#1c151b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 3;
  roundRect(ctx, 18, 18, CARD_W - 36, CARD_H - 36, 22);
  ctx.stroke();
  ctx.strokeStyle = GOLD_FAINT;
  ctx.lineWidth = 1.5;
  roundRect(ctx, 32, 32, CARD_W - 64, CARD_H - 64, 14);
  ctx.stroke();

  drawSeal(ctx, CARD_W / 2, CARD_H / 2, 150, 0.9);
  drawSeal(ctx, CARD_W / 2, 108, 34, 0.5);
  drawSeal(ctx, CARD_W / 2, CARD_H - 108, 34, 0.5);

  ctx.fillStyle = GOLD_FAINT;
  ctx.font = `600 22px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(CARD_W / 2, CARD_H - 62);
  ctx.fillText('D A O R A', 0, 0);
  ctx.restore();

  backCanvas = canvas;
  return canvas;
}

const faceCache = new Map();

/**
 * Minimal editorial face: ivory ground, thin gold frame, numeral,
 * the card's name, a hairline ornament and three quiet keywords.
 */
export function drawCardFace(card, lang) {
  const key = `${card.id}:${lang}`;
  if (faceCache.has(key)) return faceCache.get(key);
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 0, CARD_H);
  g.addColorStop(0, '#ece1c8');
  g.addColorStop(1, '#ddd0b2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.strokeStyle = 'rgba(140, 118, 84, .8)';
  ctx.lineWidth = 3;
  roundRect(ctx, 20, 20, CARD_W - 40, CARD_H - 40, 20);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(140, 118, 84, .4)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 34, 34, CARD_W - 68, CARD_H - 68, 12);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#8c7654';
  ctx.font = `600 30px ${SERIF}`;
  ctx.fillText(card.numeral, CARD_W / 2, 92);

  drawSeal(ctx, CARD_W / 2, 200, 46, 0.45);

  const isZh = lang === 'zh';
  const name = isZh ? card.zh : card.en;
  ctx.fillStyle = '#3a2c24';
  if (isZh) {
    ctx.font = `600 ${name.length > 3 ? 92 : 116}px ${SERIF}`;
    ctx.fillText(name, CARD_W / 2, CARD_H / 2 + 48);
  } else {
    ctx.font = `600 54px ${SERIF}`;
    const words = name.split(' ');
    const lines = words.length > 2 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [name];
    lines.forEach((line, i) => ctx.fillText(line, CARD_W / 2, CARD_H / 2 + 8 + i * 66));
  }

  // hairline ornament
  ctx.strokeStyle = 'rgba(140, 118, 84, .6)';
  ctx.lineWidth = 1.5;
  const oy = CARD_H * 0.68;
  ctx.beginPath();
  ctx.moveTo(CARD_W / 2 - 110, oy);
  ctx.lineTo(CARD_W / 2 - 16, oy);
  ctx.moveTo(CARD_W / 2 + 16, oy);
  ctx.lineTo(CARD_W / 2 + 110, oy);
  ctx.stroke();
  ctx.save();
  ctx.translate(CARD_W / 2, oy);
  ctx.rotate(Math.PI / 4);
  ctx.strokeRect(-7, -7, 14, 14);
  ctx.restore();

  ctx.fillStyle = '#5a4a36';
  ctx.font = `600 ${isZh ? 30 : 24}px ${SERIF}`;
  ctx.fillText(card.keywords[lang], CARD_W / 2, CARD_H - 118);

  ctx.fillStyle = 'rgba(140, 118, 84, .75)';
  ctx.font = `600 20px ${SERIF}`;
  ctx.fillText('D A O R A', CARD_W / 2, CARD_H - 66);

  faceCache.set(key, canvas);
  return canvas;
}

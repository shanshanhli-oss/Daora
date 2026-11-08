import * as T from 'three';

export const maxAniso = (r) => Math.min(8, r.capabilities.getMaxAnisotropy());

function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function toTex(c, r, srgb = true) {
  const t = new T.CanvasTexture(c);
  if (srgb) t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = maxAniso(r);
  return t;
}

export function makeCoinFace(renderer) {
  const c = cnv(512, 512), x = c.getContext('2d');
  const g = x.createRadialGradient(256, 236, 60, 256, 256, 256);
  g.addColorStop(0, '#d9bc85'); g.addColorStop(0.55, '#c7a264'); g.addColorStop(1, '#8a6a3a');
  x.fillStyle = g; x.beginPath(); x.arc(256, 256, 256, 0, 7); x.fill();
  x.strokeStyle = 'rgba(90,62,26,.55)'; x.lineWidth = 10;
  x.beginPath(); x.arc(256, 256, 240, 0, 7); x.stroke();
  x.fillStyle = '#241708'; x.fillRect(206, 206, 100, 100);
  x.strokeStyle = 'rgba(90,62,26,.8)'; x.lineWidth = 6; x.strokeRect(206, 206, 100, 100);
  x.fillStyle = 'rgba(56,36,12,.92)';
  x.font = '600 74px "Noto Serif CJK SC","Songti SC",serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('道', 256, 96); x.fillText('法', 416, 260); x.fillText('自', 256, 424); x.fillText('然', 96, 260);
  return toTex(c, renderer);
}

export function makeScrollFace(renderer) {
  const c = cnv(512, 1024), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 1024);
  g.addColorStop(0, '#d9c9a3'); g.addColorStop(0.5, '#cdbb92'); g.addColorStop(1, '#b7a277');
  x.fillStyle = g; x.fillRect(0, 0, 512, 1024);
  x.fillStyle = '#7d5f33'; x.fillRect(0, 0, 512, 66); x.fillRect(0, 958, 512, 66);
  x.strokeStyle = 'rgba(125,95,51,.85)'; x.lineWidth = 6; x.strokeRect(20, 84, 472, 856);
  x.strokeStyle = 'rgba(125,95,51,.4)'; x.lineWidth = 2; x.strokeRect(34, 98, 444, 828);
  x.fillStyle = 'rgba(74,50,22,.94)';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '600 150px "Noto Serif CJK SC","Songti SC",serif';
  x.fillText('命', 256, 300); x.fillText('盘', 256, 480);
  x.font = '400 44px "Noto Serif CJK SC","Songti SC",serif';
  x.fillStyle = 'rgba(74,50,22,.72)';
  x.fillText('八 字 · 紫 微', 256, 640);
  x.strokeStyle = 'rgba(122,44,32,.9)'; x.lineWidth = 5;
  x.strokeRect(196, 742, 120, 120);
  x.fillStyle = 'rgba(122,44,32,.92)';
  x.font = '600 76px "Noto Serif CJK SC","Songti SC",serif';
  x.fillText('命', 256, 806);
  return toTex(c, renderer);
}

const GUA = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷']; // 乾兑离震巽坎艮坤

export function makeCompassFace(renderer) {
  const c = cnv(1024, 1024), x = c.getContext('2d');
  const cx = 512, cy = 512;
  const g = x.createRadialGradient(cx, cy, 60, cx, cy, 512);
  g.addColorStop(0, '#2a2118'); g.addColorStop(0.7, '#241c14'); g.addColorStop(1, '#191310');
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 512, 0, 7); x.fill();
  x.strokeStyle = '#c7aa75'; x.lineWidth = 8;
  x.beginPath(); x.arc(cx, cy, 496, 0, 7); x.stroke();
  x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, 380, 0, 7); x.stroke();
  // degree ticks
  x.strokeStyle = 'rgba(199,170,117,.5)'; x.lineWidth = 2;
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const r1 = i % 9 === 0 ? 452 : 468;
    x.beginPath();
    x.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    x.lineTo(cx + Math.cos(a) * 488, cy + Math.sin(a) * 488);
    x.stroke();
  }
  // eight trigrams
  x.fillStyle = '#dfc591';
  x.font = '600 92px "Noto Serif CJK SC","Songti SC",serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI * 2;
    x.save();
    x.translate(cx + Math.cos(a) * 315, cy + Math.sin(a) * 315);
    x.rotate(a + Math.PI / 2);
    x.fillText(GUA[i], 0, 0);
    x.restore();
  }
  // taiji
  const R = 170;
  x.save();
  x.beginPath(); x.arc(cx, cy, R, 0, 7); x.clip();
  x.fillStyle = '#e8ddc9'; x.fillRect(cx - R, cy - R, R * 2, R * 2);
  x.fillStyle = '#1c1613';
  x.beginPath(); x.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2); x.fill();
  x.beginPath(); x.arc(cx, cy - R / 2, R / 2, 0, 7); x.fill();
  x.fillStyle = '#e8ddc9';
  x.beginPath(); x.arc(cx, cy + R / 2, R / 2, 0, 7); x.fill();
  x.fillStyle = '#e8ddc9'; x.beginPath(); x.arc(cx, cy - R / 2, R / 9, 0, 7); x.fill();
  x.fillStyle = '#1c1613'; x.beginPath(); x.arc(cx, cy + R / 2, R / 9, 0, 7); x.fill();
  x.restore();
  x.strokeStyle = '#c7aa75'; x.lineWidth = 5;
  x.beginPath(); x.arc(cx, cy, R, 0, 7); x.stroke();
  return toTex(c, renderer);
}

export function makeCenserBand(renderer) {
  const c = cnv(512, 256), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#6d5636'); g.addColorStop(0.45, '#4c3a24'); g.addColorStop(1, '#33261a');
  x.fillStyle = g; x.fillRect(0, 0, 512, 256);
  x.strokeStyle = 'rgba(223,197,145,.75)'; x.lineWidth = 4;
  x.beginPath(); x.moveTo(0, 30); x.lineTo(512, 30); x.stroke();
  x.beginPath(); x.moveTo(0, 226); x.lineTo(512, 226); x.stroke();
  // meander band
  x.lineWidth = 5; x.strokeStyle = 'rgba(223,197,145,.55)';
  const s = 44;
  for (let bx = 8; bx < 512; bx += 64) {
    x.beginPath();
    x.moveTo(bx, 128); x.lineTo(bx + s, 128); x.lineTo(bx + s, 88);
    x.lineTo(bx + 12, 88); x.lineTo(bx + 12, 112); x.lineTo(bx + 32, 112);
    x.stroke();
  }
  return toTex(c, renderer);
}

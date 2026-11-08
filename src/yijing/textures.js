/** Canvas textures for the yi jing table: bronze coins, bamboo lot cup, lot sticks. */

const SERIF = '"Noto Serif CJK SC","Songti SC","STSong","SimSun",Georgia,serif';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

/** One coin face, 256×256. kind 'face' carries 道法自然 around the square hole, 'back' is plain. */
export function drawCoinFace(kind) {
  const [c, g] = canvas(256, 256);
  const cx = 128, cy = 128, R = 122;

  const grad = g.createRadialGradient(cx - 30, cy - 34, 20, cx, cy, R);
  grad.addColorStop(0, '#c99e63');
  grad.addColorStop(0.55, '#a87f4b');
  grad.addColorStop(1, '#7d5c34');
  g.fillStyle = grad;
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();

  // rim
  g.strokeStyle = 'rgba(70, 48, 24, .85)';
  g.lineWidth = 7;
  g.beginPath(); g.arc(cx, cy, R - 5, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(255, 226, 170, .35)';
  g.lineWidth = 2;
  g.beginPath(); g.arc(cx, cy, R - 11, 0, Math.PI * 2); g.stroke();

  // square hole
  const s = 27;
  g.fillStyle = '#241811';
  g.fillRect(cx - s, cy - s, s * 2, s * 2);
  g.strokeStyle = 'rgba(255, 226, 170, .4)';
  g.lineWidth = 2.5;
  g.strokeRect(cx - s, cy - s, s * 2, s * 2);

  if (kind === 'face') {
    g.fillStyle = '#3d2a15';
    g.font = `600 44px ${SERIF}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('道', cx, cy - 62);
    g.fillText('法', cx + 62, cy);
    g.fillText('自', cx, cy + 62);
    g.fillText('然', cx - 62, cy);
  } else {
    // plain back: two faint crescents, as on old cash coins
    g.strokeStyle = 'rgba(61, 42, 21, .55)';
    g.lineWidth = 5;
    g.beginPath(); g.arc(cx - 62, cy, 16, Math.PI * 0.4, Math.PI * 1.5); g.stroke();
    g.beginPath(); g.arc(cx + 62, cy, 16, -Math.PI * 0.5, Math.PI * 0.6); g.stroke();
  }
  return c;
}

/** Wrap texture for the lot cup: vertical bamboo slats held by two dark cords. */
export function drawCupSide() {
  const [c, g] = canvas(512, 256);
  g.fillStyle = '#a2794a';
  g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 16; i++) {
    const x = i * 32;
    const tone = 150 + ((i * 37) % 5) * 9;
    g.fillStyle = `rgb(${tone}, ${tone - 38}, ${tone - 84})`;
    g.fillRect(x + 1, 0, 30, 256);
    g.fillStyle = 'rgba(60, 40, 20, .5)';
    g.fillRect(x, 0, 2, 256);
    g.fillStyle = 'rgba(255, 230, 180, .14)';
    g.fillRect(x + 3, 0, 3, 256);
  }
  // cords
  for (const y of [52, 196]) {
    g.fillStyle = '#4a2f1d';
    g.fillRect(0, y - 9, 512, 18);
    g.fillStyle = 'rgba(255, 220, 170, .18)';
    g.fillRect(0, y - 9, 512, 3);
  }
  return c;
}

/** A single lot stick: bamboo body, the hexagram's six lines near the top, name written downward. */
export function drawStick(code, name) {
  const [c, g] = canvas(128, 512);
  const grad = g.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0, '#b78f5d');
  grad.addColorStop(0.5, '#d3ac74');
  grad.addColorStop(1, '#a87f4f');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 512);
  g.fillStyle = 'rgba(70, 45, 22, .35)';
  g.fillRect(0, 0, 6, 512);
  g.fillRect(122, 0, 6, 512);

  // hexagram lines — top line of the drawing is the top yao
  const barW = 76, barH = 12, gap = 15, x0 = (128 - barW) / 2;
  g.fillStyle = '#43290f';
  for (let i = 0; i < 6; i++) {
    const yang = code[5 - i] === '1';
    const y = 34 + i * (barH + gap);
    if (yang) {
      g.fillRect(x0, y, barW, barH);
    } else {
      g.fillRect(x0, y, barW / 2 - 7, barH);
      g.fillRect(x0 + barW / 2 + 7, y, barW / 2 - 7, barH);
    }
  }

  // name, written downward
  g.font = `600 34px ${SERIF}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  [...name].forEach((ch, i) => g.fillText(ch, 64, 218 + i * 44));
  return c;
}

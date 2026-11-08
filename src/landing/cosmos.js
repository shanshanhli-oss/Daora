/** A fixed canvas of stars, a gold nebula, and drifting motes. Still when motion is reduced. */
export function mountCosmos(canvas, { reduced = false } = {}) {
  if (!canvas) return { destroy() {} };
  const ctx = canvas.getContext('2d');
  const stars = Array.from({ length: 180 }, (_, index) => ({
    x: (index * 47) % 1000 / 1000,
    y: (index * 83) % 1000 / 1000,
    r: (index % 5) * 0.35 + 0.4,
    a: 0.35 + (index % 7) * 0.08,
    tw: index % 11,
  }));
  const motes = Array.from({ length: 48 }, (_, index) => ({
    x: (index * 0.137) % 1,
    y: (index * 0.073) % 1,
    s: 0.15 + (index % 4) * 0.08,
    p: index,
  }));
  let frame = 0;
  let alive = true;

  function resize() {
    const rect = canvas.parentElement?.getBoundingClientRect();
    const width = Math.max(1, rect?.width || window.innerWidth);
    const height = Math.max(1, rect?.height || window.innerHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  function paint(now) {
    if (!alive) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    const nebula = ctx.createRadialGradient(width * 0.72, height * 0.28, 10, width * 0.72, height * 0.28, width * 0.45);
    nebula.addColorStop(0, 'rgba(212, 168, 74, 0.28)');
    nebula.addColorStop(0.4, 'rgba(120, 78, 24, 0.12)');
    nebula.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, width, height);
    const cool = ctx.createRadialGradient(width * 0.18, height * 0.72, 8, width * 0.18, height * 0.72, width * 0.32);
    cool.addColorStop(0, 'rgba(88, 104, 170, 0.16)');
    cool.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cool;
    ctx.fillRect(0, 0, width, height);
    const time = reduced ? 0 : now / 1000;
    for (const star of stars) {
      const flicker = reduced ? star.a : star.a * (0.65 + 0.35 * Math.sin(time * 1.4 + star.tw));
      ctx.fillStyle = `rgba(251, 245, 183, ${flicker})`;
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.r * (width / 1400), 0, Math.PI * 2);
      ctx.fill();
    }
    for (const mote of motes) {
      const y = reduced ? mote.y : (mote.y + time * mote.s * 0.03) % 1;
      const x = mote.x + (reduced ? 0 : Math.sin(time * 0.35 + mote.p) * 0.02);
      ctx.fillStyle = 'rgba(251, 230, 160, 0.75)';
      ctx.fillRect(x * width, y * height, 1.6, 6);
    }
    if (!reduced) frame = requestAnimationFrame(paint);
  }

  resize();
  paint(0);
  const onResize = () => { resize(); if (reduced) paint(0); };
  window.addEventListener('resize', onResize);
  return {
    destroy() {
      alive = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    },
  };
}

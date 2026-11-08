/** Small synth for the hall: hover tick, enter chime, coming-soon knock. */
export function createRoomAudio() {
  let ctx = null;
  let enabled = localStorage.getItem('daora-oracle-sound') !== 'off';

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone({ freq = 440, dur = 0.18, type = 'sine', gain = 0.05, when = 0, glide = 0 }) {
    if (!enabled) return;
    const c = ac();
    const t0 = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + glide), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  return {
    tick() { tone({ freq: 1180, dur: 0.06, gain: 0.02 }); },
    enter() {
      tone({ freq: 523, dur: 0.4, gain: 0.05 });
      tone({ freq: 784, dur: 0.5, gain: 0.04, when: 0.08 });
      tone({ freq: 1047, dur: 0.6, gain: 0.03, when: 0.16 });
    },
    knock() {
      tone({ freq: 240, dur: 0.12, type: 'triangle', gain: 0.06 });
      tone({ freq: 180, dur: 0.16, type: 'triangle', gain: 0.05, when: 0.1 });
    },
    toggle() {
      enabled = !enabled;
      localStorage.setItem('daora-oracle-sound', enabled ? 'on' : 'off');
      return enabled;
    },
    get enabled() { return enabled; },
  };
}

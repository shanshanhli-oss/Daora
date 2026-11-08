/** Pentatonic pluck. 宫商角徵羽, plus the octave of 宫. No sample file. */
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

export function pluckPentatonic(context, destination, { degree = 0, when } = {}) {
  const now = when ?? context.currentTime;
  const freq = SCALE[((degree % SCALE.length) + SCALE.length) % SCALE.length];
  const osc = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1800, now);
  filter.frequency.exponentialRampToValueAtTime(420, now + 1.2);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  osc.start(now);
  osc.stop(now + 1.7);
  return osc;
}

export function pluckPhrase(context, destination) {
  [0, 2, 4, 2, 1, 0].forEach((degree, index) => {
    pluckPentatonic(context, destination, { degree, when: context.currentTime + index * 0.26 });
  });
}

export function strikeBowl(context, destination) {
  const now = context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(196, now);
  osc.frequency.exponentialRampToValueAtTime(188, now + 3.2);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(now);
  osc.stop(now + 3.5);
}

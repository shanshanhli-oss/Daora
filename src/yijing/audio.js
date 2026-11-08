/** Fully synthesised yi jing sounds — coin metal, bamboo rattle, soft bells. No audio files. */
export class YiAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.enabled = false;
  }

  async ensure() {
    if (this.context) return true;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return false;
    this.context = new Context();
    this.master = this.context.createGain();
    this.master.gain.value = 0.5;
    const compressor = this.context.createDynamicsCompressor();
    this.master.connect(compressor);
    compressor.connect(this.context.destination);
    return true;
  }

  async toggle() {
    if (!(await this.ensure())) return false;
    await this.context.resume();
    this.enabled = !this.enabled;
    if (this.enabled) this.chime();
    return this.enabled;
  }

  /** Confirmation bell when sound is switched on. */
  chime() {
    if (!this.enabled || !this.context) return;
    const ctx = this.context, now = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    osc.connect(gain); gain.connect(this.master);
    osc.start(now); osc.stop(now + 1.5);
  }

  /** A coin ringing as it leaves the hand — a few inharmonic metal partials. */
  clink(delay = 0) {
    if (!this.enabled || !this.context) return;
    const ctx = this.context, now = ctx.currentTime + delay;
    [4186, 5637, 7902].forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * (0.98 + Math.random() * 0.04), now);
      gain.gain.setValueAtTime(0.028 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc.connect(gain); gain.connect(this.master);
      osc.start(now); osc.stop(now + 0.2);
    });
  }

  /** A coin landing on wood — low, short thud. */
  thock(delay = 0) {
    if (!this.enabled || !this.context) return;
    const ctx = this.context, now = ctx.currentTime + delay;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    osc.connect(gain); gain.connect(this.master);
    osc.start(now); osc.stop(now + 0.13);
  }

  /** Bamboo sticks knocking inside the shaking cup. */
  rattle() {
    if (!this.enabled || !this.context) return;
    for (let i = 0; i < 6; i++) {
      const delay = i * 0.07 + Math.random() * 0.03;
      const ctx = this.context, now = ctx.currentTime + delay;
      const length = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < length; j++) data[j] = (Math.random() * 2 - 1) * (1 - j / length);
      const src = ctx.createBufferSource(); src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1500 + Math.random() * 900;
      filter.Q.value = 2.4;
      const gain = ctx.createGain(); gain.gain.value = 0.22;
      src.connect(filter); filter.connect(gain); gain.connect(this.master);
      src.start(now);
    }
  }

  /** Two soft bells when the hexagram is revealed. */
  reveal() {
    if (!this.enabled || !this.context) return;
    const ctx = this.context, now = ctx.currentTime;
    [523.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      const t0 = now + i * 0.22;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.045, t0 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
      osc.connect(gain); gain.connect(this.master);
      osc.start(t0); osc.stop(t0 + 1.7);
    });
  }
}

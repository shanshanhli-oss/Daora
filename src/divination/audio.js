/** Fully synthesised card-table sounds — no audio downloads, same approach as the room ambience. */
export class CardAudio {
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

  /** Short confirmation bell when sound is switched on. */
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

  /** A card sliding across felt: brief band-passed noise. */
  slide() {
    if (!this.enabled || !this.context) return;
    const ctx = this.context, now = ctx.currentTime;
    const length = ctx.sampleRate * 0.22;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const src = ctx.createBufferSource(); src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + 0.2);
    filter.Q.value = 0.9;
    const gain = ctx.createGain(); gain.gain.value = 0.16;
    src.connect(filter); filter.connect(gain); gain.connect(this.master);
    src.start(now);
  }

  /** A soft tap as a card settles. */
  tap() {
    if (!this.enabled || !this.context) return;
    const ctx = this.context, now = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(gain); gain.connect(this.master);
    osc.start(now); osc.stop(now + 0.14);
  }

  /** The turning moment of a flip — a low, warm thud. */
  flip() {
    if (!this.enabled || !this.context) return;
    this.slide();
    const ctx = this.context, now = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now + 0.18);
    gain.gain.setValueAtTime(0, now + 0.18);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc.connect(gain); gain.connect(this.master);
    osc.start(now + 0.18); osc.stop(now + 0.55);
  }

  /** A little run of taps while the deck is shuffled. */
  shuffle() {
    if (!this.enabled || !this.context) return;
    for (let i = 0; i < 5; i++) {
      window.setTimeout(() => this.tap(), i * 70);
    }
  }
}

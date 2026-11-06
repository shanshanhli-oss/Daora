/** A quiet, fully synthesised room ambience. No audio download, microphone or tracking. */
export class AmbientAudio {
  constructor() {this.context=null;this.master=null;this.sources=[];this.enabled=false;this.timer=null;}
  async toggle() {
    if(!this.context)await this.create();
    if(!this.context)return false;
    if(this.enabled){await this.stop();return false;}
    await this.context.resume();
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setTargetAtTime(.11,this.context.currentTime,.65);
    this.enabled=true;
    this.timer=window.setInterval(()=>this.chime(),16000);
    this.chime();return true;
  }
  async create() {
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)throw new Error('Web Audio unavailable');
    this.context=new Context();
    const ctx=this.context;
    this.master=ctx.createGain();this.master.gain.value=0;
    const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-24;compressor.ratio.value=4;
    this.master.connect(compressor);compressor.connect(ctx.destination);
    // Filtered wind gives a broad, unobtrusive background, not loud static.
    const length=ctx.sampleRate*5;
    const buffer=ctx.createBuffer(1,length,ctx.sampleRate),samples=buffer.getChannelData(0);
    let last=0;
    for(let i=0;i<length;i++){last=(last+.024*(Math.random()*2-1))/1.024;samples[i]=last*3;}
    const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
    const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=330;low.Q.value=.4;
    const noiseGain=ctx.createGain();noiseGain.gain.value=.29;
    noise.connect(low);low.connect(noiseGain);noiseGain.connect(this.master);noise.start();this.sources.push(noise);
    // Two near-silent sine tones introduce a warm meditative harmonic bed.
    for(const [frequency,volume] of [[174.61,.055],[261.63,.025]]) {
      const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=frequency;gain.gain.value=volume;
      osc.connect(gain);gain.connect(this.master);osc.start();this.sources.push(osc);
    }
  }
  chime() {
    if(!this.enabled||!this.context)return;
    const ctx=this.context,now=ctx.currentTime;
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type='sine';osc.frequency.setValueAtTime(523.25,now);osc.frequency.exponentialRampToValueAtTime(522.5,now+4);
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.045,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+5);
    osc.connect(gain);gain.connect(this.master);osc.start(now);osc.stop(now+5.1);
  }
  async stop() {
    if(!this.context)return;
    clearInterval(this.timer);this.enabled=false;
    this.master.gain.cancelScheduledValues(this.context.currentTime);this.master.gain.setTargetAtTime(0,this.context.currentTime,.3);
  }
}

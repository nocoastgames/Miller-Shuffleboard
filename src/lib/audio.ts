import { useStore } from '../store';

class RetroAudioEngine {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  isPlayingBgm = false;
  rollSource: AudioBufferSourceNode | null = null;
  rollGain: GainNode | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      
      // Sync initial volume
      const state = useStore.getState();
      this.setVolume(state.masterVolume);
      
      // Subscribe to volume changes
      useStore.subscribe((state) => {
         this.setVolume(state.masterVolume);
      });
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      // Use smooth ramp to prevent clicking
      this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
    }
  }

  playBGM() {
    if (!this.ctx) this.init();
    if (this.isPlayingBgm || !this.ctx || !this.masterGain) return;
    this.isPlayingBgm = true;

    const ctx = this.ctx;
    
    // Ocean Waves (Pink-ish noise + LFO filter)
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300; 
    
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15; // Slow rolling waves
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 600; 
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const mainGain = ctx.createGain();
    mainGain.gain.value = 0.15; // Soft background volume

    noise.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(this.masterGain);
    
    noise.start();
    lfo.start();

    // Scheduling Seagulls
    const scheduleSeagull = () => {
       if(!this.isPlayingBgm) return;
       setTimeout(() => {
          this.playSeagull();
          scheduleSeagull();
       }, 5000 + Math.random() * 10000);
    };
    scheduleSeagull();
  }

  playSeagull() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    // Seagulls go high to low pitch briefly
    osc.frequency.setValueAtTime(800 + Math.random()*200, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.5);
    
    // They often caw in groups
    if(Math.random() > 0.4) {
       setTimeout(() => this.playSeagull(), 400 + Math.random()*400);
    }
  }

  startRoll() {
    if (!this.ctx) this.init();
    if (!this.ctx || !this.masterGain || this.rollSource) return;
    const ctx = this.ctx;

    // Creates a gritty "sand/wax sliding on wood" sound
    const bufferSize = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
       // Brown noise approximation for deeper grit
      data[i] = (Math.random() * 2 - 1) * 0.5 + (i > 0 ? data[i-1] * 0.5 : 0);
    }

    this.rollSource = ctx.createBufferSource();
    this.rollSource.buffer = buffer;
    this.rollSource.loop = true;

    // Highpass to remove bass mud, lowpass to remove static hiss
    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 800;

    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.value = 3000;

    this.rollGain = ctx.createGain();
    this.rollGain.gain.setValueAtTime(0, ctx.currentTime);
    this.rollGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.1); // Quick fade in

    this.rollSource.connect(hpFilter);
    hpFilter.connect(lpFilter);
    lpFilter.connect(this.rollGain);
    this.rollGain.connect(this.masterGain);

    this.rollSource.start();
  }

  stopRoll() {
    if (this.rollSource && this.rollGain && this.ctx) {
      this.rollGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
      setTimeout(() => {
        if (this.rollSource) {
          this.rollSource.stop();
          this.rollSource.disconnect();
          this.rollSource = null;
        }
      }, 100);
    }
  }

  playBump(impactVelocity: number) {
     if (!this.ctx) this.init();
     if (!this.ctx || !this.masterGain || impactVelocity < 0.5) return;
     const ctx = this.ctx;
     
     // Cap max volume impact
     const vol = Math.min(impactVelocity * 0.1, 0.8);

     // Wooden thwack (triangle wave pop)
     const osc = ctx.createOscillator();
     osc.type = 'triangle';
     osc.frequency.setValueAtTime(800, ctx.currentTime);
     osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

     const gain = ctx.createGain();
     gain.gain.setValueAtTime(vol, ctx.currentTime);
     gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

     osc.connect(gain);
     gain.connect(this.masterGain);
     osc.start();
     osc.stop(ctx.currentTime + 0.1);
     
     // Tiny bit of crunch noise for the hard impact layer
     const bufferSize = ctx.sampleRate * 0.05;
     const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
     const data = buffer.getChannelData(0);
     for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
     const noise = ctx.createBufferSource();
     noise.buffer = buffer;
     const noiseFilter = ctx.createBiquadFilter();
     noiseFilter.type = 'highpass';
     noiseFilter.frequency.value = 1000;
     const noiseGain = ctx.createGain();
     noiseGain.gain.setValueAtTime(vol * 0.5, ctx.currentTime);
     noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

     noise.connect(noiseFilter);
     noiseFilter.connect(noiseGain);
     noiseGain.connect(this.masterGain);
     noise.start();
  }
}

export const audioEngine = new RetroAudioEngine();

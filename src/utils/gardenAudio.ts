// 100% Procedural Web Audio Nature Soundscape for the Living 3D Garden
// Synthesizes gentle filtered breeze, time-of-day birdsong or nocturnal crickets, and soft wind chimes.

export type ResolvedGardenMood = 'morning' | 'afternoon' | 'evening' | 'night';

interface GardenAudioState {
  playing: boolean;
  mood: ResolvedGardenMood;
}

class ProceduralGardenAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private creatureTimer: number | null = null;
  private playing = false;
  private mood: ResolvedGardenMood = 'afternoon';
  private listeners = new Set<() => void>();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  getState(): GardenAudioState {
    return { playing: this.playing, mood: this.mood };
  }

  setMood(nextMood: ResolvedGardenMood) {
    if (this.mood === nextMood) return;
    this.mood = nextMood;
    if (this.windFilter && this.ctx) {
      const targetFreq =
        nextMood === 'night' ? 320 : nextMood === 'evening' ? 400 : nextMood === 'morning' ? 480 : 520;
      this.windFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.8);
    }
    this.emit();
  }

  start() {
    if (this.playing) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.24, now + 1.2);
    this.masterGain.connect(this.ctx.destination);

    // Pink-ish noise buffer for gentle breeze through rose leaves
    const sampleRate = this.ctx.sampleRate;
    const bufferLen = sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferLen, sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < bufferLen; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = buffer;
    this.windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(
      this.mood === 'night' ? 320 : this.mood === 'evening' ? 400 : 500,
      now,
    );
    this.windFilter.Q.setValueAtTime(1.1, now);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.32, now);

    // Slow breathing wind LFO
    this.lfoOsc = this.ctx.createOscillator();
    this.lfoOsc.type = 'sine';
    this.lfoOsc.frequency.setValueAtTime(0.11, now);
    const lfoDepth = this.ctx.createGain();
    lfoDepth.gain.setValueAtTime(150, now);
    this.lfoOsc.connect(lfoDepth);
    lfoDepth.connect(this.windFilter.frequency);

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    this.windSource.start(now);
    this.lfoOsc.start(now);

    this.playing = true;
    this.scheduleNextCreatureVoice();
    this.emit();
  }

  stop() {
    this.playing = false;
    if (this.creatureTimer !== null) {
      window.clearTimeout(this.creatureTimer);
      this.creatureTimer = null;
    }

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      try {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setTargetAtTime(0.0001, now, 0.15);
      } catch {
        // ignore
      }
    }

    const src = this.windSource;
    const lfo = this.lfoOsc;
    this.windSource = null;
    this.lfoOsc = null;
    window.setTimeout(() => {
      try {
        src?.stop();
        src?.disconnect();
        lfo?.stop();
        lfo?.disconnect();
      } catch {
        // ignore
      }
    }, 350);

    this.emit();
  }

  toggle() {
    if (this.playing) {
      this.stop();
    } else {
      this.start();
    }
  }

  playBreezeChime() {
    if (!this.playing || !this.ctx || !this.masterGain) return;
    const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const now = this.ctx.currentTime;
    const count = 3;
    for (let i = 0; i < count; i++) {
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const t = now + i * 0.14;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.08, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 1.45);
    }
  }

  private scheduleNextCreatureVoice() {
    if (!this.playing) return;
    const delayMs = this.mood === 'night' ? 2200 + Math.random() * 2600 : 1900 + Math.random() * 2800;
    this.creatureTimer = window.setTimeout(() => {
      if (!this.playing) return;
      if (this.mood === 'night' || this.mood === 'evening') {
        this.playNightCricket();
      } else {
        this.playMorningBird();
      }
      this.scheduleNextCreatureVoice();
    }, delayMs);
  }

  private playMorningBird() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const baseFreq = 1650 + Math.random() * 750;
    const chirps = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < chirps; i++) {
      const t = now + i * 0.13;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const f0 = baseFreq + i * 90;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f0 * 1.28, t + 0.055);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.94, t + 0.11);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.045, t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.13);
    }
  }

  private playNightCricket() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const pulses = 3 + Math.floor(Math.random() * 2);
    const freq = 3400 + Math.random() * 320;

    for (let i = 0; i < pulses; i++) {
      const t = now + i * 0.065;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.018, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.048);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.055);
    }
  }
}

export const gardenAudio = new ProceduralGardenAudioEngine();

// Multi-Track Original Birthday & Romantic Instrumental Engine
// Synthesizes piano, celesta music-box, harp arpeggios, and gentle strings cleanly in Web Audio.

export type MusicTrackId = 'nocturne' | 'musicbox' | 'starlight' | 'sunset' | 'waltz';

export interface MusicTrackMeta {
  id: MusicTrackId;
  title: string;
  subtitle: string;
}

export const MUSIC_TRACKS: MusicTrackMeta[] = [
  {
    id: 'nocturne',
    title: 'Romantic Birthday Nocturne',
    subtitle: 'Grand Piano & Gentle Strings',
  },
  {
    id: 'musicbox',
    title: "Manika's Music-Box Lullaby",
    subtitle: 'Sparkling Celesta & Chimes',
  },
  {
    id: 'starlight',
    title: 'Starlight Harp & Strings',
    subtitle: 'Dreamy Harp Arpeggios',
  },
  {
    id: 'sunset',
    title: 'Golden Highland Sunset',
    subtitle: 'Warm Acoustic Chords',
  },
  {
    id: 'waltz',
    title: 'Birthday Celebration Waltz',
    subtitle: 'Joyful 3/4 Chime & Piano',
  },
];

interface MusicEvent {
  melody: number;
  harmony: number;
  stringChord?: number[];
  durMs: number;
  voice?: 'piano' | 'celesta' | 'harp';
}

const TRACK_ARRANGEMENTS: Record<MusicTrackId, MusicEvent[]> = {
  nocturne: [
    { melody: 261.63, harmony: 174.61, stringChord: [174.61, 220.0, 261.63], durMs: 560 },
    { melody: 261.63, harmony: 0, durMs: 360 },
    { melody: 293.66, harmony: 220.0, durMs: 780 },
    { melody: 261.63, harmony: 174.61, durMs: 780 },
    { melody: 349.23, harmony: 220.0, stringChord: [130.81, 196.0, 261.63], durMs: 780 },
    { melody: 329.63, harmony: 196.0, durMs: 1450 },
    { melody: 261.63, harmony: 130.81, stringChord: [130.81, 164.81, 196.0], durMs: 560 },
    { melody: 261.63, harmony: 0, durMs: 360 },
    { melody: 293.66, harmony: 196.0, durMs: 780 },
    { melody: 261.63, harmony: 130.81, durMs: 780 },
    { melody: 392.0, harmony: 261.63, stringChord: [174.61, 220.0, 261.63], durMs: 780 },
    { melody: 349.23, harmony: 220.0, durMs: 1450 },
    { melody: 261.63, harmony: 174.61, stringChord: [174.61, 220.0, 293.66], durMs: 560 },
    { melody: 261.63, harmony: 0, durMs: 360 },
    { melody: 523.25, harmony: 261.63, durMs: 780 },
    { melody: 440.0, harmony: 220.0, durMs: 780 },
    { melody: 349.23, harmony: 174.61, stringChord: [116.54, 174.61, 233.08], durMs: 780 },
    { melody: 329.63, harmony: 196.0, durMs: 780 },
    { melody: 293.66, harmony: 146.83, durMs: 1250 },
    { melody: 466.16, harmony: 233.08, stringChord: [116.54, 174.61, 233.08], durMs: 560 },
    { melody: 466.16, harmony: 0, durMs: 360 },
    { melody: 440.0, harmony: 220.0, stringChord: [174.61, 220.0, 261.63], durMs: 780 },
    { melody: 349.23, harmony: 174.61, durMs: 780 },
    { melody: 392.0, harmony: 196.0, durMs: 780 },
    { melody: 349.23, harmony: 174.61, durMs: 1650 },
  ],
  musicbox: [
    { melody: 523.25, harmony: 261.63, stringChord: [261.63, 329.63, 392.0], durMs: 480, voice: 'celesta' },
    { melody: 659.25, harmony: 0, durMs: 480, voice: 'celesta' },
    { melody: 783.99, harmony: 392.0, durMs: 480, voice: 'celesta' },
    { melody: 659.25, harmony: 0, durMs: 480, voice: 'celesta' },
    { melody: 880.0, harmony: 220.0, stringChord: [220.0, 261.63, 329.63], durMs: 680, voice: 'celesta' },
    { melody: 783.99, harmony: 0, durMs: 920, voice: 'celesta' },
    { melody: 698.46, harmony: 174.61, stringChord: [174.61, 220.0, 261.63], durMs: 480, voice: 'celesta' },
    { melody: 659.25, harmony: 0, durMs: 480, voice: 'celesta' },
    { melody: 587.33, harmony: 196.0, durMs: 680, voice: 'celesta' },
    { melody: 659.25, harmony: 0, durMs: 480, voice: 'celesta' },
    { melody: 523.25, harmony: 130.81, stringChord: [130.81, 196.0, 261.63], durMs: 1300, voice: 'celesta' },
  ],
  starlight: [
    { melody: 392.0, harmony: 196.0, stringChord: [196.0, 246.94, 293.66], durMs: 520, voice: 'harp' },
    { melody: 493.88, harmony: 246.94, durMs: 520, voice: 'harp' },
    { melody: 587.33, harmony: 293.66, durMs: 520, voice: 'harp' },
    { melody: 739.99, harmony: 0, durMs: 780, voice: 'harp' },
    { melody: 659.25, harmony: 164.81, stringChord: [164.81, 246.94, 329.63], durMs: 680, voice: 'harp' },
    { melody: 587.33, harmony: 0, durMs: 680, voice: 'harp' },
    { melody: 493.88, harmony: 146.83, stringChord: [146.83, 220.0, 293.66], durMs: 680, voice: 'harp' },
    { melody: 440.0, harmony: 196.0, durMs: 920, voice: 'harp' },
    { melody: 392.0, harmony: 196.0, stringChord: [196.0, 246.94, 293.66], durMs: 1400, voice: 'harp' },
  ],
  sunset: [
    { melody: 293.66, harmony: 146.83, stringChord: [146.83, 220.0, 293.66], durMs: 650, voice: 'piano' },
    { melody: 369.99, harmony: 185.0, durMs: 650, voice: 'piano' },
    { melody: 440.0, harmony: 220.0, durMs: 950, voice: 'piano' },
    { melody: 493.88, harmony: 246.94, stringChord: [196.0, 246.94, 293.66], durMs: 650, voice: 'piano' },
    { melody: 440.0, harmony: 220.0, durMs: 650, voice: 'piano' },
    { melody: 369.99, harmony: 146.83, durMs: 950, voice: 'piano' },
    { melody: 329.63, harmony: 164.81, stringChord: [164.81, 220.0, 277.18], durMs: 650, voice: 'piano' },
    { melody: 293.66, harmony: 146.83, durMs: 1400, voice: 'piano' },
  ],
  waltz: [
    { melody: 349.23, harmony: 174.61, stringChord: [174.61, 233.08, 293.66], durMs: 420, voice: 'piano' },
    { melody: 440.0, harmony: 233.08, durMs: 420, voice: 'celesta' },
    { melody: 587.33, harmony: 293.66, durMs: 420, voice: 'celesta' },
    { melody: 523.25, harmony: 261.63, stringChord: [130.81, 196.0, 261.63], durMs: 620, voice: 'piano' },
    { melody: 466.16, harmony: 233.08, durMs: 420, voice: 'celesta' },
    { melody: 440.0, harmony: 220.0, durMs: 620, voice: 'piano' },
    { melody: 392.0, harmony: 196.0, stringChord: [174.61, 233.08, 293.66], durMs: 420, voice: 'piano' },
    { melody: 440.0, harmony: 220.0, durMs: 420, voice: 'celesta' },
    { melody: 466.16, harmony: 233.08, durMs: 420, voice: 'celesta' },
    { melody: 349.23, harmony: 174.61, durMs: 1100, voice: 'piano' },
  ],
};

class BirthdayAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private timerId: number | null = null;
  private step = 0;
  private playing = false;
  private muted = false;
  private volume = 1.0;
  private trackId: MusicTrackId = 'nocturne';
  private userPaused = false;
  private gestureAttached = false;
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedVol = localStorage.getItem('fy_audio_volume_max');
        const savedMute = localStorage.getItem('fy_audio_muted');
        const savedTrack = localStorage.getItem('fy_audio_track') as MusicTrackId | null;
        if (savedVol !== null) this.volume = Math.max(0, Math.min(1, Number(savedVol)));
        if (savedMute !== null) this.muted = savedMute === 'true';
        if (savedTrack && savedTrack in TRACK_ARRANGEMENTS) this.trackId = savedTrack;
      } catch {
        // Ignore storage restrictions
      }
    }
  }

  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private emit() {
    this.listeners.forEach((cb) => cb());
  }

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.applyGain();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private applyGain() {
    if (!this.masterGain || !this.ctx) return;
    const target = this.muted ? 0 : this.volume * 0.6;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
  }

  initAutoPlay() {
    if (typeof window === 'undefined' || this.userPaused) return;
    try {
      this.start();
    } catch {
      // Browser blocked autoplay until first gesture
    }

    if (this.gestureAttached) return;
    this.gestureAttached = true;

    const unlock = () => {
      if (this.userPaused) return;
      if (!this.playing) {
        this.start();
      } else if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume().then(() => {
          this.applyGain();
          this.emit();
        });
      }
      if (this.ctx && this.ctx.state === 'running') {
        window.removeEventListener('pointerdown', unlock, true);
        window.removeEventListener('keydown', unlock, true);
        window.removeEventListener('touchstart', unlock, true);
      }
    };

    window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
    window.addEventListener('keydown', unlock, { capture: true, passive: true });
    window.addEventListener('touchstart', unlock, { capture: true, passive: true });
  }

  private playVoice(
    freq: number,
    isHarmony: boolean,
    durMs: number,
    voice: 'piano' | 'celesta' | 'harp' = 'piano',
  ) {
    if (!this.ctx || !this.masterGain || freq <= 0) return;
    const now = this.ctx.currentTime;
    const durSec = Math.max(0.55, durMs / 1000 + (voice === 'harp' ? 1.1 : 0.85));

    const oscBody = this.ctx.createOscillator();
    const oscBell = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    oscBody.type = voice === 'celesta' ? 'sine' : isHarmony ? 'sine' : 'triangle';
    oscBody.frequency.setValueAtTime(freq, now);

    oscBell.type = 'sine';
    oscBell.frequency.setValueAtTime(voice === 'harp' ? freq * 1.5 : freq * 2, now);

    filter.type = 'lowpass';
    const cutoff = voice === 'celesta' ? 2800 : voice === 'harp' ? 1750 : isHarmony ? 620 : 2100;
    filter.frequency.setValueAtTime(cutoff, now);
    filter.frequency.exponentialRampToValueAtTime(isHarmony ? 250 : 680, now + durSec);

    const peak = isHarmony ? 0.14 : voice === 'celesta' ? 0.21 : 0.24;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + (voice === 'celesta' ? 0.015 : 0.028));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durSec);

    oscBody.connect(filter);
    oscBell.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    oscBody.start(now);
    oscBell.start(now);
    oscBody.stop(now + durSec + 0.05);
    oscBell.stop(now + durSec + 0.05);
  }

  private playStringPad(chord: number[]) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const padDur = 3.2;

    chord.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const oscA = this.ctx.createOscillator();
      const oscB = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      oscA.type = 'sine';
      oscA.frequency.setValueAtTime(freq, now);
      oscB.type = 'triangle';
      oscB.frequency.setValueAtTime(freq * 1.003, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(520, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.85);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + padDur);

      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      oscA.start(now);
      oscB.start(now);
      oscA.stop(now + padDur + 0.05);
      oscB.stop(now + padDur + 0.05);
    });
  }

  private scheduleNext() {
    if (!this.playing) return;
    const arrangement = TRACK_ARRANGEMENTS[this.trackId] || TRACK_ARRANGEMENTS.nocturne;
    const ev = arrangement[this.step % arrangement.length];
    const voice = ev.voice || 'piano';
    this.playVoice(ev.melody, false, ev.durMs, voice);
    if (ev.harmony > 0) {
      this.playVoice(ev.harmony, true, ev.durMs * 1.3, voice);
    }
    if (ev.stringChord && ev.stringChord.length > 0) {
      this.playStringPad(ev.stringChord);
    }
    this.step = (this.step + 1) % arrangement.length;
    this.timerId = window.setTimeout(() => this.scheduleNext(), ev.durMs);
  }

  setTrack(id: MusicTrackId) {
    if (!(id in TRACK_ARRANGEMENTS)) return;
    this.trackId = id;
    this.step = 0;
    try {
      localStorage.setItem('fy_audio_track', id);
    } catch {
      // ignore
    }
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (!this.playing) {
      this.start();
    } else {
      this.scheduleNext();
      this.emit();
    }
  }

  start() {
    this.userPaused = false;
    if (this.playing) {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }
    this.ensureContext();
    this.playing = true;
    this.applyGain();
    this.scheduleNext();
    this.emit();
  }

  pause() {
    this.userPaused = true;
    this.playing = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.emit();
  }

  togglePlay() {
    if (this.playing) {
      this.pause();
    } else {
      this.start();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('fy_audio_muted', String(this.muted));
    } catch {
      // ignore
    }
    this.applyGain();
    this.emit();
  }

  setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.volume > 0 && this.muted) {
      this.muted = false;
    }
    try {
      localStorage.setItem('fy_audio_volume_max', String(this.volume));
      localStorage.setItem('fy_audio_muted', String(this.muted));
    } catch {
      // ignore
    }
    this.applyGain();
    this.emit();
  }

  getState() {
    return {
      playing: this.playing,
      muted: this.muted,
      volume: this.volume,
      trackId: this.trackId,
      trackTitle: MUSIC_TRACKS.find((t) => t.id === this.trackId)?.title || MUSIC_TRACKS[0].title,
    };
  }
}

export const birthdayAudio = new BirthdayAudioEngine();

export async function startMicBlowDetector(onBlowDetected: () => void): Promise<() => void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  const data = new Uint8Array(analyser.frequencyBinCount);
  let active = true;
  let consecutiveHigh = 0;

  const check = () => {
    if (!active) return;
    analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < 24; i++) sum += data[i];
    const avg = sum / 24;

    if (avg > 88) {
      consecutiveHigh += 1;
      if (consecutiveHigh >= 4) {
        active = false;
        cleanup();
        onBlowDetected();
        return;
      }
    } else {
      consecutiveHigh = Math.max(0, consecutiveHigh - 1);
    }
    requestAnimationFrame(check);
  };

  const cleanup = () => {
    active = false;
    stream.getTracks().forEach((t) => t.stop());
    ctx.close().catch(() => {});
  };

  requestAnimationFrame(check);
  return cleanup;
}

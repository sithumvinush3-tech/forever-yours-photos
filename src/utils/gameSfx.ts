// Lightweight Web Audio API sound effects for Love Arcade mini-games
let sfxCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!sfxCtx) {
    sfxCtx = new AudioCtor();
  }
  if (sfxCtx.state === 'suspended') {
    void sfxCtx.resume().catch(() => {});
  }
  return sfxCtx;
}

function playTone(
  freq: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.08,
  delaySec = 0,
) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  } catch {
    // AudioContext may be unavailable in restricted contexts
  }
}

export const gameSfx = {
  tap: () => playTone(620, 0.09, 'sine', 0.06),
  bonus: () => {
    playTone(740, 0.12, 'triangle', 0.08, 0);
    playTone(987.77, 0.18, 'triangle', 0.09, 0.08);
  },
  wrong: () => {
    playTone(240, 0.16, 'sawtooth', 0.05, 0);
    playTone(195, 0.22, 'sawtooth', 0.05, 0.1);
  },
  unlock: () => {
    playTone(523.25, 0.16, 'triangle', 0.09, 0);
    playTone(659.25, 0.16, 'triangle', 0.09, 0.1);
    playTone(783.99, 0.28, 'sine', 0.1, 0.2);
  },
  victory: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      playTone(f, 0.28, 'sine', 0.09, idx * 0.11);
    });
  },
};

// ─── Global Audio Singleton (Survives Fast Refresh & Prevents Duplicate Audio) ───

declare global {
  interface Window {
    __QUIZ_BGM_AUDIO__?: HTMLAudioElement | null;
    __QUIZ_BGM_MUTED__?: boolean;
    __QUIZ_SFX_MUTED__?: boolean;
    __QUIZ_BGM_RUNNING__?: boolean;
  }
}

let ctx: AudioContext | null = null;
export const BGM_VOLUME = 0.08; // Gentle, soft ambient background music volume (8%)

function getBgmAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  if (!window.__QUIZ_BGM_AUDIO__) {
    // If an orphan audio element exists in DOM or previous session, stop it first
    const audio = new Audio('/audio/bgm_momo_island.mp3');
    audio.loop = true;
    audio.volume = BGM_VOLUME;
    audio.preload = 'auto';
    window.__QUIZ_BGM_AUDIO__ = audio;
  } else {
    window.__QUIZ_BGM_AUDIO__.volume = BGM_VOLUME;
  }

  return window.__QUIZ_BGM_AUDIO__;
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      ctx = new AudioContextClass();
    }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

// ─── Separate BGM and SFX Mute Controls ─────────────────────────────────────

export function isBgmMuted(): boolean {
  if (typeof window !== 'undefined' && window.__QUIZ_BGM_MUTED__ !== undefined) {
    return window.__QUIZ_BGM_MUTED__;
  }
  return false;
}

export function setBgmMuted(val: boolean): boolean {
  if (typeof window !== 'undefined') {
    window.__QUIZ_BGM_MUTED__ = val;
  }

  const audio = getBgmAudio();
  if (audio) {
    if (val) {
      audio.pause();
      audio.muted = true;
      audio.volume = 0;
    } else {
      audio.muted = false;
      audio.volume = BGM_VOLUME;
      if (typeof window !== 'undefined' && window.__QUIZ_BGM_RUNNING__) {
        audio.play().catch(() => {});
      }
    }
  }

  // Also safeguard any possible orphan audio elements
  if (val && typeof document !== 'undefined') {
    const allAudios = document.querySelectorAll('audio');
    allAudios.forEach((a) => {
      a.pause();
      a.muted = true;
    });
  }

  return val;
}

export function toggleBgmMute(): boolean {
  return setBgmMuted(!isBgmMuted());
}

export function isSfxMuted(): boolean {
  if (typeof window !== 'undefined' && window.__QUIZ_SFX_MUTED__ !== undefined) {
    return window.__QUIZ_SFX_MUTED__;
  }
  return false;
}

export function setSfxMuted(val: boolean): boolean {
  if (typeof window !== 'undefined') {
    window.__QUIZ_SFX_MUTED__ = val;
  }
  return val;
}

export function toggleSfxMute(): boolean {
  return setSfxMuted(!isSfxMuted());
}

// Backwards-compatible aliases
export function isAudioMuted(): boolean {
  return isBgmMuted();
}

export function toggleAudioMute(): boolean {
  return toggleBgmMute();
}

// ─── BGM Playback Control (Piki - Momo Island) ──────────────────────────────

let isStartingBgm = false;

export function startQuizBGM(): void {
  if (typeof window === 'undefined') return;
  window.__QUIZ_BGM_RUNNING__ = true;

  if (isBgmMuted()) {
    const audio = getBgmAudio();
    if (audio) {
      audio.pause();
      audio.muted = true;
    }
    return;
  }

  const audio = getBgmAudio();
  if (!audio) return;

  audio.muted = false;
  audio.volume = BGM_VOLUME;

  if (!audio.paused) return; // Already playing cleanly, do not double-play
  if (isStartingBgm) return;

  isStartingBgm = true;
  audio.play()
    .then(() => {
      isStartingBgm = false;
    })
    .catch(() => {
      isStartingBgm = false;
      // Auto-play policy requires user interaction
      const resumeOnGesture = () => {
        if (window.__QUIZ_BGM_RUNNING__ && !isBgmMuted() && audio.paused) {
          audio.muted = false;
          audio.volume = BGM_VOLUME;
          audio.play().catch(() => {});
        }
        window.removeEventListener('click', resumeOnGesture);
        window.removeEventListener('keydown', resumeOnGesture);
        window.removeEventListener('touchstart', resumeOnGesture);
      };
      window.addEventListener('click', resumeOnGesture, { once: true });
      window.addEventListener('keydown', resumeOnGesture, { once: true });
      window.addEventListener('touchstart', resumeOnGesture, { once: true });
    });
}

export function stopQuizBGM(): void {
  if (typeof window === 'undefined') return;
  window.__QUIZ_BGM_RUNNING__ = false;

  const audio = getBgmAudio();
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  if (typeof document !== 'undefined') {
    const allAudios = document.querySelectorAll('audio');
    allAudios.forEach((a) => {
      a.pause();
    });
  }
}

export function stopAllBGM(): void {
  stopQuizBGM();
}


// ─── SFX Tone Synthesizer (Respects sfxMuted) ───────────────────────────────

function playSfxTone(
  frequency: number,
  duration: number,
  startTime: number,
  type: OscillatorType = 'square',
  volume: number = 0.1,
  gainEnvelope?: { attack?: number; decay?: number; sustain?: number; release?: number }
): void {
  if (isSfxMuted()) return;
  const c = getCtx();
  if (!c) return;

  try {
    const osc = c.createOscillator();
    const gainNode = c.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    const env = gainEnvelope ?? {};
    const attack = env.attack ?? 0.02;
    const decay = env.decay ?? 0.08;
    const sustain = env.sustain ?? volume * 0.7;
    const release = env.release ?? 0.05;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + attack);
    gainNode.gain.linearRampToValueAtTime(sustain, startTime + attack + decay);
    gainNode.gain.setValueAtTime(sustain, Math.max(startTime + attack + decay, startTime + duration - release));
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(c.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch {}
}

function playSfxNoise(duration: number, startTime: number, volume: number = 0.04): void {
  if (isSfxMuted()) return;
  const c = getCtx();
  if (!c) return;

  try {
    const bufferSize = Math.floor(c.sampleRate * duration);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = c.createBufferSource();
    source.buffer = buffer;

    const gainNode = c.createGain();
    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    source.connect(gainNode);
    gainNode.connect(c.destination);
    source.start(startTime);
  } catch {}
}

// ─── Sound Events (SFX) ─────────────────────────────────────────────────────

export function sfxGearEquip(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playSfxTone(523, 0.06, t, 'square', 0.08);
  playSfxTone(659, 0.06, t + 0.06, 'square', 0.08);
}

export function sfxCorrect(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const notes = [261.63, 329.63, 392.0, 523.25];
  notes.forEach((freq, i) => {
    playSfxTone(freq, 0.12, t + i * 0.1, 'square', 0.12);
  });
  playSfxTone(1046.5, 0.2, t + 0.4, 'sine', 0.08);
}

export function sfxWrong(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playSfxTone(220, 0.08, t, 'sawtooth', 0.1);
  playSfxTone(180, 0.08, t + 0.1, 'sawtooth', 0.1);
  playSfxTone(150, 0.12, t + 0.2, 'sawtooth', 0.08);
}

export function sfxArchiveUnlock(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  for (let i = 0; i < 8; i++) {
    const freq = 400 + i * 120;
    playSfxTone(freq, 0.08, t + i * 0.06, 'sine', 0.06 + i * 0.005);
  }
  playSfxTone(1568, 0.25, t + 0.48, 'sine', 0.1);
}

export function sfxBridgeExtend(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const chimes = [880, 1108.73, 1318.51, 1760];
  chimes.forEach((freq, i) => {
    playSfxTone(freq, 0.15, t + i * 0.08, 'sine', 0.08);
  });
}

export function sfxVictory(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const melody = [
    [523.25, 0.1], [523.25, 0.1], [523.25, 0.1], [415.3, 0.075], [466.16, 0.075],
    [523.25, 0.1], [466.16, 0.1], [523.25, 0.3],
  ] as [number, number][];
  let cursor = 0;
  melody.forEach(([freq, dur]) => {
    playSfxTone(freq, dur * 0.9, t + cursor, 'square', 0.12);
    cursor += dur;
  });
}

export function sfxCertificateStamp(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playSfxNoise(0.05, t, 0.25);
  playSfxTone(80, 0.15, t, 'sine', 0.2);
  playSfxTone(110, 0.1, t + 0.05, 'sine', 0.12);
}

export function sfxFileLoaded(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playSfxTone(392, 0.08, t, 'square', 0.1);
  playSfxTone(523.25, 0.08, t + 0.09, 'square', 0.1);
  playSfxTone(659.25, 0.15, t + 0.18, 'square', 0.12);
}

export function sfxOwlHoot(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playSfxTone(330, 0.15, t, 'sine', 0.1, { attack: 0.05, decay: 0.1, sustain: 0.08, release: 0.08 });
  playSfxTone(294, 0.2,  t + 0.2, 'sine', 0.08, { attack: 0.03, decay: 0.1, sustain: 0.06, release: 0.1 });
}

export function sfxPageTurn(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playSfxNoise(0.12, t, 0.06);
  playSfxTone(220, 0.06, t + 0.05, 'triangle', 0.05);
}

let lastBlipTime = 0;
export function sfxTextBlip(): void {
  if (isSfxMuted()) return;
  const now = Date.now();
  if (now - lastBlipTime < 55) return;
  lastBlipTime = now;
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') {
    c.resume().catch(() => {});
  }
  const t = c.currentTime;
  // Crisp, audible retro RPG dialogue chirp (triangle wave, warm punchy envelope)
  const pitch = 440 + (Math.random() * 60);
  playSfxTone(pitch, 0.045, t, 'triangle', 0.12, { attack: 0.003, decay: 0.025, sustain: 0.06, release: 0.015 });
}





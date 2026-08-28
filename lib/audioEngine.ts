// ─── Global Audio Singleton (Survives Fast Refresh & Prevents Duplicate Audio) ───

declare global {
  interface Window {
    __QUIZ_BGM_AUDIO__?: HTMLAudioElement | null;
    __QUIZ_AUDIO_CTX__?: AudioContext | null;
    __QUIZ_BGM_MUTED__?: boolean;
    __QUIZ_SFX_MUTED__?: boolean;
    __QUIZ_BGM_RUNNING__?: boolean;
    __QUIZ_UNLOCKED__?: boolean;
  }
}

export const BGM_VOLUME = 0.22; // Comfortable, clearly audible background music on mobile & desktop (22%)

function getBgmAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  if (!window.__QUIZ_BGM_AUDIO__) {
    const audio = new Audio('/audio/bgm_momo_island.mp3');
    audio.loop = true;
    audio.volume = BGM_VOLUME;
    audio.preload = 'auto';
    audio.setAttribute('playsinline', 'true');
    (audio as unknown as { playsInline?: boolean }).playsInline = true;
    window.__QUIZ_BGM_AUDIO__ = audio;
  } else {
    window.__QUIZ_BGM_AUDIO__.volume = isBgmMuted() ? 0 : BGM_VOLUME;
  }

  return window.__QUIZ_BGM_AUDIO__;
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!window.__QUIZ_AUDIO_CTX__) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      window.__QUIZ_AUDIO_CTX__ = new AudioContextClass();
    }
  }
  const c = window.__QUIZ_AUDIO_CTX__;
  if (c && c.state === 'suspended') {
    c.resume().catch(() => {});
  }
  return c ?? null;
}

// ─── Mobile Audio Context & HTML5 Audio Unlocker ────────────────────────────

export function unlockAudioEngine(): void {
  if (typeof window === 'undefined') return;

  // 1. Unlock & Resume Web Audio API context (iOS Safari & Android Web Audio requirement)
  const c = getCtx();
  if (c) {
    if (c.state === 'suspended') {
      c.resume().catch(() => {});
    }
    // Play 1 silent frame to prime the Web Audio pipeline on iOS
    try {
      const buffer = c.createBuffer(1, 1, 22050);
      const source = c.createBufferSource();
      source.buffer = buffer;
      source.connect(c.destination);
      source.start(0);
    } catch {}
  }

  // 2. Unlock & Resume BGM HTML5 Audio if designated to run
  const bgm = getBgmAudio();
  if (bgm) {
    if (window.__QUIZ_BGM_RUNNING__ && !isBgmMuted() && bgm.paused) {
      bgm.muted = false;
      bgm.volume = BGM_VOLUME;
      bgm.play().catch(() => {});
    }
  }

  window.__QUIZ_UNLOCKED__ = true;
}

// Attach automatic unlock listeners on user interactions
if (typeof window !== 'undefined') {
  const unlockEvents = ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'click', 'keydown'];
  const onUserGesture = () => {
    unlockAudioEngine();
  };
  unlockEvents.forEach((evt) => {
    window.addEventListener(evt, onUserGesture, { passive: true });
    if (typeof document !== 'undefined') {
      document.addEventListener(evt, onUserGesture, { passive: true });
    }
  });
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

// Backwards-compatible master mute aliases
export function isAudioMuted(): boolean {
  return isBgmMuted() && isSfxMuted();
}

export function toggleAudioMute(): boolean {
  const next = !isBgmMuted();
  setBgmMuted(next);
  setSfxMuted(next);
  return next;
}

// ─── BGM Multi-Track Playback Control ───────────────────────────────────────

let isStartingBgm = false;
let activeTrackId = 'momo_island';
let synthLoopTimer: NodeJS.Timeout | null = null;
let synthGainNode: GainNode | null = null;

// Track 2: 8-Bit Retro Quest Melody Sequence
const CHIPTUNE_NOTES = [
  { freq: 261.63, dur: 0.2 }, { freq: 329.63, dur: 0.2 }, { freq: 392.00, dur: 0.2 }, { freq: 523.25, dur: 0.3 },
  { freq: 440.00, dur: 0.2 }, { freq: 392.00, dur: 0.2 }, { freq: 329.63, dur: 0.4 },
  { freq: 293.66, dur: 0.2 }, { freq: 349.23, dur: 0.2 }, { freq: 440.00, dur: 0.2 }, { freq: 587.33, dur: 0.3 },
  { freq: 523.25, dur: 0.2 }, { freq: 440.00, dur: 0.2 }, { freq: 392.00, dur: 0.4 },
];

// Track 3: Cozy Lo-Fi Botanical Calm Chords Sequence
const LOFI_NOTES = [
  { freq: 174.61, dur: 0.6 }, { freq: 261.63, dur: 0.6 }, { freq: 329.63, dur: 0.6 }, { freq: 392.00, dur: 0.8 },
  { freq: 196.00, dur: 0.6 }, { freq: 293.66, dur: 0.6 }, { freq: 349.23, dur: 0.6 }, { freq: 440.00, dur: 0.8 },
  { freq: 164.81, dur: 0.6 }, { freq: 246.94, dur: 0.6 }, { freq: 329.63, dur: 0.6 }, { freq: 392.00, dur: 0.8 },
  { freq: 220.00, dur: 0.6 }, { freq: 261.63, dur: 0.6 }, { freq: 329.63, dur: 0.6 }, { freq: 523.25, dur: 0.8 },
];

function stopSynthBgm(): void {
  if (synthLoopTimer) {
    clearInterval(synthLoopTimer);
    synthLoopTimer = null;
  }
  if (synthGainNode) {
    try {
      synthGainNode.gain.setValueAtTime(0, 0);
      synthGainNode.disconnect();
    } catch {}
    synthGainNode = null;
  }
}

function startSynthLoop(notes: { freq: number; dur: number }[], oscType: OscillatorType, speedMs: number, vol: number) {
  stopSynthBgm();
  const c = getCtx();
  if (!c) return;

  synthGainNode = c.createGain();
  synthGainNode.gain.setValueAtTime(isBgmMuted() ? 0 : vol, c.currentTime);
  synthGainNode.connect(c.destination);

  let noteIdx = 0;

  function playNextNote() {
    if (!window.__QUIZ_BGM_RUNNING__ || isBgmMuted() || !synthGainNode || !c) return;
    const item = notes[noteIdx % notes.length];
    noteIdx++;

    try {
      const osc = c.createOscillator();
      const noteGain = c.createGain();
      osc.type = oscType;
      osc.frequency.setValueAtTime(item.freq, c.currentTime);

      noteGain.gain.setValueAtTime(0.01, c.currentTime);
      noteGain.gain.linearRampToValueAtTime(1.0, c.currentTime + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + item.dur);

      osc.connect(noteGain);
      noteGain.connect(synthGainNode);

      osc.start(c.currentTime);
      osc.stop(c.currentTime + item.dur + 0.05);
    } catch {}
  }

  playNextNote();
  synthLoopTimer = setInterval(playNextNote, speedMs);
}

export function setBgmTrack(trackId: string): void {
  activeTrackId = trackId;
  if (window.__QUIZ_BGM_RUNNING__) {
    startQuizBGM(trackId);
  }
}

export function getActiveBgmTrack(): string {
  return activeTrackId;
}

export function startQuizBGM(trackId?: string): void {
  if (typeof window === 'undefined') return;
  window.__QUIZ_BGM_RUNNING__ = true;
  if (trackId) activeTrackId = trackId;

  // Stop any running tracks first
  const audio = getBgmAudio();
  if (audio) {
    audio.pause();
  }
  stopSynthBgm();

  if (isBgmMuted() || activeTrackId === 'muted') {
    return;
  }

  unlockAudioEngine();

  if (activeTrackId === 'momo_island') {
    if (!audio) return;
    audio.muted = false;
    audio.volume = BGM_VOLUME;
    if (audio.paused && !isStartingBgm) {
      isStartingBgm = true;
      audio.play()
        .then(() => { isStartingBgm = false; })
        .catch(() => { isStartingBgm = false; });
    }
  } else if (activeTrackId === '8bit_quest') {
    startSynthLoop(CHIPTUNE_NOTES, 'square', 240, 0.12);
  } else if (activeTrackId === 'cozy_lofi') {
    startSynthLoop(LOFI_NOTES, 'triangle', 480, 0.15);
  }
}

export function stopQuizBGM(): void {
  if (typeof window === 'undefined') return;
  window.__QUIZ_BGM_RUNNING__ = false;

  const audio = getBgmAudio();
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  stopSynthBgm();

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

// ─── SFX Tone Synthesizer (Respects sfxMuted & Scaled Volume) ───────────────

export const SFX_VOLUME_SCALE = 0.65; 

function playSfxTone(
  frequency: number,
  duration: number,
  startTime: number,
  type: OscillatorType = 'square',
  volume: number = 0.2,
  gainEnvelope?: { attack?: number; decay?: number; sustain?: number; release?: number }
): void {
  if (isSfxMuted()) return;
  const c = getCtx();
  if (!c) return;

  try {
    if (c.state === 'suspended') {
      c.resume().catch(() => {});
    }

    const osc = c.createOscillator();
    const gainNode = c.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    const env = gainEnvelope ?? {};
    const attack = env.attack ?? 0.02;
    const decay = env.decay ?? 0.08;
    const effectiveVol = volume * SFX_VOLUME_SCALE;
    const sustain = (env.sustain ?? volume * 0.7) * SFX_VOLUME_SCALE;
    const release = env.release ?? 0.05;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(effectiveVol, startTime + attack);
    gainNode.gain.linearRampToValueAtTime(sustain, startTime + attack + decay);
    gainNode.gain.setValueAtTime(sustain, Math.max(startTime + attack + decay, startTime + duration - release));
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(c.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch {}
}

function playSfxNoise(duration: number, startTime: number, volume: number = 0.08): void {
  if (isSfxMuted()) return;
  const c = getCtx();
  if (!c) return;

  try {
    if (c.state === 'suspended') {
      c.resume().catch(() => {});
    }

    const bufferSize = Math.floor(c.sampleRate * duration);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = c.createBufferSource();
    source.buffer = buffer;

    const gainNode = c.createGain();
    const effectiveVol = volume * SFX_VOLUME_SCALE;
    gainNode.gain.setValueAtTime(effectiveVol, startTime);
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
  playSfxTone(523, 0.06, t, 'square', 0.18);
  playSfxTone(659, 0.06, t + 0.06, 'square', 0.18);
}

export function sfxCorrect(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const notes = [261.63, 329.63, 392.0, 523.25];
  notes.forEach((freq, i) => {
    playSfxTone(freq, 0.12, t + i * 0.1, 'square', 0.22);
  });
  playSfxTone(1046.5, 0.2, t + 0.4, 'sine', 0.16);
}

export function sfxWrong(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playSfxTone(220, 0.08, t, 'sawtooth', 0.2);
  playSfxTone(180, 0.08, t + 0.1, 'sawtooth', 0.2);
  playSfxTone(150, 0.12, t + 0.2, 'sawtooth', 0.16);
}

export function sfxArchiveUnlock(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  for (let i = 0; i < 8; i++) {
    const freq = 400 + i * 120;
    playSfxTone(freq, 0.08, t + i * 0.06, 'sine', 0.12 + i * 0.01);
  }
  playSfxTone(1568, 0.25, t + 0.48, 'sine', 0.18);
}

export function sfxBridgeExtend(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const chimes = [880, 1108.73, 1318.51, 1760];
  chimes.forEach((freq, i) => {
    playSfxTone(freq, 0.15, t + i * 0.08, 'sine', 0.16);
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
    playSfxTone(freq, dur * 0.9, t + cursor, 'square', 0.22);
    cursor += dur;
  });
}

export function sfxCertificateStamp(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playSfxNoise(0.05, t, 0.3);
  playSfxTone(80, 0.15, t, 'sine', 0.25);
  playSfxTone(110, 0.1, t + 0.05, 'sine', 0.18);
}

export function sfxFileLoaded(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playSfxTone(392, 0.08, t, 'square', 0.18);
  playSfxTone(523.25, 0.08, t + 0.09, 'square', 0.18);
  playSfxTone(659.25, 0.15, t + 0.18, 'square', 0.22);
}

export function sfxOwlHoot(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playSfxTone(330, 0.15, t, 'sine', 0.18, { attack: 0.05, decay: 0.1, sustain: 0.12, release: 0.08 });
  playSfxTone(294, 0.2,  t + 0.2, 'sine', 0.15, { attack: 0.03, decay: 0.1, sustain: 0.1, release: 0.1 });
}

export function sfxPageTurn(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playSfxNoise(0.12, t, 0.1);
  playSfxTone(220, 0.06, t + 0.05, 'triangle', 0.1);
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
  playSfxTone(pitch, 0.045, t, 'triangle', 0.18, { attack: 0.003, decay: 0.025, sustain: 0.08, release: 0.015 });
}





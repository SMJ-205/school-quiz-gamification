/**
 * audioEngine.ts
 * Web Audio API 8-Bit Retro RPG Adventure Synthesizer.
 * Zero external audio files — 100% programmatic Web Audio API.
 * Features:
 * 1. Title & Character Select Soundtrack (24-second mystical Academy theme).
 * 2. Quiz Library Soundtrack (30-second rich retro exploration theme).
 * 3. Global mute/unmute toggle.
 * 4. Interactive chiptune SFX.
 */

let ctx: AudioContext | null = null;
let muted = false;
let currentBgmType: 'none' | 'title' | 'quiz' = 'none';
let titleTimer: NodeJS.Timeout | null = null;
let quizTimer: NodeJS.Timeout | null = null;

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

// ─── Global Mute Control ────────────────────────────────────────────────────

export function isAudioMuted(): boolean {
  return muted;
}

export function setAudioMuted(val: boolean): boolean {
  muted = val;
  if (muted) {
    stopAllBGM();
  }
  return muted;
}

export function toggleAudioMute(): boolean {
  muted = !muted;
  if (muted) {
    stopAllBGM();
  } else {
    if (currentBgmType === 'title') startTitleBGM();
    else if (currentBgmType === 'quiz') startQuizBGM();
  }
  return muted;
}

// ─── Tone Synthesizer ───────────────────────────────────────────────────────

function playTone(
  frequency: number,
  duration: number,
  startTime: number,
  type: OscillatorType = 'square',
  volume: number = 0.1,
  gainEnvelope?: { attack?: number; decay?: number; sustain?: number; release?: number }
): void {
  if (muted) return;
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

function playNoise(duration: number, startTime: number, volume: number = 0.04): void {
  if (muted) return;
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

// ─── Note Frequencies (Hz) ──────────────────────────────────────────────────

const N = {
  E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51,
};

interface NoteEvent {
  t: number;
  freq: number;
  dur: number;
  type?: OscillatorType;
  vol?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRACK 1: TITLE & CHARACTER SELECT BGM (24.0s Looping Mystical Academy Overture)
// ═══════════════════════════════════════════════════════════════════════════════

const TITLE_LEAD_MELODY: NoteEvent[] = [
  // Phrase 1: The Gates of Academy (Fmaj7 -> G) [0s - 6s]
  { t: 0.0, freq: N.A4, dur: 1.1 },
  { t: 1.2, freq: N.C5, dur: 1.1 },
  { t: 2.4, freq: N.E5, dur: 1.8 },
  { t: 4.4, freq: N.D5, dur: 1.2 },

  // Phrase 2: The Hall of Scholars (Em -> Am) [6s - 12s]
  { t: 6.0, freq: N.G4, dur: 1.0 },
  { t: 7.1, freq: N.B4, dur: 1.0 },
  { t: 8.2, freq: N.D5, dur: 1.6 },
  { t: 10.0, freq: N.C5, dur: 1.4 },

  // Phrase 3: The Awakening of Knowledge (Dm7 -> G7) [12s - 18s]
  { t: 12.0, freq: N.F4, dur: 0.8 },
  { t: 12.9, freq: N.A4, dur: 0.8 },
  { t: 13.8, freq: N.D5, dur: 1.4 },
  { t: 15.4, freq: N.C5, dur: 0.8 },
  { t: 16.3, freq: N.B4, dur: 1.2 },

  // Phrase 4: The Adventurer's Call (F -> G -> C) [18s - 24s]
  { t: 18.0, freq: N.A4, dur: 0.9 },
  { t: 19.0, freq: N.B4, dur: 0.9 },
  { t: 20.0, freq: N.C5, dur: 1.5 },
  { t: 21.8, freq: N.G4, dur: 1.8 },
];

const TITLE_ARPEGGIOS: NoteEvent[] = [
  // Measure 1 (0-6s)
  { t: 0.0, freq: N.F3, dur: 0.4, vol: 0.02 }, { t: 0.5, freq: N.A3, dur: 0.4, vol: 0.02 }, { t: 1.0, freq: N.C4, dur: 0.4, vol: 0.02 }, { t: 1.5, freq: N.E4, dur: 0.4, vol: 0.02 },
  { t: 2.5, freq: N.G3, dur: 0.4, vol: 0.02 }, { t: 3.0, freq: N.B3, dur: 0.4, vol: 0.02 }, { t: 3.5, freq: N.D4, dur: 0.4, vol: 0.02 }, { t: 4.0, freq: N.G4, dur: 0.4, vol: 0.02 },
  // Measure 2 (6-12s)
  { t: 6.0, freq: N.E3, dur: 0.4, vol: 0.02 }, { t: 6.5, freq: N.G3, dur: 0.4, vol: 0.02 }, { t: 7.0, freq: N.B3, dur: 0.4, vol: 0.02 }, { t: 7.5, freq: N.E4, dur: 0.4, vol: 0.02 },
  { t: 8.5, freq: N.A3, dur: 0.4, vol: 0.02 }, { t: 9.0, freq: N.C4, dur: 0.4, vol: 0.02 }, { t: 9.5, freq: N.E4, dur: 0.4, vol: 0.02 }, { t: 10.0, freq: N.A4, dur: 0.4, vol: 0.02 },
  // Measure 3 (12-18s)
  { t: 12.0, freq: N.D3, dur: 0.4, vol: 0.02 }, { t: 12.5, freq: N.F3, dur: 0.4, vol: 0.02 }, { t: 13.0, freq: N.A3, dur: 0.4, vol: 0.02 }, { t: 13.5, freq: N.C4, dur: 0.4, vol: 0.02 },
  { t: 14.5, freq: N.G3, dur: 0.4, vol: 0.02 }, { t: 15.0, freq: N.B3, dur: 0.4, vol: 0.02 }, { t: 15.5, freq: N.D4, dur: 0.4, vol: 0.02 }, { t: 16.0, freq: N.F4, dur: 0.4, vol: 0.02 },
  // Measure 4 (18-24s)
  { t: 18.0, freq: N.F3, dur: 0.4, vol: 0.02 }, { t: 18.5, freq: N.A3, dur: 0.4, vol: 0.02 }, { t: 19.0, freq: N.C4, dur: 0.4, vol: 0.02 }, { t: 19.5, freq: N.E4, dur: 0.4, vol: 0.02 },
  { t: 20.5, freq: N.G3, dur: 0.4, vol: 0.02 }, { t: 21.0, freq: N.B3, dur: 0.4, vol: 0.02 }, { t: 21.5, freq: N.D4, dur: 0.4, vol: 0.02 }, { t: 22.0, freq: N.C4, dur: 0.8, vol: 0.025 },
];

const TITLE_BASS: NoteEvent[] = [
  { t: 0.0, freq: N.F2, dur: 2.2 }, { t: 2.5, freq: N.G2, dur: 2.2 },
  { t: 6.0, freq: N.E2, dur: 2.2 }, { t: 8.5, freq: N.A2, dur: 2.2 },
  { t: 12.0, freq: N.D3, dur: 2.2 }, { t: 14.5, freq: N.G2, dur: 2.2 },
  { t: 18.0, freq: N.F2, dur: 1.8 }, { t: 20.0, freq: N.G2, dur: 1.8 }, { t: 22.0, freq: N.C3, dur: 1.8 },
];

const TITLE_LOOP_DURATION = 24.0; // 24 seconds

function scheduleTitleTrack(startT: number) {
  if (muted || currentBgmType !== 'title') return;

  TITLE_LEAD_MELODY.forEach((n) => {
    playTone(n.freq, n.dur, startT + n.t, 'triangle', 0.045, {
      attack: 0.06,
      decay: 0.12,
      sustain: 0.035,
      release: 0.1,
    });
  });

  TITLE_ARPEGGIOS.forEach((n) => {
    playTone(n.freq, n.dur, startT + n.t, 'sine', n.vol ?? 0.02, {
      attack: 0.03,
      decay: 0.08,
      sustain: 0.015,
      release: 0.06,
    });
  });

  TITLE_BASS.forEach((n) => {
    playTone(n.freq, n.dur, startT + n.t, 'sine', 0.045, {
      attack: 0.08,
      decay: 0.2,
      sustain: 0.03,
      release: 0.15,
    });
  });
}

export function startTitleBGM(): void {
  if (currentBgmType === 'title') return;
  stopAllBGM();
  currentBgmType = 'title';
  if (muted) return;

  const c = getCtx();
  if (!c) return;

  const now = c.currentTime;
  scheduleTitleTrack(now);

  function loop() {
    if (muted || currentBgmType !== 'title') return;
    const ctxNow = getCtx();
    if (!ctxNow) return;
    scheduleTitleTrack(ctxNow.currentTime);
  }

  if (titleTimer) clearInterval(titleTimer);
  titleTimer = setInterval(loop, TITLE_LOOP_DURATION * 1000);
}

export function stopTitleBGM(): void {
  if (titleTimer) {
    clearInterval(titleTimer);
    titleTimer = null;
  }
  if (currentBgmType === 'title') currentBgmType = 'none';
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRACK 2: QUIZ LIBRARY BGM (30.0s Looping Upbeat Scholastic Exploration)
// ═══════════════════════════════════════════════════════════════════════════════

const QUIZ_LEAD_MELODY: NoteEvent[] = [
  // Measure 1 & 2 (Cmaj7 -> Am7) [0s - 7.5s]
  { t: 0.0, freq: N.E4, dur: 0.7 },
  { t: 0.8, freq: N.G4, dur: 0.7 },
  { t: 1.6, freq: N.C5, dur: 1.4 },
  { t: 3.2, freq: N.B4, dur: 0.6 },
  { t: 3.8, freq: N.A4, dur: 0.8 },
  { t: 4.8, freq: N.G4, dur: 1.2 },
  { t: 6.2, freq: N.E4, dur: 1.0 },

  // Measure 3 & 4 (Dm7 -> G7) [7.5s - 15.0s]
  { t: 7.5, freq: N.F4, dur: 0.6 },
  { t: 8.2, freq: N.A4, dur: 0.6 },
  { t: 9.0, freq: N.D5, dur: 1.3 },
  { t: 10.5, freq: N.C5, dur: 0.6 },
  { t: 11.2, freq: N.B4, dur: 0.8 },
  { t: 12.2, freq: N.G4, dur: 1.4 },
  { t: 13.8, freq: N.A4, dur: 0.9 },

  // Measure 5 & 6 (Em7 -> Am7) [15.0s - 22.5s]
  { t: 15.0, freq: N.G4, dur: 0.7 },
  { t: 15.8, freq: N.B4, dur: 0.7 },
  { t: 16.6, freq: N.E5, dur: 1.4 },
  { t: 18.2, freq: N.D5, dur: 0.6 },
  { t: 18.9, freq: N.C5, dur: 0.8 },
  { t: 19.8, freq: N.A4, dur: 1.3 },
  { t: 21.3, freq: N.C5, dur: 0.9 },

  // Measure 7 & 8 (Fmaj7 -> Gsus4 -> C) [22.5s - 30.0s]
  { t: 22.5, freq: N.D5, dur: 0.7 },
  { t: 23.3, freq: N.C5, dur: 0.7 },
  { t: 24.1, freq: N.B4, dur: 0.9 },
  { t: 25.2, freq: N.G4, dur: 0.8 },
  { t: 26.2, freq: N.C5, dur: 2.2 },
  { t: 28.6, freq: N.E5, dur: 0.8 },
];

const QUIZ_HARMONY_CHORDS: NoteEvent[] = [
  // 0s - 7.5s: Cmaj7 & Am7
  { t: 0.0, freq: N.C4, dur: 0.35, vol: 0.02 }, { t: 0.4, freq: N.E4, dur: 0.35, vol: 0.02 }, { t: 0.8, freq: N.G4, dur: 0.35, vol: 0.02 }, { t: 1.2, freq: N.B4, dur: 0.35, vol: 0.02 },
  { t: 1.8, freq: N.C4, dur: 0.35, vol: 0.02 }, { t: 2.2, freq: N.E4, dur: 0.35, vol: 0.02 }, { t: 2.6, freq: N.G4, dur: 0.35, vol: 0.02 }, { t: 3.0, freq: N.C5, dur: 0.35, vol: 0.02 },
  { t: 3.8, freq: N.A3, dur: 0.35, vol: 0.02 }, { t: 4.2, freq: N.C4, dur: 0.35, vol: 0.02 }, { t: 4.6, freq: N.E4, dur: 0.35, vol: 0.02 }, { t: 5.0, freq: N.G4, dur: 0.35, vol: 0.02 },
  { t: 5.6, freq: N.A3, dur: 0.35, vol: 0.02 }, { t: 6.0, freq: N.C4, dur: 0.35, vol: 0.02 }, { t: 6.4, freq: N.E4, dur: 0.35, vol: 0.02 }, { t: 6.8, freq: N.A4, dur: 0.35, vol: 0.02 },

  // 7.5s - 15.0s: Dm7 & G7
  { t: 7.5, freq: N.D4, dur: 0.35, vol: 0.02 }, { t: 7.9, freq: N.F4, dur: 0.35, vol: 0.02 }, { t: 8.3, freq: N.A4, dur: 0.35, vol: 0.02 }, { t: 8.7, freq: N.C5, dur: 0.35, vol: 0.02 },
  { t: 9.3, freq: N.D4, dur: 0.35, vol: 0.02 }, { t: 9.7, freq: N.F4, dur: 0.35, vol: 0.02 }, { t: 10.1, freq: N.A4, dur: 0.35, vol: 0.02 }, { t: 10.5, freq: N.D5, dur: 0.35, vol: 0.02 },
  { t: 11.3, freq: N.G3, dur: 0.35, vol: 0.02 }, { t: 11.7, freq: N.B3, dur: 0.35, vol: 0.02 }, { t: 12.1, freq: N.D4, dur: 0.35, vol: 0.02 }, { t: 12.5, freq: N.F4, dur: 0.35, vol: 0.02 },
  { t: 13.1, freq: N.G3, dur: 0.35, vol: 0.02 }, { t: 13.5, freq: N.B3, dur: 0.35, vol: 0.02 }, { t: 13.9, freq: N.D4, dur: 0.35, vol: 0.02 }, { t: 14.3, freq: N.G4, dur: 0.35, vol: 0.02 },

  // 15.0s - 22.5s: Em7 & Am7
  { t: 15.0, freq: N.E4, dur: 0.35, vol: 0.02 }, { t: 15.4, freq: N.G4, dur: 0.35, vol: 0.02 }, { t: 15.8, freq: N.B4, dur: 0.35, vol: 0.02 }, { t: 16.2, freq: N.D5, dur: 0.35, vol: 0.02 },
  { t: 16.8, freq: N.E4, dur: 0.35, vol: 0.02 }, { t: 17.2, freq: N.G4, dur: 0.35, vol: 0.02 }, { t: 17.6, freq: N.B4, dur: 0.35, vol: 0.02 }, { t: 18.0, freq: N.E5, dur: 0.35, vol: 0.02 },
  { t: 18.8, freq: N.A3, dur: 0.35, vol: 0.02 }, { t: 19.2, freq: N.C4, dur: 0.35, vol: 0.02 }, { t: 19.6, freq: N.E4, dur: 0.35, vol: 0.02 }, { t: 20.0, freq: N.G4, dur: 0.35, vol: 0.02 },
  { t: 20.6, freq: N.A3, dur: 0.35, vol: 0.02 }, { t: 21.0, freq: N.C4, dur: 0.35, vol: 0.02 }, { t: 21.4, freq: N.E4, dur: 0.35, vol: 0.02 }, { t: 21.8, freq: N.A4, dur: 0.35, vol: 0.02 },

  // 22.5s - 30.0s: Fmaj7 & Gsus4 -> C
  { t: 22.5, freq: N.F3, dur: 0.35, vol: 0.02 }, { t: 22.9, freq: N.A3, dur: 0.35, vol: 0.02 }, { t: 23.3, freq: N.C4, dur: 0.35, vol: 0.02 }, { t: 23.7, freq: N.E4, dur: 0.35, vol: 0.02 },
  { t: 24.5, freq: N.G3, dur: 0.35, vol: 0.02 }, { t: 24.9, freq: N.C4, dur: 0.35, vol: 0.02 }, { t: 25.3, freq: N.D4, dur: 0.35, vol: 0.02 }, { t: 25.7, freq: N.G4, dur: 0.35, vol: 0.02 },
  { t: 26.5, freq: N.C4, dur: 0.6, vol: 0.025 }, { t: 27.5, freq: N.E4, dur: 0.6, vol: 0.025 }, { t: 28.5, freq: N.G4, dur: 0.8, vol: 0.025 },
];

const QUIZ_BASS_LINE: NoteEvent[] = [
  { t: 0.0, freq: N.C3, dur: 0.7 }, { t: 0.9, freq: N.E3, dur: 0.7 }, { t: 1.8, freq: N.G3, dur: 0.7 }, { t: 2.7, freq: N.E3, dur: 0.7 },
  { t: 3.8, freq: N.A3, dur: 0.7 }, { t: 4.7, freq: N.C3, dur: 0.7 }, { t: 5.6, freq: N.E3, dur: 0.7 }, { t: 6.5, freq: N.A3, dur: 0.7 },
  { t: 7.5, freq: N.D3, dur: 0.7 }, { t: 8.4, freq: N.F3, dur: 0.7 }, { t: 9.3, freq: N.A3, dur: 0.7 }, { t: 10.2, freq: N.F3, dur: 0.7 },
  { t: 11.3, freq: N.G3, dur: 0.7 }, { t: 12.2, freq: N.B3, dur: 0.7 }, { t: 13.1, freq: N.D3, dur: 0.7 }, { t: 14.0, freq: N.G3, dur: 0.7 },
  { t: 15.0, freq: N.E3, dur: 0.7 }, { t: 15.9, freq: N.G3, dur: 0.7 }, { t: 16.8, freq: N.B3, dur: 0.7 }, { t: 17.7, freq: N.E3, dur: 0.7 },
  { t: 18.8, freq: N.A3, dur: 0.7 }, { t: 19.7, freq: N.C3, dur: 0.7 }, { t: 20.6, freq: N.E3, dur: 0.7 }, { t: 21.5, freq: N.A3, dur: 0.7 },
  { t: 22.5, freq: N.F3, dur: 0.7 }, { t: 23.4, freq: N.A3, dur: 0.7 }, { t: 24.4, freq: N.G3, dur: 0.7 }, { t: 25.3, freq: N.B3, dur: 0.7 },
  { t: 26.3, freq: N.C3, dur: 1.4 }, { t: 28.0, freq: N.G3, dur: 1.4 },
];

const QUIZ_LOOP_DURATION = 30.0; // 30 seconds

function scheduleQuizTrack(startT: number) {
  if (muted || currentBgmType !== 'quiz') return;

  QUIZ_LEAD_MELODY.forEach((n) => {
    playTone(n.freq, n.dur, startT + n.t, 'triangle', 0.045, {
      attack: 0.04,
      decay: 0.1,
      sustain: 0.035,
      release: 0.08,
    });
  });

  QUIZ_HARMONY_CHORDS.forEach((n) => {
    playTone(n.freq, n.dur, startT + n.t, 'sine', n.vol ?? 0.02, {
      attack: 0.02,
      decay: 0.06,
      sustain: 0.015,
      release: 0.05,
    });
  });

  QUIZ_BASS_LINE.forEach((n) => {
    playTone(n.freq, n.dur, startT + n.t, 'triangle', 0.035, {
      attack: 0.03,
      decay: 0.12,
      sustain: 0.025,
      release: 0.1,
    });
  });
}

export function startQuizBGM(): void {
  if (currentBgmType === 'quiz') return;
  stopAllBGM();
  currentBgmType = 'quiz';
  if (muted) return;

  const c = getCtx();
  if (!c) return;

  const now = c.currentTime;
  scheduleQuizTrack(now);

  function loop() {
    if (muted || currentBgmType !== 'quiz') return;
    const ctxNow = getCtx();
    if (!ctxNow) return;
    scheduleQuizTrack(ctxNow.currentTime);
  }

  if (quizTimer) clearInterval(quizTimer);
  quizTimer = setInterval(loop, QUIZ_LOOP_DURATION * 1000);
}

export function stopQuizBGM(): void {
  if (quizTimer) {
    clearInterval(quizTimer);
    quizTimer = null;
  }
  if (currentBgmType === 'quiz') currentBgmType = 'none';
}

export function stopAllBGM(): void {
  if (titleTimer) {
    clearInterval(titleTimer);
    titleTimer = null;
  }
  if (quizTimer) {
    clearInterval(quizTimer);
    quizTimer = null;
  }
  currentBgmType = 'none';
}

// ─── Sound Events (SFX) ─────────────────────────────────────────────────────

export function sfxGearEquip(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playTone(523, 0.06, t, 'square', 0.08);
  playTone(659, 0.06, t + 0.06, 'square', 0.08);
}

export function sfxCorrect(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const notes = [261.63, 329.63, 392.0, 523.25];
  notes.forEach((freq, i) => {
    playTone(freq, 0.12, t + i * 0.1, 'square', 0.12);
  });
  playTone(1046.5, 0.2, t + 0.4, 'sine', 0.08);
}

export function sfxWrong(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playTone(220, 0.08, t, 'sawtooth', 0.1);
  playTone(180, 0.08, t + 0.1, 'sawtooth', 0.1);
  playTone(150, 0.12, t + 0.2, 'sawtooth', 0.08);
}

export function sfxArchiveUnlock(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  for (let i = 0; i < 8; i++) {
    const freq = 400 + i * 120;
    playTone(freq, 0.08, t + i * 0.06, 'sine', 0.06 + i * 0.005);
  }
  playTone(1568, 0.25, t + 0.48, 'sine', 0.1);
}

export function sfxBridgeExtend(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const chimes = [880, 1108.73, 1318.51, 1760];
  chimes.forEach((freq, i) => {
    playTone(freq, 0.15, t + i * 0.08, 'sine', 0.08);
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
    playTone(freq, dur * 0.9, t + cursor, 'square', 0.12);
    cursor += dur;
  });
}

export function sfxCertificateStamp(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playNoise(0.05, t, 0.25);
  playTone(80, 0.15, t, 'sine', 0.2);
  playTone(110, 0.1, t + 0.05, 'sine', 0.12);
}

export function sfxFileLoaded(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playTone(392, 0.08, t, 'square', 0.1);
  playTone(523.25, 0.08, t + 0.09, 'square', 0.1);
  playTone(659.25, 0.15, t + 0.18, 'square', 0.12);
}

export function sfxOwlHoot(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playTone(330, 0.15, t, 'sine', 0.1, { attack: 0.05, decay: 0.1, sustain: 0.08, release: 0.08 });
  playTone(294, 0.2,  t + 0.2, 'sine', 0.08, { attack: 0.03, decay: 0.1, sustain: 0.06, release: 0.1 });
}

export function sfxPageTurn(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  playNoise(0.12, t, 0.06);
  playTone(220, 0.06, t + 0.05, 'triangle', 0.05);
}

/**
 * audioEngine.ts
 * Web Audio API 8-Bit Retro RPG Synthesizer.
 * Features:
 * - Independent BGM Mute (bgmMuted) and SFX Mute (sfxMuted) controls.
 * - 32-Second Tranquil & Serene Magical Library Soundtrack ("Lagu Perpustakaan Syahdu").
 * - Interactive chiptune SFX for answers, stamps, and page turns.
 */

let ctx: AudioContext | null = null;
let bgmMuted = false;
let sfxMuted = false;
let isQuizBgmRunning = false;
let quizTimer: NodeJS.Timeout | null = null;
let quizBgmGain: GainNode | null = null;

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
  return bgmMuted;
}

export function setBgmMuted(val: boolean): boolean {
  bgmMuted = val;
  if (bgmMuted) {
    stopQuizBGM();
  } else {
    startQuizBGM();
  }
  return bgmMuted;
}

export function toggleBgmMute(): boolean {
  bgmMuted = !bgmMuted;
  if (bgmMuted) {
    stopQuizBGM();
  } else {
    startQuizBGM();
  }
  return bgmMuted;
}

export function isSfxMuted(): boolean {
  return sfxMuted;
}

export function setSfxMuted(val: boolean): boolean {
  sfxMuted = val;
  return sfxMuted;
}

export function toggleSfxMute(): boolean {
  sfxMuted = !sfxMuted;
  return sfxMuted;
}

// Backwards-compatible aliases
export function isAudioMuted(): boolean {
  return bgmMuted;
}

export function toggleAudioMute(): boolean {
  return toggleBgmMute();
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
  if (sfxMuted) return;
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
  if (sfxMuted) return;
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

// ─── BGM Tone Synthesizer (Respects bgmMuted) ───────────────────────────────

function playSereneTone(
  targetGain: GainNode,
  frequency: number,
  duration: number,
  startTime: number,
  type: OscillatorType = 'sine',
  volume: number = 0.035,
  attack: number = 0.06,
  decay: number = 0.15,
  release: number = 0.12
): void {
  if (bgmMuted || !isQuizBgmRunning) return;
  const c = getCtx();
  if (!c) return;

  try {
    const osc = c.createOscillator();
    const noteGain = c.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    const sustain = volume * 0.75;
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(volume, startTime + attack);
    noteGain.gain.linearRampToValueAtTime(sustain, startTime + attack + decay);
    noteGain.gain.setValueAtTime(sustain, Math.max(startTime + attack + decay, startTime + duration - release));
    noteGain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(noteGain);
    noteGain.connect(targetGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch {}
}

// ─── Note Frequencies (Hz) ──────────────────────────────────────────────────

const N = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
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
// 32-SECOND SERENE MAGICAL LIBRARY SOUNDTRACK ("Lagu Perpustakaan Syahdu")
// ═══════════════════════════════════════════════════════════════════════════════

const SERENE_LEAD_MELODY: NoteEvent[] = [
  // Phrase 1: Candlelight & Ancient Books (Cmaj7 -> Em7) [0.0s - 8.0s]
  { t: 0.0, freq: N.E4, dur: 1.4, vol: 0.04, type: 'sine' },
  { t: 1.6, freq: N.G4, dur: 1.2, vol: 0.04, type: 'sine' },
  { t: 3.0, freq: N.B4, dur: 1.8, vol: 0.045, type: 'triangle' },
  { t: 5.0, freq: N.C5, dur: 2.2, vol: 0.045, type: 'sine' },

  // Phrase 2: The Whispering Shelves (Fmaj7 -> G6) [8.0s - 16.0s]
  { t: 8.0, freq: N.A4, dur: 1.4, vol: 0.04, type: 'sine' },
  { t: 9.6, freq: N.C5, dur: 1.2, vol: 0.04, type: 'sine' },
  { t: 11.0, freq: N.E5, dur: 2.0, vol: 0.045, type: 'triangle' },
  { t: 13.2, freq: N.D5, dur: 1.4, vol: 0.04, type: 'sine' },
  { t: 14.8, freq: N.B4, dur: 1.0, vol: 0.035, type: 'sine' },

  // Phrase 3: Peaceful Study & Starlight (Am7 -> Dm7) [16.0s - 24.0s]
  { t: 16.0, freq: N.C5, dur: 1.6, vol: 0.04, type: 'sine' },
  { t: 17.8, freq: N.E5, dur: 1.4, vol: 0.045, type: 'sine' },
  { t: 19.4, freq: N.D5, dur: 1.8, vol: 0.045, type: 'triangle' },
  { t: 21.4, freq: N.A4, dur: 1.2, vol: 0.04, type: 'sine' },
  { t: 22.8, freq: N.F4, dur: 1.0, vol: 0.035, type: 'sine' },

  // Phrase 4: The Serene Sanctuary (Fmaj7 -> Gsus4 -> C) [24.0s - 32.0s]
  { t: 24.0, freq: N.G4, dur: 1.4, vol: 0.04, type: 'sine' },
  { t: 25.6, freq: N.A4, dur: 1.2, vol: 0.04, type: 'sine' },
  { t: 27.0, freq: N.B4, dur: 1.6, vol: 0.045, type: 'triangle' },
  { t: 28.8, freq: N.C5, dur: 2.8, vol: 0.05, type: 'sine' },
];

const SERENE_ARPEGGIOS: NoteEvent[] = [
  // 0s - 8s: Cmaj7 (0-4s) & Em7 (4-8s)
  { t: 0.0, freq: N.C4, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 0.8, freq: N.E4, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 1.6, freq: N.G4, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 2.4, freq: N.B4, dur: 1.2, vol: 0.02, type: 'sine' },
  { t: 4.0, freq: N.E4, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 4.8, freq: N.G4, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 5.6, freq: N.B4, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 6.4, freq: N.E5, dur: 1.2, vol: 0.02, type: 'sine' },

  // 8s - 16s: Fmaj7 (8-12s) & G6 (12-16s)
  { t: 8.0, freq: N.F3, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 8.8, freq: N.A3, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 9.6, freq: N.C4, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 10.4, freq: N.E4, dur: 1.2, vol: 0.02, type: 'sine' },
  { t: 12.0, freq: N.G3, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 12.8, freq: N.B3, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 13.6, freq: N.D4, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 14.4, freq: N.G4, dur: 1.2, vol: 0.02, type: 'sine' },

  // 16s - 24s: Am7 (16-20s) & Dm7 (20-24s)
  { t: 16.0, freq: N.A3, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 16.8, freq: N.C4, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 17.6, freq: N.E4, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 18.4, freq: N.G4, dur: 1.2, vol: 0.02, type: 'sine' },
  { t: 20.0, freq: N.D3, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 20.8, freq: N.F3, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 21.6, freq: N.A3, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 22.4, freq: N.C4, dur: 1.2, vol: 0.02, type: 'sine' },

  // 24s - 32s: Fmaj7 (24-28s) & Cmaj7 (28-32s)
  { t: 24.0, freq: N.F3, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 24.8, freq: N.A3, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 25.6, freq: N.C4, dur: 0.8, vol: 0.018, type: 'sine' },
  { t: 26.4, freq: N.E4, dur: 1.2, vol: 0.02, type: 'sine' },
  { t: 28.0, freq: N.C3, dur: 1.0, vol: 0.022, type: 'sine' },
  { t: 29.2, freq: N.G3, dur: 1.0, vol: 0.022, type: 'sine' },
  { t: 30.4, freq: N.C4, dur: 1.4, vol: 0.025, type: 'sine' },
];

const SERENE_BASS: NoteEvent[] = [
  { t: 0.0, freq: N.C3, dur: 3.5, vol: 0.035, type: 'sine' },
  { t: 4.0, freq: N.E3, dur: 3.5, vol: 0.035, type: 'sine' },
  { t: 8.0, freq: N.F2, dur: 3.5, vol: 0.035, type: 'sine' },
  { t: 12.0, freq: N.G2, dur: 3.5, vol: 0.035, type: 'sine' },
  { t: 16.0, freq: N.A2, dur: 3.5, vol: 0.035, type: 'sine' },
  { t: 20.0, freq: N.D3, dur: 3.5, vol: 0.035, type: 'sine' },
  { t: 24.0, freq: N.F2, dur: 3.5, vol: 0.035, type: 'sine' },
  { t: 28.0, freq: N.C3, dur: 3.8, vol: 0.04, type: 'sine' },
];

const SERENE_LOOP_DURATION = 32.0; // 32.0 seconds

function scheduleSereneTrack(targetGain: GainNode, startT: number) {
  if (bgmMuted || !isQuizBgmRunning) return;

  SERENE_LEAD_MELODY.forEach((n) => {
    playSereneTone(targetGain, n.freq, n.dur, startT + n.t, n.type || 'sine', n.vol || 0.04, 0.08, 0.2, 0.15);
  });

  SERENE_ARPEGGIOS.forEach((n) => {
    playSereneTone(targetGain, n.freq, n.dur, startT + n.t, 'sine', n.vol || 0.02, 0.05, 0.15, 0.12);
  });

  SERENE_BASS.forEach((n) => {
    playSereneTone(targetGain, n.freq, n.dur, startT + n.t, 'sine', n.vol || 0.035, 0.12, 0.3, 0.2);
  });
}

export function startQuizBGM(): void {
  if (bgmMuted || isQuizBgmRunning) return;
  const c = getCtx();
  if (!c) return;

  isQuizBgmRunning = true;

  if (quizBgmGain) {
    try {
      quizBgmGain.disconnect();
    } catch {}
  }
  quizBgmGain = c.createGain();
  quizBgmGain.gain.setValueAtTime(1, c.currentTime);
  quizBgmGain.connect(c.destination);

  const targetGain = quizBgmGain;
  const now = c.currentTime;
  scheduleSereneTrack(targetGain, now);

  function loop() {
    if (bgmMuted || !isQuizBgmRunning || !quizBgmGain) return;
    const ctxNow = getCtx();
    if (!ctxNow) return;
    scheduleSereneTrack(quizBgmGain, ctxNow.currentTime);
  }

  if (quizTimer) clearInterval(quizTimer);
  quizTimer = setInterval(loop, SERENE_LOOP_DURATION * 1000);
}

export function stopQuizBGM(): void {
  isQuizBgmRunning = false;
  if (quizTimer) {
    clearInterval(quizTimer);
    quizTimer = null;
  }
  if (quizBgmGain && ctx) {
    try {
      quizBgmGain.gain.cancelScheduledValues(ctx.currentTime);
      quizBgmGain.gain.setValueAtTime(0, ctx.currentTime);
      quizBgmGain.disconnect();
    } catch {}
    quizBgmGain = null;
  }
}

export function stopAllBGM(): void {
  stopQuizBGM();
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

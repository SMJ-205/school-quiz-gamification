// ─── Global Audio Singleton (Survives Fast Refresh & Prevents Duplicate Audio) ───

declare global {
  interface Window {
    __QUIZ_BGM_AUDIO__?: HTMLAudioElement | null;
    __QUIZ_LAB_BGM_AUDIO__?: HTMLAudioElement | null;
    __QUIZ_BOSS_BGM_AUDIO__?: HTMLAudioElement | null;
    __QUIZ_MAIN_MENU_BGM_AUDIO__?: HTMLAudioElement | null;
    __QUIZ_AUDIO_CTX__?: AudioContext | null;
    __QUIZ_BGM_MUTED__?: boolean;
    __QUIZ_SFX_MUTED__?: boolean;
    __QUIZ_BGM_RUNNING__?: boolean;
    __QUIZ_UNLOCKED__?: boolean;
  }
}

export const BGM_VOLUME = 0.22; // Comfortable, clearly audible background music on mobile & desktop (22%)
export const BGM_VOLUME_LAB = 0.16; // Balanced volume for Lab IPA session (16%) so it never overpowers SFX
export const BGM_VOLUME_BOSS = 0.16; // Balanced, comfortable volume for Sombo Boss Encounter (16%) so it never overpowers SFX
export const BGM_VOLUME_MAIN_MENU = 0.18; // Balanced, comfortable volume for Main Menu, Char & Map Select (18%)

function getBgmAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  if (!window.__QUIZ_BGM_AUDIO__) {
    // Music: "Momo Island" by Piki (https://freetouse.com/music/piki/momo-island)
    // License: Free To Use Music (https://freetouse.com/license)
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

function getLabBgmAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  if (!window.__QUIZ_LAB_BGM_AUDIO__) {
    // Music: "Creativity" by Aylex (https://freetouse.com/music/aylex/creativity)
    // License: Free To Use Music (https://freetouse.com/license)
    const audio = new Audio('/audio/Aylex - Creativity (freetouse.com).mp3');
    audio.loop = true;
    audio.volume = BGM_VOLUME_LAB;
    audio.preload = 'auto';
    audio.setAttribute('playsinline', 'true');
    (audio as unknown as { playsInline?: boolean }).playsInline = true;
    window.__QUIZ_LAB_BGM_AUDIO__ = audio;
  } else {
    window.__QUIZ_LAB_BGM_AUDIO__.volume = isBgmMuted() ? 0 : BGM_VOLUME_LAB;
  }

  return window.__QUIZ_LAB_BGM_AUDIO__;
}

function getBossBgmAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  if (!window.__QUIZ_BOSS_BGM_AUDIO__) {
    // Music: "Boss Encounter" (ボスとのそうぐう) by retro-bgm-chan
    // License: Pixabay License (https://pixabay.com/music/video-games-boss-encounter-%E3%83%9C%E3%82%B9%E3%81%A8%E3%81%9D%E3%81%86%E3%81%90%E3%81%86-534623/)
    const audio = new Audio('/audio/retro-bgm-chan-boss-encounter-534623.mp3');
    audio.loop = true;
    audio.volume = BGM_VOLUME_BOSS;
    audio.preload = 'auto';
    audio.setAttribute('playsinline', 'true');
    (audio as unknown as { playsInline?: boolean }).playsInline = true;
    window.__QUIZ_BOSS_BGM_AUDIO__ = audio;
  } else {
    window.__QUIZ_BOSS_BGM_AUDIO__.volume = isBgmMuted() ? 0 : BGM_VOLUME_BOSS;
  }

  return window.__QUIZ_BOSS_BGM_AUDIO__;
}

function getMainMenuBgmAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  if (!window.__QUIZ_MAIN_MENU_BGM_AUDIO__) {
    // Music: "Serious Mood" (しりあすもーど) by retro-bgm-chan
    // Reference: https://pixabay.com/music/electro-serious-mood-%E3%81%97%E3%82%8A%E3%81%82%E3%81%99%E3%82%82%E3%83%BC%E3%81%A9-516326/
    const audio = new Audio('/audio/retro-bgm-chan-serious-mood-516326.mp3');
    audio.loop = true;
    audio.volume = BGM_VOLUME_MAIN_MENU;
    audio.preload = 'auto';
    audio.setAttribute('playsinline', 'true');
    (audio as unknown as { playsInline?: boolean }).playsInline = true;
    window.__QUIZ_MAIN_MENU_BGM_AUDIO__ = audio;
  } else {
    window.__QUIZ_MAIN_MENU_BGM_AUDIO__.volume = isBgmMuted() ? 0 : BGM_VOLUME_MAIN_MENU;
  }

  return window.__QUIZ_MAIN_MENU_BGM_AUDIO__;
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
  if (window.__QUIZ_BGM_RUNNING__ && !isBgmMuted()) {
    if (activeTrackId === 'momo_island') {
      const bgm = getBgmAudio();
      if (bgm && bgm.paused) {
        bgm.muted = false;
        bgm.volume = BGM_VOLUME;
        bgm.play().catch(() => {});
      }
    } else if (activeTrackId === 'aylex_creativity' || activeTrackId === 'lab_creativity') {
      const labBgm = getLabBgmAudio();
      if (labBgm && labBgm.paused) {
        labBgm.muted = false;
        labBgm.volume = BGM_VOLUME_LAB;
        labBgm.play().catch(() => {});
      }
    } else if (activeTrackId === 'fast_boss_beat' || activeTrackId === 'high_beat_lofi' || activeTrackId === 'boss_encounter') {
      const bossBgm = getBossBgmAudio();
      if (bossBgm && bossBgm.paused) {
        bossBgm.muted = false;
        bossBgm.volume = BGM_VOLUME_BOSS;
        bossBgm.play().catch(() => {});
      }
    } else if (
      activeTrackId === 'main_menu' ||
      activeTrackId === 'character_select' ||
      activeTrackId === 'map_select' ||
      activeTrackId === 'serious_mood'
    ) {
      const mainMenuBgm = getMainMenuBgmAudio();
      if (mainMenuBgm && mainMenuBgm.paused) {
        mainMenuBgm.muted = false;
        mainMenuBgm.volume = BGM_VOLUME_MAIN_MENU;
        mainMenuBgm.play().catch(() => {});
      }
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
      if (typeof window !== 'undefined' && window.__QUIZ_BGM_RUNNING__ && activeTrackId === 'momo_island') {
        audio.play().catch(() => {});
      }
    }
  }

  const labAudio = getLabBgmAudio();
  if (labAudio) {
    if (val) {
      labAudio.pause();
      labAudio.muted = true;
      labAudio.volume = 0;
    } else {
      labAudio.muted = false;
      labAudio.volume = BGM_VOLUME_LAB;
      if (typeof window !== 'undefined' && window.__QUIZ_BGM_RUNNING__ && (activeTrackId === 'aylex_creativity' || activeTrackId === 'lab_creativity')) {
        labAudio.play().catch(() => {});
      }
    }
  }

  const bossAudio = getBossBgmAudio();
  if (bossAudio) {
    if (val) {
      bossAudio.pause();
      bossAudio.muted = true;
      bossAudio.volume = 0;
    } else {
      bossAudio.muted = false;
      bossAudio.volume = BGM_VOLUME_BOSS;
      if (typeof window !== 'undefined' && window.__QUIZ_BGM_RUNNING__ && (activeTrackId === 'fast_boss_beat' || activeTrackId === 'high_beat_lofi' || activeTrackId === 'boss_encounter')) {
        bossAudio.play().catch(() => {});
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

// ── Track 4: 32-Second Epic Arcade Chiptune Composition for Sombo Boss Battle ──
// 4 Distinct Musical Sections (256 Notes Total @ 125ms per note = 32.0 Seconds Seamless Loop)

const SOMBO_BATTLE_32S_NOTES = (() => {
  const notes: { freq: number; dur: number; bassFreq?: number }[] = [];

  // Section A: Main Battle Motif (A minor driving arcade theme, 0s - 8s, 64 notes)
  const motifA = [
    { f: 220.00, b: 110.00 }, { f: 329.63, b: 110.00 }, { f: 440.00, b: 110.00 }, { f: 523.25, b: 110.00 },
    { f: 440.00, b: 110.00 }, { f: 329.63, b: 110.00 }, { f: 261.63, b: 110.00 }, { f: 329.63, b: 110.00 },
    { f: 293.66, b: 146.83 }, { f: 349.23, b: 146.83 }, { f: 440.00, b: 146.83 }, { f: 587.33, b: 146.83 },
    { f: 523.25, b: 146.83 }, { f: 440.00, b: 146.83 }, { f: 349.23, b: 146.83 }, { f: 293.66, b: 146.83 },
  ];
  for (let r = 0; r < 4; r++) {
    motifA.forEach(n => notes.push({ freq: n.f, bassFreq: n.b, dur: 0.11 }));
  }

  // Section B: Modulating Escalation & Harmonic Tension (F Major -> G Major -> E7, 8s - 16s, 64 notes)
  const motifB = [
    { f: 174.61, b: 87.31 }, { f: 261.63, b: 87.31 }, { f: 349.23, b: 87.31 }, { f: 440.00, b: 87.31 },
    { f: 523.25, b: 87.31 }, { f: 440.00, b: 87.31 }, { f: 349.23, b: 87.31 }, { f: 261.63, b: 87.31 },
    { f: 174.61, b: 87.31 }, { f: 261.63, b: 87.31 }, { f: 349.23, b: 87.31 }, { f: 523.25, b: 87.31 },
    { f: 698.46, b: 87.31 }, { f: 523.25, b: 87.31 }, { f: 349.23, b: 87.31 }, { f: 261.63, b: 87.31 },

    { f: 196.00, b: 98.00 }, { f: 293.66, b: 98.00 }, { f: 392.00, b: 98.00 }, { f: 493.88, b: 98.00 },
    { f: 587.33, b: 98.00 }, { f: 493.88, b: 98.00 }, { f: 392.00, b: 98.00 }, { f: 293.66, b: 98.00 },
    { f: 196.00, b: 98.00 }, { f: 293.66, b: 98.00 }, { f: 392.00, b: 98.00 }, { f: 587.33, b: 98.00 },
    { f: 783.99, b: 98.00 }, { f: 587.33, b: 98.00 }, { f: 392.00, b: 98.00 }, { f: 293.66, b: 98.00 },

    { f: 164.81, b: 82.41 }, { f: 246.94, b: 82.41 }, { f: 329.63, b: 82.41 }, { f: 415.30, b: 82.41 },
    { f: 493.88, b: 82.41 }, { f: 587.33, b: 82.41 }, { f: 659.25, b: 82.41 }, { f: 830.61, b: 82.41 },
    { f: 659.25, b: 82.41 }, { f: 587.33, b: 82.41 }, { f: 493.88, b: 82.41 }, { f: 415.30, b: 82.41 },
    { f: 329.63, b: 82.41 }, { f: 246.94, b: 82.41 }, { f: 164.81, b: 82.41 }, { f: 329.63, b: 82.41 },
    { f: 415.30, b: 82.41 }, { f: 493.88, b: 82.41 }, { f: 587.33, b: 82.41 }, { f: 659.25, b: 82.41 },
    { f: 830.61, b: 82.41 }, { f: 987.77, b: 82.41 }, { f: 830.61, b: 82.41 }, { f: 659.25, b: 82.41 },
    { f: 587.33, b: 82.41 }, { f: 493.88, b: 82.41 }, { f: 415.30, b: 82.41 }, { f: 329.63, b: 82.41 },
    { f: 246.94, b: 82.41 }, { f: 164.81, b: 82.41 }, { f: 246.94, b: 82.41 }, { f: 329.63, b: 82.41 },
  ];
  motifB.forEach(n => notes.push({ freq: n.f, bassFreq: n.b, dur: 0.11 }));

  // Section C: High-Speed Heroic Arcade Solo (High Register A5 Arpeggiated Virtuoso, 16s - 24s, 64 notes)
  const motifC = [
    { f: 880.00, b: 220.00 }, { f: 1046.50, b: 220.00 }, { f: 1318.51, b: 220.00 }, { f: 1046.50, b: 220.00 },
    { f: 880.00, b: 220.00 }, { f: 659.25, b: 220.00 }, { f: 523.25, b: 220.00 }, { f: 659.25, b: 220.00 },
    { f: 783.99, b: 196.00 }, { f: 987.77, b: 196.00 }, { f: 1174.66, b: 196.00 }, { f: 987.77, b: 196.00 },
    { f: 783.99, b: 196.00 }, { f: 587.33, b: 196.00 }, { f: 493.88, b: 196.00 }, { f: 587.33, b: 196.00 },
  ];
  for (let r = 0; r < 4; r++) {
    motifC.forEach(n => notes.push({ freq: n.f, bassFreq: n.b, dur: 0.11 }));
  }

  // Section D: Sub-Bass Rhythmic Cadence & Seamless Resolution back to Section A (24s - 32s, 64 notes)
  const motifD = [
    { f: 349.23, b: 87.31 }, { f: 440.00, b: 87.31 }, { f: 523.25, b: 87.31 }, { f: 698.46, b: 87.31 },
    { f: 523.25, b: 87.31 }, { f: 440.00, b: 87.31 }, { f: 349.23, b: 87.31 }, { f: 261.63, b: 87.31 },
    { f: 392.00, b: 98.00 }, { f: 493.88, b: 98.00 }, { f: 587.33, b: 98.00 }, { f: 783.99, b: 98.00 },
    { f: 587.33, b: 98.00 }, { f: 493.88, b: 98.00 }, { f: 392.00, b: 98.00 }, { f: 293.66, b: 98.00 },
    { f: 329.63, b: 82.41 }, { f: 415.30, b: 82.41 }, { f: 493.88, b: 82.41 }, { f: 659.25, b: 82.41 },
    { f: 830.61, b: 82.41 }, { f: 659.25, b: 82.41 }, { f: 493.88, b: 82.41 }, { f: 415.30, b: 82.41 },
    { f: 329.63, b: 82.41 }, { f: 246.94, b: 82.41 }, { f: 164.81, b: 82.41 }, { f: 246.94, b: 82.41 },
    { f: 329.63, b: 82.41 }, { f: 415.30, b: 82.41 }, { f: 493.88, b: 82.41 }, { f: 659.25, b: 82.41 },
  ];
  for (let r = 0; r < 2; r++) {
    motifD.forEach(n => notes.push({ freq: n.f, bassFreq: n.b, dur: 0.11 }));
  }

  return notes;
})();

const FAST_BOSS_BEAT_NOTES = SOMBO_BATTLE_32S_NOTES;

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

function startSynthLoop(notes: { freq: number; dur: number; bassFreq?: number }[], oscType: OscillatorType, speedMs: number, vol: number) {
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
      // Lead Oscillator
      const osc = c.createOscillator();
      const noteGain = c.createGain();
      osc.type = oscType;
      osc.frequency.setValueAtTime(item.freq, c.currentTime);

      noteGain.gain.setValueAtTime(0.01, c.currentTime);
      noteGain.gain.linearRampToValueAtTime(1.0, c.currentTime + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + item.dur);

      osc.connect(noteGain);
      noteGain.connect(synthGainNode);

      osc.start(c.currentTime);
      osc.stop(c.currentTime + item.dur + 0.04);

      // Sub-bass Accompaniment (if specified)
      if (item.bassFreq) {
        const bassOsc = c.createOscillator();
        const bassGain = c.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(item.bassFreq, c.currentTime);

        bassGain.gain.setValueAtTime(0.01, c.currentTime);
        bassGain.gain.linearRampToValueAtTime(0.4, c.currentTime + 0.02);
        bassGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + item.dur);

        bassOsc.connect(bassGain);
        bassGain.connect(synthGainNode);

        bassOsc.start(c.currentTime);
        bassOsc.stop(c.currentTime + item.dur + 0.04);
      }
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

let playPromise: Promise<void> | null = null;

export function stopAllBgmMedia(): void {
  if (typeof window === 'undefined') return;
  window.__QUIZ_BGM_RUNNING__ = false;

  const audio = getBgmAudio();
  if (audio) {
    if (playPromise) {
      playPromise
        .then(() => {
          audio.pause();
          try { audio.currentTime = 0; } catch {}
        })
        .catch(() => {});
    }
    audio.pause();
    try { audio.currentTime = 0; } catch {}
  }

  const labAudio = getLabBgmAudio();
  if (labAudio) {
    labAudio.pause();
    try { labAudio.currentTime = 0; } catch {}
  }

  const bossAudio = getBossBgmAudio();
  if (bossAudio) {
    bossAudio.pause();
    try { bossAudio.currentTime = 0; } catch {}
  }

  const mainMenuAudio = getMainMenuBgmAudio();
  if (mainMenuAudio) {
    mainMenuAudio.pause();
    try { mainMenuAudio.currentTime = 0; } catch {}
  }

  stopSynthBgm();

  if (typeof document !== 'undefined') {
    const allAudios = document.querySelectorAll('audio');
    allAudios.forEach((a) => {
      a.pause();
      try { a.currentTime = 0; } catch {}
    });
  }
}

export function startQuizBGM(trackId?: string): void {
  if (typeof window === 'undefined') return;

  const targetTrack = trackId || activeTrackId;

  const isTargetMainMenu =
    targetTrack === 'main_menu' ||
    targetTrack === 'character_select' ||
    targetTrack === 'map_select' ||
    targetTrack === 'serious_mood';

  const isCurrentMainMenu =
    activeTrackId === 'main_menu' ||
    activeTrackId === 'character_select' ||
    activeTrackId === 'map_select' ||
    activeTrackId === 'serious_mood';

  window.__QUIZ_BGM_RUNNING__ = true;

  // If transitioning within the Main Menu / Char Select / Map Select screens,
  // and Main Menu audio is ALREADY playing, DO NOT STOP OR RESET IT!
  if (isTargetMainMenu && isCurrentMainMenu) {
    const audio = getMainMenuBgmAudio();
    activeTrackId = 'main_menu';
    if (isBgmMuted()) return;
    if (audio) {
      audio.muted = false;
      audio.volume = BGM_VOLUME_MAIN_MENU;
      if (audio.paused && !isStartingBgm) {
        unlockAudioEngine();
        isStartingBgm = true;
        playPromise = audio.play();
        playPromise
          .then(() => {
            isStartingBgm = false;
            playPromise = null;
          })
          .catch(() => {
            isStartingBgm = false;
            playPromise = null;
          });
      }
    }
    return;
  }

  if (trackId) activeTrackId = trackId;

  // Stop ALL media & synth loops first so tracks NEVER overlap
  stopAllBgmMedia();
  window.__QUIZ_BGM_RUNNING__ = true; // Re-enable after stopAllBgmMedia

  if (isBgmMuted() || activeTrackId === 'muted') {
    return;
  }

  unlockAudioEngine();

  if (activeTrackId === 'momo_island') {
    const audio = getBgmAudio();
    if (!audio) return;
    audio.muted = false;
    audio.volume = BGM_VOLUME;
    if (audio.paused && !isStartingBgm) {
      isStartingBgm = true;
      playPromise = audio.play();
      playPromise
        .then(() => {
          isStartingBgm = false;
          playPromise = null;
        })
        .catch(() => {
          isStartingBgm = false;
          playPromise = null;
        });
    }
  } else if (activeTrackId === 'aylex_creativity' || activeTrackId === 'lab_creativity') {
    const audio = getLabBgmAudio();
    if (!audio) return;
    audio.muted = false;
    audio.volume = BGM_VOLUME_LAB;
    if (audio.paused && !isStartingBgm) {
      isStartingBgm = true;
      playPromise = audio.play();
      playPromise
        .then(() => {
          isStartingBgm = false;
          playPromise = null;
        })
        .catch(() => {
          isStartingBgm = false;
          playPromise = null;
        });
    }
  } else if (activeTrackId === 'fast_boss_beat' || activeTrackId === 'high_beat_lofi' || activeTrackId === 'boss_encounter') {
    const audio = getBossBgmAudio();
    if (!audio) return;
    audio.muted = false;
    audio.volume = BGM_VOLUME_BOSS;
    if (audio.paused && !isStartingBgm) {
      isStartingBgm = true;
      playPromise = audio.play();
      playPromise
        .then(() => {
          isStartingBgm = false;
          playPromise = null;
        })
        .catch(() => {
          isStartingBgm = false;
          playPromise = null;
        });
    }
  } else if (
    activeTrackId === 'main_menu' ||
    activeTrackId === 'character_select' ||
    activeTrackId === 'map_select' ||
    activeTrackId === 'serious_mood'
  ) {
    const audio = getMainMenuBgmAudio();
    if (!audio) return;
    audio.muted = false;
    audio.volume = BGM_VOLUME_MAIN_MENU;
    if (audio.paused && !isStartingBgm) {
      isStartingBgm = true;
      playPromise = audio.play();
      playPromise
        .then(() => {
          isStartingBgm = false;
          playPromise = null;
        })
        .catch(() => {
          isStartingBgm = false;
          playPromise = null;
        });
    }
  } else if (activeTrackId === '8bit_quest') {
    startSynthLoop(CHIPTUNE_NOTES, 'square', 240, 0.12);
  } else if (activeTrackId === 'cozy_lofi') {
    startSynthLoop(LOFI_NOTES, 'triangle', 480, 0.15);
  }
}

export function stopQuizBGM(): void {
  if (typeof window === 'undefined') return;
  stopAllBgmMedia();
}

export function stopAllBGM(): void {
  stopQuizBGM();
}

// ─── SFX Tone Synthesizer (Respects sfxMuted & Scaled Volume) ───────────────

export const SFX_VOLUME_SCALE = 0.45; // Balanced, clear SFX scale to be clearly audible over BGM without speaker distortion

function playSfxTone(
  frequency: number,
  duration: number,
  startTime: number,
  type: OscillatorType = 'triangle',
  volume: number = 0.20,
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
    const filterNode = c.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    // Low-pass filter (4800Hz) to preserve crisp retro chimes while eliminating harsh digital clipping/crackling
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(4800, startTime);

    const env = gainEnvelope ?? {};
    const attack = env.attack ?? 0.01;
    const decay = env.decay ?? 0.06;
    const effectiveVol = volume * SFX_VOLUME_SCALE;
    const sustain = (env.sustain ?? volume * 0.6) * SFX_VOLUME_SCALE;
    const release = env.release ?? 0.04;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(effectiveVol, startTime + attack);
    gainNode.gain.linearRampToValueAtTime(sustain, startTime + attack + decay);
    gainNode.gain.setValueAtTime(sustain, Math.max(startTime + attack + decay, startTime + duration - release));
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(filterNode);
    filterNode.connect(gainNode);
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
      data[i] = (Math.random() * 2 - 1) * 0.3;
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
  playSfxTone(523, 0.06, t, 'triangle', 0.18);
  playSfxTone(659, 0.06, t + 0.06, 'triangle', 0.18);
}

export function sfxCorrect(): void {
  if (isSfxMuted()) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;

  // Clear, Warm & Punchy Arcade Power-Hit SFX for Sombo Boss Battle
  if (activeTrackId === 'fast_boss_beat' || activeTrackId === 'high_beat_lofi') {
    const bossHitNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    bossHitNotes.forEach((freq, i) => {
      playSfxTone(freq, 0.06, t + i * 0.035, 'triangle', 0.22);
    });
    playSfxTone(1318.51, 0.15, t + 0.16, 'sine', 0.20);
  } else {
    // Standard Quiz Classroom Correct SFX (Crisp, warm triangle & sine chimes)
    const notes = [261.63, 329.63, 392.0, 523.25];
    notes.forEach((freq, i) => {
      playSfxTone(freq, 0.10, t + i * 0.08, 'triangle', 0.22);
    });
    playSfxTone(1046.5, 0.16, t + 0.32, 'sine', 0.18);
  }
}

export function sfxWrong(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  // Clear, warm low-frequency error tone (clearly audible over BGM)
  playSfxTone(220, 0.09, t, 'triangle', 0.22);
  playSfxTone(180, 0.09, t + 0.09, 'triangle', 0.22);
  playSfxTone(140, 0.12, t + 0.18, 'sine', 0.18);
}

export function sfxArchiveUnlock(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  for (let i = 0; i < 8; i++) {
    const freq = 400 + i * 120;
    playSfxTone(freq, 0.08, t + i * 0.06, 'sine', 0.08 + i * 0.01);
  }
  playSfxTone(1568, 0.25, t + 0.48, 'sine', 0.12);
}

export function sfxBridgeExtend(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const chimes = [880, 1108.73, 1318.51, 1760];
  chimes.forEach((freq, i) => {
    playSfxTone(freq, 0.15, t + i * 0.08, 'sine', 0.10);
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
    playSfxTone(freq, dur * 0.9, t + cursor, 'triangle', 0.14);
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





'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useGameStore } from '@/store/useGameStore';
import { parseQuizMarkdown, readMarkdownFile } from '@/lib/markdownParser';
import { NOTEBOOKLM_PROMPT } from '@/lib/constants';
import { sfxFileLoaded, sfxWrong, isAudioMuted, toggleAudioMute, unlockAudioEngine } from '@/lib/audioEngine';

export default function IngestionScreen() {
  const { setStudentName, loadQuizSession, studentName, showNotebookLMModal, setShowNotebookLMModal } = useGameStore();
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [muted, setMuted]     = useState(false);

  useEffect(() => {
    setMuted(isAudioMuted());
  }, []);

  function handleToggleSound() {
    unlockAudioEngine();
    const isNowMuted = toggleAudioMute();
    setMuted(isNowMuted);
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    unlockAudioEngine();
    const file = acceptedFiles[0];
    if (!file) return;
    if (!file.name.endsWith('.md')) {
      setError('File harus berformat Markdown (.md)!');
      sfxWrong();
      setShakeKey(k => k + 1);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const content = await readMarkdownFile(file);
      const { metadata, questions } = parseQuizMarkdown(content);
      sfxFileLoaded();
      loadQuizSession(metadata, questions);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses file.';
      setError(msg);
      sfxWrong();
      setShakeKey(k => k + 1);
    } finally {
      setLoading(false);
    }
  }, [loadQuizSession]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/markdown': ['.md'] },
    multiple: false,
  });

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(NOTEBOOKLM_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  }

  function handleLoadSample() {
    unlockAudioEngine();
    const sampleMd = `---
title: "Sejarah & Pengetahuan Umum"
grade: 5
subject: "Ilmu Pengetahuan"
author: "The Growth of Knowledge"
---

### Q1
Pada tahun berapakah Indonesia memproklamasikan kemerdekaannya?
- [x] 1945
- [ ] 1949
- [ ] 1942
- [ ] 1950
*Hint: Kemerdekaan diproklamasikan pada tanggal 17 Agustus 1945.*

### Q2
Planet terbesar dalam tata surya kita adalah...
- [ ] Mars
- [ ] Bumi
- [x] Jupiter
- [ ] Saturnus
*Hint: Planet raksasa gas dengan Bintik Merah Raksasa.*

### Q3
Buku dan naskah kuno pada masa lampau biasanya ditulis di atas...
- [ ] Kertas Plastik
- [x] Daun Lontar atau Perkamen
- [ ] Lembaran Besi
- [ ] Kaca
*Hint: Bahan alami dari tumbuhan daun lontar atau kulit hewan yang diawetkan.*

### Q4
Alat optik yang digunakan para peneliti untuk mengamati benda-benda renik/mikro adalah...
- [ ] Teleskop
- [ ] Periskop
- [x] Mikroskop
- [ ] Monokle
*Hint: Alat dengan lensa pembesar tinggi di laboratorium.*

### Q5
Cahaya matahari membutuhkan waktu sekitar berapa menit untuk sampai ke Bumi?
- [ ] 1 Detik
- [x] 8 Menit
- [ ] 1 Jam
- [ ] 1 Hari
*Hint: Cahaya merambat sejauh 150 juta kilometer dalam waktu sekitar 8 menit 20 detik.*
`;
    try {
      const { metadata, questions } = parseQuizMarkdown(sampleMd);
      sfxFileLoaded();
      loadQuizSession(metadata, questions);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 relative select-none"
      style={{
        background: 'radial-gradient(ellipse at 50% 20%, #2A170B 0%, #150C07 50%, #0A0604 100%)',
      }}>

      {/* Floating Sound Toggle on Main Screen */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={handleToggleSound}
          title={muted ? 'Nyalakan Musik (Unmute)' : 'Matikan Musik (Mute)'}
          className={`p-2 px-3 rounded-lg border text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg ${
            muted
              ? 'bg-red-950/80 border-red-500/60 text-red-300 hover:bg-red-900'
              : 'bg-amber-950/80 border-amber-500/60 text-amber-300 hover:bg-amber-900'
          }`}
        >
          <span>{muted ? '🔇' : '🔊'}</span>
          <span className="text-xs font-dialogue text-base">{muted ? 'MUTE' : 'BGM'}</span>
        </button>
      </div>

      {/* Atmospheric Library Lanterns & Books in Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden z-0">
        <div className="absolute top-0 left-10 text-6xl anim-float">🏮</div>
        <div className="absolute top-0 right-10 text-6xl anim-float" style={{ animationDelay: '1.2s' }}>🏮</div>
        <div className="absolute bottom-10 left-8 text-7xl opacity-40">📚</div>
        <div className="absolute bottom-12 right-12 text-7xl opacity-40">🏛️</div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">

        {/* CRT Style Header Poster Banner */}
        <div className="crt-arcade-frame p-2.5 sm:p-3 mb-5 text-center overflow-hidden relative group">
          {/* Poster Image Container */}
          <div className="relative w-full h-52 sm:h-64 md:h-72 rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-2xl">
            <img
              src="/backgrounds/main_menu_poster.jpg"
              alt="The Growth of Knowledge — Characters Poster"
              className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
            />
            {/* Scrim Overlays for Header High Contrast & Text Legibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/30 to-black/85" />

            {/* Attached Header Content Overlayed on Poster */}
            <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-between items-center text-center z-10">
              {/* Top Badge */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 mt-1">
                <span className="text-xl sm:text-2xl drop-shadow">📖</span>
                <div className="retro-pill-badge !bg-amber-950/90 !border-amber-400 text-amber-300 shadow-md">
                  ACADEMY ARCHIVES
                </div>
                <span className="text-xl sm:text-2xl drop-shadow">✨</span>
              </div>

              {/* Bottom Title & Subtitle Attached on Poster */}
              <div className="mb-1 max-w-lg">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider text-amber-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] leading-tight">
                  THE GROWTH OF KNOWLEDGE
                </h1>
                <p className="font-dialogue text-base sm:text-lg md:text-xl text-amber-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] tracking-wide mt-1">
                  Petualangan Kuis &amp; Eksplorasi Arsip Pengetahuan
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Name Input Box */}
        <div className="pixel-dialogue-box mb-4 p-3 sm:p-4">
          <label className="block text-amber-300 text-base sm:text-lg font-bold tracking-wider mb-1.5">
            👤 NAMA PELAJAR / PETUALANG
          </label>
          <input
            className="w-full bg-black/60 border-2 border-amber-500/40 focus:border-amber-400 text-white font-dialogue text-xl sm:text-2xl px-3 py-2 rounded outline-none transition-all placeholder:text-stone-500"
            type="text"
            placeholder="Ketik namamu di sini..."
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            maxLength={35}
          />
        </div>

        {/* Dropzone File Upload */}
        <div className="pixel-dialogue-box mb-4 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-amber-300 text-base sm:text-lg font-bold tracking-wider">
              📂 UNGGAH MATERI KUIS (.md)
            </p>
            <button
              onClick={handleLoadSample}
              className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              ▶ Coba Kuis Contoh
            </button>
          </div>

          <div
            key={shakeKey}
            {...getRootProps()}
            className={`border-3 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                : 'border-stone-600 hover:border-amber-400/80 bg-black/40 hover:bg-black/60'
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-3xl sm:text-4xl mb-1.5">
              {loading ? '⏳' : isDragActive ? '📥' : '📜'}
            </div>
            <p className="text-stone-200 text-sm sm:text-base font-bold mb-0.5">
              {loading
                ? 'Membaca Kitab Pengetahuan...'
                : isDragActive
                  ? 'Lepaskan berkas di sini!'
                  : 'Seret & jatuhkan berkas .md di sini'}
            </p>
            <p className="text-stone-400 font-dialogue text-base sm:text-lg">
              atau klik untuk memilih dari komputer
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mt-2 p-2.5 bg-red-950/80 border-2 border-red-500 rounded text-red-200 font-dialogue text-base sm:text-lg leading-relaxed">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Helper Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="btn-pixel btn-pixel-teal flex-1 text-xs sm:text-sm py-3 flex items-center justify-center gap-2 shadow-lg"
            onClick={() => setShowNotebookLMModal(true)}
          >
            <span>🤖</span>
            <span>BUAT KUIS VIA NOTEBOOKLM</span>
          </button>
        </div>
      </div>

      {/* NotebookLM Prompt Helper Modal */}
      {showNotebookLMModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNotebookLMModal(false)}>
          <div
            className="pixel-dialogue-box max-w-xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-700 pb-3 mb-3">
              <h2 className="text-lg sm:text-xl font-bold text-amber-300 flex items-center gap-2">
                <span>📜</span> TEMPLATE PROMPT NOTEBOOKLM
              </h2>
              <button
                onClick={() => setShowNotebookLMModal(false)}
                className="text-stone-400 hover:text-white text-2xl font-bold px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="font-dialogue text-base sm:text-lg text-stone-300 mb-3 leading-relaxed">
              Salin petunjuk ini ke Google NotebookLM setelah mengunggah catatan/buku pelajaran Anda, lalu unduh berkas Markdown (.md) untuk langsung dimainkan:
            </p>

            <div className="bg-black/90 border border-amber-500/30 p-3 sm:p-4 rounded mb-4 max-h-60 overflow-y-auto">
              <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {NOTEBOOKLM_PROMPT}
              </pre>
            </div>

            <button
              className={`btn-pixel w-full py-3 text-xs sm:text-sm cursor-pointer ${copied ? 'btn-pixel-gold' : 'btn-pixel-wood'}`}
              onClick={handleCopyPrompt}
            >
              {copied ? '✓ BERHASIL DISALIN KE CLIPBOARD!' : '📋 SALIN PROMPT NOTEBOOKLM'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

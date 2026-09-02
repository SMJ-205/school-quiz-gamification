'use client';

/**
 * HowToPlayModal.tsx
 * Beginner 101 Friendly Guide Modal for Non-Tech Users (Parents, Teachers, Beginners).
 * Features:
 * - Overview of Gamification features & 4 learning modes
 * - 101 Guide to accessing & using Google NotebookLM to generate custom Markdown (.md) quizzes
 * - One-click Copy Prompt functionality with visual feedback
 */

import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { NOTEBOOKLM_PROMPT } from '@/lib/constants';

export default function HowToPlayModal() {
  const { showHowToPlayModal, setShowHowToPlayModal } = useGameStore();
  const [copied, setCopied] = useState(false);

  if (!showHowToPlayModal) return null;

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(NOTEBOOKLM_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn"
      onClick={() => setShowHowToPlayModal(false)}
    >
      <div
        className="relative w-full max-w-3xl crt-arcade-frame bg-[#120B07] border-4 border-amber-500 rounded-2xl p-4 sm:p-7 shadow-2xl text-stone-100 font-dialogue max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-amber-900/80 pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl">📖</span>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-pixel text-amber-300 tracking-wider">
                CARA MEMULAI GAME (PANDUAN 101)
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 font-dialogue">
                Panduan ringkas untuk Guru, Orang Tua, dan Petualang Muda
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowHowToPlayModal(false)}
            className="btn-pixel !bg-stone-800 hover:!bg-red-900 !border-stone-600 text-stone-300 hover:text-white px-3 py-1 text-sm font-bold cursor-pointer"
            title="Tutup Modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Content Sections */}
        <div className="flex flex-col gap-6 text-base sm:text-lg leading-relaxed text-stone-200">

          {/* Section 1: Overview Fitur Gamifikasi */}
          <div className="bg-black/60 border border-amber-500/40 rounded-xl p-4 sm:p-5 shadow-md">
            <h3 className="text-lg sm:text-xl font-bold text-amber-400 font-pixel mb-2 flex items-center gap-2">
              <span>🌟</span>
              <span>1. MENGENAL GAME GAMIFIKASI ILMU</span>
            </h3>
            <p className="text-stone-300 mb-3">
              Aplikasi ini adalah media pembelajaran interaktif berbasis kuis RPG pixel retro yang dirancang khusus untuk siswa Sekolah Dasar (Kelas 1 s.d. 6 SD). Anak-anak dapat belajar sambil berpetualang dan mengumpulkan skor!
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 font-dialogue text-sm sm:text-base">
              <div className="bg-amber-950/40 border border-amber-600/40 p-3 rounded-lg">
                <div className="font-bold text-amber-300 mb-1">📚 Perpustakaan Kuis</div>
                <div className="text-stone-300 text-xs sm:text-sm">
                  Kuis kurikulum pelajaran bersama Bu Guru / Pak Guru yang ramah. Dilengkapi analisis petunjuk otomatis dari Burung Hantu Bijak.
                </div>
              </div>

              <div className="bg-cyan-950/40 border border-cyan-500/40 p-3 rounded-lg">
                <div className="font-bold text-cyan-300 mb-1">🔬 Lab IPA (Detektif Pola)</div>
                <div className="text-stone-300 text-xs sm:text-sm">
                  Latihan logika induktif, deret angka, dan rotasi visual matriks 3x3 otomatis tanpa batas untuk mengasah Tes Potensi Akademik (TPA).
                </div>
              </div>

              <div className="bg-red-950/40 border border-red-500/40 p-3 rounded-lg">
                <div className="font-bold text-red-300 mb-1">⚔️ Pertarungan Sombo</div>
                <div className="text-stone-300 text-xs sm:text-sm">
                  Duel hitung cepat matematika berpacu waktu melawan rival sekolah. Menguji kecepatan dan ketepatan berhitung anak.
                </div>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-lg">
                <div className="font-bold text-emerald-300 mb-1">📜 Laporan &amp; Sertifikat</div>
                <div className="text-stone-300 text-xs sm:text-sm">
                  Laporan analisis hasil belajar otomatis dan sertifikat kelulusan yang dapat diunduh/dicetak untuk guru dan orang tua.
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Panduan Membuat Kuis via NotebookLM (101 Guide) */}
          <div className="bg-black/60 border border-amber-500/40 rounded-xl p-4 sm:p-5 shadow-md">
            <h3 className="text-lg sm:text-xl font-bold text-amber-400 font-pixel mb-2 flex items-center gap-2">
              <span>🤖</span>
              <span>2. CARA MEMBUAT KUIS SENDIRI VIA NOTEBOOKLM (GRATIS)</span>
            </h3>
            <p className="text-stone-300 mb-4">
              Bapak/Ibu Guru dan Orang Tua dapat membuat soal kuis dari bab/buku pelajaran apapun dalam hitungan detik menggunakan AI gratis buatan Google bernama <strong className="text-amber-300">NotebookLM</strong>.
            </p>

            {/* 4 Simple Steps */}
            <div className="flex flex-col gap-3 font-dialogue">
              
              <div className="flex items-start gap-3 bg-stone-900/80 p-3 rounded-lg border border-stone-700">
                <span className="bg-amber-500 text-stone-950 font-bold px-2.5 py-0.5 rounded text-sm shrink-0 mt-0.5">1</span>
                <div>
                  <div className="font-bold text-amber-200 text-base sm:text-lg">Buka Google NotebookLM</div>
                  <div className="text-xs sm:text-base text-stone-300">
                    Akses situs gratis di <a href="https://notebooklm.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-bold">notebooklm.google.com</a> melalui komputer atau HP (masuk menggunakan akun Google biasa).
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-stone-900/80 p-3 rounded-lg border border-stone-700">
                <span className="bg-amber-500 text-stone-950 font-bold px-2.5 py-0.5 rounded text-sm shrink-0 mt-0.5">2</span>
                <div>
                  <div className="font-bold text-amber-200 text-base sm:text-lg">Unggah Materi Pelajaran</div>
                  <div className="text-xs sm:text-base text-stone-300">
                    Klik <strong>"New Notebook"</strong> lalu unggah file materi (bisa berbentuk PDF buku paket, foto ringkasan materi, atau tulisan catatan sekolah).
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-stone-900/80 p-3 rounded-lg border border-stone-700">
                <span className="bg-amber-500 text-stone-950 font-bold px-2.5 py-0.5 rounded text-sm shrink-0 mt-0.5">3</span>
                <div>
                  <div className="font-bold text-amber-200 text-base sm:text-lg">Salin Prompt Perintah Kuis</div>
                  <div className="text-xs sm:text-base text-stone-300 mb-2">
                    Tempelkan instruksi khusus ke kolom chat NotebookLM untuk meminta AI memformat kuis secara otomatis.
                  </div>
                  
                  {/* Prompt Box */}
                  <div className="bg-black/90 border border-amber-500/40 p-3 rounded text-xs font-mono text-emerald-400 overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{NOTEBOOKLM_PROMPT}</pre>
                  </div>

                  <button
                    onClick={handleCopyPrompt}
                    className={`btn-pixel mt-2.5 w-full sm:w-auto px-4 py-2 text-xs font-bold cursor-pointer ${
                      copied ? '!bg-emerald-600 text-white' : '!bg-amber-500 text-stone-950'
                    }`}
                  >
                    {copied ? '✓ BERHASIL DISALIN!' : '📋 SALIN PROMPT NOTEBOOKLM (1-KLIK)'}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-stone-900/80 p-3 rounded-lg border border-stone-700">
                <span className="bg-amber-500 text-stone-950 font-bold px-2.5 py-0.5 rounded text-sm shrink-0 mt-0.5">4</span>
                <div>
                  <div className="font-bold text-amber-200 text-base sm:text-lg">Simpan File (.md) &amp; Unggah ke Game</div>
                  <div className="text-xs sm:text-base text-stone-300">
                    Salin teks balasan dari NotebookLM, simpan dalam berkas berakhiran <code className="text-amber-300 bg-black/60 px-1 py-0.5 rounded">.md</code> (contoh: <code className="text-amber-300 bg-black/60 px-1 py-0.5 rounded">kuis_sejarah.md</code>), lalu seret &amp; jatuhkan file tersebut di Halaman Utama game ini!
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Tips Cepat Bermain */}
          <div className="bg-black/60 border border-amber-500/40 rounded-xl p-4 sm:p-5 shadow-md">
            <h3 className="text-lg sm:text-xl font-bold text-amber-400 font-pixel mb-2 flex items-center gap-2">
              <span>🎮</span>
              <span>3. TIPS LANGSUNG MEMULAI</span>
            </h3>
            <ul className="list-disc list-inside text-stone-300 space-y-1.5 text-sm sm:text-base font-dialogue">
              <li>Jika ingin langsung mencoba tanpa mengunggah file, klik tombol <strong>"COBA KUIS CONTOH"</strong> di Halaman Utama.</li>
              <li>Pilih karakter murid dan masuk ke menu <strong>"Tempat Belajar"</strong>.</li>
              <li>Manfaatkan bantuan petunjuk Burung Hantu Bijak jika soal kuis terasa menantang.</li>
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="mt-6 border-t-2 border-amber-900/80 pt-4 flex justify-end">
          <button
            onClick={() => setShowHowToPlayModal(false)}
            className="btn-pixel btn-pixel-gold px-6 py-2.5 text-xs sm:text-sm font-bold cursor-pointer"
          >
            <span>SIAP BERMAIN! ▶</span>
          </button>
        </div>

      </div>
    </div>
  );
}

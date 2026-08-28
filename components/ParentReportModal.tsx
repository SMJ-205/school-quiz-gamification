'use client';

/**
 * ParentReportModal.tsx
 * Parent & Teacher Learning Assessment Report:
 * - Captures complete quiz performance and detailed mistake summary (kesalahan jawab).
 * - Identifies key learning points & weak areas needing revision.
 * - Allows 1-click PNG image capture, WhatsApp text copy, and clean printing.
 */

import React, { useState, useRef } from 'react';
import { useGameStore, QuizItem } from '@/store/useGameStore';

export default function ParentReportModal() {
  const {
    studentName,
    metadata,
    questions,
    score,
    correctAnswersCount,
    userAnswers,
    showParentReport,
    setShowParentReport,
  } = useGameStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'mistakes'>('mistakes');
  const [copied, setCopied] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (!showParentReport) return null;

  const totalQuestions = questions.length || 1;
  const wrongAnswersCount = totalQuestions - correctAnswersCount;
  const accuracyPct = Math.round((correctAnswersCount / totalQuestions) * 100);

  // Identify wrong questions
  const wrongQuestions: { q: QuizItem; index: number; userChoice: number }[] = [];
  questions.forEach((q, idx) => {
    const userChoice = userAnswers[idx];
    if (userChoice !== undefined && userChoice !== q.correctIndex) {
      wrongQuestions.push({ q, index: idx, userChoice });
    }
  });

  // Filtered list
  const displayItems = activeFilter === 'mistakes'
    ? wrongQuestions
    : questions.map((q, idx) => ({
        q,
        index: idx,
        userChoice: userAnswers[idx] ?? -1,
      }));

  // Learning Level Assessment
  let masteryLevel = 'Perlu Bimbingan Khusus';
  let masteryBadge = 'bg-rose-950 text-rose-300 border-rose-600';
  let masteryMessage = 'Siswa masih perlu mengulang materi dasar dan memahami konsep kunci yang belum dikuasai.';

  if (accuracyPct >= 85) {
    masteryLevel = 'Sangat Menguasai Materi';
    masteryBadge = 'bg-emerald-950 text-emerald-300 border-emerald-500';
    masteryMessage = 'Pemahaman siswa terhadap konsep materi ini sangat kuat dan matang.';
  } else if (accuracyPct >= 65) {
    masteryLevel = 'Cukup Menguasai (Perlu Latihan)';
    masteryBadge = 'bg-amber-950 text-amber-300 border-amber-500';
    masteryMessage = 'Siswa telah memahami sebagian besar materi, namun ada beberapa poin spesifik yang perlu diperkuat.';
  }

  // 1-Click Copy Text Summary for WhatsApp / Notes
  function handleCopyText() {
    const lines: string[] = [];
    lines.push(`📊 *LAPORAN EVALUASI BELAJAR SISWA*`);
    lines.push(`👤 *Nama Siswa:* ${studentName || 'Petualang'}`);
    lines.push(`📖 *Materi:* ${metadata?.title || 'Kuis Pengetahuan'}`);
    if (metadata?.subject) lines.push(`📚 *Mata Pelajaran:* ${metadata.subject} (Kelas ${metadata.grade || '-'})`);
    lines.push(`🗓️ *Tanggal:* ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`);
    lines.push(``);
    lines.push(`⭐ *HASIL EVALUASI:*`);
    lines.push(`• Nilai / Skor: ${score} Poin`);
    lines.push(`• Akurasi: ${accuracyPct}% (${correctAnswersCount} Benar / ${totalQuestions} Soal)`);
    lines.push(`• Status: ${masteryLevel}`);
    lines.push(``);

    if (wrongQuestions.length > 0) {
      lines.push(`⚠️ *POIN-POIN YANG PERLU DIPERBAIKI (${wrongQuestions.length} Soal):*`);
      wrongQuestions.forEach((item, i) => {
        const userOpt = item.q.options[item.userChoice] ?? 'Tidak dijawab';
        const correctOpt = item.q.options[item.q.correctIndex] ?? '';
        lines.push(`\n${i + 1}. *Soal:* ${item.q.question}`);
        lines.push(`   ❌ *Jawaban Siswa:* ${userOpt}`);
        lines.push(`   ✅ *Jawaban Tepat:* ${correctOpt}`);
        if (item.q.hint) {
          lines.push(`   💡 *Konsep Kunci:* ${item.q.hint}`);
        }
      });
      lines.push(`\n💡 *Saran Bimbingan Orang Tua/Guru:* Fokuskan latihan pada konsep kunci di atas agar pemahaman anak semakin kokoh.`);
    } else {
      lines.push(`🎉 *SEMPURNA!* Semua soal dijawab dengan benar.`);
    }

    const textToCopy = lines.join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  // 1-Click Capture Image (PNG)
  async function handleCaptureImage() {
    if (!reportRef.current || capturing) return;
    try {
      setCapturing(true);
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(reportRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0E0906',
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `evaluasi-belajar-${(studentName || 'siswa').toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to capture report:', err);
    } finally {
      setCapturing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-hidden animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowParentReport(false);
      }}
    >
      <div className="w-full max-w-xl sm:max-w-2xl max-h-[88vh] bg-[#140E0A] border-3 sm:border-4 border-[#7D4E2D] rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto transition-all">
        
        {/* Top Control Header */}
        <div className="bg-[#24150D] border-b-2 border-amber-900/60 p-3 sm:p-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl sm:text-2xl">📋</span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-amber-300 leading-tight" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
                Laporan Evaluasi untuk Orang Tua & Guru
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-400">
                Analisis poin capaian & daftar bimbingan belajar anak
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowParentReport(false)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-900 border border-stone-600 text-stone-300 hover:text-white hover:bg-stone-800 flex items-center justify-center text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer"
            title="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="bg-black/60 border-b border-stone-800 p-2 sm:px-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-stone-900/90 p-1 rounded-lg border border-stone-700">
            <button
              onClick={() => setActiveFilter('mistakes')}
              className={`flex-1 sm:flex-none px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeFilter === 'mistakes'
                  ? 'bg-rose-700 text-white shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>❌</span>
              <span>Salah ({wrongQuestions.length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 sm:flex-none px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeFilter === 'all'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>📑</span>
              <span>Semua ({totalQuestions})</span>
            </button>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyText}
              className="flex-1 sm:flex-none px-2.5 py-1.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 hover:bg-emerald-900 text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <span>{copied ? '✅' : '📋'}</span>
              <span>{copied ? 'Tersalin!' : 'Salin WA'}</span>
            </button>

            <button
              onClick={handleCaptureImage}
              disabled={capturing}
              className="flex-1 sm:flex-none px-2.5 py-1.5 rounded bg-amber-950 border border-amber-400 text-amber-300 hover:bg-amber-900 text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <span>📸</span>
              <span>{capturing ? 'Menyimpan...' : 'Unduh PNG'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Report Content Container */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-3.5 overscroll-contain" ref={reportRef}>

          {/* Student & Quiz Profile Header Card */}
          <div className="bg-[#1D140E] border-2 border-[#5A3110] rounded-xl p-4 sm:p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-900/40 pb-3 mb-3">
              <div>
                <div className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-0.5">
                  Laporan Hasil Kuis Siswa
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-amber-200">
                  {studentName || 'Petualang Ilmu'}
                </h3>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-sm font-semibold text-stone-200">
                  {metadata?.title || 'Evaluasi Pembelajaran'}
                </div>
                <div className="text-xs text-stone-400">
                  {metadata?.subject ? `${metadata.subject} • Kelas ${metadata.grade || '-'}` : 'Akademi Pengetahuan'}
                </div>
              </div>
            </div>

            {/* Metric Score Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-black/50 border border-amber-500/30 rounded-lg p-2.5 text-center">
                <span className="text-[11px] text-stone-400 block font-medium">SKOR TOTAL</span>
                <span className="text-2xl font-bold text-amber-400 font-dialogue">{score}</span>
              </div>
              <div className="bg-black/50 border border-amber-500/30 rounded-lg p-2.5 text-center">
                <span className="text-[11px] text-stone-400 block font-medium">AKURASI</span>
                <span className="text-2xl font-bold text-emerald-400 font-dialogue">{accuracyPct}%</span>
              </div>
              <div className="bg-black/50 border border-emerald-500/30 rounded-lg p-2.5 text-center">
                <span className="text-[11px] text-stone-400 block font-medium">JAWABAN BENAR</span>
                <span className="text-2xl font-bold text-emerald-300 font-dialogue">{correctAnswersCount} / {totalQuestions}</span>
              </div>
              <div className="bg-black/50 border border-rose-500/30 rounded-lg p-2.5 text-center">
                <span className="text-[11px] text-stone-400 block font-medium">JAWABAN SALAH</span>
                <span className="text-2xl font-bold text-rose-400 font-dialogue">{wrongAnswersCount}</span>
              </div>
            </div>

            {/* Assessment Note */}
            <div className={`mt-3 p-3 rounded-lg border flex items-start gap-2.5 ${masteryBadge}`}>
              <span className="text-xl">💡</span>
              <div className="text-xs sm:text-sm">
                <span className="font-bold block">Status Pemahaman: {masteryLevel}</span>
                <span className="opacity-90">{masteryMessage}</span>
              </div>
            </div>
          </div>

          {/* Section: Kesalahan Jawab / Poin yang Masih Kurang */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-2">
                <span>{activeFilter === 'mistakes' ? '🔍 Rincian Poin yang Perlu Pendampingan' : '📑 Rincian Seluruh Soal'}</span>
                <span className="text-xs bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full border border-stone-600">
                  {displayItems.length} Soal
                </span>
              </h4>
            </div>

            {displayItems.length === 0 ? (
              <div className="bg-emerald-950/40 border-2 border-emerald-500/40 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">🌟</div>
                <h5 className="text-base font-bold text-emerald-300 mb-1">
                  Luar Biasa! Tidak Ada Kesalahan Jawab
                </h5>
                <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto">
                  Siswa telah menjawab seluruh pertanyaan dengan tepat dan menguasai seluruh konsep materi ini dengan sangat baik.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayItems.map(({ q, index, userChoice }) => {
                  const isWrong = userChoice !== q.correctIndex;
                  return (
                    <div
                      key={q.id || index}
                      className={`rounded-xl border-2 p-3.5 sm:p-4 transition-all ${
                        isWrong
                          ? 'bg-[#1C0F0C] border-rose-900/80 shadow-md'
                          : 'bg-[#101710] border-emerald-900/60'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isWrong ? 'bg-rose-950 text-rose-300 border border-rose-600' : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                          }`}>
                            Soal #{index + 1}
                          </span>
                          <p className="font-dialogue text-base sm:text-lg text-white font-medium leading-snug whitespace-pre-line break-words">
                            {q.question}
                          </p>
                        </div>

                        <span className="text-sm font-bold shrink-0">
                          {isWrong ? '❌ Salah' : '✅ Benar'}
                        </span>
                      </div>

                      {/* Answers Comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-stone-800 text-xs sm:text-sm">
                        {/* Student Answer */}
                        <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                          isWrong
                            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                            : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        }`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-75 mb-0.5">
                            {isWrong ? '❌ Jawaban Siswa (Keliru):' : '✅ Jawaban Siswa (Tepat):'}
                          </span>
                          <span className="font-semibold">
                            {q.options[userChoice] ?? 'Tidak dijawab'}
                          </span>
                        </div>

                        {/* Correct Answer */}
                        <div className="p-2.5 rounded-lg border bg-emerald-950/50 border-emerald-500/60 text-emerald-200 flex flex-col justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
                            ✅ Kunci Jawaban Benar:
                          </span>
                          <span className="font-semibold text-emerald-100">
                            {q.options[q.correctIndex]}
                          </span>
                        </div>
                      </div>

                      {/* Learning Note / Key Concept for Parents */}
                      {q.hint && (
                        <div className="mt-2.5 p-2.5 bg-amber-950/30 border border-amber-500/40 rounded-lg text-xs text-amber-200/90 flex items-start gap-2">
                          <span className="text-base leading-none">💡</span>
                          <div>
                            <span className="font-bold text-amber-300">Konsep Kunci untuk Dipelajari: </span>
                            <span>{q.hint}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Parental Action Recommendation Box */}
          <div className="bg-[#1A120B] border border-amber-600/40 rounded-xl p-4 text-xs sm:text-sm text-stone-300 space-y-1.5">
            <h5 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
              <span>👨‍👩‍👧</span>
              <span>Rekomendasi Bimbingan Belajar di Rumah</span>
            </h5>
            <p className="leading-relaxed">
              • Diskusikan soal-soal bertanda merah (❌) bersama anak dengan membaca kembali <strong>Konsep Kunci</strong> di atas.
            </p>
            <p className="leading-relaxed">
              • Anda dapat mengunduh gambar laporan (📸) atau menyalin teks (📋) untuk arsip catatan belajar anak atau konsultasi bersama guru kelas.
            </p>
          </div>

        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-[#1C100A] border-t border-amber-950 p-3 sm:p-4 flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-400 font-dialogue">
            Akademi Petualang Ilmu • Ringkasan Evaluasi Pembelajaran
          </div>

          <button
            onClick={() => setShowParentReport(false)}
            className="btn-pixel !bg-stone-800 hover:!bg-stone-700 !text-white text-xs sm:text-sm py-2 px-5 cursor-pointer"
          >
            Tutup Laporan
          </button>
        </div>

      </div>
    </div>
  );
}

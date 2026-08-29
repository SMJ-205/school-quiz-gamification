'use client';

/**
 * CertificateCanvas.tsx
 * Majestic Ancient Academy Certificate of Completion:
 * - Structured Flex Header: Medal icon & Centered Title with dedicated vertical clearance.
 * - ZERO text overlap: Body starts completely below top medal ribbon.
 * - Typography: Prestigious Cinzel heading + Bold high-readability Outfit body.
 * - Right Side: Fireworks & Celebratory Jumping Students.
 * - Bottom: Gold Medal Rating & Cursive Signed Signature.
 * - 100% Mobile Responsive.
 */

import React, { useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getStarRating } from '@/lib/constants';
import { sfxCertificateStamp, sfxPageTurn } from '@/lib/audioEngine';
import ParentReportModal from './ParentReportModal';

async function exportPNG(el: HTMLElement) {
  const { toPng } = await import('html-to-image');
  const dataUrl = await toPng(el, {
    pixelRatio: 2,
    cacheBust: true,
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top center',
    },
  });
  const link = document.createElement('a');
  link.download = 'certificate-of-completion.png';
  link.href = dataUrl;
  link.click();
}

async function exportPDF(el: HTMLElement, studentName: string) {
  const { toPng } = await import('html-to-image');
  const { jsPDF } = await import('jspdf');
  const dataUrl = await toPng(el, {
    pixelRatio: 2,
    cacheBust: true,
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top center',
    },
  });
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [960, 540] });
  pdf.addImage(dataUrl, 'PNG', 0, 0, 960, 540);
  pdf.save(`certificate-${studentName ? studentName.toLowerCase().replace(/\s+/g, '-') : 'adventurer'}.pdf`);
}

export default function CertificateCanvas() {
  const { studentName, score, correctAnswersCount, questions, metadata, resetGame, setShowParentReport, character } = useGameStore();
  const certRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [exporting, setExporting] = useState(false);

  const total = questions.length || 5;
  const starsCount = getStarRating(correctAnswersCount, total);
  const isGirl = character?.gender === 'girl';
  const celebrationSrc = isGirl ? '/sprites/cert_celebration_girl.png' : '/sprites/cert_celebration_boy.png';
  const celebrationAlt = isGirl ? 'Celebration Fireworks and Girl Student' : 'Celebration Fireworks and Boy Student';

  // Responsive fit-to-page scale observer
  React.useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.clientWidth;
      const certBaseWidth = 840;
      if (availableWidth < certBaseWidth) {
        const padding = 8;
        const s = Math.max(0.35, Math.min(1, (availableWidth - padding) / certBaseWidth));
        setScale(s);
      } else {
        setScale(1);
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function handleExportPNG() {
    if (!certRef.current || exporting) return;
    sfxCertificateStamp();
    setExporting(true);
    await exportPNG(certRef.current);
    setExporting(false);
  }

  async function handleExportPDF() {
    if (!certRef.current || exporting) return;
    sfxCertificateStamp();
    setExporting(true);
    await exportPDF(certRef.current, studentName);
    setExporting(false);
  }

  function handleReset() {
    sfxPageTurn();
    resetGame();
  }

  const starTextMap: Record<number, string> = {
    5: 'LIMA BINTANG',
    4: 'EMPAT BINTANG',
    3: 'TIGA BINTANG',
    2: 'DUA BINTANG',
    1: 'SATU BINTANG',
  };

  const displayScore = score > 0 ? score : correctAnswersCount * 100;
  const formattedScore = displayScore.toLocaleString('id-ID');
  const levelTitle = metadata?.title || metadata?.subject || 'THE ENCHANTED LIBRARY & CRYSTAL BRIDGE';

  return (
    <div className="min-h-screen bg-[#07050E] flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 select-none">
      
      <div className="w-full max-w-4xl flex flex-col items-center">

        {/* Responsive Fit-to-Page Certificate Container for Mobile & Desktop */}
        <div ref={containerRef} className="w-full flex justify-center items-center py-2 overflow-visible">
          <div
            style={{
              width: '840px',
              height: `${510 * scale}px`,
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              overflow: 'visible',
            }}
          >
            {/* ─── SCROLL DIPLOMA CANVAS ────────────────────────────────────────── */}
            <div
              ref={certRef}
              className="relative text-[#1D140C] select-none rounded-sm"
              style={{
                width: '840px',
                minHeight: '495px',
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                padding: '24px 44px 28px 48px',
                background: 'linear-gradient(180deg, #FBE5B8 0%, #FDF0D4 18%, #FFF6DF 82%, #F5DAA6 100%)',
                borderTop: '6px solid #5A3110',
                borderBottom: '6px solid #5A3110',
                boxShadow: '0 25px 60px rgba(0,0,0,0.85), inset 0 0 35px rgba(180,120,60,0.22)',
              }}
            >
              {/* Left Wooden Scroll Roll Cylinder with Golden Knobs */}
              <div className="scroll-roll-left" />
              {/* Right Wooden Scroll Roll Cylinder with Golden Knobs */}
              <div className="scroll-roll-right" />

              {/* 1. TOP HEADER ROW: Dedicated Medal Slot on Left + Centered Royal Title */}
              <div className="flex items-center justify-between gap-4 mb-4 border-b border-[#5A3110]/15 pb-2">
                {/* Top-Left Official Golden Medal Badge */}
                <div className="flex-shrink-0 w-16 pl-1">
                  <img
                    src="/sprites/medal_gold_ribbon.png"
                    alt="Honor Medal Badge"
                    className="w-14 sm:w-16 h-auto object-contain drop-shadow-md"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>

                {/* Top-Center Title: CERTIFICATE OF COMPLETION */}
                <div className="flex-1 text-center pr-12">
                  <div
                    className="text-xs sm:text-sm font-bold tracking-widest text-[#784B20] uppercase mb-0.5"
                    style={{ fontFamily: "'Pixelify Sans', sans-serif" }}
                  >
                    AKADEMI PETUALANG ILMU
                  </div>
                  <h1
                    className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#22150A] tracking-wider uppercase leading-tight"
                    style={{
                      fontFamily: "'VT323', monospace",
                      letterSpacing: '1.5px',
                      textShadow: '0 1px 1px rgba(255,255,255,0.7)',
                    }}
                  >
                    SERTIFIKAT KELULUSAN KUIS
                  </h1>
                </div>
              </div>

              {/* 2. MAIN 2-COLUMN BODY (Positioned completely below the top medal ribbon) */}
              <div className="grid grid-cols-12 gap-4 items-center mt-2 pt-1">

                {/* LEFT COLUMN: Adventurer Details (7 cols) - Styled with Pixelify Sans & VT323 matching Parent Report */}
                <div
                  className="col-span-7 flex flex-col gap-3 pl-2 sm:pl-4 text-[#1E130A]"
                  style={{ fontFamily: "'VT323', monospace" }}
                >

                  {/* Row 1: ADVENTURER */}
                  <div className="leading-tight">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#784B20] block mb-0.5">
                      NAMA SISWA / PETUALANG:
                    </span>
                    <span className="text-2xl sm:text-3xl font-bold tracking-wide text-[#1A0E05]">
                      {studentName ? studentName : 'Petualang Ilmu'}
                    </span>
                  </div>

                  {/* Row 2: LEVEL COMPLETED (Refers to MD Material Title) */}
                  <div className="leading-tight">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#784B20] block mb-0.5">
                      TOPIK / MATERI KUIS:
                    </span>
                    <span className="text-base sm:text-xl font-bold tracking-wide text-[#231509] block">
                      {levelTitle}
                    </span>
                  </div>

                  {/* Row 3: FINAL SCORE (Thousands scale) */}
                  <div className="leading-tight">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#784B20] block mb-0.5">
                      TOTAL POIN:
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-bold text-[#8A4500]" style={{ fontFamily: "'VT323', monospace" }}>
                        {formattedScore} POIN
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#1E5D2A] bg-emerald-950/10 border border-emerald-800/30 px-1.5 py-0.5 rounded">
                        ✓ {correctAnswersCount}/{total} BENAR
                      </span>
                    </div>
                  </div>

                  {/* Row 4: GOLD STARS EARNED */}
                  <div className="leading-tight">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#784B20] block mb-0.5">
                      BINTANG PENCAPAIAN:
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-[#231509]" style={{ fontFamily: "'VT323', monospace" }}>
                      [{starTextMap[starsCount] || 'SATU BINTANG'}]
                    </span>
                  </div>

                </div>

                {/* RIGHT COLUMN: Fireworks, Confetti & Character-matched Jumping Student */}
                <div className="col-span-5 relative flex items-center justify-center min-h-[190px] pr-2">
                  <img
                    src={celebrationSrc}
                    alt={celebrationAlt}
                    className="w-full max-w-[240px] h-auto object-contain anim-jump"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>

              </div>

              {/* 3. BOTTOM FOOTER */}
              <div className="flex items-end justify-between mt-6 pt-3 border-t border-[#5A3110]/25">

                {/* Bottom-Left: Medal + Exact Star Count (1 star = 1 star, 3 = 3, 5 = 5) */}
                <div className="flex items-center gap-3 pl-1">
                  <div className="w-10 sm:w-12 h-auto drop-shadow-sm">
                    <img
                      src="/sprites/medal_gold_ribbon.png"
                      alt="Gold Medal Ribbon"
                      className="w-full h-auto object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>

                  {/* Pixel Gold Stars: Render exact count matching starsCount */}
                  <div className="flex items-center gap-1 text-2xl sm:text-3xl drop-shadow-md">
                    {Array.from({ length: Math.max(1, Math.min(5, starsCount)) }).map((_, i) => (
                      <span
                        key={i}
                        className="text-[#E5A100] font-bold inline-block transform hover:scale-110 transition-transform"
                        style={{
                          textShadow: '1px 1px 0 #613600, -1px -1px 0 #613600, 1px -1px 0 #613600, -1px 1px 0 #613600',
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>


                {/* Bottom-Right: Cursive Signed + Underline + KEPALA AKADEMI ILMU */}
                <div className="flex flex-col items-center text-center pr-4">
                  <span
                    className="text-3xl sm:text-4xl text-stone-900 font-normal -mb-1"
                    style={{ fontFamily: "'Great Vibes', cursive" }}
                  >
                    Signed
                  </span>
                  <div className="w-48 sm:w-56 h-[2.5px] bg-stone-900 mb-1.5" />
                  <span
                    className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-widest"
                    style={{ fontFamily: "'Pixelify Sans', sans-serif" }}
                  >
                    KEPALA AKADEMI ILMU
                  </span>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ─── ACTION BUTTONS (Fully Responsive Grid) ──────────────────────── */}
        <div className="w-full max-w-[880px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 mt-4 px-2">
          <button
            onClick={() => setShowParentReport(true)}
            className="btn-pixel !bg-amber-950/90 hover:!bg-amber-900 !border-amber-400 text-amber-200 py-3 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <span>📋</span>
            <span>LAPORAN ORANG TUA</span>
          </button>

          <button
            onClick={handleExportPNG}
            disabled={exporting}
            className="btn-pixel btn-pixel-gold py-3 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <span>🖼️</span>
            <span>{exporting ? 'MEMPROSES...' : 'UNDUH (PNG)'}</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="btn-pixel btn-pixel-wood py-3 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <span>📄</span>
            <span>{exporting ? 'MEMPROSES...' : 'CETAK (PDF)'}</span>
          </button>

          <button
            onClick={handleReset}
            className="btn-pixel !bg-stone-800 hover:!bg-stone-700 !border-stone-600 text-stone-200 py-3 px-4 text-xs sm:text-sm cursor-pointer shadow-lg flex items-center justify-center gap-1"
          >
            <span>🔄</span>
            <span>KUIS BARU</span>
          </button>
        </div>

      </div>

      {/* Parent Learning Assessment Modal */}
      <ParentReportModal />
    </div>
  );
}

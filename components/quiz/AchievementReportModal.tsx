'use client';

/**
 * AchievementReportModal.tsx
 * Achievement Report Modal for Sombo Boss Battle & Unlimited Math Session.
 *
 * Features:
 * 1. Top Image: Defeated Sombo sprite (/sprites/boss_defeated_report.png) formatted with white cell-shading.
 * 2. Headline: "{studentName} telah berhasil mengalahkan Sombo dalam Math Battle!"
 * 3. Result Summary - Normal Battle Session (without mistake statistics)
 * 4. Result Summary - Unlimited Math Battle Session (without mistake statistics)
 * 5. Download buttons: PNG & PDF export using html-to-image & jsPDF.
 */

import React, { useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';

interface AchievementReportProps {
  studentName: string;
  normalQCount: number;
  normalMaxCombo: number;
  endlessQCount: number;
  endlessScore: number;
  endlessMaxCombo: number;
  onClose: () => void;
  onReturnHome: () => void;
}

const WHITE_CELL_SHADING = [
  'drop-shadow(1.5px 0px 0px rgba(255,255,255,0.95))',
  'drop-shadow(-1.5px 0px 0px rgba(255,255,255,0.95))',
  'drop-shadow(0px 1.5px 0px rgba(255,255,255,0.95))',
  'drop-shadow(0px -1.5px 0px rgba(255,255,255,0.95))',
  'drop-shadow(0px 8px 16px rgba(0,0,0,0.85))',
].join(' ');

export default function AchievementReportModal({
  studentName,
  normalQCount,
  normalMaxCombo,
  endlessQCount,
  endlessScore,
  endlessMaxCombo,
  onClose,
  onReturnHome,
}: AchievementReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const nameToDisplay = studentName?.trim() ? studentName.trim() : 'Petualang';

  // ─── Export PNG ─────────────────────────────────────────────────────────────
  async function handleDownloadPNG() {
    if (!reportRef.current || exporting) return;
    try {
      setExporting(true);
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(reportRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#0f0707',
      });
      const link = document.createElement('a');
      link.download = `achievement-report-${nameToDisplay.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setExporting(false);
    }
  }

  // ─── Export PDF ─────────────────────────────────────────────────────────────
  async function handleDownloadPDF() {
    if (!reportRef.current || exporting) return;
    try {
      setExporting(true);
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const dataUrl = await toPng(reportRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#0f0707',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [600, 840],
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, 600, 840);
      pdf.save(`achievement-report-${nameToDisplay.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-xl flex flex-col items-center">
        {/* Printable Report Canvas Area */}
        <div
          ref={reportRef}
          className="w-full bg-[#120808] border-4 border-[#8B3A3A] rounded-2xl p-5 sm:p-7 shadow-2xl text-center relative overflow-hidden font-pixel"
        >
          {/* CRT Scanline Lining Overlay */}
          <div className="crt-scanlines-overlay pointer-events-none opacity-40" />

          {/* Header Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-950/90 border border-amber-400/70 text-amber-300 px-4 py-1 rounded-full text-xs sm:text-sm font-bold mb-3 shadow">
            <span>🏆</span>
            <span>ACHIEVEMENT REPORT</span>
            <span>✨</span>
          </div>

          {/* Top Image: Defeated Sombo Sprite */}
          <div className="flex justify-center items-center my-2">
            <div className="h-32 sm:h-40 flex items-end justify-center relative">
              <img
                src="/sprites/boss_defeated_report.png"
                alt="Defeated Sombo"
                className="h-full w-auto object-contain transform -scale-x-100"
                style={{
                  imageRendering: 'pixelated',
                  filter: WHITE_CELL_SHADING,
                }}
              />
            </div>
          </div>

          {/* Main Headline (No trumpet emoji before text) */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-300 leading-tight mb-4 drop-shadow-[0_2px_8px_rgba(255,179,0,0.5)] px-2">
            <span className="text-white">{nameToDisplay}</span> telah berhasil mengalahkan Sombo dalam Math Battle!
          </h2>

          {/* Result Summaries Grid */}
          <div className="grid grid-cols-1 gap-3.5 text-left mb-4">

            {/* Summary Sesi Babak Utama */}
            <div className="bg-stone-950/90 border-2 border-red-900/80 rounded-xl p-3.5 sm:p-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-red-900/60 pb-2 mb-2.5">
                <span className="text-xs sm:text-sm font-bold text-red-300 flex items-center gap-1.5">
                  <span>⚔️</span> SESI BABAK UTAMA (NORMAL BATTLE)
                </span>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-700 px-2 py-0.5 rounded">
                  SOMBO TERKALAHKAN 🏆
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div className="text-stone-400">Total Soal Terjawab:</div>
                <div className="text-amber-300 font-bold text-right">{normalQCount} Soal</div>

                <div className="text-stone-400">Total Damage Dihasilkan:</div>
                <div className="text-amber-300 font-bold text-right">6,000 HP</div>

                <div className="text-stone-400">Max Combo Streak:</div>
                <div className="text-amber-300 font-bold text-right">{normalMaxCombo}x Combo</div>
              </div>
            </div>

            {/* Summary Sesi Unlimited Math */}
            <div className="bg-stone-950/90 border-2 border-purple-900/80 rounded-xl p-3.5 sm:p-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-purple-900/60 pb-2 mb-2.5">
                <span className="text-xs sm:text-sm font-bold text-purple-300 flex items-center gap-1.5">
                  <span>⚡</span> SESI UNLIMITED MATH (OVERDRIVE)
                </span>
                <span className="text-[11px] font-bold text-purple-300 bg-purple-950 border border-purple-700 px-2 py-0.5 rounded">
                  SUPER SOMBO BATTLE ⚡
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div className="text-stone-400">Total Soal Overdrive:</div>
                <div className="text-purple-300 font-bold text-right">{endlessQCount} Soal</div>

                <div className="text-stone-400">High Score Overdrive:</div>
                <div className="text-amber-300 font-bold text-right">{endlessScore.toLocaleString()} Poin</div>

                <div className="text-stone-400">Max Overdrive Streak:</div>
                <div className="text-purple-300 font-bold text-right">{endlessMaxCombo}x Combo</div>
              </div>
            </div>

          </div>

          {/* Footer watermark */}
          <div className="text-[11px] text-stone-500 font-dialogue border-t border-stone-800/80 pt-2 text-center">
            Petualangan Kuis Ilmu • The Growth of Knowledge Academy
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-4">
          <button
            onClick={handleDownloadPNG}
            disabled={exporting}
            className="btn-pixel !bg-amber-600 hover:!bg-amber-500 !border-amber-400 text-stone-950 font-bold px-4 py-2.5 text-xs sm:text-sm flex-1 w-full sm:w-auto flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
          >
            <span>📸</span>
            <span>DOWNLOAD PNG</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={exporting}
            className="btn-pixel !bg-red-800 hover:!bg-red-700 !border-red-500 text-red-100 font-bold px-4 py-2.5 text-xs sm:text-sm flex-1 w-full sm:w-auto flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
          >
            <span>📄</span>
            <span>DOWNLOAD PDF</span>
          </button>

          <button
            onClick={onReturnHome}
            className="btn-pixel !bg-stone-800 hover:!bg-stone-700 !border-stone-600 text-stone-200 font-bold px-4 py-2.5 text-xs sm:text-sm w-full sm:w-auto flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>🏠</span>
            <span>MENU UTAMA</span>
          </button>
        </div>
      </div>
    </div>
  );
}

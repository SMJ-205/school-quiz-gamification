'use client';

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { sfxVictory, stopQuizBGM } from '@/lib/audioEngine';
import ParentReportModal from './ParentReportModal';

const BODIES_COUNT = 35;
const BODY_EMOJIS = ['📖', '⭐', '🌟', '💎', '✨', '📜', '🏆', '📚', '🎖️', '🏮'];

export default function AntigravityCanvas() {
  const { studentName, score, correctAnswersCount, questions, setScreen, setShowParentReport } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const bodiesRef = useRef<{ x: number; y: number; vx: number; vy: number; emoji: string; size: number; rot: number; rotV: number }[]>([]);

  useEffect(() => {
    stopQuizBGM();
    sfxVictory();

    // Initialize floating books and stars
    bodiesRef.current = Array.from({ length: BODIES_COUNT }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + 20 + Math.random() * 200,
      vx: (Math.random() - 0.5) * 2,
      vy: -(1.2 + Math.random() * 2), // floating upward
      emoji: BODY_EMOJIS[Math.floor(Math.random() * BODY_EMOJIS.length)],
      size: 24 + Math.random() * 26,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.04,
    }));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Mouse & Touch interaction
    let mouseX = -1000, mouseY = -1000;
    function handleMouse(e: MouseEvent) { mouseX = e.clientX; mouseY = e.clientY; }
    function handleTouch(e: TouchEvent) {
      if (e.touches[0]) { mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY; }
    }
    canvas.addEventListener('mousemove', handleMouse);
    canvas.addEventListener('touchmove', handleTouch, { passive: true });

    function loop() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bodiesRef.current.forEach((b) => {
        b.vy -= 0.025; // antigravity float
        const dx = mouseX - b.x, dy = mouseY - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160) {
          b.vx += (dx / dist) * 0.5;
          b.vy += (dy / dist) * 0.5;
        }

        b.vx *= 0.99;
        b.vy *= 0.99;
        b.x += b.vx;
        b.y += b.vy;
        b.rot += b.rotV;

        if (b.x < -40) b.x = canvas.width + 40;
        if (b.x > canvas.width + 40) b.x = -40;
        if (b.y < -60) {
          b.y = canvas.height + 40;
          b.x = Math.random() * canvas.width;
          b.vy = -(0.8 + Math.random() * 1.6);
        }

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.font = `${b.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.emoji, 0, 0);
        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouse);
      canvas.removeEventListener('touchmove', handleTouch);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const total = questions.length;
  const pct = total > 0 ? Math.round((correctAnswersCount / total) * 100) : 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0F0A06] flex items-center justify-center p-4">
      {/* Physics Floating Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-auto" />

      {/* Foreground Victory Card */}
      <div className="relative z-10 w-full max-w-lg crt-arcade-frame p-6 text-center shadow-2xl">
        <div className="text-5xl mb-2 anim-jump">🏆</div>

        <div className="retro-pill-badge !bg-amber-950 !border-amber-400 text-amber-300 mb-3">
          MISI EKSPLORASI SELESAI
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-amber-300 drop-shadow-[0_2px_10px_rgba(255,179,0,0.6)] mb-1">
          SELAMAT, {studentName || 'PETUALANG'}!
        </h1>
        <p className="font-dialogue text-2xl text-stone-300 mb-4">
          Seluruh arsip pengetahuan berhasil kamu telusuri!
        </p>

        {/* Stats Block */}
        <div className="bg-black/60 border-2 border-amber-500/40 rounded-lg p-4 mb-4 flex items-center justify-around">
          <div>
            <span className="font-dialogue text-lg text-stone-400 block">SKOR AKHIR</span>
            <span className="text-3xl font-bold text-amber-400 font-dialogue">{score} PTS</span>
          </div>
          <div className="w-px h-10 bg-stone-700" />
          <div>
            <span className="font-dialogue text-lg text-stone-400 block">AKURASI</span>
            <span className="text-3xl font-bold text-emerald-400 font-dialogue">{pct}%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => setShowParentReport(true)}
            className="btn-pixel !bg-stone-800 hover:!bg-stone-700 !border-amber-500/60 !text-amber-200 w-full sm:w-1/2 text-xs sm:text-sm py-3.5 flex items-center justify-center gap-2 shadow-lg"
          >
            <span>📋</span>
            <span>LAPORAN ORANG TUA</span>
          </button>

          <button
            onClick={() => setScreen('certificate')}
            className="btn-pixel btn-pixel-gold w-full sm:w-1/2 text-xs sm:text-sm py-3.5 flex items-center justify-center gap-2 shadow-xl"
          >
            <span>📜</span>
            <span>LIHAT SERTIFIKAT</span>
            <span>▶</span>
          </button>
        </div>
      </div>

      {/* Parent Learning Assessment Modal */}
      <ParentReportModal />
    </div>
  );
}

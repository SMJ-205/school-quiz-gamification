# 🎮 The Growth of Knowledge

> **Petualangan Kuis & Eksplorasi Arsip Pengetahuan** — Sebuah platform gamifikasi kuis berbasis RPG 8-bit retro yang mengubah materi belajar Markdown dan tantangan hitung cepat matematika menjadi pengalaman petualangan interaktif yang menyenangkan.

![Home Screen](./public/screenshots/screen_home.png)

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| ⚔️ **Sombo Dynamic Boss Battle** | Pertarungan QuickMath lawan Arithmo-Boss Sombo di *Ruang Kelas Unggulan* tanpa batasan wave kaku dengan **soal murni 2-digit** (10..99). Target ~20-25 pertanyaan (menoleransi kesalahan). Dilengkapi mekanik **Sombo Passive Auto Recover** (+200 HP tiap 10s) dan **Tier 4 Tersulit** (soal 15+)! |
| ❤️ **Sistem 3 Nyawa Tepat (3 Hearts)** | Pemain memiliki tepat 3 kesempatan hati. Setiap jawaban salah atau waktu habis akan menguras 1 hati; rekor streak 5x mengembalikan 1 hati |
| 📊 **Analisis Kesalahan & Evaluasi Belajar** | Laporan evaluasi interaktif pada layar Kalah, Sombo Kalah, & Unlimited Math yang mengelompokkan rincian kesalahan per tipe soal (`Simpan`, `Pinjam`, `Hitung Dasar`, `Timeout`) serta memberikan saran bimbingan pedagogis terarah |
| ⚡ **Unlimited Math Battle Mode** | Mode pertarungan tanpa batas soal setelah Sombo dikalahkan untuk mencetak rekor *High Score* tertinggi dengan tampilan **Upskilled Sombo** (versi Sombo pintar bergelembung ide matematika)! |
| 📜 **Upload Materi Markdown** | Unggah file `.md` berisi materi pelajaran — kuis akan dibuat otomatis untuk sesi kelas Pak Guru |
| 🎓 **Kustomisasi Petualang** | Pilih avatar petualang (Murid Laki-laki / Murid Perempuan) & tentukan nama pemain |
| 🧑‍🏫 **Dialog & Animasi Pak Guru / Sombo** | Pertanyaan interaktif *typewriting* dalam balon komik stabil dengan animasi gerak mulut natural (*talking cadence*) & *outer cell-shading* |
| 📺 **Font Universal VT323** | Antarmuka CRT retro diseragamkan dengan font pixelated *VT323* yang tegas dan sangat mudah dibaca |
| 👨‍👩‍👧 **Laporan Evaluasi Orang Tua** | Rangkuman evaluasi belajar & analisis kesalahan jawab untuk bimbingan di rumah |
| 📸 **Ekspor Laporan & Sertifikat** | Unduh laporan evaluasi dalam bentuk gambar PNG/WhatsApp serta sertifikat digital kelulusan berkualitas tinggi (PNG & PDF) |
| 🎵 **Engine Audio BGM & SFX Arcade** | Musik BGM 32-detik *fast-beat arcade synth loop* (dual-channel lead + sub-bass, *100% seamless loop*) + efek suara *8-bit Arcade Power-Hit SFX* |
| 📒 **Integrasi NotebookLM** | Buat kuis otomatis dari dokumen/materi pelajaran via Google NotebookLM |

---

## 🖼️ Tampilan & Alur Aplikasi

### 1. Halaman Utama — Masukkan Nama & Unggah Materi
Saat pertama membuka aplikasi, pelajar dapat:
1. Memasukkan **nama petualang** pada kolom yang tersedia
2. Pilih avatar **Murid Laki-laki** atau **Murid Perempuan**
3. **Mengunggah file Markdown** (`.md`) atau menekan **"Coba Kuis Contoh"** / **"Buat Kuis via NotebookLM"**

![Home Screen](./public/screenshots/screen_home.png)

---

### 2. 🏛️ Pilihan Tempat Belajar (Mode Kuis)
Pemain dapat memilih antara dua tempat belajar interaktif:
1. **Perpustakaan Ajaib (Kuis Pak Guru)**: Sesi kuis materi pelajaran sekolah dari file Markdown.
2. **Ruang Kelas Unggulan (Sombo Boss Battle)**: Pertarungan hitung cepat *QuickMath* dinamis melawan Sombo si jenius matematika.

---

### 3. ⚔️ Sesi Pertarungan Boss Sombo & Unlimited Math Battle
Saat bertarung melawan Sombo:
- Sombo berhadapan langsung dengan pemain dilengkapi animasi gerak mulut dan indikator HP Boss.
- Pertarungan QuickMath dinamis 4 Tier bertahap hingga tingkat kesulitan tertinggi (soal murni 2-digit 10..99):
  - **Tier 1 (Soal #1 – 4)**: Hitungan penjumlahan dasar (limit 6.5s)
  - **Tier 2 (Soal #5 – 9)**: Kombinasi penjumlahan & pengurangan (limit 5.5s)
  - **Tier 3 (Soal #10 – 14)**: Penjumlahan Simpan (`Carrying`) & Pengurangan Pinjam (`Borrowing`) (limit 4.5s)
  - **Tier 4 Tersulit (Soal #15+)**: Soal simpan & pinjam 2-digit tersulit (limit 3.2s – 3.6s)
- **3 Nyawa Hati (3 Hearts)**: Pemain hanya memiliki 3 kali toleransi kesalahan.
- **Musik Arcade Dual-Channel 32-Detik**: Musik latar *chiptune* 32 detik bervariasi dengan *seamless looping* + *8-bit Arcade Power-Hit SFX* saat menjawab benar.
- Mengalahkan Sombo membuka mode **Unlimited Math Battle** melawan **Super Sombo** untuk mencetak rekor *High Score*.

---

### 4. 📊 Analisis Kesalahan & Evaluasi Belajar (Fitur Pembelajaran)
Fitur evaluasi otomatis yang dapat diakses dari layar **Kalah (Game Over)**, **Sombo Kalah**, dan **Unlimited Math Battle**:
1. **Ringkasan Kesalahan per Tipe Soal**: Statistik berapa kali pemain keliru pada tipe *Penjumlahan Simpan*, *Pengurangan Pinjam*, *Hitungan Dasar*, atau *Waktu Habis (Timeout)*.
2. **Saran Pembelajaran Sesi Berikutnya**: Analisis otomatis yang memberikan tips bimbingan praktis terarah sesuai area kelemahan utama pemain.
3. **Rincian Soal yang Salah**: Perbandingan langsung antara kunci jawaban benar dan jawaban pemain/timeout.

---

### 5. 👨‍👩‍👧 Laporan Orang Tua & Sertifikat Digital
- **Laporan Evaluasi Orang Tua**: Menampilkan skor akhir, akurasi %, ringkasan pemahaman, dan opsi ekspor gambar PNG / salin teks format WhatsApp.
- **Sertifikat Digital**: Sertifikat kelulusan bertema *Ancient Academy* yang dapat diunduh langsung dalam format PNG atau PDF.

---

## 🚀 Cara Menjalankan

### Prasyarat
- [Node.js](https://nodejs.org/) v18 atau lebih baru
- npm / yarn / pnpm

### Instalasi & Jalankan

```bash
# Clone repositori
git clone https://github.com/SMJ-205/school-quiz-gamification.git
cd school-quiz-gamification

# Install dependensi
npm install

# Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) atau [http://localhost:3001](http://localhost:3001) di browser.

### Build Produksi

```bash
npm run build
npm start
```

---

## 📁 Struktur Proyek

```
school-quiz-gamification/
├── app/
│   ├── page.tsx                 # Global BGM manager & screen switcher
│   ├── layout.tsx               # Root layout, Google Fonts (VT323)
│   └── globals.css              # Global styles, tema VT323 & komik CRT
├── components/
│   ├── IngestionScreen.tsx      # Upload Markdown & input nama siswa
│   ├── CharacterCustomizer.tsx  # Pemilihan avatar petualang
│   ├── BackgroundSelectScreen.tsx # Pilihan tempat belajar (Perpustakaan / Sesi Sombo)
│   ├── ParentReportModal.tsx    # Modal laporan evaluasi orang tua & ekspor PNG/WA
│   ├── CertificateCanvas.tsx    # Render & ekspor sertifikat digital (PNG/PDF)
│   ├── AntigravityCanvas.tsx    # Layar perayaan hasil kuis
│   ├── PixelProgressBar.tsx     # Progress bar + kontrol audio
│   └── quiz/
│       ├── QuestionPanel.tsx    # Dialog komik Pak Guru
│       ├── EnchantedLibrary.tsx # Arena kuis perpustakaan ajaib
│       └── BossBattleArena.tsx  # Sesi 15 Wave Boss Battle Sombo, Unlimited Math, & Analisis Kesalahan Modal
├── lib/
│   ├── audioEngine.ts           # BGM 32s arcade synth loop, SFX power-hit, & unlock audio engine
│   ├── markdownParser.ts        # Parser materi Markdown → kuis
│   └── constants.ts             # Opsi karakter, rating bintang, prompt NotebookLM
├── public/
│   ├── audio/                   # File musik latar (.mp3)
│   ├── sprites/                 # Sprite Pak Guru, Sombo, & Petualang
│   ├── backgrounds/             # Background perpustakaan & ruang kelas
│   └── screenshots/             # Dokumentasi screenshot
└── store/
    └── useGameStore.ts          # Zustand store: tracking jawaban & state game
```

---

## 📄 Lisensi

MIT License — Bebas digunakan untuk keperluan pendidikan dan penelitian.

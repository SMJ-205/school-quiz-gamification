# 🎮 The Growth of Knowledge

> **Petualangan Kuis & Eksplorasi Arsip Pengetahuan** — Sebuah platform gamifikasi kuis berbasis RPG 8-bit retro yang mengubah materi belajar Markdown menjadi pengalaman petualangan interaktif.

![Home Screen](public/screenshots/screen_home.png)

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 📜 **Upload Materi Markdown** | Unggah file `.md` berisi materi pelajaran — kuis akan dibuat otomatis |
| 🎓 **Karakter Pelajar** | Pilih avatar petualang & masukkan nama sebelum memulai |
| 🧑‍🏫 **Dialog Pak Guru** | Pertanyaan ditampilkan via animasi typewriting dalam balon komik |
| ⭐ **Sistem Poin & Bintang** | Jawaban benar memberikan poin; hasil akhir ditampilkan dengan rating bintang |
| 🏆 **Sertifikat Digital** | Sertifikat penyelesaian bergambar bintang yang dapat diunduh |
| 🎵 **Audio BGM & SFX** | Musik latar 8-bit retro + efek suara typewriting; dapat dimatikan kapan saja |
| 📒 **Integrasi NotebookLM** | Buat soal kuis otomatis dari materi melalui Google NotebookLM |

---

## 🖼️ Tampilan Aplikasi

### 1. Halaman Utama — Masukkan Nama & Unggah Materi

Saat pertama membuka aplikasi, pelajar akan:
1. Memasukkan **nama / nama petualang** di kolom yang tersedia
2. **Mengunggah file Markdown** (`.md`) berisi materi pelajaran dengan cara **seret & jatuhkan** atau klik area unggah
3. Menekan **"Coba Kuis Contoh"** untuk langsung mencoba tanpa file — atau klik **"Buat Kuis via NotebookLM"** untuk generate soal otomatis

![Home Screen](public/screenshots/screen_home.png)

---

### 2. Sesi Kuis — Dialog Pak Guru & Pilihan Jawaban

Saat kuis berlangsung:
- Pertanyaan muncul dengan animasi **typewriting** dalam **balon komik** bergaya RPG dari Pak Guru
- Sprite **karakter pelajar** berjalan di bawah layar
- **Progress bar** di atas menampilkan soal ke-berapa dan poin terkumpul
- Pilih jawaban A / B / C / D, lalu lanjut ke soal berikutnya
- **BGM** dan **SFX** dapat dimatikan/dihidupkan sewaktu-waktu dari pojok kanan atas

![Quiz Screen](public/screenshots/screen_quiz.png)

---

### 3. Layar Hasil — Skor Akhir & Sertifikat

Setelah semua soal terjawab:
- Layar menampilkan **Skor Akhir** (dalam poin) dan **Akurasi** (persentase jawaban benar)
- Animasi bintang & konfeti merayakan penyelesaian misi
- Tekan **"Buka Sertifikat Penyelesaian"** untuk melihat dan mengunduh sertifikat bergambar bintang

![Result Screen](public/screenshots/screen_result.png)

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

Buka [http://localhost:3000](http://localhost:3000) di browser.

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
│   ├── page.tsx              # Halaman utama
│   ├── layout.tsx            # Root layout & font
│   └── globals.css           # Global styles & animasi komik
├── components/
│   ├── quiz/
│   │   └── QuestionPanel.tsx # Panel soal + dialog Pak Guru
│   ├── CertificateCanvas.tsx # Render sertifikat digital
│   └── PixelProgressBar.tsx  # Progress bar + tombol BGM/SFX
├── lib/
│   ├── audioEngine.ts        # Singleton audio BGM & SFX
│   ├── markdownParser.ts     # Parser file Markdown → soal
│   └── constants.ts          # Konstanta: bintang, prompt NotebookLM
├── public/
│   ├── audio/                # File BGM .mp3
│   ├── sprites/              # Sprite karakter (teacher.png, dll)
│   └── screenshots/          # Screenshot untuk dokumentasi
└── store/
    └── useGameStore.ts       # Zustand store: state global kuis
```

---

## 📝 Format File Markdown

File Markdown yang diunggah akan diparse secara otomatis. Gunakan format berikut:

```markdown
---
title: Sejarah & Pengetahuan Umum
subject: IPS
difficulty: medium
---

# Materi: Proklamasi Kemerdekaan

Pertanyaan dan jawaban dapat di-generate otomatis via NotebookLM
menggunakan tombol "Buat Kuis via NotebookLM" di halaman utama.
```

Soal dalam format JSON juga dapat ditempelkan langsung.

---

## 🔊 Pengaturan Audio

| Kontrol | Lokasi | Keterangan |
|---|---|---|
| **BGM** | Pojok kanan atas | Musik latar 8-bit retro (8% volume default) |
| **SFX** | Pojok kanan atas | Efek suara klik & typewriting |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Bahasa**: TypeScript
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling**: Vanilla CSS + Google Fonts (Press Start 2P, VT323)
- **Audio**: Web Audio API + HTML5 Audio (singleton engine)
- **Deployment**: [Vercel](https://vercel.com)

---

## 📄 Lisensi

MIT License — Bebas digunakan untuk keperluan pendidikan dan penelitian.

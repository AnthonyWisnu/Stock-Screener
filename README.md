# IDX Stock Screener

Aplikasi web untuk memindai saham yang tercatat di Bursa Efek Indonesia (IDX) berdasarkan indikator teknikal. Data harga diperbarui otomatis setiap 15 menit selama jam bursa, hasil kalkulasi indikator disimpan di PostgreSQL, dan disajikan melalui API FastAPI untuk antarmuka React yang mendukung filter, pengurutan kolom, serta chart candlestick dengan overlay indikator.

Aplikasi ini dirancang untuk deployment dengan Supabase PostgreSQL, backend FastAPI di Railway, dan frontend React di GitHub Pages.

---

## Daftar Isi

1. [Deskripsi Singkat](#1-deskripsi-singkat)
2. [Fitur Utama](#2-fitur-utama)
3. [Arsitektur dan Alasan Efisiensinya](#3-arsitektur-dan-alasan-efisiensinya)
4. [Diagram Alur Data](#4-diagram-alur-data)
5. [Tech Stack](#5-tech-stack)
6. [Struktur Folder Project](#6-struktur-folder-project)
7. [Indikator Teknikal yang Dihitung](#7-indikator-teknikal-yang-dihitung)
8. [Instalasi Lokal Singkat](#8-instalasi-lokal-singkat)
9. [Deployment ke Supabase, Railway, dan GitHub Pages](#9-deployment-ke-supabase-railway-dan-github-pages)
10. [Lisensi dan Catatan Akademik](#10-lisensi-dan-catatan-akademik)

---

## 1. Deskripsi Singkat

IDX Stock Screener membantu pengguna (trader, investor, atau mahasiswa) menyaring saham IDX secara cepat berdasarkan kriteria teknikal seperti RSI, MACD, EMA, Bollinger Band, dan rasio volume. Daftar saham yang ditampilkan selalu merupakan snapshot terakhir dari hasil kalkulasi indikator yang dijalankan di backend, sehingga interaksi pengguna (filter, sort, buka chart) terasa instan tanpa beban perhitungan saat request masuk.

Seluruh antarmuka dan pesan berbahasa Indonesia. Aplikasi ini dirancang ringan agar dapat berjalan di paket shared hosting Hostinger.

---

## 2. Fitur Utama

- **Pembaruan near real-time**: data OHLCV dan indikator disegarkan setiap 15 menit selama jam bursa (Senin sampai Jumat, 09:00 sampai 16:00 WIB).
- **Tabel screener interaktif**: kolom Kode Saham, harga terakhir, 7 indikator teknikal, dan waktu pembaruan.
- **Filter berdasarkan indikator**: minimum dan maksimum untuk RSI, MACD, MACD Signal, EMA 50, EMA 200, BB Upper, BB Lower, dan Volume Ratio.
- **Sorting kolom**: pengurutan naik atau turun pada setiap kolom, dikerjakan di sisi backend agar konsisten dengan pagination.
- **Paginasi**: ukuran halaman default 50 baris, maksimum 200.
- **Chart candlestick dengan overlay indikator**: EMA 50, EMA 200, BB Upper, BB Lower ditumpuk di chart utama; RSI, MACD, MACD Signal di sub-panel yang sumbu waktunya selaras.
- **Rentang chart fleksibel**: 1 hari, 5 hari, 1 bulan, 3 bulan.
- **Bahasa Indonesia penuh** untuk label UI, pesan validasi, dan dokumentasi.
- **Deployment tiga platform**: Supabase untuk database, Railway untuk backend FastAPI, GitHub Pages untuk frontend.

---

## 3. Arsitektur dan Alasan Efisiensinya

Aplikasi menggunakan arsitektur **pre-computed flat table**. Artinya, seluruh nilai indikator teknikal sudah dihitung sebelum pengguna me-request data, dan disimpan di satu tabel yang bentuknya "rata" (flat), siap dibaca tanpa JOIN berat dan tanpa perhitungan ulang.

### 3.1. Bagaimana cara kerjanya

1. Scheduler APScheduler bangun setiap 15 menit di dalam proses FastAPI.
2. Data_Fetcher menarik OHLCV terbaru dari yfinance untuk setiap Kode Saham aktif.
3. Indicator_Calculator menghitung 7 indikator teknikal menggunakan pandas-ta.
4. Hasilnya di-upsert (insert atau update berdasarkan kunci) ke tabel PostgreSQL.
5. Saat pengguna membuka aplikasi, API hanya membaca baris jadi dan mengirimkannya ke frontend.

### 3.2. Mengapa arsitektur ini efisien

- **Beban pengguna konstan**: tidak peduli ada 10 atau 1000 pengguna aktif, jumlah panggilan yfinance tetap sama karena hanya dipicu oleh jadwal.
- **Query read super ringan**: endpoint daftar saham hanya menjalankan `SELECT ... WHERE ... ORDER BY ... LIMIT`, tidak ada agregasi, tidak ada window function.
- **Kalkulasi di Python**: logika indikator mudah diuji, mudah di-debug, dan tidak mengunci database dengan stored procedure.
- **Ramah shared hosting**: beban CPU berada di interval yang terjadwal, bukan saat traffic melonjak.
- **Cocok dengan batasan Hostinger**: tidak butuh Redis, Celery worker, atau layanan tambahan yang memerlukan SSH.
- **Skalabel ke depan**: jika kelak butuh cache layer atau pindah ke VPS, arsitektur ini tetap valid; cukup tambah Redis di atas tabel yang sudah flat.

### 3.3. Batas arsitektural

- Data "near real-time" pada granularitas 15 menit, bukan per detik. Ini trade-off yang disengaja agar aplikasi hemat sumber daya dan tidak melanggar rate limit yfinance.
- Kalkulasi indikator **tidak** dilakukan di SQL. Tidak ada materialized view atau fungsi agregat kustom untuk indikator. Ini memastikan logika tetap portabel.

---

## 4. Diagram Alur Data

```
+-------------------+        setiap 15 menit
|   APScheduler     |  ---------------------------.
| (Asia/Jakarta)    |                              |
+-------------------+                              v
                                         +------------------+
                                         |  Data_Fetcher    |
                                         |  (Python async)  |
                                         +------------------+
                                                  |
                                                  |  OHLCV per Kode_Saham
                                                  v
                                         +------------------+
                                         |   yfinance       |
                                         |  (ticker .JK)    |
                                         +------------------+
                                                  |
                                                  |  DataFrame OHLCV
                                                  v
                                         +----------------------+
                                         | Indicator_Calculator |
                                         |   (pandas-ta)        |
                                         +----------------------+
                                                  |
                                                  |  RSI, MACD, EMA, BB, Volume Ratio
                                                  v
                                         +------------------+
                                         |    PostgreSQL    |
                                         |  (UPSERT flat)   |
                                         +------------------+
                                                  |
                                                  |  baris jadi
                                                  v
                                         +------------------+
                                         |     FastAPI      |
                                         |   /api/stocks    |
                                         | /api/stocks/{id} |
                                         +------------------+
                                                  |
                                                  |  JSON
                                                  v
                                         +------------------+
                                         |  React + Tailwind|
                                         |  tabel + chart   |
                                         +------------------+
                                                  |
                                                  v
                                            Pengguna akhir
```

Panah searah: pengguna tidak pernah memicu panggilan yfinance, dan API tidak pernah menghitung indikator saat request masuk.

---

## 5. Tech Stack

| Lapisan | Teknologi | Peran |
|---|---|---|
| Frontend framework | React.js 18 | SPA untuk tabel screener dan halaman chart |
| Styling | Tailwind CSS 3 | Utility-first styling, konsistensi tampilan |
| Chart | Lightweight Charts atau ApexCharts | Candlestick dengan overlay indikator |
| Backend framework | Python FastAPI | REST API async |
| Bahasa backend | Python 3.11+ | Seluruh logika server |
| Scheduler | APScheduler | Pemicu fetch tiap 15 menit selama jam bursa |
| Sumber data harga | yfinance | Data OHLCV saham IDX dengan suffix .JK |
| Library indikator | ta (bukosabino/ta) | RSI, MACD, EMA, Bollinger Band |
| Database | Supabase PostgreSQL | Penyimpanan OHLCV dan indikator |
| Driver DB async | asyncpg atau SQLAlchemy 2.0 async | Akses non-blocking |
| Validasi skema | Pydantic v2 | Validasi request dan response |
| Logging | Python `logging` ke stdout | Observability di Hostinger log viewer |
| Deployment backend | Railway | Menjalankan FastAPI |
| Deployment frontend | GitHub Pages | Hosting SPA React |

Tech stack ini bersifat terkunci. Perubahan hanya dilakukan setelah konfirmasi eksplisit dari pemilik project.

---

## 6. Struktur Folder Project

Struktur di bawah ini adalah target final. Folder atau file dibuat bertahap sesuai `tasks.md`.

```
Stock-Screener/
├── AGENT.md                     # aturan permanen untuk agen pengembangan
├── README.md                    # dokumen ini
├── .env.example                 # contoh environment variable (tanpa nilai nyata)
├── .gitignore
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # entry point FastAPI + startup Scheduler
│   │   ├── config.py            # loader env var, validasi startup
│   │   ├── logging_config.py    # format log ke stdout
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes_stocks.py # GET /api/stocks, GET /api/stocks/{kode}
│   │   │   └── schemas.py       # Pydantic models untuk request/response
│   │   │
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── market_hours.py  # util jam bursa WIB, weekend check
│   │   │   └── errors.py        # exception handler dan pesan ID
│   │   │
│   │   ├── data/
│   │   │   ├── __init__.py
│   │   │   ├── fetcher.py       # Data_Fetcher: panggil yfinance async
│   │   │   └── seed_stocks.py   # isi awal tabel referensi saham
│   │   │
│   │   ├── indicators/
│   │   │   ├── __init__.py
│   │   │   └── calculator.py    # 7 indikator via pandas-ta
│   │   │
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── engine.py        # pool async
│   │   │   ├── models.py        # definisi tabel (SQLAlchemy atau SQL murni)
│   │   │   ├── migrations/      # SQL migration files
│   │   │   └── repository.py    # upsert, select flat
│   │   │
│   │   └── scheduler/
│   │       ├── __init__.py
│   │       └── jobs.py          # APScheduler job definitions
│   │
│   ├── tests/                   # unit test kalkulator indikator (tanpa DB)
│   ├── requirements.txt
│   └── pyproject.toml           # konfigurasi black, ruff, mypy
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/
│   │   │   └── stocksClient.js  # wrapper fetch ke FastAPI
│   │   ├── components/
│   │   │   ├── TabelScreener.jsx
│   │   │   ├── KontrolFilter.jsx
│   │   │   ├── Paginasi.jsx
│   │   │   └── PesanError.jsx
│   │   ├── pages/
│   │   │   ├── HalamanDaftar.jsx
│   │   │   └── HalamanDetail.jsx
│   │   ├── charts/
│   │   │   └── ChartCandlestick.jsx
│   │   ├── hooks/
│   │   │   └── useDaftarSaham.js
│   │   └── styles/
│   │       └── index.css        # @tailwind directives
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
│
├── docs/
│   ├── deployment-hostinger.md  # panduan deploy lewat panel
│   └── arsitektur.md            # catatan teknis tambahan
│
└── .kiro/
    └── specs/
        └── idx-stock-screener/
            ├── requirements.md
            ├── design.md
            └── tasks.md
```

---

## 7. Indikator Teknikal yang Dihitung

Seluruh indikator dihitung di backend Python menggunakan pandas-ta.

| Indikator | Parameter | Catatan |
|---|---|---|
| RSI_14 | periode 14 | Momentum oversold/overbought |
| MACD | fast 12, slow 26, signal 9 | Nilai garis MACD |
| MACD_Signal | signal 9 | Garis sinyal dari MACD |
| EMA_50 | periode 50 | Tren menengah |
| EMA_200 | periode 200 | Tren jangka panjang, butuh minimal 200 bar |
| BB_Upper | periode 20, stdev 2 | Batas atas Bollinger Band |
| BB_Lower | periode 20, stdev 2 | Batas bawah Bollinger Band |
| Volume_Ratio | volume bar terakhir dibagi rata-rata 20 bar | Konfirmasi kekuatan pergerakan |

Jika jumlah bar kurang dari periode minimum sebuah indikator, nilai indikator tersebut disimpan sebagai null dan dicatat di log.

---

## 8. Instalasi Lokal Singkat

Instruksi ini untuk pengembangan lokal saja. Deployment produksi menggunakan Hostinger panel (lihat bagian 9).

**Prasyarat:**

- Python 3.11 atau lebih baru
- Node.js 20 atau lebih baru
- PostgreSQL 14 atau lebih baru

**Langkah umum:**

1. Salin `.env.example` menjadi `.env` dan isi kredensial database lokal.
2. Buat virtual environment Python dan install dependensi dari `backend/requirements.txt`.
3. Jalankan migrasi database dari `backend/app/db/migrations/`.
4. Jalankan backend FastAPI dengan uvicorn pada port 8000.
5. Install dependensi frontend dengan npm pada folder `frontend/`.
6. Jalankan dev server Vite, lalu buka alamat yang ditampilkan di terminal.

Rincian teknis ada di `docs/` dan akan dilengkapi seiring implementasi task.

---

## 9. Deployment ke Supabase, Railway, dan GitHub Pages

Deployment production memakai tiga platform.

**Ringkasan langkah:**

1. Jalankan migration SQL di Supabase.
2. Deploy folder `backend/` ke Railway.
3. Isi Railway Variables, terutama `DATABASE_URL`, `CORS_ALLOW_ORIGINS`, dan konfigurasi scheduler.
4. Deploy frontend dengan GitHub Actions ke GitHub Pages.
5. Isi repository secret GitHub `VITE_API_BASE_URL` dengan URL backend Railway.

Panduan lengkap ada di `docs/deployment-supabase-railway-github.md`.

---

## 10. Lisensi dan Catatan Akademik

Project ini dikembangkan sebagai tugas akademik. Seluruh data harga saham berasal dari yfinance dan tunduk pada ketentuan layanan Yahoo Finance. Data digunakan untuk tujuan edukasi dan tidak menjadi rekomendasi investasi.

Nama dan simbol saham IDX tetap menjadi milik emiten masing-masing.

# IDX Stock Screener

IDX Stock Screener adalah aplikasi web untuk memantau dan menyaring saham Bursa Efek Indonesia berdasarkan data harga, volume, dan indikator teknikal. Aplikasi ini dibangun sebagai sistem full-stack dengan pemisahan yang jelas antara frontend, backend, scheduler, dan database.

Project ini memakai arsitektur pre-computed flat table: data OHLCV diambil secara berkala oleh backend, indikator teknikal dihitung di Python, lalu hasil akhirnya disimpan ke PostgreSQL. Frontend hanya membaca data yang sudah siap pakai melalui API, sehingga proses filter, sorting, pagination, dan tampilan chart tidak memicu kalkulasi berat secara langsung.

## Ringkasan Project

| Aspek | Keterangan |
|---|---|
| Nama aplikasi | IDX Stock Screener |
| Domain masalah | Screener saham Indonesia |
| Target pengguna | Investor, trader, mahasiswa, atau analis yang ingin melihat saham berdasarkan indikator teknikal |
| Frontend | React 18, Vite, Tailwind CSS, HashRouter, Lightweight Charts |
| Backend | Python FastAPI, SQLAlchemy 2 async, asyncpg, APScheduler |
| Database | Supabase PostgreSQL |
| Sumber data | yfinance dengan suffix ticker `.JK` |
| Kalkulasi indikator | Python menggunakan library `ta` |
| Deployment backend | Railway |
| Deployment frontend | GitHub Pages |
| Bahasa UI | Bahasa Indonesia |

## Tujuan Aplikasi

Aplikasi ini dibuat untuk menyediakan dashboard screener saham IDX yang dapat:

1. Menampilkan daftar saham yang sudah memiliki data teknikal terbaru.
2. Memfilter saham berdasarkan nilai indikator teknikal.
3. Mengurutkan data berdasarkan kolom tertentu seperti harga, RSI, MACD, EMA, Bollinger Band, dan volume ratio.
4. Membuka halaman detail saham untuk melihat chart candlestick dan overlay indikator.
5. Mengambil dan menghitung data secara terjadwal selama jam bursa.
6. Menyimpan hasil kalkulasi ke database agar API dan frontend tetap ringan.

## Fitur Utama

### 1. Screener Saham

Halaman utama menampilkan tabel saham dengan kolom:

- Kode saham
- Harga terakhir
- RSI 14
- MACD
- MACD Signal
- EMA 50
- EMA 200
- Bollinger Band Upper
- Bollinger Band Lower
- Volume Ratio
- Waktu pembaruan terakhir

Setiap baris saham dapat diklik untuk membuka halaman detail.

### 2. Filter Indikator

Frontend menyediakan panel filter untuk nilai minimum dan maksimum:

- RSI 14
- MACD
- MACD Signal
- EMA 50
- EMA 200
- Bollinger Band Upper
- Bollinger Band Lower
- Volume Ratio

Filter dikirim ke backend melalui query parameter. Backend melakukan filtering di database terhadap tabel `stocks_latest`.

### 3. Sorting dan Pagination

Sorting dilakukan di backend agar tetap konsisten dengan pagination. Kolom yang dapat diurutkan:

- `kode_saham`
- `harga_terakhir`
- `rsi_14`
- `macd`
- `macd_signal`
- `ema_50`
- `ema_200`
- `bb_upper`
- `bb_lower`
- `volume_ratio`
- `last_updated_at`

Pagination juga dilakukan di backend dengan parameter `page` dan `page_size`.

### 4. Detail Saham dan Chart Candlestick

Halaman detail saham menyediakan:

- Informasi kode saham dan nama perusahaan
- Harga terakhir
- Pilihan range: 1 hari, 5 hari, 1 bulan, 3 bulan
- Chart candlestick OHLCV
- Overlay EMA 50 dan EMA 200
- Overlay Bollinger Band Upper dan Lower
- Sub-panel RSI 14
- Sub-panel MACD dan MACD Signal

Chart dibuat menggunakan `lightweight-charts`.

### 5. Scheduler Data Market

Backend menggunakan APScheduler untuk menjalankan siklus pengambilan data secara berkala.

Alur scheduler:

1. Scheduler berjalan setiap `FETCH_INTERVAL_MINUTES`.
2. Backend memeriksa apakah waktu saat ini berada dalam jam bursa.
3. Backend membaca daftar saham aktif dari tabel `stocks`.
4. Untuk setiap saham, backend memanggil yfinance dengan format ticker `KODE.JK`.
5. Data OHLCV dinormalisasi.
6. Indikator teknikal dihitung di Python.
7. Data OHLCV, indikator, dan snapshot terbaru disimpan ke Supabase PostgreSQL.

## Arsitektur Sistem

Arsitektur aplikasi terdiri dari tiga lapisan utama:

```text
Frontend React
    |
    | HTTP request
    v
FastAPI Backend di Railway
    |
    | SQLAlchemy async + asyncpg
    v
Supabase PostgreSQL
```

Scheduler berjalan di dalam proses backend FastAPI. Scheduler tidak berada di frontend dan tidak dipicu oleh user request.

### Alur Data End-to-End

```text
APScheduler
    |
    v
Data Fetcher
    |
    | yfinance: BBCA.JK, BBRI.JK, BMRI.JK, dst.
    v
OHLCV DataFrame
    |
    v
Indicator Calculator
    |
    | RSI, MACD, EMA, Bollinger Band, Volume Ratio
    v
Supabase PostgreSQL
    |
    | stocks
    | stock_ohlcv
    | stock_indicators
    | stocks_latest
    v
FastAPI API
    |
    | GET /api/stocks
    | GET /api/stocks/{kode_saham}
    | GET /api/status
    v
React Frontend
```

## Prinsip Desain: Pre-computed Flat Table

Project ini tidak menghitung indikator saat user membuka halaman. Semua indikator dihitung terlebih dahulu oleh backend lalu disimpan ke database.

Keuntungan pendekatan ini:

- Response API lebih cepat karena hanya membaca data yang sudah jadi.
- Beban kalkulasi tidak bergantung pada jumlah pengguna.
- Sumber data eksternal tidak dipanggil langsung dari frontend.
- Query screener menjadi sederhana: `SELECT`, `WHERE`, `ORDER BY`, `LIMIT`, `OFFSET`.
- Data terbaru per saham tersimpan dalam satu tabel flat bernama `stocks_latest`.

Tabel `stocks_latest` menjadi sumber utama halaman screener.

## Tech Stack

### Frontend

| Teknologi | Fungsi |
|---|---|
| React 18 | Framework UI berbasis komponen |
| Vite | Build tool dan dev server |
| Tailwind CSS | Styling utility-first |
| React Router DOM | Routing halaman |
| HashRouter | Routing aman untuk GitHub Pages |
| Axios | HTTP client |
| Lightweight Charts | Chart candlestick dan indikator |

### Backend

| Teknologi | Fungsi |
|---|---|
| Python 3.11 | Runtime backend |
| FastAPI | Framework API |
| Uvicorn | ASGI server |
| SQLAlchemy 2 async | ORM dan query builder |
| asyncpg | Driver PostgreSQL async |
| APScheduler | Scheduler background job |
| yfinance | Pengambilan data OHLCV |
| pandas | Manipulasi data time-series |
| numpy | Operasi numerik |
| ta | Kalkulasi indikator teknikal |
| Pydantic v2 | Validasi konfigurasi dan response schema |

### Database dan Deployment

| Platform | Fungsi |
|---|---|
| Supabase PostgreSQL | Database production |
| Railway | Hosting backend FastAPI |
| GitHub Pages | Hosting frontend static React |
| GitHub Actions | Build dan deploy frontend |

## Struktur Folder

```text
Stock-Screener/
  AGENT.md
  README.md
  .env.example
  .github/
    workflows/
      deploy-frontend.yml
  backend/
    app/
      api/
        routes_stocks.py
        schemas.py
      core/
        errors.py
        market_hours.py
      data/
        fetcher.py
        seed_stocks.py
      db/
        engine.py
        models.py
        repository.py
        migrations/
          001_initial_schema.sql
          002_seed_stocks.sql
      indicators/
        calculator.py
      scheduler/
        jobs.py
        setup.py
      config.py
      main.py
    scripts/
      _check_db.py
      setup_db.py
      force_fetch.py
      check_no_emoji.py
    requirements.txt
    railway.toml
    runtime.txt
  frontend/
    src/
      api/
        stocksClient.js
        mockData.js
      charts/
        ChartCandlestick.jsx
      components/
        KontrolFilter.jsx
        NavBar.jsx
        Paginasi.jsx
        PesanError.jsx
        TabelScreener.jsx
      hooks/
        useDaftarSaham.js
        useDetailSaham.js
      pages/
        HalamanDaftar.jsx
        HalamanDetail.jsx
      App.jsx
      main.jsx
    package.json
    vite.config.js
    tailwind.config.js
  docs/
    cara-menjalankan-lokal.md
    deployment-supabase-railway-github.md
```

## Database

Database production menggunakan Supabase PostgreSQL. Aplikasi tidak memakai Supabase client langsung dari frontend. Semua akses data dilakukan melalui backend FastAPI menggunakan `DATABASE_URL`.

### Tabel `stocks`

Tabel referensi saham.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `kode_saham` | `CHAR(4)` | Primary key, kode saham IDX tanpa suffix `.JK` |
| `nama_perusahaan` | `VARCHAR(255)` | Nama emiten |
| `aktif` | `BOOLEAN` | Menentukan apakah saham ikut diproses scheduler |
| `created_at` | `TIMESTAMPTZ` | Waktu dibuat |
| `updated_at` | `TIMESTAMPTZ` | Waktu diperbarui |

### Tabel `stock_ohlcv`

Menyimpan data OHLCV historis.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `kode_saham` | `CHAR(4)` | Foreign key ke `stocks` |
| `timestamp_bar` | `TIMESTAMPTZ` | Waktu bar dalam UTC |
| `open` | `NUMERIC(18,4)` | Harga pembukaan |
| `high` | `NUMERIC(18,4)` | Harga tertinggi |
| `low` | `NUMERIC(18,4)` | Harga terendah |
| `close` | `NUMERIC(18,4)` | Harga penutupan |
| `volume` | `BIGINT` | Volume transaksi |

Primary key: `(kode_saham, timestamp_bar)`.

### Tabel `stock_indicators`

Menyimpan hasil kalkulasi indikator teknikal per bar.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `kode_saham` | `CHAR(4)` | Foreign key ke `stocks` |
| `timestamp_bar` | `TIMESTAMPTZ` | Waktu bar dalam UTC |
| `rsi_14` | `NUMERIC(10,4)` | Relative Strength Index 14 |
| `macd` | `NUMERIC(18,6)` | MACD line |
| `macd_signal` | `NUMERIC(18,6)` | MACD signal line |
| `ema_50` | `NUMERIC(18,4)` | Exponential Moving Average 50 |
| `ema_200` | `NUMERIC(18,4)` | Exponential Moving Average 200 |
| `bb_upper` | `NUMERIC(18,4)` | Bollinger Band upper |
| `bb_lower` | `NUMERIC(18,4)` | Bollinger Band lower |
| `volume_ratio` | `NUMERIC(10,4)` | Volume bar terakhir dibanding rata-rata volume sebelumnya |
| `last_updated_at` | `TIMESTAMPTZ` | Waktu upsert terakhir |

Primary key: `(kode_saham, timestamp_bar)`.

### Tabel `stocks_latest`

Tabel flat untuk screener utama. Satu baris mewakili snapshot terbaru satu saham.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `kode_saham` | `CHAR(4)` | Primary key |
| `nama_perusahaan` | `VARCHAR(255)` | Nama emiten |
| `harga_terakhir` | `NUMERIC(18,4)` | Harga terakhir |
| `timestamp_bar` | `TIMESTAMPTZ` | Waktu bar terbaru |
| `rsi_14` | `NUMERIC(10,4)` | RSI terbaru |
| `macd` | `NUMERIC(18,6)` | MACD terbaru |
| `macd_signal` | `NUMERIC(18,6)` | MACD signal terbaru |
| `ema_50` | `NUMERIC(18,4)` | EMA 50 terbaru |
| `ema_200` | `NUMERIC(18,4)` | EMA 200 terbaru |
| `bb_upper` | `NUMERIC(18,4)` | Bollinger upper terbaru |
| `bb_lower` | `NUMERIC(18,4)` | Bollinger lower terbaru |
| `volume_ratio` | `NUMERIC(10,4)` | Volume ratio terbaru |
| `last_updated_at` | `TIMESTAMPTZ` | Waktu update terakhir |

Tabel ini dipakai endpoint `GET /api/stocks`.

## Indikator Teknikal

Indikator dihitung menggunakan library `ta` di backend Python.

| Indikator | Fungsi |
|---|---|
| RSI 14 | Mengukur momentum dan kondisi overbought/oversold |
| MACD | Mengukur perubahan momentum tren |
| MACD Signal | Garis sinyal MACD |
| EMA 50 | Rata-rata bergerak eksponensial jangka menengah |
| EMA 200 | Rata-rata bergerak eksponensial jangka panjang |
| Bollinger Band Upper | Batas atas volatilitas harga |
| Bollinger Band Lower | Batas bawah volatilitas harga |
| Volume Ratio | Perbandingan volume terakhir terhadap rata-rata volume sebelumnya |

Catatan: kode menyebut "7 indikator teknikal" karena MACD dan MACD Signal sering dianggap satu keluarga indikator MACD, sedangkan penyimpanan database tetap memuat delapan kolom nilai teknikal termasuk `volume_ratio`.

## API Backend

Base URL lokal:

```text
http://localhost:8000
```

Base URL production:

```text
https://stock-screener-production-4f4a.up.railway.app
```

### `GET /api/status`

Health check aplikasi.

Contoh response:

```json
{
  "status": "ok",
  "versi": "0.1.0",
  "waktu_server": "2026-05-19T10:00:00+07:00",
  "pasar_buka": true
}
```

### `GET /api/stocks`

Mengambil daftar saham dari tabel `stocks_latest`.

Query parameter:

| Parameter | Keterangan |
|---|---|
| `sort_by` | Kolom sorting, default `kode_saham` |
| `sort_order` | `asc` atau `desc` |
| `page` | Nomor halaman |
| `page_size` | Jumlah data per halaman |
| `rsi_14_min`, `rsi_14_max` | Filter RSI |
| `macd_min`, `macd_max` | Filter MACD |
| `macd_signal_min`, `macd_signal_max` | Filter MACD signal |
| `ema_50_min`, `ema_50_max` | Filter EMA 50 |
| `ema_200_min`, `ema_200_max` | Filter EMA 200 |
| `bb_upper_min`, `bb_upper_max` | Filter Bollinger upper |
| `bb_lower_min`, `bb_lower_max` | Filter Bollinger lower |
| `volume_ratio_min`, `volume_ratio_max` | Filter volume ratio |

Contoh:

```text
GET /api/stocks?sort_by=rsi_14&sort_order=desc&page=1&page_size=50&rsi_14_min=30&rsi_14_max=70
```

Contoh response:

```json
{
  "items": [
    {
      "kode_saham": "BBCA",
      "nama_perusahaan": "Bank Central Asia Tbk",
      "harga_terakhir": 9500,
      "indikator": {
        "rsi_14": 55.12,
        "macd": 12.3456,
        "macd_signal": 10.2231,
        "ema_50": 9400,
        "ema_200": 9000,
        "bb_upper": 9800,
        "bb_lower": 9100,
        "volume_ratio": 1.25
      },
      "last_updated_at": "2026-05-19T10:00:00+07:00"
    }
  ],
  "paginasi": {
    "page": 1,
    "page_size": 50,
    "total": 1,
    "total_pages": 1
  }
}
```

### `GET /api/stocks/{kode_saham}`

Mengambil detail saham berupa data OHLCV dan deret indikator untuk chart.

Path parameter:

| Parameter | Keterangan |
|---|---|
| `kode_saham` | Kode saham 4 huruf kapital, contoh `BBCA` |

Query parameter:

| Parameter | Nilai | Keterangan |
|---|---|---|
| `range` | `1d`, `5d`, `1mo`, `3mo` | Rentang data chart |

Contoh:

```text
GET /api/stocks/BBCA?range=1mo
```

Response berisi:

- `kode_saham`
- `nama_perusahaan`
- `range`
- `ohlcv`
- `indikator`
- `last_updated_at`

## Cara Menjalankan Lokal

### Prasyarat

- Windows, Linux, atau macOS
- Python 3.11 disarankan
- Node.js 20 atau lebih baru
- npm
- Koneksi ke Supabase PostgreSQL melalui `DATABASE_URL`

### 1. Setup Backend

Masuk ke folder backend:

```powershell
cd C:\laragon\www\Stock-Screener\backend
```

Buat virtual environment Python 3.11:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\activate
python --version
```

Install dependency:

```powershell
pip install -r requirements.txt
```

Pastikan file `backend/.env` berisi konfigurasi seperti:

```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD_URL_ENCODED]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require
LOG_LEVEL=INFO
MARKET_TIMEZONE=Asia/Jakarta
FETCH_INTERVAL_MINUTES=15
HISTORY_BAR_COUNT=260
YFINANCE_TIMEOUT_SECONDS=30
FETCH_MAX_CONCURRENCY=4
CORS_ALLOW_ORIGINS=http://localhost:5173,https://anthonywisnu.github.io
APP_ENV=production
```

Jangan menulis password asli di README, source code, atau file yang akan dikomit.

Tes koneksi database:

```powershell
python scripts\_check_db.py
```

Jalankan backend:

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

Cek API:

```text
http://localhost:8000/api/status
```

### 2. Setup Frontend

Buka terminal kedua:

```powershell
cd C:\laragon\www\Stock-Screener\frontend
npm install
$env:VITE_API_BASE_URL="http://localhost:8000"
$env:VITE_BASE_PATH="/"
npm run dev
```

Buka browser:

```text
http://localhost:5173
```

### 3. Force Fetch Data

Untuk memaksa satu siklus pengambilan data:

```powershell
cd C:\laragon\www\Stock-Screener\backend
.\.venv\Scripts\activate
python scripts\force_fetch.py
```

Jika yfinance gagal mengembalikan data, tabel `stocks_latest` tetap kosong. Itu berarti masalah berada di provider data, bukan di frontend atau schema database.

## Environment Variable

### Backend

| Variable | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | Ya | URL koneksi PostgreSQL Supabase |
| `LOG_LEVEL` | Tidak | Level log, default `INFO` |
| `MARKET_TIMEZONE` | Tidak | Zona waktu bursa, default `Asia/Jakarta` |
| `FETCH_INTERVAL_MINUTES` | Tidak | Interval scheduler |
| `HISTORY_BAR_COUNT` | Tidak | Target jumlah bar historis |
| `YFINANCE_TIMEOUT_SECONDS` | Tidak | Timeout request yfinance |
| `FETCH_MAX_CONCURRENCY` | Tidak | Jumlah ticker yang diproses paralel |
| `CORS_ALLOW_ORIGINS` | Ya untuk deploy | Daftar origin frontend yang diizinkan |
| `APP_ENV` | Tidak | `development`, `production`, atau `test` |

### Frontend

| Variable | Wajib | Keterangan |
|---|---|---|
| `VITE_API_BASE_URL` | Ya untuk deploy | Base URL backend Railway |
| `VITE_BASE_PATH` | Ya untuk GitHub Pages | Base path build Vite, contoh `/Stock-Screener/` |

## Deployment

### Backend ke Railway

Repository:

```text
https://github.com/AnthonyWisnu/Stock-Screener.git
```

Pengaturan Railway:

| Setting | Nilai |
|---|---|
| Root directory | `backend` |
| Builder | Railpack atau Nixpacks |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Healthcheck path | `/api/status` |
| Public networking port | `8080` jika diminta Railway |

Contoh environment variable Railway:

```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD_URL_ENCODED]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require
APP_ENV=production
LOG_LEVEL=INFO
MARKET_TIMEZONE=Asia/Jakarta
FETCH_INTERVAL_MINUTES=15
HISTORY_BAR_COUNT=260
YFINANCE_TIMEOUT_SECONDS=30
FETCH_MAX_CONCURRENCY=4
CORS_ALLOW_ORIGINS=https://anthonywisnu.github.io,http://localhost:5173
```

Endpoint production:

```text
https://stock-screener-production-4f4a.up.railway.app/api/status
```

### Frontend ke GitHub Pages

Workflow deployment berada di:

```text
.github/workflows/deploy-frontend.yml
```

GitHub repository secret:

```text
VITE_API_BASE_URL=https://stock-screener-production-4f4a.up.railway.app
```

GitHub Pages harus diatur ke:

```text
Settings > Pages > Source: GitHub Actions
```

URL frontend:

```text
https://anthonywisnu.github.io/Stock-Screener/
```

## Testing dan Verifikasi

### Test Backend

```powershell
cd backend
python -m pytest
```

Test yang tersedia mencakup:

- Kalkulasi indikator
- Jam bursa
- Schema response API

### Cek Database

```powershell
cd backend
python scripts\_check_db.py
```

Output akan menunjukkan jumlah baris:

- `stocks`
- `stocks_latest`
- `stock_ohlcv`
- `stock_indicators`

### Build Frontend

```powershell
cd frontend
npm run build
```

### Verifikasi Manual

1. Jalankan backend lokal.
2. Buka `http://localhost:8000/api/status`.
3. Jalankan frontend lokal.
4. Buka `http://localhost:5173`.
5. Coba filter indikator.
6. Klik salah satu saham untuk membuka halaman detail.
7. Pastikan chart muncul jika data OHLCV tersedia.

## Keamanan

Project ini menerapkan beberapa prinsip keamanan:

- Kredensial database dibaca dari environment variable.
- Password database tidak boleh ditulis di source code.
- Frontend tidak memakai Supabase service role key.
- Frontend hanya berkomunikasi dengan backend FastAPI.
- Backend mengatur CORS melalui `CORS_ALLOW_ORIGINS`.
- Supabase service role key tidak dibutuhkan oleh arsitektur ini.

Catatan penting: jika service role key pernah dibagikan di tempat publik, key tersebut sebaiknya di-rotate dari Supabase Dashboard.

## Batasan dan Catatan Operasional

### Keterbatasan yfinance

yfinance adalah sumber data tidak resmi. Beberapa risiko:

- Data dapat kosong walaupun ticker benar.
- Yahoo Finance dapat membatasi request.
- Format response dapat berubah.
- Ketersediaan data saham IDX tidak selalu stabil.

Jika fetch gagal, backend tetap hidup dan API tetap dapat diakses, tetapi tabel `stocks_latest` tidak terisi.

### Scheduler di Railway

Scheduler berjalan di dalam proses backend. Jika service Railway berhenti, tidur, atau restart, scheduler juga ikut berhenti sementara. Saat backend aktif kembali dan jam bursa sedang buka, aplikasi mencoba menjalankan siklus fetch awal.

### Tabel Screener Kosong

Jika frontend menampilkan tabel kosong, kemungkinan penyebabnya:

1. `stocks_latest` belum terisi.
2. yfinance gagal mengambil data.
3. Scheduler belum berjalan saat jam bursa.
4. Filter terlalu ketat.
5. Frontend mengarah ke URL backend yang salah.

Cek pertama:

```powershell
cd backend
python scripts\_check_db.py
```

## Troubleshooting

| Masalah | Penyebab umum | Solusi |
|---|---|---|
| `/api/status` gagal | Backend belum jalan atau Railway belum deploy | Jalankan Uvicorn atau cek Railway logs |
| Frontend blank | Build gagal atau env frontend salah | Cek GitHub Actions dan `VITE_API_BASE_URL` |
| Error CORS | Origin frontend belum masuk `CORS_ALLOW_ORIGINS` | Tambahkan URL GitHub Pages ke variable backend |
| Tabel screener kosong | `stocks_latest` kosong | Jalankan `force_fetch.py` dan cek log yfinance |
| `CERTIFICATE_VERIFY_FAILED` | Sertifikat SSL chain lokal bermasalah | Backend sudah memakai SSL context khusus untuk Supabase pooler |
| `ModuleNotFoundError` | Dependency Python belum terinstall | Jalankan `pip install -r requirements.txt` di venv |
| GitHub Pages 404 deploy | Pages belum diaktifkan untuk Actions | Settings > Pages > Source: GitHub Actions |
| Railway route `/` 404 | Root endpoint memang tidak dibuat | Gunakan `/api/status` |

## Status Implementasi Saat Ini

Yang sudah tersedia:

- Backend FastAPI async
- Supabase PostgreSQL schema
- Seed daftar 55 saham
- Scheduler APScheduler
- Fetcher yfinance
- Kalkulasi indikator teknikal
- Upsert OHLCV, indikator, dan latest snapshot
- Endpoint status
- Endpoint daftar saham
- Endpoint detail saham
- Frontend screener
- Frontend detail saham
- Chart candlestick dengan overlay indikator
- GitHub Pages workflow
- Railway config

Kondisi yang perlu dipantau:

- Reliabilitas yfinance untuk saham IDX.
- Ketersediaan data `stocks_latest`.
- Pengaturan CORS setelah URL frontend final.
- Scheduler di Railway selama jam bursa.

## Kesimpulan

IDX Stock Screener adalah aplikasi screener saham Indonesia berbasis web yang menggunakan arsitektur pre-computed flat table. Backend mengambil data OHLCV dari yfinance, menghitung indikator teknikal di Python, menyimpan hasil ke Supabase PostgreSQL, lalu menyediakan API ringan untuk frontend React. Frontend menampilkan tabel screener, filter, sorting, pagination, dan chart candlestick dengan overlay indikator.

Arsitektur ini memisahkan proses berat dari interaksi pengguna. Dengan demikian, pengguna hanya membaca data yang sudah dihitung, sementara proses fetch dan kalkulasi berjalan terjadwal di backend.

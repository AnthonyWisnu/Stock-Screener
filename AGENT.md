# AGENT.md

Dokumen ini berisi aturan permanen yang wajib dipatuhi oleh agen (Kiro) selama seluruh siklus hidup pengembangan project IDX Stock Screener. Setiap perubahan pada aturan di dokumen ini hanya boleh dilakukan atas persetujuan eksplisit dari pemilik project.

---

## 1. Identitas Project

- **Nama project:** IDX Stock Screener
- **Domain:** Aplikasi web screener saham Bursa Efek Indonesia (IDX)
- **Bahasa antarmuka dan dokumentasi:** Bahasa Indonesia
- **Pemilik:** Project akhir / tugas dosen
- **Spec master:** `.kiro/specs/idx-stock-screener/requirements.md`

Agen WAJIB menganggap file `requirements.md` sebagai sumber kebenaran utama. Jika ada konflik antara dokumen ini dan `requirements.md`, agen WAJIB meminta konfirmasi kepada pemilik project sebelum menulis kode.

---

## 2. Tech Stack yang Dikunci

Tech stack berikut bersifat **terkunci**. Agen **DILARANG** mengganti, menambah, atau mengurangi komponen apa pun di bawah ini tanpa konfirmasi eksplisit dari pemilik project.

| Lapisan | Teknologi | Versi minimum |
|---|---|---|
| Frontend framework | React.js | 18.x |
| Styling | Tailwind CSS | 3.x |
| Chart library | Lightweight Charts atau ApexCharts (dipilih saat design) | terbaru stabil |
| Backend framework | Python FastAPI | 0.110+ |
| Database | Supabase PostgreSQL | 14+ |
| Scheduler | APScheduler | 3.10+ |
| Sumber data harga | yfinance | terbaru stabil |
| Library indikator | ta (bukosabino/ta) | 0.11.0 |
| Driver DB async | asyncpg atau psycopg (async) | terbaru stabil |
| ORM (opsional) | SQLAlchemy 2.0 async | terbaru stabil |
| Deployment backend | Railway | n/a |
| Deployment frontend | GitHub Pages | n/a |

Aturan tambahan:

- **DILARANG** menambahkan Redis, Celery, RabbitMQ, Kafka, Docker, Kubernetes, atau komponen infra lain tanpa konfirmasi eksplisit.
- **DILARANG** mengganti yfinance dengan sumber data lain (misal IDX API resmi, Yahoo Finance REST, TradingView, Alpha Vantage) kecuali diminta eksplisit.
- **DILARANG** memindahkan kalkulasi indikator ke SQL, stored procedure, view materialized, atau extension PostgreSQL (misal TimescaleDB aggregate).
- **DILARANG** menggunakan Next.js, Vue, Svelte, Django, Flask, atau framework lain selain yang tercantum di tabel.

---

## 3. Prinsip Arsitektur Inti: Pre-computed Flat Table

Arsitektur project ini dibangun di atas prinsip **pre-computed flat table**. Setiap baris kode dan setiap keputusan desain WAJIB konsisten dengan prinsip berikut.

### 3.1. Kalkulasi di Python, bukan di SQL

- Seluruh 7 indikator teknikal (RSI_14, MACD, MACD_Signal, EMA_50, EMA_200, BB_Upper, BB_Lower, Volume_Ratio) dihitung di lapisan Python menggunakan `pandas-ta`.
- PostgreSQL hanya menjadi tempat **penyimpanan hasil**. Tidak ada fungsi agregat, window function, CTE, stored procedure, maupun view yang menghitung ulang indikator.
- Query pada API read path hanya melakukan `SELECT`, `WHERE`, `ORDER BY`, `LIMIT`, `OFFSET` pada kolom yang sudah jadi.

### 3.2. Upsert berbasis kunci unik

- Hasil kalkulasi disimpan menggunakan `INSERT ... ON CONFLICT (kode_saham, timestamp_bar) DO UPDATE`.
- Setiap baris indikator mewakili satu Kode_Saham pada satu bar waktu. Tidak ada duplikasi.
- Baris "latest" (terbaru per Kode_Saham) boleh disimpan di tabel terpisah (`stocks_latest`) agar query daftar saham jadi flat dan cepat.

### 3.3. Alasan arsitektural (wajib dipahami)

- **Frontend tidak pernah memicu perhitungan.** Request pengguna hanya membaca baris jadi, sehingga response cepat dan beban CPU konstan.
- **yfinance hanya dipanggil oleh Scheduler.** Jumlah panggilan eksternal konstan per 15 menit, tidak bergantung pada jumlah pengguna.
- **Indikator portabel.** Logika yang sama bisa diuji unit di Python tanpa butuh database.
- **Ramah Hostinger.** Shared hosting tidak cocok untuk kalkulasi on-demand ratusan saham; pre-computed table memindahkan beban ke jadwal tetap.

---

## 4. Alur Data Lengkap (End-to-End)

Alur ini adalah kontrak arsitektural. Setiap implementasi WAJIB mengikutinya.

```
[1] APScheduler (zona waktu Asia/Jakarta)
      |
      |  setiap 15 menit, Senin-Jumat, 09:00-16:00 WIB
      v
[2] Data_Fetcher (Python async)
      |
      |  baca daftar Kode_Saham aktif dari tabel stocks
      |  untuk setiap kode: panggil yfinance dengan suffix .JK
      |  interval=15m, minimal 250 bar
      v
[3] Indicator_Calculator (Python + pandas-ta)
      |
      |  RSI_14, MACD, MACD_Signal, EMA_50, EMA_200,
      |  BB_Upper, BB_Lower, Volume_Ratio
      v
[4] PostgreSQL (UPSERT via asyncpg/SQLAlchemy async)
      |
      |  tabel stock_ohlcv          : deret OHLCV historis
      |  tabel stock_indicators     : indikator per (kode, timestamp)
      |  tabel stocks_latest        : snapshot terakhir per Kode_Saham
      v
[5] FastAPI endpoints
      |
      |  GET /api/stocks            : daftar + filter + sort + pagination
      |  GET /api/stocks/{kode}     : deret OHLCV + overlay indikator
      v
[6] React + Tailwind CSS
      |
      |  tabel screener (filter, sort, pagination)
      |  halaman detail: chart candlestick + overlay + sub-panel RSI/MACD
      v
[7] Pengguna akhir
```

Aturan alur data:

- Arah panah **searah**. Frontend tidak boleh memanggil yfinance, dan API read path tidak boleh memicu fetcher.
- Satu-satunya komponen yang memanggil yfinance adalah Data_Fetcher yang dipicu Scheduler.
- Satu-satunya komponen yang menulis ke tabel indikator adalah pipeline fetcher-calculator.
- Frontend hanya berbicara dengan FastAPI.

---

## 5. Aturan Koding Python

### 5.1. Async wajib

- Seluruh endpoint FastAPI WAJIB `async def`.
- Seluruh akses database WAJIB menggunakan driver async (`asyncpg` langsung atau `SQLAlchemy 2.0 async`).
- Seluruh operasi I/O (HTTP, file, sleep) WAJIB menggunakan padanan async (`httpx.AsyncClient`, `asyncio.sleep`, dsb).
- Panggilan yfinance yang secara internal sinkron WAJIB dijalankan melalui `asyncio.to_thread(...)` atau `loop.run_in_executor` agar tidak memblok event loop.
- **DILARANG** mencampur `requests` sinkron di dalam request handler FastAPI.

### 5.2. Kredensial lewat environment variable

- Host, port, nama database, username, password PostgreSQL, serta konfigurasi lain yang sensitif WAJIB dibaca dari environment variable.
- **DILARANG** menulis literal kredensial di dalam source code, file konfigurasi yang dikomit, atau log.
- WAJIB menyediakan `.env.example` dengan daftar nama variable tanpa nilai nyata.
- Loader environment (misal `pydantic-settings` atau `os.environ`) WAJIB memvalidasi keberadaan variable wajib saat startup; jika ada yang hilang, proses startup dihentikan dengan log error yang menyebut nama variable.

### 5.3. Tanpa emoji pada kode Python

- **DILARANG** memuat karakter emoji di berkas Python mana pun, termasuk literal string, komentar, docstring, dan pesan log.
- Pesan log WAJIB berupa ASCII atau karakter Bahasa Indonesia standar tanpa piktograf.
- Agen WAJIB memeriksa output sendiri sebelum menyimpan file; jika menemukan emoji, hapus sebelum commit.

### 5.4. Logging

- Gunakan `logging` standar Python yang dikonfigurasi ke stdout, dengan format timestamp, level, module, dan pesan.
- WAJIB mencatat: awal siklus fetcher, akhir siklus (durasi + jumlah sukses/gagal), kegagalan yfinance per Kode_Saham, kegagalan upsert, overlap siklus, durasi siklus yang melebihi 15 menit.
- **DILARANG** mencatat nilai kredensial atau full DSN database.

### 5.5. Struktur error

- yfinance yang gagal untuk satu Kode_Saham **tidak boleh** menghentikan siklus; tangkap per-kode, log, lanjutkan.
- Upsert gagal karena koneksi WAJIB di-retry maksimal 3 kali dengan jeda 2 detik.
- Endpoint API WAJIB mengembalikan pesan error dalam Bahasa Indonesia dan status HTTP yang sesuai (400/404/500).

### 5.6. Tipe dan validasi

- Gunakan Pydantic v2 untuk skema request/response.
- Validasi parameter query (`filter`, `sort_by`, `sort_order`, `page`, `page_size`, `range`) WAJIB terjadi di lapisan Pydantic, bukan di dalam handler secara manual.
- Format Kode_Saham WAJIB divalidasi: 4 karakter alfabet kapital sebelum disimpan ke tabel referensi.

### 5.7. Gaya dan tooling

- Formatter: `black` (line length 100).
- Linter: `ruff` dengan konfigurasi yang menolak import tak terpakai dan variabel tak terpakai.
- Type checker: `mypy` mode `strict` direkomendasikan pada module inti (fetcher, calculator, repository).
- WAJIB menyediakan skrip atau konfigurasi linter yang memvalidasi ketiadaan emoji pada berkas Python.

---

## 6. Aturan Koding Frontend

- React 18 dengan functional component dan hooks. **DILARANG** menulis class component.
- Seluruh label UI, placeholder, tombol, toast, dan pesan error WAJIB dalam Bahasa Indonesia.
- Styling **hanya** via Tailwind utility class; tidak ada CSS module, styled-components, atau file CSS kustom kecuali `index.css` untuk `@tailwind` directive.
- State fetching gunakan `fetch` atau `axios` di dalam hook kustom; data caching sederhana diizinkan (React Query opsional, bukan wajib).
- Chart candlestick WAJIB menampilkan overlay EMA_50, EMA_200, BB_Upper, BB_Lower di chart utama; RSI_14, MACD, MACD_Signal di sub-panel yang sumbu waktunya selaras.
- Filter numerik WAJIB mendukung min dan max untuk setiap indikator.
- Sort WAJIB terjadi di backend lewat parameter `sort_by` dan `sort_order`, bukan di sisi klien (karena ada pagination).

---

## 7. Kontrak Database

Agen WAJIB memperlakukan skema berikut sebagai kontrak minimum. Nama kolom boleh disesuaikan saat design, tapi bentuk logisnya tetap.

- `stocks` (referensi): `kode_saham` (PK), `nama_perusahaan`, `aktif` (bool).
- `stock_ohlcv`: `kode_saham`, `timestamp_bar`, `open`, `high`, `low`, `close`, `volume`, PK (`kode_saham`, `timestamp_bar`).
- `stock_indicators`: `kode_saham`, `timestamp_bar`, `rsi_14`, `macd`, `macd_signal`, `ema_50`, `ema_200`, `bb_upper`, `bb_lower`, `volume_ratio`, `last_updated_at`, PK (`kode_saham`, `timestamp_bar`).
- `stocks_latest`: snapshot terakhir per Kode_Saham, sumber utama endpoint daftar saham.

Timestamp disimpan dalam UTC di database. API mengirim ke frontend dalam ISO 8601 dengan offset Asia/Jakarta.

---

## 8. Batasan Deployment

- Frontend dideploy ke GitHub Pages.
- Frontend WAJIB menggunakan `HashRouter` agar refresh route aman di GitHub Pages.
- Backend Python FastAPI dideploy ke Railway.
- Database production memakai Supabase PostgreSQL.
- Seluruh environment variable backend diatur melalui Railway Variables.
- Frontend hanya menerima URL backend melalui secret GitHub Actions `VITE_API_BASE_URL`.
- Service role Supabase DILARANG dipakai di frontend.

---

## 9. Aturan Perilaku Agen

- Sebelum menulis kode untuk fitur baru, agen WAJIB membaca ulang bagian relevan di `requirements.md` dan memastikan tidak ada konflik.
- Agen WAJIB mengonfirmasi ke pemilik project sebelum: mengganti tech stack, mengubah skema database yang sudah disepakati, mengubah kontrak API, atau memperkenalkan dependency baru yang tidak ada di daftar.
- Agen WAJIB menolak dengan sopan permintaan yang bertentangan dengan aturan di dokumen ini dan meminta klarifikasi.
- Setelah perubahan kode, agen WAJIB menjalankan build atau linter yang tersedia untuk memverifikasi; jika environment tidak mengizinkan, agen menyebut hal tersebut secara eksplisit.
- Agen WAJIB menjaga commit tetap kecil dan fokus. Satu commit idealnya menyelesaikan satu task di `tasks.md`.

---

## 10. Checklist Cepat Sebelum Menulis Kode

- [ ] Requirements terkait sudah dibaca?
- [ ] Tech stack yang dipakai ada di daftar yang dikunci?
- [ ] Apakah kalkulasi indikator tetap di Python?
- [ ] Apakah operasi DB tetap upsert/select flat tanpa logika indikator di SQL?
- [ ] Apakah kode Python async dan bebas emoji?
- [ ] Apakah kredensial dibaca dari environment variable?
- [ ] Apakah label UI berbahasa Indonesia?
- [ ] Apakah alur deployment masih sesuai Supabase + Railway + GitHub Pages?

Jika salah satu jawaban adalah "tidak", agen WAJIB berhenti, koreksi, atau minta konfirmasi sebelum melanjutkan.

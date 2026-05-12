# Panduan Deployment ke Hostinger

Seluruh langkah dilakukan melalui panel Hostinger. Tidak ada SSH, tidak ada terminal server.

---

## Prasyarat

- Akun Hostinger dengan paket yang mendukung Python App dan PostgreSQL.
- Python 3.11 atau lebih baru tersedia di panel.
- Node.js 20 tersedia di mesin lokal Anda (untuk build frontend).
- File project sudah lengkap di mesin lokal.

---

## Langkah 1: Siapkan Database PostgreSQL

1. Login ke panel Hostinger, buka menu **Databases** > **PostgreSQL**.
2. Klik **Create Database**.
3. Isi nama database (contoh: `idx_screener`), username, dan password.
4. Catat nilai berikut karena akan digunakan sebagai environment variable:
   - Host (biasanya `localhost` atau hostname internal Hostinger)
   - Port (biasanya `5432`)
   - Nama database
   - Username
   - Password
5. Buka **phpPgAdmin** atau tool database yang tersedia di panel.
6. Pilih database yang baru dibuat, lalu buka tab **SQL**.
7. Salin seluruh isi file `backend/app/db/migrations/001_initial_schema.sql` dan jalankan.
8. Salin seluruh isi file `backend/app/db/migrations/002_seed_stocks.sql` dan jalankan.
9. Verifikasi: tabel `stocks`, `stock_ohlcv`, `stock_indicators`, `stocks_latest` harus muncul.

---

## Langkah 2: Build Frontend (di mesin lokal)

Lakukan langkah ini di komputer Anda, bukan di server Hostinger.

1. Buka terminal di folder `frontend/`.
2. Jalankan:
   ```
   npm install
   npm run build
   ```
3. Folder `frontend/dist/` akan terbentuk berisi file HTML, CSS, dan JS yang sudah diminifikasi.

---

## Langkah 3: Upload Frontend ke Hostinger

1. Di panel Hostinger, buka **File Manager**.
2. Navigasi ke folder `public_html/` (atau folder root domain Anda).
3. Hapus isi folder tersebut bila ada file lama.
4. Upload seluruh isi folder `frontend/dist/` (bukan folder `dist/`-nya, tapi isinya) ke `public_html/`.
5. Pastikan file `index.html` berada langsung di `public_html/index.html`.

---

## Langkah 4: Upload Backend ke Hostinger

1. Di **File Manager**, buat folder baru di luar `public_html/`, misalnya `idx_backend/`.
2. Upload seluruh isi folder `backend/` ke `idx_backend/`.
   - Pastikan `idx_backend/app/`, `idx_backend/requirements.txt`, dan `idx_backend/pyproject.toml` ada.
3. Jangan upload folder `.venv/` atau `__pycache__/` bila ada.

---

## Langkah 5: Buat Python App di Panel

1. Di panel Hostinger, buka menu **Python** atau **Advanced** > **Python App**.
2. Klik **Create Application**.
3. Isi konfigurasi:
   - **Python version**: pilih 3.11 atau lebih baru.
   - **Application root**: `idx_backend` (folder yang dibuat di Langkah 4).
   - **Application URL**: subdomain atau path yang Anda inginkan untuk API.
   - **Application startup file**: `app/main.py`
   - **Application entry point**: `app` (nama variabel `app` di `main.py`)
4. Klik **Save** atau **Create**.

---

## Langkah 6: Install Dependency Python

1. Di halaman Python App yang baru dibuat, cari tombol **Install requirements** atau **pip install**.
2. Pastikan path ke `requirements.txt` mengarah ke `idx_backend/requirements.txt`.
3. Klik tombol tersebut dan tunggu hingga selesai.
4. Verifikasi: tidak ada error merah pada log instalasi.

---

## Langkah 7: Atur Environment Variable

1. Di halaman Python App, cari bagian **Environment variables** atau **Configuration**.
2. Tambahkan variable berikut satu per satu (nilai sesuai data dari Langkah 1):

   | Nama Variable           | Contoh Nilai              |
   |-------------------------|---------------------------|
   | POSTGRES_HOST           | localhost                 |
   | POSTGRES_PORT           | 5432                      |
   | POSTGRES_DB             | idx_screener              |
   | POSTGRES_USER           | user_anda                 |
   | POSTGRES_PASSWORD       | password_anda             |
   | LOG_LEVEL               | INFO                      |
   | MARKET_TIMEZONE         | Asia/Jakarta              |
   | FETCH_INTERVAL_MINUTES  | 15                        |
   | HISTORY_BAR_COUNT       | 260                       |
   | YFINANCE_TIMEOUT_SECONDS| 30                        |
   | FETCH_MAX_CONCURRENCY   | 4                         |
   | CORS_ALLOW_ORIGINS      | https://domain-anda.com   |
   | APP_ENV                 | production                |

3. Simpan setiap variable.

---

## Langkah 8: Jalankan Aplikasi

1. Di halaman Python App, klik tombol **Start** atau **Restart**.
2. Tunggu beberapa detik, lalu periksa **Log** atau **Error log**.
3. Log yang normal akan menampilkan:
   ```
   Aplikasi IDX Stock Screener versi 0.1.0 mulai.
   Pool koneksi database diinisialisasi: ...
   Koneksi database berhasil diverifikasi.
   Scheduler dimulai. Interval: 15 menit. Zona waktu: Asia/Jakarta.
   ```
4. Bila ada error `variable tidak ditemukan`, periksa kembali Langkah 7.

---

## Langkah 9: Konfigurasi Rewrite URL (SPA + API)

Agar React Router bekerja dan API dapat diakses dari frontend:

1. Di **File Manager**, buka `public_html/.htaccess` (buat bila belum ada).
2. Isi dengan:
   ```apache
   Options -MultiViews
   RewriteEngine On

   # Arahkan request /api ke backend Python App
   RewriteRule ^api/(.*)$ http://localhost:PORT/api/$1 [P,L]

   # Semua route lain diarahkan ke index.html (React SPA)
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^ /index.html [L]
   ```
   Ganti `PORT` dengan port yang digunakan Python App Anda (terlihat di halaman Python App).
3. Simpan file.

---

## Langkah 10: Verifikasi Akhir

1. Buka URL domain Anda di browser. Halaman screener harus muncul.
2. Buka URL `https://domain-anda.com/api/status`. Harus mengembalikan JSON:
   ```json
   { "status": "ok", "versi": "0.1.0", ... }
   ```
3. Tunggu hingga jam bursa (09:00 - 16:00 WIB, Senin-Jumat). Setelah 15 menit pertama, tabel screener akan mulai terisi data.
4. Klik salah satu baris saham untuk membuka halaman chart.

---

## Pemecahan Masalah Umum

| Gejala | Kemungkinan Penyebab | Solusi |
|---|---|---|
| Halaman putih / 404 | `.htaccess` belum dikonfigurasi | Periksa Langkah 9 |
| Error 500 dari `/api/status` | Environment variable kurang | Periksa Langkah 7 |
| Tabel screener kosong setelah jam bursa | Scheduler belum berjalan | Restart Python App |
| Log menampilkan `variable tidak ditemukan` | Salah satu env var belum diisi | Tambahkan variable yang disebutkan |
| Data tidak diperbarui | Di luar jam bursa | Normal; data hanya diperbarui 09:00-16:00 WIB |

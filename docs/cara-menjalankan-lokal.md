# Cara Menjalankan IDX Stock Screener di Lokal

Panduan ini mengasumsikan:
- Windows 10/11
- Python 3.9 sudah terinstall di `C:\Users\jatia\AppData\Local\Programs\Python\Python39\`
- PostgreSQL 18 sudah berjalan
- Node.js 18+ sudah terinstall

---

## Bagian 1 — Setup Password PostgreSQL

### Cara A: Cek via pgAdmin 4 (paling mudah)

1. Buka **Start Menu** → cari **pgAdmin 4** → buka
2. Masukkan master password pgAdmin (bisa berbeda dari password PostgreSQL)
3. Di panel kiri, klik kanan **Servers** → **Register** → **Server** (jika belum ada)
   - Atau klik server yang sudah ada → **Properties**
4. Tab **Connection**: lihat **Username** (biasanya `postgres`)
5. Password PostgreSQL adalah yang Anda isi saat pertama install PostgreSQL

### Cara B: Reset password via pg_hba.conf (jika lupa)

1. Buka **Notepad sebagai Administrator**
2. Buka file: `C:\Program Files\PostgreSQL\18\data\pg_hba.conf`
3. Cari baris yang berisi `127.0.0.1/32` dan `scram-sha-256`
4. Ubah `scram-sha-256` menjadi `trust` (sementara)
5. Simpan file
6. Buka **Services** (Win+R → `services.msc`) → restart service **postgresql-x64-18**
7. Buka PowerShell, jalankan:
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "ALTER USER postgres PASSWORD 'postgres123';"
   ```
8. Kembalikan `pg_hba.conf`: ganti `trust` kembali ke `scram-sha-256`
9. Restart service PostgreSQL lagi
10. Password Anda sekarang adalah `postgres123`

---

## Bagian 2 — Isi File .env

Buka file `backend\.env` dan isi password yang benar:

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=idx_screener
POSTGRES_USER=postgres
POSTGRES_PASSWORD=ISI_PASSWORD_ANDA_DI_SINI

LOG_LEVEL=INFO
MARKET_TIMEZONE=Asia/Jakarta
FETCH_INTERVAL_MINUTES=15
HISTORY_BAR_COUNT=260
YFINANCE_TIMEOUT_SECONDS=30
FETCH_MAX_CONCURRENCY=4
CORS_ALLOW_ORIGINS=http://localhost:5173
APP_ENV=development
```

---

## Bagian 3 — Setup Database (jalankan sekali)

Buka PowerShell di folder `backend`:

```powershell
cd C:\laragon\www\Stock-Screener\backend
```

Jalankan script setup:

```cmd
"C:\Users\jatia\AppData\Local\Programs\Python\Python39\python.exe" scripts/setup_db.py
```

Output yang diharapkan:
```
=== Setup Database IDX Stock Screener ===
Host    : localhost:5432
User    : postgres
Database: idx_screener

Database 'idx_screener' berhasil dibuat.
Menjalankan migrasi: 001_initial_schema.sql ...
  Selesai: 001_initial_schema.sql
Menjalankan migrasi: 002_seed_stocks.sql ...
  Selesai: 002_seed_stocks.sql

Setup selesai. Database siap digunakan.
```

Jika password salah, jalankan dengan argumen:
```cmd
"C:\Users\jatia\AppData\Local\Programs\Python\Python39\python.exe" scripts/setup_db.py --password PASSWORD_ANDA
```

---

## Bagian 4 — Jalankan Backend

Buka **Terminal 1** (PowerShell), masuk ke folder backend:

```powershell
cd C:\laragon\www\Stock-Screener\backend
& "C:\Users\jatia\AppData\Local\Programs\Python\Python39\python.exe" -m uvicorn app.main:app --reload --port 8000
```

Output yang diharapkan:
```
INFO:     Will watch for changes in these directories: [...]
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [...] using WatchFiles
INFO  [app.lifespan] Aplikasi IDX Stock Screener versi 0.1.0 mulai.
INFO  [app.lifespan] Pool koneksi database diinisialisasi: localhost:5432/idx_screener
INFO  [app.lifespan] Koneksi database berhasil diverifikasi.
INFO  [app.lifespan] Tabel stocks sudah berisi 55 saham aktif.
INFO  [app.lifespan] Scheduler dimulai. Interval: 15 menit.
```

Verifikasi backend berjalan — buka browser ke:
```
http://localhost:8000/api/status
```

Harus muncul JSON:
```json
{"status": "ok", "versi": "0.1.0", "pasar_buka": false, ...}
```

---

## Bagian 5 — Jalankan Frontend

Buka **Terminal 2** (PowerShell baru), masuk ke folder frontend:

```powershell
cd C:\laragon\www\Stock-Screener\frontend
```

Install dependency (hanya pertama kali):
```powershell
npm install
```

Jalankan dev server:
```powershell
npm run dev
```

Output yang diharapkan:
```
  VITE v5.4.10  ready in 479 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Buka browser ke **http://localhost:5173**

---

## Bagian 6 — Alur Normal Setelah Setup

Setiap kali ingin menjalankan aplikasi:

**Terminal 1 — Backend:**
```cmd
cd C:\laragon\www\Stock-Screener\backend
"C:\Users\jatia\AppData\Local\Programs\Python\Python39\python.exe" -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```cmd
cd C:\laragon\www\Stock-Screener\frontend
npm run dev
```

Buka **http://localhost:5173**

---

## Bagian 7 — Kapan Data Muncul di Tabel?

Data saham hanya diambil selama **jam bursa: Senin-Jumat, 09:00-16:00 WIB**.

- Di luar jam bursa: tabel kosong (normal), scheduler tidak berjalan
- Saat jam bursa: data pertama muncul dalam 15 menit setelah backend dijalankan
- Untuk test di luar jam bursa: lihat Bagian 8

---

## Bagian 8 — Test Data di Luar Jam Bursa

Untuk memaksa satu siklus fetch tanpa menunggu jam bursa, buka terminal baru:

```powershell
cd C:\laragon\www\Stock-Screener\backend
& "C:\Users\jatia\AppData\Local\Programs\Python\Python39\python.exe" scripts/force_fetch.py
```

Script ini akan menjalankan satu siklus fetch langsung tanpa cek jam bursa.

---

## Bagian 9 — Pemecahan Masalah

| Gejala | Penyebab | Solusi |
|---|---|---|
| `password authentication failed` | Password .env salah | Ikuti Bagian 1 dan 2 |
| `ModuleNotFoundError` | Dependency belum install | Jalankan `pip install -r requirements.txt` dengan Python 3.9 |
| `ECONNREFUSED` di frontend | Backend belum jalan | Jalankan backend dulu (Bagian 4) |
| Tabel kosong | Di luar jam bursa | Normal, atau ikuti Bagian 8 |
| `TypeError: unsupported operand type(s) for |` | Menjalankan dengan Python 3.10+ yang salah | Gunakan Python 3.9 eksplisit (Bagian 4) |
| Port 8000 sudah dipakai | Proses lain | Ganti port: `--port 8001` dan update `CORS_ALLOW_ORIGINS` |

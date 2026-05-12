# Dokumen Requirements

## Pendahuluan

IDX Stock Screener adalah aplikasi berbasis web yang memindai saham-saham yang tercatat di Bursa Efek Indonesia (IDX) berdasarkan indikator teknikal. Sistem menarik data harga OHLCV dari yfinance secara periodik selama jam bursa, menghitung tujuh indikator teknikal di sisi backend Python, menyimpan hasilnya di PostgreSQL menggunakan operasi upsert, dan menyajikan hasil tersebut kepada pengguna melalui API FastAPI. Frontend React menampilkan daftar saham yang dapat difilter serta diurutkan, dan menyediakan chart candlestick dengan overlay indikator. Seluruh antarmuka pengguna dan dokumentasi menggunakan Bahasa Indonesia, dan deployment dilakukan ke Hostinger melalui GUI panel saja.

## Glosarium

- **IDX_Stock_Screener**: Sistem perangkat lunak lengkap yang terdiri atas Data_Fetcher, Indicator_Calculator, Scheduler, API_Server, Database, dan Frontend.
- **Data_Fetcher**: Modul Python yang mengambil data OHLCV dari yfinance untuk daftar kode saham IDX.
- **Indicator_Calculator**: Modul Python yang menghitung indikator teknikal menggunakan pandas-ta.
- **Scheduler**: Komponen APScheduler yang berjalan di dalam proses FastAPI dan memicu pengambilan data secara periodik.
- **API_Server**: Layanan FastAPI yang mengekspos endpoint HTTP kepada Frontend.
- **Database**: PostgreSQL yang menyimpan metadata saham, data OHLCV, dan hasil kalkulasi indikator.
- **Frontend**: Aplikasi single page React.js dengan Tailwind CSS yang mengonsumsi API_Server.
- **OHLCV**: Lima nilai harga per interval waktu yaitu Open, High, Low, Close, dan Volume.
- **RSI_14**: Relative Strength Index dengan periode 14.
- **MACD**: Moving Average Convergence Divergence dengan parameter default pandas-ta (12, 26, 9).
- **MACD_Signal**: Garis sinyal dari MACD.
- **EMA_50**: Exponential Moving Average dengan periode 50.
- **EMA_200**: Exponential Moving Average dengan periode 200.
- **BB_Upper**: Batas atas Bollinger Band dengan periode 20 dan standar deviasi 2.
- **BB_Lower**: Batas bawah Bollinger Band dengan periode 20 dan standar deviasi 2.
- **Volume_Ratio**: Rasio volume bar terakhir terhadap rata-rata volume 20 bar sebelumnya.
- **Indikator_Teknikal**: Himpunan tujuh nilai yaitu RSI_14, MACD, MACD_Signal, EMA_50, EMA_200, BB_Upper, BB_Lower, dan Volume_Ratio.
- **Jam_Bursa**: Rentang waktu pukul 09:00 sampai dengan 16:00 WIB pada hari Senin sampai Jumat.
- **WIB**: Waktu Indonesia Barat, zona waktu UTC+07:00.
- **Interval_Update**: Interval 15 menit antara dua eksekusi Scheduler yang berurutan.
- **Upsert**: Operasi basis data yang menyisipkan baris baru bila kunci belum ada, atau memperbarui baris yang sudah ada bila kunci sudah ada.
- **Kode_Saham**: Identifier ticker saham IDX yang diteruskan ke yfinance dengan akhiran .JK, contohnya BBCA.JK.
- **Chart_Candlestick**: Grafik harga OHLC berbentuk lilin yang dilengkapi overlay indikator.
- **Hostinger_Panel**: Panel kontrol grafis yang disediakan Hostinger untuk mengelola file, database, dan aplikasi tanpa akses SSH atau terminal.

## Requirements

### Requirement 1: Pengambilan Data OHLCV dari yfinance

**User Story:** Sebagai pengembang sistem, saya ingin Data_Fetcher mengambil data OHLCV untuk setiap Kode_Saham IDX dari yfinance, agar data harga tersedia untuk kalkulasi indikator.

#### Acceptance Criteria

1. WHEN Scheduler memicu siklus pengambilan data, THE Data_Fetcher SHALL mengambil data OHLCV dari yfinance untuk setiap Kode_Saham yang terdaftar dalam tabel referensi saham.
2. THE Data_Fetcher SHALL menggunakan akhiran ".JK" pada setiap Kode_Saham ketika memanggil yfinance.
3. THE Data_Fetcher SHALL mengambil data dengan interval bar 15 menit dan rentang historis minimal 250 bar untuk mendukung kalkulasi EMA_200.
4. IF panggilan yfinance untuk sebuah Kode_Saham mengembalikan error atau data kosong, THEN THE Data_Fetcher SHALL mencatat log error dengan Kode_Saham, timestamp, dan pesan error, lalu melanjutkan ke Kode_Saham berikutnya tanpa menghentikan siklus.
5. IF panggilan yfinance mengalami timeout melebihi 30 detik untuk satu Kode_Saham, THEN THE Data_Fetcher SHALL membatalkan panggilan tersebut dan mencatat log timeout.
6. THE Frontend SHALL TIDAK memanggil yfinance secara langsung pada kondisi apa pun.

### Requirement 2: Penjadwalan Pengambilan Data Selama Jam Bursa

**User Story:** Sebagai pengguna aplikasi, saya ingin data diperbarui otomatis setiap 15 menit selama jam bursa, agar saya melihat nilai indikator yang relevan tanpa perlu memicu refresh manual.

#### Acceptance Criteria

1. WHILE waktu saat ini berada dalam Jam_Bursa, THE Scheduler SHALL memicu siklus pengambilan data setiap Interval_Update.
2. WHILE waktu saat ini berada di luar Jam_Bursa, THE Scheduler SHALL TIDAK memicu siklus pengambilan data.
3. THE Scheduler SHALL menggunakan zona waktu Asia/Jakarta untuk menentukan Jam_Bursa.
4. WHEN IDX_Stock_Screener dijalankan pertama kali di dalam Jam_Bursa, THE Scheduler SHALL memicu satu siklus pengambilan data awal dalam waktu paling lambat 60 detik setelah aplikasi siap.
5. IF siklus pengambilan data sebelumnya belum selesai ketika Interval_Update berikutnya tiba, THEN THE Scheduler SHALL melewati pemicuan siklus baru dan mencatat log peringatan overlap.
6. THE Scheduler SHALL mempertimbangkan hari Sabtu dan Minggu sebagai hari libur dan TIDAK memicu siklus pengambilan data pada hari tersebut.

### Requirement 3: Kalkulasi Tujuh Indikator Teknikal

**User Story:** Sebagai pengguna aplikasi, saya ingin setiap saham memiliki nilai RSI, MACD, EMA, Bollinger Band, dan Volume Ratio terkini, agar saya dapat melakukan screening berbasis analisis teknikal.

#### Acceptance Criteria

1. WHEN Data_Fetcher menyelesaikan pengambilan data OHLCV untuk satu Kode_Saham, THE Indicator_Calculator SHALL menghitung RSI_14 menggunakan pandas-ta.
2. WHEN Data_Fetcher menyelesaikan pengambilan data OHLCV untuk satu Kode_Saham, THE Indicator_Calculator SHALL menghitung MACD dan MACD_Signal menggunakan parameter default pandas-ta (fast 12, slow 26, signal 9).
3. WHEN Data_Fetcher menyelesaikan pengambilan data OHLCV untuk satu Kode_Saham, THE Indicator_Calculator SHALL menghitung EMA_50 dan EMA_200 menggunakan pandas-ta.
4. WHEN Data_Fetcher menyelesaikan pengambilan data OHLCV untuk satu Kode_Saham, THE Indicator_Calculator SHALL menghitung BB_Upper dan BB_Lower dengan periode 20 dan standar deviasi 2 menggunakan pandas-ta.
5. WHEN Data_Fetcher menyelesaikan pengambilan data OHLCV untuk satu Kode_Saham, THE Indicator_Calculator SHALL menghitung Volume_Ratio sebagai nilai volume bar terakhir dibagi rata-rata volume 20 bar sebelumnya.
6. IF jumlah bar yang tersedia kurang dari periode minimum yang dibutuhkan sebuah indikator, THEN THE Indicator_Calculator SHALL menetapkan nilai indikator tersebut sebagai null dan mencatat log peringatan yang menyebutkan Kode_Saham dan nama indikator.
7. THE Indicator_Calculator SHALL melakukan seluruh kalkulasi indikator di dalam kode Python dan TIDAK menggunakan operasi kalkulasi indikator di dalam query SQL.

### Requirement 4: Penyimpanan Hasil Kalkulasi ke PostgreSQL dengan Upsert

**User Story:** Sebagai pengembang sistem, saya ingin hasil kalkulasi indikator disimpan di PostgreSQL menggunakan upsert, agar data terakhir selalu tersedia tanpa duplikasi dan tanpa kalkulasi ulang saat ada request dari pengguna.

#### Acceptance Criteria

1. WHEN Indicator_Calculator menghasilkan Indikator_Teknikal untuk satu Kode_Saham dan satu timestamp bar, THE API_Server SHALL menyimpan baris hasil ke Database menggunakan Upsert dengan kunci unik (Kode_Saham, timestamp_bar).
2. WHEN API_Server menerima request data dari Frontend, THE API_Server SHALL membaca nilai Indikator_Teknikal dari Database dan TIDAK memicu pengambilan data yfinance maupun kalkulasi ulang indikator.
3. THE API_Server SHALL menyimpan timestamp pembaruan terakhir (last_updated_at) pada setiap baris hasil kalkulasi menggunakan zona waktu UTC di kolom Database dan menyajikannya dalam zona waktu Asia/Jakarta melalui API.
4. IF operasi Upsert gagal karena error koneksi Database, THEN THE API_Server SHALL mencoba ulang operasi maksimal 3 kali dengan jeda 2 detik antar percobaan, dan mencatat log error apabila seluruh percobaan gagal.
5. THE Database SHALL menyimpan data OHLCV historis untuk mendukung Chart_Candlestick dengan retensi minimal 90 hari kalender.

### Requirement 5: Konfigurasi Kredensial Melalui Environment Variable

**User Story:** Sebagai pengembang sistem, saya ingin seluruh kredensial Database dikelola melalui environment variable, agar kredensial tidak pernah tersimpan di dalam kode sumber.

#### Acceptance Criteria

1. THE IDX_Stock_Screener SHALL membaca host, port, nama database, username, dan password PostgreSQL dari environment variable pada saat startup.
2. IF salah satu environment variable kredensial Database tidak tersedia pada saat startup, THEN THE IDX_Stock_Screener SHALL menghentikan proses startup dan mencatat log error yang menyebutkan nama variable yang hilang.
3. THE IDX_Stock_Screener SHALL TIDAK menyimpan nilai kredensial Database dalam bentuk literal di dalam file sumber kode, file konfigurasi yang dikomit ke repositori, maupun log.
4. THE IDX_Stock_Screener SHALL menyertakan file contoh environment (.env.example) yang berisi daftar nama variable tanpa nilai kredensial nyata.

### Requirement 6: Endpoint API untuk Daftar Saham dan Indikator

**User Story:** Sebagai pengembang Frontend, saya ingin endpoint API yang menyediakan daftar saham beserta nilai indikator terakhirnya, agar tabel screener dapat dirender tanpa memanggil sumber data eksternal.

#### Acceptance Criteria

1. WHEN Frontend mengirim request GET ke endpoint daftar saham, THE API_Server SHALL mengembalikan daftar saham dengan field Kode_Saham, harga penutupan terakhir, Indikator_Teknikal terbaru, dan last_updated_at.
2. THE API_Server SHALL mendukung parameter filter untuk RSI_14, MACD, MACD_Signal, EMA_50, EMA_200, BB_Upper, BB_Lower, dan Volume_Ratio dengan operator minimum dan maksimum.
3. THE API_Server SHALL mendukung parameter sort_by dengan nilai salah satu field yang dikembalikan dan parameter sort_order dengan nilai "asc" atau "desc".
4. THE API_Server SHALL mendukung parameter page dan page_size untuk paginasi, dengan page_size default 50 dan maksimum 200.
5. IF nilai parameter filter, sort_by, sort_order, page, atau page_size tidak valid, THEN THE API_Server SHALL mengembalikan response HTTP 400 dengan pesan kesalahan berbahasa Indonesia yang menyebutkan nama parameter dan alasan penolakan.
6. THE API_Server SHALL mengembalikan response dalam format JSON dengan waktu respons maksimum 500 ms untuk ukuran halaman default pada kondisi beban normal.

### Requirement 7: Endpoint API untuk Data Chart Candlestick

**User Story:** Sebagai pengguna aplikasi, saya ingin melihat chart candlestick beserta overlay indikator untuk satu saham yang dipilih, agar saya dapat menganalisis pergerakan harga secara visual.

#### Acceptance Criteria

1. WHEN Frontend mengirim request GET ke endpoint detail saham dengan Kode_Saham tertentu, THE API_Server SHALL mengembalikan deret waktu OHLCV berserta deret nilai RSI_14, MACD, MACD_Signal, EMA_50, EMA_200, BB_Upper, dan BB_Lower yang sejajar dengan deret OHLCV.
2. THE API_Server SHALL mendukung parameter range dengan nilai "1d", "5d", "1mo", dan "3mo" untuk menentukan rentang data yang dikembalikan.
3. IF Kode_Saham yang diminta tidak terdaftar di Database, THEN THE API_Server SHALL mengembalikan response HTTP 404 dengan pesan berbahasa Indonesia.
4. THE API_Server SHALL mengembalikan timestamp dalam format ISO 8601 dengan offset zona waktu Asia/Jakarta.

### Requirement 8: Filter dan Pengurutan di Frontend

**User Story:** Sebagai pengguna aplikasi, saya ingin memfilter saham berdasarkan nilai indikator dan mengurutkan kolom pada tabel screener, agar saya dapat menemukan saham yang memenuhi kriteria saya dengan cepat.

#### Acceptance Criteria

1. THE Frontend SHALL menampilkan tabel saham dengan kolom Kode_Saham, harga terakhir, RSI_14, MACD, MACD_Signal, EMA_50, EMA_200, BB_Upper, BB_Lower, Volume_Ratio, dan waktu pembaruan terakhir.
2. WHEN pengguna memasukkan nilai minimum atau maksimum pada kontrol filter sebuah indikator, THE Frontend SHALL mengirim request ke endpoint daftar saham dengan parameter filter yang sesuai dan memperbarui tabel dengan hasil response.
3. WHEN pengguna menekan header kolom pada tabel, THE Frontend SHALL mengirim request dengan parameter sort_by dan sort_order yang sesuai serta memperbarui tabel dengan hasil response.
4. WHERE pengguna belum mengisi kriteria filter apa pun, THE Frontend SHALL menampilkan seluruh saham yang tersedia dengan pengurutan default berdasarkan Kode_Saham secara ascending.
5. IF request ke API_Server gagal atau mengembalikan status bukan 2xx, THEN THE Frontend SHALL menampilkan pesan kesalahan berbahasa Indonesia dan tidak mengosongkan tabel yang sebelumnya telah dimuat.

### Requirement 9: Tampilan Chart Candlestick dengan Overlay Indikator

**User Story:** Sebagai pengguna aplikasi, saya ingin membuka Chart_Candlestick lengkap dengan overlay indikator untuk saham tertentu, agar saya dapat melihat konteks harga dan indikator secara bersamaan.

#### Acceptance Criteria

1. WHEN pengguna memilih sebuah baris saham di tabel screener, THE Frontend SHALL membuka tampilan detail saham dan memanggil endpoint detail saham.
2. THE Frontend SHALL merender Chart_Candlestick dengan sumbu waktu dan harga berdasarkan data OHLCV yang diterima.
3. THE Frontend SHALL menggambar overlay garis EMA_50, EMA_200, BB_Upper, dan BB_Lower pada Chart_Candlestick yang sama.
4. THE Frontend SHALL menggambar indikator RSI_14, MACD, dan MACD_Signal pada panel sub-chart yang sumbu waktunya selaras dengan Chart_Candlestick.
5. WHERE pengguna memilih nilai range (1d, 5d, 1mo, 3mo), THE Frontend SHALL memanggil ulang endpoint detail saham dengan parameter range yang dipilih dan memperbarui chart.

### Requirement 10: Batasan Deployment ke Hostinger Tanpa SSH

**User Story:** Sebagai operator aplikasi, saya ingin seluruh proses deployment dapat dilakukan melalui Hostinger_Panel tanpa akses SSH atau terminal, agar deployment tetap memungkinkan pada paket hosting yang dipilih.

#### Acceptance Criteria

1. THE IDX_Stock_Screener SHALL dapat dideploy ke Hostinger dengan seluruh langkah dilakukan melalui Hostinger_Panel tanpa perintah SSH atau terminal.
2. THE IDX_Stock_Screener SHALL menyediakan dokumentasi langkah-langkah deployment yang hanya mengacu pada aksi yang tersedia di Hostinger_Panel.
3. THE IDX_Stock_Screener SHALL TIDAK bergantung pada proses build yang hanya dapat dijalankan melalui shell pada server Hostinger.
4. WHERE Hostinger_Panel menyediakan antarmuka untuk menetapkan environment variable, THE IDX_Stock_Screener SHALL menggunakan antarmuka tersebut sebagai satu-satunya mekanisme konfigurasi kredensial di lingkungan produksi.

### Requirement 11: Pemisahan Kalkulasi Indikator dari Query SQL

**User Story:** Sebagai pengembang sistem, saya ingin seluruh kalkulasi indikator dilakukan di lapisan Python, agar logika indikator mudah diuji dan portabel antar basis data.

#### Acceptance Criteria

1. THE IDX_Stock_Screener SHALL melakukan kalkulasi seluruh Indikator_Teknikal menggunakan pandas-ta di lapisan Python.
2. THE IDX_Stock_Screener SHALL TIDAK menulis logika kalkulasi indikator dalam bentuk fungsi agregat, ekspresi window, stored procedure, maupun view pada Database.
3. THE IDX_Stock_Screener SHALL membatasi penggunaan Database pada operasi baca dan tulis data OHLCV, data indikator yang sudah dikalkulasi, dan metadata saham.

### Requirement 12: Penggunaan Bahasa Indonesia di Antarmuka dan Dokumentasi

**User Story:** Sebagai pengguna berbahasa Indonesia, saya ingin seluruh teks antarmuka, pesan, dan dokumentasi dalam Bahasa Indonesia, agar aplikasi mudah digunakan oleh audiens target.

#### Acceptance Criteria

1. THE Frontend SHALL menampilkan seluruh label, tombol, placeholder, judul, dan pesan validasi dalam Bahasa Indonesia.
2. THE API_Server SHALL mengembalikan seluruh pesan kesalahan yang dihadirkan kepada pengguna dalam Bahasa Indonesia.
3. THE IDX_Stock_Screener SHALL menyediakan dokumentasi pengguna dan dokumentasi deployment dalam Bahasa Indonesia.
4. WHERE istilah teknikal tidak memiliki padanan Bahasa Indonesia yang umum digunakan di komunitas analisis teknikal, THE IDX_Stock_Screener SHALL mempertahankan istilah asli seperti RSI, MACD, EMA, dan Bollinger Band sebagai istilah teknis yang didefinisikan pada Glosarium.

### Requirement 13: Pelarangan Emoji pada Kode Python

**User Story:** Sebagai pengembang sistem, saya ingin seluruh kode Python bebas dari emoji, agar kode konsisten dan aman dari masalah encoding pada lingkungan deployment.

#### Acceptance Criteria

1. THE IDX_Stock_Screener SHALL TIDAK memuat karakter emoji dalam berkas sumber Python, termasuk literal string, komentar, dan docstring.
2. THE IDX_Stock_Screener SHALL TIDAK memuat karakter emoji dalam pesan log yang dihasilkan oleh kode Python.
3. WHERE proses verifikasi otomatis tersedia, THE IDX_Stock_Screener SHALL menyediakan skrip atau konfigurasi linter yang memvalidasi ketiadaan emoji pada berkas sumber Python.

### Requirement 14: Inisialisasi Daftar Saham IDX

**User Story:** Sebagai operator aplikasi, saya ingin daftar Kode_Saham IDX dapat diinisialisasi dan diperbarui di Database, agar Data_Fetcher mengetahui saham mana saja yang harus diproses.

#### Acceptance Criteria

1. THE IDX_Stock_Screener SHALL menyediakan tabel referensi saham pada Database yang berisi Kode_Saham, nama perusahaan, dan status aktif.
2. WHEN nilai status aktif sebuah Kode_Saham bernilai tidak aktif, THE Data_Fetcher SHALL melewati Kode_Saham tersebut pada siklus pengambilan data berikutnya.
3. THE IDX_Stock_Screener SHALL menyediakan mekanisme pengisian awal tabel referensi saham yang dapat dijalankan melalui endpoint administratif atau skrip yang dipicu dari Hostinger_Panel.
4. THE IDX_Stock_Screener SHALL memvalidasi format Kode_Saham agar terdiri atas 4 karakter alfabet kapital sebelum menyimpannya ke tabel referensi saham.

### Requirement 15: Pencatatan Log Operasional

**User Story:** Sebagai operator aplikasi, saya ingin peristiwa penting pada siklus pengambilan data dan kalkulasi indikator tercatat pada log, agar saya dapat memantau dan memecahkan masalah operasional.

#### Acceptance Criteria

1. WHEN siklus pengambilan data dimulai, THE IDX_Stock_Screener SHALL mencatat log informasi yang memuat timestamp mulai dan jumlah Kode_Saham yang akan diproses.
2. WHEN siklus pengambilan data selesai, THE IDX_Stock_Screener SHALL mencatat log informasi yang memuat durasi total, jumlah Kode_Saham sukses, dan jumlah Kode_Saham gagal.
3. IF durasi satu siklus pengambilan data melebihi Interval_Update, THEN THE IDX_Stock_Screener SHALL mencatat log peringatan yang memuat durasi aktual dan ambang batas.
4. THE IDX_Stock_Screener SHALL mencatat seluruh log ke keluaran standar (stdout) dalam format yang dapat dibaca oleh log viewer pada Hostinger_Panel.

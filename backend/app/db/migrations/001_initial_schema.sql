-- Migrasi 001: Skema awal IDX Stock Screener
-- Jalankan sekali pada database baru sebelum menjalankan aplikasi.
-- Seluruh kalkulasi indikator dilakukan di Python; tabel ini hanya menyimpan hasil.

-- Aktifkan ekstensi untuk UUID (opsional, digunakan bila perlu PK UUID di masa depan)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Tabel referensi saham
-- ============================================================
CREATE TABLE IF NOT EXISTS stocks (
    kode_saham      CHAR(4)         NOT NULL,
    nama_perusahaan VARCHAR(255)    NOT NULL DEFAULT '',
    aktif           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_stocks PRIMARY KEY (kode_saham),
    CONSTRAINT chk_stocks_kode CHECK (kode_saham ~ '^[A-Z]{4}$')
);

COMMENT ON TABLE  stocks              IS 'Daftar referensi kode saham IDX yang dipantau.';
COMMENT ON COLUMN stocks.kode_saham  IS 'Kode saham 4 karakter alfabet kapital, tanpa suffix .JK.';
COMMENT ON COLUMN stocks.aktif       IS 'FALSE berarti saham dilewati pada siklus fetcher.';

-- ============================================================
-- Tabel data OHLCV historis
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_ohlcv (
    kode_saham      CHAR(4)         NOT NULL,
    timestamp_bar   TIMESTAMPTZ     NOT NULL,
    open            NUMERIC(18, 4)  NOT NULL,
    high            NUMERIC(18, 4)  NOT NULL,
    low             NUMERIC(18, 4)  NOT NULL,
    close           NUMERIC(18, 4)  NOT NULL,
    volume          BIGINT          NOT NULL,
    CONSTRAINT pk_stock_ohlcv PRIMARY KEY (kode_saham, timestamp_bar),
    CONSTRAINT fk_stock_ohlcv_stocks FOREIGN KEY (kode_saham)
        REFERENCES stocks (kode_saham) ON DELETE CASCADE
);

COMMENT ON TABLE  stock_ohlcv               IS 'Data OHLCV per bar 15 menit untuk setiap saham.';
COMMENT ON COLUMN stock_ohlcv.timestamp_bar IS 'Waktu pembukaan bar dalam UTC.';

CREATE INDEX IF NOT EXISTS idx_stock_ohlcv_kode_ts
    ON stock_ohlcv (kode_saham, timestamp_bar DESC);

-- ============================================================
-- Tabel indikator teknikal per bar
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_indicators (
    kode_saham      CHAR(4)         NOT NULL,
    timestamp_bar   TIMESTAMPTZ     NOT NULL,
    rsi_14          NUMERIC(10, 4),
    macd            NUMERIC(18, 6),
    macd_signal     NUMERIC(18, 6),
    ema_50          NUMERIC(18, 4),
    ema_200         NUMERIC(18, 4),
    bb_upper        NUMERIC(18, 4),
    bb_lower        NUMERIC(18, 4),
    volume_ratio    NUMERIC(10, 4),
    last_updated_at TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_stock_indicators PRIMARY KEY (kode_saham, timestamp_bar),
    CONSTRAINT fk_stock_indicators_stocks FOREIGN KEY (kode_saham)
        REFERENCES stocks (kode_saham) ON DELETE CASCADE
);

COMMENT ON TABLE  stock_indicators               IS 'Hasil kalkulasi 7 indikator teknikal per bar. Dihitung di Python, bukan di SQL.';
COMMENT ON COLUMN stock_indicators.timestamp_bar IS 'Waktu pembukaan bar dalam UTC, sejajar dengan stock_ohlcv.';
COMMENT ON COLUMN stock_indicators.last_updated_at IS 'Waktu upsert terakhir dalam UTC.';

CREATE INDEX IF NOT EXISTS idx_stock_indicators_kode_ts
    ON stock_indicators (kode_saham, timestamp_bar DESC);

-- ============================================================
-- Tabel snapshot terbaru per saham (flat table untuk screener)
-- ============================================================
-- Tabel ini adalah sumber utama endpoint GET /api/stocks.
-- Setiap baris mewakili kondisi terkini satu saham.
-- Diperbarui via upsert setiap kali siklus fetcher selesai untuk satu kode.
CREATE TABLE IF NOT EXISTS stocks_latest (
    kode_saham      CHAR(4)         NOT NULL,
    nama_perusahaan VARCHAR(255)    NOT NULL DEFAULT '',
    harga_terakhir  NUMERIC(18, 4),
    timestamp_bar   TIMESTAMPTZ,
    rsi_14          NUMERIC(10, 4),
    macd            NUMERIC(18, 6),
    macd_signal     NUMERIC(18, 6),
    ema_50          NUMERIC(18, 4),
    ema_200         NUMERIC(18, 4),
    bb_upper        NUMERIC(18, 4),
    bb_lower        NUMERIC(18, 4),
    volume_ratio    NUMERIC(10, 4),
    last_updated_at TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_stocks_latest PRIMARY KEY (kode_saham),
    CONSTRAINT fk_stocks_latest_stocks FOREIGN KEY (kode_saham)
        REFERENCES stocks (kode_saham) ON DELETE CASCADE
);

COMMENT ON TABLE stocks_latest IS 'Snapshot indikator terbaru per saham. Sumber utama endpoint daftar screener.';

-- Index untuk kolom yang sering dipakai sebagai sort/filter
CREATE INDEX IF NOT EXISTS idx_stocks_latest_rsi      ON stocks_latest (rsi_14);
CREATE INDEX IF NOT EXISTS idx_stocks_latest_macd     ON stocks_latest (macd);
CREATE INDEX IF NOT EXISTS idx_stocks_latest_ema50    ON stocks_latest (ema_50);
CREATE INDEX IF NOT EXISTS idx_stocks_latest_ema200   ON stocks_latest (ema_200);
CREATE INDEX IF NOT EXISTS idx_stocks_latest_vol_ratio ON stocks_latest (volume_ratio);
CREATE INDEX IF NOT EXISTS idx_stocks_latest_updated  ON stocks_latest (last_updated_at DESC);

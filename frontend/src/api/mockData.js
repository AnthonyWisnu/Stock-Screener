/**
 * Data mock untuk development ketika backend belum tersedia.
 * Digunakan otomatis bila request ke /api gagal dan APP_MODE=mock.
 */

const KODE_SAHAM = [
  'BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII',
  'UNVR', 'GOTO', 'BRIS', 'ANTM', 'PTBA',
  'INDF', 'KLBF', 'SMGR', 'PGAS', 'ADRO',
]

function rand(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function mockSaham(kode) {
  const harga = rand(500, 15000, 0)
  return {
    kode_saham: kode,
    nama_perusahaan: `PT ${kode} Tbk`,
    harga_terakhir: harga,
    indikator: {
      rsi_14: rand(20, 80),
      macd: rand(-50, 50, 4),
      macd_signal: rand(-50, 50, 4),
      ema_50: harga * rand(0.95, 1.05),
      ema_200: harga * rand(0.90, 1.10),
      bb_upper: harga * 1.05,
      bb_lower: harga * 0.95,
      volume_ratio: rand(0.5, 3.0),
    },
    last_updated_at: new Date().toISOString(),
  }
}

export function getMockDaftarSaham({ page = 1, pageSize = 50 } = {}) {
  const items = KODE_SAHAM.map(mockSaham)
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    paginasi: {
      page,
      page_size: pageSize,
      total: KODE_SAHAM.length,
      total_pages: Math.ceil(KODE_SAHAM.length / pageSize),
    },
  }
}

export function getMockDetailSaham(kode) {
  const n = 100
  const now = Date.now()
  const ohlcv = []
  let price = rand(1000, 10000, 0)

  for (let i = n - 1; i >= 0; i--) {
    const ts = new Date(now - i * 15 * 60 * 1000).toISOString()
    const open = price
    const close = price + rand(-50, 50, 0)
    const high = Math.max(open, close) + rand(0, 30, 0)
    const low = Math.min(open, close) - rand(0, 30, 0)
    const volume = rand(100000, 5000000, 0)
    ohlcv.push({ timestamp: ts, open, high, low, close, volume })
    price = close
  }

  const closes = ohlcv.map((b) => b.close)
  const n2 = closes.length

  return {
    kode_saham: kode,
    nama_perusahaan: `PT ${kode} Tbk`,
    range: '1mo',
    ohlcv,
    indikator: {
      rsi_14: closes.map((_, i) => (i < 14 ? null : rand(20, 80))),
      macd: closes.map((_, i) => (i < 26 ? null : rand(-50, 50, 4))),
      macd_signal: closes.map((_, i) => (i < 35 ? null : rand(-50, 50, 4))),
      ema_50: closes.map((_, i) => (i < 50 ? null : closes[i] * rand(0.97, 1.03))),
      ema_200: closes.map(() => null),
      bb_upper: closes.map((c, i) => (i < 20 ? null : c * 1.05)),
      bb_lower: closes.map((c, i) => (i < 20 ? null : c * 0.95)),
    },
    last_updated_at: new Date().toISOString(),
  }
}

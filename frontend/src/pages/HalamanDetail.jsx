import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDetailSaham } from '../hooks/useDetailSaham.js'
import ChartCandlestick from '../charts/ChartCandlestick.jsx'
import PesanError from '../components/PesanError.jsx'

const PILIHAN_RANGE = [
  { value: '1d',  label: '1H' },
  { value: '5d',  label: '5H' },
  { value: '1mo', label: '1B' },
  { value: '3mo', label: '3B' },
]

function fmtNum(v, dec = 2) {
  if (v === null || v === undefined) return '—'
  return v.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function KartuIndikator({ label, nilai, format = 'des2', highlight }) {
  let tampil = '—'
  if (nilai !== null && nilai !== undefined) {
    tampil = format === 'harga'
      ? nilai.toLocaleString('id-ID', { maximumFractionDigits: 0 })
      : nilai.toFixed(format === 'des4' ? 4 : 2)
  }
  return (
    <div className="rounded-xl border border-gray-800/60 bg-[#13151f] px-4 py-3.5">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">{label}</div>
      <div className={`font-mono text-lg font-bold tabular-nums ${highlight ?? 'text-gray-100'}`}>
        {tampil}
      </div>
    </div>
  )
}

export default function HalamanDetail() {
  const { kode } = useParams()
  const navigate = useNavigate()
  const [range, setRange] = useState('1mo')
  const { data, loading, error } = useDetailSaham(kode, range)

  const ind = data?.indikator
  const last = ind
    ? {
        rsi_14:      ind.rsi_14?.at(-1) ?? null,
        macd:        ind.macd?.at(-1) ?? null,
        macd_signal: ind.macd_signal?.at(-1) ?? null,
        ema_50:      ind.ema_50?.at(-1) ?? null,
        ema_200:     ind.ema_200?.at(-1) ?? null,
        bb_upper:    ind.bb_upper?.at(-1) ?? null,
        bb_lower:    ind.bb_lower?.at(-1) ?? null,
      }
    : null

  const ohlcv = data?.ohlcv ?? []
  const hargaTerakhir = ohlcv.at(-1)?.close ?? null
  const hargaAwal = ohlcv[0]?.close ?? null
  const perubahan = hargaTerakhir != null && hargaAwal != null && hargaAwal !== 0
    ? hargaTerakhir - hargaAwal
    : null
  const perubahanPersen = perubahan != null && hargaAwal
    ? (perubahan / hargaAwal) * 100
    : null
  const naik = (perubahan ?? 0) >= 0

  // Warna RSI
  const rsiWarna = last?.rsi_14 == null
    ? 'text-gray-100'
    : last.rsi_14 >= 70 ? 'text-red-400'
    : last.rsi_14 <= 30 ? 'text-emerald-400'
    : 'text-gray-100'

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <div className="w-full px-6 py-6">

        {/* ── Top bar: back + breadcrumb ── */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-800
                       bg-[#13151f] px-4 py-2 text-sm text-gray-300
                       hover:bg-gray-800 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Kembali
          </button>

          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <button onClick={() => navigate('/')} className="hover:text-gray-400 transition-colors">
              Watchlist
            </button>
            <span>/</span>
            <span className="font-mono text-gray-400">{kode}</span>
          </nav>
        </div>

        {/* ── Header: nama + harga + range ── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-white font-mono tracking-tight">{kode}</h1>
              {perubahanPersen != null && (
                <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-semibold
                  ${naik ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {naik ? '▲' : '▼'} {Math.abs(perubahanPersen).toFixed(2)}%
                </span>
              )}
            </div>
            {data?.nama_perusahaan && (
              <p className="mt-1.5 text-base text-gray-500">{data.nama_perusahaan}</p>
            )}
            {hargaTerakhir != null && (
              <div className="mt-3 flex items-baseline gap-2.5">
                <span className="text-4xl font-bold font-mono text-white tabular-nums">
                  {hargaTerakhir.toLocaleString('id-ID')}
                </span>
                <span className="text-base text-gray-600">IDR</span>
                {perubahan != null && (
                  <span className={`text-base font-mono font-medium ${naik ? 'text-emerald-400' : 'text-red-400'}`}>
                    {naik ? '+' : ''}{perubahan.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Pilihan range */}
          <div className="flex items-center gap-1 rounded-lg border border-gray-800 bg-[#13151f] p-1">
            {PILIHAN_RANGE.map(r => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                aria-pressed={range === r.value}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors min-w-[3rem]
                  ${range === r.value
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Kartu indikator ── */}
        {last && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            <KartuIndikator label="RSI 14" nilai={last.rsi_14} highlight={rsiWarna} />
            <KartuIndikator label="MACD" nilai={last.macd} format="des4" />
            <KartuIndikator label="Signal" nilai={last.macd_signal} format="des4" />
            <KartuIndikator label="EMA 50" nilai={last.ema_50} format="harga" />
            <KartuIndikator label="EMA 200" nilai={last.ema_200} format="harga" />
            <KartuIndikator label="BB Upper" nilai={last.bb_upper} format="harga" />
            <KartuIndikator label="BB Lower" nilai={last.bb_lower} format="harga" />
          </div>
        )}

        {/* ── Error ── */}
        {error && <div className="mb-5"><PesanError pesan={error} /></div>}

        {/* ── Loading ── */}
        {loading && !data && (
          <div className="rounded-xl border border-gray-800/60 bg-[#13151f] h-[640px] flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="h-4 w-4 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Memuat chart...
            </div>
          </div>
        )}

        {/* ── Chart ── */}
        {ohlcv.length > 0 && (
          <ChartCandlestick ohlcv={ohlcv} indikator={data.indikator} />
        )}

        {/* ── Tidak ada data ── */}
        {!loading && ohlcv.length === 0 && !error && (
          <div className="rounded-xl border border-gray-800/60 bg-[#13151f] py-16 text-center text-gray-500 text-sm">
            Belum ada data OHLCV untuk saham ini.
          </div>
        )}

        {/* ── Footer ── */}
        {data?.last_updated_at && (
          <p className="text-xs text-gray-600 text-right mt-4">
            Terakhir diperbarui:{' '}
            {new Date(data.last_updated_at).toLocaleString('id-ID', {
              dateStyle: 'medium', timeStyle: 'short',
            })}
          </p>
        )}
      </div>
    </div>
  )
}

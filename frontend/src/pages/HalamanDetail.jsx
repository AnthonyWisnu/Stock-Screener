import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDetailSaham } from '../hooks/useDetailSaham.js'
import ChartCandlestick from '../charts/ChartCandlestick.jsx'
import PesanError from '../components/PesanError.jsx'

const PILIHAN_RANGE = [
  { value: '1d',  label: '1 Hari' },
  { value: '5d',  label: '5 Hari' },
  { value: '1mo', label: '1 Bulan' },
  { value: '3mo', label: '3 Bulan' },
]

function KartuIndikator({ label, nilai, satuan }) {
  const tampil = nilai !== null && nilai !== undefined
    ? typeof nilai === 'number' ? nilai.toFixed(2) : nilai
    : '-'
  return (
    <div className="card text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="font-mono text-base font-semibold text-gray-100">
        {tampil}
        {satuan && tampil !== '-' && (
          <span className="ml-1 text-xs text-gray-500">{satuan}</span>
        )}
      </div>
    </div>
  )
}

export default function HalamanDetail() {
  const { kode } = useParams()
  const [range, setRange] = useState('1mo')
  const { data, loading, error } = useDetailSaham(kode, range)

  const indikatorTerakhir = data?.indikator
    ? {
        rsi_14:       data.indikator.rsi_14?.at(-1) ?? null,
        macd:         data.indikator.macd?.at(-1) ?? null,
        macd_signal:  data.indikator.macd_signal?.at(-1) ?? null,
        ema_50:       data.indikator.ema_50?.at(-1) ?? null,
        ema_200:      data.indikator.ema_200?.at(-1) ?? null,
        bb_upper:     data.indikator.bb_upper?.at(-1) ?? null,
        bb_lower:     data.indikator.bb_lower?.at(-1) ?? null,
      }
    : null

  const hargaTerakhir = data?.ohlcv?.at(-1)?.close ?? null

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav aria-label="Navigasi balik" className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-gray-300 transition-colors">
          Screener
        </Link>
        <span>/</span>
        <span className="text-gray-300 font-medium">{kode}</span>
      </nav>

      {/* Header saham */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono">{kode}</h1>
          {data?.nama_perusahaan && (
            <p className="mt-0.5 text-sm text-gray-400">{data.nama_perusahaan}</p>
          )}
          {hargaTerakhir !== null && (
            <p className="mt-1 text-3xl font-semibold font-mono text-gray-100">
              {hargaTerakhir.toLocaleString('id-ID')}
              <span className="ml-1 text-sm text-gray-500">IDR</span>
            </p>
          )}
        </div>

        {/* Pilihan range */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900 p-1">
          {PILIHAN_RANGE.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              aria-pressed={range === r.value}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                range === r.value
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kartu ringkasan indikator */}
      {indikatorTerakhir && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <KartuIndikator label="RSI 14" nilai={indikatorTerakhir.rsi_14} />
          <KartuIndikator label="MACD" nilai={indikatorTerakhir.macd} />
          <KartuIndikator label="MACD Signal" nilai={indikatorTerakhir.macd_signal} />
          <KartuIndikator label="EMA 50" nilai={indikatorTerakhir.ema_50} />
          <KartuIndikator label="EMA 200" nilai={indikatorTerakhir.ema_200} />
          <KartuIndikator label="BB Upper" nilai={indikatorTerakhir.bb_upper} />
          <KartuIndikator label="BB Lower" nilai={indikatorTerakhir.bb_lower} />
        </div>
      )}

      {/* Pesan error */}
      {error && <PesanError pesan={error} />}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 h-[640px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="h-4 w-4 animate-spin text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Memuat chart...
          </div>
        </div>
      )}

      {/* Chart */}
      {data?.ohlcv?.length > 0 && (
        <ChartCandlestick ohlcv={data.ohlcv} indikator={data.indikator} />
      )}

      {/* Tidak ada data */}
      {!loading && data?.ohlcv?.length === 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 py-16 text-center text-gray-500">
          Belum ada data OHLCV untuk saham ini. Data akan tersedia setelah siklus pengambilan pertama.
        </div>
      )}

      {/* Waktu pembaruan */}
      {data?.last_updated_at && (
        <p className="text-xs text-gray-600 text-right">
          Terakhir diperbarui:{' '}
          {new Date(data.last_updated_at).toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      )}
    </div>
  )
}

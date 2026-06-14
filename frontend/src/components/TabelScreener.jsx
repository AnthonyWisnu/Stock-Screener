import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const KOLOM = [
  { key: 'kode_saham',     label: 'Simbol',       sortable: true,  align: 'left' },
  { key: 'nama_perusahaan',label: 'Nama',          sortable: false, align: 'left' },
  { key: 'harga_terakhir', label: 'Harga',         sortable: true,  align: 'right', format: 'harga' },
  { key: 'rsi_14',         label: 'RSI 14',        sortable: true,  align: 'right', format: 'des2' },
  { key: 'macd',           label: 'MACD',          sortable: true,  align: 'right', format: 'des4' },
  { key: 'macd_signal',    label: 'Signal',        sortable: true,  align: 'right', format: 'des4' },
  { key: 'ema_50',         label: 'EMA 50',        sortable: true,  align: 'right', format: 'harga' },
  { key: 'ema_200',        label: 'EMA 200',       sortable: true,  align: 'right', format: 'harga' },
  { key: 'bb_upper',       label: 'BB Upper',      sortable: true,  align: 'right', format: 'harga' },
  { key: 'bb_lower',       label: 'BB Lower',      sortable: true,  align: 'right', format: 'harga' },
  { key: 'volume_ratio',   label: 'Vol. Ratio',    sortable: true,  align: 'right', format: 'des2' },
  { key: 'last_updated_at',label: 'Diperbarui',    sortable: true,  align: 'right', format: 'relatif' },
]

function waktuRelatif(iso) {
  if (!iso) return '-'
  const detik = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (detik < 60) return 'baru saja'
  const m = Math.floor(detik / 60)
  if (m < 60) return `${m}m lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}j lalu`
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })
}

function fmt(value, format) {
  if (value === null || value === undefined) return <span className="text-gray-700">—</span>
  switch (format) {
    case 'harga':  return value.toLocaleString('id-ID', { maximumFractionDigits: 0 })
    case 'des2':   return value.toFixed(2)
    case 'des4':   return value.toFixed(4)
    case 'relatif': return waktuRelatif(value)
    default: return String(value)
  }
}

function RsiPill({ value }) {
  if (value == null) return <span className="text-gray-700">—</span>
  const overbought = value >= 70
  const oversold = value <= 30
  const cls = overbought
    ? 'text-red-400 bg-red-500/10 rounded px-1.5'
    : oversold
    ? 'text-emerald-400 bg-emerald-500/10 rounded px-1.5'
    : 'text-gray-300'
  return <span className={`font-mono text-xs ${cls}`}>{value.toFixed(2)}</span>
}

function SortIcon({ active, order }) {
  if (!active) return <span className="ml-1 text-gray-700 text-[10px]">⇅</span>
  return <span className="ml-1 text-emerald-400 text-[10px]">{order === 'asc' ? '↑' : '↓'}</span>
}

export default function TabelScreener({ items, loading, sortBy, sortOrder, onSort }) {
  const navigate = useNavigate()
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative overflow-x-auto rounded-xl border border-gray-800/50">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0f1117]/70 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg className="h-4 w-4 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Memuat data...
          </div>
        </div>
      )}

      <table className="w-full text-sm" aria-label="Tabel screener saham IDX">
        <thead>
          <tr className="border-b border-gray-800/70 bg-[#13151f]">
            {KOLOM.map(col => (
              <th
                key={col.key}
                scope="col"
                onClick={col.sortable ? () => onSort(col.key) : undefined}
                aria-sort={sortBy === col.key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                className={`px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap
                  ${col.align === 'right' ? 'text-right' : 'text-left'}
                  ${col.sortable ? 'cursor-pointer select-none hover:text-gray-300 transition-colors' : ''}`}
              >
                {col.label}
                {col.sortable && <SortIcon active={sortBy === col.key} order={sortOrder} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && !loading ? (
            <tr>
              <td colSpan={KOLOM.length} className="py-16 text-center text-gray-600 text-sm">
                Tidak ada data yang sesuai
              </td>
            </tr>
          ) : (
            items.map((saham, i) => (
              <tr
                key={saham.kode_saham}
                onClick={() => navigate(`/saham/${saham.kode_saham}`)}
                className={`border-b border-gray-800/30 cursor-pointer transition-colors
                  hover:bg-gray-800/30 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
              >
                {/* Simbol */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      (saham.indikator?.rsi_14 ?? 50) > 50 ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                    <span className="font-mono font-bold text-white tracking-wide">
                      {saham.kode_saham}
                    </span>
                  </div>
                </td>
                {/* Nama */}
                <td className="px-3 py-2.5 text-gray-400 text-xs max-w-[180px] truncate">
                  {saham.nama_perusahaan ?? '—'}
                </td>
                {/* Harga */}
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-gray-200">
                  {fmt(saham.harga_terakhir, 'harga')}
                </td>
                {/* RSI */}
                <td className="px-3 py-2.5 text-right">
                  <RsiPill value={saham.indikator?.rsi_14} />
                </td>
                {/* MACD */}
                <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-400">
                  {fmt(saham.indikator?.macd, 'des4')}
                </td>
                {/* Signal */}
                <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-400">
                  {fmt(saham.indikator?.macd_signal, 'des4')}
                </td>
                {/* EMA 50 */}
                <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-400">
                  {fmt(saham.indikator?.ema_50, 'harga')}
                </td>
                {/* EMA 200 */}
                <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-400">
                  {fmt(saham.indikator?.ema_200, 'harga')}
                </td>
                {/* BB Upper */}
                <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-400">
                  {fmt(saham.indikator?.bb_upper, 'harga')}
                </td>
                {/* BB Lower */}
                <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-400">
                  {fmt(saham.indikator?.bb_lower, 'harga')}
                </td>
                {/* Vol Ratio */}
                <td className="px-3 py-2.5 text-right font-mono text-xs">
                  <span className={saham.indikator?.volume_ratio > 2 ? 'text-amber-400' : 'text-gray-400'}>
                    {fmt(saham.indikator?.volume_ratio, 'des2')}
                  </span>
                </td>
                {/* Diperbarui */}
                <td className="px-3 py-2.5 text-right text-xs text-gray-600 whitespace-nowrap">
                  {waktuRelatif(saham.last_updated_at)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

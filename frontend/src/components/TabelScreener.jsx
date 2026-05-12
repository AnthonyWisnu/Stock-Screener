import React from 'react'
import { useNavigate } from 'react-router-dom'

const KOLOM = [
  { key: 'kode_saham',    label: 'Kode',          sortable: true,  align: 'left' },
  { key: 'harga_terakhir', label: 'Harga',         sortable: true,  align: 'right', format: 'harga' },
  { key: 'rsi_14',        label: 'RSI 14',         sortable: true,  align: 'right', format: 'desimal2' },
  { key: 'macd',          label: 'MACD',           sortable: true,  align: 'right', format: 'desimal4' },
  { key: 'macd_signal',   label: 'MACD Signal',    sortable: true,  align: 'right', format: 'desimal4' },
  { key: 'ema_50',        label: 'EMA 50',         sortable: true,  align: 'right', format: 'harga' },
  { key: 'ema_200',       label: 'EMA 200',        sortable: true,  align: 'right', format: 'harga' },
  { key: 'bb_upper',      label: 'BB Upper',       sortable: true,  align: 'right', format: 'harga' },
  { key: 'bb_lower',      label: 'BB Lower',       sortable: true,  align: 'right', format: 'harga' },
  { key: 'volume_ratio',  label: 'Vol. Ratio',     sortable: true,  align: 'right', format: 'desimal2' },
  { key: 'last_updated_at', label: 'Diperbarui',   sortable: true,  align: 'right', format: 'waktu' },
]

function formatNilai(value, format) {
  if (value === null || value === undefined) return <span className="text-gray-600">-</span>
  switch (format) {
    case 'harga':
      return value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    case 'desimal2':
      return value.toFixed(2)
    case 'desimal4':
      return value.toFixed(4)
    case 'waktu': {
      const d = new Date(value)
      return d.toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    }
    default:
      return String(value)
  }
}

function RsiCell({ value }) {
  if (value === null || value === undefined) return <span className="text-gray-600">-</span>
  const cls = value >= 70 ? 'text-red-400' : value <= 30 ? 'text-green-400' : 'text-gray-200'
  return <span className={cls}>{value.toFixed(2)}</span>
}

function SortIcon({ active, order }) {
  if (!active) return <span className="ml-1 text-gray-700">&#8597;</span>
  return (
    <span className="ml-1 text-brand-400">
      {order === 'asc' ? '\u2191' : '\u2193'}
    </span>
  )
}

/**
 * Tabel screener utama.
 *
 * Props:
 * - items: Array<SahamRingkas>
 * - loading: boolean
 * - sortBy: string
 * - sortOrder: 'asc' | 'desc'
 * - onSort: (kolom: string) => void
 */
export default function TabelScreener({ items, loading, sortBy, sortOrder, onSort }) {
  const navigate = useNavigate()

  return (
    <div className="relative overflow-x-auto rounded-xl border border-gray-800">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-950/60 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg className="h-4 w-4 animate-spin text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Memuat data...
          </div>
        </div>
      )}

      <table className="w-full text-sm" aria-label="Tabel screener saham IDX">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/80">
            {KOLOM.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-3 py-3 font-medium text-gray-400 whitespace-nowrap ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                } ${col.sortable ? 'cursor-pointer select-none hover:text-gray-200 transition-colors' : ''}`}
                onClick={col.sortable ? () => onSort(col.key) : undefined}
                aria-sort={
                  sortBy === col.key
                    ? sortOrder === 'asc' ? 'ascending' : 'descending'
                    : undefined
                }
              >
                {col.label}
                {col.sortable && (
                  <SortIcon active={sortBy === col.key} order={sortOrder} />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && !loading ? (
            <tr>
              <td colSpan={KOLOM.length} className="py-16 text-center text-gray-500">
                Tidak ada data saham yang sesuai dengan filter.
              </td>
            </tr>
          ) : (
            items.map((saham) => (
              <tr
                key={saham.kode_saham}
                onClick={() => navigate(`/saham/${saham.kode_saham}`)}
                className="border-b border-gray-800/50 hover:bg-gray-800/40 cursor-pointer transition-colors"
              >
                <td className="px-3 py-2.5 font-mono font-medium text-brand-400">
                  {saham.kode_saham}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-gray-200">
                  {formatNilai(saham.harga_terakhir, 'harga')}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  <RsiCell value={saham.indikator?.rsi_14} />
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-gray-300">
                  {formatNilai(saham.indikator?.macd, 'desimal4')}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-gray-300">
                  {formatNilai(saham.indikator?.macd_signal, 'desimal4')}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-gray-300">
                  {formatNilai(saham.indikator?.ema_50, 'harga')}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-gray-300">
                  {formatNilai(saham.indikator?.ema_200, 'harga')}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-gray-300">
                  {formatNilai(saham.indikator?.bb_upper, 'harga')}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-gray-300">
                  {formatNilai(saham.indikator?.bb_lower, 'harga')}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-gray-300">
                  {formatNilai(saham.indikator?.volume_ratio, 'desimal2')}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-500 text-xs">
                  {formatNilai(saham.last_updated_at, 'waktu')}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

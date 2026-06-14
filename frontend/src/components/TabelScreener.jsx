import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function waktuRelatif(iso) {
  if (!iso) return '—'
  const detik = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (detik < 60) return 'baru saja'
  const m = Math.floor(detik / 60)
  if (m < 60) return `${m}m lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}j lalu`
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })
}

function Nil({ children, className = '' }) {
  if (children === null || children === undefined)
    return <span className="text-gray-700">—</span>
  return <span className={className}>{children}</span>
}

function RsiPill({ value }) {
  if (value == null) return <span className="text-gray-700">—</span>
  const ob = value >= 70, os = value <= 30
  const cls = ob
    ? 'text-red-400 bg-red-500/10 border border-red-500/20'
    : os
    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
    : 'text-gray-300'
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 font-mono text-xs tabular-nums ${cls}`}>
      {value.toFixed(2)}
    </span>
  )
}

function SortIcon({ active, order }) {
  return (
    <span className={`ml-1 text-[10px] ${active ? 'text-emerald-400' : 'text-gray-700'}`}>
      {active ? (order === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )
}

// Definisi kolom dengan lebar tetap agar tabel konsisten
const COLS = [
  { key: 'kode_saham',      label: 'Simbol',      w: 'w-[90px]',   align: 'left',  sortable: true },
  { key: 'nama_perusahaan', label: 'Nama',         w: 'w-[160px]',  align: 'left',  sortable: false },
  { key: 'harga_terakhir',  label: 'Harga',        w: 'w-[90px]',   align: 'right', sortable: true },
  { key: 'rsi_14',          label: 'RSI 14',       w: 'w-[80px]',   align: 'right', sortable: true },
  { key: 'macd',            label: 'MACD',         w: 'w-[90px]',   align: 'right', sortable: true },
  { key: 'macd_signal',     label: 'Signal',       w: 'w-[90px]',   align: 'right', sortable: true },
  { key: 'ema_50',          label: 'EMA 50',       w: 'w-[90px]',   align: 'right', sortable: true },
  { key: 'ema_200',         label: 'EMA 200',      w: 'w-[90px]',   align: 'right', sortable: true },
  { key: 'bb_upper',        label: 'BB Upper',     w: 'w-[90px]',   align: 'right', sortable: true },
  { key: 'bb_lower',        label: 'BB Lower',     w: 'w-[90px]',   align: 'right', sortable: true },
  { key: 'volume_ratio',    label: 'Vol. Ratio',   w: 'w-[80px]',   align: 'right', sortable: true },
  { key: 'last_updated_at', label: 'Diperbarui',   w: 'w-[90px]',   align: 'right', sortable: true },
]

export default function TabelScreener({ items, loading, sortBy, sortOrder, onSort }) {
  const navigate = useNavigate()
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const fHarga = v => v != null
    ? v.toLocaleString('id-ID', { maximumFractionDigits: 0 })
    : null
  const fDes2 = v => v != null ? v.toFixed(2) : null
  const fDes4 = v => v != null ? v.toFixed(4) : null

  return (
    <div className="relative rounded-xl border border-gray-800/50 overflow-hidden">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center
                        bg-[#0f1117]/80 backdrop-blur-sm rounded-xl">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg className="h-4 w-4 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Memuat...
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          {/* Colgroup untuk lebar konsisten */}
          <colgroup>
            {COLS.map(c => <col key={c.key} className={c.w} />)}
          </colgroup>

          <thead>
            <tr className="bg-[#13151f] border-b border-gray-800">
              {COLS.map(col => (
                <th
                  key={col.key}
                  scope="col"
                  onClick={col.sortable ? () => onSort(col.key) : undefined}
                  className={`px-3 py-3 text-[11px] font-semibold text-gray-500
                    uppercase tracking-wider whitespace-nowrap
                    ${col.align === 'right' ? 'text-right' : 'text-left'}
                    ${col.sortable ? 'cursor-pointer select-none hover:text-gray-300 transition-colors' : ''}`}
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
                <td colSpan={COLS.length}
                  className="py-16 text-center text-sm text-gray-600">
                  Tidak ada data yang sesuai
                </td>
              </tr>
            ) : items.map((s, i) => {
              const ind = s.indikator ?? {}
              const tren = (ind.rsi_14 ?? 50) >= 50
              const volSpike = (ind.volume_ratio ?? 0) > 2

              return (
                <tr
                  key={s.kode_saham}
                  onClick={() => navigate(`/saham/${s.kode_saham}`)}
                  className={`border-b border-gray-800/40 cursor-pointer transition-colors
                    hover:bg-gray-800/30 group
                    ${i % 2 !== 0 ? 'bg-white/[0.012]' : ''}`}
                >
                  {/* Simbol */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full
                        ${tren ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="font-mono font-bold text-white text-xs tracking-wide">
                        {s.kode_saham}
                      </span>
                    </div>
                  </td>

                  {/* Nama */}
                  <td className="px-3 py-2.5">
                    <span className="text-gray-400 text-xs truncate block max-w-[150px]">
                      {s.nama_perusahaan ?? '—'}
                    </span>
                  </td>

                  {/* Harga */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-mono font-semibold text-sm text-gray-100 tabular-nums">
                      <Nil>{fHarga(s.harga_terakhir)}</Nil>
                    </span>
                  </td>

                  {/* RSI */}
                  <td className="px-3 py-2.5 text-right">
                    <RsiPill value={ind.rsi_14} />
                  </td>

                  {/* MACD */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-mono text-xs text-gray-400 tabular-nums">
                      <Nil>{fDes4(ind.macd)}</Nil>
                    </span>
                  </td>

                  {/* Signal */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-mono text-xs text-gray-400 tabular-nums">
                      <Nil>{fDes4(ind.macd_signal)}</Nil>
                    </span>
                  </td>

                  {/* EMA 50 */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-mono text-xs text-gray-400 tabular-nums">
                      <Nil>{fHarga(ind.ema_50)}</Nil>
                    </span>
                  </td>

                  {/* EMA 200 */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-mono text-xs text-gray-400 tabular-nums">
                      <Nil>{fHarga(ind.ema_200)}</Nil>
                    </span>
                  </td>

                  {/* BB Upper */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-mono text-xs text-gray-400 tabular-nums">
                      <Nil>{fHarga(ind.bb_upper)}</Nil>
                    </span>
                  </td>

                  {/* BB Lower */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-mono text-xs text-gray-400 tabular-nums">
                      <Nil>{fHarga(ind.bb_lower)}</Nil>
                    </span>
                  </td>

                  {/* Vol. Ratio */}
                  <td className="px-3 py-2.5 text-right">
                    <span className={`font-mono text-xs tabular-nums
                      ${volSpike ? 'text-amber-400 font-semibold' : 'text-gray-400'}`}>
                      <Nil>{fDes2(ind.volume_ratio)}</Nil>
                    </span>
                  </td>

                  {/* Diperbarui */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-[11px] text-gray-600 whitespace-nowrap">
                      {waktuRelatif(s.last_updated_at)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import React from 'react'
import { useNavigate } from 'react-router-dom'

function MoverRow({ item }) {
  const navigate = useNavigate()
  const naik = item.perubahan_persen >= 0

  return (
    <button
      onClick={() => navigate(`/saham/${item.kode_saham}`)}
      className="flex items-center justify-between w-full px-3 py-2 rounded-lg
                 hover:bg-gray-800/60 transition-colors text-left"
    >
      <span className="font-mono text-sm font-semibold text-gray-200">
        {item.kode_saham}
      </span>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-gray-300">
          {item.harga_terakhir
            ? item.harga_terakhir.toLocaleString('id-ID')
            : '-'}
        </span>
        <span
          className={`text-xs font-semibold font-mono min-w-[4.5rem] text-right
            ${naik ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {naik ? '+' : ''}
          {item.perubahan_persen != null
            ? item.perubahan_persen.toFixed(2) + '%'
            : '-'}
        </span>
      </div>
    </button>
  )
}

export default function TopMovers({ items }) {
  if (!items || items.length === 0) return null

  // Sort berdasarkan volume_ratio sebagai proxy "penggerak terbesar"
  const sorted = [...items]
    .filter(i => i.indikator?.volume_ratio != null && i.harga_terakhir != null)

  // Gainers: RSI > 50, sort by volume_ratio desc
  const gainers = sorted
    .filter(i => (i.indikator?.rsi_14 ?? 50) > 50)
    .sort((a, b) => (b.indikator?.volume_ratio ?? 0) - (a.indikator?.volume_ratio ?? 0))
    .slice(0, 5)
    .map(i => ({ ...i, perubahan_persen: ((i.indikator?.rsi_14 ?? 50) - 50) * 0.5 }))

  // Losers: RSI < 50, sort by volume_ratio desc
  const losers = sorted
    .filter(i => (i.indikator?.rsi_14 ?? 50) < 50)
    .sort((a, b) => (b.indikator?.volume_ratio ?? 0) - (a.indikator?.volume_ratio ?? 0))
    .slice(0, 5)
    .map(i => ({ ...i, perubahan_persen: ((i.indikator?.rsi_14 ?? 50) - 50) * 0.5 }))

  return (
    <div className="space-y-4">
      {/* Top Gainers */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-gray-200">Top Gainers</span>
        </div>
        <div className="space-y-0.5">
          {gainers.length > 0
            ? gainers.map(i => <MoverRow key={i.kode_saham} item={i} />)
            : <p className="text-xs text-gray-600 px-3 py-2">Belum ada data</p>}
        </div>
      </div>

      {/* Top Losers */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-gray-200">Top Losers</span>
        </div>
        <div className="space-y-0.5">
          {losers.length > 0
            ? losers.map(i => <MoverRow key={i.kode_saham} item={i} />)
            : <p className="text-xs text-gray-600 px-3 py-2">Belum ada data</p>}
        </div>
      </div>
    </div>
  )
}

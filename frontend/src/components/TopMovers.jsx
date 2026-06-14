import React from 'react'
import { useNavigate } from 'react-router-dom'

function MoverRow({ item }) {
  const navigate = useNavigate()
  const naik = (item.indikator?.rsi_14 ?? 50) >= 50

  return (
    <button
      onClick={() => navigate(`/saham/${item.kode_saham}`)}
      className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg
                 hover:bg-gray-800/60 transition-colors text-left gap-2"
    >
      <span className="font-mono text-xs font-bold text-gray-200 w-12 shrink-0">
        {item.kode_saham}
      </span>
      <span className="font-mono text-xs text-gray-400 flex-1 text-right tabular-nums">
        {item.harga_terakhir != null
          ? item.harga_terakhir.toLocaleString('id-ID', { maximumFractionDigits: 0 })
          : '—'}
      </span>
      <span className={`font-mono text-xs font-semibold tabular-nums w-14 text-right shrink-0
        ${naik ? 'text-emerald-400' : 'text-red-400'}`}>
        {item.rsiDelta != null
          ? (naik ? '+' : '') + item.rsiDelta.toFixed(2) + '%'
          : '—'}
      </span>
    </button>
  )
}

export default function TopMovers({ items }) {
  if (!items?.length) return null

  const valid = items.filter(
    i => i.indikator?.rsi_14 != null && i.harga_terakhir != null
  )

  const gainers = valid
    .filter(i => i.indikator.rsi_14 >= 50)
    .sort((a, b) => b.indikator.rsi_14 - a.indikator.rsi_14)
    .slice(0, 5)
    .map(i => ({ ...i, rsiDelta: (i.indikator.rsi_14 - 50) * 0.4 }))

  const losers = valid
    .filter(i => i.indikator.rsi_14 < 50)
    .sort((a, b) => a.indikator.rsi_14 - b.indikator.rsi_14)
    .slice(0, 5)
    .map(i => ({ ...i, rsiDelta: (i.indikator.rsi_14 - 50) * 0.4 }))

  const Section = ({ label, icon, color, data }) => (
    <div className="rounded-xl border border-gray-800/50 bg-[#13151f] p-3">
      <div className={`flex items-center gap-1.5 mb-2 text-xs font-semibold ${color}`}>
        {icon}
        {label}
      </div>
      <div className="space-y-0.5">
        {data.length > 0
          ? data.map(i => <MoverRow key={i.kode_saham} item={i} />)
          : <p className="text-[11px] text-gray-700 px-2 py-1">Belum ada data</p>
        }
      </div>
    </div>
  )

  return (
    <div className="space-y-3">
      <Section
        label="Top Gainers"
        color="text-emerald-400"
        icon={
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        }
        data={gainers}
      />
      <Section
        label="Top Losers"
        color="text-red-400"
        icon={
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        }
        data={losers}
      />
    </div>
  )
}

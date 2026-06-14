import React, { useEffect, useState } from 'react'

export default function NavBar({ pasarBuka }) {
  const [waktu, setWaktu] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setWaktu(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const tgl = waktu.toLocaleDateString('id-ID', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
  const jam = waktu.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  return (
    <header className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800/50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="text-lg font-extrabold tracking-tight text-white">
          Market<span className="text-emerald-400">Board</span>
        </span>
        {/* Live badge */}
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5
          text-[11px] font-bold tracking-widest
          ${pasarBuka
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-gray-700 bg-gray-800/50 text-gray-500'
          }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${pasarBuka ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
          {pasarBuka ? 'LIVE' : 'TUTUP'}
        </span>
      </div>

      {/* Jam real-time */}
      <div className="text-right">
        <div className="text-[11px] text-gray-600">{tgl}</div>
        <div className="font-mono text-sm font-semibold text-gray-300 tabular-nums">
          {jam}
        </div>
      </div>
    </header>
  )
}

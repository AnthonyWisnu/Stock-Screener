import React, { useEffect, useState } from 'react'
import { fetchStatus } from '../api/stocksClient.js'

export default function NavBar({ pasarBuka }) {
  const [waktu, setWaktu] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setWaktu(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const tgl = waktu.toLocaleDateString('id-ID', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
  const jam = waktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <header className="flex items-center justify-between px-6 py-4">
      {/* Logo + badge */}
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold tracking-tight text-white">
          Market<span className="text-emerald-400">Board</span>
        </span>
        <span className="live-badge">
          <span className={`h-1.5 w-1.5 rounded-full ${pasarBuka ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
          {pasarBuka ? 'LIVE' : 'TUTUP'}
        </span>
      </div>

      {/* Jam */}
      <div className="text-right">
        <div className="text-xs text-gray-500">{tgl}</div>
        <div className="font-mono text-sm font-semibold text-gray-200">{jam}</div>
      </div>
    </header>
  )
}

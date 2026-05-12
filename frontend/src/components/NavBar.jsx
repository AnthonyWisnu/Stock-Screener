import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { fetchStatus } from '../api/stocksClient.js'

export default function NavBar() {
  const { pathname } = useLocation()
  const [status, setStatus] = useState(null)

  useEffect(() => {
    fetchStatus()
      .then(setStatus)
      .catch(() => setStatus({ status: 'offline' }))

    const interval = setInterval(() => {
      fetchStatus()
        .then(setStatus)
        .catch(() => setStatus({ status: 'offline' }))
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  const online = status?.status === 'ok'
  const pasarBuka = status?.pasar_buka === true

  return (
    <header className="border-b border-gray-800 bg-gray-950 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-screen-2xl flex items-center justify-between h-14">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-white hover:text-brand-500 transition-colors"
        >
          <span className="text-brand-500 font-bold text-lg">IDX</span>
          <span className="text-gray-100">Stock Screener</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Status backend */}
          {status && (
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  online ? (pasarBuka ? 'bg-green-400 animate-pulse' : 'bg-green-600') : 'bg-red-500'
                }`}
              />
              <span className={online ? 'text-gray-400' : 'text-red-400'}>
                {online
                  ? pasarBuka
                    ? 'Pasar Buka'
                    : 'Pasar Tutup'
                  : 'Backend Offline'}
              </span>
            </div>
          )}

          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Screener
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

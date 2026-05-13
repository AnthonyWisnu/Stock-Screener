import React, { useEffect, useState } from 'react'
import { useDaftarSaham } from '../hooks/useDaftarSaham.js'
import TabelScreener from '../components/TabelScreener.jsx'
import KontrolFilter from '../components/KontrolFilter.jsx'
import Paginasi from '../components/Paginasi.jsx'
import PesanError from '../components/PesanError.jsx'
import { fetchStatus } from '../api/stocksClient.js'

export default function HalamanDaftar() {
  const {
    items,
    paginasi,
    loading,
    error,
    sortBy,
    sortOrder,
    handleSort,
    handleFilter,
    handlePage,
    refresh,
  } = useDaftarSaham()

  const [backendOnline, setBackendOnline] = useState(null)

  useEffect(() => {
    fetchStatus()
      .then((s) => setBackendOnline(s?.status === 'ok'))
      .catch(() => setBackendOnline(false))
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Screener Saham IDX</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Data diperbarui setiap 5 menit selama jam bursa (09:00 - 16:00 WIB)
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          aria-label="Perbarui data"
          className="btn-ghost shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
          Perbarui
        </button>
      </div>

      {/* Banner mode demo */}
      {backendOnline === false && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-800/50 bg-yellow-950/30 px-4 py-2.5 text-sm text-yellow-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>
            <strong>Mode Demo</strong> — Backend tidak tersedia. Data yang ditampilkan adalah data simulasi.
            Jalankan backend dengan <code className="mx-1 rounded bg-yellow-900/40 px-1 font-mono text-xs">uvicorn app.main:app --reload</code>
            untuk data real.
          </span>
        </div>
      )}

      {/* Filter */}
      <KontrolFilter onFilter={handleFilter} loading={loading} />

      {/* Pesan error dari server (bukan network error) */}
      {error && <PesanError pesan={error} />}

      {/* Tabel */}
      <TabelScreener
        items={items}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Paginasi */}
      <Paginasi paginasi={paginasi} onPage={handlePage} />

      {/* Info jumlah saham */}
      {!loading && items.length > 0 && (
        <p className="text-xs text-gray-600 text-right">
          Menampilkan {items.length} dari {paginasi.total} saham
        </p>
      )}
    </div>
  )
}

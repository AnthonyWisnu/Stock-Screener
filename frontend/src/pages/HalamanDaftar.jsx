import React, { useEffect, useState } from 'react'
import { useDaftarSaham } from '../hooks/useDaftarSaham.js'
import TabelScreener from '../components/TabelScreener.jsx'
import KontrolFilter from '../components/KontrolFilter.jsx'
import Paginasi from '../components/Paginasi.jsx'
import PesanError from '../components/PesanError.jsx'
import TopMovers from '../components/TopMovers.jsx'
import NavBar from '../components/NavBar.jsx'
import { fetchStatus } from '../api/stocksClient.js'

export default function HalamanDaftar() {
  const {
    items, paginasi, loading, error,
    sortBy, sortOrder,
    handleSort, handleFilter, handlePage, refresh,
  } = useDaftarSaham()

  const [pasarBuka, setPasarBuka] = useState(false)
  const [cari, setCari] = useState('')

  useEffect(() => {
    fetchStatus().then(s => setPasarBuka(s?.pasar_buka === true)).catch(() => {})
    const id = setInterval(() => {
      fetchStatus().then(s => setPasarBuka(s?.pasar_buka === true)).catch(() => {})
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  // Filter client-side by kode/nama
  const itemsTampil = cari.trim()
    ? items.filter(s =>
        s.kode_saham.toLowerCase().includes(cari.toLowerCase()) ||
        (s.nama_perusahaan ?? '').toLowerCase().includes(cari.toLowerCase())
      )
    : items

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      <NavBar pasarBuka={pasarBuka} />

      <div className="flex-1 flex gap-6 px-6 pb-8">
        {/* ===== Kolom kiri: Watchlist ===== */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Header */}
          <div>
            <h1 className="text-lg font-bold text-white">Watchlist</h1>
            <p className="text-xs text-gray-600 mt-0.5">
              Diperbarui setiap 5 menit selama jam bursa (09:00–16:00 WIB)
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Filter simbol..."
                value={cari}
                onChange={e => setCari(e.target.value)}
                className="input-field pl-8 text-xs py-1.5 max-w-xs"
              />
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              aria-label="Perbarui"
              className="btn-ghost text-xs py-1.5"
            >
              <svg className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Perbarui
            </button>
          </div>

          {/* Filter indikator */}
          <KontrolFilter onFilter={handleFilter} loading={loading} />

          {/* Error */}
          {error && <PesanError pesan={error} />}

          {/* Tabel */}
          <TabelScreener
            items={itemsTampil}
            loading={loading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          {/* Paginasi */}
          <Paginasi paginasi={paginasi} onPage={handlePage} />
        </div>

        {/* ===== Kolom kanan: Top Movers ===== */}
        <div className="w-64 shrink-0 pt-16">
          <TopMovers items={items} />
        </div>
      </div>
    </div>
  )
}

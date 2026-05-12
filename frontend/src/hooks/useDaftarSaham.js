/**
 * Hook untuk mengambil dan mengelola state daftar saham screener.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchDaftarSaham } from '../api/stocksClient.js'

const DEFAULT_PAGE_SIZE = 50
const REFRESH_INTERVAL_MS = 15 * 60 * 1000 // 15 menit

export function useDaftarSaham() {
  const [items, setItems] = useState([])
  const [paginasi, setPaginasi] = useState({ page: 1, page_size: DEFAULT_PAGE_SIZE, total: 0, total_pages: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [sortBy, setSortBy] = useState('kode_saham')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({})

  const timerRef = useRef(null)

  const load = useCallback(async (opts = {}) => {
    setLoading(true)
    try {
      const data = await fetchDaftarSaham({
        sortBy: opts.sortBy ?? sortBy,
        sortOrder: opts.sortOrder ?? sortOrder,
        page: opts.page ?? page,
        pageSize: DEFAULT_PAGE_SIZE,
        filters: opts.filters ?? filters,
      })
      setItems(data.items)
      setPaginasi(data.paginasi)
      setError(null)
    } catch (err) {
      // Bila network error, stocksClient sudah fallback ke mock — tidak perlu tampilkan error
      // Error hanya ditampilkan bila backend merespons dengan status error (4xx/5xx)
      if (err?.response) {
        const msg = err.response.data?.error
          ?? `Gagal memuat data (HTTP ${err.response.status}). Coba lagi.`
        setError(msg)
      }
      // Network error: diam-diam pakai mock, tidak perlu pesan error
    } finally {
      setLoading(false)
    }
  }, [sortBy, sortOrder, page, filters])

  // Load awal dan setiap kali parameter berubah
  useEffect(() => {
    load()
  }, [load])

  // Auto-refresh setiap 15 menit
  useEffect(() => {
    timerRef.current = setInterval(() => {
      load()
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(timerRef.current)
  }, [load])

  const handleSort = useCallback((kolom) => {
    const newOrder = sortBy === kolom && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortBy(kolom)
    setSortOrder(newOrder)
    setPage(1)
  }, [sortBy, sortOrder])

  const handleFilter = useCallback((newFilters) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  const handlePage = useCallback((newPage) => {
    setPage(newPage)
  }, [])

  return {
    items,
    paginasi,
    loading,
    error,
    sortBy,
    sortOrder,
    page,
    filters,
    handleSort,
    handleFilter,
    handlePage,
    refresh: load,
  }
}

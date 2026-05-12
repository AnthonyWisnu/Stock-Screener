/**
 * Hook untuk mengambil data detail saham (OHLCV + indikator).
 */

import { useState, useEffect } from 'react'
import { fetchDetailSaham } from '../api/stocksClient.js'

export function useDetailSaham(kodeSaham, range = '1mo') {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!kodeSaham) return

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchDetailSaham(kodeSaham, range)
      .then((res) => {
        if (!cancelled) {
          setData(res)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          // Hanya tampilkan error bila backend merespons dengan status error
          if (err?.response) {
            const msg = err.response.data?.error
              ?? `Gagal memuat data (HTTP ${err.response.status}). Coba lagi.`
            setError(msg)
          }
          // Network error: mock sudah digunakan, tidak perlu pesan error
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [kodeSaham, range])

  return { data, loading, error }
}

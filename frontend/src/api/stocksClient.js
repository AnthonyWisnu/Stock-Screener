/**
 * Client HTTP untuk berkomunikasi dengan FastAPI backend.
 * Seluruh request diarahkan ke /api (di-proxy oleh Vite ke localhost:8000).
 *
 * Bila backend tidak tersedia (network error), client otomatis fallback ke
 * data mock agar UI tetap bisa dilihat selama development.
 */

import axios from 'axios'
import { getMockDaftarSaham, getMockDetailSaham } from './mockData.js'

const client = axios.create({
  baseURL: '/api',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API Error]', err?.response?.status, err?.config?.url)
    return Promise.reject(err)
  }
)

function isNetworkError(err) {
  return !err.response && (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED' || err.message === 'Network Error')
}

/**
 * Ambil daftar saham dari flat table screener.
 */
export async function fetchDaftarSaham({
  sortBy = 'kode_saham',
  sortOrder = 'asc',
  page = 1,
  pageSize = 50,
  filters = {},
} = {}) {
  const params = {
    sort_by: sortBy,
    sort_order: sortOrder,
    page,
    page_size: pageSize,
    ...filters,
  }
  Object.keys(params).forEach((k) => {
    if (params[k] === undefined || params[k] === null || params[k] === '') {
      delete params[k]
    }
  })

  try {
    const res = await client.get('/stocks', { params })
    return res.data
  } catch (err) {
    if (isNetworkError(err)) {
      console.warn('[API] Backend tidak tersedia, menggunakan data mock.')
      return getMockDaftarSaham({ page, pageSize })
    }
    throw err
  }
}

/**
 * Ambil detail OHLCV + deret indikator untuk satu saham.
 */
export async function fetchDetailSaham(kodeSaham, range = '1mo') {
  try {
    const res = await client.get(`/stocks/${kodeSaham}`, { params: { range } })
    return res.data
  } catch (err) {
    if (isNetworkError(err)) {
      console.warn('[API] Backend tidak tersedia, menggunakan data mock.')
      return getMockDetailSaham(kodeSaham)
    }
    throw err
  }
}

/**
 * Ambil status aplikasi (health check).
 */
export async function fetchStatus() {
  try {
    const res = await client.get('/status')
    return res.data
  } catch (err) {
    if (isNetworkError(err)) {
      return { status: 'offline', versi: '-', pasar_buka: false }
    }
    throw err
  }
}

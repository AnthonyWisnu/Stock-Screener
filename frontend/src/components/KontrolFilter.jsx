import React, { useState } from 'react'

const INDIKATOR_FILTER = [
  { key: 'rsi_14', label: 'RSI 14', placeholder: '0 - 100' },
  { key: 'macd', label: 'MACD', placeholder: 'mis. -5 s/d 5' },
  { key: 'macd_signal', label: 'MACD Signal', placeholder: 'mis. -5 s/d 5' },
  { key: 'ema_50', label: 'EMA 50', placeholder: 'harga' },
  { key: 'ema_200', label: 'EMA 200', placeholder: 'harga' },
  { key: 'bb_upper', label: 'BB Upper', placeholder: 'harga' },
  { key: 'bb_lower', label: 'BB Lower', placeholder: 'harga' },
  { key: 'volume_ratio', label: 'Volume Ratio', placeholder: 'mis. 1.5' },
]

/**
 * Panel filter indikator teknikal.
 *
 * Props:
 * - onFilter: (filters: Object) => void
 * - loading: boolean
 */
export default function KontrolFilter({ onFilter, loading }) {
  const [values, setValues] = useState({})
  const [terbuka, setTerbuka] = useState(false)

  const handleChange = (key, type, value) => {
    setValues((prev) => ({
      ...prev,
      [`${key}_${type}`]: value === '' ? undefined : Number(value),
    }))
  }

  const handleTerapkan = () => {
    // Bersihkan key dengan nilai undefined
    const clean = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== undefined && v !== '' && !isNaN(v))
    )
    onFilter(clean)
  }

  const handleReset = () => {
    setValues({})
    onFilter({})
  }

  const jumlahAktif = Object.values(values).filter((v) => v !== undefined && v !== '').length

  return (
    <div className="card">
      <button
        onClick={() => setTerbuka((p) => !p)}
        className="flex w-full items-center justify-between text-sm font-medium text-gray-200 hover:text-white transition-colors"
        aria-expanded={terbuka}
      >
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V17a1 1 0 01-.553.894l-4 2A1 1 0 017 19v-8.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          Filter Indikator
          {jumlahAktif > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-xs text-white">
              {jumlahAktif}
            </span>
          )}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-gray-500 transition-transform ${terbuka ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {terbuka && (
        <div className="mt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {INDIKATOR_FILTER.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-400">{label}</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="any"
                    placeholder={`Min`}
                    value={values[`${key}_min`] ?? ''}
                    onChange={(e) => handleChange(key, 'min', e.target.value)}
                    aria-label={`${label} minimum`}
                    className="input-field"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder={`Maks`}
                    value={values[`${key}_max`] ?? ''}
                    onChange={(e) => handleChange(key, 'max', e.target.value)}
                    aria-label={`${label} maksimum`}
                    className="input-field"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleTerapkan}
              disabled={loading}
              className="btn-primary"
            >
              Terapkan Filter
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="btn-ghost"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

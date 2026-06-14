import React, { useState } from 'react'

const INDIKATOR_FILTER = [
  { key: 'rsi_14',       label: 'RSI 14',       placeholder: '0–100' },
  { key: 'macd',         label: 'MACD',         placeholder: 'mis. -5 / 5' },
  { key: 'macd_signal',  label: 'MACD Signal',  placeholder: 'mis. -5 / 5' },
  { key: 'ema_50',       label: 'EMA 50',       placeholder: 'harga' },
  { key: 'ema_200',      label: 'EMA 200',      placeholder: 'harga' },
  { key: 'bb_upper',     label: 'BB Upper',     placeholder: 'harga' },
  { key: 'bb_lower',     label: 'BB Lower',     placeholder: 'harga' },
  { key: 'volume_ratio', label: 'Vol. Ratio',   placeholder: 'mis. 1.5' },
]

export default function KontrolFilter({ onFilter, loading }) {
  const [terbuka, setTerbuka] = useState(false)
  const [values, setValues] = useState({})

  const handleChange = (key, type, val) => {
    setValues(p => ({ ...p, [`${key}_${type}`]: val === '' ? undefined : Number(val) }))
  }

  const jumlahAktif = Object.values(values).filter(v => v !== undefined && !isNaN(v)).length

  const handleTerapkan = () => {
    const clean = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== undefined && !isNaN(v))
    )
    onFilter(clean)
  }

  const handleReset = () => { setValues({}); onFilter({}) }

  return (
    <div className="card">
      <button
        onClick={() => setTerbuka(p => !p)}
        aria-expanded={terbuka}
        className="flex w-full items-center justify-between text-sm font-medium text-gray-300 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V17a1 1 0 01-.553.894l-4 2A1 1 0 017 19v-8.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          Filter Indikator
          {jumlahAktif > 0 && (
            <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-xs text-white">
              {jumlahAktif}
            </span>
          )}
        </span>
        <svg className={`h-4 w-4 text-gray-600 transition-transform ${terbuka ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {terbuka && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {INDIKATOR_FILTER.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</label>
                <div className="flex gap-1">
                  <input type="number" step="any" placeholder="Min"
                    value={values[`${key}_min`] ?? ''}
                    onChange={e => handleChange(key, 'min', e.target.value)}
                    aria-label={`${label} minimum`}
                    className="input-field text-xs py-1"
                  />
                  <input type="number" step="any" placeholder="Max"
                    value={values[`${key}_max`] ?? ''}
                    onChange={e => handleChange(key, 'max', e.target.value)}
                    aria-label={`${label} maksimum`}
                    className="input-field text-xs py-1"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleTerapkan} disabled={loading} className="btn-primary text-xs">
              Terapkan
            </button>
            <button onClick={handleReset} disabled={loading} className="btn-ghost text-xs">
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import React from 'react'

export default function PesanError({ pesan, onTutup }) {
  if (!pesan) return null
  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
      <svg className="h-4 w-4 mt-0.5 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span className="flex-1">{pesan}</span>
      {onTutup && (
        <button onClick={onTutup} aria-label="Tutup" className="shrink-0 text-red-400 hover:text-red-200 transition-colors">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  )
}

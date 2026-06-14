import React from 'react'

function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  if (current > 3) pages.push('...')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

export default function Paginasi({ paginasi, onPage }) {
  const { page, total_pages, total } = paginasi
  if (total_pages <= 1) return null
  const pages = buildPages(page, total_pages)

  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm text-gray-500">
      <span>
        Total <span className="font-medium text-gray-300">{total.toLocaleString('id-ID')}</span> saham
      </span>
      <nav aria-label="Navigasi halaman" className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1}
          className="btn-ghost px-2 py-1 text-xs disabled:opacity-30">‹</button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-2 text-gray-700 select-none">…</span>
          ) : (
            <button key={p} onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`min-w-[2rem] rounded px-2 py-1 text-xs text-center transition-colors
                ${p === page ? 'bg-emerald-600 text-white font-semibold' : 'text-gray-500 hover:bg-gray-800 hover:text-white'}`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPage(page + 1)} disabled={page >= total_pages}
          className="btn-ghost px-2 py-1 text-xs disabled:opacity-30">›</button>
      </nav>
    </div>
  )
}

import React from 'react'

/**
 * Komponen navigasi halaman.
 *
 * Props:
 * - paginasi: { page, page_size, total, total_pages }
 * - onPage: (nomor) => void
 */
export default function Paginasi({ paginasi, onPage }) {
  const { page, total_pages, total } = paginasi

  if (total_pages <= 1) return null

  const pages = buildPageList(page, total_pages)

  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm text-gray-400">
      <span>
        Total <span className="font-medium text-gray-200">{total.toLocaleString('id-ID')}</span> saham
      </span>
      <nav aria-label="Navigasi halaman" className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
          className="btn-ghost px-2 py-1 disabled:opacity-30"
        >
          &lsaquo;
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-600 select-none">
              &hellip;
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`min-w-[2rem] rounded px-2 py-1 text-center transition-colors ${
                p === page
                  ? 'bg-brand-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= total_pages}
          aria-label="Halaman berikutnya"
          className="btn-ghost px-2 py-1 disabled:opacity-30"
        >
          &rsaquo;
        </button>
      </nav>
    </div>
  )
}

function buildPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  pages.push(1)
  if (current > 3) pages.push('...')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

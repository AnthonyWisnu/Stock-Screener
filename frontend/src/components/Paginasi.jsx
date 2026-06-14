import React from 'react'

function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  if (current > 3) pages.push('...')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

export default function Paginasi({ paginasi, onPage }) {
  const { page, total_pages, total, page_size } = paginasi
  if (!total || total_pages <= 0) return null

  const dari = (page - 1) * page_size + 1
  const sampai = Math.min(page * page_size, total)
  const pages = buildPages(page, total_pages)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-1">
      {/* Info */}
      <p className="text-xs text-gray-600">
        Menampilkan{' '}
        <span className="text-gray-400 font-medium">{dari}–{sampai}</span>
        {' '}dari{' '}
        <span className="text-gray-400 font-medium">{total.toLocaleString('id-ID')}</span>
        {' '}saham
      </p>

      {/* Navigasi */}
      {total_pages > 1 && (
        <nav aria-label="Navigasi halaman" className="flex items-center gap-1">
          {/* Prev */}
          <button
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Halaman sebelumnya"
            className="flex items-center justify-center h-7 w-7 rounded-md text-xs
                       text-gray-500 hover:bg-gray-800 hover:text-white
                       disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            ‹
          </button>

          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`e${i}`} className="w-7 text-center text-gray-700 text-xs select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`h-7 min-w-[1.75rem] px-2 rounded-md text-xs font-medium
                  transition-colors tabular-nums
                  ${p === page
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/50'
                    : 'text-gray-500 hover:bg-gray-800 hover:text-white'
                  }`}
              >
                {p}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => onPage(page + 1)}
            disabled={page >= total_pages}
            aria-label="Halaman berikutnya"
            className="flex items-center justify-center h-7 w-7 rounded-md text-xs
                       text-gray-500 hover:bg-gray-800 hover:text-white
                       disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>
        </nav>
      )}
    </div>
  )
}

import { useState, useMemo } from 'react'

export function usePagination<T>(items: T[], perPage = 10) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(items.length / perPage)

  // Reset page if items shrink (e.g. after filter change)
  const safePage = Math.min(page, Math.max(0, totalPages - 1))
  if (safePage !== page) setPage(safePage)

  const paged = useMemo(() => {
    const start = safePage * perPage
    return items.slice(start, start + perPage)
  }, [items, safePage, perPage])

  return {
    paged,
    page: safePage,
    totalPages,
    onPrev: () => setPage((p) => Math.max(0, p - 1)),
    onNext: () => setPage((p) => Math.min(totalPages - 1, p + 1)),
    setPage,
  }
}

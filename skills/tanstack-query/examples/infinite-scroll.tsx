import { useEffect, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'

type Page = { items: { id: number; title: string }[]; nextCursor: number | null }

async function fetchPage({ pageParam }: { pageParam: number }): Promise<Page> {
  const res = await fetch(`/api/items?cursor=${pageParam}`)
  if (!res.ok) throw new Error('Failed to fetch page')
  return res.json()
}

export function InfiniteList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['items', 'infinite'],
    queryFn: fetchPage,
    initialPageParam: 0,
    getNextPageParam: lastPage => lastPage.nextCursor,
  })

  const sentinel = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage()
      }
    })
    if (sentinel.current) observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage])

  return (
    <div>
      {data?.pages.map((page, i) => (
        <section key={i}>
          {page.items.map(item => (
            <p key={item.id}>{item.title}</p>
          ))}
        </section>
      ))}
      <div ref={sentinel}>{isFetchingNextPage ? 'Loading…' : null}</div>
    </div>
  )
}

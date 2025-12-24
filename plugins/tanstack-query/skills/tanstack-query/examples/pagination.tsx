import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

type TodoPage = { todos: { id: number; title: string }[]; hasMore: boolean }

async function fetchTodos(page: number): Promise<TodoPage> {
  const res = await fetch(`/api/todos?page=${page}`)
  if (!res.ok) throw new Error('Failed to fetch todos')
  return res.json()
}

export function PaginatedTodos() {
  const [page, setPage] = useState(0)

  const { data, isFetching } = useQuery({
    queryKey: ['todos', 'page', page],
    queryFn: () => fetchTodos(page),
    placeholderData: keepPreviousData,
  })

  return (
    <div>
      <ul>
        {data?.todos.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
      <button onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0}>
        Previous
      </button>
      <button onClick={() => setPage(p => (data?.hasMore ? p + 1 : p))} disabled={!data?.hasMore}>
        Next
      </button>
      {isFetching && <span> Updating…</span>}
    </div>
  )
}

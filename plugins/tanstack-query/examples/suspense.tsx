import { Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'

type Todo = { id: number; title: string }

async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch('/api/todos')
  if (!res.ok) throw new Error('Failed to fetch todos')
  return res.json()
}

function Todos() {
  const { data } = useSuspenseQuery({
    queryKey: ['todos', 'suspense'],
    queryFn: fetchTodos,
    staleTime: 1000 * 60 * 5,
  })
  return (
    <ul>
      {data.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}

export function SuspenseExample() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Todos />
    </Suspense>
  )
}

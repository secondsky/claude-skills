import { useQuery } from '@tanstack/react-query'

type Todo = { id: number; title: string; completed: boolean }

async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch('/api/todos')
  if (!res.ok) throw new Error('Failed to fetch todos')
  return res.json()
}

export function TodoList() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    staleTime: 1000 * 60 * 5,
  })

  if (isPending) return <p>Loading…</p>
  if (isError) return <p>Error: {error.message}</p>

  return (
    <ul>
      {data?.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}

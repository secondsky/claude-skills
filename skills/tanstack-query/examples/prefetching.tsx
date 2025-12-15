import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTodos } from '../templates/use-query-basic' // or your own hook

async function fetchTodo(id: number) {
  const res = await fetch(`/api/todos/${id}`)
  if (!res.ok) throw new Error('Failed to fetch todo')
  return res.json()
}

export function TodoListWithPrefetch() {
  const queryClient = useQueryClient()
  const { data: todos } = useTodos()

  const prefetch = (id: number) => {
    queryClient.prefetchQuery({
      queryKey: ['todos', id],
      queryFn: () => fetchTodo(id),
      staleTime: 1000 * 60 * 5,
    })
  }

  return (
    <ul>
      {todos?.map(todo => (
        <li key={todo.id} onMouseEnter={() => prefetch(todo.id)}>
          <Link to={`/todos/${todo.id}`}>{todo.title}</Link>
        </li>
      ))}
    </ul>
  )
}

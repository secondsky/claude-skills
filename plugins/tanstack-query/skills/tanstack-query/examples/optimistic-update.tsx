import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type Todo = { id: number; title: string; completed: boolean }

async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch('/api/todos')
  if (!res.ok) throw new Error('Failed to fetch todos')
  return res.json()
}

async function toggleTodo(id: number, completed: boolean) {
  const res = await fetch(`/api/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  })
  if (!res.ok) throw new Error('Failed to update todo')
  return res.json() as Promise<Todo>
}

export function OptimisticTodos() {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  const mutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      toggleTodo(id, completed),
    onMutate: async variables => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previous = queryClient.getQueryData<Todo[]>(['todos'])
      queryClient.setQueryData<Todo[]>(['todos'], old =>
        (old ?? []).map(todo =>
          todo.id === variables.id ? { ...todo, completed: variables.completed } : todo
        )
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['todos'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <ul>
      {data?.map(todo => (
        <li key={todo.id}>
          <label>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={e =>
                mutation.mutate({ id: todo.id, completed: e.target.checked })
              }
            />
            {todo.title}
          </label>
        </li>
      ))}
    </ul>
  )
}

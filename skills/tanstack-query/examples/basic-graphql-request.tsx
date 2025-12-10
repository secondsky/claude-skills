import { GraphQLClient, gql } from 'graphql-request'
import { useQuery } from '@tanstack/react-query'

const client = new GraphQLClient('/api/graphql')

type Todo = { id: string; title: string; completed: boolean }

const TodosQuery = gql`
  query Todos {
    todos {
      id
      title
      completed
    }
  }
`

async function fetchTodos(): Promise<Todo[]> {
  const data = await client.request<{ todos: Todo[] }>(TodosQuery)
  return data.todos
}

export function TodoListGraphQL() {
  const { data } = useQuery({
    queryKey: ['todos', 'graphql'],
    queryFn: fetchTodos,
    select: todos => todos.filter(t => !t.completed),
  })

  return (
    <ul>
      {data?.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}

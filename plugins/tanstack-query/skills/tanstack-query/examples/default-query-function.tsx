import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { QueryFunctionContext } from '@tanstack/react-query'
import { PropsWithChildren } from 'react'

async function defaultFetcher<T>({ queryKey, signal }: QueryFunctionContext): Promise<T> {
  const [path, params] = queryKey as [string, Record<string, string>?]
  const search = params ? `?${new URLSearchParams(params).toString()}` : ''
  const res = await fetch(`/api/${path}${search}`, { signal })
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultFetcher,
      staleTime: 1000 * 60 * 5,
    },
  },
})

export function AppWithDefaultFetcher({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

// Usage:
// useQuery({ queryKey: ['todos'] }) // calls /api/todos
// useQuery({ queryKey: ['todos', { status: 'open' }] }) // /api/todos?status=open

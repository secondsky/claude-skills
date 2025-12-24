/**
 * Dashboard Page
 *
 * Example page demonstrating TanStack Query patterns:
 * - useQuery for data fetching
 * - useMutation for data updates
 * - Automatic caching and refetching
 * - Loading and error state management
 * - Query invalidation after mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
/* CLERK AUTH START
import { ProtectedRoute } from '@/components/ProtectedRoute'
CLERK AUTH END */

interface User {
  id: string
  email: string
  name: string | null
  created_at: number
  updated_at: number
}

export function Dashboard() {
  const queryClient = useQueryClient()

  // Fetch users from D1 using useQuery
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const data = await apiClient.get<{ users: User[] }>('/api/d1/users')
      return data.users
    },
  })

  // Fetch KV value using useQuery
  const {
    data: kvValue,
    isLoading: kvLoading,
    error: kvError,
  } = useQuery({
    queryKey: ['kv', 'test-key'],
    queryFn: async () => {
      try {
        const data = await apiClient.get<{ value: string }>('/api/kv/test-key')
        return data.value
      } catch (error) {
        // Return null if key doesn't exist (expected behavior)
        console.log('KV key not found or not configured')
        return null
      }
    },
    retry: false, // Don't retry if key doesn't exist
  })

  // Mutation for creating a new user
  const createUserMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post('/api/d1/users', {
        email: `user${Date.now()}@example.com`,
        name: `Sample User ${Math.floor(Math.random() * 1000)}`,
      })
    },
    onSuccess: () => {
      // Invalidate users query to refetch data
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error) => {
      alert('Failed to create user: ' + (error instanceof Error ? error.message : 'Unknown error'))
    },
  })

  // Mutation for setting KV value
  const setKvMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post('/api/kv', {
        key: 'test-key',
        value: `Sample value set at ${new Date().toISOString()}`,
        ttl: 3600, // 1 hour
      })
    },
    onSuccess: () => {
      // Invalidate KV query to refetch data
      queryClient.invalidateQueries({ queryKey: ['kv', 'test-key'] })
      alert('KV value set successfully!')
    },
    onError: (error) => {
      alert('Failed to set KV value: ' + (error instanceof Error ? error.message : 'Unknown error'))
    },
  })

  const isLoading = usersLoading || kvLoading
  const error = usersError || kvError

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error instanceof Error ? error.message : 'Failed to load data'}
          </p>
          <button
            onClick={() => refetchUsers()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const users = usersData || []

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

        {/* D1 Database Section */}
        <section className="mb-8 p-6 rounded-lg bg-gray-100 dark:bg-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">D1 Database (Users)</h2>
            <button
              onClick={() => createUserMutation.mutate()}
              disabled={createUserMutation.isPending}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createUserMutation.isPending ? 'Creating...' : 'Create Sample User'}
            </button>
          </div>

          {users.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No users found. Create one to get started!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-gray-600">
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">{user.name || '—'}</td>
                      <td className="p-2">
                        {new Date(user.created_at * 1000).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Total: {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        </section>

        {/* KV Storage Section */}
        <section className="mb-8 p-6 rounded-lg bg-gray-100 dark:bg-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">KV Storage</h2>
            <button
              onClick={() => setKvMutation.mutate()}
              disabled={setKvMutation.isPending}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {setKvMutation.isPending ? 'Setting...' : 'Set Sample Value'}
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <span className="font-semibold">Key:</span>{' '}
              <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">test-key</code>
            </div>
            <div>
              <span className="font-semibold">Value:</span>{' '}
              {kvValue ? (
                <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{kvValue}</code>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">Not set</span>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            KV values expire after their TTL. Click "Set Sample Value" to create a test entry.
          </p>
        </section>

        {/* API Endpoints Section */}
        <section className="p-6 rounded-lg bg-gray-100 dark:bg-gray-800">
          <h2 className="text-2xl font-semibold mb-4">Available API Endpoints</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EndpointCard
              method="GET"
              path="/api/status"
              description="Health check"
            />
            <EndpointCard
              method="GET"
              path="/api/d1/users"
              description="List all users"
            />
            <EndpointCard
              method="POST"
              path="/api/d1/users"
              description="Create new user"
            />
            <EndpointCard
              method="GET"
              path="/api/kv/:key"
              description="Get KV value"
            />
            <EndpointCard
              method="POST"
              path="/api/kv"
              description="Set KV value with TTL"
            />
            <EndpointCard
              method="POST"
              path="/api/ai-sdk/chat"
              description="AI chat (streaming)"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function EndpointCard({
  method,
  path,
  description,
}: {
  method: string
  path: string
  description: string
}) {
  const methodColors = {
    GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    POST: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  return (
    <div className="p-3 rounded bg-gray-50 dark:bg-gray-700">
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded ${
            methodColors[method as keyof typeof methodColors]
          }`}
        >
          {method}
        </span>
        <code className="text-sm">{path}</code>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  )
}

/* CLERK AUTH START
// Wrap with ProtectedRoute when auth is enabled
export default function DashboardWithAuth() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}
CLERK AUTH END */

// Authentication composable example
interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export const useAuth = () => {
  // Shared state across all components
  const state = useState<AuthState>('auth', () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  }))

  // Login
  const login = async (email: string, password: string) => {
    state.value.isLoading = true
    state.value.error = null

    try {
      const { data, error } = await useFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      if (error.value) {
        throw new Error(error.value.message || 'Login failed')
      }

      state.value.user = data.value?.user || null
      state.value.isAuthenticated = true

      // Navigate to dashboard
      await navigateTo('/dashboard')

    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Login failed'
      throw err

    } finally {
      state.value.isLoading = false
    }
  }

  // Logout
  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      state.value.user = null
      state.value.isAuthenticated = false
      await navigateTo('/login')
    }
  }

  // Check session (call on app mount)
  const checkSession = async () => {
    // Only run on client
    if (import.meta.server) return

    try {
      const { data } = await useFetch('/api/auth/session')

      if (data.value?.user) {
        state.value.user = data.value.user
        state.value.isAuthenticated = true
      }
    } catch (err) {
      console.error('Session check failed:', err)
    }
  }

  return {
    // State (readonly)
    user: computed(() => state.value.user),
    isAuthenticated: computed(() => state.value.isAuthenticated),
    isLoading: computed(() => state.value.isLoading),
    error: computed(() => state.value.error),

    // Methods
    login,
    logout,
    checkSession
  }
}

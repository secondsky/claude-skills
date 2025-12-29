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
  sessionError: string | null  // Track session check failures
  lastSessionCheck: number | null  // Track when last check occurred
}

export const useAuth = () => {
  // Shared state across all components
  const state = useState<AuthState>('auth', () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    sessionError: null,
    lastSessionCheck: null
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
    } catch (err) {
      // Log API failure but still proceed with local logout
      console.error('Logout API failed:', err)
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

      // Clear any previous session errors on success
      state.value.sessionError = null
      state.value.lastSessionCheck = Date.now()

    } catch (err) {
      console.error('Session check failed:', err)

      // Surface error to UI with user-friendly message
      state.value.sessionError = 'Unable to verify session. Please check your connection.'
      state.value.lastSessionCheck = Date.now()
    }
  }

  return {
    // State (readonly)
    user: computed(() => state.value.user),
    isAuthenticated: computed(() => state.value.isAuthenticated),
    isLoading: computed(() => state.value.isLoading),
    error: computed(() => state.value.error),
    sessionError: computed(() => state.value.sessionError),
    lastSessionCheck: computed(() => state.value.lastSessionCheck),

    // Methods
    login,
    logout,
    checkSession
  }
}

// Usage in components:
// const { sessionError, lastSessionCheck } = useAuth()
//
// Show banner when session checks fail:
// <div v-if="sessionError" class="error-banner">{{ sessionError }}</div>

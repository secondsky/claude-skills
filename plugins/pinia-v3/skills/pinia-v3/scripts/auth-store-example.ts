// Authentication Store Example
// Production-ready authentication pattern with Pinia

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { acceptHMRUpdate } from 'pinia'

interface User {
  id: number
  email: string
  name: string
  role: string
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData extends LoginCredentials {
  name: string
}

export const useAuthStore = defineStore('auth', () => {
  // STATE
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // GETTERS
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const userName = computed(() => user.value?.name || 'Guest')

  // ACTIONS
  async function login(credentials: LoginCredentials) {
    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Login failed')
      }

      const data = await response.json()

      // Store token and user
      token.value = data.token
      user.value = data.user

      // Persist token to localStorage
      localStorage.setItem('auth_token', data.token)

      return { success: true }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Login failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function register(data: RegisterData) {
    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Registration failed')
      }

      const result = await response.json()

      // Auto-login after registration
      token.value = result.token
      user.value = result.user
      localStorage.setItem('auth_token', result.token)

      return { success: true }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Registration failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      // Optional: Call logout endpoint
      if (token.value) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        })
      }
    } catch (e) {
      console.error('Logout API error:', e)
    } finally {
      // Clear state regardless of API response
      user.value = null
      token.value = null
      error.value = null
      localStorage.removeItem('auth_token')
    }
  }

  async function fetchCurrentUser() {
    const savedToken = localStorage.getItem('auth_token')

    if (!savedToken) {
      return { success: false }
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }

      const userData = await response.json()

      token.value = savedToken
      user.value = userData

      return { success: true }
    } catch (e) {
      // Token is invalid, clear it
      localStorage.removeItem('auth_token')
      token.value = null
      user.value = null
      error.value = e instanceof Error ? e.message : 'Authentication failed'

      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(updates: Partial<User>) {
    if (!token.value) {
      error.value = 'Not authenticated'
      return { success: false, error: error.value }
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error('Failed to update profile')

      const updatedUser = await response.json()
      user.value = updatedUser

      return { success: true }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Update failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  function $reset() {
    user.value = null
    token.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    user,
    token,
    loading,
    error,

    // Getters
    isAuthenticated,
    isAdmin,
    userName,

    // Actions
    login,
    register,
    logout,
    fetchCurrentUser,
    updateProfile,
    $reset
  }
})

// HMR Support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}

// Usage in router guards:
//
// import { useAuthStore } from '@/stores/auth'
//
// router.beforeEach((to, from) => {
//   const auth = useAuthStore() // ✅ Called inside guard
//
//   if (to.meta.requiresAuth && !auth.isAuthenticated) {
//     return { name: 'login' }
//   }
//
//   if (to.meta.requiresAdmin && !auth.isAdmin) {
//     return { name: 'unauthorized' }
//   }
// })

// Usage in main.ts for initial auth check:
//
// const app = createApp(App)
// app.use(pinia)
//
// const auth = useAuthStore()
// await auth.fetchCurrentUser()
//
// app.mount('#app')

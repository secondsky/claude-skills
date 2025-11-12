// Option Store Template
// Copy this template when creating new stores with Options API style

import { defineStore, acceptHMRUpdate } from 'pinia'

// Define TypeScript interfaces for type safety
interface User {
  id: number
  name: string
  email: string
}

interface UserState {
  users: User[]
  currentUser: User | null
  loading: boolean
  error: string | null
}

export const useUserStore = defineStore('user', {
  // State: Return an object with all state properties
  state: (): UserState => ({
    users: [],
    currentUser: null,
    loading: false,
    error: null
  }),

  // Getters: Computed properties (like computed in components)
  getters: {
    // Arrow function getter with state parameter
    userCount: (state) => state.users.length,

    // Regular function getter accessing other getters
    // IMPORTANT: Must type return value when using 'this'
    hasUsers(): boolean {
      return this.userCount > 0
    },

    // Getter that returns a function (for parameters)
    getUserById: (state) => {
      return (userId: number) => state.users.find(u => u.id === userId)
    },

    // Getter accessing another store
    // import { useSettingsStore } from './settings'
    // userWithSettings(state) {
    //   const settings = useSettingsStore()
    //   return { ...state.currentUser, theme: settings.theme }
    // }
  },

  // Actions: Methods for business logic and state mutations
  actions: {
    // Sync action
    setCurrentUser(user: User | null) {
      this.currentUser = user
    },

    // Async action with error handling
    async fetchUsers() {
      this.loading = true
      this.error = null

      try {
        const response = await fetch('/api/users')
        if (!response.ok) throw new Error('Failed to fetch users')

        this.users = await response.json()
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Unknown error'
        console.error('Error fetching users:', e)
      } finally {
        this.loading = false
      }
    },

    // Action calling another store's action
    // async fetchUserAndSettings(userId: number) {
    //   await this.fetchUsers()
    //   const settings = useSettingsStore()
    //   await settings.fetchSettings(userId)
    // }

    // Action with $patch for multiple mutations
    resetUserState() {
      this.$patch({
        users: [],
        currentUser: null,
        error: null
      })
    }

    // Or use built-in $reset() to restore initial state
    // this.$reset()
  }
})

// HMR Support (Hot Module Replacement)
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}

// API Data Store Example
// Production-ready pattern for managing API data with loading states

import { defineStore } from 'pinia'
import { acceptHMRUpdate } from 'pinia'

interface Todo {
  id: number
  title: string
  completed: boolean
  userId: number
}

interface TodosState {
  todos: Todo[]
  loading: boolean
  error: string | null
  selectedTodo: Todo | null
}

export const useTodosStore = defineStore('todos', {
  state: (): TodosState => ({
    todos: [],
    loading: false,
    error: null,
    selectedTodo: null
  }),

  getters: {
    // Total count
    todoCount: (state) => state.todos.length,

    // Filtered lists
    completedTodos: (state) => state.todos.filter(t => t.completed),
    activeTodos: (state) => state.todos.filter(t => !t.completed),

    // Counts
    completedCount(): number {
      return this.completedTodos.length
    },
    activeCount(): number {
      return this.activeTodos.length
    },

    // Get by ID
    getTodoById: (state) => {
      return (id: number) => state.todos.find(t => t.id === id)
    },

    // Get by user ID
    getTodosByUserId: (state) => {
      return (userId: number) => state.todos.filter(t => t.userId === userId)
    }
  },

  actions: {
    // FETCH ALL
    async fetchTodos() {
      this.loading = true
      this.error = null

      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/todos')

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        this.todos = await response.json()
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to fetch todos'
        console.error('Error fetching todos:', e)
      } finally {
        this.loading = false
      }
    },

    // FETCH ONE
    async fetchTodo(id: number) {
      this.loading = true
      this.error = null

      try {
        const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const todo = await response.json()

        // Update in list if exists, otherwise add
        const index = this.todos.findIndex(t => t.id === id)
        if (index !== -1) {
          this.todos[index] = todo
        } else {
          this.todos.push(todo)
        }

        this.selectedTodo = todo
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to fetch todo'
        console.error('Error fetching todo:', e)
      } finally {
        this.loading = false
      }
    },

    // CREATE
    async createTodo(todo: Omit<Todo, 'id'>) {
      this.loading = true
      this.error = null

      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(todo)
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const newTodo = await response.json()

        // Add to local state
        this.todos.push(newTodo)

        return { success: true, todo: newTodo }
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to create todo'
        console.error('Error creating todo:', e)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    // UPDATE
    async updateTodo(id: number, updates: Partial<Todo>) {
      this.loading = true
      this.error = null

      try {
        const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const updatedTodo = await response.json()

        // Update in local state
        const index = this.todos.findIndex(t => t.id === id)
        if (index !== -1) {
          this.todos[index] = { ...this.todos[index], ...updatedTodo }
        }

        if (this.selectedTodo?.id === id) {
          this.selectedTodo = { ...this.selectedTodo, ...updatedTodo }
        }

        return { success: true, todo: updatedTodo }
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to update todo'
        console.error('Error updating todo:', e)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    // DELETE
    async deleteTodo(id: number) {
      this.loading = true
      this.error = null

      try {
        const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Remove from local state
        const index = this.todos.findIndex(t => t.id === id)
        if (index !== -1) {
          this.todos.splice(index, 1)
        }

        if (this.selectedTodo?.id === id) {
          this.selectedTodo = null
        }

        return { success: true }
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to delete todo'
        console.error('Error deleting todo:', e)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    // TOGGLE COMPLETED
    async toggleCompleted(id: number) {
      const todo = this.todos.find(t => t.id === id)
      if (!todo) return

      return this.updateTodo(id, { completed: !todo.completed })
    },

    // LOCAL STATE MUTATIONS
    setSelectedTodo(todo: Todo | null) {
      this.selectedTodo = todo
    },

    clearError() {
      this.error = null
    }
  }
})

// HMR Support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTodosStore, import.meta.hot))
}

// Usage in component:
//
// <script setup>
// import { useTodosStore } from '@/stores/todos'
// import { storeToRefs } from 'pinia'
//
// const todosStore = useTodosStore()
// const { todos, loading, error, completedCount, activeCount } = storeToRefs(todosStore)
// const { fetchTodos, createTodo, toggleCompleted } = todosStore
//
// // Fetch on mount
// onMounted(() => {
//   fetchTodos()
// })
// </script>
//
// <template>
//   <div>
//     <div v-if="loading">Loading...</div>
//     <div v-else-if="error">Error: {{ error }}</div>
//     <div v-else>
//       <p>Total: {{ todos.length }} | Completed: {{ completedCount }} | Active: {{ activeCount }}</p>
//       <ul>
//         <li v-for="todo in todos" :key="todo.id">
//           <input
//             type="checkbox"
//             :checked="todo.completed"
//             @change="toggleCompleted(todo.id)"
//           />
//           {{ todo.title }}
//         </li>
//       </ul>
//     </div>
//   </div>
// </template>

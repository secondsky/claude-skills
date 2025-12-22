// Setup Store Template
// Copy this template when creating new stores with Composition API style

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { acceptHMRUpdate } from 'pinia'

// Define TypeScript interfaces
interface Product {
  id: number
  name: string
  price: number
  quantity: number
}

export const useProductStore = defineStore('product', () => {
  // STATE: Use ref() for reactive state
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // GETTERS: Use computed() for derived state
  const productCount = computed(() => products.value.length)

  const totalValue = computed(() => {
    return products.value.reduce((sum, p) => sum + (p.price * p.quantity), 0)
  })

  const hasProducts = computed(() => productCount.value > 0)

  // Getter that takes parameters (return a function)
  const getProductById = computed(() => {
    return (id: number) => products.value.find(p => p.id === id)
  })

  // ACTIONS: Use function() for business logic
  function addProduct(product: Product) {
    products.value.push(product)
  }

  function removeProduct(id: number) {
    const index = products.value.findIndex(p => p.id === id)
    if (index !== -1) {
      products.value.splice(index, 1)
    }
  }

  async function fetchProducts() {
    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/products')
      if (!response.ok) throw new Error('Failed to fetch products')

      products.value = await response.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Error fetching products:', e)
    } finally {
      loading.value = false
    }
  }

  // Action calling another store
  // async function fetchProductsWithSettings() {
  //   const settings = useSettingsStore()
  //
  //   // CRITICAL: Call useStore() BEFORE any await
  //   // This prevents SSR issues
  //   await fetchProducts()
  //
  //   if (settings.showPrices) {
  //     // Use settings after await is safe
  //   }
  // }

  // Custom $reset() implementation (setup stores don't have built-in reset)
  function $reset() {
    products.value = []
    loading.value = false
    error.value = null
  }

  // MUST return all properties you want to expose
  // Private properties (not returned) break SSR, DevTools, and plugins
  return {
    // State
    products,
    loading,
    error,

    // Getters
    productCount,
    totalValue,
    hasProducts,
    getProductById,

    // Actions
    addProduct,
    removeProduct,
    fetchProducts,
    $reset
  }
})

// HMR Support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProductStore, import.meta.hot))
}

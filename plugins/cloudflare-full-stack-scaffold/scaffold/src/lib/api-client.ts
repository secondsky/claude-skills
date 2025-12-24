/**
 * API Client for Cloudflare Workers
 *
 * Simple fetch() wrapper for making API requests to the backend.
 * Works with @cloudflare/vite-plugin - Worker runs on SAME port as frontend.
 *
 * Usage:
 *   import { apiClient } from '@/lib/api-client'
 *   const data = await apiClient.get('/api/users')
 *   const result = await apiClient.post('/api/data', { name: 'Test' })
 *
 * Auth (optional):
 *   Run `npm run enable-auth` to uncomment Clerk authentication code
 */

/* CLERK AUTH START
import { useSession } from '@clerk/clerk-react'
CLERK AUTH END */

class ApiClient {
  /**
   * Internal fetch wrapper
   */
  private async fetchWithAuth(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    /* CLERK AUTH START
    // Get the auth token from Clerk session
    const token = await this.getToken()
    CLERK AUTH END */

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    /* CLERK AUTH START
    // Attach auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    CLERK AUTH END */

    // Make the request
    // Note: No base URL needed - @cloudflare/vite-plugin serves Worker on same port
    return fetch(endpoint, {
      ...options,
      headers,
    })
  }

  /* CLERK AUTH START
  /**
   * Get the current auth token from Clerk session
   * Returns null if not authenticated
   */
  private async getToken(): Promise<string | null> {
    // This is set by the useApiClient hook below
    if (typeof window === 'undefined') return null

    // @ts-ignore - Injected by useApiClient hook
    const getSessionToken = window.__getClerkToken
    if (!getSessionToken) return null

    try {
      return await getSessionToken()
    } catch (error) {
      console.warn('Failed to get auth token:', error)
      return null
    }
  }
  CLERK AUTH END */

  /**
   * GET request
   */
  async get<T = any>(endpoint: string): Promise<T> {
    const response = await this.fetchWithAuth(endpoint, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.fetchWithAuth(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.fetchWithAuth(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    const response = await this.fetchWithAuth(endpoint, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.fetchWithAuth(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

/* CLERK AUTH START
/**
 * React Hook to setup the API client with the current Clerk session
 *
 * Call this at the root of your app (in App.tsx):
 *
 * function App() {
 *   useApiClient() // Sets up auth token access
 *   return <YourApp />
 * }
 */
export function useApiClient() {
  const { session } = useSession()

  // Inject the token getter into window so apiClient can access it
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.__getClerkToken = async () => {
      if (!session) return null
      try {
        return await session.getToken()
      } catch (error) {
        console.error('Error getting Clerk token:', error)
        return null
      }
    }
  }
}
CLERK AUTH END */

/**
 * TypeScript helper for API responses
 */
export type ApiResponse<T> = T

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

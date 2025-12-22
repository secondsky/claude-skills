/**
 * API Client with Automatic Authentication
 *
 * This wrapper around fetch() automatically attaches the Clerk auth token
 * to all API requests, preventing common 401 errors.
 *
 * Usage:
 *   import { apiClient } from '@/lib/api-client'
 *   const data = await apiClient.get('/api/users')
 *   const result = await apiClient.post('/api/data', { name: 'Test' })
 *
 * @cloudflare/vite-plugin runs the Worker on the SAME port as the frontend,
 * so use relative URLs (no base URL needed)
 */

import { useSession } from '@clerk/clerk-react'

class ApiClient {
  /**
   * Internal fetch wrapper that attaches auth token
   */
  private async fetchWithAuth(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Get the auth token from Clerk session
    // This will be null if not signed in
    const token = await this.getToken()

    // Build headers with auth token if available
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Make the request
    // Note: No base URL needed - @cloudflare/vite-plugin serves Worker on same port
    return fetch(endpoint, {
      ...options,
      headers,
    })
  }

  /**
   * Get the current auth token from Clerk session
   * Returns null if not authenticated
   */
  private async getToken(): Promise<string | null> {
    // This is set by the useApiClient hook below
    // We use a closure to access the session
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
}

// Export singleton instance
export const apiClient = new ApiClient()

/**
 * React Hook to setup the API client with the current Clerk session
 *
 * Call this at the root of your app (in App.tsx or similar):
 *
 * function App() {
 *   useApiClient() // Sets up auth token access
 *   return <YourApp />
 * }
 */
export function useApiClient() {
  const { session } = useSession()

  // Inject the token getter into window so apiClient can access it
  // This is a simple way to bridge React hooks with the class-based API client
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

/**
 * TypeScript helper for API responses
 *
 * Example:
 *   interface User { id: string; name: string }
 *   const user = await apiClient.get<User>('/api/user')
 */
export type ApiResponse<T> = T

/**
 * TypeScript helper for API errors
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

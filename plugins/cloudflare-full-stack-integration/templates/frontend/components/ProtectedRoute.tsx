/**
 * Protected Route Component
 *
 * Prevents race conditions by waiting for auth to load before rendering
 * protected content or making API calls.
 *
 * Usage:
 *   <ProtectedRoute>
 *     <Dashboard /> {/* Only renders when authenticated */}
 *   </ProtectedRoute>
 *
 * With custom loading:
 *   <ProtectedRoute loadingComponent={<Spinner />}>
 *     <Dashboard />
 *   </ProtectedRoute>
 *
 * This prevents the common error:
 *   ❌ Component renders → tries to fetch → 401 error (token not ready yet)
 *   ✅ Wait for auth → Component renders → fetch succeeds
 */

import { useSession, useUser, SignIn } from '@clerk/clerk-react'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  loadingComponent?: ReactNode
  fallback?: ReactNode
  requireEmailVerified?: boolean
}

export function ProtectedRoute({
  children,
  loadingComponent,
  fallback,
  requireEmailVerified = false,
}: ProtectedRouteProps) {
  const { isLoaded: sessionLoaded, isSignedIn } = useSession()
  const { isLoaded: userLoaded, user } = useUser()

  // Wait for both session and user to load
  const isLoaded = sessionLoaded && userLoaded

  // Show loading state while auth is initializing
  if (!isLoaded) {
    return (
      <>{loadingComponent || <DefaultLoading />}</>
    )
  }

  // Not signed in - show sign in page or custom fallback
  if (!isSignedIn) {
    return (
      <>{fallback || <SignIn routing="hash" />}</>
    )
  }

  // Optional: require email verification
  if (requireEmailVerified && user && !user.primaryEmailAddress?.verified

) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Email Verification Required</h2>
          <p className="text-gray-600">
            Please verify your email address to access this page.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Check your inbox for a verification link.
          </p>
        </div>
      </div>
    )
  }

  // Authenticated and ready - render children
  // Now it's safe to make API calls in child components
  return <>{children}</>
}

/**
 * Default loading component
 */
function DefaultLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Hook version for conditional rendering within a component
 *
 * Usage:
 *   function Dashboard() {
 *     const { isReady, isAuthenticated } = useProtectedRoute()
 *
 *     if (!isReady) return <div>Loading...</div>
 *     if (!isAuthenticated) return <div>Please sign in</div>
 *
 *     // Now safe to fetch data
 *     return <div>Protected content</div>
 *   }
 */
export function useProtectedRoute() {
  const { isLoaded: sessionLoaded, isSignedIn } = useSession()
  const { isLoaded: userLoaded } = useUser()

  const isReady = sessionLoaded && userLoaded
  const isAuthenticated = isReady && isSignedIn

  return {
    isReady,
    isAuthenticated,
    isLoading: !isReady,
  }
}

/**
 * Example: Protecting a specific component from rendering until auth is ready
 *
 * This prevents race conditions where the component mounts and tries to fetch
 * data before the auth token is available.
 */
export function ExampleProtectedDashboard() {
  const { isLoaded, isSignedIn, session } = useSession()
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    // ✅ CORRECT: Check if auth is loaded AND user is signed in
    if (!isLoaded || !isSignedIn) {
      return // Don't fetch yet
    }

    // Now safe to fetch - token is available
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
  }, [isLoaded, isSignedIn]) // Re-run when auth state changes

  // Show loading state
  if (!isLoaded) {
    return <div>Loading authentication...</div>
  }

  // Show sign in prompt
  if (!isSignedIn) {
    return <div>Please sign in to view dashboard</div>
  }

  // Show data loading state
  if (!data) {
    return <div>Loading dashboard data...</div>
  }

  // Render protected content
  return (
    <div>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

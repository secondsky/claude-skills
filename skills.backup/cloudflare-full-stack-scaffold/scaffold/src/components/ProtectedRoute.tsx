/**
 * Protected Route Component (Optional Auth)
 *
 * By default, this passes through all children without auth checks.
 * Run `npm run enable-auth` to uncomment Clerk authentication.
 *
 * Usage:
 *   <ProtectedRoute>
 *     <Dashboard /> {/* Renders immediately by default */}
 *   </ProtectedRoute>
 *
 * With auth enabled:
 *   - Waits for auth to load before rendering
 *   - Redirects to sign-in if not authenticated
 *   - Prevents race conditions with API calls
 */

/* CLERK AUTH START
import { useSession, useUser, SignIn } from '@clerk/clerk-react'
CLERK AUTH END */
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  /* CLERK AUTH START
  loadingComponent?: ReactNode
  fallback?: ReactNode
  requireEmailVerified?: boolean
  CLERK AUTH END */
}

export function ProtectedRoute({
  children,
  /* CLERK AUTH START
  loadingComponent,
  fallback,
  requireEmailVerified = false,
  CLERK AUTH END */
}: ProtectedRouteProps) {
  /* CLERK AUTH START
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
  if (requireEmailVerified && user && !user.primaryEmailAddress?.verified) {
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
  CLERK AUTH END */

  // Render children (with or without auth)
  return <>{children}</>
}

/* CLERK AUTH START
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
CLERK AUTH END */

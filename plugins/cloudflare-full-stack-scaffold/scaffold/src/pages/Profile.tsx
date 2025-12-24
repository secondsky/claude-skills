/**
 * Profile Page
 *
 * Complete example demonstrating:
 * - React Hook Form + Zod validation
 * - TanStack Query for data fetching
 * - Mutations for form submission
 * - Loading and error states
 * - Full-stack validation (shared schema)
 *
 * This page shows the recommended pattern for all forms.
 */

import { useQuery } from '@tanstack/react-query'
import { UserProfileForm } from '@/components/UserProfileForm'
import { apiClient } from '@/lib/api-client'
import { type UserProfileUpdate } from '@/shared/schemas'
import { Link } from 'react-router'

interface UserProfile extends UserProfileUpdate {
  id: string
  created_at?: number
  updated_at?: number
}

export function Profile() {
  // Fetch current user profile
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      // In production, this would fetch the actual user profile from the backend
      // For this example, we'll return mock data
      // return await apiClient.get<UserProfile>('/api/profile/me')

      // Mock data for demonstration
      return {
        id: 'user-123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        bio: 'Software developer passionate about building great user experiences.',
        age: 28,
        role: 'user' as const,
        notifications: true,
        created_at: Math.floor(Date.now() / 1000) - 86400 * 30, // 30 days ago
        updated_at: Math.floor(Date.now() / 1000) - 86400 * 7, // 7 days ago
      }
    },
  })

  const handleSuccess = () => {
    console.log('Profile updated successfully!')
    // Optionally refetch profile data
    refetch()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'Failed to load profile'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Edit Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update your profile information using React Hook Form + Zod validation
          </p>
        </div>

        {/* Profile Info Card */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Profile</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</dt>
              <dd className="mt-1 text-sm">{profile?.id}</dd>
            </div>
            {profile?.created_at && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Member since
                </dt>
                <dd className="mt-1 text-sm">
                  {new Date(profile.created_at * 1000).toLocaleDateString()}
                </dd>
              </div>
            )}
            {profile?.updated_at && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Last updated
                </dt>
                <dd className="mt-1 text-sm">
                  {new Date(profile.updated_at * 1000).toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Form Card */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Edit Information</h2>

          {/* Information Callout */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
              🎯 Full-Stack Validation Example
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>✓ Frontend validation with Zod (instant feedback)</li>
              <li>✓ Backend validation with same schema (security)</li>
              <li>✓ TypeScript types inferred from schema</li>
              <li>✓ TanStack Query automatic cache updates</li>
            </ul>
          </div>

          <UserProfileForm
            userId={profile?.id}
            initialData={profile}
            onSuccess={handleSuccess}
          />
        </div>

        {/* Developer Notes */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold mb-2">💡 Developer Notes</h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>
              • Schema: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">shared/schemas/userSchema.ts</code>
            </li>
            <li>
              • Form Component: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">components/UserProfileForm.tsx</code>
            </li>
            <li>
              • Backend Route: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">backend/routes/forms.ts</code>
            </li>
            <li>
              • Query Key: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">['user-profile']</code>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

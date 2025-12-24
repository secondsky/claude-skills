/**
 * User Profile Form Component
 *
 * Example component demonstrating:
 * - React Hook Form with Zod validation
 * - TanStack Query mutation
 * - Shared schema validation (frontend + backend)
 * - Error handling and loading states
 * - Type-safe form with TypeScript
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userProfileUpdateSchema, type UserProfileUpdate } from '@/shared/schemas'
import { apiClient } from '@/lib/api-client'

interface UserProfileFormProps {
  userId?: string
  initialData?: UserProfileUpdate
  onSuccess?: () => void
}

export function UserProfileForm({ userId, initialData, onSuccess }: UserProfileFormProps) {
  const queryClient = useQueryClient()

  // Set up React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UserProfileUpdate>({
    resolver: zodResolver(userProfileUpdateSchema),
    defaultValues: initialData || {},
  })

  // Set up TanStack Query mutation
  const mutation = useMutation({
    mutationFn: async (data: UserProfileUpdate) => {
      const response = await apiClient.put(`/api/forms/profile/${userId || 'me'}`, data)
      return response
    },
    onSuccess: () => {
      // Invalidate and refetch user profile query
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] })
      onSuccess?.()
    },
  })

  // Form submission handler
  const onSubmit = async (data: UserProfileUpdate) => {
    try {
      await mutation.mutateAsync(data)
      // Optionally reset form on success
      // reset()
    } catch (error) {
      // Error handling is done by mutation
      console.error('Form submission error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Success Message */}
      {mutation.isSuccess && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            Profile updated successfully!
          </p>
        </div>
      )}

      {/* Error Message */}
      {mutation.isError && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'An error occurred. Please try again.'}
          </p>
        </div>
      )}

      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Name
        </label>
        <input
          {...register('name')}
          type="text"
          id="name"
          className="w-full px-3 py-2 border rounded-md bg-background"
          placeholder="Enter your name"
        />
        {errors.name && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className="w-full px-3 py-2 border rounded-md bg-background"
          placeholder="your.email@example.com"
        />
        {errors.email && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Bio Field */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-2">
          Bio
        </label>
        <textarea
          {...register('bio')}
          id="bio"
          rows={4}
          className="w-full px-3 py-2 border rounded-md bg-background"
          placeholder="Tell us about yourself..."
        />
        {errors.bio && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.bio.message}</p>
        )}
      </div>

      {/* Age Field */}
      <div>
        <label htmlFor="age" className="block text-sm font-medium mb-2">
          Age
        </label>
        <input
          {...register('age', { valueAsNumber: true })}
          type="number"
          id="age"
          className="w-full px-3 py-2 border rounded-md bg-background"
          placeholder="25"
          min="13"
          max="120"
        />
        {errors.age && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.age.message}</p>
        )}
      </div>

      {/* Role Field */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-2">
          Role
        </label>
        <select
          {...register('role')}
          id="role"
          className="w-full px-3 py-2 border rounded-md bg-background"
        >
          <option value="">Select a role...</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
        </select>
        {errors.role && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.role.message}</p>
        )}
      </div>

      {/* Notifications Toggle */}
      <div className="flex items-center gap-2">
        <input
          {...register('notifications')}
          type="checkbox"
          id="notifications"
          className="w-4 h-4 rounded"
        />
        <label htmlFor="notifications" className="text-sm font-medium">
          Enable email notifications
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 border rounded-md hover:bg-accent"
        >
          Reset
        </button>
      </div>
    </form>
  )
}

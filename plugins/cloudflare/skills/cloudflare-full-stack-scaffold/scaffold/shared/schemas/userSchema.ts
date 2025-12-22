/**
 * User Profile Schema
 *
 * Shared Zod schema used for both frontend and backend validation.
 * This ensures a single source of truth for validation rules.
 *
 * Zod v4 Features Demonstrated:
 * - Basic types (z.string(), z.number())
 * - String constraints (.min(), .max())
 * - Optional fields (.optional())
 * - Enums for predefined values
 * - Custom refinements for complex validation
 */

import { z } from 'zod'

/**
 * User Profile Update Schema
 *
 * Used for updating user profile information.
 * All fields are optional since users can update individually.
 */
export const userProfileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .optional(),

  email: z
    .string()
    .email('Invalid email address')
    .optional(),

  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),

  age: z
    .number()
    .int('Age must be a whole number')
    .positive('Age must be positive')
    .min(13, 'Must be at least 13 years old')
    .max(120, 'Age must be realistic')
    .optional(),

  role: z
    .enum(['user', 'admin', 'moderator'], {
      errorMap: () => ({ message: 'Invalid role selected' }),
    })
    .optional(),

  notifications: z.boolean().optional(),
})

/**
 * User Profile Create Schema
 *
 * Used for creating new user profiles.
 * Name and email are required.
 */
export const userProfileCreateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),

  email: z
    .string()
    .email('Invalid email address'),

  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),

  age: z
    .number()
    .int('Age must be a whole number')
    .positive('Age must be positive')
    .min(13, 'Must be at least 13 years old')
    .max(120, 'Age must be realistic')
    .optional(),

  role: z
    .enum(['user', 'admin', 'moderator'])
    .default('user'),

  notifications: z.boolean().default(true),
})

/**
 * Contact Form Schema
 *
 * Simple contact form validation example.
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters'),

  email: z
    .string()
    .email('Invalid email address'),

  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must be less than 100 characters'),

  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters'),
})

// Export TypeScript types inferred from schemas
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>
export type UserProfileCreate = z.infer<typeof userProfileCreateSchema>
export type ContactForm = z.infer<typeof contactFormSchema>

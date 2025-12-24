/**
 * Shared Schemas Export
 *
 * Central export point for all Zod schemas.
 * Import from here in both frontend and backend:
 *
 * Frontend: import { userProfileUpdateSchema } from '@/shared/schemas'
 * Backend: import { userProfileUpdateSchema } from '../../shared/schemas'
 */

export {
  userProfileUpdateSchema,
  userProfileCreateSchema,
  contactFormSchema,
  type UserProfileUpdate,
  type UserProfileCreate,
  type ContactForm,
} from './userSchema'

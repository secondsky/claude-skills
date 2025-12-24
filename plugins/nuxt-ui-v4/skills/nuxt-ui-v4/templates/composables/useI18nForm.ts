import { z } from 'zod'
import type { ZodSchema } from 'zod'

/**
 * Composable for creating localized form schemas and validation messages.
 *
 * Features:
 * - Reactive schema that updates when locale changes
 * - Common validation patterns with i18n support
 * - Type-safe field definitions
 * - Automatic error message localization
 *
 * @example
 * ```typescript
 * const { createSchema, validators } = useI18nForm()
 *
 * const schema = createSchema({
 *   email: validators.email(),
 *   password: validators.password({ minLength: 8 }),
 *   age: validators.number({ min: 18, max: 120 })
 * })
 * ```
 */
export const useI18nForm = () => {
  const { t } = useI18n()

  /**
   * Common validation patterns with localized messages
   */
  const validators = {
    /**
     * Email field validation
     */
    email: (customMessage?: string) => {
      return z.string()
        .min(1, t('validation.required'))
        .email(customMessage || t('validation.email.invalid'))
    },

    /**
     * Password field validation
     */
    password: (options: {
      minLength?: number
      requireUppercase?: boolean
      requireNumber?: boolean
      requireSpecialChar?: boolean
      customMessage?: string
    } = {}) => {
      const {
        minLength = 8,
        requireUppercase = true,
        requireNumber = true,
        requireSpecialChar = false
      } = options

      let schema = z.string()
        .min(1, t('validation.required'))
        .min(minLength, t('validation.password.minLength', { min: minLength }))

      if (requireUppercase) {
        schema = schema.regex(
          /[A-Z]/,
          t('validation.password.uppercase')
        )
      }

      if (requireNumber) {
        schema = schema.regex(
          /[0-9]/,
          t('validation.password.number')
        )
      }

      if (requireSpecialChar) {
        schema = schema.regex(
          /[!@#$%^&*(),.?":{}|<>]/,
          t('validation.password.specialChar')
        )
      }

      return schema
    },

    /**
     * Required string field
     */
    required: (customMessage?: string) => {
      return z.string()
        .min(1, customMessage || t('validation.required'))
    },

    /**
     * Optional string field
     */
    optional: () => {
      return z.string().optional()
    },

    /**
     * Number field validation
     */
    number: (options: {
      min?: number
      max?: number
      integer?: boolean
      customMessage?: string
    } = {}) => {
      const { min, max, integer = false } = options

      let schema = z.number({
        required_error: t('validation.required'),
        invalid_type_error: t('validation.number.invalid')
      })

      if (integer) {
        schema = schema.int(t('validation.number.integer'))
      }

      if (min !== undefined) {
        schema = schema.min(min, t('validation.number.min', { min }))
      }

      if (max !== undefined) {
        schema = schema.max(max, t('validation.number.max', { max }))
      }

      return schema
    },

    /**
     * String length validation
     */
    string: (options: {
      minLength?: number
      maxLength?: number
      customMessage?: string
    } = {}) => {
      const { minLength, maxLength } = options

      let schema = z.string()
        .min(1, t('validation.required'))

      if (minLength) {
        schema = schema.min(
          minLength,
          t('validation.string.minLength', { min: minLength })
        )
      }

      if (maxLength) {
        schema = schema.max(
          maxLength,
          t('validation.string.maxLength', { max: maxLength })
        )
      }

      return schema
    },

    /**
     * URL validation
     */
    url: (customMessage?: string) => {
      return z.string()
        .min(1, t('validation.required'))
        .url(customMessage || t('validation.url.invalid'))
    },

    /**
     * Phone number validation (basic)
     */
    phone: (customMessage?: string) => {
      return z.string()
        .min(1, t('validation.required'))
        .regex(
          /^[\d\s()+-]+$/,
          customMessage || t('validation.phone.invalid')
        )
    },

    /**
     * Date validation
     */
    date: (options: {
      min?: Date
      max?: Date
      customMessage?: string
    } = {}) => {
      const { min, max } = options

      let schema = z.date({
        required_error: t('validation.required'),
        invalid_type_error: t('validation.date.invalid')
      })

      if (min) {
        schema = schema.min(min, t('validation.date.min'))
      }

      if (max) {
        schema = schema.max(max, t('validation.date.max'))
      }

      return schema
    },

    /**
     * Boolean/checkbox validation
     */
    checkbox: (options: {
      mustBeTrue?: boolean
      customMessage?: string
    } = {}) => {
      const { mustBeTrue = false, customMessage } = options

      let schema = z.boolean({
        required_error: t('validation.required')
      })

      if (mustBeTrue) {
        schema = schema.refine(
          (val) => val === true,
          customMessage || t('validation.checkbox.mustBeTrue')
        )
      }

      return schema
    },

    /**
     * Select/dropdown validation
     */
    select: <T extends readonly [string, ...string[]]>(
      options: T,
      customMessage?: string
    ) => {
      return z.enum(options, {
        required_error: t('validation.required'),
        invalid_type_error: customMessage || t('validation.select.invalid')
      })
    },

    /**
     * File upload validation
     */
    file: (options: {
      maxSize?: number  // in MB
      acceptedTypes?: string[]
      required?: boolean
    } = {}) => {
      const {
        maxSize = 5,
        acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
        required = true
      } = options

      return z.custom<File>((file) => {
        if (!file && !required) return true
        if (!file && required) {
          throw new Error(t('validation.file.required'))
        }

        const f = file as File

        // Check file size
        const fileSizeInMB = f.size / (1024 * 1024)
        if (fileSizeInMB > maxSize) {
          throw new Error(t('validation.file.maxSize', { max: maxSize }))
        }

        // Check file type
        if (!acceptedTypes.includes(f.type)) {
          throw new Error(
            t('validation.file.type', { types: acceptedTypes.join(', ') })
          )
        }

        return true
      })
    }
  }

  /**
   * Create a reactive schema that updates when locale changes
   */
  const createSchema = <T extends Record<string, ZodSchema>>(
    fields: T
  ) => {
    return computed(() => z.object(fields))
  }

  /**
   * Format validation errors for display
   */
  const formatErrors = (errors: Record<string, string[]>) => {
    return Object.entries(errors).reduce((acc, [field, messages]) => {
      acc[field] = messages[0]  // Get first error only
      return acc
    }, {} as Record<string, string>)
  }

  /**
   * Get translated field label
   */
  const getFieldLabel = (fieldName: string, prefix = 'fields') => {
    return t(`${prefix}.${fieldName}`)
  }

  /**
   * Common form state
   */
  const createFormState = <T extends Record<string, any>>(initialValues: T) => {
    const values = ref<T>(initialValues)
    const errors = ref<Record<keyof T, string>>({} as Record<keyof T, string>)
    const isSubmitting = ref(false)
    const isDirty = ref(false)

    // Mark form as dirty when values change
    watch(
      values,
      () => {
        isDirty.value = true
      },
      { deep: true }
    )

    const reset = () => {
      values.value = { ...initialValues }
      errors.value = {} as Record<keyof T, string>
      isDirty.value = false
      isSubmitting.value = false
    }

    return {
      values,
      errors,
      isSubmitting,
      isDirty,
      reset
    }
  }

  return {
    validators,
    createSchema,
    formatErrors,
    getFieldLabel,
    createFormState,
    t  // Expose t function for custom messages
  }
}

/**
 * Example translations structure for locales/*.json:
 *
 * {
 *   "validation": {
 *     "required": "This field is required",
 *     "email": {
 *       "invalid": "Please enter a valid email address"
 *     },
 *     "password": {
 *       "minLength": "Password must be at least {min} characters",
 *       "uppercase": "Password must contain an uppercase letter",
 *       "number": "Password must contain a number",
 *       "specialChar": "Password must contain a special character"
 *     },
 *     "number": {
 *       "invalid": "Please enter a valid number",
 *       "integer": "Must be a whole number",
 *       "min": "Must be at least {min}",
 *       "max": "Must be no more than {max}"
 *     },
 *     "string": {
 *       "minLength": "Must be at least {min} characters",
 *       "maxLength": "Must be no more than {max} characters"
 *     },
 *     "url": {
 *       "invalid": "Please enter a valid URL"
 *     },
 *     "phone": {
 *       "invalid": "Please enter a valid phone number"
 *     },
 *     "date": {
 *       "invalid": "Please enter a valid date",
 *       "min": "Date must be after minimum date",
 *       "max": "Date must be before maximum date"
 *     },
 *     "checkbox": {
 *       "mustBeTrue": "You must accept this"
 *     },
 *     "select": {
 *       "invalid": "Please select a valid option"
 *     },
 *     "file": {
 *       "required": "Please upload a file",
 *       "maxSize": "File must be smaller than {max}MB",
 *       "type": "Accepted file types: {types}"
 *     }
 *   },
 *   "fields": {
 *     "email": "Email",
 *     "password": "Password",
 *     "confirmPassword": "Confirm Password",
 *     "firstName": "First Name",
 *     "lastName": "Last Name"
 *   }
 * }
 */

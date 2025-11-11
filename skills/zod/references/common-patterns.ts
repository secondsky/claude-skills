/**
 * Common Zod Patterns - Production-Ready Examples
 *
 * This file contains frequently used Zod validation patterns
 * for real-world applications.
 *
 * @requires zod ^4.1.12 (Zod 4.x)
 * @note Uses Zod 4 APIs: z.codec, z.iso.datetime, z.flattenError, z.prettifyError
 */

import { z } from "zod";

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

export const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  API_KEY: z.string().min(32),
  JWT_SECRET: z.string().min(64),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof EnvSchema>;

// Usage: Validate on app startup
// const env = EnvSchema.parse(process.env);

// ============================================================================
// API REQUEST/RESPONSE VALIDATION
// ============================================================================

// Create User Request
export const CreateUserRequest = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  age: z.number().int().min(13).max(120).optional(),
});

export type CreateUserRequest = z.infer<typeof CreateUserRequest>;

// Update User Request (partial)
export const UpdateUserRequest = CreateUserRequest.partial().extend({
  id: z.string().uuid(),
});

export type UpdateUserRequest = z.infer<typeof UpdateUserRequest>;

// User Response
export const UserResponse = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  age: z.number().int().positive().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserResponse = z.infer<typeof UserResponse>;

// Paginated Response
export const PaginatedResponse = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    hasMore: z.boolean(),
  });

// Usage: const PaginatedUsers = PaginatedResponse(UserResponse);

// ============================================================================
// FORM VALIDATION
// ============================================================================

export const LoginFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().default(false),
});

export type LoginFormData = z.infer<typeof LoginFormSchema>;

export const SignupFormSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms and conditions" }),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export type SignupFormData = z.infer<typeof SignupFormSchema>;

// ============================================================================
// DISCRIMINATED UNIONS
// ============================================================================

export const ApiResponse = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    data: z.any(),
  }),
  z.object({
    status: z.literal("error"),
    message: z.string(),
    code: z.string().optional(),
  }),
]);

export type ApiResponse = z.infer<typeof ApiResponse>;

export const NotificationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("email"),
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
  }),
  z.object({
    type: z.literal("sms"),
    to: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    message: z.string().max(160),
  }),
  z.object({
    type: z.literal("push"),
    deviceToken: z.string(),
    title: z.string(),
    body: z.string(),
  }),
]);

export type Notification = z.infer<typeof NotificationSchema>;

// ============================================================================
// REFINEMENTS & TRANSFORMATIONS
// ============================================================================

// Strong password validation
export const StrongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine((val) => /[A-Z]/.test(val), "Must contain at least one uppercase letter")
  .refine((val) => /[a-z]/.test(val), "Must contain at least one lowercase letter")
  .refine((val) => /[0-9]/.test(val), "Must contain at least one number")
  .refine(
    (val) => /[^A-Za-z0-9]/.test(val),
    "Must contain at least one special character"
  );

// URL slug validation and transformation
export const SlugSchema = z
  .string()
  .min(1)
  .max(100)
  .transform((val) => val.toLowerCase().replace(/\s+/g, "-"))
  .refine(
    (val) => /^[a-z0-9-]+$/.test(val),
    "Slug can only contain lowercase letters, numbers, and hyphens"
  );

// Async username validation (checks database)
export const UsernameSchema = z.string().min(3).max(20).refine(
  async (username) => {
    // Simulated database check
    // const exists = await db.user.findUnique({ where: { username } });
    // return !exists;
    return true; // Replace with actual check
  },
  { message: "Username is already taken" }
);

// ============================================================================
// CODECS (BIDIRECTIONAL TRANSFORMATIONS)
// ============================================================================

// Date codec: ISO string <-> Date object
export const DateCodec = z.codec(
  z.iso.datetime(), // Input: ISO string
  z.date(),         // Output: Date object
  {
    decode: (str) => new Date(str),
    encode: (date) => date.toISOString(),
  }
);

// JSON codec: string <-> object
export const JSONCodec = <T extends z.ZodTypeAny>(schema: T) =>
  z.codec(
    z.string(),
    schema,
    {
      decode: (str) => JSON.parse(str),
      encode: (obj) => JSON.stringify(obj),
    }
  );

// Usage: const UserJSONCodec = JSONCodec(UserResponse);

// ============================================================================
// COMPOSABLE SCHEMAS
// ============================================================================

// Base timestamp fields
export const TimestampSchema = z.object({
  createdAt: DateCodec,
  updatedAt: DateCodec,
});

// Base author fields
export const AuthorSchema = z.object({
  authorId: z.string().uuid(),
  authorName: z.string(),
});

// Combine into larger schemas
export const PostSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1).max(200),
    content: z.string(),
    slug: SlugSchema,
    published: z.boolean().default(false),
    tags: z.array(z.string()).max(10),
  })
  .merge(TimestampSchema)
  .merge(AuthorSchema);

export type Post = z.infer<typeof PostSchema>;

// ============================================================================
// RECURSIVE TYPES
// ============================================================================

interface Category {
  id: string;
  name: string;
  subcategories: Category[];
}

export const CategorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    subcategories: z.array(CategorySchema),
  })
);

// ============================================================================
// FILE UPLOAD VALIDATION
// ============================================================================

export const ImageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "File must be less than 5MB")
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "Only JPEG, PNG, and WebP images are allowed"
    ),
  alt: z.string().max(200).optional(),
});

export type ImageUpload = z.infer<typeof ImageUploadSchema>;

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const SearchQuerySchema = PaginationQuerySchema.extend({
  q: z.string().min(1).max(200),
  filters: z
    .string()
    .optional()
    .transform((val) => (val ? JSON.parse(val) : {})),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

// ============================================================================
// WEBHOOK VALIDATION
// ============================================================================

export const WebhookPayloadSchema = z.object({
  id: z.string().uuid(),
  event: z.enum([
    "user.created",
    "user.updated",
    "user.deleted",
    "order.created",
    "order.fulfilled",
  ]),
  timestamp: DateCodec,
  data: z.record(z.any()),
  signature: z.string(),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

// ============================================================================
// CONFIGURATION SCHEMAS
// ============================================================================

export const AppConfigSchema = z.object({
  app: z.object({
    name: z.string(),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    environment: z.enum(["development", "staging", "production"]),
  }),
  database: z.object({
    host: z.string(),
    port: z.coerce.number().int().positive(),
    name: z.string(),
    ssl: z.boolean().default(true),
  }),
  cache: z.object({
    enabled: z.boolean().default(true),
    ttl: z.number().int().positive().default(3600),
  }),
  features: z.record(z.boolean()).default({}),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export function formatZodError(error: z.ZodError): Record<string, string[]> {
  const flattened = z.flattenError(error);
  return flattened.fieldErrors as Record<string, string[]>;
}

export function getFirstError(error: z.ZodError): string {
  return error.issues[0]?.message || "Validation failed";
}

export function prettyPrintErrors(error: z.ZodError): string {
  return z.prettifyError(error);
}

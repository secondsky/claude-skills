/**
 * Form Validation Routes
 *
 * Demonstrates full-stack form validation pattern:
 * 1. Frontend validates with Zod (instant feedback)
 * 2. Backend validates with SAME Zod schema (security)
 * 3. Single source of truth for validation rules
 *
 * This is the recommended pattern for all forms.
 */

import { Hono } from 'hono'
import { ZodError } from 'zod'
import {
  userProfileUpdateSchema,
  userProfileCreateSchema,
  contactFormSchema,
} from '../../shared/schemas'

type Bindings = {
  DB: D1Database
  // Add other bindings as needed
}

const forms = new Hono<{ Bindings: Bindings }>()

/**
 * Update User Profile
 *
 * PUT /api/forms/profile/:userId
 *
 * Validates profile updates using userProfileUpdateSchema.
 * In production, this would update the database.
 */
forms.put('/profile/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const body = await c.req.json()

    // Validate request body using shared Zod schema
    const validatedData = userProfileUpdateSchema.parse(body)

    // TODO: In production, update database here
    // const db = c.env.DB
    // await db.prepare('UPDATE users SET name = ?, email = ?, bio = ?, age = ?, role = ?, notifications = ? WHERE id = ?')
    //   .bind(
    //     validatedData.name,
    //     validatedData.email,
    //     validatedData.bio,
    //     validatedData.age,
    //     validatedData.role,
    //     validatedData.notifications,
    //     userId
    //   )
    //   .run()

    return c.json({
      success: true,
      message: 'Profile updated successfully',
      data: validatedData,
      userId,
    })
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return c.json(
        {
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        400
      )
    }

    // Handle other errors
    console.error('Profile update error:', error)
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      500
    )
  }
})

/**
 * Create User Profile
 *
 * POST /api/forms/profile
 *
 * Validates new profile creation using userProfileCreateSchema.
 * Required fields: name, email
 */
forms.post('/profile', async (c) => {
  try {
    const body = await c.req.json()

    // Validate request body using shared Zod schema
    const validatedData = userProfileCreateSchema.parse(body)

    // TODO: In production, insert into database here
    // const db = c.env.DB
    // const userId = crypto.randomUUID()
    // await db.prepare('INSERT INTO users (id, name, email, bio, age, role, notifications, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    //   .bind(
    //     userId,
    //     validatedData.name,
    //     validatedData.email,
    //     validatedData.bio,
    //     validatedData.age,
    //     validatedData.role,
    //     validatedData.notifications,
    //     Math.floor(Date.now() / 1000)
    //   )
    //   .run()

    const userId = crypto.randomUUID()

    return c.json(
      {
        success: true,
        message: 'Profile created successfully',
        data: {
          userId,
          ...validatedData,
        },
      },
      201
    )
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return c.json(
        {
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        400
      )
    }

    // Handle other errors
    console.error('Profile creation error:', error)
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      500
    )
  }
})

/**
 * Submit Contact Form
 *
 * POST /api/forms/contact
 *
 * Validates contact form submission using contactFormSchema.
 * In production, this would send an email or save to database.
 */
forms.post('/contact', async (c) => {
  try {
    const body = await c.req.json()

    // Validate request body using shared Zod schema
    const validatedData = contactFormSchema.parse(body)

    // TODO: In production, send email or save to database
    // await sendEmail({
    //   to: 'support@example.com',
    //   subject: validatedData.subject,
    //   from: validatedData.email,
    //   text: `From: ${validatedData.name} (${validatedData.email})\n\n${validatedData.message}`,
    // })

    return c.json({
      success: true,
      message: 'Contact form submitted successfully',
      data: {
        name: validatedData.name,
        subject: validatedData.subject,
        // Don't return email/message for privacy
      },
    })
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return c.json(
        {
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        400
      )
    }

    // Handle other errors
    console.error('Contact form error:', error)
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      500
    )
  }
})

/**
 * Validation Test Endpoint
 *
 * POST /api/forms/validate
 *
 * Test endpoint to verify validation is working correctly.
 * Pass any of the schema types in the body with a 'type' field.
 */
forms.post('/validate', async (c) => {
  try {
    const body = await c.req.json<{ type: string; data: unknown }>()

    let validatedData
    let schemaUsed

    switch (body.type) {
      case 'profile-update':
        validatedData = userProfileUpdateSchema.parse(body.data)
        schemaUsed = 'userProfileUpdateSchema'
        break
      case 'profile-create':
        validatedData = userProfileCreateSchema.parse(body.data)
        schemaUsed = 'userProfileCreateSchema'
        break
      case 'contact':
        validatedData = contactFormSchema.parse(body.data)
        schemaUsed = 'contactFormSchema'
        break
      default:
        return c.json(
          {
            success: false,
            message: 'Invalid type. Use: profile-update, profile-create, or contact',
          },
          400
        )
    }

    return c.json({
      success: true,
      message: `Validation passed for ${schemaUsed}`,
      validatedData,
    })
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return c.json(
        {
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        },
        400
      )
    }

    // Handle other errors
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default forms

# AuthForm Component

A customizable Form to create login, register or password reset forms. Built on top of the Form component with field generation and provider support.

---

## Props

```ts
interface AuthFormProps {
  as?: any                                  // Element or component to render as
  icon?: any                                // Icon above the title
  title?: string                            // Form title
  description?: string                      // Form description
  fields?: AuthFormField[]                  // Auto-generated form fields
  providers?: ButtonProps[]                 // OAuth provider buttons
  separator?: string | SeparatorProps       // Separator between providers and fields (default: "or")
  submit?: Omit<ButtonProps, LinkPropsKeys> // Submit button config (default: { label: 'Continue', block: true })
  schema?: T                                // Zod/Standard Schema for validation
  validate?: Function                       // Custom validation function
  validateOn?: FormInputEvents[]            // When to validate
  disabled?: boolean                        // Disable entire form
  loading?: boolean                         // Show loading state
  loadingAuto?: boolean                     // Auto-detect loading from submit
  ui?: {                                    // Theme customization
    root?, header?, leading?, leadingIcon?, title?, description?,
    body?, providers?, checkbox?, select?, password?, otp?,
    input?, separator?, form?, footer?
  }
  // ...plus all native <form> HTML attributes
}
```

## Field Definition

```ts
interface AuthFormField {
  name: string
  type: 'checkbox' | 'select' | 'otp' | InputHTMLAttributes['type']
  label?: string
  placeholder?: string
  required?: boolean
  // Checkbox fields: accepts Checkbox props
  // Select fields: accepts SelectMenu props
  // OTP fields: accepts PinInput props
  // All other types: accepts Input props
  // Plus any FormField props
}
```

## Slots

- `header` - Custom header content
- `leading` - Before title
- `title` - Custom title
- `description` - Custom description
- `providers` - Custom provider buttons
- `validation` - Validation error display
- `submit` - Custom submit button
- `footer` - Footer content

## Events

- `@submit` - Form submission with typed data (`FormSubmitEvent`)

## Expose

Access via `useTemplateRef`:
- `formRef` - Reference to HTML form element
- `state` - Reactive form state

## Usage

### Basic Login Form

```vue
<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

const fields: AuthFormField[] = [
  { name: 'email', type: 'email', label: 'Email', placeholder: 'Enter your email', required: true },
  { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter your password', required: true },
  { name: 'remember', label: 'Remember me', type: 'checkbox' }
]

const providers = [
  { label: 'Google', icon: 'i-simple-icons-google', onClick: () => handleGoogleLogin() },
  { label: 'GitHub', icon: 'i-simple-icons-github', onClick: () => handleGitHubLogin() }
]

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters')
})

function onSubmit(payload: FormSubmitEvent<z.output<typeof schema>>) {
  console.log('Submitted', payload)
}
</script>

<template>
  <UAuthForm
    :schema="schema"
    title="Login"
    description="Enter your credentials to access your account."
    icon="i-lucide-user"
    :fields="fields"
    :providers="providers"
    @submit="onSubmit"
  />
</template>
```

### In a PageCard

```vue
<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        :fields="fields"
        :providers="providers"
        title="Welcome back!"
        icon="i-lucide-lock"
        @submit="onSubmit"
      >
        <template #description>
          Don't have an account? <ULink to="#" class="text-primary font-medium">Sign up</ULink>.
        </template>
        <template #password-hint>
          <ULink to="#" class="text-primary font-medium" tabindex="-1">Forgot password?</ULink>
        </template>
        <template #validation>
          <UAlert color="error" icon="i-lucide-info" title="Error signing in" />
        </template>
        <template #footer>
          By signing in, you agree to our <ULink to="#" class="text-primary font-medium">Terms of Service</ULink>.
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
```

### Register Form

```vue
<script setup lang="ts">
import type { AuthFormField } from '@nuxt/ui'

const fields: AuthFormField[] = [
  { name: 'name', type: 'text', label: 'Full Name', placeholder: 'Enter your name', required: true },
  { name: 'email', type: 'email', label: 'Email', placeholder: 'Enter your email', required: true },
  { name: 'password', type: 'password', label: 'Password', placeholder: 'Create a password', required: true },
  { name: 'confirmPassword', type: 'password', label: 'Confirm Password', placeholder: 'Confirm your password', required: true }
]
</script>

<template>
  <UAuthForm
    title="Create account"
    description="Fill in the details below to get started."
    icon="i-lucide-user-plus"
    :fields="fields"
    :submit="{ label: 'Create Account', block: true }"
    separator="Providers"
    @submit="onRegister"
  />
</template>
```

### OTP Verification

```vue
<script setup lang="ts">
import type { AuthFormField } from '@nuxt/ui'

const fields: AuthFormField[] = [
  { name: 'otp', type: 'otp', label: 'Verification Code' }
]
</script>

<template>
  <UAuthForm
    title="Verify your email"
    description="Enter the 6-digit code sent to your email."
    icon="i-lucide-shield-check"
    :fields="fields"
    :submit="{ label: 'Verify', block: true }"
    @submit="onVerify"
  />
</template>
```

## Theme

```ts
export default defineAppConfig({
  ui: {
    authForm: {
      slots: {
        root: 'w-full space-y-6',
        header: 'flex flex-col text-center',
        leading: 'mb-2',
        leadingIcon: 'size-8 shrink-0 inline-block',
        title: 'text-xl text-pretty font-semibold text-highlighted',
        description: 'mt-1 text-base text-pretty text-muted',
        body: 'gap-y-6 flex flex-col',
        providers: 'space-y-3',
        form: 'space-y-5',
        footer: 'text-sm text-center text-muted mt-2'
      }
    }
  }
})
```

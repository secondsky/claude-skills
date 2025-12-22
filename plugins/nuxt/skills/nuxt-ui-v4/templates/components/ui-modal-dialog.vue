<template>
  <div class="p-6">
    <UCard>
      <template #header>
        <h2 class="text-2xl font-bold">Modal & Dialog Examples</h2>
        <p class="text-dimmed mt-1">Demonstrates Modal, Dialog, and confirmation patterns</p>
      </template>

      <div class="space-y-4">
        <!-- Modal Triggers -->
        <div class="flex flex-wrap gap-4">
          <UButton @click="openFormModal">Open Form Modal</UButton>
          <UButton @click="openContentModal" variant="outline">Open Content Modal</UButton>
          <UButton @click="openConfirmDialog" color="error">Open Confirm Dialog</UButton>
        </div>
      </div>
    </UCard>

    <!-- Form Modal -->
    <UModal v-model="isFormModalOpen" :ui="{ width: 'sm:max-w-md' }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold">Create New Item</h3>
            <UButton
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="isFormModalOpen = false"
            />
          </div>
        </template>

        <UForm :state="formState" :schema="formSchema" @submit="onFormSubmit">
          <UFormField name="title" label="Title" class="mb-4">
            <UInput
              v-model="formState.title"
              placeholder="Enter title..."
              required
            />
          </UFormField>

          <UFormField name="description" label="Description" class="mb-4">
            <UTextarea
              v-model="formState.description"
              placeholder="Enter description..."
              :rows="3"
            />
          </UFormField>

          <UFormField name="category" label="Category" class="mb-4">
            <USelect
              v-model="formState.category"
              :options="categoryOptions"
              placeholder="Select category"
            />
          </UFormField>

          <UFormField name="priority" label="Priority" class="mb-4">
            <URadioGroup
              v-model="formState.priority"
              :options="priorityOptions"
            />
          </UFormField>
        </UForm>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="isFormModalOpen = false">Cancel</UButton>
            <UButton @click="onFormSubmit" :loading="isSubmitting">Create</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Content Modal (larger) -->
    <UModal v-model="isContentModalOpen" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-semibold">Terms and Conditions</h3>
              <p class="text-sm text-dimmed mt-1">Please read carefully</p>
            </div>
            <UButton
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="isContentModalOpen = false"
            />
          </div>
        </template>

        <div class="prose prose-sm max-w-none">
          <h4>1. Acceptance of Terms</h4>
          <p>By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.</p>

          <h4>2. Use License</h4>
          <p>Permission is granted to temporarily download one copy of the materials for personal, non-commercial transitory viewing only.</p>

          <h4>3. Disclaimer</h4>
          <p>The materials on this website are provided on an 'as is' basis. We make no warranties, expressed or implied.</p>

          <h4>4. Limitations</h4>
          <p>In no event shall our company or its suppliers be liable for any damages arising out of the use or inability to use the materials.</p>
        </div>

        <template #footer>
          <div class="flex justify-between items-center">
            <UCheckbox v-model="termsAccepted" label="I accept the terms and conditions" />
            <div class="flex gap-2">
              <UButton variant="ghost" @click="isContentModalOpen = false">Decline</UButton>
              <UButton :disabled="!termsAccepted" @click="acceptTerms">Accept</UButton>
            </div>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Confirmation Dialog -->
    <UModal v-model="isConfirmDialogOpen" :ui="{ width: 'sm:max-w-sm' }">
      <UCard>
        <div class="text-center p-6">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-error" />
          </div>

          <h3 class="text-xl font-semibold mb-2">Delete Item?</h3>
          <p class="text-dimmed">
            Are you sure you want to delete this item? This action cannot be undone.
          </p>
        </div>

        <template #footer>
          <div class="flex justify-center gap-2">
            <UButton variant="ghost" @click="isConfirmDialogOpen = false">Cancel</UButton>
            <UButton color="error" @click="confirmDelete" :loading="isDeleting">Delete</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'

// Modal states
const isFormModalOpen = ref(false)
const isContentModalOpen = ref(false)
const isConfirmDialogOpen = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const termsAccepted = ref(false)

// Form schema
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  category: z.string().min(1, 'Please select a category'),
  priority: z.enum(['low', 'medium', 'high'])
})

// Form state
const formState = reactive({
  title: '',
  description: '',
  category: '',
  priority: 'medium'
})

// Options
const categoryOptions = [
  { label: 'Work', value: 'work' },
  { label: 'Personal', value: 'personal' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Other', value: 'other' }
]

const priorityOptions = [
  { value: 'low', label: 'Low', description: 'Can wait' },
  { value: 'medium', label: 'Medium', description: 'Normal priority' },
  { value: 'high', label: 'High', description: 'Urgent' }
]

// Modal actions
function openFormModal() {
  // Reset form
  formState.title = ''
  formState.description = ''
  formState.category = ''
  formState.priority = 'medium'

  isFormModalOpen.value = true
}

function openContentModal() {
  termsAccepted.value = false
  isContentModalOpen.value = true
}

function openConfirmDialog() {
  isConfirmDialogOpen.value = true
}

// Form submit
async function onFormSubmit() {
  isSubmitting.value = true

  try {
    // Validate form
    formSchema.parse(formState)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('Form submitted:', formState)

    // Show success toast
    const { add: addToast } = useToast()
    addToast({
      title: 'Success!',
      description: 'Item created successfully',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })

    // Close modal
    isFormModalOpen.value = false
  } catch (error) {
    console.error('Submit error:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Accept terms
function acceptTerms() {
  const { add: addToast } = useToast()
  addToast({
    title: 'Terms Accepted',
    description: 'Thank you for accepting our terms',
    color: 'success'
  })

  isContentModalOpen.value = false
}

// Confirm delete
async function confirmDelete() {
  isDeleting.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('Item deleted')

    // Show success toast
    const { add: addToast } = useToast()
    addToast({
      title: 'Deleted',
      description: 'Item has been deleted successfully',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })

    // Close dialog
    isConfirmDialogOpen.value = false
  } catch (error) {
    console.error('Delete error:', error)
  } finally {
    isDeleting.value = false
  }
}
</script>

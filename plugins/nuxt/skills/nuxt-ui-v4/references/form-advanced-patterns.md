# Form Advanced Patterns

## Multi-Step Forms

```vue
<script setup lang="ts">
const step = ref(1)
const formData = reactive({
  step1: {},
  step2: {},
  step3: {}
})

function nextStep() {
  if (step.value < 3) step.value++
}

function prevStep() {
  if (step.value > 1) step.value--
}
</script>

<template>
  <UForm v-if="step === 1" :state="formData.step1">
    <!-- Step 1 fields -->
    <UButton @click="nextStep">Next</UButton>
  </UForm>

  <UForm v-if="step === 2" :state="formData.step2">
    <!-- Step 2 fields -->
    <UButton @click="prevStep">Back</UButton>
    <UButton @click="nextStep">Next</UButton>
  </UForm>

  <UForm v-if="step === 3" :state="formData.step3" @submit="onSubmit">
    <!-- Step 3 fields -->
    <UButton @click="prevStep">Back</UButton>
    <UButton type="submit">Submit</UButton>
  </UForm>
</template>
```

## File Uploads

```vue
<script setup lang="ts">
const files = ref<File[]>([])

async function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    files.value = Array.from(target.files)
  }
}
</script>

<template>
  <UFormField label="Upload Files">
    <input type="file" multiple @change="handleUpload" />
  </UFormField>
</template>
```

## Dynamic Fields

```vue
<script setup lang="ts">
const items = ref([{ name: '', value: '' }])

function addItem() {
  items.value.push({ name: '', value: '' })
}

function removeItem(index: number) {
  items.value.splice(index, 1)
}
</script>

<template>
  <div v-for="(item, index) in items" :key="index">
    <UInput v-model="item.name" />
    <UButton @click="removeItem(index)">Remove</UButton>
  </div>
  <UButton @click="addItem">Add Item</UButton>
</template>
```

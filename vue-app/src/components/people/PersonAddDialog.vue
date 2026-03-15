<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    header="Add Person"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    class="!bg-surface-1 !text-text"
  >
    <div class="flex flex-col gap-4">
      <!-- Name -->
      <div>
        <label class="block text-sm font-medium mb-2 text-text">
          Name <span class="text-red-500">*</span>
        </label>
        <InputText
          v-model="form.name"
          placeholder="Enter full name"
          class="w-full !bg-surface-2 !border-border"
          :class="{ '!border-red-500': errors.name }"
          @keydown.enter="handleSubmit"
        />
        <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
      </div>

      <!-- Also Known As -->
      <div>
        <label class="block text-sm font-medium mb-2 text-text">Also Known As</label>
        <InputText
          v-model="form.also_known_as"
          placeholder="Stage name, alias..."
          class="w-full !bg-surface-2 !border-border"
        />
      </div>

      <!-- Bio -->
      <div>
        <label class="block text-sm font-medium mb-2 text-text">Bio</label>
        <Textarea
          v-model="form.bio"
          rows="3"
          placeholder="Short biography (optional)"
          class="w-full !bg-surface-2 !border-border"
        />
      </div>

      <!-- Birth Date & Birth Place -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2 text-text">Birth Date</label>
          <InputText
            v-model="form.birth_date"
            placeholder="YYYY-MM-DD"
            class="w-full !bg-surface-2 !border-border"
          />
          <small class="text-text-muted">Format: YYYY-MM-DD</small>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2 text-text">Birth Place</label>
          <InputText
            v-model="form.birth_place"
            placeholder="City, Country"
            class="w-full !bg-surface-2 !border-border"
          />
        </div>
      </div>

      <!-- Profile Photo URL -->
      <div>
        <label class="block text-sm font-medium mb-2 text-text">Profile Photo URL</label>
        <InputText
          v-model="form.profile_url"
          placeholder="https://example.com/photo.jpg"
          class="w-full !bg-surface-2 !border-border"
        />
        <!-- Preview -->
        <div v-if="form.profile_url" class="mt-2">
          <img
            :src="form.profile_url"
            alt="Profile preview"
            class="w-20 h-20 object-cover rounded-full ring-1 ring-border"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
        </div>
      </div>

      <!-- IMDb ID & TMDB ID -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2 text-text">IMDb ID</label>
          <InputText
            v-model="form.imdb_id"
            placeholder="nm0000093"
            class="w-full !bg-surface-2 !border-border"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2 text-text">TMDB ID</label>
          <InputNumber
            v-model="form.tmdb_id"
            placeholder="12345"
            :useGrouping="false"
            input-class="w-full !bg-surface-2 !border-border"
            class="w-full"
          />
        </div>
      </div>

      <!-- General error -->
      <small v-if="errors.general" class="text-red-500">{{ errors.general }}</small>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <Button
          label="Cancel"
          icon="pi pi-times"
          severity="secondary"
          class="flex-1 !bg-transparent !border-border !text-text"
          @click="closeDialog"
        />
        <Button
          label="Add Person"
          icon="pi pi-check"
          :loading="loading"
          class="flex-1 !bg-primary !text-on-primary !border-primary"
          @click="handleSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, InputText, Textarea, InputNumber, Button } from 'primevue'
import type { CreatePersonRequest } from '@/types/movies'

const props = defineProps<{
  visible: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [form: CreatePersonRequest]
}>()

const isVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
})

const form = ref<CreatePersonRequest>({ name: '' })
const errors = ref<Record<string, string>>({})

// Reset every time dialog opens
watch(
  () => props.visible,
  (v) => {
    if (v) {
      form.value = { name: '' }
      errors.value = {}
    }
  },
)

function validate(): boolean {
  errors.value = {}
  if (!form.value.name?.trim()) {
    errors.value.name = 'Name is required'
  }
  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', { ...form.value })
}

function closeDialog() {
  isVisible.value = false
}
</script>

<!-- <style scoped>
:deep(.p-dialog-header) {
  @apply bg-surface-1 border-b border-border;
}
:deep(.p-dialog-content) {
  @apply bg-surface-1;
}
:deep(.p-dialog-footer) {
  @apply bg-surface-1 border-t border-border;
}
</style> -->

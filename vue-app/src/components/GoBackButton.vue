<template>
  <button
    @click="handleBack"
    class="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted hover:text-text hover:bg-surface-3 transition-colors"
  >
    <ArrowLeft :size="20" />
  </button>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const props = defineProps<{
  to?: string
}>()

const router = useRouter()

function handleBack() {
  if (props.to) {
    router.push(props.to)
  } else {
    router.back()
  }
}
</script>

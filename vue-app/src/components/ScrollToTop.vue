<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronUp } from 'lucide-vue-next'

const route = useRoute()
const isVisible = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)

function onScroll(e: Event) {
  if (e.target instanceof HTMLElement) {
    if (e.target.scrollHeight > e.target.clientHeight) {
      scrollContainer.value = e.target
      isVisible.value = e.target.scrollTop > 350
    }
  } else if (e.target === document) {
    const top = window.scrollY || document.documentElement.scrollTop
    isVisible.value = top > 350
    scrollContainer.value = null
  }
}

function scrollToTop() {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(
  () => route.path,
  () => {
    isVisible.value = false
    scrollContainer.value = null
  }
)

onMounted(() => {
  window.addEventListener('scroll', onScroll, { capture: true, passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll, { capture: true })
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-3 scale-90"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-3 scale-90"
  >
    <button
      v-if="isVisible"
      @click="scrollToTop"
      class="fixed z-50 bottom-20 md:bottom-8 right-6 w-11 h-11 rounded-full bg-surface-2/90 hover:bg-primary text-text hover:text-white backdrop-blur-md border border-white/10 shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <ChevronUp :size="22" />
    </button>
  </Transition>
</template>

<template>
  <div class="shrink-0 relative w-full aspect-4/5 sm:aspect-21/9 bg-surface-2 rounded-xl overflow-hidden group">
    <div ref="scrollContainer" class="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar"
      @scroll="onScroll">
      <!-- Slides -->
      <div v-for="(item) in items" :key="item.uuid" class="w-full h-full shrink-0 snap-center relative cursor-pointer"
        @click="$emit('clickItem', item)">
        <!-- Background Image -->
        <img :src="item.backdrop_url || item.poster_url" :alt="item.title"
          class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />

        <!-- Gradient Overlay -->
        <div class="absolute inset-0 bg-linear-to-t from-surface-1 via-surface-1/4 to-transparent"></div>

        <!-- Content -->
        <div class="absolute bottom-0 left-0 w-full p-4 sm:p-8 md:p-12 flex flex-col gap-2 sm:gap-4 justify-end">
          <h2 class="text-3xl sm:text-5xl font-heading font-bold text-white drop-shadow-lg">
            {{ item.title }}
          </h2>
          <div class="flex items-center gap-3 text-sm text-gray-200">
            <span>{{ item.release_year }}</span>
            <span class="px-2 py-0.5 bg-primary/80 text-white rounded-md text-xs font-bold uppercase tracking-wider">
              {{ item.type }}
            </span>
            <span v-if="item.status === 'returning_series'"
              class="px-2 py-0.5 bg-purple-500/80 text-white rounded-md text-xs font-bold uppercase tracking-wider">
              New Episodes
            </span>
          </div>

          <div class="mt-2 flex gap-3">
            <button
              class="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-primary text-on-primary font-bold shadow-lg hover:scale-105 transition-transform"
              @click.stop="$emit('clickItem', item)">
              Watch Now
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Indicators -->
    <div class="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
      <div v-for="(_, idx) in items" :key="idx" class="w-2 h-2 rounded-full transition-all duration-300"
        :class="idx === currentIndex ? 'bg-primary w-6' : 'bg-white/50'"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import type { MediaCard } from 'shared-types'

const props = defineProps<{
  items: MediaCard[]
  autoPlayInterval?: number
}>()

defineEmits(['clickItem'])

const scrollContainer = ref<HTMLElement | null>(null)
const currentIndex = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function onScroll() {
  if (!scrollContainer.value) return
  const el = scrollContainer.value
  const scrollLeft = el.scrollLeft
  const width = el.clientWidth
  currentIndex.value = Math.round(scrollLeft / width)
}

function nextSlide() {
  if (!scrollContainer.value || props.items.length === 0) return
  const el = scrollContainer.value
  const width = el.clientWidth

  let nextIdx = currentIndex.value + 1
  if (nextIdx >= props.items.length) {
    nextIdx = 0 // Loop back to start
  }

  el.scrollTo({
    left: nextIdx * width,
    behavior: 'smooth'
  })
}

function startAutoPlay() {
  if (props.autoPlayInterval) {
    stopAutoPlay()
    timer = setInterval(nextSlide, props.autoPlayInterval)
  }
}

function stopAutoPlay() {
  if (timer) clearInterval(timer)
}

onMounted(() => {
  nextTick(() => {
    startAutoPlay()
  })
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style scoped>
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>

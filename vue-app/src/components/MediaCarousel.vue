<template>
  <div class="relative w-full group">
    <swiper
      :modules="modules"
      :slides-per-view="'auto'"
      :space-between="16"
      :free-mode="true"
      :navigation="true"
      class="w-full pb-4"
    >
      <swiper-slide v-for="item in items" :key="item.uuid || item.id || item" style="width: auto; height: auto;">
        <slot :item="item"></slot>
      </swiper-slide>
    </swiper>
  </div>
</template>

<script setup lang="ts" generic="T extends any">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { FreeMode, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/free-mode'
import 'swiper/css/navigation'

defineProps<{
  items: T[]
}>()

const modules = [FreeMode, Navigation]
</script>

<style scoped>
:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  color: var(--color-primary);
  background: rgba(0, 0, 0, 0.6);
  padding: 24px 16px;
  border-radius: 8px;
  transform: scale(0.6);
  opacity: 0;
  transition: opacity 0.3s;
}

.group:hover :deep(.swiper-button-next),
.group:hover :deep(.swiper-button-prev) {
  opacity: 1;
}

:deep(.swiper-button-disabled) {
  opacity: 0 !important;
}
</style>

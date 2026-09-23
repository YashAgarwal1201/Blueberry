<template>
  <div class="relative w-full group">
    <TransitionGroup name="list" tag="div"
      class="flex flex-nowrap items-stretch gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4"
    >
      <slot></slot>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
// Simple wrapper to enforce snap scroll styling uniformly across carousels
</script>

<style scoped>
.hide-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}
</style>

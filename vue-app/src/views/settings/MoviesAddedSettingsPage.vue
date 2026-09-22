<template>
  <div class="flex flex-col gap-y-4">
    <div class="flex flex-col gap-0">
      <h2 class="text-lg sm:text-xl font-heading">Movies added</h2>
      <p class="font-content text-text-muted">Following are the movies added by you.</p>
    </div>
    <div class="flex gap-3">
      <UserAddedMovies />
    </div>
  </div>
</template>

<script setup lang="ts">
import UserAddedMovies from '@/components/UserAddedMovies.vue'
</script>

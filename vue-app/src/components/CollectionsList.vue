<template>
  <div class="w-full flex flex-col gap-y-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-text-muted">Curate your own custom lists of movies and TV shows.</p>
      </div>
      <button @click="showCreateModal = true" class="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl font-medium hover:opacity-90 transition-all active:scale-95">
        <Plus :size="18" />
        New Collection
      </button>
    </div>

    <div v-if="store.loading && store.myCollections.length === 0" class="flex justify-center py-20">
      <Loader2 class="animate-spin text-primary" :size="32" />
    </div>

    <div v-else-if="store.myCollections.length === 0" class="flex flex-col items-center justify-center py-16 text-center bg-surface-1/50 rounded-2xl border border-dashed border-border">
      <FolderPlus :size="48" class="text-surface-3 mb-4" />
      <h3 class="text-lg font-semibold text-text mb-2">No collections yet</h3>
      <p class="text-text-muted max-w-sm mb-6">Create your first collection to start organizing your favorites.</p>
      <button @click="showCreateModal = true" class="px-6 py-2.5 bg-surface-2 hover:bg-surface-3 text-text rounded-full font-medium transition-all active:scale-95">
        Create Collection
      </button>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <RouterLink v-for="collection in store.myCollections" :key="collection.id" :to="`/profile/collections/${collection.id}`"
        class="group relative flex flex-col gap-3">
        
        <!-- Collage Cover -->
        <div class="relative w-full aspect-video rounded-2xl overflow-hidden bg-surface-2 border border-border shadow-sm group-hover:shadow-md group-hover:border-primary/50 transition-all duration-300">
          <AppImage :src="collection.poster_url" type="collection" class="w-full h-full" />
          
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
          
          <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
            <span class="text-sm font-bold bg-black/50 backdrop-blur-md px-2 py-1 rounded-md">{{ collection.item_count }} items</span>
            <Lock v-if="collection.privacy === 'private'" :size="16" class="text-white/80" />
            <Globe v-else-if="collection.privacy === 'public'" :size="16" class="text-white/80" />
            <LinkIcon v-else :size="16" class="text-white/80" />
          </div>
        </div>

        <div>
          <h3 class="font-bold text-lg text-text group-hover:text-primary transition-colors line-clamp-1">{{ collection.name }}</h3>
          <p v-if="collection.description" class="text-sm text-text-muted line-clamp-2 mt-1">{{ collection.description }}</p>
        </div>
      </RouterLink>
    </div>

    <!-- Create Modal (Simplified inline for hub page) -->
    <Dialog v-model:visible="showCreateModal" modal header="Create Collection" :pt="{ root: { class: 'w-full max-w-[400px] m-4 bg-surface-1 border border-border rounded-2xl overflow-hidden' }, header: { class: 'p-5 border-b border-border' }, content: { class: 'p-5' } }">
      <form @submit.prevent="handleCreate" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-text-muted">Name</label>
          <input v-model="newCol.name" type="text" required class="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. Weekend Binge" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-text-muted">Description (optional)</label>
          <textarea v-model="newCol.description" rows="3" class="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" placeholder="What's this collection about?"></textarea>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-text-muted">Privacy</label>
          <select v-model="newCol.privacy" class="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="private">Private (Only you)</option>
            <option value="unlisted">Unlisted (Anyone with link)</option>
            <option value="public">Public (Visible on profile)</option>
          </select>
        </div>
        <div class="flex justify-end gap-3 mt-2">
          <button type="button" @click="showCreateModal = false" class="px-4 py-2 rounded-xl text-text-muted hover:bg-surface-2 transition-colors">Cancel</button>
          <button type="submit" :disabled="!newCol.name.trim() || creating" class="px-6 py-2 bg-primary text-on-primary rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center">
            <Loader2 v-if="creating" class="animate-spin" :size="20" />
            <span v-else>Create</span>
          </button>
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, FolderPlus, Folder, Lock, Globe, Link as LinkIcon, Loader2 } from 'lucide-vue-next'
import AppImage from '@/components/AppImage.vue'
import { useCollectionsStore } from '@/stores/collectionsStore'
import { RouterLink } from 'vue-router'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import type { CollectionPrivacy } from 'shared-types'

const store = useCollectionsStore()
const toast = useToast()

const showCreateModal = ref(false)
const creating = ref(false)

const newCol = ref({
  name: '',
  description: '',
  privacy: 'private' as CollectionPrivacy
})

onMounted(() => {
  store.fetchMyCollections()
})

async function handleCreate() {
  if (!newCol.value.name.trim()) return
  
  creating.value = true
  try {
    await store.createCollection({
      name: newCol.value.name,
      slug: '',
      description: newCol.value.description,
      privacy: newCol.value.privacy
    })
    showCreateModal.value = false
    newCol.value = { name: '', description: '', privacy: 'private' }
    toast.add({ severity: 'success', summary: 'Success', detail: 'Collection created', life: 2000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create collection', life: 3000 })
  } finally {
    creating.value = false
  }
}
</script>

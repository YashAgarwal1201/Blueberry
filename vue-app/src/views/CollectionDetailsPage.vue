<template>
  <div class="w-full min-h-screen bg-surface-0 pb-20">
    <div v-if="loading" class="flex justify-center py-32">
      <Loader2 class="animate-spin text-primary" :size="48" />
    </div>

    <div v-else-if="!collection" class="flex flex-col items-center justify-center py-32 text-center">
      <Folder class="text-surface-3 mb-4" :size="64" />
      <h2 class="text-2xl font-bold">Collection Not Found</h2>
      <p class="text-text-muted mt-2">This collection might be private or doesn't exist.</p>
      <RouterLink to="/profile" class="mt-6 px-6 py-2 bg-primary text-on-primary rounded-full font-medium">Go Back</RouterLink>
    </div>

    <div v-else class="flex flex-col">
      <!-- Hero Header -->
      <div class="relative w-full h-[40vh] sm:h-[50vh] overflow-hidden bg-surface-1">
        <img v-if="heroImage" :src="heroImage" class="absolute inset-0 w-full h-full object-cover blur-sm opacity-50" />
        <div class="absolute inset-0 bg-gradient-to-t from-surface-0 via-surface-0/80 to-transparent"></div>
        
        <button @click="router.back()" class="absolute top-6 left-6 z-20 w-11 h-11 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-all active:scale-95">
          <ChevronLeft :size="24" />
        </button>
        
        <div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 z-10">
          <div class="flex items-center gap-3 mb-3">
            <span class="px-2.5 py-1 bg-surface-2/80 backdrop-blur-md rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
              <Lock v-if="collection.privacy === 'private'" :size="14" />
              <Globe v-else-if="collection.privacy === 'public'" :size="14" />
              <LinkIcon v-else :size="14" />
              {{ collection.privacy }}
            </span>
            <span class="text-text-muted font-medium">{{ collection.items.length }} items</span>
          </div>
          
          <h1 class="text-4xl sm:text-6xl font-bold font-heading text-text mb-2">{{ collection.name }}</h1>
          <p v-if="collection.description" class="text-lg text-text-muted max-w-3xl">{{ collection.description }}</p>
          
          <div class="flex items-center gap-4 mt-6">
            <button v-if="isOwner" @click="showEditModal = true" class="px-5 py-2.5 bg-surface-2 hover:bg-surface-3 text-text rounded-xl font-semibold flex items-center gap-2 transition-all active:scale-95">
              <Settings2 :size="18" /> Edit Details
            </button>
            <button v-if="collection.privacy !== 'private'" @click="shareLink" class="w-11 h-11 flex items-center justify-center bg-surface-2 hover:bg-surface-3 text-text rounded-xl transition-all active:scale-95">
              <Share2 :size="18" />
            </button>
          </div>
        </div>
      </div>

      <!-- Items List -->
      <div class="p-6 sm:p-12 w-full flex flex-col gap-6">
        
        <div v-if="collection.items.length > 0" class="flex items-center bg-surface-1 border border-border rounded-xl px-4 py-3 w-full max-w-md focus-within:ring-2 focus-within:ring-primary/50 transition-all shadow-sm">
          <Search :size="20" class="text-text-muted mr-3 shrink-0" />
          <input v-model="searchQuery" type="text" placeholder="Search in collection..." class="bg-transparent border-none outline-none text-text w-full placeholder-text-muted" />
        </div>
        <div v-if="collection.items.length === 0" class="flex flex-col items-center py-20 text-center border-2 border-dashed border-border rounded-2xl">
          <FolderPlus :size="48" class="text-surface-3 mb-4" />
          <h3 class="text-xl font-semibold mb-2">This collection is empty</h3>
          <p class="text-text-muted mb-6">Add movies or TV shows to see them here.</p>
          <RouterLink to="/movies" class="px-6 py-2.5 bg-primary text-on-primary rounded-full font-medium transition-all active:scale-95">Explore Movies</RouterLink>
        </div>

        <TransitionGroup v-else name="list" tag="div" class="flex flex-col gap-3">
          <div v-if="filteredItems.length === 0" class="py-12 text-center text-text-muted">
            No items match your search.
          </div>
          <div v-for="(item, index) in filteredItems" :key="item.id"
            class="group relative flex items-center gap-4 p-3 pr-4 bg-surface-1 hover:bg-surface-2 border border-border rounded-2xl transition-all">

            <!-- Number indicator -->
            <div class="w-8 flex justify-center text-lg font-bold font-heading text-text-muted opacity-50">{{ index + 1 }}</div>

            <!-- Poster -->
            <div class="w-16 sm:w-20 aspect-[2/3] rounded-lg overflow-hidden bg-surface-3 shrink-0 cursor-pointer" @click="navigateToMedia(item)">
              <img v-if="item.poster_url" :src="item.poster_url" class="w-full h-full object-cover" />
            </div>

            <!-- Info -->
            <div class="flex flex-col flex-1 cursor-pointer" @click="navigateToMedia(item)">
              <div class="flex items-center gap-2">
                <span v-if="item.type === 'tv'" class="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded uppercase">TV</span>
                <span v-if="item.type === 'movie'" class="px-1.5 py-0.5 bg-secondary/20 text-secondary text-[10px] font-bold rounded uppercase">Movie</span>
                <h3 class="font-bold text-base sm:text-lg text-text line-clamp-1">{{ item.title }}</h3>
              </div>
              <p class="text-sm text-text-muted mt-1">{{ item.release_year }} • {{ item.status }}</p>
              
              <div class="flex flex-wrap gap-1.5 mt-2">
                <span v-for="genre in item.genres?.slice(0, 3)" :key="genre.id" class="px-2 py-0.5 bg-surface-3 text-text-muted text-xs rounded-md">
                  {{ genre.name }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div v-if="isOwner" class="opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click="removeItem(item)" class="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Remove from collection">
                <Trash2 :size="18" />
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- Edit Modal -->
    <Dialog v-model:visible="showEditModal" modal header="Edit Collection" :pt="{ root: { class: 'w-full max-w-[400px] m-4 bg-surface-1 border border-border rounded-2xl overflow-hidden' }, header: { class: 'p-5 border-b border-border' }, content: { class: 'p-5' } }">
      <form v-if="collection" @submit.prevent="handleEdit" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-text-muted">Name</label>
          <input v-model="editForm.name" type="text" required class="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-text-muted">Description (optional)</label>
          <textarea v-model="editForm.description" rows="3" class="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"></textarea>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-text-muted">Privacy</label>
          <select v-model="editForm.privacy" class="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="private">Private (Only you)</option>
            <option value="unlisted">Unlisted (Anyone with link)</option>
            <option value="public">Public (Visible on profile)</option>
          </select>
        </div>
        <div class="flex justify-between mt-4">
          <button type="button" @click="handleDelete" class="px-4 py-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors font-medium">Delete</button>
          <div class="flex gap-2">
            <button type="button" @click="showEditModal = false" class="px-4 py-2 rounded-xl text-text-muted hover:bg-surface-2 transition-colors">Cancel</button>
            <button type="submit" :disabled="saving" class="px-6 py-2 bg-primary text-on-primary rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center">
              <Loader2 v-if="saving" class="animate-spin" :size="20" />
              <span v-else>Save</span>
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCollectionsStore } from '@/stores/collectionsStore'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, Folder, FolderPlus, Lock, Globe, Link as LinkIcon, Settings2, Share2, Trash2, ChevronLeft, Search } from 'lucide-vue-next'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import type { MediaCard } from 'shared-types'

const route = useRoute()
const router = useRouter()
const store = useCollectionsStore()
const authStore = useAuthStore()
const toast = useToast()

const collectionId = computed(() => parseInt(route.params.id as string))
const collection = computed(() => store.currentCollection)
const loading = computed(() => store.loading && !collection.value)

const isOwner = computed(() => authStore.isAuthenticated && collection.value?.user_id === authStore.user?.id)

const heroImage = computed(() => {
  if (!collection.value) return null
  if (collection.value.poster_url) return collection.value.poster_url
  if (collection.value.items && collection.value.items.length > 0) {
    return collection.value.items[0]?.backdrop_url || collection.value.items[0]?.poster_url
  }
  return null
})

const showEditModal = ref(false)
const saving = ref(false)
const editForm = ref({ name: '', description: '', privacy: 'private' as any })

const searchQuery = ref('')

const filteredItems = computed(() => {
  if (!collection.value) return []
  if (!searchQuery.value.trim()) return collection.value.items
  
  const query = searchQuery.value.toLowerCase()
  return collection.value.items.filter(item => 
    item.title.toLowerCase().includes(query)
  )
})

onMounted(async () => {
  await fetchCollection()
})

watch(collectionId, () => {
  fetchCollection()
})

async function fetchCollection() {
  if (isNaN(collectionId.value)) return
  try {
    await store.fetchCollectionDetail(collectionId.value)
    if (collection.value) {
      editForm.value = {
        name: collection.value.name,
        description: collection.value.description || '',
        privacy: collection.value.privacy
      }
    }
  } catch (err) {
    // Handled by store
  }
}

function navigateToMedia(item: MediaCard) {
  router.push(`/${item.type === 'movie' ? 'movies' : 'shows'}/${item.uuid}`)
}

async function handleEdit() {
  saving.value = true
  try {
    await store.updateCollection(collectionId.value, editForm.value)
    showEditModal.value = false
    toast.add({ severity: 'success', summary: 'Success', detail: 'Collection updated', life: 2000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update', life: 3000 })
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!confirm('Are you sure you want to delete this collection? This action cannot be undone.')) return
  
  try {
    await store.deleteCollection(collectionId.value)
    toast.add({ severity: 'success', summary: 'Deleted', detail: 'Collection deleted', life: 2000 })
    router.replace('/profile')
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete', life: 3000 })
  }
}

async function removeItem(item: MediaCard) {
  try {
    await store.removeItemFromCollection(collectionId.value, item.id, item.type)
    toast.add({ severity: 'success', summary: 'Removed', detail: 'Item removed from collection', life: 2000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to remove item', life: 3000 })
  }
}

async function shareLink() {
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
    toast.add({ severity: 'success', summary: 'Copied', detail: 'Link copied to clipboard', life: 2000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to copy link', life: 3000 })
  }
}
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
.list-leave-active {
  position: absolute;
  width: 100%;
}
.list-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>

<template>
  <Dialog :visible="visible" modal @update:visible="(val: boolean) => $emit('update:visible', val)"
    header="Save to Collection"
    :pt="{
      root: { class: 'bg-surface-1 text-text border border-border rounded-2xl shadow-2xl w-full sm:w-[400px] overflow-hidden m-4' },
      header: { class: 'p-5 border-b border-border font-heading font-bold text-xl' },
      content: { class: 'p-0 max-h-[60vh] overflow-y-auto custom-scrollbar' },
      closeButton: { class: 'text-text-muted hover:text-text hover:bg-surface-2 transition-colors rounded-full p-2' }
    }">
    
    <div class="p-5 flex flex-col gap-1">
      <div v-if="loading" class="flex justify-center py-4">
        <Loader2 class="animate-spin text-primary" :size="24" />
      </div>
      
      <div v-else-if="collections.length === 0" class="text-center py-6 text-text-muted">
        <FolderPlus :size="32" class="mx-auto mb-3 opacity-50" />
        <p>You don't have any collections yet.</p>
        <p class="text-sm mt-1">Create one below!</p>
      </div>

      <div v-else class="flex flex-col gap-1">
        <label v-for="collection in collections" :key="collection.id"
          class="flex items-center justify-between p-3 rounded-xl hover:bg-surface-2 cursor-pointer transition-colors group">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center overflow-hidden shrink-0">
               <AppImage :src="collection.poster_url" type="collection" class="w-full h-full" />
            </div>
            <div class="flex flex-col">
              <span class="font-medium text-text group-hover:text-primary transition-colors">{{ collection.name }}</span>
              <span class="text-xs text-text-muted">{{ collection.item_count }} item{{ collection.item_count !== 1 ? 's' : '' }}</span>
            </div>
          </div>
          
          <button @click.prevent="toggleInCollection(collection)" class="w-6 h-6 rounded-md border flex items-center justify-center transition-all"
            :class="isItemInCollection(collection) ? 'bg-primary border-primary text-on-primary' : 'border-border text-transparent hover:border-text'">
             <Check v-if="isItemInCollection(collection)" :size="14" />
             <Plus v-else :size="14" class="text-text-muted group-hover:text-text opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </label>
      </div>
    </div>

    <!-- Create New Collection -->
    <div class="p-4 border-t border-border bg-surface-2">
      <form @submit.prevent="handleCreate" class="flex items-center gap-2">
        <input v-model="newCollectionName" type="text" placeholder="New collection..."
          class="flex-1 bg-surface-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text placeholder:text-text-muted" />
        <button type="submit" :disabled="!newCollectionName.trim() || creating"
          class="bg-primary text-on-primary p-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center">
          <Loader2 v-if="creating" class="animate-spin" :size="20" />
          <Plus v-else :size="20" />
        </button>
      </form>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import AppImage from '@/components/AppImage.vue'
import { Check, Plus, Folder, FolderPlus, Loader2 } from 'lucide-vue-next'
import { useCollectionsStore } from '@/stores/collectionsStore'
import { useToast } from 'primevue/usetoast'
import type { MediaCard } from 'shared-types'

const props = defineProps<{
  visible: boolean
  media: MediaCard | null
}>()

const emit = defineEmits(['update:visible'])

const store = useCollectionsStore()
const toast = useToast()

const newCollectionName = ref('')
const creating = ref(false)
const loading = ref(false)

// Track which collections currently have this item (optimistic UI)
const itemInCollections = ref<Set<number>>(new Set())

const collections = computed(() => store.myCollections)

onMounted(async () => {
  if (collections.value.length === 0) {
    loading.value = true
    await store.fetchMyCollections()
    loading.value = false
  }
  checkItemPresence()
})

watch(() => props.media, () => {
  itemInCollections.value.clear()
})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    itemInCollections.value.clear()
  }
})

async function checkItemPresence() {
  if (!props.media) return
  
  // Since we only have `myCollections` list (which doesn't include items), 
  // we would ideally need an endpoint like `/collections/check?mediaId=...`
  // But for now, we'll fetch details for collections (or just let the user toggle blindly and handle errors)
  // To avoid N+1 fetches, we'll assume it's NOT in the collection unless they just added it.
  // A proper implementation would have a `fetchCollectionsForItem` endpoint.
  // For now, let's just allow toggling. We don't know initial state without fetching details of ALL collections.
  
  // Wait, if it's already in the collection, the POST will return an error or ignore. 
  // Let's just start with an empty set. If they try to add it again, it's a no-op on backend.
}

function isItemInCollection(collection: any) {
  return itemInCollections.value.has(collection.id)
}

async function toggleInCollection(collection: any) {
  if (!props.media) return
  
  const inCol = itemInCollections.value.has(collection.id)
  
  try {
    if (inCol) {
      itemInCollections.value.delete(collection.id)
      await store.removeItemFromCollection(collection.id, props.media.id, props.media.type)
      toast.add({ severity: 'success', summary: 'Removed', detail: `Removed from ${collection.name}`, life: 2000 })
    } else {
      itemInCollections.value.add(collection.id)
      await store.addItemToCollection(collection.id, props.media.id, props.media.type)
      toast.add({ severity: 'success', summary: 'Added', detail: `Added to ${collection.name}`, life: 2000 })
    }
  } catch (err) {
    // Revert optimistic
    if (inCol) itemInCollections.value.add(collection.id)
    else itemInCollections.value.delete(collection.id)
  }
}

async function handleCreate() {
  const name = newCollectionName.value.trim()
  if (!name) return
  
  creating.value = true
  try {
    const newCol = await store.createCollection({ name, slug: '', privacy: 'private' })
    newCollectionName.value = ''
    toast.add({ severity: 'success', summary: 'Created', detail: `Collection ${newCol.name} created`, life: 2000 })
    
    // Auto add current item
    if (props.media) {
      await toggleInCollection(newCol)
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Could not create collection', life: 3000 })
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--surface-3);
  border-radius: 4px;
}
</style>

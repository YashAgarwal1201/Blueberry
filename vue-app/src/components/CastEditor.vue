<!-- vue-app/src/components/CastEditor.vue -->
<template>
  <div class="flex flex-col gap-4">
    <!-- Search + Add Row -->
    <div class="flex flex-col sm:flex-row gap-2">
      <div class="relative flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name to add cast..."
          class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text placeholder:text-text-muted"
          @input="onSearchInput"
          @focus="showDropdown = true"
          @blur="onBlur"
          @keydown.escape="closeDropdown"
        />

        <!-- Search Dropdown -->
        <div
          v-if="showDropdown && searchQuery.trim().length > 0"
          class="absolute z-50 left-0 right-0 top-full mt-1 rounded-lg border border-border bg-surface-1 shadow-lg overflow-hidden"
        >
          <!-- Loading state -->
          <div v-if="searching" class="px-3 py-2 text-sm text-text-muted">Searching...</div>

          <!-- Results -->
          <template v-else>
            <button
              v-for="person in searchResults"
              :key="person.id"
              type="button"
              class="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
              @mousedown.prevent="selectExistingPerson(person)"
            >
              <img
                loading="lazy"
                v-if="person.profile_url"
                :src="person.profile_url"
                :alt="person.name"
                class="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div
                v-else
                class="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center shrink-0"
              >
                <User :size="14" class="text-text-muted" />
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-sm text-text truncate">{{ person.name }}</span>
                <span v-if="person.also_known_as" class="text-xs text-text-muted truncate">
                  aka {{ person.also_known_as }}
                </span>
              </div>
            </button>

            <!-- No results + Create option -->
            <div v-if="searchResults.length === 0" class="flex flex-col">
              <div class="px-3 py-2 text-sm text-text-muted">No match found</div>
              <button
                type="button"
                class="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-surface-2 transition-colors border-t border-border"
                @mousedown.prevent="openCreateForm"
              >
                <Plus :size="14" />
                Create "{{ searchQuery.trim() }}" as new person
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Inline Create Form -->
    <div
      v-if="showCreateForm"
      class="rounded-xl border border-primary/40 bg-surface-2 p-4 flex flex-col gap-3"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-text">New Person</h3>
        <button type="button" class="text-text-muted hover:text-text" @click="closeCreateForm">
          <X :size="16" />
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-text-muted mb-1">Name *</label>
          <input
            v-model="newPerson.name"
            type="text"
            placeholder="Full name"
            class="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface-1 text-text"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-muted mb-1">Also Known As</label>
          <input
            v-model="newPerson.also_known_as"
            type="text"
            placeholder="Stage name, alias..."
            class="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface-1 text-text"
          />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-medium text-text-muted mb-1">Profile Photo URL</label>
          <input
            v-model="newPerson.profile_url"
            type="text"
            placeholder="https://..."
            class="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface-1 text-text"
          />
        </div>
      </div>

      <div class="flex gap-2 pt-1">
        <button
          type="button"
          :disabled="!newPerson.name?.trim() || peopleStore.creating"
          class="px-4 py-2 text-sm rounded-lg bg-primary text-on-primary disabled:opacity-50"
          @click="createAndAdd"
        >
          {{ peopleStore.creating ? 'Creating...' : 'Create & Add to Cast' }}
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm rounded-lg border border-border text-text"
          @click="closeCreateForm"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- Role & Character Assignment Panel (shown after person selected, before confirming) -->
    <div
      v-if="pendingPerson"
      class="rounded-xl border border-primary/40 bg-surface-2 p-4 flex flex-col gap-3"
    >
      <div class="flex items-center gap-3">
        <img
          loading="lazy"
          v-if="pendingPerson.profile_url"
          :src="pendingPerson.profile_url"
          :alt="pendingPerson.name"
          class="w-10 h-10 rounded-full object-cover shrink-0"
        />
        <div
          v-else
          class="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center shrink-0"
        >
          <User :size="16" class="text-text-muted" />
        </div>
        <span class="font-medium text-text">{{ pendingPerson.name }}</span>
        <button
          type="button"
          class="ml-auto text-text-muted hover:text-text"
          @click="pendingPerson = null"
        >
          <X :size="16" />
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-text-muted mb-1">Role *</label>
          <select
            v-model="pendingRole"
            class="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface-1 text-text"
          >
            <option value="actor">Actor</option>
            <option value="director">Director</option>
            <option value="writer">Writer</option>
            <option value="producer">Producer</option>
            <option value="cinematographer">Cinematographer</option>
            <option value="composer">Composer</option>
            <option value="editor">Editor</option>
          </select>
        </div>
        <div v-if="pendingRole === 'actor'">
          <label class="block text-xs font-medium text-text-muted mb-1">Character Name</label>
          <input
            v-model="pendingCharacter"
            type="text"
            placeholder="Character they play"
            class="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface-1 text-text"
          />
        </div>
      </div>

      <button
        type="button"
        class="self-start px-4 py-2 text-sm rounded-lg bg-primary text-on-primary"
        @click="confirmAdd"
      >
        Add to Cast
      </button>
    </div>

    <!-- Cast List -->
    <div v-if="modelValue.length > 0" class="flex flex-col gap-2">
      <div
        v-for="(member, index) in modelValue"
        :key="`${member.person_id}-${member.role}`"
        class="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-surface-1"
      >
        <!-- Avatar -->
        <img
          loading="lazy"
          v-if="member.profile_url"
          :src="member.profile_url"
          :alt="member.name"
          class="w-9 h-9 rounded-full object-cover shrink-0"
        />
        <div
          v-else
          class="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center shrink-0"
        >
          <User :size="14" class="text-text-muted" />
        </div>

        <!-- Info -->
        <div class="flex flex-col min-w-0 flex-1">
          <span class="text-sm font-medium text-text truncate">{{ member.name }}</span>
          <span class="text-xs text-text-muted truncate">
            {{ ROLE_LABELS[member.role] }}
            <template v-if="member.character"> — {{ member.character }}</template>
          </span>
        </div>

        <!-- Role badge -->
        <span class="text-xs px-2 py-0.5 rounded-full bg-primary-subtle text-primary shrink-0">
          {{ ROLE_LABELS[member.role] }}
        </span>

        <!-- Remove -->
        <button
          type="button"
          class="text-text-muted hover:text-red-500 transition-colors shrink-0"
          @click="removeMember(index)"
        >
          <X :size="16" />
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <p v-else class="text-sm text-text-muted">No cast members added yet. Search above to add.</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, User, X } from 'lucide-vue-next'
import { usePeopleStore } from '@/stores/peopleStore'
import type { CastMemberRequest, CastRole, CreatePersonRequest, Person } from '@/types/movies'

const props = defineProps<{
  modelValue: CastMemberRequest[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CastMemberRequest[]]
}>()

const peopleStore = usePeopleStore()

const ROLE_LABELS: Record<CastRole, string> = {
  actor: 'Actor',
  director: 'Director',
  writer: 'Writer',
  producer: 'Producer',
  cinematographer: 'Cinematographer',
  composer: 'Composer',
  editor: 'Editor',
}

// Search state
const searchQuery = ref('')
const searchResults = ref<Person[]>([])
const searching = ref(false)
const showDropdown = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Pending person (selected, awaiting role assignment)
const pendingPerson = ref<Person | null>(null)
const pendingRole = ref<CastRole>('actor')
const pendingCharacter = ref('')

// Inline create form state
const showCreateForm = ref(false)
const newPerson = ref<CreatePersonRequest>({ name: '' })

// ── Search logic ─────────────────────────────────────────────────────────────
function onSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  const q = searchQuery.value.trim()
  if (!q) {
    searchResults.value = []
    return
  }
  searching.value = true
  debounceTimer = setTimeout(async () => {
    searchResults.value = await peopleStore.searchPeople(q)
    searching.value = false
  }, 300)
}

function onBlur() {
  // Slight delay so mousedown on dropdown items fires first
  setTimeout(() => {
    showDropdown.value = false
  }, 150)
}

function closeDropdown() {
  showDropdown.value = false
  searchQuery.value = ''
  searchResults.value = []
}

// ── Select existing person ───────────────────────────────────────────────────
function selectExistingPerson(person: Person) {
  pendingPerson.value = person
  pendingRole.value = 'actor'
  pendingCharacter.value = ''
  closeDropdown()
}

// ── Inline create form ───────────────────────────────────────────────────────
function openCreateForm() {
  newPerson.value = { name: searchQuery.value.trim() }
  showCreateForm.value = true
  showDropdown.value = false
}

function closeCreateForm() {
  showCreateForm.value = false
  newPerson.value = { name: '' }
}

async function createAndAdd() {
  if (!newPerson.value.name?.trim()) return
  try {
    const created = await peopleStore.createPerson(newPerson.value)
    closeCreateForm()
    searchQuery.value = ''
    pendingPerson.value = created
    pendingRole.value = 'actor'
    pendingCharacter.value = ''
  } catch (err: any) {
    // 409 = duplicate — backend returns existing_id, surface it
    if (err?.response?.status === 409) {
      alert(`A person named "${newPerson.value.name}" already exists. Search for them instead.`)
    }
  }
}

// ── Confirm add to cast ──────────────────────────────────────────────────────
function confirmAdd() {
  if (!pendingPerson.value) return

  // Prevent adding same person in same role twice
  const alreadyAdded = props.modelValue.some(
    (m) => m.person_id === pendingPerson.value!.id && m.role === pendingRole.value,
  )
  if (alreadyAdded) {
    alert(`${pendingPerson.value.name} is already added as ${ROLE_LABELS[pendingRole.value]}.`)
    return
  }

  const updated: CastMemberRequest[] = [
    ...props.modelValue,
    {
      person_id: pendingPerson.value.id,
      name: pendingPerson.value.name,
      profile_url: pendingPerson.value.profile_url,
      tmdb_id: pendingPerson.value.tmdb_id,
      imdb_id: pendingPerson.value.imdb_id,
      role: pendingRole.value,
      character:
        pendingRole.value === 'actor' ? pendingCharacter.value.trim() || undefined : undefined,
      display_order: props.modelValue.length,
    },
  ]

  emit('update:modelValue', updated)
  pendingPerson.value = null
  pendingRole.value = 'actor'
  pendingCharacter.value = ''
}

// ── Remove ───────────────────────────────────────────────────────────────────
function removeMember(index: number) {
  const updated = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', updated)
}
</script>

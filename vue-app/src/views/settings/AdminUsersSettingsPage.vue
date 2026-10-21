<template>
  <div class="flex flex-col gap-y-6 max-w-5xl pb-10">
    <!-- Header -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <Shield class="text-primary" :size="24" />
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">User Management</h2>
      </div>
      <p class="font-content text-text-muted">
        Manage accounts, promote or demote users to moderator and admin roles, and moderate access.
      </p>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-surface-1 border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div class="flex flex-col">
          <span class="text-xs font-medium text-text-muted uppercase tracking-wider">Total Users</span>
          <span class="text-2xl font-bold font-heading text-text mt-1">{{ totalUsersCount }}</span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <Users :size="20" />
        </div>
      </div>

      <div class="bg-surface-1 border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div class="flex flex-col">
          <span class="text-xs font-medium text-text-muted uppercase tracking-wider">Staff (Admin/Mod)</span>
          <span class="text-2xl font-bold font-heading text-primary mt-1">{{ staffCount }}</span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <ShieldAlert :size="20" />
        </div>
      </div>

      <div class="bg-surface-1 border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div class="flex flex-col">
          <span class="text-xs font-medium text-text-muted uppercase tracking-wider">Suspended</span>
          <span class="text-2xl font-bold font-heading text-red-400 mt-1">{{ bannedCount }}</span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <UserX :size="20" />
        </div>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-surface-1 border border-border rounded-2xl p-3">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" :size="16" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or email..."
          class="w-full pl-9 pr-4 py-2 text-sm bg-surface-2 border border-border rounded-xl text-text placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div class="flex items-center gap-2">
        <select
          v-model="roleFilter"
          class="px-3 py-2 text-sm bg-surface-2 border border-border rounded-xl text-text focus:outline-none focus:border-primary transition-colors"
        >
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="moderator">Moderators</option>
          <option value="admin">Admins</option>
        </select>

        <button
          @click="fetchUsers"
          :disabled="loading"
          class="p-2 text-text-muted hover:text-text bg-surface-2 border border-border rounded-xl hover:bg-surface-3 transition-colors shrink-0"
          title="Refresh user list"
        >
          <RefreshCw :size="16" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- Users Table Container -->
    <div class="bg-surface-1 border border-border rounded-2xl overflow-hidden shadow-sm">
      <div v-if="loading && users.length === 0" class="p-12 flex flex-col items-center justify-center text-text-muted gap-3">
        <Loader2 class="animate-spin text-primary" :size="32" />
        <span class="text-sm">Loading users...</span>
      </div>

      <div v-else-if="filteredUsers.length === 0" class="p-12 text-center text-text-muted">
        <Users class="mx-auto mb-2 text-text-muted opacity-40" :size="36" />
        <p class="font-medium">No users found</p>
        <p class="text-xs text-text-muted mt-1">Try adjusting your search query or filters.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-border bg-surface-2/60 text-xs text-text-muted uppercase tracking-wider font-semibold">
              <th class="py-3 px-4">User</th>
              <th class="py-3 px-4">Role</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4">Joined</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border text-sm">
            <tr
              v-for="u in filteredUsers"
              :key="u.id"
              class="hover:bg-surface-2/40 transition-colors"
            >
              <!-- User Info -->
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0 uppercase"
                  >
                    {{ (u.name || u.email || 'U').charAt(0) }}
                  </div>
                  <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="font-bold text-text truncate">{{ u.name || 'Anonymous' }}</span>
                      <span v-if="u.id === authStore.user?.id" class="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-semibold">You</span>
                    </div>
                    <span class="text-xs text-text-muted truncate">{{ u.email }}</span>
                  </div>
                </div>
              </td>

              <!-- Role Badge -->
              <td class="py-3 px-4">
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                  :class="{
                    'bg-primary/15 text-primary border border-primary/30': u.role === 'admin',
                    'bg-blue-500/15 text-blue-400 border border-blue-500/30': u.role === 'moderator',
                    'bg-surface-2 text-text-muted border border-border': !u.role || u.role === 'user',
                  }"
                >
                  <Shield v-if="u.role === 'admin'" :size="12" />
                  <ShieldAlert v-else-if="u.role === 'moderator'" :size="12" />
                  <UserCheck v-else :size="12" />
                  {{ u.role || 'user' }}
                </span>
              </td>

              <!-- Status -->
              <td class="py-3 px-4">
                <span
                  v-if="u.banned"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30"
                  :title="u.banReason ? `Reason: ${u.banReason}` : 'Suspended'"
                >
                  <UserX :size="12" />
                  Suspended
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                >
                  <Check :size="12" />
                  Active
                </span>
              </td>

              <!-- Created At -->
              <td class="py-3 px-4 text-xs text-text-muted whitespace-nowrap">
                {{ formatDate(u.createdAt) }}
              </td>

              <!-- Actions -->
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <!-- Role Edit Button -->
                  <button
                    @click="openRoleDialog(u)"
                    :disabled="u.id === authStore.user?.id"
                    class="px-2.5 py-1 text-xs font-medium rounded-lg bg-surface-2 hover:bg-surface-3 text-text border border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Change user role"
                  >
                    Role
                  </button>

                  <!-- Ban / Unban Button -->
                  <button
                    v-if="!u.banned"
                    @click="openBanDialog(u)"
                    :disabled="u.id === authStore.user?.id || u.role === 'admin'"
                    class="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Suspend user account"
                  >
                    Suspend
                  </button>
                  <button
                    v-else
                    @click="handleUnban(u)"
                    :disabled="actionLoading"
                    class="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors disabled:opacity-40"
                    title="Unban user"
                  >
                    Restore
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Role Edit Dialog -->
    <Dialog
      v-model:visible="roleDialogVisible"
      modal
      header="Update User Role"
      :style="{ width: '90vw', maxWidth: '420px' }"
      class="bg-surface-1 border border-border rounded-2xl"
    >
      <div v-if="selectedUser" class="flex flex-col gap-4 py-2">
        <p class="text-sm text-text-muted">
          Assign a new role to <span class="font-bold text-text">{{ selectedUser.name || selectedUser.email }}</span>.
        </p>

        <div class="flex flex-col gap-2">
          <label
            v-for="role in (['user', 'moderator', 'admin'] as const)"
            :key="role"
            class="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all"
            :class="selectedRole === role ? 'border-primary bg-primary/10' : 'border-border bg-surface-2 hover:bg-surface-3'"
          >
            <div class="flex items-center gap-2.5">
              <input type="radio" :value="role" v-model="selectedRole" class="text-primary focus:ring-0" />
              <div class="flex flex-col">
                <span class="text-sm font-bold capitalize text-text">{{ role }}</span>
                <span class="text-xs text-text-muted">
                  {{
                    role === 'admin'
                      ? 'Full system access, manage all content & users'
                      : role === 'moderator'
                      ? 'Moderate catalog entries, ingest content & manage titles'
                      : 'Standard permissions: create and curate watchlists & media'
                  }}
                </span>
              </div>
            </div>
          </label>
        </div>

        <div class="flex items-center justify-end gap-2 mt-3">
          <button
            @click="roleDialogVisible = false"
            class="px-4 py-2 text-sm rounded-xl border border-border text-text hover:bg-surface-2 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleSaveRole"
            :disabled="actionLoading"
            class="px-5 py-2 text-sm rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Loader2 v-if="actionLoading" class="animate-spin" :size="14" />
            Save Role
          </button>
        </div>
      </div>
    </Dialog>

    <!-- Ban User Dialog -->
    <Dialog
      v-model:visible="banDialogVisible"
      modal
      header="Suspend User Account"
      :style="{ width: '90vw', maxWidth: '420px' }"
      class="bg-surface-1 border border-border rounded-2xl"
    >
      <div v-if="selectedUser" class="flex flex-col gap-4 py-2">
        <p class="text-sm text-text-muted">
          Are you sure you want to suspend <span class="font-bold text-text">{{ selectedUser.name || selectedUser.email }}</span>? They will be unable to access protected routes until unbanned.
        </p>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-text uppercase">Reason for Suspension</label>
          <input
            v-model="banReason"
            type="text"
            placeholder="e.g. Terms violation, spam, malicious activity"
            class="w-full px-3 py-2 text-sm bg-surface-2 border border-border rounded-xl text-text placeholder-text-muted focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        <div class="flex items-center justify-end gap-2 mt-3">
          <button
            @click="banDialogVisible = false"
            class="px-4 py-2 text-sm rounded-xl border border-border text-text hover:bg-surface-2 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleConfirmBan"
            :disabled="actionLoading"
            class="px-5 py-2 text-sm rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Loader2 v-if="actionLoading" class="animate-spin" :size="14" />
            Suspend Account
          </button>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { authClient } from '@/lib/auth-client'
import { useAuthStore } from '@/stores/authStore'
import toastHandler from '@/composables/toastHandler'
import Dialog from 'primevue/dialog'
import {
  Shield,
  ShieldAlert,
  Users,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Loader2,
  Check,
} from 'lucide-vue-next'
import type { UserRole } from 'shared-types'

interface AdminUserRecord {
  id: string
  name: string
  email: string
  role?: string
  banned?: boolean | null
  banReason?: string | null
  createdAt: string | Date
}

const authStore = useAuthStore()
const { showToast } = toastHandler()

const users = ref<AdminUserRecord[]>([])
const loading = ref(false)
const actionLoading = ref(false)

const searchQuery = ref('')
const roleFilter = ref<'all' | 'user' | 'moderator' | 'admin'>('all')

const roleDialogVisible = ref(false)
const banDialogVisible = ref(false)
const selectedUser = ref<AdminUserRecord | null>(null)
const selectedRole = ref<UserRole>('user')
const banReason = ref('')

async function fetchUsers() {
  loading.value = true
  try {
    const res = await authClient.admin.listUsers({
      query: {
        limit: 100,
      },
    })
    if (res.data?.users) {
      users.value = res.data.users as unknown as AdminUserRecord[]
    } else if (res.error) {
      showToast('error', 'Error', res.error.message || 'Failed to load users')
    }
  } catch (err: unknown) {
    console.error('Failed to fetch users:', err)
    showToast('error', 'Error', 'Failed to fetch users list')
  } finally {
    loading.value = false
  }
}

const totalUsersCount = computed(() => users.value.length)
const staffCount = computed(
  () => users.value.filter((u) => u.role === 'admin' || u.role === 'moderator').length
)
const bannedCount = computed(() => users.value.filter((u) => u.banned).length)

const filteredUsers = computed(() => {
  return users.value.filter((u) => {
    const matchesSearch =
      !searchQuery.value.trim() ||
      u.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.value.toLowerCase())

    const currentRole = u.role || 'user'
    const matchesRole = roleFilter.value === 'all' || currentRole === roleFilter.value

    return matchesSearch && matchesRole
  })
})

function openRoleDialog(user: AdminUserRecord) {
  selectedUser.value = user
  selectedRole.value = (user.role as UserRole) || 'user'
  roleDialogVisible.value = true
}

async function handleSaveRole() {
  if (!selectedUser.value) return
  actionLoading.value = true
  try {
    const res = await authClient.admin.setRole({
      userId: selectedUser.value.id,
      role: selectedRole.value as any,
    })
    if (res.error) {
      showToast('error', 'Error', res.error.message || 'Failed to update role')
    } else {
      showToast('success', 'Role Updated', `User role changed to ${selectedRole.value}`)
      selectedUser.value.role = selectedRole.value
      roleDialogVisible.value = false
    }
  } catch (err: unknown) {
    console.error('Failed to set role:', err)
    showToast('error', 'Error', 'Failed to update role')
  } finally {
    actionLoading.value = false
  }
}

function openBanDialog(user: AdminUserRecord) {
  selectedUser.value = user
  banReason.value = ''
  banDialogVisible.value = true
}

async function handleConfirmBan() {
  if (!selectedUser.value) return
  actionLoading.value = true
  try {
    const res = await authClient.admin.banUser({
      userId: selectedUser.value.id,
      banReason: banReason.value.trim() || undefined,
    })
    if (res.error) {
      showToast('error', 'Error', res.error.message || 'Failed to suspend user')
    } else {
      showToast('success', 'User Suspended', 'The user account has been suspended.')
      selectedUser.value.banned = true
      selectedUser.value.banReason = banReason.value.trim() || null
      banDialogVisible.value = false
    }
  } catch (err: unknown) {
    console.error('Failed to ban user:', err)
    showToast('error', 'Error', 'Failed to suspend user')
  } finally {
    actionLoading.value = false
  }
}

async function handleUnban(user: AdminUserRecord) {
  actionLoading.value = true
  try {
    const res = await authClient.admin.unbanUser({
      userId: user.id,
    })
    if (res.error) {
      showToast('error', 'Error', res.error.message || 'Failed to restore user')
    } else {
      showToast('success', 'User Restored', 'Account suspension removed.')
      user.banned = false
      user.banReason = null
    }
  } catch (err: unknown) {
    console.error('Failed to unban user:', err)
    showToast('error', 'Error', 'Failed to unban user')
  } finally {
    actionLoading.value = false
  }
}

function formatDate(dateVal: string | Date | undefined): string {
  if (!dateVal) return '-'
  try {
    const d = new Date(dateVal)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return String(dateVal)
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

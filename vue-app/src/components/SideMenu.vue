<template>
  <div>
    <Drawer
      v-model:visible="mainStore.showSideMenu"
      @hide="mainStore.showSideMenu = false"
      :dismissable="true"
      position="right"
      class="!w-full md:!w-[768px] !rounded-none md:!rounded-l-xl !bg-surface-1 !text-text font-content"
    >
      <template #header>
        <div class="flex justify-between items-center w-full font-heading">
          <h3 class="text-lg sm:text-xl md:text-2xl text-text font-heading">Menu</h3>
        </div>
      </template>

      <div class="w-full font-content">
        <div class="flex flex-col">
          <div class="w-full flex flex-col rounded-xl bg-surface-2 p-4 border border-border">
            <!-- Theme selector -->
            <div :class="buttonStyles">
              <Palette :size="16" class="text-text-muted" />
              <span>Theme</span>
              <Select
                :modelValue="theme"
                :options="[
                  { label: 'System', value: 'system' },
                  { label: 'Dark', value: 'dark' },
                  { label: 'Light', value: 'light' },
                ]"
                class="!ml-auto !w-auto !text-sm !rounded-lg"
                optionLabel="label"
                optionValue="value"
                @update:modelValue="handleThemeChange"
              />
            </div>

            <div class="mx-2 my-1 h-px bg-border" />

            <RouterLink
              :class="buttonStyles"
              to="/watchlist"
              @click="mainStore.showSideMenu = false"
            >
              <List :size="16" class="text-text-muted" />
              <span>Watchlist</span>
            </RouterLink>

            <div class="mx-2 my-1 h-px bg-border" />

            <RouterLink
              :class="buttonStyles"
              to="/languages"
              @click="mainStore.showSideMenu = false"
            >
              <Languages :size="16" class="text-text-muted" />
              <span>Languages</span>
            </RouterLink>

            <div class="mx-2 my-1 h-px bg-border" />

            <RouterLink :class="buttonStyles" to="/genres" @click="mainStore.showSideMenu = false">
              <Blocks :size="16" class="text-text-muted" />
              <span>Genres</span>
            </RouterLink>

            <div class="mx-2 my-1 h-px bg-border" />

            <RouterLink
              :class="buttonStyles"
              to="/settings"
              @click="mainStore.showSideMenu = false"
            >
              <Wrench :size="16" class="text-text-muted" />
              <span>Settings</span>
            </RouterLink>

            <div class="mx-2 my-1 h-px bg-border" />

            <a
              :class="buttonStyles"
              :href="DEVELOPER_PROFILE"
              rel="noopener noreferrer nofollow"
              target="_blank"
            >
              <UserCircle :size="16" class="text-text-muted" />
              <span>Developer Profile</span>
            </a>
          </div>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { Blocks, Languages, List, Palette, UserCircle, Wrench } from 'lucide-vue-next'
import { Drawer, Select } from 'primevue'
import { useMainStore } from '@/stores/mainStore'
import toastHandler from '@/composables/toastHandeler'
import { DEVELOPER_PROFILE } from '@/services/constants'
import { useTheme } from '@/composables/theme'

const mainStore = useMainStore()
const { showToast } = toastHandler()
const { theme, updateTheme } = useTheme()

const buttonStyles =
  'px-2 py-4 bg-transparent text-text flex items-center gap-x-3 rounded-xl text-base font-normal font-content transition-colors duration-200 hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const handleThemeChange = (selectedTheme: string) => {
  updateTheme((selectedTheme as 'light' | 'dark' | 'system') || 'system')
  showToast(
    'info',
    'Theme Changed',
    `Switched to ${selectedTheme === 'system' ? 'system' : selectedTheme} mode`,
  )
}
</script>

<style lang="css" scoped></style>

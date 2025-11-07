<template>
  <div>
    <Drawer
      v-model:visible="mainStore.showSideMenu"
      @hide="mainStore.showSideMenu = false"
      :dismissable="true"
      position="right"
      class="!w-full md:!w-[768px] rounded-none md:!rounded-l-xl !bg-slate-50 dark:!bg-slate-900 !text-indigo-900 dark!text-indigo-200 font-content"
    >
      <template #header>
        <div class="flex justify-between items-center w-full font-heading">
          <h3 class="text-lg sm:text-xl md:text-2xl text-slate-900 dark:text-slate-100">Menu</h3>
        </div>
      </template>

      <div class="w-full font-content">
        <div class="flex flex-col">
          <div
            class="w-full flex flex-col rounded-xl bg-blue-50 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700"
          >
            <div :class="buttonStyles">
              <Palette :size="16" class="text-slate-500" />
              <span>Theme</span>
              <Select
                :modelValue="theme"
                :options="[
                  { label: 'System', value: 'system' },
                  { label: 'Dark', value: 'dark' },
                  { label: 'Light', value: 'light' },
                ]"
                class="!ml-auto !w-auto !text-sm !rounded-lg !bg-blue-100 dark:!bg-indigo-950 !text-slate-600 dark:!text-slate-400 !border-blue-300 dark:!border-indigo-800"
                labelClass="!text-slate-600	dark:!text-slate-400"
                optionLabel="label"
                optionValue="value"
                @update:modelValue="handleThemeChange"
              />
            </div>

            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-slate-200 dark:bg-slate-700"></div>

            <RouterLink
              :class="buttonStyles"
              :to="'/watchlist'"
              class="text-slate-900 dark:text-slate-100 !border-none !flex !items-center !justify-start shadow-none"
            >
              <List :size="16" class="text-slate-500" />
              <span>Watchlist</span>
            </RouterLink>

            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-slate-200 dark:bg-slate-700"></div>

            <RouterLink
              :class="buttonStyles"
              :to="'/languages'"
              class="text-slate-900 dark:text-slate-100 !border-none !flex !items-center !justify-start shadow-none"
            >
              <Blocks :size="16" class="text-slate-500" />
              <span>Languages</span>
            </RouterLink>

            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-slate-200 dark:bg-slate-700"></div>

            <RouterLink
              :class="buttonStyles"
              :to="'/genres'"
              class="text-slate-900 dark:text-slate-100 !border-none !flex !items-center !justify-start shadow-none"
            >
              <Blocks :size="16" class="text-slate-500" />
              <span>Genres</span>
            </RouterLink>

            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-slate-200 dark:bg-slate-700"></div>

            <RouterLink
              :class="buttonStyles"
              :to="'/settings'"
              class="text-slate-900 dark:text-slate-100 !border-none !flex !items-center !justify-start shadow-none"
            >
              <Wrench :size="16" class="text-slate-500" />
              <span>Settings</span>
            </RouterLink>

            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-slate-200 dark:bg-slate-700"></div>

            <a
              :class="buttonStyles"
              :href="DEVELOPER_PROFILE"
              class="text-slate-900 dark:text-slate-100 !border-none !flex !items-center !justify-start shadow-none"
              rel="noopener noreferrer nofollow"
              target="_blank"
            >
              <UserCircle :size="16" class="text-slate-500" />
              <span>Developer Profile</span>
            </a>
          </div>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { Blocks, List, Palette, UserCircle, Wrench } from 'lucide-vue-next'
import { Drawer, Select } from 'primevue'
// import { ref } from "vue";
import { useMainStore } from '@/stores/mainStore'
import toastHandler from '@/composables/toastHandeler'
// import { useTheme } from "@primeuix/themes";
import { DEVELOPER_PROFILE } from '@/services/constants'
import { useTheme } from '@/composables/theme'

const mainStore = useMainStore()
const { showToast } = toastHandler()
const { theme, updateTheme } = useTheme()

// const isPanelCollapsed = ref(true);

const buttonStyles =
  '!px-2 !py-4 !bg-transparent !text-slate-900	dark:!text-slate-100 flex items-center !gap-x-3 !rounded-xl *:text-lg font-normal font-content transition-colors duration-200 !border-none'

// const togglePanel = () => {
//   isPanelCollapsed.value = !isPanelCollapsed.value;
// };

// Theme change handler
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

<template>
  <Teleport to="body">
    <Transition name="trailer-fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-100 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 md:p-10"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        :aria-label="modalTitle"
        @click.self="handleClose"
      >
        <!-- Modal Card Container -->
        <div class="w-full max-w-5xl flex flex-col gap-3 animate-scale-in">
          <!-- Header Bar -->
          <div class="flex items-center justify-between px-1">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <Film :size="18" />
              </div>
              <div class="flex flex-col min-w-0">
                <h3 class="text-white font-semibold text-base sm:text-lg truncate">
                  {{ modalTitle }}
                </h3>
                <span v-if="badgeText" class="text-xs text-white/50">
                  {{ badgeText }}
                </span>
              </div>
            </div>

            <button
              type="button"
              class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer text-sm font-medium backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Close trailer"
              @click="handleClose"
            >
              <span>Close</span>
              <X :size="18" />
            </button>
          </div>

          <!-- Video / Content Container (16:9 Aspect Ratio) -->
          <div
            class="w-full aspect-video bg-black relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10"
          >
            <!-- Direct Video File (.mp4, .webm, .ogg) -->
            <video
              v-if="isDirectVideo && resolvedUrl"
              class="w-full h-full object-contain"
              :src="resolvedUrl"
              controls
              autoplay
              playsinline
            >
              Your browser does not support the video tag.
            </video>

            <!-- Embedded Iframe (YouTube / Vimeo / Generic) -->
            <iframe
              v-else-if="resolvedUrl"
              class="w-full h-full"
              :src="resolvedUrl"
              title="Video Trailer Player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>

            <!-- Fallback State -->
            <div
              v-else
              class="w-full h-full flex flex-col items-center justify-center gap-3 text-white/60 p-6 text-center"
            >
              <AlertCircle :size="36" class="text-white/40" />
              <p class="text-base font-medium text-white/80">Trailer unavailable</p>
              <p class="text-xs text-white/40 max-w-sm">
                No playable trailer stream or video embed could be found for this title.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onBeforeUnmount } from 'vue';
import { X, Film, AlertCircle } from 'lucide-vue-next';

interface Props {
  visible: boolean;
  trailerKey?: string | null;
  videoUrl?: string | null;
  title?: string;
  mediaType?: 'movie' | 'tv';
}

const props = withDefaults(defineProps<Props>(), {
  trailerKey: null,
  videoUrl: null,
  title: 'Trailer',
  mediaType: undefined,
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}>();

const modalTitle = computed(() => {
  if (props.title && props.title !== 'Trailer') {
    return `${props.title} — Official Trailer`;
  }
  return 'Official Trailer';
});

const badgeText = computed(() => {
  if (props.mediaType === 'movie') return 'Movie Preview';
  if (props.mediaType === 'tv') return 'TV Series Preview';
  return '';
});

// Check if direct video file (.mp4, .webm, .ogg)
const isDirectVideo = computed(() => {
  if (!props.videoUrl) return false;
  const clean = props.videoUrl.trim().toLowerCase();
  return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.ogg');
});

// URL Resolution logic:
const resolvedUrl = computed(() => {
  // If not visible, return empty string so iframe src is completely detached and stops playing audio
  if (!props.visible) return '';

  // 1. YouTube key priority (from TMDB)
  if (props.trailerKey && props.trailerKey.trim()) {
    const key = props.trailerKey.trim();
    return `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
  }

  // 2. Video URL parsing
  if (!props.videoUrl || !props.videoUrl.trim()) {
    return '';
  }

  const url = props.videoUrl.trim();

  // If already direct video
  if (isDirectVideo.value) {
    return url;
  }

  // YouTube URL parsing
  let ytKey = '';
  if (url.includes('youtube.com/watch?v=')) {
    ytKey = url.split('v=')[1]?.split('&')[0] ?? '';
  } else if (url.includes('youtu.be/')) {
    ytKey = url.split('youtu.be/')[1]?.split('?')[0] ?? '';
  } else if (url.includes('youtube.com/embed/')) {
    ytKey = url.split('youtube.com/embed/')[1]?.split('?')[0] ?? '';
  } else if (url.includes('youtube.com/shorts/')) {
    ytKey = url.split('youtube.com/shorts/')[1]?.split('?')[0] ?? '';
  }

  if (ytKey) {
    return `https://www.youtube-nocookie.com/embed/${ytKey}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
  }

  // Vimeo URL parsing
  const vimeoMatch = url.match(/vimeo\.com\/([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  // Generic fallback (e.g. embed links)
  return url;
});

function handleClose() {
  emit('update:visible', false);
  emit('close');
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    handleClose();
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      window.addEventListener('keydown', handleKeyDown);
    } else {
      window.removeEventListener('keydown', handleKeyDown);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.trailer-fade-enter-active,
.trailer-fade-leave-active {
  transition: opacity 0.25s ease;
}

.trailer-fade-enter-from,
.trailer-fade-leave-to {
  opacity: 0;
}

.animate-scale-in {
  animation: scaleIn 0.25s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>

<template>
  <div
    class="w-full h-full overflow-y-auto bg-surface-0 hide-scrollbar relative"
    @scroll="handleScroll"
  >
    <!-- Sticky Header -->
    <nav
      :class="[
        'fixed top-0 w-full z-50 bg-surface-0/90 backdrop-blur-xl border-b border-white/5 transition-all duration-300 flex items-center justify-between px-6 py-3',
        showStickyHeader
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-full pointer-events-none'
      ]"
    >
      <div class="flex items-center gap-4">
        <button
          @click="router.back()"
          class="p-2 rounded-full hover:bg-surface-2 transition-colors text-text"
        >
          <ArrowLeft :size="20" />
        </button>
        <AppImage
          v-if="show?.poster_url"
          :src="show.poster_url"
          type="tv"
          class="w-8 h-12 rounded shadow-sm object-cover border border-border"
        />
        <span class="font-heading font-bold text-lg text-text line-clamp-1">
          {{ show?.title }}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="authStore.isAuthenticated && !isInWatchlist"
          @click="addToWatchlist"
          class="px-4 py-2 bg-primary text-on-primary text-sm font-bold rounded-full hover:bg-primary/90 transition-colors flex items-center gap-1.5"
        >
          <Plus :size="16" />
          <span>Watchlist</span>
        </button>
      </div>
    </nav>

    <!-- Background Image that blends into the page (Parallax effect) -->
    <div
      v-if="show && !loading"
      class="absolute top-0 left-0 w-full h-[80vh] pointer-events-none z-0 overflow-hidden"
    >
      <div
        class="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        :style="{
          backgroundImage: `url(${show.backdrop_url || show.poster_url})`,
          transform: `translateY(${scrollY * 0.4}px)`
        }"
      ></div>
      <div class="absolute inset-0 bg-black/40"></div>
      <div
        class="absolute inset-0 bg-linear-to-t from-surface-0 via-surface-0/90 to-transparent"
      ></div>
    </div>

    <!-- Back Button (Hero) -->
    <button
      @click="router.back()"
      class="absolute top-4 sm:top-6 left-4 sm:left-6 z-40 p-2 rounded-full bg-surface-1/70 text-text backdrop-blur-md border border-border hover:bg-surface-2 hover:scale-105 active:scale-95 transition-all shadow-lg"
      title="Go Back"
      :class="{ 'opacity-0 pointer-events-none': showStickyHeader }"
    >
      <ArrowLeft :size="24" />
    </button>

    <!-- Skeleton Loader -->
    <div
      v-if="loading"
      class="relative z-10 flex flex-col animate-pulse min-h-full p-6 md:p-10 pt-[20vh]"
    >
      <div class="flex flex-col md:flex-row gap-8 items-start">
        <div class="w-48 md:w-64 aspect-2/3 bg-surface-3 rounded-2xl shrink-0"></div>
        <div class="flex flex-col gap-4 w-full pb-4 pt-10">
          <div class="h-12 w-3/4 bg-surface-3 rounded-xl"></div>
          <div class="h-6 w-1/2 bg-surface-3 rounded-lg"></div>
          <div class="flex gap-4 mt-4">
            <div class="h-12 w-32 bg-surface-3 rounded-full"></div>
            <div class="h-12 w-48 bg-surface-3 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="relative z-10 p-8 flex flex-col items-center justify-center min-h-full gap-4 text-center"
    >
      <div class="p-4 rounded-full bg-red-500/10 text-red-500">
        <AlertCircle :size="48" />
      </div>
      <h2 class="text-2xl font-bold text-text">Failed to load show</h2>
      <p class="text-text-muted">{{ error }}</p>
      <button
        @click="loadShow"
        class="px-6 py-2 bg-surface-2 rounded-lg hover:bg-surface-3 transition-colors mt-2"
      >
        Try Again
      </button>
    </div>

    <!-- Main Content -->
    <div
      v-else-if="show"
      class="relative z-10 flex flex-col min-h-full pt-[15vh] md:pt-[25vh] pb-20"
    >
      <!-- HERO SECTION -->
      <div
        class="px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12"
      >
        <!-- Poster -->
        <div
          class="w-48 sm:w-56 md:w-64 lg:w-72 aspect-2/3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] shrink-0 overflow-hidden border border-white/10 bg-surface-3 group relative"
        >
          <AppImage
            :src="show.poster_url"
            type="tv"
            class="w-full h-full group-hover:scale-105 transition-transform duration-700 object-cover"
          />
        </div>

        <!-- Info Column -->
        <div
          class="flex flex-col items-center md:items-start flex-1 gap-4 sm:gap-6 w-full pt-2 sm:pt-6 md:pt-0 lg:pt-8 text-center md:text-left"
        >
          <!-- Title -->
          <h1
            class="text-3xl sm:text-4xl lg:text-6xl font-heading font-black tracking-tight text-text drop-shadow-sm leading-tight"
          >
            {{ show.title }}
          </h1>

          <!-- Metadata Row -->
          <div
            class="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-text-muted"
          >
            <span
              v-if="show.first_air_date"
              class="px-3 py-1 rounded-full bg-surface-2/80 text-text backdrop-blur-md border border-border shadow-xs"
            >
              {{ new Date(show.first_air_date).getFullYear() }}
              <template v-if="show.status === 'ended' && show.last_air_date">
                - {{ new Date(show.last_air_date).getFullYear() }}
              </template>
              <template v-else-if="show.status !== 'ended'">- Present</template>
            </span>
            <span
              v-if="show.network"
              class="px-3 py-1 rounded-full bg-surface-2/80 text-text backdrop-blur-md border border-border shadow-xs flex items-center gap-1.5"
            >
              <Tv
                :size="14"
                class="sm:w-4 sm:h-4"
              />
              {{ show.network }}
            </span>
            <span
              class="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/20 uppercase tracking-wider text-[10px] sm:text-xs shadow-xs font-bold"
            >
              {{ prettyStatus(show.status) }}
            </span>

            <div
              v-if="show?.genres?.length"
              class="w-px h-4 bg-border mx-1 hidden sm:block"
            ></div>

            <!-- Genres -->
            <RouterLink
              v-for="genre in show?.genres"
              :key="genre.id"
              :to="`/genres/${genre.slug}`"
              class="hover:text-primary text-text-muted transition-colors hover:underline"
            >
              {{ genre.name }}
            </RouterLink>
          </div>

          <!-- Progress Bar (Only if in watchlist) -->
          <div
            v-if="isInWatchlist && show?.episode_count && show.episode_count > 0"
            class="flex flex-col gap-2 w-full max-w-md mt-2"
          >
            <div class="flex items-center justify-between text-sm font-medium">
              <span class="text-text">Watched</span>
              <span class="text-text-muted">
                {{ watchedEpisodesSet.size }} / {{ show.episode_count }} Episodes
              </span>
            </div>
            <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary transition-all duration-500 rounded-full"
                :style="{ width: `${progressPercentage}%` }"
              ></div>
            </div>
          </div>

          <!-- Action Row -->
          <div
            class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mt-4 w-full max-w-md md:max-w-none"
          >
            <!-- Watch Trailer Button -->
            <button
              v-if="hasTrailer"
              type="button"
              @click="openTrailerModal()"
              class="flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-black rounded-full font-bold hover:bg-primary-hover active:scale-95 transition-all shadow-lg shadow-primary/20 whitespace-nowrap cursor-pointer"
            >
              <Play :size="18" class="fill-current" />
              Watch Trailer
            </button>

            <!-- Watchlist and Options Wrapper -->
            <div class="flex items-center gap-3 w-full sm:w-auto">
              <!-- Watchlist -->
              <div class="relative flex-1 sm:flex-none">
                <button
                  v-if="!authStore.isAuthenticated"
                  @click="router.push('/login')"
                  class="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-surface-2/80 backdrop-blur-md text-text rounded-full font-bold hover:bg-surface-3 transition-colors border border-border whitespace-nowrap"
                >
                  Sign in
                </button>
                <template v-else>
                  <button
                    v-if="!isInWatchlist"
                    @click="addToWatchlist"
                    class="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-surface-2/80 backdrop-blur-md text-text rounded-full font-bold hover:bg-surface-3 hover:border-primary/50 active:scale-95 transition-all border border-border whitespace-nowrap"
                  >
                    <Plus :size="20" />
                    Add to Watchlist
                  </button>
                  <div
                    v-else
                    class="relative w-full"
                    ref="watchlistDropdownRef"
                  >
                    <button
                      @click="watchlistMenuOpen = !watchlistMenuOpen"
                      class="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary/20 backdrop-blur-md text-primary rounded-full font-bold hover:bg-primary/30 active:scale-95 transition-all border border-primary/30 whitespace-nowrap"
                    >
                      <Bookmark
                        v-if="watchlistItem?.status === 'want_to_watch'"
                        :size="20"
                      />
                      <PlayCircle
                        v-else-if="watchlistItem?.status === 'watching'"
                        :size="20"
                      />
                      <CheckCircle2
                        v-else
                        :size="20"
                      />
                      {{ prettyWatchlistStatus(watchlistItem?.status) }}
                      <ChevronDown
                        :size="16"
                        :class="{ 'rotate-180': watchlistMenuOpen }"
                        class="transition-transform shrink-0"
                      />
                    </button>

                    <!-- Dropdown -->
                    <div
                      v-if="watchlistMenuOpen"
                      class="absolute top-full left-0 mt-2 w-full sm:w-48 bg-surface-2/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 text-left"
                    >
                      <button
                        @click="updateStatus('want_to_watch')"
                        class="text-left px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-3 transition-colors flex items-center gap-2"
                        :class="{
                          'text-primary bg-primary/10': watchlistItem?.status === 'want_to_watch'
                        }"
                      >
                        <Bookmark :size="16" />
                        Want to watch
                      </button>
                      <button
                        @click="updateStatus('watching')"
                        class="text-left px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-3 transition-colors flex items-center gap-2"
                        :class="{
                          'text-primary bg-primary/10': watchlistItem?.status === 'watching'
                        }"
                      >
                        <PlayCircle :size="16" />
                        Watching
                      </button>
                      <button
                        @click="updateStatus('watched')"
                        class="text-left px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-3 transition-colors flex items-center gap-2"
                        :class="{
                          'text-primary bg-primary/10': watchlistItem?.status === 'watched'
                        }"
                      >
                        <CheckCircle2 :size="16" />
                        Watched
                      </button>
                      <div class="h-px bg-white/10 my-1"></div>
                      <button
                        @click="removeFromWatchlist"
                        class="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <Trash2 :size="16" />
                        Remove
                      </button>
                    </div>
                  </div>
                </template>
              </div>

              <!-- More Options -->
              <div
                class="relative shrink-0"
                ref="moreOptionsRef"
              >
                <button
                  @click="moreOptionsOpen = !moreOptionsOpen"
                  class="w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center rounded-full bg-surface-2/80 backdrop-blur-md border border-border hover:bg-surface-3 transition-colors text-text-muted hover:text-text"
                >
                  <MoreHorizontal :size="20" />
                </button>
                <div
                  v-if="moreOptionsOpen"
                  class="absolute top-full right-0 mt-2 w-40 bg-surface-2/95 backdrop-blur-xl border border-border rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1"
                >
                  <button
                    @click="blockShow"
                    class="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                  >
                    <Ban :size="16" />
                    Block Show
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Synopsis -->
          <div class="mt-2">
            <p class="text-lg text-text/80 leading-relaxed font-sans max-w-4xl">
              {{ show.description || 'No overview available.' }}
            </p>
          </div>
        </div>
      </div>

      <!-- TABS NAVIGATION -->
      <div
        class="mt-12 sticky top-17 z-30 bg-surface-0/90 backdrop-blur-md border-b border-border px-6 md:px-12 transition-all"
        :class="showStickyHeader ? 'top-17' : 'top-0'"
      >
        <div class="max-w-7xl mx-auto flex gap-8">
          <button
            @click="activeTab = 'overview'"
            :class="[
              'pb-4 text-base font-bold transition-colors relative',
              activeTab === 'overview' ? 'text-primary' : 'text-text-muted hover:text-text'
            ]"
          >
            Overview
            <div
              v-if="activeTab === 'overview'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"
            ></div>
          </button>
          <button
            @click="switchToEpisodes"
            :class="[
              'pb-4 text-base font-bold transition-colors relative',
              activeTab === 'episodes' ? 'text-primary' : 'text-text-muted hover:text-text'
            ]"
          >
            Episodes
            <div
              v-if="activeTab === 'episodes'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"
            ></div>
          </button>
          <button
            v-if="hasSpecials"
            @click="switchToSpecials"
            :class="[
              'pb-4 text-base font-bold transition-colors relative flex items-center gap-1.5',
              activeTab === 'specials' ? 'text-primary' : 'text-text-muted hover:text-text'
            ]"
          >
            <Sparkles :size="15" class="text-amber-400" />
            Specials
            <div
              v-if="activeTab === 'specials'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"
            ></div>
          </button>
          <button
            @click="activeTab = 'cast'"
            :class="[
              'pb-4 text-base font-bold transition-colors relative',
              activeTab === 'cast' ? 'text-primary' : 'text-text-muted hover:text-text'
            ]"
          >
            Cast & Crew
            <div
              v-if="activeTab === 'cast'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"
            ></div>
          </button>
          <button
            v-if="similarShows.length"
            @click="activeTab = 'related'"
            :class="[
              'pb-4 text-base font-bold transition-colors relative',
              activeTab === 'related' ? 'text-primary' : 'text-text-muted hover:text-text'
            ]"
          >
            More Like This
            <div
              v-if="activeTab === 'related'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"
            ></div>
          </button>
        </div>
      </div>

      <!-- TABS CONTENT -->
      <div class="px-6 md:px-12 max-w-7xl mx-auto w-full mt-8">
        <!-- OVERVIEW TAB -->
        <div
          v-if="activeTab === 'overview'"
          class="flex flex-col gap-10"
        >
          <!-- Trailers -->
          <div
            v-if="displayTrailers.length"
            class="flex flex-col gap-5"
          >
            <h2 class="text-2xl font-heading font-bold text-text flex items-baseline gap-3">
              Trailers & Clips
            </h2>
            <div class="flex overflow-x-auto gap-4 md:gap-6 pb-6 pt-2 snap-x hide-scrollbar">
              <div
                v-for="video in displayTrailers"
                :key="video.id"
                @click="playVideo(video.url, video.trailer_key)"
                class="flex flex-col gap-3 w-64 md:w-80 shrink-0 snap-start group cursor-pointer"
              >
                <div
                  class="w-full aspect-video rounded-2xl bg-surface-2 overflow-hidden border-2 border-transparent group-hover:border-primary/50 shadow-md group-hover:shadow-xl transition-all relative"
                >
                  <!-- Thumbnail -->
                  <AppImage
                    :src="video.thumbnail_url"
                    type="movie"
                    class="w-full h-full object-cover"
                  />
                  <div
                    class="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center"
                  >
                    <div
                      class="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white shadow-lg"
                    >
                      <Play
                        :size="20"
                        fill="currentColor"
                        class="ml-1"
                      />
                    </div>
                  </div>
                </div>
                <div class="flex flex-col w-full px-1">
                  <div class="text-sm md:text-base font-bold text-text leading-tight line-clamp-1">
                    {{ video.title }}
                  </div>
                  <div class="text-xs text-text-muted mt-1">{{ video.type }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Specific Details Grid -->
          <div
            class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 p-5 md:p-8 rounded-3xl bg-surface-1 border border-border"
          >
            <div
              v-if="show.first_air_date"
              class="flex flex-col gap-1"
            >
              <span
                class="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-widest"
              >
                First Aired
              </span>
              <span class="text-sm md:text-base font-medium text-text">
                {{
                  new Date(show.first_air_date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                }}
              </span>
            </div>
            <div
              v-if="show.network"
              class="flex flex-col gap-1"
            >
              <span
                class="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-widest"
              >
                Network
              </span>
              <span class="text-sm md:text-base font-medium text-text">{{ show.network }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span
                class="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-widest"
              >
                Status
              </span>
              <span class="text-sm md:text-base font-medium text-text capitalize">
                {{ prettyStatus(show.status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- EPISODES & SPECIALS TAB -->
        <div
          v-else-if="activeTab === 'episodes' || activeTab === 'specials'"
          class="flex flex-col gap-6"
        >
          <!-- Header / Controls -->
          <div class="flex flex-wrap items-center justify-between gap-4">
            <h2 class="text-2xl font-heading font-bold text-text hidden md:block">
              {{ activeTab === 'specials' ? 'Special Episodes' : 'Episodes' }}
            </h2>
            <div
              class="flex items-center gap-3 relative ml-auto w-full md:w-auto overflow-x-auto hide-scrollbar"
            >
              <button
                class="shrink-0 flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface-3 transition-colors rounded-full text-text font-medium border border-border text-sm"
              >
                <Star
                  :size="16"
                  class="text-text-muted"
                />
                Ratings
              </button>
              <button
                class="shrink-0 flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface-3 transition-colors rounded-full text-text font-medium border border-border text-sm"
              >
                <ArrowDownUp
                  :size="16"
                  class="text-text-muted"
                />
                Oldest
              </button>
              <button
                @click="toggleCurrentSeasonWatched"
                :disabled="bulkMarkingLoading || !activeSeasonEpisodes.length"
                class="shrink-0 flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface-3 transition-colors rounded-full text-text font-medium border border-border text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Loader2
                  v-if="bulkMarkingLoading"
                  :size="16"
                  class="animate-spin text-primary"
                />
                <CheckCircle2
                  v-else
                  :size="16"
                  :class="isCurrentSeasonAllWatched ? 'text-primary fill-primary/20' : 'text-text-muted'"
                />
                <span>{{ isCurrentSeasonAllWatched ? 'Season Watched' : 'Mark Season Watched' }}</span>
              </button>
              <!-- Season Dropdown -->
              <div
                class="relative shrink-0"
                ref="seasonDropdownRef"
              >
                <button
                  @click="seasonMenuOpen = !seasonMenuOpen"
                  class="flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface-3 transition-colors rounded-full text-text font-medium border border-border text-sm"
                >
                  {{ activeSeason?.title || (activeTab === 'specials' ? 'Specials' : 'Season 1') }}
                  <ChevronDown :size="16" />
                </button>
                <div
                  v-if="seasonMenuOpen"
                  class="absolute top-full right-0 mt-2 w-52 bg-surface-2/95 backdrop-blur-xl border border-border rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 max-h-64 overflow-y-auto hide-scrollbar"
                >
                  <button
                    v-for="season in regularSeasons"
                    :key="season.id"
                    @click="
                      selectSeason(season);
                      seasonMenuOpen = false;
                    "
                    class="text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    :class="
                      activeSeasonId === season.id
                        ? 'bg-primary/20 text-primary'
                        : 'text-white/70 hover:bg-surface-3 hover:text-white'
                    "
                  >
                    {{ season.title }}
                  </button>
                  <div
                    v-if="hasSpecials && regularSeasons.length"
                    class="my-1 border-t border-white/10"
                  ></div>
                  <button
                    v-if="specialsSeason"
                    :key="specialsSeason.id"
                    @click="
                      selectSeason(specialsSeason);
                      seasonMenuOpen = false;
                    "
                    class="text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between"
                    :class="
                      activeSeasonId === specialsSeason.id
                        ? 'bg-primary/20 text-primary'
                        : 'text-white/70 hover:bg-surface-3 hover:text-white'
                    "
                  >
                    <span>{{ specialsSeason.title || 'Specials' }}</span>
                    <span class="text-xs px-1.5 py-0.5 rounded bg-white/10 text-amber-300 font-semibold">S0</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Episodes List (Horizontal) -->
          <div class="relative group/episodes -mx-6 md:mx-0 px-6 md:px-0">
            <!-- Left Arrow -->
            <button
              @click="scrollEpisodes('left')"
              class="absolute left-6 md:-left-4 top-[calc(50%-1.5rem)] md:top-1/2 md:-translate-y-1/2 z-10 w-12 h-12 hidden md:flex items-center justify-center bg-black/60 backdrop-blur-sm text-white rounded-full opacity-0 group-hover/episodes:opacity-100 transition-opacity hover:bg-black/80 hover:scale-110 shadow-xl border border-white/10"
            >
              <ChevronLeft :size="24" />
            </button>

            <!-- Horizontal Container -->
            <div
              ref="episodesContainerRef"
              class="flex overflow-x-auto gap-4 md:gap-6 pb-6 pt-2 snap-x hide-scrollbar scroll-smooth"
            >
              <div
                v-if="loadingEpisodes"
                class="animate-pulse flex gap-4 md:gap-6 w-full"
              >
                <div
                  v-for="i in 4"
                  :key="i"
                  class="w-64 md:w-80 shrink-0 aspect-video bg-surface-2 rounded-2xl"
                ></div>
              </div>
              <div
                v-else-if="activeSeasonEpisodes.length === 0"
                class="text-white/50 italic p-4"
              >
                No episodes found for this season.
              </div>

              <!-- Episode Card -->
              <div
                v-for="episode in activeSeasonEpisodes"
                :key="episode.id"
                class="flex flex-col gap-3 w-64 md:w-80 shrink-0 snap-start group cursor-pointer"
                @click="toggleEpisodeWatched(episode)"
              >
                <!-- Thumbnail -->
                <div
                  class="w-full aspect-video rounded-2xl bg-surface-3 overflow-hidden border border-white/5 group-hover:border-white/20 shadow-md transition-all relative"
                >
                  <AppImage
                    :src="
                      episode.still_url ||
                      activeSeason?.poster_url ||
                      show.backdrop_url ||
                      show.poster_url
                    "
                    type="tv"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  <div
                    class="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors"
                  ></div>

                  <!-- Badge E1 -->
                  <div
                    class="absolute top-2 left-2 bg-surface-0/80 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white shadow-sm"
                  >
                    E{{ episode.episode_number }}
                  </div>

                  <!-- Watched indicator -->
                  <div
                    v-if="isEpisodeWatched(episode.id)"
                    class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full p-1 shadow-sm border border-white/10 text-primary"
                  >
                    <CheckCircle2 :size="14" />
                  </div>

                  <!-- Runtime badge -->
                  <div
                    class="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white tracking-wider"
                  >
                    {{ episode.runtime || '45' }}m
                  </div>

                  <!-- Play Icon on hover -->
                  <div
                    class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  >
                    <div
                      class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg border border-white/20"
                    >
                      <Play
                        :size="20"
                        fill="currentColor"
                        class="ml-1"
                      />
                    </div>
                  </div>
                </div>
                <!-- Details -->
                <div class="flex flex-col w-full px-1">
                  <h3 class="text-sm md:text-base font-bold text-text leading-tight line-clamp-1">
                    {{ episode.title }}
                  </h3>
                  <p class="text-xs md:text-sm text-text-muted mt-1 line-clamp-2 leading-relaxed">
                    {{ episode.overview || 'No overview available.' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Right Arrow -->
            <button
              @click="scrollEpisodes('right')"
              class="absolute right-6 md:-right-4 top-[calc(50%-1.5rem)] md:top-1/2 md:-translate-y-1/2 z-10 w-12 h-12 hidden md:flex items-center justify-center bg-black/60 backdrop-blur-sm text-white rounded-full opacity-0 group-hover/episodes:opacity-100 transition-opacity hover:bg-black/80 hover:scale-110 shadow-xl border border-white/10"
            >
              <ChevronRight :size="24" />
            </button>
          </div>
        </div>

        <!-- CAST TAB -->
        <div v-else-if="activeTab === 'cast'">
          <div
            v-if="displayCast.length > 0"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
          >
            <div
              v-for="member in displayCast"
              :key="`${member.id}-${member.role}`"
              class="flex flex-col items-center gap-3 group"
            >
              <div
                class="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary/50 shadow-md group-hover:shadow-xl transition-all flex items-center justify-center relative bg-surface-2"
              >
                <AppImage
                  v-if="member.profile_url"
                  :src="member.profile_url"
                  type="person"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  class="w-full h-full bg-surface-3 flex items-center justify-center text-3xl font-bold text-white/30 font-heading tracking-widest"
                >
                  {{ getInitials(member.name) }}
                </div>
              </div>
              <div class="text-center w-full">
                <div class="text-base font-bold text-text line-clamp-2 leading-tight">
                  {{ member.name }}
                </div>
                <div class="text-sm text-text-muted line-clamp-1 mt-1">
                  {{ member.character || member.role }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-white/50 italic py-12 text-center">
            No cast information available for this series.
          </div>
        </div>

        <!-- RELATED TAB -->
        <div
          v-else-if="activeTab === 'related'"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
        >
          <MediaCard
            v-for="ss in similarShows"
            :key="ss.id"
            :title="ss.title"
            :posterUrl="ss.poster_url"
            :year="ss.release_year"
            type="tv"
            fluid
            @click="router.push(`/shows/${ss.uuid}`)"
          />
        </div>
      </div>
    </div>

    <!-- Trailer Modal -->
    <TrailerModal
      v-model:visible="showTrailer"
      :trailer-key="activeTrailerKey"
      :video-url="activeVideoUrl"
      :title="show?.title"
      media-type="tv"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, onBeforeUnmount, watch } from 'vue';
  import AppImage from '@/components/AppImage.vue';
  import MediaCard from '@/components/MediaCard.vue';
  import TrailerModal from '@/components/TrailerModal.vue';
  import { RouterLink, useRoute, useRouter } from 'vue-router';
  import { useTvStore } from '@/stores/tvStore';
  import { useWatchlistStore } from '@/stores/watchListStore';
  import type {
    TVShowWithDetails,
    TVSeason,
    TVEpisode,
    MediaCard as MediaCardType,
    CastMember,
    WatchlistPopulatedItem,
    WatchlistStatus
  } from 'shared-types';
  import toastHandler from '@/composables/toastHandler';
  import { getErrorMessage } from '@/services/errorUtils';
  import { useAuthStore } from '@/stores/authStore';
  import { usePreferencesStore } from '@/stores/preferencesStore';
  import { useTelemetry } from '@/composables/useTelemetry';
  import {
    AlertCircle,
    Tv,
    ArrowLeft,
    Play,
    Plus,
    Bookmark,
    PlayCircle,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Trash2,
    MoreHorizontal,
    Ban,
    Star,
    ArrowDownUp,
    Sparkles,
    Loader2
  } from 'lucide-vue-next';

  const route = useRoute();
  const router = useRouter();
  const tvStore = useTvStore();
  const watchlistStore = useWatchlistStore();
  const authStore = useAuthStore();
  const preferencesStore = usePreferencesStore();
  const showToast = toastHandler().showToast;
  const telemetry = useTelemetry();

  const show = ref<TVShowWithDetails | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  // Parallax and Sticky Header
  const scrollY = ref(0);
  const showStickyHeader = computed(() => scrollY.value > 400);

  function handleScroll(e: Event) {
    scrollY.value = (e.target as HTMLElement).scrollTop;
  }

  // UI State
  const showTrailer = ref(false);
  const activeVideoUrl = ref<string>('');
  const activeTrailerKey = ref<string>('');
  const watchlistMenuOpen = ref(false);
  const moreOptionsOpen = ref(false);
  const seasonMenuOpen = ref(false);
  const watchlistDropdownRef = ref<HTMLElement | null>(null);
  const moreOptionsRef = ref<HTMLElement | null>(null);
  const seasonDropdownRef = ref<HTMLElement | null>(null);
  const episodesContainerRef = ref<HTMLElement | null>(null);

  const hasTrailer = computed(() => {
    if (!show.value) return false;
    return !!(show.value.tmdb_trailer_key || show.value.trailer_url);
  });

  const VALID_TABS = ['overview', 'episodes', 'specials', 'cast', 'related'] as const;
  type TabType = (typeof VALID_TABS)[number];

  function getInitialTab(): TabType {
    const queryTab = route.query?.tab as string;
    if (queryTab && VALID_TABS.includes(queryTab as TabType)) {
      return queryTab as TabType;
    }
    return 'overview';
  }

  const activeTab = ref<TabType>(getInitialTab());
  const activeSeasonId = ref<number | null>(null);
  const activeSeasonEpisodes = ref<TVEpisode[]>([]);
  const similarShows = ref<MediaCardType[]>([]);
  const loadingEpisodes = ref(false);

  const displaySeasons = computed<TVSeason[]>(() => {
    if (!show.value?.seasons?.length) return [];
    return [...show.value.seasons].sort((a, b) => a.season_number - b.season_number);
  });

  const regularSeasons = computed<TVSeason[]>(() => {
    return displaySeasons.value.filter((s) => s.season_number > 0);
  });

  const specialsSeason = computed<TVSeason | undefined>(() => {
    return displaySeasons.value.find((s) => s.season_number === 0);
  });

  const hasSpecials = computed(() => !!specialsSeason.value);

  const activeSeason = computed(() =>
    displaySeasons.value.find((s) => s.id === activeSeasonId.value)
  );

  function switchToSpecials() {
    activeTab.value = 'specials';
    if (specialsSeason.value) {
      selectSeason(specialsSeason.value);
    }
  }

  function switchToEpisodes() {
    activeTab.value = 'episodes';
    if (activeSeason.value?.season_number === 0) {
      const firstRegular = regularSeasons.value[0];
      if (firstRegular) {
        selectSeason(firstRegular);
      }
    }
  }

  watch(activeTab, (newTab) => {
    const currentTab = (route.query?.tab as string) || 'overview';
    if (newTab !== currentTab) {
      const query = { ...route.query };
      if (newTab === 'overview') {
        delete query.tab;
      } else {
        query.tab = newTab;
      }
      if (newTab !== 'episodes') {
        delete query.season;
      } else if (activeSeason.value && activeSeason.value.season_number > 1) {
        query.season = String(activeSeason.value.season_number);
      }
      if (router.replace) {
        Promise.resolve(router.replace({ query })).catch(() => {});
      }
    }
  });

  watch(
    () => route.query?.tab,
    (newQueryTab) => {
      const targetTab =
        newQueryTab && VALID_TABS.includes(newQueryTab as TabType)
          ? (newQueryTab as TabType)
          : 'overview';
      if (activeTab.value !== targetTab) {
        activeTab.value = targetTab;
      }
    }
  );

  // Watchlist Tracking
  const watchedEpisodesSet = ref<Set<number>>(new Set());

  const watchlistItem = computed<WatchlistPopulatedItem | undefined>(() => {
    if (!show.value) return undefined;
    return watchlistStore.getItemByShowId(show.value.id);
  });

  const isInWatchlist = computed(() => !!watchlistItem.value);

  const progressPercentage = computed(() => {
    if (!show.value || !show.value.episode_count) return 0;
    return Math.min(
      100,
      Math.round((watchedEpisodesSet.value.size / show.value.episode_count) * 100)
    );
  });

  function getInitials(name: string) {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  function prettyWatchlistStatus(status?: WatchlistStatus) {
    if (!status) return '';
    switch (status) {
      case 'want_to_watch':
        return 'Want to watch';
      case 'watching':
        return 'Watching';
      case 'watched':
        return 'Watched';
    }
  }

  async function addToWatchlist() {
    if (!show.value) return;
    try {
      await watchlistStore.addShowToWatchlist(show.value.id, 'watching');
      showToast('success', 'Added', 'Show added to watchlist');
    } catch (err: unknown) {
      showToast('error', 'Error', getErrorMessage(err, 'Failed to add show'));
    }
  }

  async function removeFromWatchlist() {
    if (!watchlistItem.value) return;
    try {
      await watchlistStore.removeFromWatchlist(watchlistItem.value.id);
      watchlistMenuOpen.value = false;
      showToast('success', 'Removed', 'Show removed from watchlist');
    } catch (err: unknown) {
      showToast('error', 'Error', getErrorMessage(err, 'Failed to remove show'));
    }
  }

  async function updateStatus(status: WatchlistStatus) {
    if (!watchlistItem.value) return;
    try {
      await watchlistStore.updateStatus(watchlistItem.value.id, status);
      watchlistMenuOpen.value = false;
      showToast('success', 'Updated', 'Watchlist status updated');
    } catch (err: unknown) {
      showToast('error', 'Error', getErrorMessage(err, 'Failed to update status'));
    }
  }

  function isEpisodeWatched(episodeId: number) {
    return watchedEpisodesSet.value.has(episodeId);
  }

  async function toggleEpisodeWatched(episode: TVEpisode) {
    if (!show.value) return;
    const episodeId = episode.id;
    try {
      if (isEpisodeWatched(episodeId)) {
        await watchlistStore.unmarkEpisodeWatched(show.value.id, episodeId);
        watchedEpisodesSet.value.delete(episodeId);
      } else {
        await watchlistStore.markEpisodeWatched(show.value.id, episodeId);
        watchedEpisodesSet.value.add(episodeId);
      }
    } catch (err) {
      console.error('Failed to update episode status:', err);
      showToast('error', 'Error', getErrorMessage(err, 'Failed to update episode status'));
    }
  }

  async function selectSeason(season: TVSeason) {
    activeSeasonId.value = season.id;
    if (season.season_number === 0 && activeTab.value !== 'specials') {
      activeTab.value = 'specials';
    } else if (season.season_number > 0 && activeTab.value === 'specials') {
      activeTab.value = 'episodes';
    }

    if (activeTab.value === 'episodes' && router.replace) {
      const query = { ...route.query };
      if (season.season_number > 1) {
        query.season = String(season.season_number);
      } else {
        delete query.season;
      }
      if (route.query?.season !== query.season) {
        Promise.resolve(router.replace({ query })).catch(() => {});
      }
    } else if (activeTab.value === 'specials' && router.replace) {
      const query = { ...route.query };
      delete query.season;
      if (route.query?.tab !== 'specials') {
        query.tab = 'specials';
        Promise.resolve(router.replace({ query })).catch(() => {});
      }
    }

    if (!show.value) return;
    loadingEpisodes.value = true;
    try {
      activeSeasonEpisodes.value = await tvStore.fetchSeasonEpisodes(show.value.uuid, season.id);
    } catch (err) {
      console.error(err);
      showToast('error', 'Error', 'Failed to load episodes');
    } finally {
      loadingEpisodes.value = false;
    }
  }

  // --- Bulk Watch Progression Actions ---
  const isCurrentSeasonAllWatched = computed(() => {
    if (!activeSeasonEpisodes.value.length) return false;
    return activeSeasonEpisodes.value.every((ep) => watchedEpisodesSet.value.has(ep.id));
  });

  const bulkMarkingLoading = ref(false);

  async function toggleCurrentSeasonWatched() {
    if (!show.value || !activeSeason.value || !activeSeasonEpisodes.value.length) return;
    bulkMarkingLoading.value = true;
    const currentSeason = activeSeason.value;
    const seasonNum = currentSeason.season_number;
    try {
      if (isCurrentSeasonAllWatched.value) {
        await watchlistStore.unmarkSeasonWatched(show.value.id, seasonNum);
        for (const ep of activeSeasonEpisodes.value) {
          watchedEpisodesSet.value.delete(ep.id);
        }
        showToast('info', 'Season Unmarked', `Unmarked ${currentSeason.title} as watched`);
      } else {
        await watchlistStore.markSeasonWatched(show.value.id, seasonNum);
        for (const ep of activeSeasonEpisodes.value) {
          watchedEpisodesSet.value.add(ep.id);
        }
        showToast('success', 'Season Watched', `Marked ${currentSeason.title} as watched`);
      }
    } catch (err: unknown) {
      showToast('error', 'Error', getErrorMessage(err, 'Failed to update season watch status'));
    } finally {
      bulkMarkingLoading.value = false;
    }
  }

  // Close dropdowns when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (
      watchlistMenuOpen.value &&
      watchlistDropdownRef.value &&
      !watchlistDropdownRef.value.contains(event.target as Node)
    ) {
      watchlistMenuOpen.value = false;
    }
    if (
      moreOptionsOpen.value &&
      moreOptionsRef.value &&
      !moreOptionsRef.value.contains(event.target as Node)
    ) {
      moreOptionsOpen.value = false;
    }
    if (
      seasonMenuOpen.value &&
      seasonDropdownRef.value &&
      !seasonDropdownRef.value.contains(event.target as Node)
    ) {
      seasonMenuOpen.value = false;
    }
  }

  function scrollEpisodes(direction: 'left' | 'right') {
    if (!episodesContainerRef.value) return;
    const amount = episodesContainerRef.value.clientWidth * 0.8;
    episodesContainerRef.value.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  }

  // --- Media & Metadata Computeds ---
  const displayTrailers = computed(() => {
    if (!show.value) return [];
    const trailers = [];
    if (show.value.tmdb_trailer_key) {
      trailers.push({
        id: 1,
        title: `${show.value.title} Official Trailer`,
        type: 'Trailer',
        trailer_key: show.value.tmdb_trailer_key,
        url: `https://www.youtube.com/watch?v=${show.value.tmdb_trailer_key}`,
        thumbnail_url: `https://img.youtube.com/vi/${show.value.tmdb_trailer_key}/hqdefault.jpg`,
      });
    } else if (show.value.trailer_url) {
      trailers.push({
        id: 1,
        title: `${show.value.title} Official Trailer`,
        type: 'Trailer',
        url: show.value.trailer_url,
        thumbnail_url:
          show.value.backdrop_url ||
          show.value.poster_url ||
          '',
      });
    }
    return trailers;
  });

  const displayCast = computed<CastMember[]>(() => {
    if (!show.value?.cast?.length) return [];
    return [...show.value.cast].sort((a, b) => a.display_order - b.display_order);
  });
  // ----------------------------

  function playVideo(url: string, key?: string) {
    activeVideoUrl.value = url || '';
    activeTrailerKey.value = key || '';
    showTrailer.value = true;
    if (show.value?.id) {
      telemetry.trackTrailerPlay('tv', show.value.id);
    }
  }

  function openTrailerModal(key?: string, url?: string) {
    activeTrailerKey.value = key || show.value?.tmdb_trailer_key || '';
    activeVideoUrl.value = url || show.value?.trailer_url || '';
    showTrailer.value = true;
    if (show.value?.id) {
      telemetry.trackTrailerPlay('tv', show.value.id);
    }
  }

  function prettyStatus(status: string) {
    return status.replace(/_/g, ' ');
  }

  async function loadShow() {
    loading.value = true;
    error.value = null;
    try {
      const uuid = route.params.uuid as string;
      if (!uuid) throw new Error('Invalid show ID');
      show.value = await tvStore.fetchShowById(uuid);
      if (show.value?.id) {
        telemetry.trackPageView('tv', show.value.id);
      }

      // Fetch similar shows
      tvStore
        .fetchSimilarShows(uuid)
        .then((similar) => {
          similarShows.value = similar || [];
        })
        .catch(console.error);

      if (authStore.isAuthenticated) {
        if (!watchlistStore.items.length) {
          await watchlistStore.fetchWatchlist();
        }
        // Load watched episodes set
        if (show.value) {
          const watchedEps = await watchlistStore.fetchWatchedEpisodes(show.value.id);
          watchedEpisodesSet.value = new Set(Array.isArray(watchedEps) ? watchedEps : []);
        }
      }

      // Select season from query if available, otherwise first season
      if (displaySeasons.value.length > 0) {
        const seasonQuery = route.query?.season;
        const targetSeason = seasonQuery
          ? displaySeasons.value.find(
              (s) =>
                String(s.season_number) === String(seasonQuery) ||
                String(s.id) === String(seasonQuery)
            )
          : null;
        const defaultSeason =
          activeTab.value === 'specials' && specialsSeason.value
            ? specialsSeason.value
            : regularSeasons.value[0] || displaySeasons.value[0];
        const selected = targetSeason || defaultSeason;
        if (selected) selectSeason(selected);
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to load show');
    } finally {
      loading.value = false;
    }
  }

  async function blockShow() {
    if (!show.value) return;
    try {
      const uuid = show.value.uuid;
      await preferencesStore.blockShow(uuid);
      tvStore.removeShowLocally(uuid);
      showToast('success', 'Blocked', 'Show will no longer be shown');
      router.push('/');
    } catch (err: unknown) {
      showToast('error', 'Error', getErrorMessage(err, 'Failed to block show'));
    }
  }

  onMounted(() => {
    loadShow();
    document.addEventListener('click', handleClickOutside);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
  });

  watch(
    () => route.params.uuid,
    (newUuid, oldUuid) => {
      if (
        newUuid &&
        newUuid !== oldUuid &&
        (route.name === 'show-detail' || route.name === 'show-details')
      ) {
        const container = document.querySelector('.hide-scrollbar');
        if (container) container.scrollTop = 0;
        activeTab.value = getInitialTab();
        loadShow();
      }
    }
  );
</script>

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/HomePage.vue'),
    },
    {
      path: '/search',
      name: 'Search',
      component: () => import('../views/SearchPage.vue'),
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/ProfilePage.vue'),
    },
    {
      path: '/profile/collections/:id',
      name: 'CollectionDetail',
      component: () => import('../views/CollectionDetailsPage.vue'),
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginPage.vue'),
      meta: { hideSidebar: true }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/RegisterPage.vue'),
      meta: { hideSidebar: true }
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('../views/ForgotPasswordPage.vue'),
      meta: { hideSidebar: true },
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('../views/ResetPasswordPage.vue'),
      meta: { hideSidebar: true },
    },
    {
      path: '/settings',
      component: () => import('../views/SettingsPage.vue'),
      children: [
        {
          path: '',
          redirect: '/settings/customise-homepage',
        },
        {
          path: 'movies-added',
          name: 'settings-movies-added',
          component: () => import('../views/settings/MoviesAddedSettingsPage.vue'),
          meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
          path: 'users',
          name: 'settings-users',
          component: () => import('../views/settings/AdminUsersSettingsPage.vue'),
          meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
          path: 'customise-homepage',
          name: 'settings-customise-homepage',
          component: () => import('../views/settings/CustomiseHomepageSettingsPage.vue'),
        },
        {
          path: 'blocked-titles',
          name: 'settings-blocked-titles',
          component: () => import('../views/settings/BlockedTitlesSettingsPage.vue'),
        },
      ],
    },
    {
      path: '/genres',
      name: 'Genres',
      component: () => import('../views/GenresPage.vue'),
    },
    {
      path: '/genres/:slug',
      name: 'genre-content',
      component: () => import('../views/GenresContentPage.vue'),
    },

    {
      path: '/languages',
      name: 'Languages',
      component: () => import('./../views/LanguagesPage.vue'),
    },
    {
      path: '/languages/:code',
      name: 'language-content',
      component: () => import('@/views/LanguageContentPage.vue'),
    },

    {
      path: '/watchlist',
      name: 'Watchlist',
      component: () => import('./../views/WatchListPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/people',
      name: 'People',
      component: () => import('../views/PeoplePage.vue'),
    },
    {
      path: '/people/add',
      name: 'add-person',
      component: () => import('@/views/PersonFormPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/people/:uuid/edit',
      name: 'edit-person',
      component: () => import('@/views/PersonFormPage.vue'),
      meta: { requiresAuth: true }
    },

    {
      path: '/movies',
      name: 'movies',
      component: () => import('@/views/MoviesPage.vue'),
    },
    {
      path: '/shows',
      name: 'shows',
      component: () => import('@/views/ShowsPage.vue'),
    },
    {
      path: '/shows/:uuid',
      name: 'show-detail',
      component: () => import('@/views/ShowDetailsPage.vue'),
    },
    {
      path: '/movies/:uuid',
      name: 'movie-detail',
      component: () => import('@/views/MovieDetailsPage.vue'),
    },
    {
      path: '/movies/add',
      name: 'add-movie',
      component: () => import('@/views/MovieFormPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/movies/:uuid/edit',
      name: 'edit-movie',
      component: () => import('@/views/MovieFormPage.vue'),
      meta: { requiresAuth: true }
    },
  ],
})

import { usePreferencesStore } from '@/stores/preferencesStore'

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const preferencesStore = usePreferencesStore()
  
  if (authStore.isAuthLoading) {
    await authStore.waitUntilReady()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : undefined })
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'Home' })
  } else if (to.meta.requiresModerator && !authStore.isModerator) {
    next({ name: 'Home' })
  } else if ((to.name === 'Login' || to.name === 'Register') && authStore.isAuthenticated) {
    next({ name: 'Home' })
  } else if (to.path.startsWith('/movies') && !preferencesStore.showMovies && to.name !== 'Home') {
    next({ name: 'Home' })
  } else if (to.path.startsWith('/shows') && !preferencesStore.showShows && to.name !== 'Home') {
    next({ name: 'Home' })
  } else if (to.path.startsWith('/people') && !preferencesStore.showPeople && to.name !== 'Home') {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router

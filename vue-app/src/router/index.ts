import HomePage from '@/pages/HomePage.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomePage,
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../pages/ProfilePage.vue'),
    },
    {
      path: '/auth',
      name: 'Auth',
      component: () => import('../pages/Auth.vue'),
    },
    // {
    //   path: '/settings',
    //   name: 'Settings',
    //   component: () => import('./../pages/SettingsPage.vue'),
    // },
    {
      path: '/settings',
      component: () => import('../pages/SettingsPage.vue'),
      children: [
        {
          path: '',
          redirect: '/settings/customise-homepage',
        },
        {
          path: 'movies-added',
          name: 'settings-movies-added',
          component: () => import('../pages/settings/MoviesAddedSettingsPage.vue'),
        },
        {
          path: 'customise-homepage',
          name: 'settings-customise-homepage',
          component: () => import('../pages/settings/CustomiseHomepageSettingsPage.vue'),
        },
      ],
    },
    {
      path: '/genres',
      name: 'Genres',
      component: () => import('../pages/GenresPage.vue'),
    },
    {
      path: '/genres/:slug',
      name: 'genre-content',
      component: () => import('../pages/GenresContentPage.vue'),
    },

    {
      path: '/languages',
      name: 'Languages',
      component: () => import('./../pages/LanguagesPage.vue'),
    },
    {
      path: '/languages/:code',
      name: 'language-content',
      component: () => import('@/pages/LanguageContentPage.vue'),
    },

    {
      path: '/watchlist',
      name: 'Watchlist',
      component: () => import('./../pages/WatchListPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/people',
      name: 'People',
      component: () => import('../pages/PeoplePage.vue'),
    },
    {
      path: '/people/add',
      name: 'add-person',
      component: () => import('@/pages/PersonFormPage.vue'),
    },
    {
      path: '/people/:uuid/edit',
      name: 'edit-person',
      component: () => import('@/pages/PersonFormPage.vue'),
    },

    {
      path: '/movies',
      name: 'movies',
      component: () => import('@/pages/AllMoviesPage.vue'),
    },
    {
      path: '/movies/:uuid',
      name: 'movie-detail',
      component: () => import('@/pages/MovieDetailsPage.vue'),
    },
    {
      path: '/movies/add',
      name: 'add-movie',
      component: () => import('@/pages/MovieFormPage.vue'),
    },
    {
      path: '/movies/:uuid/edit',
      name: 'edit-movie',
      component: () => import('@/pages/MovieFormPage.vue'),
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Auth' })
  } else if (to.name === 'Auth' && authStore.isAuthenticated) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router

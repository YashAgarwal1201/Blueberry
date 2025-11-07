import HomePage from '@/pages/HomePage.vue'
import { createRouter, createWebHistory } from 'vue-router'

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
      path: '/settings',
      name: 'Settings',
      component: () => import('./../pages/SettingsPage.vue'),
    },
    {
      path: '/genres',
      name: 'Genres',
      component: () => import('../pages/GenresPage.vue'),
    },
    {
      path: '/languages',
      name: 'Languages',
      component: () => import('./../pages/LanguagesPage.vue'),
    },
    {
      path: '/watchlist',
      name: 'Watchlist',
      component: () => import('./../pages/WatchListPage.vue'),
    },
    {
      path: '/movies',
      name: 'movies',
      component: () => import('@/pages/AllMoviesPage.vue'),
    },
    {
      path: '/movies/:id',
      name: 'movie-detail',
      component: () => import('@/pages/MovieDetailsPage.vue'),
    },
    {
      path: '/movies/add',
      name: 'add-movie',
      component: () => import('@/pages/MovieFormPage.vue'),
    },
    {
      path: '/movies/:id/edit',
      name: 'edit-movie',
      component: () => import('@/pages/MovieFormPage.vue'),
    },
  ],
})

export default router

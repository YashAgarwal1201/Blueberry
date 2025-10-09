import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('./../pages/HomePage.vue'), // or any placeholder component
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('./../pages/DashboardPage.vue'),
    },
  ],
})

export default router

import { createRouter, createWebHistory } from 'vue-router'

const routes = [
	{
		path: '/',
		name: 'Home',
		component: () => import('@/pages/Home.vue'),
	},
	{
		path: '/setup',
		name: 'Setup',
		component: () => import('@/pages/Setup.vue'),
	},
	{
		path: '/ideas',
		name: 'Ideas',
		component: () => import('@/pages/Ideas.vue'),
	},
	{
		path: '/ideas/:name',
		name: 'Idea',
		component: () => import('@/pages/Write.vue'),
	},
	{
		path: '/write',
		name: 'WriteLegacy',
		component: () => import('@/pages/Home.vue'),
	},
	{
		path: '/board',
		name: 'Board',
		component: () => import('@/pages/Board.vue'),
	},
	{
		path: '/schedule',
		name: 'Schedule',
		component: () => import('@/pages/Schedule.vue'),
	},
]

const router = createRouter({
	history: createWebHistory('/next-chapter'),
	routes,
})

export default router

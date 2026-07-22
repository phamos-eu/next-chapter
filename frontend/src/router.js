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
		path: '/growth',
		name: 'GrowthFunnel',
		component: () => import('@/pages/GrowthFunnel.vue'),
	},
	{
		path: '/board',
		redirect: '/growth',
	},
	{
		path: '/schedule',
		name: 'Schedule',
		component: () => import('@/pages/Schedule.vue'),
	},
	{
		path: '/settings',
		name: 'Settings',
		component: () => import('@/pages/Settings.vue'),
	},
	{
		path: '/session/:name',
		name: 'Session',
		component: () => import('@/pages/Session.vue'),
	},
]

const router = createRouter({
	history: createWebHistory('/next-chapter'),
	routes,
})

export default router

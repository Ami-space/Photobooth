import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/calendar'
      },
      {
        path: 'calendar',
        name: 'Calendar',
        component: () => import('../views/Calendar.vue'),
        meta: { title: '排期日历' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('../views/Orders.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'orders/new',
        name: 'OrderNew',
        component: () => import('../views/OrderForm.vue'),
        meta: { title: '新增订单' }
      },
      {
        path: 'orders/:id/edit',
        name: 'OrderEdit',
        component: () => import('../views/OrderForm.vue'),
        meta: { title: '编辑订单' }
      },
      {
        path: 'devices',
        name: 'Devices',
        component: () => import('../views/Devices.vue'),
        meta: { title: '设备管理' }
      },
      {
        path: 'staff',
        name: 'Staff',
        component: () => import('../views/Staff.vue'),
        meta: { title: '人员管理' }
      },
      {
        path: 'payment',
        name: 'Payment',
        component: () => import('../views/Payment.vue'),
        meta: { title: '收款管理' }
      },
      {
        path: 'stats',
        name: 'Stats',
        component: () => import('../views/Stats.vue'),
        meta: { title: '数据统计' }
      },
      {
        path: 'pricing',
        name: 'PricingSettings',
        component: () => import('../views/PricingSettings.vue'),
        meta: { title: '套餐配置' }
      },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 全局路由守卫
router.beforeEach((to) => {
  const token = localStorage.getItem('pb_token')
  if (!to.meta.public && !token) {
    return { name: 'Login' }
  }
  if (to.name === 'Login' && token) {
    return { name: 'Calendar' }
  }
})

export default router

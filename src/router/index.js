import Vue from 'vue'
import VueRouter from 'vue-router'
import Ping from '../views/Ping.vue'
import Suspended from '../views/Suspended.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'ping',
    component: Ping
  },
  {
    path: '/suspended',
    name: 'suspended',
    component: Suspended
  }
]

const router = new VueRouter({
  routes
})

export default router

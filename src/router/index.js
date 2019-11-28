import Vue from 'vue'
import VueRouter from 'vue-router'
import Ping from '../views/Ping.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'ping',
    component: Ping
  }
]

const router = new VueRouter({
  routes
})

export default router

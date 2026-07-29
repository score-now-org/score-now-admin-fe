import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/login/Login.vue';
import Admin from '@/views/Admin.vue';
import UserAdmin from '@/views/user/UserAdmin.vue'
import MatchAdmin from '@/views/match/MatchAdmin.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/admin', component: Admin },
  { path: '/admin/user', component: UserAdmin},
  { path: '/admin/match', component: MatchAdmin },
  { path: '/admin/match/list', component: MatchAdmin },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;

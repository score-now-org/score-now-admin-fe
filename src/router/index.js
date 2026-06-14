import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/login/Login.vue';
import Admin from '@/views/Admin.vue';
import UserAdmin from '@/views/user/base/UserAdmin.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/admin', component: Admin },
  { path: '/admin/user', component: UserAdmin}
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
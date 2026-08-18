import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/login/Login.vue';
import Admin from '@/views/Admin.vue';
import UserAdmin from '@/views/user/UserAdmin.vue'
import MatchAdmin from '@/views/match/MatchAdmin.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/admin', component: Admin },
  { path: '/admin/user', component: UserAdmin},
  { path: '/admin/match', redirect: '/admin/menu/match-list' },
  { path: '/admin/match/list', redirect: '/admin/menu/match-list' },
  { path: '/admin/match/league', redirect: '/admin/menu/leagues' },
  { path: '/admin/menu/match-list', component: MatchAdmin },
  { path: '/admin/menu/featured-matches', component: MatchAdmin },
  { path: '/admin/menu/standings', component: MatchAdmin },
  { path: '/admin/menu/leagues', component: MatchAdmin },
  { path: '/admin/menu/teams', component: MatchAdmin },
  { path: '/admin/menu/players', component: MatchAdmin },
  { path: '/admin/menu/squads', component: MatchAdmin },
  { path: '/admin/menu/stadiums', component: MatchAdmin },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;

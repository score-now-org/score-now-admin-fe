import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/login/Login.vue';
import UserAdmin from '@/views/user/UserAdmin.vue'
import MatchAdmin from '@/views/match/MatchAdmin.vue'

const routes = [
  { path: '/', name: 'login', component: Login },
  { path: '/admin', redirect: { name: 'admin-match-list' } },
  {
    path: '/admin/user',
    name: 'admin-user',
    component: UserAdmin,
    meta: { adminSection: 'user' },
  },
  {
    path: '/admin/match/list',
    name: 'admin-match-list',
    component: MatchAdmin,
    meta: { adminSection: 'match' },
  },
  {
    path: '/admin/match/featured',
    name: 'admin-match-featured',
    component: MatchAdmin,
    meta: { adminSection: 'match' },
  },
  {
    path: '/admin/match/standings',
    name: 'admin-match-standings',
    component: MatchAdmin,
    meta: { adminSection: 'match' },
  },
  {
    path: '/admin/match/leagues',
    name: 'admin-match-leagues',
    component: MatchAdmin,
    meta: { adminSection: 'match' },
  },
  {
    path: '/admin/match/teams',
    name: 'admin-match-teams',
    component: MatchAdmin,
    meta: { adminSection: 'match' },
  },
  {
    path: '/admin/match/players',
    name: 'admin-match-players',
    component: MatchAdmin,
    meta: { adminSection: 'match' },
  },
  {
    path: '/admin/match/squads',
    name: 'admin-match-squads',
    component: MatchAdmin,
    meta: { adminSection: 'match' },
  },
  {
    path: '/admin/match/stadiums',
    name: 'admin-match-stadiums',
    component: MatchAdmin,
    meta: { adminSection: 'match' },
  },
  {
    path: '/admin/match/casters',
    name: 'admin-match-casters',
    component: MatchAdmin,
    meta: { adminSection: 'match' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;

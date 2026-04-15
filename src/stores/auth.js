import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('adminToken') || null
  }),

  actions: {
    setToken(token) {
      this.token = token;
      localStorage.setItem('adminToken', token);
    },

    logout() {
      this.token = null;
      localStorage.removeItem('adminToken');
    }
  }
});
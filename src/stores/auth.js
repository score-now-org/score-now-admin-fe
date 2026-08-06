import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token:    localStorage.getItem('adminToken') || null,
    userInfo: JSON.parse(localStorage.getItem('adminUser') || 'null'),
  }),

  actions: {
    setToken(token, user = null) {
      this.token    = token
      this.userInfo = user
      localStorage.setItem('adminToken', token)
      if (user) localStorage.setItem('adminUser', JSON.stringify(user))
    },

    logout() {
      this.token    = null
      this.userInfo = null
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
    }
  }
})
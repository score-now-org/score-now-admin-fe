import { defineStore } from 'pinia'
import client from '../api/client.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token:    localStorage.getItem('adminToken') || null,
    userInfo: JSON.parse(localStorage.getItem('adminUser') || 'null'),
    verified: false,
  }),

  actions: {
    setToken(token, user = null) {
      this.token    = token
      this.userInfo = user
      this.verified = true
      localStorage.setItem('adminToken', token)
      if (user) localStorage.setItem('adminUser', JSON.stringify(user))
    },

    async verifySession() {
      if (!this.token) return false
      if (!this.verified) {
        const token = this.token
        await client.get('/api/v1/admin/session')
        if (this.token !== token) return false
        this.verified = true
      }
      return true
    },

    logout() {
      this.token    = null
      this.userInfo = null
      this.verified = false
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
    }
  }
})
import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import client from './api/client'
import { useAuthStore } from './stores/auth'
import globalComponents from './plugins/globalComponents'
import './assets/main.css' 
import './styles/admin-tokens.css'
import './styles/admin-toast.css'



const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

client.interceptors.request.use((config) => {
  const token = useAuthStore(pinia).token
  if (token && config.url?.startsWith('/api/v1/admin/')) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
client.interceptors.response.use(undefined, (error) => {
  const url = error.config?.url
  const auth = useAuthStore(pinia)
  const requestToken = error.config?.headers?.Authorization
  if (error.response?.status === 401 && url?.startsWith('/api/v1/admin/') && url !== '/api/v1/admin/login'
      && requestToken === `Bearer ${auth.token}`) {
    auth.logout()
    if (router.currentRoute.value.name !== 'login') router.replace({ name: 'login' })
  }
  return Promise.reject(error)
})
app.use(router)
app.use(globalComponents) 
app.mount('#app')

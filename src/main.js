import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import globalComponents from './plugins/globalComponents'
import './assets/main.css' 
import './styles/admin-tokens.css'



const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(globalComponents) 
app.mount('#app')

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'

// 導入 Naive UI 和樣式
import naive from 'naive-ui'
import 'vfonts/Lato.css'
import 'vfonts/FiraCode.css'

// 導入 i18n
import i18n from './i18n'

// 導入路由
import router from './router'

// 創建 Vue 應用
const app = createApp(App)

// 創建 Pinia 實例
const pinia = createPinia()

// 使用 Pinia
app.use(pinia)

// 使用 Naive UI
app.use(naive)
// locale 設置在 App.vue 中通過 n-config-provider 處理

// 使用 i18n
app.use(i18n)

// 使用路由
app.use(router)

// 掛載應用
app.mount('#app')

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  base: mode === 'github' ? '/blockquest1/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'BlockQuest - 方块冒险打卡',
        short_name: 'BlockQuest',
        description: '完成每日小任务，收集绿宝石，升级成长！',
        theme_color: '#57b9e9',
        background_color: '#d8f2ff',
        display: 'standalone',
        start_url: '.',
        orientation: 'landscape',
        lang: 'zh-CN',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
    }),
  ],
}))

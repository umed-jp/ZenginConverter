export default defineNuxtConfig({
  ssr: false,
  nitro: {
    preset: "github-pages"
  },
  app: {
    baseURL: '/ZenginConverter/'
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss','shadcn-nuxt' ],
  css: ['~/assets/css/tailwind.css'],
  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },
})
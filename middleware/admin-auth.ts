export default defineNuxtRouteMiddleware(() => {
  if (import.meta.client) {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      return navigateTo('/admin/login')
    }
  }
})

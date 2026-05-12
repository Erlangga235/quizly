export default defineNuxtRouteMiddleware(() => {
  if (import.meta.client) {
    const adminId = localStorage.getItem('adminId')
    if (!adminId) {
      return navigateTo('/admin/login')
    }
  }
})

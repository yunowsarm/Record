import { defineStore } from 'pinia'
import { login, register, getProfile } from '../api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin'
  },

  actions: {
    async login(credentials) {
      try {
        const response = await login(credentials)
        this.token = response.token
        this.user = response.user
        localStorage.setItem('token', response.token)
        return response
      } catch (error) {
        throw error
      }
    },

    async register(userData) {
      try {
        const response = await register(userData)
        this.token = response.token
        this.user = response.user
        localStorage.setItem('token', response.token)
        return response
      } catch (error) {
        throw error
      }
    },

    async fetchProfile() {
      try {
        if (!this.token) return
        const user = await getProfile()
        this.user = user
      } catch (error) {
        this.logout()
      }
    },

    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
    }
  }
})


import apiClient from './apiClient'

const userService = {
  updateProfile(data) {
    return apiClient.patch('/users/me', data).then((r) => r.data)
  },

  getSettings() {
    return apiClient.get('/users/me/settings').then((r) => r.data)
  },

  updateSettings(data) {
    return apiClient.patch('/users/me/settings', data).then((r) => r.data)
  },
}

export default userService

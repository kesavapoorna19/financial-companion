import apiClient from './apiClient'

const authService = {
  register(data) {
    return apiClient.post('/auth/register', data).then((r) => r.data)
  },

  login(email, password) {
    return apiClient.post('/auth/login', { email, password }).then((r) => r.data)
  },

  getMe() {
    return apiClient.get('/auth/me').then((r) => r.data)
  },
}

export default authService

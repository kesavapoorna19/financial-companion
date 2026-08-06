import apiClient from './apiClient'

const dashboardService = {
  getSummary() {
    return apiClient.get('/dashboard/summary').then((r) => r.data)
  },
}

export default dashboardService

import apiClient from './apiClient'

const incomeService = {
  /**
   * List incomes with optional filters (camelCase in, snake_case on the wire):
   * { search, categoryId, paymentMethod, startDate, endDate, page, pageSize }
   */
  list(filters = {}) {
    const params = {
      search: filters.search || undefined,
      category_id: filters.categoryId || undefined,
      payment_method: filters.paymentMethod || undefined,
      start_date: filters.startDate || undefined,
      end_date: filters.endDate || undefined,
      page: filters.page || 1,
      page_size: filters.pageSize || 15,
    }
    return apiClient.get('/incomes', { params }).then((r) => r.data)
  },

  create(data) {
    return apiClient.post('/incomes', data).then((r) => r.data)
  },

  update(id, data) {
    return apiClient.patch(`/incomes/${id}`, data).then((r) => r.data)
  },

  remove(id) {
    return apiClient.delete(`/incomes/${id}`)
  },
}

export default incomeService

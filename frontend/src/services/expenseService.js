import apiClient from './apiClient'

const expenseService = {
  /**
   * List expenses with optional filters (camelCase in, snake_case on the wire):
   * { search, categoryId, paymentMethod, isRecurring, startDate, endDate, page, pageSize }
   */
  list(filters = {}) {
    const params = {
      search: filters.search || undefined,
      category_id: filters.categoryId || undefined,
      payment_method: filters.paymentMethod || undefined,
      is_recurring: filters.isRecurring || undefined,
      start_date: filters.startDate || undefined,
      end_date: filters.endDate || undefined,
      page: filters.page || 1,
      page_size: filters.pageSize || 15,
    }
    return apiClient.get('/expenses', { params }).then((r) => r.data)
  },

  create(data) {
    return apiClient.post('/expenses', data).then((r) => r.data)
  },

  update(id, data) {
    return apiClient.patch(`/expenses/${id}`, data).then((r) => r.data)
  },

  remove(id) {
    return apiClient.delete(`/expenses/${id}`)
  },
}

export default expenseService

import apiClient from './apiClient'

const notesService = {
  /**
   * Browse notes across income and expense records.
   * { search, type ('income'|'expense'), startDate, endDate, page, pageSize }
   */
  list(filters = {}) {
    const params = {
      search: filters.search || undefined,
      type: filters.type || undefined,
      start_date: filters.startDate || undefined,
      end_date: filters.endDate || undefined,
      page: filters.page || 1,
      page_size: filters.pageSize || 12,
    }
    return apiClient.get('/notes', { params }).then((r) => r.data)
  },

  /** Update the note text on an existing income or expense record. */
  updateNote(id, type, note) {
    return type === 'income'
      ? apiClient.patch(`/incomes/${id}`, { notes: note }).then((r) => r.data)
      : apiClient.patch(`/expenses/${id}`, { notes: note }).then((r) => r.data)
  },
}

export default notesService

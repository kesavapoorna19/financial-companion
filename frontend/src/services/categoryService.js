import apiClient from './apiClient'

const categoryService = {
  /** List categories; pass type 'income' or 'expense' to filter. */
  list(type) {
    return apiClient.get('/categories', { params: type ? { type } : {} }).then((r) => r.data)
  },
}

export default categoryService

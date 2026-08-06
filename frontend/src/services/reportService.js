import apiClient from './apiClient'

/**
 * Report export helpers. Downloads trigger a browser file save.
 * All requests are authenticated via the apiClient interceptor, so a user
 * can only ever download their own data.
 */

const EXTENSIONS = { csv: 'csv', pdf: 'pdf' }

async function fetchBlob(format, params) {
  const response = await apiClient.get(`/reports/export/${format}`, {
    params,
    responseType: 'blob',
  })
  return response.data
}

function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(new Blob([blob]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

function filenameFor(format, params) {
  const ext = EXTENSIONS[format] || format
  if (params.start_date && params.end_date) {
    return `financial-report-${params.start_date}_to_${params.end_date}.${ext}`
  }
  const month = String(params.month || 1).padStart(2, '0')
  return `financial-report-${params.year}-${month}.${ext}`
}

/** Download a report for a month/year, or a custom date range. */
async function downloadReport(format, params) {
  const blob = await fetchBlob(format, params)
  triggerDownload(blob, filenameFor(format, params))
}

/** Aggregated overview for a date range (Reports page). */
function getOverview(startDate, endDate) {
  return apiClient
    .get('/reports/overview', { params: { start_date: startDate, end_date: endDate } })
    .then((r) => r.data)
}

/** Extract a readable error message from a failed blob download. */
export async function readDownloadError(error) {
  const data = error?.response?.data
  if (data instanceof Blob) {
    try {
      const json = JSON.parse(await data.text())
      return json.detail || 'Download failed'
    } catch {
      return 'Download failed'
    }
  }
  return error?.response?.data?.detail || error?.message || 'Download failed'
}

const reportService = {
  downloadReport,
  getOverview,
}

export default reportService

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ??
      error.message ??
      'Request failed'
    const detail = error.response?.data?.detail
    const normalized =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg ?? d).join(' ')
          : message
    error.userMessage = normalized
    return Promise.reject(error)
  }
)

export function verifyDocument(file, onUploadProgress) {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/verify-document', formData, {
    onUploadProgress,
  })
}

export default api

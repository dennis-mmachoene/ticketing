import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tv_token')
      localStorage.removeItem('tv_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
}

export const eventsAPI = {
  list: (params) => api.get('/events', { params }),
  get: (slug) => api.get(`/events/${slug}`),
  create: (data) => api.post('/events', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/events/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  publish: (id) => api.put(`/events/${id}/publish`),
  myEvents: () => api.get('/events/organizer/my-events'),
  analytics: (id) => api.get(`/events/${id}/analytics`),
  addTeamMember: (id, data) => api.post(`/events/${id}/team`, data),
}

export const ordersAPI = {
  purchase: (data) => api.post('/orders', data),
  myOrders: () => api.get('/orders/my-orders'),
  get: (orderId) => api.get(`/orders/${orderId}`),
  downloadTicket: (ticketId) => `/api/orders/ticket/${ticketId}/download`,
}

export const scannerAPI = {
  validate: (data) => api.post('/scanner/validate', data),
  events: () => api.get('/scanner/events'),
  attendees: (eventId, params) => api.get(`/scanner/events/${eventId}/attendees`, { params }),
}

export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  users: (params) => api.get('/admin/users', { params }),
  suspendUser: (id) => api.put(`/admin/users/${id}/suspend`),
  activateUser: (id) => api.put(`/admin/users/${id}/activate`),
  events: (params) => api.get('/admin/events', { params }),
  suspendEvent: (id) => api.put(`/admin/events/${id}/suspend`),
  featureEvent: (id) => api.put(`/admin/events/${id}/feature`),
}

export default api

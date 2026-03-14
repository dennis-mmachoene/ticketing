import { format, formatDistanceToNow, isAfter } from 'date-fns'

export const formatDate = (date, pattern = 'MMM d, yyyy') => {
  if (!date) return 'N/A'
  try { return format(new Date(date), pattern) } catch { return 'Invalid date' }
}

export const formatDateTime = (date) => formatDate(date, 'MMM d, yyyy · h:mm a')

export const formatRelative = (date) => {
  if (!date) return ''
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }) } catch { return '' }
}

export const formatCurrency = (amount, currency = 'ZAR') => {
  if (amount === null || amount === undefined) return 'Free'
  if (amount === 0) return 'Free'
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatNumber = (n) => {
  if (!n && n !== 0) return '0'
  return new Intl.NumberFormat('en-ZA').format(n)
}

export const isEventUpcoming = (date) => isAfter(new Date(date), new Date())

export const getEventStatusColor = (status) => {
  const map = {
    published: 'badge-green',
    draft: 'badge-yellow',
    cancelled: 'badge-red',
    completed: 'badge-blue',
    suspended: 'badge-red',
  }
  return map[status] || 'badge-yellow'
}

export const getTicketStatusColor = (status) => {
  const map = {
    valid: 'badge-green',
    used: 'badge-blue',
    cancelled: 'badge-red',
    refunded: 'badge-yellow',
  }
  return map[status] || 'badge-yellow'
}

export const getCategoryLabel = (cat) => {
  const map = {
    music: 'Music',
    sports: 'Sports',
    arts: 'Arts & Culture',
    technology: 'Technology',
    business: 'Business',
    food: 'Food & Drink',
    comedy: 'Comedy',
    theatre: 'Theatre',
    conference: 'Conference',
    other: 'Other',
  }
  return map[cat] || cat
}

export const getPosterUrl = (poster) => {
  if (!poster) return null
  if (poster.startsWith('http')) return poster
  return `/uploads/${poster}`
}

export const truncate = (str, len = 100) => {
  if (!str) return ''
  return str.length > len ? str.substring(0, len) + '...' : str
}

export const getRoleBadgeClass = (role) => {
  const map = {
    admin: 'badge-red',
    organizer: 'badge-purple',
    event_manager: 'badge-blue',
    scanner: 'badge-yellow',
    attendee: 'badge-green',
  }
  return map[role] || 'badge-blue'
}

export const getRoleLabel = (role) => {
  const map = {
    admin: 'Admin',
    organizer: 'Organizer',
    event_manager: 'Event Manager',
    scanner: 'Scanner',
    attendee: 'Attendee',
  }
  return map[role] || role
}

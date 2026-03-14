import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingScreen } from '../components/ui'

const ROLE_REDIRECT = {
  admin: '/admin/dashboard',
  organizer: '/organizer/dashboard',
  event_manager: '/organizer/events',
  scanner: '/scanner',
  attendee: '/my-tickets',
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_REDIRECT[user.role] || '/my-tickets'} replace />
}

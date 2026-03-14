import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PrivateRoute, PublicOnlyRoute } from './components/RouteGuards'

// Public pages
import Home from './pages/Home'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Login from './pages/Login'
import Register from './pages/Register'

// Shared protected
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'

// Organizer
import OrganizerDashboard from './pages/organizer/Dashboard'
import OrganizerEvents from './pages/organizer/Events'
import CreateEvent from './pages/organizer/CreateEvent'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'

// Scanner
import Scanner from './pages/scanner/Scanner'
import Attendees from './pages/scanner/Attendees'

// Attendee
import MyTickets from './pages/attendee/MyTickets'

const ORGANIZER_ROLES = ['organizer', 'admin']
const SCANNER_ROLES = ['organizer', 'admin', 'event_manager', 'scanner']
const ADMIN_ROLES = ['admin']

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/event/:slug" element={<EventDetail />} />

          {/* Auth */}
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

          {/* Shared protected */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

          {/* Organizer routes */}
          <Route path="/organizer/dashboard" element={
            <PrivateRoute roles={ORGANIZER_ROLES}><OrganizerDashboard /></PrivateRoute>
          } />
          <Route path="/organizer/events" element={
            <PrivateRoute roles={[...ORGANIZER_ROLES, 'event_manager']}><OrganizerEvents /></PrivateRoute>
          } />
          <Route path="/organizer/events/create" element={
            <PrivateRoute roles={ORGANIZER_ROLES}><CreateEvent /></PrivateRoute>
          } />
          <Route path="/organizer/events/:id/edit" element={
            <PrivateRoute roles={ORGANIZER_ROLES}><CreateEvent /></PrivateRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute roles={ADMIN_ROLES}><AdminDashboard /></PrivateRoute>
          } />
          <Route path="/admin/users" element={
            <PrivateRoute roles={ADMIN_ROLES}><AdminDashboard /></PrivateRoute>
          } />
          <Route path="/admin/events" element={
            <PrivateRoute roles={ADMIN_ROLES}><AdminDashboard /></PrivateRoute>
          } />

          {/* Scanner routes */}
          <Route path="/scanner" element={
            <PrivateRoute roles={SCANNER_ROLES}><Scanner /></PrivateRoute>
          } />
          <Route path="/scanner/attendees" element={
            <PrivateRoute roles={SCANNER_ROLES}><Attendees /></PrivateRoute>
          } />

          {/* Attendee routes */}
          <Route path="/my-tickets" element={
            <PrivateRoute><MyTickets /></PrivateRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

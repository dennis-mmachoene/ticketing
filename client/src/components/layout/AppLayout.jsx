import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Ticket, QrCode, Users, Settings,
  LogOut, Menu, X, ChevronRight, Bell, Search, User,
  ShieldCheck, BarChart3, PlusCircle, ScanLine
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = {
  admin: [
    { group: 'Overview', items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/events', icon: Calendar, label: 'All Events' },
      { to: '/admin/users', icon: Users, label: 'Users' },
    ]},
  ],
  organizer: [
    { group: 'Manage', items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/organizer/events', icon: Calendar, label: 'My Events' },
      { to: '/organizer/events/create', icon: PlusCircle, label: 'Create Event' },
    ]},
    { group: 'Tools', items: [
      { to: '/scanner', icon: ScanLine, label: 'Scanner' },
    ]},
  ],
  event_manager: [
    { group: 'Manage', items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/organizer/events', icon: Calendar, label: 'Events' },
    ]},
    { group: 'Tools', items: [
      { to: '/scanner', icon: ScanLine, label: 'Scanner' },
    ]},
  ],
  scanner: [
    { group: 'Access', items: [
      { to: '/scanner', icon: ScanLine, label: 'Scanner' },
      { to: '/scanner/attendees', icon: Users, label: 'Attendees' },
    ]},
  ],
  attendee: [
    { group: 'My Account', items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/my-tickets', icon: Ticket, label: 'My Tickets' },
    ]},
  ],
}

const RoleIcon = ({ role }) => {
  const icons = {
    admin: ShieldCheck, organizer: BarChart3, event_manager: Calendar,
    scanner: QrCode, attendee: User,
  }
  const Icon = icons[role] || User
  return <Icon className="w-3.5 h-3.5" />
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navGroups = NAV[user?.role] || NAV.attendee

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (to) => location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : ''}`}>
      {/* Brand */}
      <div className="p-5 border-b border-ink-700">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-DEFAULT rounded-lg flex items-center justify-center">
            <Ticket className="w-4.5 h-4.5 text-ink-950" />
          </div>
          <span className="font-bold text-lg text-ink-50 tracking-tight">TicketVault</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5 no-scrollbar">
        {navGroups.map(group => (
          <div key={group.group}>
            <div className="section-label">{group.group}</div>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => mobile && setSidebarOpen(false)}
                  className={isActive(item.to) ? 'sidebar-link-active' : 'sidebar-link'}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {isActive(item.to) && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-ink-700">
        <Link to="/settings" onClick={() => mobile && setSidebarOpen(false)}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink-700/50 transition-colors mb-1">
          <div className="w-9 h-9 rounded-xl bg-ink-700 border border-ink-600 flex items-center justify-center text-amber-DEFAULT">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ink-100 truncate">{user?.name}</div>
            <div className="flex items-center gap-1 text-ink-500 text-xs">
              <RoleIcon role={user?.role} />
              <span className="capitalize">{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>
          <Settings className="w-3.5 h-3.5 text-ink-500 shrink-0" />
        </Link>
        <button onClick={handleLogout} className="w-full sidebar-link text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-ink-900 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-ink-800 border-r border-ink-700 shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/80" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-ink-800 border-r border-ink-700 flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-end p-4 border-b border-ink-700">
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-ink-700 text-ink-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-ink-800 border-b border-ink-700 flex items-center px-4 gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-ink-400 hover:bg-ink-700">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <Link to="/" className="btn-ghost text-xs">
            <Search className="w-3.5 h-3.5" />
            Browse Events
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-700/50 border border-ink-600">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="text-xs text-ink-300 font-mono">{user?.email?.split('@')[0]}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

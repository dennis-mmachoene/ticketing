import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ticket, Search, Menu, X, User, LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function PublicNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/events?search=${encodeURIComponent(query.trim())}`)
  }

  return (
    <nav className="sticky top-0 z-40 bg-ink-900/80 backdrop-blur-md border-b border-ink-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-amber-DEFAULT rounded-lg flex items-center justify-center">
              <Ticket className="w-4.5 h-4.5 text-ink-950" fill="currentColor" />
            </div>
            <span className="font-bold text-lg text-ink-50 tracking-tight hidden sm:block">TicketVault</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search events..."
                className="w-full bg-ink-800 border border-ink-700 text-ink-100 rounded-lg pl-9 pr-4 py-2 text-sm placeholder:text-ink-500 focus:outline-none focus:border-amber-DEFAULT transition-colors"
              />
            </div>
          </form>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 ml-auto">
            <Link to="/events" className="btn-ghost text-sm">Events</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="btn-ghost text-sm">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button onClick={logout} className="btn-ghost text-sm text-red-400 hover:text-red-300">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile menu btn */}
          <button onClick={() => setMenuOpen(v => !v)} className="md:hidden p-2 text-ink-400 hover:text-ink-100 ml-auto">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-ink-800 py-3 space-y-1 animate-fade-in">
            <Link to="/events" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-ink-300 hover:text-ink-100 rounded-lg hover:bg-ink-800">Events</Link>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-ink-300 hover:text-ink-100 rounded-lg hover:bg-ink-800">Dashboard</Link>
                <button onClick={() => { logout(); setMenuOpen(false) }} className="w-full text-left px-3 py-2.5 text-sm text-red-400 rounded-lg hover:bg-red-500/10">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-ink-300 hover:text-ink-100 rounded-lg hover:bg-ink-800">Sign In</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-amber-DEFAULT font-semibold rounded-lg hover:bg-amber-500/10">Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

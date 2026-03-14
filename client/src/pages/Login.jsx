import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Ticket, AlertCircle, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui'

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@demo.com', password: 'admin123', color: 'text-red-400' },
  { label: 'Organizer', email: 'organizer@demo.com', password: 'demo123', color: 'text-purple-400' },
  { label: 'Scanner', email: 'scanner@demo.com', password: 'demo123', color: 'text-yellow-400' },
  { label: 'Buyer', email: 'buyer@demo.com', password: 'demo123', color: 'text-emerald-400' },
]

const ROLE_REDIRECT = {
  admin: '/admin/users',
  organizer: '/organizer/events',
  event_manager: '/organizer/events',
  scanner: '/scanner',
  attendee: '/dashboard',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || null

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(form.email, form.password)
      navigate(from || ROLE_REDIRECT[user.role] || '/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (account) => {
    setForm({ email: account.email, password: account.password })
    setError('')
  }

  return (
    <div className="min-h-screen bg-ink-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[420px] bg-ink-900 border-r border-ink-800 p-10">
        <Link to="/" className="flex items-center gap-2.5 mb-auto">
          <div className="w-9 h-9 bg-amber-DEFAULT rounded-xl flex items-center justify-center">
            <Ticket className="w-5 h-5 text-ink-950" />
          </div>
          <span className="font-bold text-xl text-ink-50">TicketVault</span>
        </Link>

        <div className="mb-auto">
          <h2 className="text-3xl font-extrabold text-ink-50 mb-3 leading-tight">
            Your events,<br />your platform.
          </h2>
          <p className="text-ink-400 text-sm leading-relaxed">
            Create, manage, and sell tickets for any event — from intimate gigs to stadium shows.
          </p>
        </div>

        {/* Demo accounts */}
        <div className="mt-8">
          <div className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-3">Demo Accounts</div>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.label} onClick={() => fillDemo(acc)}
                className="w-full flex items-center justify-between p-3 bg-ink-800 border border-ink-700 rounded-xl text-sm hover:border-ink-600 transition-colors group">
                <span className={`font-semibold ${acc.color}`}>{acc.label}</span>
                <span className="text-ink-500 font-mono text-xs group-hover:text-ink-400">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-DEFAULT rounded-lg flex items-center justify-center">
                <Ticket className="w-4 h-4 text-ink-950" />
              </div>
              <span className="font-bold text-ink-50">TicketVault</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-ink-50 mb-1">Sign in</h1>
          <p className="text-ink-400 text-sm mb-8">Welcome back. Enter your credentials to continue.</p>

          {error && (
            <div className="flex items-center gap-2.5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm mb-5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Mobile demo accounts */}
          <div className="lg:hidden mb-6">
            <div className="text-xs font-semibold text-ink-500 mb-2">Quick demo access:</div>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.label} onClick={() => fillDemo(acc)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border bg-ink-800 border-ink-700 hover:border-ink-600 transition-colors ${acc.color}`}>
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="input"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  className="input pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading ? <Spinner size="sm" /> : <><LogIn className="w-4 h-4" /> Sign In</>}
            </button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-6">
            No account?{' '}
            <Link to="/register" className="text-amber-DEFAULT font-semibold hover:text-amber-light">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Ticket, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Spinner, Alert } from '../components/ui'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'attendee', organizationName: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await register(form)
      if (user.role === 'organizer') navigate('/organizer/events')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-amber-DEFAULT rounded-lg flex items-center justify-center">
            <Ticket className="w-4 h-4 text-ink-950" />
          </div>
          <span className="font-bold text-ink-50">TicketVault</span>
        </Link>

        <h1 className="text-2xl font-bold text-ink-50 mb-1">Create account</h1>
        <p className="text-ink-400 text-sm mb-8">Join TicketVault to buy or sell event tickets.</p>

        {error && <Alert type="error" message={error} className="mb-5" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Your full name" />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required minLength={6}
                placeholder="Min 6 characters"
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'attendee', label: 'Attendee', desc: 'Buy tickets' },
                { value: 'organizer', label: 'Organizer', desc: 'Sell tickets' },
              ].map(role => (
                <button key={role.value} type="button"
                  onClick={() => setForm(f => ({ ...f, role: role.value }))}
                  className={`p-3 rounded-xl border text-left transition-all ${form.role === role.value ? 'border-amber-DEFAULT bg-amber-500/5' : 'border-ink-700 hover:border-ink-600'}`}>
                  <div className={`font-semibold text-sm ${form.role === role.value ? 'text-amber-DEFAULT' : 'text-ink-200'}`}>{role.label}</div>
                  <div className="text-xs text-ink-500 mt-0.5">{role.desc}</div>
                </button>
              ))}
            </div>
          </div>
          {form.role === 'organizer' && (
            <div className="animate-fade-in">
              <label className="label">Organization Name</label>
              <input className="input" value={form.organizationName} onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))} placeholder="Your company or brand" />
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
            {loading ? <Spinner size="sm" /> : <><UserPlus className="w-4 h-4" /> Create Account</>}
          </button>
        </form>

        <p className="text-center text-sm text-ink-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-DEFAULT font-semibold hover:text-amber-light">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

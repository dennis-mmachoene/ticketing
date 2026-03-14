import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Calendar, MapPin, Clock, Users, Ticket, ArrowLeft,
  CheckCircle2, Plus, Minus, Share2, AlertCircle
} from 'lucide-react'
import PublicNav from '../components/layout/PublicNav'
import { PageLoader, Alert, Spinner, CategoryBadge } from '../components/ui'
import { eventsAPI, ordersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatCurrency, getPosterUrl } from '../utils/helpers'

export default function EventDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState('info') // info | purchase | confirmation
  const [quantity, setQuantity] = useState(1)
  const [selectedTier, setSelectedTier] = useState(null)
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '' })
  const [purchasing, setPurchasing] = useState(false)
  const [orderResult, setOrderResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    eventsAPI.get(slug)
      .then(res => {
        setEvent(res.data.data)
        setSelectedTier(res.data.data.ticketTiers?.[0] || null)
      })
      .catch(() => navigate('/events'))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: user.name, email: user.email }))
  }, [user])

  const remaining = event ? event.totalTickets - event.ticketsSold : 0
  const isSoldOut = remaining <= 0
  const tierRemaining = selectedTier ? selectedTier.quantity - selectedTier.sold : remaining
  const unitPrice = selectedTier?.price || event?.basePrice || 0
  const total = unitPrice * quantity

  const handlePurchase = async () => {
    if (!form.name || !form.email) { setError('Name and email are required.'); return }
    setPurchasing(true)
    setError('')
    try {
      const res = await ordersAPI.purchase({
        eventId: event._id,
        quantity,
        tierName: selectedTier?.name || 'General Admission',
        buyerName: form.name,
        buyerEmail: form.email,
        buyerPhone: form.phone,
      })
      setOrderResult(res.data.data)
      setStep('confirmation')
    } catch (e) {
      setError(e.response?.data?.message || 'Purchase failed. Please try again.')
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-ink-900"><PublicNav /><PageLoader /></div>
  if (!event) return null

  const poster = getPosterUrl(event.poster)

  return (
    <div className="min-h-screen bg-ink-900">
      <PublicNav />

      {/* Poster header */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        {poster ? (
          <img src={poster} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-ink-800 to-ink-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-6xl mx-auto px-4 sm:px-6 pb-6">
          <Link to="/events" className="inline-flex items-center gap-1.5 text-sm text-ink-300 hover:text-ink-100 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to events
          </Link>
          <div className="flex items-start gap-3">
            <CategoryBadge category={event.category} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 leading-tight tracking-tight">
            {event.name}
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Info */}
            <div className="card p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-4.5 h-4.5 text-amber-DEFAULT" />
                  </div>
                  <div>
                    <div className="text-xs text-ink-500 font-semibold uppercase tracking-wider mb-0.5">Date</div>
                    <div className="text-ink-100 font-semibold text-sm">{formatDate(event.date, 'EEEE, MMMM d, yyyy')}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Clock className="w-4.5 h-4.5 text-amber-DEFAULT" />
                  </div>
                  <div>
                    <div className="text-xs text-ink-500 font-semibold uppercase tracking-wider mb-0.5">Time</div>
                    <div className="text-ink-100 font-semibold text-sm">{event.time}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:col-span-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4.5 h-4.5 text-amber-DEFAULT" />
                  </div>
                  <div>
                    <div className="text-xs text-ink-500 font-semibold uppercase tracking-wider mb-0.5">Venue</div>
                    <div className="text-ink-100 font-semibold text-sm">{event.location.venue}</div>
                    <div className="text-ink-400 text-sm">{event.location.address && `${event.location.address}, `}{event.location.city}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="card p-6">
              <h2 className="font-bold text-ink-100 mb-3">About This Event</h2>
              <p className="text-ink-400 leading-relaxed text-sm whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* Organizer */}
            <div className="card p-6">
              <h2 className="font-bold text-ink-100 mb-3">Organizer</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ink-700 border border-ink-600 flex items-center justify-center text-amber-DEFAULT font-bold text-lg">
                  {event.organizer?.name?.[0]}
                </div>
                <div>
                  <div className="font-semibold text-ink-100 text-sm">{event.organizer?.organizationName || event.organizer?.name}</div>
                  <div className="text-xs text-ink-500">Event Organizer</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: purchase */}
          <div className="lg:col-span-1">
            {step === 'confirmation' ? (
              <div className="card p-6 sticky top-20 animate-slide-up">
                <div className="text-center mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-ink-50 text-lg mb-1">Order Confirmed</h3>
                  <p className="text-ink-400 text-sm">Check your email for tickets</p>
                </div>
                <div className="bg-ink-900 rounded-xl p-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-400">Order ID</span>
                    <span className="font-mono font-semibold text-amber-DEFAULT text-xs">{orderResult?.order?.orderId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-400">Tickets</span>
                    <span className="text-ink-100 font-semibold">{orderResult?.order?.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-ink-700 pt-2 mt-2">
                    <span className="text-ink-400">Total</span>
                    <span className="font-bold text-amber-DEFAULT">{formatCurrency(orderResult?.order?.totalAmount)}</span>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-ink-500 text-center">
                  <p>Tickets sent to <span className="text-ink-300 font-medium">{form.email}</span></p>
                </div>
                <Link to="/events" className="btn-secondary w-full justify-center mt-4 text-sm">
                  Browse More Events
                </Link>
              </div>
            ) : step === 'purchase' ? (
              <div className="card p-6 sticky top-20 animate-slide-up">
                <h3 className="font-bold text-ink-50 mb-4">Your Details</h3>
                {error && <Alert type="error" message={error} onClose={() => setError('')} />}
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="label">Full Name</label>
                    <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
                  </div>
                  <div>
                    <label className="label">Email Address</label>
                    <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ticket@email.com" />
                  </div>
                  <div>
                    <label className="label">Phone (optional)</label>
                    <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+27 82 000 0000" />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-ink-900 rounded-xl border border-ink-700 text-sm">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-2">
                    <Ticket className="w-3.5 h-3.5" /> Demo Payment Mode
                  </div>
                  <p className="text-ink-500 text-xs">This is a portfolio demo. No real payment will be charged.</p>
                </div>

                <div className="flex gap-2 mt-5">
                  <button onClick={() => setStep('info')} className="btn-secondary flex-1 justify-center text-sm">Back</button>
                  <button onClick={handlePurchase} disabled={purchasing} className="btn-primary flex-1 justify-center text-sm">
                    {purchasing ? <Spinner size="sm" /> : `Confirm`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="card p-6 sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-ink-50">Get Tickets</h3>
                  <div className="flex items-center gap-1.5 text-xs text-ink-400">
                    <Users className="w-3.5 h-3.5" />
                    {remaining} remaining
                  </div>
                </div>

                {/* Tier selector */}
                {event.ticketTiers?.length > 1 && (
                  <div className="mb-4 space-y-2">
                    <div className="label">Ticket Type</div>
                    {event.ticketTiers.map(tier => (
                      <button key={tier.name} onClick={() => setSelectedTier(tier)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${selectedTier?.name === tier.name ? 'border-amber-DEFAULT bg-amber-500/5 text-ink-100' : 'border-ink-700 hover:border-ink-600 text-ink-300'}`}>
                        <span className="font-semibold">{tier.name}</span>
                        <span className={`font-bold ${selectedTier?.name === tier.name ? 'text-amber-DEFAULT' : ''}`}>{formatCurrency(tier.price)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-4">
                  <div className="label">Quantity</div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-lg bg-ink-700 border border-ink-600 flex items-center justify-center text-ink-300 hover:bg-ink-600 transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-xl font-bold text-ink-100 w-8 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(10, q + 1, tierRemaining))}
                      className="w-9 h-9 rounded-lg bg-ink-700 border border-ink-600 flex items-center justify-center text-ink-300 hover:bg-ink-600 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="bg-ink-900 rounded-xl p-4 mb-5 space-y-2 text-sm">
                  <div className="flex justify-between text-ink-400">
                    <span>{formatCurrency(unitPrice)} × {quantity}</span>
                    <span>{formatCurrency(unitPrice * quantity)}</span>
                  </div>
                  <div className="border-t border-ink-700 pt-2 flex justify-between font-bold">
                    <span className="text-ink-200">Total</span>
                    <span className="text-amber-DEFAULT text-lg">{formatCurrency(total)}</span>
                  </div>
                </div>

                {isSoldOut ? (
                  <div className="flex items-center justify-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold">
                    <AlertCircle className="w-4 h-4" /> Sold Out
                  </div>
                ) : (
                  <button onClick={() => setStep('purchase')} className="btn-primary w-full justify-center text-base py-3">
                    <Ticket className="w-4.5 h-4.5" /> Buy Tickets
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

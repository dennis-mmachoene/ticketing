import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Ticket, DollarSign, Users, TrendingUp, Calendar,
  PlusCircle, ArrowRight, Eye, BarChart3, CheckCircle2
} from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { StatCard, PageLoader, EmptyState, CategoryBadge } from '../../components/ui'
import { eventsAPI } from '../../services/api'
import { formatDate, formatCurrency, getEventStatusColor } from '../../utils/helpers'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ink-800 border border-ink-600 rounded-xl p-3 text-xs shadow-xl">
      <div className="text-ink-400 mb-2 font-mono">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-ink-300 capitalize">{p.name}:</span>
          <span className="font-bold text-ink-100">
            {p.name === 'revenue' ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [eventAnalytics, setEventAnalytics] = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  useEffect(() => {
    eventsAPI.myEvents()
      .then(res => {
        const evts = res.data.data
        setEvents(evts)
        const totals = evts.reduce((acc, e) => ({
          tickets: acc.tickets + (e.ticketsSold || 0),
          revenue: acc.revenue + (e.totalRevenue || 0),
          capacity: acc.capacity + (e.totalTickets || 0),
        }), { tickets: 0, revenue: 0, capacity: 0 })
        setAnalytics(totals)
        if (evts.length > 0) loadEventAnalytics(evts[0])
      })
      .finally(() => setLoading(false))
  }, [])

  const loadEventAnalytics = async (event) => {
    setSelectedEvent(event)
    setLoadingAnalytics(true)
    try {
      const res = await eventsAPI.analytics(event._id)
      setEventAnalytics(res.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  if (loading) return <AppLayout><PageLoader /></AppLayout>

  const publishedEvents = events.filter(e => e.status === 'published')
  const draftEvents = events.filter(e => e.status === 'draft')

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Organizer Dashboard</h1>
        <p className="page-subtitle">{events.length} event{events.length !== 1 ? 's' : ''} total</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Events" value={events.length} icon={Calendar} color="amber" />
        <StatCard label="Tickets Sold" value={analytics.tickets?.toLocaleString() || 0} icon={Ticket} color="green" />
        <StatCard label="Total Revenue" value={formatCurrency(analytics.revenue || 0)} icon={DollarSign} color="blue" />
        <StatCard label="Published" value={publishedEvents.length} icon={CheckCircle2} color="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Event analytics chart */}
        <div className="xl:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-ink-100">Sales Analytics</h2>
              <p className="text-xs text-ink-500 mt-0.5">Last 30 days</p>
            </div>
            {events.length > 0 && (
              <select
                onChange={e => {
                  const evt = events.find(ev => ev._id === e.target.value)
                  if (evt) loadEventAnalytics(evt)
                }}
                value={selectedEvent?._id || ''}
                className="input py-1.5 text-xs w-auto max-w-[180px]"
              >
                {events.map(e => (
                  <option key={e._id} value={e._id}>{e.name.substring(0, 30)}</option>
                ))}
              </select>
            )}
          </div>

          {loadingAnalytics ? (
            <div className="h-48 flex items-center justify-center">
              <div className="text-ink-500 text-sm">Loading chart...</div>
            </div>
          ) : eventAnalytics?.salesByDay?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={eventAnalytics.salesByDay} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false}
                  tickFormatter={v => v?.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="tickets" stroke="#f59e0b" strokeWidth={2} fill="url(#ticketGrad)" dot={false} />
                <Area type="monotone" dataKey="revenue" stroke="#60a5fa" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-ink-600 text-sm">
              No sales data yet for this event
            </div>
          )}

          {eventAnalytics && (
            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-ink-700">
              {[
                { label: 'Sold', value: eventAnalytics.totalTicketsSold },
                { label: 'Remaining', value: eventAnalytics.ticketsRemaining },
                { label: 'Revenue', value: formatCurrency(eventAnalytics.totalRevenue) },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="font-bold text-ink-50 text-lg">{s.value}</div>
                  <div className="text-xs text-ink-500 font-semibold uppercase tracking-wider mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tier breakdown */}
        <div className="card p-6">
          <h2 className="font-bold text-ink-100 mb-5">Tickets by Tier</h2>
          {loadingAnalytics ? (
            <div className="h-48 flex items-center justify-center text-ink-500 text-sm">Loading...</div>
          ) : eventAnalytics?.ticketsByTier?.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={eventAnalytics.ticketsByTier} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-ink-600 text-sm">No data</div>
          )}

          {eventAnalytics?.totalTickets > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-ink-500 mb-1.5">
                <span>Capacity</span>
                <span>{Math.round((eventAnalytics.totalTicketsSold / eventAnalytics.totalTickets) * 100)}%</span>
              </div>
              <div className="h-2 bg-ink-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-DEFAULT rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (eventAnalytics.totalTicketsSold / eventAnalytics.totalTickets) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events list */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-ink-700">
          <h2 className="font-bold text-ink-100">My Events</h2>
          <Link to="/organizer/events/create" className="btn-primary text-sm py-2">
            <PlusCircle className="w-3.5 h-3.5" /> New Event
          </Link>
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events yet"
            description="Create your first event to start selling tickets."
            action={
              <Link to="/organizer/events/create" className="btn-primary">
                <PlusCircle className="w-4 h-4" /> Create Event
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-700">
                  <th className="table-header">Event</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Sold / Total</th>
                  <th className="table-header">Revenue</th>
                  <th className="table-header">Status</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event._id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-ink-700 overflow-hidden shrink-0">
                          {event.poster
                            ? <img src={`/uploads/${event.poster}`} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Calendar className="w-4 h-4 text-ink-500" /></div>
                          }
                        </div>
                        <div>
                          <div className="font-semibold text-ink-100 text-sm leading-snug max-w-[200px] truncate">{event.name}</div>
                          <CategoryBadge category={event.category} />
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-ink-400">{formatDate(event.date)}</td>
                    <td className="table-cell">
                      <div className="text-ink-200 font-semibold text-sm">{event.ticketsSold} / {event.totalTickets}</div>
                      <div className="w-20 h-1 bg-ink-700 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-amber-DEFAULT rounded-full" style={{ width: `${Math.min(100, (event.ticketsSold / event.totalTickets) * 100)}%` }} />
                      </div>
                    </td>
                    <td className="table-cell font-semibold text-amber-DEFAULT">{formatCurrency(event.totalRevenue || 0)}</td>
                    <td className="table-cell">
                      <span className={getEventStatusColor(event.status) + ' badge capitalize'}>{event.status}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <Link to={`/organizer/events/${event._id}`} className="btn-ghost py-1 px-2 text-xs">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => loadEventAnalytics(event)} className="btn-ghost py-1 px-2 text-xs">
                          <BarChart3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

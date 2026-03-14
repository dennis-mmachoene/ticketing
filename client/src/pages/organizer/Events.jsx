import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusCircle, Calendar, Eye, Edit, BarChart3,
  Filter, Search, Globe, Lock
} from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { PageLoader, EmptyState, CategoryBadge } from '../../components/ui'
import { eventsAPI } from '../../services/api'
import { formatDate, formatCurrency, getEventStatusColor } from '../../utils/helpers'

export default function OrganizerEvents() {
  const [events, setEvents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [publishing, setPublishing] = useState(null)

  useEffect(() => {
    eventsAPI.myEvents()
      .then(res => {
        setEvents(res.data.data)
        setFiltered(res.data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = events
    if (search) result = result.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'all') result = result.filter(e => e.status === statusFilter)
    setFiltered(result)
  }, [search, statusFilter, events])

  const handlePublish = async (event) => {
    setPublishing(event._id)
    try {
      await eventsAPI.publish(event._id)
      setEvents(prev => prev.map(e => e._id === event._id ? { ...e, status: 'published' } : e))
    } catch (e) {
      console.error(e)
    } finally {
      setPublishing(null)
    }
  }

  if (loading) return <AppLayout><PageLoader /></AppLayout>

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div className="page-header mb-0">
          <h1 className="page-title">My Events</h1>
          <p className="page-subtitle">{events.length} events total</p>
        </div>
        <Link to="/organizer/events/create" className="btn-primary">
          <PlusCircle className="w-4 h-4" /> New Event
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
          <input className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..." />
        </div>
        <div className="flex gap-1 bg-ink-800 border border-ink-700 p-1 rounded-xl">
          {['all', 'draft', 'published', 'completed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${statusFilter === s ? 'bg-amber-DEFAULT text-ink-950' : 'text-ink-400 hover:text-ink-200'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={search || statusFilter !== 'all' ? 'No matching events' : 'No events yet'}
          description={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Create your first event to start selling tickets.'}
          action={!search && statusFilter === 'all' && (
            <Link to="/organizer/events/create" className="btn-primary">
              <PlusCircle className="w-4 h-4" /> Create Event
            </Link>
          )}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(event => {
            const soldPct = Math.round((event.ticketsSold / event.totalTickets) * 100)
            return (
              <div key={event._id} className="card-hover p-5">
                <div className="flex gap-4">
                  {/* Poster thumb */}
                  <div className="w-20 h-20 rounded-xl bg-ink-700 overflow-hidden shrink-0 border border-ink-600">
                    {event.poster
                      ? <img src={`/uploads/${event.poster}`} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Calendar className="w-6 h-6 text-ink-500" /></div>
                    }
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-ink-100 leading-snug truncate">{event.name}</h3>
                      <span className={`${getEventStatusColor(event.status)} badge capitalize shrink-0`}>{event.status}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-ink-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(event.date)}
                      </span>
                      <CategoryBadge category={event.category} />
                      <span className="font-semibold text-amber-DEFAULT">
                        {formatCurrency(event.totalRevenue || 0)}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-DEFAULT rounded-full" style={{ width: `${soldPct}%` }} />
                      </div>
                      <span className="text-xs text-ink-500 shrink-0 font-mono">
                        {event.ticketsSold}/{event.totalTickets}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Link to={`/event/${event.slug}`} target="_blank" className="btn-ghost py-1.5 px-2.5 text-xs">
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <Link to={`/organizer/events/${event._id}/edit`} className="btn-ghost py-1.5 px-2.5 text-xs">
                      <Edit className="w-3.5 h-3.5" />
                    </Link>
                    {event.status === 'draft' && (
                      <button onClick={() => handlePublish(event)} disabled={publishing === event._id}
                        className="btn-primary py-1.5 px-2.5 text-xs">
                        {publishing === event._id ? '...' : <Globe className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}

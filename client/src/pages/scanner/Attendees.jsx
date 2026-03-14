import { useState, useEffect } from 'react'
import { Users, Search, CheckCircle2, Clock, XCircle } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { PageLoader, EmptyState, Pagination } from '../../components/ui'
import { scannerAPI } from '../../services/api'
import { formatDateTime, getTicketStatusColor } from '../../utils/helpers'

export default function Attendees() {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 })
  const [loading, setLoading] = useState(true)
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    scannerAPI.events()
      .then(res => {
        setEvents(res.data.data)
        if (res.data.data.length > 0) setSelectedEvent(res.data.data[0])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedEvent) return
    setTicketsLoading(true)
    scannerAPI.attendees(selectedEvent._id, { search, status: statusFilter, page, limit: 20 })
      .then(res => {
        setTickets(res.data.data)
        setPagination(res.data.pagination)
      })
      .finally(() => setTicketsLoading(false))
  }, [selectedEvent, search, statusFilter, page])

  const StatusIcon = ({ status }) => {
    if (status === 'valid') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    if (status === 'used') return <Clock className="w-4 h-4 text-blue-400" />
    return <XCircle className="w-4 h-4 text-red-400" />
  }

  if (loading) return <AppLayout><PageLoader /></AppLayout>

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Attendees</h1>
        <p className="page-subtitle">{pagination.total} tickets total</p>
      </div>

      {/* Event selector */}
      {events.length > 1 && (
        <div className="mb-5">
          <label className="label">Select Event</label>
          <select className="input max-w-sm" value={selectedEvent?._id || ''} onChange={e => {
            const evt = events.find(ev => ev._id === e.target.value)
            setSelectedEvent(evt)
            setPage(1)
          }}>
            {events.map(e => (
              <option key={e._id} value={e._id}>{e.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
          <input className="input pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search by name, email, ticket ID..." />
        </div>
        <div className="flex gap-1 bg-ink-800 border border-ink-700 p-1 rounded-xl shrink-0">
          {[
            { value: '', label: 'All' },
            { value: 'valid', label: 'Valid' },
            { value: 'used', label: 'Used' },
          ].map(opt => (
            <button key={opt.value} onClick={() => { setStatusFilter(opt.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === opt.value ? 'bg-amber-DEFAULT text-ink-950' : 'text-ink-400 hover:text-ink-200'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {ticketsLoading ? (
        <PageLoader />
      ) : tickets.length === 0 ? (
        <EmptyState icon={Users} title="No attendees found" description="No tickets match your search." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-700">
                  <th className="table-header">Attendee</th>
                  <th className="table-header hidden sm:table-cell">Ticket ID</th>
                  <th className="table-header hidden md:table-cell">Type</th>
                  <th className="table-header">Status</th>
                  <th className="table-header hidden lg:table-cell">Check-in</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket._id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <div className="font-semibold text-ink-100 text-sm">{ticket.holder.name}</div>
                        <div className="text-ink-500 text-xs">{ticket.holder.email}</div>
                      </div>
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      <span className="font-mono text-xs text-amber-400">{ticket.ticketId}</span>
                    </td>
                    <td className="table-cell hidden md:table-cell text-ink-400 text-sm">{ticket.tierName}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={ticket.status} />
                        <span className={`${getTicketStatusColor(ticket.status)} badge capitalize text-xs`}>{ticket.status}</span>
                      </div>
                    </td>
                    <td className="table-cell hidden lg:table-cell text-ink-500 text-xs">
                      {ticket.usedAt ? formatDateTime(ticket.usedAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />
        </>
      )}
    </AppLayout>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, Calendar, MapPin, Download, ArrowRight, Package } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { PageLoader, EmptyState } from '../../components/ui'
import { ordersAPI } from '../../services/api'
import { formatDate, formatCurrency, getTicketStatusColor, getPosterUrl } from '../../utils/helpers'

export default function MyTickets() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ordersAPI.myOrders()
      .then(res => setOrders(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AppLayout><PageLoader /></AppLayout>

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">My Tickets</h1>
        <p className="page-subtitle">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No tickets yet"
          description="Browse upcoming events and buy your first ticket."
          action={
            <Link to="/events" className="btn-primary">
              <ArrowRight className="w-4 h-4" /> Browse Events
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const event = order.event
            const poster = getPosterUrl(event?.poster)
            return (
              <div key={order._id} className="card overflow-hidden">
                {/* Order header */}
                <div className="flex items-center justify-between px-5 py-3 bg-ink-700/30 border-b border-ink-700">
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-ink-500" />
                    <span className="text-xs font-mono text-ink-400">{order.orderId}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-500">{formatDate(order.createdAt)}</span>
                    <span className="font-bold text-amber-DEFAULT text-sm">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>

                <div className="p-5">
                  {/* Event info */}
                  <div className="flex gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-ink-700 border border-ink-600 shrink-0">
                      {poster
                        ? <img src={poster} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Calendar className="w-6 h-6 text-ink-500" /></div>
                      }
                    </div>
                    <div>
                      <h3 className="font-bold text-ink-100 mb-1">{event?.name}</h3>
                      <div className="flex flex-wrap gap-3 text-xs text-ink-500">
                        {event?.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(event.date, 'EEE, MMM d, yyyy')} · {event.time}
                          </span>
                        )}
                        {event?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location.venue}, {event.location.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Individual tickets */}
                  <div className="space-y-2">
                    {order.tickets?.map((ticket, i) => (
                      <div key={ticket._id || i} className="flex items-center justify-between p-3 bg-ink-900 rounded-xl border border-ink-700">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Ticket className="w-4 h-4 text-amber-DEFAULT" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-ink-200">{ticket.holder?.name || order.buyerDetails?.name}</div>
                            <div className="text-xs text-ink-500 font-mono">{ticket.ticketId}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`${getTicketStatusColor(ticket.status)} badge text-xs capitalize`}>
                            {ticket.status}
                          </span>
                          {ticket.status === 'valid' && (
                            <a
                              href={ordersAPI.downloadTicket(ticket.ticketId)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-ghost py-1 px-2.5 text-xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
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

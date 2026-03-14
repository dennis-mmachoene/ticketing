import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Calendar, DollarSign, ShoppingCart,
  ShieldCheck, Ban, Star, TrendingUp
} from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { StatCard, PageLoader, Pagination } from '../../components/ui'
import { adminAPI } from '../../services/api'
import { formatDate, formatCurrency, getRoleBadgeClass, getRoleLabel, getEventStatusColor } from '../../utils/helpers'
import { Tabs } from '../../components/ui'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [userPage, setUserPage] = useState(1)
  const [eventPage, setEventPage] = useState(1)
  const [userPagination, setUserPagination] = useState({ pages: 1 })
  const [eventPagination, setEventPagination] = useState({ pages: 1 })
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    adminAPI.stats()
      .then(res => setStats(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'users') {
      adminAPI.users({ page: userPage, limit: 15 })
        .then(res => { setUsers(res.data.data); setUserPagination(res.data.pagination) })
    }
  }, [tab, userPage])

  useEffect(() => {
    if (tab === 'events') {
      adminAPI.events({ page: eventPage, limit: 15 })
        .then(res => { setEvents(res.data.data); setEventPagination(res.data.pagination) })
    }
  }, [tab, eventPage])

  const handleSuspendUser = async (userId) => {
    setActionLoading(userId)
    try {
      await adminAPI.suspendUser(userId)
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: false } : u))
    } finally { setActionLoading(null) }
  }

  const handleActivateUser = async (userId) => {
    setActionLoading(userId)
    try {
      await adminAPI.activateUser(userId)
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: true } : u))
    } finally { setActionLoading(null) }
  }

  const handleSuspendEvent = async (eventId) => {
    setActionLoading(eventId)
    try {
      await adminAPI.suspendEvent(eventId)
      setEvents(prev => prev.map(e => e._id === eventId ? { ...e, status: 'suspended' } : e))
    } finally { setActionLoading(null) }
  }

  const handleFeatureEvent = async (eventId) => {
    setActionLoading(eventId)
    try {
      await adminAPI.featureEvent(eventId)
      setEvents(prev => prev.map(e => e._id === eventId ? { ...e, isFeatured: !e.isFeatured } : e))
    } finally { setActionLoading(null) }
  }

  if (loading) return <AppLayout><PageLoader /></AppLayout>

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div className="page-header mb-0">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Platform overview and management</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-red-400" />
          <span className="text-xs font-bold text-red-400">Admin Access</span>
        </div>
      </div>

      <Tabs
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'users', label: 'Users' },
          { value: 'events', label: 'Events' },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-6"
      />

      <div className="mt-6">
        {tab === 'overview' && stats && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats.totalUsers?.toLocaleString()} icon={Users} color="blue" />
              <StatCard label="Total Events" value={stats.totalEvents?.toLocaleString()} icon={Calendar} color="amber" />
              <StatCard label="Total Orders" value={stats.totalOrders?.toLocaleString()} icon={ShoppingCart} color="green" />
              <StatCard label="Total Revenue" value={formatCurrency(stats.totalRevenue || 0)} icon={DollarSign} color="purple" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Users by role */}
              <div className="card p-5">
                <h3 className="font-bold text-ink-100 mb-4">Users by Role</h3>
                <div className="space-y-3">
                  {stats.usersByRole?.map(r => (
                    <div key={r._id} className="flex items-center justify-between">
                      <span className={`badge capitalize ${getRoleBadgeClass(r._id)}`}>{getRoleLabel(r._id)}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-DEFAULT rounded-full" style={{ width: `${Math.min(100, (r.count / stats.totalUsers) * 100)}%` }} />
                        </div>
                        <span className="text-sm font-bold text-ink-200 w-6 text-right">{r.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Events by status */}
              <div className="card p-5">
                <h3 className="font-bold text-ink-100 mb-4">Events by Status</h3>
                <div className="space-y-3">
                  {stats.eventsByStatus?.map(s => (
                    <div key={s._id} className="flex items-center justify-between">
                      <span className={`badge capitalize ${getEventStatusColor(s._id)}`}>{s._id}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-DEFAULT rounded-full" style={{ width: `${Math.min(100, (s.count / stats.totalEvents) * 100)}%` }} />
                        </div>
                        <span className="text-sm font-bold text-ink-200 w-6 text-right">{s.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent orders */}
            {stats.recentOrders?.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-ink-700">
                  <h3 className="font-bold text-ink-100">Recent Orders</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-ink-700">
                        <th className="table-header">Order ID</th>
                        <th className="table-header">Event</th>
                        <th className="table-header">Buyer</th>
                        <th className="table-header">Amount</th>
                        <th className="table-header">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.map(order => (
                        <tr key={order._id} className="table-row">
                          <td className="table-cell"><span className="font-mono text-xs text-amber-400">{order.orderId}</span></td>
                          <td className="table-cell text-ink-300 text-sm">{order.event?.name?.substring(0, 30)}</td>
                          <td className="table-cell text-ink-400 text-sm">{order.buyerDetails?.name}</td>
                          <td className="table-cell font-semibold text-emerald-400">{formatCurrency(order.totalAmount)}</td>
                          <td className="table-cell text-ink-500 text-xs">{formatDate(order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div className="animate-fade-in">
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-700">
                    <th className="table-header">User</th>
                    <th className="table-header">Role</th>
                    <th className="table-header">Joined</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <div className="font-semibold text-ink-100 text-sm">{user.name}</div>
                          <div className="text-ink-500 text-xs">{user.email}</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge capitalize ${getRoleBadgeClass(user.role)}`}>{getRoleLabel(user.role)}</span>
                      </td>
                      <td className="table-cell text-ink-500 text-xs">{formatDate(user.createdAt)}</td>
                      <td className="table-cell">
                        <span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>
                          {user.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="table-cell">
                        {user.isActive ? (
                          <button onClick={() => handleSuspendUser(user._id)} disabled={actionLoading === user._id}
                            className="btn-ghost py-1 px-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => handleActivateUser(user._id)} disabled={actionLoading === user._id}
                            className="btn-ghost py-1 px-2.5 text-xs text-emerald-400 hover:text-emerald-300">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={userPage} pages={userPagination.pages} onChange={setUserPage} />
          </div>
        )}

        {tab === 'events' && (
          <div className="animate-fade-in">
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-700">
                    <th className="table-header">Event</th>
                    <th className="table-header">Organizer</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Sold</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr key={event._id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          {event.isFeatured && <Star className="w-3 h-3 text-amber-DEFAULT fill-amber-DEFAULT shrink-0" />}
                          <span className="font-semibold text-ink-100 text-sm truncate max-w-[180px]">{event.name}</span>
                        </div>
                      </td>
                      <td className="table-cell text-ink-400 text-sm">{event.organizer?.name}</td>
                      <td className="table-cell text-ink-500 text-xs">{formatDate(event.date)}</td>
                      <td className="table-cell text-ink-300 text-sm font-mono">
                        {event.ticketsSold}/{event.totalTickets}
                      </td>
                      <td className="table-cell">
                        <span className={`badge capitalize ${getEventStatusColor(event.status)}`}>{event.status}</span>
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          <button onClick={() => handleFeatureEvent(event._id)} disabled={actionLoading === event._id}
                            className={`btn-ghost py-1 px-2 text-xs ${event.isFeatured ? 'text-amber-DEFAULT' : 'text-ink-500'}`}
                            title={event.isFeatured ? 'Unfeature' : 'Feature'}>
                            <Star className="w-3.5 h-3.5" />
                          </button>
                          {event.status !== 'suspended' && (
                            <button onClick={() => handleSuspendEvent(event._id)} disabled={actionLoading === event._id}
                              className="btn-ghost py-1 px-2 text-xs text-red-400 hover:text-red-300">
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={eventPage} pages={eventPagination.pages} onChange={setEventPage} />
          </div>
        )}
      </div>
    </AppLayout>
  )
}

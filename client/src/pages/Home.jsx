import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Calendar, Ticket, ScanLine, BarChart3, MapPin, ChevronRight } from 'lucide-react'
import PublicNav from '../components/layout/PublicNav'
import EventCard from '../components/events/EventCard'
import { PageLoader } from '../components/ui'
import { eventsAPI } from '../services/api'

const CATEGORIES = [
  { value: 'music', label: 'Music' },
  { value: 'technology', label: 'Tech' },
  { value: 'sports', label: 'Sports' },
  { value: 'arts', label: 'Arts' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'conference', label: 'Conference' },
  { value: 'food', label: 'Food' },
  { value: 'theatre', label: 'Theatre' },
]

export default function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [featured, setFeatured] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [feat, rec] = await Promise.all([
          eventsAPI.list({ featured: true, limit: 3 }),
          eventsAPI.list({ limit: 6 }),
        ])
        setFeatured(feat.data.data)
        setRecent(rec.data.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/events?search=${encodeURIComponent(query.trim())}`)
    else navigate('/events')
  }

  return (
    <div className="min-h-screen bg-ink-900">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-900 to-ink-800" />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #f59e0b 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full mb-6 tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Live Events
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-ink-50 leading-[1.05] tracking-tight mb-6">
              Where great<br />
              <span className="text-amber-DEFAULT">events happen.</span>
            </h1>

            <p className="text-ink-400 text-xl mb-10 leading-relaxed max-w-lg">
              Discover, buy and manage event tickets with confidence. From concerts to conferences — all in one platform.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mb-10">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search events, venues, cities..."
                  className="w-full bg-ink-800 border border-ink-600 text-ink-100 rounded-xl pl-12 pr-4 py-4 text-base placeholder:text-ink-500 focus:outline-none focus:border-amber-DEFAULT focus:ring-2 focus:ring-amber-DEFAULT/20 transition-all"
                />
              </div>
              <button type="submit" className="btn-primary px-6 py-4 text-base rounded-xl">
                Search
              </button>
            </form>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <Link key={cat.value} to={`/events?category=${cat.value}`}
                  className="px-3 py-1.5 bg-ink-800 border border-ink-700 text-ink-400 text-xs font-semibold rounded-lg hover:border-amber-DEFAULT/50 hover:text-amber-DEFAULT transition-all">
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y border-ink-800 bg-ink-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
            {[
              { icon: Calendar, label: 'Active Events', value: '50+' },
              { icon: Ticket, label: 'Tickets Sold', value: '10k+' },
              { icon: ScanLine, label: 'QR Validations', value: '99.9%' },
              { icon: BarChart3, label: 'Organizer Revenue', value: 'R 2M+' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-amber-DEFAULT" />
                <span className="font-bold text-ink-100 text-sm">{value}</span>
                <span className="text-ink-500 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Events */}
      {!loading && featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs font-bold text-amber-DEFAULT uppercase tracking-widest mb-2">Spotlight</div>
              <h2 className="text-2xl font-bold text-ink-50">Featured Events</h2>
            </div>
            <Link to="/events?featured=true" className="btn-ghost text-sm">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map(event => (
              <EventCard key={event._id} event={event} variant="featured" />
            ))}
          </div>
        </section>
      )}

      {/* All upcoming events */}
      {!loading && recent.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs font-bold text-amber-DEFAULT uppercase tracking-widest mb-2">Upcoming</div>
              <h2 className="text-2xl font-bold text-ink-50">Browse Events</h2>
            </div>
            <Link to="/events" className="btn-ghost text-sm">
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recent.map(event => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </section>
      )}

      {loading && <PageLoader />}

      {/* CTA */}
      <section className="border-t border-ink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-ink-50 mb-4">Ready to host your event?</h2>
          <p className="text-ink-400 text-lg mb-8 max-w-md mx-auto">
            Create your event in minutes, sell tickets, and manage everything from one dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-primary text-base px-8 py-3.5">
              Start Selling Tickets <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/events" className="btn-secondary text-base px-8 py-3.5">
              Explore Events
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-800 bg-ink-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-amber-DEFAULT rounded flex items-center justify-center">
                <Ticket className="w-3.5 h-3.5 text-ink-950" />
              </div>
              <span className="font-bold text-ink-200 text-sm">TicketVault</span>
            </div>
            <p className="text-ink-600 text-xs">
              Modern event ticketing platform — Built for organizers, loved by attendees.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

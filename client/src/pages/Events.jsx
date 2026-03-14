import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import PublicNav from '../components/layout/PublicNav'
import EventCard from '../components/events/EventCard'
import { PageLoader, EmptyState, Pagination } from '../components/ui'
import { eventsAPI } from '../services/api'
import { Calendar } from 'lucide-react'

const CATEGORIES = ['music', 'sports', 'arts', 'technology', 'business', 'food', 'comedy', 'theatre', 'conference', 'other']
const CAT_LABELS = { music: 'Music', sports: 'Sports', arts: 'Arts', technology: 'Technology', business: 'Business', food: 'Food & Drink', comedy: 'Comedy', theatre: 'Theatre', conference: 'Conference', other: 'Other' }

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 })
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const city = searchParams.get('city') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const [localSearch, setLocalSearch] = useState(search)
  const [localCity, setLocalCity] = useState(city)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await eventsAPI.list({ search, category, city, page, limit: 12 })
        setEvents(res.data.data)
        setPagination(res.data.pagination)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [search, category, city, page])

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value); else p.delete(key)
    p.delete('page')
    setSearchParams(p)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    updateParam('search', localSearch)
    updateParam('city', localCity)
  }

  const clearFilters = () => {
    setLocalSearch('')
    setLocalCity('')
    setSearchParams({})
  }

  const hasFilters = search || category || city

  return (
    <div className="min-h-screen bg-ink-900">
      <PublicNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="page-header">
          <h1 className="page-title">
            {search ? `Results for "${search}"` : category ? `${CAT_LABELS[category] || category} Events` : 'All Events'}
          </h1>
          <p className="page-subtitle">
            {pagination.total} event{pagination.total !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
              <input
                type="text"
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                placeholder="Search events..."
                className="input pl-9"
              />
            </div>
            <input
              type="text"
              value={localCity}
              onChange={e => setLocalCity(e.target.value)}
              placeholder="City..."
              className="input w-36"
            />
            <button type="submit" className="btn-primary shrink-0">Search</button>
          </form>
          <button onClick={() => setShowFilters(v => !v)} className={`btn-ghost shrink-0 ${showFilters ? 'bg-ink-700' : ''}`}>
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost text-red-400 hover:text-red-300 shrink-0">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {/* Category filter */}
        {showFilters && (
          <div className="mb-6 p-4 bg-ink-800 border border-ink-700 rounded-xl animate-fade-in">
            <div className="label mb-3">Category</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => updateParam('category', '')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${!category ? 'bg-amber-DEFAULT text-ink-950' : 'bg-ink-700 text-ink-300 hover:bg-ink-600'}`}>
                All
              </button>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => updateParam('category', cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${category === cat ? 'bg-amber-DEFAULT text-ink-950' : 'bg-ink-700 text-ink-300 hover:bg-ink-600'}`}>
                  {CAT_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <PageLoader />
        ) : events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events found"
            description="Try adjusting your search or filters to find events."
            action={<button onClick={clearFilters} className="btn-secondary">Clear Filters</button>}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map(event => (
                <EventCard key={event._id} event={event} variant="featured" />
              ))}
            </div>
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              onChange={p => updateParam('page', p)}
            />
          </>
        )}
      </div>
    </div>
  )
}

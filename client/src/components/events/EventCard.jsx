import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, ArrowRight, Star } from 'lucide-react'
import { formatDate, formatCurrency, getPosterUrl, truncate } from '../../utils/helpers'
import { CategoryBadge } from '../ui'

export default function EventCard({ event, variant = 'default' }) {
  const poster = getPosterUrl(event.poster)
  const remaining = event.totalTickets - event.ticketsSold
  const soldPct = Math.round((event.ticketsSold / event.totalTickets) * 100)
  const isSoldOut = remaining <= 0
  const isLow = remaining > 0 && remaining <= 20

  if (variant === 'featured') {
    return (
      <Link to={`/event/${event.slug}`} className="group relative block rounded-2xl overflow-hidden bg-ink-800 border border-ink-700 hover:border-ink-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
        {/* Poster */}
        <div className="relative h-56 overflow-hidden bg-ink-700">
          {poster ? (
            <img src={poster} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ink-700 to-ink-800">
              <Calendar className="w-16 h-16 text-ink-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-transparent" />
          {event.isFeatured && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-DEFAULT text-ink-950 text-xs font-bold px-2.5 py-1 rounded">
              <Star className="w-3 h-3" fill="currentColor" />
              Featured
            </div>
          )}
          <div className="absolute top-3 right-3">
            <CategoryBadge category={event.category} />
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-bold text-ink-50 text-lg leading-snug mb-2 group-hover:text-amber-DEFAULT transition-colors line-clamp-2">
            {event.name}
          </h3>
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-ink-400 text-sm">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-amber-DEFAULT" />
              <span>{formatDate(event.date, 'EEE, MMM d, yyyy')} · {event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-ink-400 text-sm">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-DEFAULT" />
              <span className="truncate">{event.location?.venue}, {event.location?.city}</span>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="h-1 bg-ink-700 rounded-full overflow-hidden">
              <div className="h-full bg-amber-DEFAULT rounded-full transition-all" style={{ width: `${soldPct}%` }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-ink-500">{isSoldOut ? 'Sold out' : isLow ? `Only ${remaining} left` : `${remaining} available`}</span>
              <span className="text-xs text-ink-500">{soldPct}% sold</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-ink-500 mb-0.5">From</div>
              <div className="text-lg font-bold text-amber-DEFAULT">{formatCurrency(event.basePrice)}</div>
            </div>
            <div className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-all ${isSoldOut ? 'bg-ink-700 text-ink-500' : 'bg-amber-DEFAULT text-ink-950 group-hover:bg-amber-light'}`}>
              {isSoldOut ? 'Sold Out' : 'Get Tickets'}
              {!isSoldOut && <ArrowRight className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Compact variant
  return (
    <Link to={`/event/${event.slug}`} className="group flex gap-4 p-4 bg-ink-800 border border-ink-700 rounded-xl hover:border-ink-600 transition-all duration-200">
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-ink-700 shrink-0">
        {poster ? (
          <img src={poster} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-6 h-6 text-ink-500" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-ink-100 text-sm leading-snug truncate group-hover:text-amber-DEFAULT transition-colors">
            {event.name}
          </h4>
          <CategoryBadge category={event.category} />
        </div>
        <div className="flex items-center gap-1.5 text-ink-500 text-xs mb-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(event.date, 'MMM d')} · {event.time}</span>
        </div>
        <div className="flex items-center gap-1.5 text-ink-500 text-xs">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{event.location?.city}</span>
        </div>
        <div className="mt-2 font-bold text-amber-DEFAULT text-sm">{formatCurrency(event.basePrice)}</div>
      </div>
    </Link>
  )
}

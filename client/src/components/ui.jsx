import { Loader2, AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useState, useEffect } from 'react'

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12' }
  return <Loader2 className={`animate-spin text-amber-DEFAULT ${sizes[size]} ${className}`} />
}

export const LoadingScreen = ({ message = 'Loading...' }) => (
  <div className="min-h-screen bg-ink-900 flex items-center justify-center">
    <div className="text-center animate-fade-in">
      <Spinner size="xl" />
      <p className="mt-4 text-ink-400 text-sm">{message}</p>
    </div>
  </div>
)

export const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Spinner size="lg" />
  </div>
)

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-ink-800 border border-ink-700 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-ink-500" />
      </div>
    )}
    <h3 className="text-ink-200 font-semibold text-lg mb-2">{title}</h3>
    {description && <p className="text-ink-500 text-sm max-w-sm mb-6">{description}</p>}
    {action}
  </div>
)

export const Alert = ({ type = 'info', message, onClose }) => {
  const styles = {
    info: { wrap: 'bg-blue-500/10 border-blue-500/30 text-blue-300', Icon: Info },
    success: { wrap: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300', Icon: CheckCircle2 },
    error: { wrap: 'bg-red-500/10 border-red-500/30 text-red-300', Icon: AlertCircle },
    warning: { wrap: 'bg-amber-500/10 border-amber-500/30 text-amber-300', Icon: AlertCircle },
  }
  const { wrap, Icon } = styles[type]
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border text-sm ${wrap} animate-fade-in`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  const styles = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-amber-500 text-ink-950',
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-2xl text-sm font-medium animate-slide-up ${styles[type]}`}>
      {type === 'success' && <CheckCircle2 className="w-4 h-4" />}
      {type === 'error' && <AlertCircle className="w-4 h-4" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl animate-slide-up`}>
        <div className="flex items-center justify-between p-6 border-b border-ink-700">
          <h2 className="font-bold text-ink-50 text-lg">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-400 hover:text-ink-200 hover:bg-ink-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export const StatCard = ({ label, value, icon: Icon, trend, color = 'amber', sub }) => {
  const colors = {
    amber: 'text-amber-DEFAULT bg-amber-500/10',
    green: 'text-emerald-400 bg-emerald-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    red: 'text-red-400 bg-red-500/10',
  }
  return (
    <div className="stat-card animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded ${trend >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-ink-50 mb-1">{value}</div>
      <div className="text-xs font-semibold text-ink-400 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-xs text-ink-500 mt-1">{sub}</div>}
    </div>
  )
}

export const CategoryBadge = ({ category }) => {
  const colors = {
    music: 'bg-purple-500/10 text-purple-400',
    sports: 'bg-blue-500/10 text-blue-400',
    arts: 'bg-orange-500/10 text-orange-400',
    technology: 'bg-cyan-500/10 text-cyan-400',
    business: 'bg-slate-500/10 text-slate-400',
    food: 'bg-red-500/10 text-red-400',
    comedy: 'bg-yellow-500/10 text-yellow-400',
    theatre: 'bg-indigo-500/10 text-indigo-400',
    conference: 'bg-teal-500/10 text-teal-400',
    other: 'bg-ink-600/50 text-ink-300',
  }
  const label = { music: 'Music', sports: 'Sports', arts: 'Arts', technology: 'Tech', business: 'Business', food: 'Food', comedy: 'Comedy', theatre: 'Theatre', conference: 'Conference', other: 'Other' }
  return (
    <span className={`badge text-[10px] font-bold uppercase tracking-wider ${colors[category] || colors.other}`}>
      {label[category] || category}
    </span>
  )
}

export const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 bg-ink-800 border border-ink-700 p-1 rounded-xl w-fit">
    {tabs.map(tab => (
      <button
        key={tab.value}
        onClick={() => onChange(tab.value)}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
          active === tab.value
            ? 'bg-amber-DEFAULT text-ink-950'
            : 'text-ink-400 hover:text-ink-200'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
)

export const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} className="btn-ghost disabled:opacity-30">
        Prev
      </button>
      <span className="text-sm text-ink-400">
        Page {page} of {pages}
      </span>
      <button onClick={() => onChange(page + 1)} disabled={page >= pages} className="btn-ghost disabled:opacity-30">
        Next
      </button>
    </div>
  )
}

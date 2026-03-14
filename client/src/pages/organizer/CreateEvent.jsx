import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Upload, X, Plus, Trash2, ChevronRight, Calendar,
  MapPin, Tag, Ticket, DollarSign, Image, AlertCircle
} from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { Alert, Spinner } from '../../components/ui'
import { eventsAPI } from '../../services/api'

const CATEGORIES = ['music', 'sports', 'arts', 'technology', 'business', 'food', 'comedy', 'theatre', 'conference', 'other']

const STEPS = [
  { id: 'basics', label: 'Basic Info' },
  { id: 'location', label: 'Location' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'media', label: 'Media' },
]

export default function CreateEvent() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const fileRef = useRef()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [posterPreview, setPosterPreview] = useState(null)
  const [posterFile, setPosterFile] = useState(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    date: '',
    time: '18:00',
    endDate: '',
    category: 'music',
    venue: '',
    address: '',
    city: '',
    country: 'South Africa',
    basePrice: '',
    totalTickets: '',
    tags: '',
    tiers: [
      { name: 'General Admission', price: '', quantity: '' },
    ],
  })

  useEffect(() => {
    if (isEditing) {
      // Load event for editing would go here
      // eventsAPI.getById(id).then(...)
    }
  }, [id])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handlePoster = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPosterFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPosterPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const updateTier = (i, key, val) => {
    setForm(f => {
      const tiers = [...f.tiers]
      tiers[i] = { ...tiers[i], [key]: val }
      return { ...f, tiers }
    })
  }

  const addTier = () => setForm(f => ({ ...f, tiers: [...f.tiers, { name: '', price: '', quantity: '' }] }))
  const removeTier = (i) => setForm(f => ({ ...f, tiers: f.tiers.filter((_, idx) => idx !== i) }))

  const buildFormData = (publish = false) => {
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('description', form.description)
    fd.append('date', form.date)
    fd.append('time', form.time)
    if (form.endDate) fd.append('endDate', form.endDate)
    fd.append('category', form.category)
    fd.append('venue', form.venue)
    fd.append('address', form.address)
    fd.append('city', form.city)
    fd.append('country', form.country)
    fd.append('basePrice', form.tiers[0]?.price || form.basePrice)
    const totalQ = form.tiers.reduce((s, t) => s + (parseInt(t.quantity) || 0), 0)
    fd.append('totalTickets', totalQ || form.totalTickets)
    fd.append('tags', form.tags)
    fd.append('ticketTiers', JSON.stringify(
      form.tiers.map(t => ({ name: t.name, price: parseFloat(t.price) || 0, quantity: parseInt(t.quantity) || 0 }))
    ))
    if (publish) fd.append('status', 'published')
    if (posterFile) fd.append('poster', posterFile)
    return fd
  }

  const handleSave = async (publish = false) => {
    if (!form.name || !form.date || !form.venue || !form.city) {
      setError('Please complete all required fields.')
      setStep(0)
      return
    }
    if (form.tiers.some(t => !t.name || !t.price || !t.quantity)) {
      setError('All ticket tiers must have a name, price, and quantity.')
      setStep(2)
      return
    }

    publish ? setPublishing(true) : setSaving(true)
    setError('')
    try {
      const fd = buildFormData(publish)
      const res = isEditing
        ? await eventsAPI.update(id, fd)
        : await eventsAPI.create(fd)

      const eventId = res.data.data._id
      if (publish) {
        await eventsAPI.publish(eventId)
      }
      navigate('/organizer/events')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save event.')
    } finally {
      setSaving(false)
      setPublishing(false)
    }
  }

  const stepValid = () => {
    if (step === 0) return form.name && form.description && form.date && form.time && form.category
    if (step === 1) return form.venue && form.city
    if (step === 2) return form.tiers.length > 0 && form.tiers[0].price && form.tiers[0].quantity
    return true
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">{isEditing ? 'Edit Event' : 'Create Event'}</h1>
          <p className="page-subtitle">Fill in the details to {isEditing ? 'update your' : 'publish a new'} event.</p>
        </div>

        {/* Step nav */}
        <div className="flex items-center gap-1 mb-8 p-1 bg-ink-800 border border-ink-700 rounded-xl">
          {STEPS.map((s, i) => (
            <button key={s.id} onClick={() => i < step + 1 && setStep(i)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${step === i ? 'bg-amber-DEFAULT text-ink-950' : i < step ? 'text-ink-300 hover:text-ink-100' : 'text-ink-600 cursor-default'}`}>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          ))}
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-5" />}

        <div className="card p-6 mb-5">
          {/* Step 0: Basic info */}
          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-bold text-ink-100 flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-amber-DEFAULT" /> Basic Information
              </h2>
              <div>
                <label className="label">Event Name <span className="text-red-400">*</span></label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Neon Pulse Electronic Festival 2025" />
              </div>
              <div>
                <label className="label">Description <span className="text-red-400">*</span></label>
                <textarea className="input min-h-[120px] resize-y" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Tell attendees what to expect..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Event Date <span className="text-red-400">*</span></label>
                  <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="label">Start Time <span className="text-red-400">*</span></label>
                  <input className="input" type="time" value={form.time} onChange={e => set('time', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Category <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat} type="button" onClick={() => set('category', cat)}
                      className={`py-2 px-1 rounded-xl border text-xs font-semibold capitalize transition-all ${form.category === cat ? 'border-amber-DEFAULT bg-amber-500/10 text-amber-DEFAULT' : 'border-ink-700 text-ink-400 hover:border-ink-600 hover:text-ink-200'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Tags (comma-separated)</label>
                <input className="input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="music, festival, outdoor" />
              </div>
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-bold text-ink-100 flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-amber-DEFAULT" /> Location
              </h2>
              <div>
                <label className="label">Venue Name <span className="text-red-400">*</span></label>
                <input className="input" value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="e.g. Grand Arena" />
              </div>
              <div>
                <label className="label">Street Address</label>
                <input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="e.g. 1 Arena Boulevard" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">City <span className="text-red-400">*</span></label>
                  <input className="input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Cape Town" />
                </div>
                <div>
                  <label className="label">Country</label>
                  <input className="input" value={form.country} onChange={e => set('country', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Tickets */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-bold text-ink-100 flex items-center gap-2 mb-4">
                <Ticket className="w-5 h-5 text-amber-DEFAULT" /> Ticket Tiers
              </h2>
              <p className="text-xs text-ink-500">Define one or more ticket tiers. Total capacity is the sum of all tier quantities.</p>
              <div className="space-y-3">
                {form.tiers.map((tier, i) => (
                  <div key={i} className="p-4 bg-ink-900 border border-ink-700 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Tier {i + 1}</span>
                      {form.tiers.length > 1 && (
                        <button onClick={() => removeTier(i)} className="text-red-400 hover:text-red-300 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-3 sm:col-span-1">
                        <label className="label">Name</label>
                        <input className="input text-sm" value={tier.name} onChange={e => updateTier(i, 'name', e.target.value)} placeholder="General Admission" />
                      </div>
                      <div>
                        <label className="label">Price (R)</label>
                        <input className="input text-sm" type="number" min="0" step="0.01" value={tier.price} onChange={e => updateTier(i, 'price', e.target.value)} placeholder="0.00" />
                      </div>
                      <div>
                        <label className="label">Quantity</label>
                        <input className="input text-sm" type="number" min="1" value={tier.quantity} onChange={e => updateTier(i, 'quantity', e.target.value)} placeholder="100" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {form.tiers.length < 5 && (
                <button onClick={addTier} className="btn-ghost w-full justify-center border border-dashed border-ink-600 py-3">
                  <Plus className="w-4 h-4" /> Add Tier
                </button>
              )}
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-400">
                <strong>AI Ticket Design:</strong> After creating your event, our AI will generate a custom color palette for your tickets based on the event category and details.
              </div>
            </div>
          )}

          {/* Step 3: Media */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-bold text-ink-100 flex items-center gap-2 mb-4">
                <Image className="w-5 h-5 text-amber-DEFAULT" /> Event Poster
              </h2>
              <p className="text-xs text-ink-500">Optional. A poster improves your event page and is used to inspire the ticket design.</p>

              <input ref={fileRef} type="file" accept="image/*" onChange={handlePoster} className="hidden" />

              {posterPreview ? (
                <div className="relative">
                  <img src={posterPreview} alt="Poster preview" className="w-full h-56 object-cover rounded-xl border border-ink-700" />
                  <button onClick={() => { setPosterPreview(null); setPosterFile(null) }}
                    className="absolute top-3 right-3 w-8 h-8 bg-ink-900/80 rounded-lg flex items-center justify-center text-ink-300 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-ink-600 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-amber-DEFAULT/50 hover:bg-amber-500/5 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-ink-700 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                    <Upload className="w-6 h-6 text-ink-400 group-hover:text-amber-DEFAULT transition-colors" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-ink-300 group-hover:text-ink-100">Click to upload poster</div>
                    <div className="text-xs text-ink-600 mt-1">JPG, PNG, WebP up to 5MB</div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            className="btn-ghost disabled:opacity-30">
            Back
          </button>

          <div className="flex gap-2">
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!stepValid()} className="btn-primary">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button onClick={() => handleSave(false)} disabled={saving || publishing} className="btn-secondary">
                  {saving ? <Spinner size="sm" /> : 'Save Draft'}
                </button>
                <button onClick={() => handleSave(true)} disabled={saving || publishing} className="btn-primary">
                  {publishing ? <Spinner size="sm" /> : 'Publish Event'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

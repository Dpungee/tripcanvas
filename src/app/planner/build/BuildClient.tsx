'use client'

import { useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Save, Plus, X, Search, Check, MapPin, Clock,
  Star, DollarSign, ChevronRight, ChevronDown, ChevronUp,
  Calendar, Users, Pencil, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { destinations } from '@/data/destinations'
import { states } from '@/data/states'
import { venues as allVenues } from '@/data/venues'
import { useApp, CustomTripFull, CustomTripPickedItem } from '@/lib/store'
import { VenueCategory, categoryLabels, categoryIcons, TimeBlock } from '@/types'
import { formatCurrency } from '@/lib/utils'

const timeBlocks: { id: TimeBlock; label: string; icon: string; description: string }[] = [
  { id: 'morning', label: 'Morning', icon: '🌅', description: '8am – 12pm' },
  { id: 'afternoon', label: 'Afternoon', icon: '☀️', description: '12pm – 5pm' },
  { id: 'evening', label: 'Evening', icon: '🌆', description: '5pm – 10pm' },
  { id: 'late-night', label: 'Late Night', icon: '🌙', description: '10pm+' },
]

const categories: VenueCategory[] = [
  'restaurant', 'bar', 'club', 'brunch', 'rooftop', 'spa',
  'outdoor', 'museum', 'live-music', 'tour', 'shopping',
]

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDayDate(startDate: string, dayNumber: number): string {
  const d = new Date(startDate + 'T12:00:00')
  d.setDate(d.getDate() + dayNumber - 1)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatDateRange(startIso: string, days: number): string {
  const start = new Date(startIso + 'T12:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + days - 1)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
}

// ─────────────────────────────────────────────
// Setup screen
// ─────────────────────────────────────────────
interface SetupProps {
  tripName: string; setTripName: (v: string) => void
  destinationId: string; setDestinationId: (v: string) => void
  startDate: string; setStartDate: (v: string) => void
  groupSize: number; setGroupSize: (v: number) => void
  numDays: number; setNumDays: (v: number) => void
  onContinue: () => void
}

function SetupScreen({ tripName, setTripName, destinationId, setDestinationId, startDate, setStartDate, groupSize, setGroupSize, numDays, setNumDays, onContinue }: SetupProps) {
  const [selectedStateId, setSelectedStateId] = useState<string | null>(() => {
    const st = states.find(s => s.destinations.includes(destinationId))
    return st?.id ?? null
  })

  const stateDests = selectedStateId
    ? destinations.filter(d => states.find(s => s.id === selectedStateId)?.destinations.includes(d.id))
    : []

  const canContinue = destinationId && tripName.trim()

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/planner" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Build Your Own Trip</h1>
          <p className="text-sm text-muted-foreground">Browse venues and hand-pick what your group will do</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Trip name */}
        <div className="rounded-xl border bg-card p-5">
          <label className="text-sm font-semibold block mb-2">Trip Name</label>
          <input
            type="text"
            placeholder="e.g. Miami Girls Weekend, Vegas Bachelor Bash..."
            value={tripName}
            onChange={e => setTripName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Destination */}
        <div className="rounded-xl border bg-card p-5">
          <label className="text-sm font-semibold block mb-1">Destination</label>
          <p className="text-xs text-muted-foreground mb-3">Pick a state, then choose your city</p>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3 max-h-48 overflow-y-auto pr-1">
            {states.map(state => (
              <button key={state.id}
                onClick={() => {
                  if (selectedStateId === state.id) { setSelectedStateId(null) }
                  else {
                    setSelectedStateId(state.id)
                    const first = destinations.find(d => state.destinations.includes(d.id))
                    if (first) setDestinationId(first.id)
                  }
                }}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${selectedStateId === state.id ? 'bg-primary text-white border-primary' : 'hover:bg-accent'}`}
              >
                <span className="font-bold opacity-70">{state.abbreviation}</span>
                <span className="truncate">{state.name}</span>
              </button>
            ))}
          </div>

          {selectedStateId && stateDests.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <span className="font-medium text-foreground">{states.find(s => s.id === selectedStateId)?.name}</span>
                <ChevronRight className="w-3 h-3" /> Select a city
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {stateDests.map(d => (
                  <button key={d.id} onClick={() => setDestinationId(d.id)}
                    className={`relative overflow-hidden rounded-xl aspect-[3/2] group ${destinationId === d.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  >
                    <div className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: `url(${d.heroImage})` }} />
                    <div className="absolute inset-0 bg-black/40" />
                    {destinationId === d.id && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center text-white font-semibold text-xs px-1">{d.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dates + Group */}
        <div className="rounded-xl border bg-card p-5">
          <label className="text-sm font-semibold block mb-3">Dates & Group</label>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Start Date</label>
              <input type="date" value={startDate} min={todayIso()} onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Group Size</label>
              <div className="flex gap-1.5 flex-wrap">
                {[1, 2, 4, 6, 8, 10].map(n => (
                  <button key={n} onClick={() => setGroupSize(n)}
                    className={`w-9 h-9 rounded-lg border text-sm font-semibold transition-all ${groupSize === n ? 'bg-primary text-white border-primary' : 'hover:bg-accent'}`}>{n}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Number of Days</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 7].map(n => (
                <button key={n} onClick={() => setNumDays(n)}
                  className={`w-10 h-10 rounded-xl border text-sm font-semibold transition-all ${numDays === n ? 'bg-primary text-white border-primary' : 'hover:bg-accent'}`}>{n}d</button>
              ))}
            </div>
          </div>
        </div>

        <Button
          variant="gradient" size="xl" className="w-full"
          onClick={onContinue}
          disabled={!canContinue}
        >
          Browse & Build My Trip →
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Add-to-trip popup
// ─────────────────────────────────────────────
interface AddPanelProps {
  venue: { id: string; name: string; category: string; imageUrl: string; avgPrice?: number }
  numDays: number
  onAdd: (dayNum: number, timeBlock: TimeBlock) => void
  onClose: () => void
  existingItems: CustomTripPickedItem[]
}

function AddPanel({ venue, numDays, onAdd, onClose, existingItems }: AddPanelProps) {
  const [selectedDay, setSelectedDay] = useState(1)
  const [selectedTime, setSelectedTime] = useState<TimeBlock>('afternoon')

  const alreadyAdded = existingItems.some(i => i.venueId === venue.id && i.dayNumber === selectedDay && i.timeBlock === selectedTime)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        {/* Venue header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${venue.imageUrl})` }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{venue.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{venue.category}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Day picker */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Which day?</p>
        <div className="flex gap-2 flex-wrap mb-4">
          {Array.from({ length: numDays }, (_, i) => i + 1).map(d => (
            <button key={d} onClick={() => setSelectedDay(d)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${selectedDay === d ? 'bg-primary text-white border-primary' : 'hover:bg-accent'}`}>
              Day {d}
            </button>
          ))}
        </div>

        {/* Time block picker */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Time of day?</p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {timeBlocks.map(tb => (
            <button key={tb.id} onClick={() => setSelectedTime(tb.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${selectedTime === tb.id ? 'bg-primary text-white border-primary' : 'hover:bg-accent'}`}>
              <span>{tb.icon}</span>
              <div className="text-left">
                <div className="font-medium">{tb.label}</div>
                <div className="text-[10px] opacity-70">{tb.description}</div>
              </div>
            </button>
          ))}
        </div>

        <Button
          variant={alreadyAdded ? 'outline' : 'gradient'}
          className="w-full"
          onClick={() => { onAdd(selectedDay, selectedTime); onClose() }}
          disabled={alreadyAdded}
        >
          {alreadyAdded ? 'Already added to this slot' : <><Plus className="w-4 h-4 mr-1" /> Add to Day {selectedDay} · {timeBlocks.find(t => t.id === selectedTime)?.label}</>}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main builder
// ─────────────────────────────────────────────
interface BuilderProps {
  tripId: string
  tripName: string
  setTripName: (v: string) => void
  destinationId: string
  startDate: string
  groupSize: number
  numDays: number
  items: CustomTripPickedItem[]
  setItems: (items: CustomTripPickedItem[]) => void
  onBack: () => void
  onSave: () => void
  isSaved: boolean
}

function BuilderScreen({ tripId, tripName, setTripName, destinationId, startDate, groupSize, numDays, items, setItems, onBack, onSave, isSaved }: BuilderProps) {
  const [categoryFilter, setCategoryFilter] = useState<VenueCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [addVenueId, setAddVenueId] = useState<string | null>(null)
  const [activeDay, setActiveDay] = useState(1)
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set(['morning', 'afternoon', 'evening', 'late-night']))
  const [editingName, setEditingName] = useState(false)
  const [mobileTab, setMobileTab] = useState<'browse' | 'itinerary'>('browse')

  const dest = destinations.find(d => d.id === destinationId)

  const venueList = useMemo(() => {
    return allVenues.filter(v => {
      if (v.destinationId !== destinationId) return false
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false
      if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.description.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [destinationId, categoryFilter, search])

  const addItem = (venueId: string, dayNumber: number, timeBlock: TimeBlock) => {
    const newItem: CustomTripPickedItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      venueId, dayNumber, timeBlock,
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id))

  const toggleBlock = (key: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const dayItems = (dayNum: number) => items.filter(i => i.dayNumber === dayNum)
  const blockItems = (dayNum: number, block: TimeBlock) => items.filter(i => i.dayNumber === dayNum && i.timeBlock === block)
  const totalItems = items.length
  const totalCost = items.reduce((sum, item) => {
    const v = allVenues.find(v => v.id === item.venueId)
    return sum + (v?.avgPrice || 0)
  }, 0)

  const addVenue = allVenues.find(v => v.id === addVenueId)

  // ── Browse panel ──
  const BrowsePanel = (
    <div className="flex flex-col h-full">
      {/* Search + filter */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" placeholder="Search venues…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button onClick={() => setCategoryFilter('all')}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${categoryFilter === 'all' ? 'bg-primary text-white border-primary' : 'hover:bg-accent'}`}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${categoryFilter === cat ? 'bg-primary text-white border-primary' : 'hover:bg-accent'}`}>
              {categoryIcons[cat]} {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Venue list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {venueList.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <p>No venues found</p>
            <button onClick={() => { setSearch(''); setCategoryFilter('all') }} className="text-primary text-xs mt-1 hover:underline">Clear filters</button>
          </div>
        )}
        {venueList.map(venue => {
          const addedCount = items.filter(i => i.venueId === venue.id).length
          return (
            <div key={venue.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-primary/40 transition-all group">
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative">
                <div className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-300" style={{ backgroundImage: `url(${venue.imageUrl})` }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm truncate">{venue.name}</p>
                  {addedCount > 0 && (
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center justify-center">{addedCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="capitalize">{categoryIcons[venue.category]} {categoryLabels[venue.category] || venue.category}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400" />{venue.rating}</span>
                  <span>·</span>
                  <span>{venue.priceLevel}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{venue.description}</p>
              </div>
              <button
                onClick={() => setAddVenueId(venue.id)}
                className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                title="Add to trip"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )

  // ── Itinerary panel ──
  const ItineraryPanel = (
    <div className="flex flex-col h-full">
      {/* Day tabs */}
      <div className="border-b px-4 pt-3 pb-0 flex gap-1 overflow-x-auto scrollbar-none">
        {Array.from({ length: numDays }, (_, i) => i + 1).map(d => (
          <button key={d} onClick={() => setActiveDay(d)}
            className={`flex-shrink-0 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${activeDay === d ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <span>Day {d}</span>
            {dayItems(d).length > 0 && (
              <span className="ml-1 text-xs bg-primary/10 text-primary rounded-full px-1.5">{dayItems(d).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Day header */}
      <div className="px-4 py-2.5 border-b bg-muted/30">
        <p className="text-sm font-semibold">{getDayDate(startDate, activeDay)}</p>
        <p className="text-xs text-muted-foreground">{dayItems(activeDay).length} activities selected</p>
      </div>

      {/* Time blocks */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {timeBlocks.map(tb => {
          const bItems = blockItems(activeDay, tb.id)
          const isExpanded = expandedBlocks.has(tb.id)
          return (
            <div key={tb.id} className="rounded-xl border bg-card overflow-hidden">
              <button
                onClick={() => toggleBlock(tb.id)}
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{tb.icon}</span>
                  <span className="font-medium text-sm">{tb.label}</span>
                  <span className="text-xs text-muted-foreground">{tb.description}</span>
                  {bItems.length > 0 && (
                    <span className="text-xs bg-primary/10 text-primary rounded-full px-1.5 font-medium">{bItems.length}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); setActiveDay(activeDay); setMobileTab('browse') }}
                    className="text-xs text-primary hover:underline flex items-center gap-0.5"
                    title="Browse venues to add"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  {bItems.length === 0 && (
                    <button
                      onClick={() => setMobileTab('browse')}
                      className="w-full py-3 border-2 border-dashed rounded-xl text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Browse venues to add here
                    </button>
                  )}
                  {bItems.map(pickedItem => {
                    const venue = allVenues.find(v => v.id === pickedItem.venueId)
                    if (!venue) return null
                    return (
                      <div key={pickedItem.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/50 group">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${venue.imageUrl})` }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{venue.name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{categoryIcons[venue.category]}</span>
                            <span>{venue.neighborhood}</span>
                            {venue.avgPrice ? <><span>·</span><span>{formatCurrency(venue.avgPrice)}/person</span></> : null}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(pickedItem.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <X className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {dayItems(activeDay).length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Nothing planned yet for Day {activeDay}</p>
            <p className="text-xs text-muted-foreground mt-1">Browse venues on the left and hit + to add them here</p>
          </div>
        )}
      </div>

      {/* Summary footer */}
      <div className="border-t p-3 bg-muted/30 flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          <span className="font-semibold text-foreground">{totalItems}</span> activities total
        </div>
        <div className="text-muted-foreground">
          Est. <span className="font-semibold text-foreground">{formatCurrency(totalCost)}</span>/person
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              type="text" value={tripName} onChange={e => setTripName(e.target.value)}
              className="font-bold text-lg bg-transparent border-b-2 border-primary focus:outline-none w-full"
              autoFocus onBlur={() => setEditingName(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
            />
          ) : (
            <button onClick={() => setEditingName(true)} className="font-bold text-lg flex items-center gap-1.5 group text-left truncate">
              <span className="truncate">{tripName || 'Untitled Trip'}</span>
              <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
            </button>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{dest?.name}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDateRange(startDate, numDays)}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{groupSize} people</span>
          </div>
        </div>

        <Button variant={isSaved ? 'outline' : 'gradient'} size="sm" onClick={onSave} className="flex-shrink-0">
          {isSaved ? <><Check className="w-3.5 h-3.5 mr-1" />Saved!</> : <><Save className="w-3.5 h-3.5 mr-1" />Save</>}
        </Button>
      </div>

      {/* Mobile tabs */}
      <div className="lg:hidden flex border-b">
        <button onClick={() => setMobileTab('browse')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mobileTab === 'browse' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Browse Venues
        </button>
        <button onClick={() => setMobileTab('itinerary')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mobileTab === 'itinerary' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          My Itinerary {totalItems > 0 && <span className="ml-1 text-xs bg-primary/10 rounded-full px-1.5">{totalItems}</span>}
        </button>
      </div>

      {/* Main split panel */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: Browse (desktop always visible, mobile tab) */}
        <div className={`${mobileTab === 'browse' ? 'flex' : 'hidden'} lg:flex flex-col lg:w-[55%] border-r overflow-hidden`}>
          {BrowsePanel}
        </div>

        {/* Right: Itinerary (desktop always visible, mobile tab) */}
        <div className={`${mobileTab === 'itinerary' ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-1 overflow-hidden`}>
          {ItineraryPanel}
        </div>
      </div>

      {/* Add-to-trip panel */}
      {addVenueId && addVenue && (
        <AddPanel
          venue={addVenue}
          numDays={numDays}
          onAdd={(day, time) => { addItem(addVenueId, day, time) }}
          onClose={() => setAddVenueId(null)}
          existingItems={items}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Root component — glues setup + builder + store
// ─────────────────────────────────────────────
export default function BuildClient() {
  const app = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()

  const existingId = searchParams.get('id')
  const existingTrip = existingId ? app.customTrips.find(t => t.id === existingId) : null

  const [stage, setStage] = useState<'setup' | 'build'>(existingTrip ? 'build' : 'setup')
  const [tripId] = useState(existingTrip?.id ?? `custom-${Date.now()}`)
  const [tripName, setTripName] = useState(existingTrip?.name ?? '')
  const [destinationId, setDestinationId] = useState(existingTrip?.destinationId ?? 'miami')
  const [startDate, setStartDate] = useState(existingTrip?.startDate ?? todayIso())
  const [groupSize, setGroupSize] = useState(existingTrip?.groupSize ?? 4)
  const [numDays, setNumDays] = useState(existingTrip?.numDays ?? 3)
  const [items, setItems] = useState<CustomTripPickedItem[]>(existingTrip?.items ?? [])
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    const trip: CustomTripFull = {
      id: tripId,
      name: tripName || 'My Custom Trip',
      destinationId, startDate, groupSize, numDays, items,
      createdAt: existingTrip?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    app.saveCustomTrip(trip)
    setIsSaved(true)
    app.notify(`"${trip.name}" saved!`, 'success')
    setTimeout(() => setIsSaved(false), 3000)
  }

  if (stage === 'setup') {
    return (
      <SetupScreen
        tripName={tripName} setTripName={setTripName}
        destinationId={destinationId} setDestinationId={setDestinationId}
        startDate={startDate} setStartDate={setStartDate}
        groupSize={groupSize} setGroupSize={setGroupSize}
        numDays={numDays} setNumDays={setNumDays}
        onContinue={() => setStage('build')}
      />
    )
  }

  return (
    <BuilderScreen
      tripId={tripId}
      tripName={tripName} setTripName={setTripName}
      destinationId={destinationId}
      startDate={startDate}
      groupSize={groupSize}
      numDays={numDays}
      items={items} setItems={setItems}
      onBack={() => setStage('setup')}
      onSave={handleSave}
      isSaved={isSaved}
    />
  )
}

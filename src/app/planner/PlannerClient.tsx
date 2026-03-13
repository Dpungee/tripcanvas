'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, RotateCcw, Save, Check, ChevronRight, ChevronLeft,
  MapPin, Calendar, Users, Palette, ClipboardCheck, Search, X, UserRound,
  Plane, Moon, Mountain, Armchair, Heart, GripVertical, Plus, Trash2,
  Star, DollarSign, Clock, Eye, EyeOff, ChevronDown, ChevronUp,
  Sunrise, Sun, Sunset, MoonStar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ItineraryTimeline } from '@/components/itinerary/ItineraryTimeline'
import { BudgetSummary } from '@/components/budget/BudgetSummary'
import { destinations } from '@/data/destinations'
import { getVenuesByDestination } from '@/data/venues'
import { generateItinerary } from '@/lib/itinerary-generator'
import { calculateBudget } from '@/lib/budget-calculator'
import { useApp, SavedTripFull } from '@/lib/store'
import {
  TripType, Vibe, BudgetTier, VenueCategory, Venue, Itinerary, ItineraryDay, ItineraryItem, BudgetBreakdown, TimeBlock,
  tripTypeLabels, vibeLabels, vibeEmojis, categoryLabels, categoryIcons,
} from '@/types'

// ─── Types ───

interface Guest {
  id: string
  name: string
  arrivalDate: string
  arrivalTime: string
  color: string
}

type WizardStep = 1 | 2 | 3 | 4 | 5

// ─── Constants ───

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-fuchsia-500', 'bg-lime-500',
  'bg-orange-500', 'bg-teal-500',
]

const STEP_META: { icon: typeof MapPin; label: string }[] = [
  { icon: MapPin, label: 'Destination' },
  { icon: Users, label: 'Guests' },
  { icon: Palette, label: 'Vibes' },
  { icon: Search, label: 'Browse' },
  { icon: ClipboardCheck, label: 'Itinerary' },
]

const TIME_BLOCK_ORDER: TimeBlock[] = ['morning', 'afternoon', 'evening', 'late-night']

const TIME_BLOCK_ICONS: Record<TimeBlock, typeof Sunrise> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Sunset,
  'late-night': MoonStar,
}

const TIME_BLOCK_COLORS: Record<TimeBlock, string> = {
  morning: 'bg-amber-100 text-amber-700',
  afternoon: 'bg-sky-100 text-sky-700',
  evening: 'bg-violet-100 text-violet-700',
  'late-night': 'bg-indigo-100 text-indigo-700',
}

const TIME_BLOCK_DEFAULTS: Record<TimeBlock, { start: string; end: string }> = {
  morning: { start: '9:00 AM', end: '12:00 PM' },
  afternoon: { start: '12:00 PM', end: '4:00 PM' },
  evening: { start: '6:00 PM', end: '9:00 PM' },
  'late-night': { start: '10:00 PM', end: '1:00 AM' },
}

const CATEGORY_TIME_MAP: Record<string, TimeBlock> = {
  brunch: 'morning',
  museum: 'afternoon',
  outdoor: 'morning',
  tour: 'afternoon',
  spa: 'afternoon',
  shopping: 'afternoon',
  restaurant: 'evening',
  rooftop: 'evening',
  'live-music': 'evening',
  bar: 'evening',
  club: 'late-night',
  event: 'evening',
}

const ALL_CATEGORIES: VenueCategory[] = [
  'restaurant', 'bar', 'club', 'museum', 'spa', 'outdoor',
  'tour', 'rooftop', 'live-music', 'brunch', 'event', 'shopping',
]

// ─── Helpers ───

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 3
  const d1 = new Date(start)
  const d2 = new Date(end)
  const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, Math.min(diff, 14))
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function venueToItem(venue: Venue, timeBlock?: TimeBlock): ItineraryItem {
  const tb = timeBlock || CATEGORY_TIME_MAP[venue.category] || 'afternoon'
  const times = TIME_BLOCK_DEFAULTS[tb]
  return {
    id: uid(),
    title: venue.name,
    venueId: venue.id,
    timeBlock: tb,
    startTime: times.start,
    endTime: times.end,
    costEstimate: venue.avgPrice || 0,
    reservationNeeded: venue.priceLevel === '$$$$' || venue.priceLevel === '$$$',
    notes: venue.description.slice(0, 80),
    category: venue.category,
  }
}

// ─── Component ───

export default function PlannerClient() {
  const searchParams = useSearchParams()
  const { saveTrip, notify, addActivity } = useApp()

  // ─── Wizard state ───
  const [step, setStep] = useState<WizardStep>(1)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  // ─── Step 1: Destination & Dates ───
  const [selectedDestination, setSelectedDestination] = useState<string>('')
  const [customDestination, setCustomDestination] = useState('')
  const [destSearch, setDestSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [tripType, setTripType] = useState<TripType>('weekend-getaway')

  // ─── Step 2: Guests ───
  const [isSolo, setIsSolo] = useState(true)
  const [soloName, setSoloName] = useState('')
  const [guests, setGuests] = useState<Guest[]>([])
  const [newGuestName, setNewGuestName] = useState('')
  const [newGuestDate, setNewGuestDate] = useState('')
  const [newGuestTime, setNewGuestTime] = useState('')

  // ─── Step 3: Vibes & Budget ───
  const [vibes, setVibes] = useState<Vibe[]>([])
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('mid')
  const [nightlife, setNightlife] = useState<'none' | 'some' | 'heavy'>('some')
  const [relaxAdventure, setRelaxAdventure] = useState(50)

  // ─── Step 4: Browse & Shortlist ───
  const [shortlist, setShortlist] = useState<Set<string>>(new Set())
  const [venueVotes, setVenueVotes] = useState<Record<string, Set<string>>>({})
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<VenueCategory | 'all'>('all')
  const [voteDropdownVenue, setVoteDropdownVenue] = useState<string | null>(null)
  const [mobileShortlistOpen, setMobileShortlistOpen] = useState(false)

  // ─── Step 5: Editable Itinerary ───
  const [editableDays, setEditableDays] = useState<ItineraryDay[]>([])
  const [budget, setBudget] = useState<BudgetBreakdown | null>(null)
  const [addActivityDay, setAddActivityDay] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  // ─── DnD state ───
  const dragRef = useRef<{ dayIdx: number; itemIdx: number } | null>(null)
  const [dropIndicator, setDropIndicator] = useState<{ dayIdx: number; itemIdx: number } | null>(null)

  // ─── Init from URL ───
  useEffect(() => {
    const dest = searchParams.get('destination')
    const type = searchParams.get('type') as TripType | null
    if (dest) {
      const match = destinations.find(d => d.id === dest)
      if (match) {
        setSelectedDestination(match.id)
        setCustomDestination('')
      } else {
        setCustomDestination(dest)
        setSelectedDestination('')
      }
    }
    if (type && type in tripTypeLabels) setTripType(type)
  }, [searchParams])

  // ─── Derived ───
  const tripLength = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate])
  const groupSize = isSolo ? 1 : guests.length + 1

  const effectiveDestId = selectedDestination || customDestination
  const effectiveDestName = useMemo(() => {
    if (selectedDestination) {
      const d = destinations.find(x => x.id === selectedDestination)
      return d?.name || selectedDestination
    }
    return customDestination
  }, [selectedDestination, customDestination])

  const allVenues = useMemo(() => {
    if (!selectedDestination) return []
    return getVenuesByDestination(selectedDestination)
  }, [selectedDestination])

  const filteredVenues = useMemo(() => {
    if (activeCategoryFilter === 'all') return allVenues
    return allVenues.filter(v => v.category === activeCategoryFilter)
  }, [allVenues, activeCategoryFilter])

  const shortlistedVenues = useMemo(() => {
    return allVenues.filter(v => shortlist.has(v.id))
  }, [allVenues, shortlist])

  const filteredDestinations = useMemo(() => {
    if (!destSearch) return destinations
    const q = destSearch.toLowerCase()
    return destinations.filter(d =>
      d.name.toLowerCase().includes(q) || d.stateId.toLowerCase().includes(q)
    )
  }, [destSearch])

  const availableCategories = useMemo(() => {
    const cats = new Set(allVenues.map(v => v.category))
    return ALL_CATEGORIES.filter(c => cats.has(c))
  }, [allVenues])

  // ─── Navigation ───
  const goNext = useCallback(() => {
    setDirection('forward')
    setStep(s => Math.min(s + 1, 5) as WizardStep)
  }, [])

  const goBack = useCallback(() => {
    setDirection('back')
    setStep(s => Math.max(s - 1, 1) as WizardStep)
  }, [])

  const goToStep = useCallback((s: WizardStep) => {
    setDirection(s > step ? 'forward' : 'back')
    setStep(s)
  }, [step])

  // ─── Step validation ───
  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return !!(selectedDestination || customDestination) && !!startDate && !!endDate
      case 2: return isSolo ? true : guests.length > 0
      case 3: return vibes.length > 0
      case 4: return true
      case 5: return true
      default: return false
    }
  }, [step, selectedDestination, customDestination, startDate, endDate, isSolo, guests, vibes])

  // ─── Shortlist ───
  const toggleShortlist = useCallback((venueId: string) => {
    setShortlist(prev => {
      const next = new Set(prev)
      if (next.has(venueId)) next.delete(venueId)
      else next.add(venueId)
      return next
    })
  }, [])

  const clearShortlist = useCallback(() => {
    setShortlist(new Set())
    setVenueVotes({})
  }, [])

  const toggleVote = useCallback((venueId: string, guestId: string) => {
    setVenueVotes(prev => {
      const current = new Set(prev[venueId] || [])
      if (current.has(guestId)) current.delete(guestId)
      else current.add(guestId)
      return { ...prev, [venueId]: current }
    })
  }, [])

  // ─── Build itinerary from shortlist ───
  const buildItineraryFromShortlist = useCallback(() => {
    if (shortlistedVenues.length === 0 && selectedDestination) {
      const input = {
        destinationId: selectedDestination,
        tripLength,
        groupSize,
        budgetTier,
        tripType,
        vibes,
        preferredCategories: [] as VenueCategory[],
        nightlifePreference: nightlife,
        relaxationVsAdventure: relaxAdventure,
      }
      const itin = generateItinerary(input)
      return itin.days
    }

    const venuesByTimeBlock: Record<TimeBlock, Venue[]> = {
      morning: [], afternoon: [], evening: [], 'late-night': [],
    }

    for (const v of shortlistedVenues) {
      const tb = CATEGORY_TIME_MAP[v.category] || 'afternoon'
      venuesByTimeBlock[tb].push(v)
    }

    const days: ItineraryDay[] = []
    const dayThemes = [
      'Arrival & Explore', 'Deep Dive', 'Culture Day', 'Adventure Day',
      'Chill & Relax', 'Local Gems', 'Food Tour', 'Grand Finale',
      'Departure Day', 'Bonus Day', 'Free Day', 'Discovery Day',
      'Nightlife Focus', 'Scenic Route',
    ]

    const usedVenues = new Set<string>()

    for (let d = 0; d < tripLength; d++) {
      const items: ItineraryItem[] = []

      for (const tb of TIME_BLOCK_ORDER) {
        const pool = venuesByTimeBlock[tb].filter(v => !usedVenues.has(v.id))
        if (pool.length > 0) {
          const venue = pool[0]
          usedVenues.add(venue.id)
          items.push(venueToItem(venue, tb))
        }
      }

      const dayDate = startDate
        ? new Date(new Date(startDate).getTime() + d * 86400000).toISOString().split('T')[0]
        : undefined

      days.push({
        dayNumber: d + 1,
        date: dayDate,
        theme: dayThemes[d % dayThemes.length],
        items,
        totalCost: items.reduce((s, i) => s + i.costEstimate, 0),
      })
    }

    // Distribute remaining unused shortlisted venues
    const remaining = shortlistedVenues.filter(v => !usedVenues.has(v.id))
    for (const v of remaining) {
      const leastFull = days.reduce((min, day, idx) =>
        day.items.length < days[min].items.length ? idx : min, 0)
      if (days[leastFull].items.length < 6) {
        const item = venueToItem(v)
        days[leastFull].items.push(item)
        days[leastFull].totalCost += item.costEstimate
      }
    }

    // Sort items within each day by time block order
    for (const day of days) {
      day.items.sort((a, b) =>
        TIME_BLOCK_ORDER.indexOf(a.timeBlock as TimeBlock) - TIME_BLOCK_ORDER.indexOf(b.timeBlock as TimeBlock)
      )
    }

    return days
  }, [shortlistedVenues, selectedDestination, tripLength, groupSize, budgetTier, tripType, vibes, nightlife, relaxAdventure, startDate])

  // ─── Enter step 5: build itinerary ───
  useEffect(() => {
    if (step === 5 && editableDays.length === 0) {
      const days = buildItineraryFromShortlist()
      setEditableDays(days)
      if (selectedDestination) {
        const input = {
          destinationId: selectedDestination,
          tripLength,
          groupSize,
          budgetTier,
          tripType,
          vibes,
          preferredCategories: [] as VenueCategory[],
          nightlifePreference: nightlife,
          relaxationVsAdventure: relaxAdventure,
        }
        setBudget(calculateBudget(input))
      }
    }
  }, [step, editableDays.length, buildItineraryFromShortlist, selectedDestination, tripLength, groupSize, budgetTier, tripType, vibes, nightlife, relaxAdventure])

  // ─── Itinerary mutations ───
  const reorderWithinDay = useCallback((dayIdx: number, fromIdx: number, toIdx: number) => {
    setEditableDays(prev => {
      const next = prev.map(d => ({ ...d, items: [...d.items] }))
      const [item] = next[dayIdx].items.splice(fromIdx, 1)
      next[dayIdx].items.splice(toIdx, 0, item)
      return next
    })
  }, [])

  const moveBetweenDays = useCallback((fromDay: number, toDay: number, itemIdx: number, insertIdx: number) => {
    setEditableDays(prev => {
      const next = prev.map(d => ({ ...d, items: [...d.items] }))
      const [item] = next[fromDay].items.splice(itemIdx, 1)
      next[fromDay].totalCost -= item.costEstimate
      next[toDay].items.splice(insertIdx, 0, item)
      next[toDay].totalCost += item.costEstimate
      return next
    })
  }, [])

  const removeItem = useCallback((dayIdx: number, itemIdx: number) => {
    setEditableDays(prev => {
      const next = prev.map(d => ({ ...d, items: [...d.items] }))
      const [removed] = next[dayIdx].items.splice(itemIdx, 1)
      next[dayIdx].totalCost -= removed.costEstimate
      return next
    })
  }, [])

  const addItemToDay = useCallback((dayIdx: number, venue: Venue) => {
    setEditableDays(prev => {
      const next = prev.map(d => ({ ...d, items: [...d.items] }))
      const item = venueToItem(venue)
      next[dayIdx].items.push(item)
      next[dayIdx].totalCost += item.costEstimate
      // Sort by time block
      next[dayIdx].items.sort((a, b) =>
        TIME_BLOCK_ORDER.indexOf(a.timeBlock as TimeBlock) - TIME_BLOCK_ORDER.indexOf(b.timeBlock as TimeBlock)
      )
      return next
    })
    setAddActivityDay(null)
  }, [])

  const cycleTimeBlock = useCallback((dayIdx: number, itemIdx: number) => {
    setEditableDays(prev => {
      const next = prev.map(d => ({ ...d, items: [...d.items] }))
      const item = next[dayIdx].items[itemIdx]
      const currentIdx = TIME_BLOCK_ORDER.indexOf(item.timeBlock as TimeBlock)
      const newTb = TIME_BLOCK_ORDER[(currentIdx + 1) % TIME_BLOCK_ORDER.length]
      const times = TIME_BLOCK_DEFAULTS[newTb]
      next[dayIdx].items[itemIdx] = { ...item, timeBlock: newTb, startTime: times.start, endTime: times.end }
      return next
    })
  }, [])

  const regenerateItinerary = useCallback(() => {
    const days = buildItineraryFromShortlist()
    setEditableDays(days)
    setSaved(false)
  }, [buildItineraryFromShortlist])

  // ─── DnD handlers ───
  const handleDragStart = useCallback((dayIdx: number, itemIdx: number) => {
    dragRef.current = { dayIdx, itemIdx }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, dayIdx: number, itemIdx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropIndicator({ dayIdx, itemIdx })
  }, [])

  const handleDragOverDay = useCallback((e: React.DragEvent, dayIdx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, dayIdx: number, itemIdx: number) => {
    e.preventDefault()
    const source = dragRef.current
    if (!source) return
    if (source.dayIdx === dayIdx) {
      if (source.itemIdx !== itemIdx) reorderWithinDay(dayIdx, source.itemIdx, itemIdx)
    } else {
      moveBetweenDays(source.dayIdx, dayIdx, source.itemIdx, itemIdx)
    }
    dragRef.current = null
    setDropIndicator(null)
  }, [reorderWithinDay, moveBetweenDays])

  const handleDropOnDay = useCallback((e: React.DragEvent, dayIdx: number) => {
    e.preventDefault()
    const source = dragRef.current
    if (!source) return
    if (source.dayIdx === dayIdx) return
    moveBetweenDays(source.dayIdx, dayIdx, source.itemIdx, editableDays[dayIdx]?.items.length || 0)
    dragRef.current = null
    setDropIndicator(null)
  }, [moveBetweenDays, editableDays])

  const handleDragEnd = useCallback(() => {
    dragRef.current = null
    setDropIndicator(null)
  }, [])

  // ─── Save trip ───
  const handleSave = useCallback(() => {
    const totalCost = editableDays.reduce((s, d) => s + d.items.reduce((ss, i) => ss + i.costEstimate, 0), 0)
    const trip: SavedTripFull = {
      id: `trip-${Date.now()}`,
      name: `${effectiveDestName} ${tripTypeLabels[tripType]}`,
      destinationId: effectiveDestId,
      tripType,
      vibes,
      budgetTier,
      days: tripLength,
      groupSize,
      itinerary: {
        id: `itin-${Date.now()}`,
        destinationId: effectiveDestId,
        tripType,
        vibes,
        budgetTier,
        groupSize,
        days: editableDays,
        totalCost,
        perPersonCost: Math.round(totalCost / groupSize),
      },
      budget: budget || { lodging: 0, food: 0, drinks: 0, activities: 0, transportation: 0, misc: 0, total: totalCost, perPerson: Math.round(totalCost / groupSize) },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveTrip(trip)
    addActivity(`Saved "${trip.name}"`, '💾')
    notify(`Trip "${trip.name}" saved!`, 'success')
    setSaved(true)
  }, [editableDays, effectiveDestName, effectiveDestId, tripType, vibes, budgetTier, tripLength, groupSize, budget, saveTrip, addActivity, notify])

  // ─── Guest helpers ───
  const addGuest = useCallback(() => {
    if (!newGuestName.trim()) return
    setGuests(prev => [...prev, {
      id: uid(),
      name: newGuestName.trim(),
      arrivalDate: newGuestDate,
      arrivalTime: newGuestTime,
      color: AVATAR_COLORS[(prev.length) % AVATAR_COLORS.length],
    }])
    setNewGuestName('')
    setNewGuestDate('')
    setNewGuestTime('')
  }, [newGuestName, newGuestDate, newGuestTime])

  const removeGuest = useCallback((id: string) => {
    setGuests(prev => prev.filter(g => g.id !== id))
  }, [])

  // ─── Items remaining for "Add Activity" in Step 5 ───
  const itemsInItinerary = useMemo(() => {
    const ids = new Set<string>()
    for (const d of editableDays) {
      for (const item of d.items) {
        if (item.venueId) ids.add(item.venueId)
      }
    }
    return ids
  }, [editableDays])

  const venuesAvailableToAdd = useMemo(() => {
    return allVenues.filter(v => !itemsInItinerary.has(v.id))
  }, [allVenues, itemsInItinerary])

  const totalTripCost = useMemo(() =>
    editableDays.reduce((s, d) => s + d.items.reduce((ss, i) => ss + i.costEstimate, 0), 0)
  , [editableDays])

  // ─────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* ─── Progress Header ─── */}
      <div className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4 inline mr-1" />
              Back
            </Link>
            <h1 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Trip Planner
            </h1>
            <span className="text-sm text-gray-400">Step {step} of 5</span>
          </div>
          {/* Step indicators */}
          <div className="flex items-center gap-1">
            {STEP_META.map((meta, i) => {
              const stepNum = (i + 1) as WizardStep
              const Icon = meta.icon
              const isActive = step === stepNum
              const isDone = step > stepNum
              return (
                <button
                  key={i}
                  onClick={() => stepNum <= step && goToStep(stepNum)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40'
                      : isDone
                        ? 'bg-emerald-500/10 text-emerald-400 cursor-pointer hover:bg-emerald-500/20'
                        : 'text-gray-500 cursor-default'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{meta.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── Step Content ─── */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ═══════════ STEP 1: Destination & Dates ═══════════ */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-bold">Where are you headed?</h2>
              <p className="text-xs text-gray-500">Pick or type your own</p>
            </div>

            {/* Search / Custom input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search destinations or type a custom location..."
                value={destSearch || customDestination}
                onChange={e => {
                  const val = e.target.value
                  setDestSearch(val)
                  // If the text matches no destination, treat as custom
                  const match = destinations.find(d => d.name.toLowerCase() === val.toLowerCase())
                  if (match) {
                    setSelectedDestination(match.id)
                    setCustomDestination('')
                  } else {
                    setCustomDestination(val)
                    setSelectedDestination('')
                  }
                }}
                className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              />
              {(destSearch || customDestination) && (
                <button
                  onClick={() => { setDestSearch(''); setCustomDestination(''); setSelectedDestination('') }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Custom destination badge */}
            {customDestination && !selectedDestination && (
              <div className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                <MapPin className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-violet-300">
                  Custom destination: <strong>{customDestination}</strong>
                </span>
              </div>
            )}

            {/* Destination grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {filteredDestinations.map(dest => {
                const isSelected = selectedDestination === dest.id
                return (
                  <button
                    key={dest.id}
                    onClick={() => {
                      setSelectedDestination(dest.id)
                      setCustomDestination('')
                      setDestSearch('')
                    }}
                    className={`relative group overflow-hidden rounded-lg border transition-all duration-200 text-left aspect-[4/3] ${
                      isSelected
                        ? 'border-violet-500 ring-2 ring-violet-500/40'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${dest.heroImage})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-1.5">
                      <p className="text-xs font-semibold text-white leading-tight">{dest.name}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Dates + Trip Type — compact row */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Start</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">End</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 [color-scheme:dark]"
                />
              </div>
              {startDate && endDate && (
                <div className="px-3 py-2 bg-violet-500/10 border border-violet-500/30 rounded-lg text-center">
                  <span className="text-violet-400 font-bold text-sm">{tripLength}d</span>
                </div>
              )}
            </div>

            {/* Trip Type — compact inline pills */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Trip Type</label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(tripTypeLabels) as [TripType, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTripType(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      tripType === key
                        ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 2: Guests ═══════════ */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-300 max-w-2xl">
            <h2 className="text-xl font-bold">Who&apos;s coming?</h2>

            {/* Solo / Group toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsSolo(true)}
                className={`flex-1 py-3 rounded-lg border text-center transition-all flex items-center justify-center gap-2 ${
                  isSolo
                    ? 'bg-violet-500/15 border-violet-500/50 text-violet-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <UserRound className="w-4 h-4" />
                <span className="text-sm font-medium">Solo</span>
              </button>
              <button
                onClick={() => setIsSolo(false)}
                className={`flex-1 py-3 rounded-lg border text-center transition-all flex items-center justify-center gap-2 ${
                  !isSolo
                    ? 'bg-violet-500/15 border-violet-500/50 text-violet-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Group</span>
              </button>
            </div>

            {isSolo ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={soloName}
                  onChange={e => setSoloName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Add guest form */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                  <p className="text-sm font-medium text-gray-300">Add a guest</p>
                  <input
                    type="text"
                    placeholder="Guest name"
                    value={newGuestName}
                    onChange={e => setNewGuestName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addGuest()}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Arrival date (optional)</label>
                      <input
                        type="date"
                        value={newGuestDate}
                        onChange={e => setNewGuestDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Arrival time (optional)</label>
                      <input
                        type="time"
                        value={newGuestTime}
                        onChange={e => setNewGuestTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <Button variant="gradient" size="sm" onClick={addGuest} disabled={!newGuestName.trim()}>
                    <Plus className="w-4 h-4 mr-1" /> Add Guest
                  </Button>
                </div>

                {/* Guest list */}
                {guests.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">{guests.length + 1} travelers (including you)</p>
                    {/* Self */}
                    <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-violet-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        YOU
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">You (Host)</p>
                      </div>
                    </div>
                    {guests.map(g => (
                      <div key={g.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                        <div className={`w-9 h-9 rounded-full ${g.color} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                          {getInitials(g.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{g.name}</p>
                          {g.arrivalDate && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Plane className="w-3 h-3" />
                              {g.arrivalDate}{g.arrivalTime ? ` at ${g.arrivalTime}` : ''}
                            </p>
                          )}
                        </div>
                        <button onClick={() => removeGuest(g.id)} className="text-gray-500 hover:text-rose-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ STEP 3: Vibes & Budget ═══════════ */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-300 max-w-2xl">
            <h2 className="text-xl font-bold">Set the vibe</h2>

            {/* Vibes */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Pick your vibes</label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(vibeLabels) as [Vibe, string][]).map(([key, label]) => {
                  const active = vibes.includes(key)
                  return (
                    <button
                      key={key}
                      onClick={() => setVibes(prev => active ? prev.filter(v => v !== key) : [...prev, key])}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        active
                          ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {vibeEmojis[key]} {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Budget + Nightlife — side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Budget</label>
                <div className="flex gap-2">
                  {([
                    { tier: 'budget' as const, label: '$' },
                    { tier: 'mid' as const, label: '$$' },
                    { tier: 'luxury' as const, label: '$$$' },
                  ]).map(({ tier, label }) => (
                    <button
                      key={tier}
                      onClick={() => setBudgetTier(tier)}
                      className={`flex-1 py-2.5 rounded-lg border text-center transition-all ${
                        budgetTier === tier
                          ? 'bg-violet-500/15 border-violet-500/50 text-violet-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <p className="text-sm font-bold">{label}</p>
                      <p className="text-[10px] opacity-60 capitalize">{tier}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Nightlife</label>
                <div className="flex gap-2">
                  {([
                    { val: 'none' as const, label: 'None' },
                    { val: 'some' as const, label: 'Some' },
                    { val: 'heavy' as const, label: 'Heavy' },
                  ]).map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => setNightlife(val)}
                      className={`flex-1 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                        nightlife === val
                          ? 'bg-violet-500/15 border-violet-500/50 text-violet-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Relaxation vs Adventure slider — compact */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Relaxation vs Adventure</label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">Chill</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={relaxAdventure}
                  onChange={e => setRelaxAdventure(Number(e.target.value))}
                  className="flex-1 accent-violet-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500"
                />
                <span className="text-[10px] text-gray-500">Adventure</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 4: Browse & Shortlist ═══════════ */}
        {step === 4 && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xl font-bold">Browse & Shortlist</h2>
              <p className="text-xs text-gray-500">
                {allVenues.length > 0 ? `${allVenues.length} venues in ${effectiveDestName}` : effectiveDestName}
              </p>
            </div>

            {allVenues.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MapPin className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-300 mb-1">No pre-loaded venues</h3>
                <p className="text-xs text-gray-500 mb-4">Skip to build a custom itinerary, or go back for another destination.</p>
                <Button variant="gradient" size="sm" onClick={goNext}>
                  Skip to Itinerary <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* LEFT: Browse Venues */}
                <div className="flex-1 lg:w-[60%] min-w-0">
                  {/* Category filters */}
                  <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    <button
                      onClick={() => setActiveCategoryFilter('all')}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        activeCategoryFilter === 'all'
                          ? 'bg-violet-500 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      All ({allVenues.length})
                    </button>
                    {availableCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategoryFilter(cat)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                          activeCategoryFilter === cat
                            ? 'bg-violet-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        {categoryIcons[cat]} {categoryLabels[cat]}
                      </button>
                    ))}
                  </div>

                  {/* Venue grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2">
                    {filteredVenues.map(venue => {
                      const isShortlisted = shortlist.has(venue.id)
                      const votes = venueVotes[venue.id]
                      const voterCount = votes ? votes.size : 0
                      return (
                        <div
                          key={venue.id}
                          className={`group relative rounded-lg border overflow-hidden transition-all flex ${
                            isShortlisted
                              ? 'border-violet-500/50 bg-violet-500/5'
                              : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'
                          }`}
                        >
                          {/* Image — compact side thumbnail */}
                          <div
                            className="w-20 h-20 sm:w-24 sm:h-24 bg-cover bg-center relative shrink-0"
                            style={{ backgroundImage: `url(${venue.imageUrl})` }}
                          >
                            <div className="absolute inset-0 bg-black/20" />
                            <button
                              onClick={() => toggleShortlist(venue.id)}
                              className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                isShortlisted
                                  ? 'bg-violet-500 text-white'
                                  : 'bg-black/40 text-white/70 hover:text-white'
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${isShortlisted ? 'fill-current' : ''}`} />
                            </button>
                          </div>

                          {/* Info — compact */}
                          <div className="p-2 flex-1 min-w-0 flex flex-col justify-center">
                            <p className="text-xs font-semibold text-white truncate">{venue.name}</p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                              {categoryIcons[venue.category]} {categoryLabels[venue.category]}
                              <span className="text-gray-600">·</span>
                              {venue.priceLevel}
                              <span className="text-gray-600">·</span>
                              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                              {venue.rating}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{venue.neighborhood} · {venue.description}</p>

                            {/* Group voting */}
                            {!isSolo && guests.length > 0 && (
                              <div className="mt-2 flex items-center gap-2">
                                {/* Voter avatars */}
                                {voterCount > 0 && (
                                  <div className="flex -space-x-1.5">
                                    {Array.from(votes!).slice(0, 4).map(gId => {
                                      const guest = guests.find(g => g.id === gId)
                                      if (!guest) return null
                                      return (
                                        <div
                                          key={gId}
                                          className={`w-5 h-5 rounded-full ${guest.color} flex items-center justify-center text-[8px] font-bold text-white ring-1 ring-gray-900`}
                                          title={guest.name}
                                        >
                                          {getInitials(guest.name)}
                                        </div>
                                      )
                                    })}
                                    {voterCount > 4 && (
                                      <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-[8px] font-bold text-white ring-1 ring-gray-900">
                                        +{voterCount - 4}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {/* Vote button */}
                                <div className="relative">
                                  <button
                                    onClick={() => setVoteDropdownVenue(voteDropdownVenue === venue.id ? null : venue.id)}
                                    className="text-xs text-gray-400 hover:text-violet-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full transition-all"
                                  >
                                    Vote
                                  </button>
                                  {voteDropdownVenue === venue.id && (
                                    <div className="absolute left-0 bottom-full mb-1 z-20 w-48 bg-gray-800 border border-white/10 rounded-lg shadow-xl p-2">
                                      {guests.map(g => {
                                        const voted = votes?.has(g.id) || false
                                        return (
                                          <button
                                            key={g.id}
                                            onClick={() => toggleVote(venue.id, g.id)}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/10 transition-colors"
                                          >
                                            <div className={`w-5 h-5 rounded-full ${g.color} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}>
                                              {getInitials(g.name)}
                                            </div>
                                            <span className="text-xs text-gray-300 flex-1 text-left truncate">{g.name}</span>
                                            {voted && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* RIGHT: Shortlist Panel - Desktop */}
                <div className="hidden lg:block lg:w-[35%] shrink-0">
                  <div className="sticky top-32">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">Your Shortlist ({shortlist.size})</h3>
                        {shortlist.size > 0 && (
                          <button onClick={clearShortlist} className="text-xs text-gray-500 hover:text-rose-400 transition-colors">
                            Clear All
                          </button>
                        )}
                      </div>
                      {shortlist.size === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-6">
                          Tap the <Heart className="w-3 h-3 inline" /> on venues to add them here
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                          {shortlistedVenues.map(v => {
                            const votes = venueVotes[v.id]
                            return (
                              <div key={v.id} className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg">
                                <span className="text-sm shrink-0">{categoryIcons[v.category]}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-white truncate">{v.name}</p>
                                  <p className="text-[10px] text-gray-500">{v.priceLevel}</p>
                                </div>
                                {votes && votes.size > 0 && (
                                  <div className="flex -space-x-1">
                                    {Array.from(votes).slice(0, 3).map(gId => {
                                      const guest = guests.find(g => g.id === gId)
                                      if (!guest) return null
                                      return (
                                        <div
                                          key={gId}
                                          className={`w-4 h-4 rounded-full ${guest.color} flex items-center justify-center text-[7px] font-bold text-white ring-1 ring-gray-900`}
                                        >
                                          {getInitials(guest.name)}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                                <button
                                  onClick={() => toggleShortlist(v.id)}
                                  className="text-gray-500 hover:text-rose-400 transition-colors shrink-0"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Shortlist Bar */}
                <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50">
                  <div className={`bg-gray-900 border-t border-white/10 transition-all duration-300 ${mobileShortlistOpen ? 'max-h-[60vh]' : 'max-h-14'} overflow-hidden`}>
                    <button
                      onClick={() => setMobileShortlistOpen(!mobileShortlistOpen)}
                      className="w-full flex items-center justify-between px-4 py-3"
                    >
                      <span className="text-sm font-medium text-white">
                        <Heart className="w-4 h-4 inline mr-1.5 text-violet-400" />
                        {shortlist.size} shortlisted
                      </span>
                      {mobileShortlistOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                    </button>
                    {mobileShortlistOpen && (
                      <div className="px-4 pb-4 space-y-2 max-h-[50vh] overflow-y-auto">
                        {shortlist.size > 0 && (
                          <button onClick={clearShortlist} className="text-xs text-gray-500 hover:text-rose-400">Clear All</button>
                        )}
                        {shortlistedVenues.map(v => (
                          <div key={v.id} className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg">
                            <span className="text-sm">{categoryIcons[v.category]}</span>
                            <p className="text-xs font-medium text-white truncate flex-1">{v.name}</p>
                            <button onClick={() => toggleShortlist(v.id)} className="text-gray-500 hover:text-rose-400">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ STEP 5: Editable Itinerary ═══════════ */}
        {step === 5 && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold">Your Itinerary</h2>
                <p className="text-xs text-gray-500">Drag to rearrange · Click time blocks to change</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={regenerateItinerary}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Regenerate
                </Button>
                <Button
                  variant={saved ? 'outline' : 'gradient'}
                  size="sm"
                  onClick={handleSave}
                >
                  {saved ? <Check className="w-4 h-4 mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                  {saved ? 'Saved!' : 'Save Trip'}
                </Button>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-6">
              {/* Day columns */}
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {editableDays.map((day, dayIdx) => (
                    <div
                      key={day.dayNumber}
                      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                      onDragOver={e => handleDragOverDay(e, dayIdx)}
                      onDrop={e => handleDropOnDay(e, dayIdx)}
                    >
                      {/* Day header */}
                      <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-white">Day {day.dayNumber}</p>
                            {day.date && <p className="text-xs text-gray-500">{day.date}</p>}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            ${day.items.reduce((s, i) => s + i.costEstimate, 0)}
                          </Badge>
                        </div>
                        <p className="text-xs text-violet-400 mt-0.5">{day.theme}</p>
                      </div>

                      {/* Items */}
                      <div className="p-2 space-y-1.5 min-h-[100px]">
                        {day.items.map((item, itemIdx) => {
                          const tb = item.timeBlock as TimeBlock
                          const TbIcon = TIME_BLOCK_ICONS[tb] || Sun
                          const isDropTarget = dropIndicator?.dayIdx === dayIdx && dropIndicator?.itemIdx === itemIdx
                          return (
                            <div key={item.id}>
                              {isDropTarget && (
                                <div className="h-0.5 bg-violet-500 rounded-full my-1 mx-2 transition-all" />
                              )}
                              <div
                                draggable
                                onDragStart={() => handleDragStart(dayIdx, itemIdx)}
                                onDragOver={e => handleDragOver(e, dayIdx, itemIdx)}
                                onDrop={e => handleDrop(e, dayIdx, itemIdx)}
                                onDragEnd={handleDragEnd}
                                className="flex items-start gap-2 p-2 bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-lg cursor-grab active:cursor-grabbing group/item transition-all"
                              >
                                <GripVertical className="w-3.5 h-3.5 text-gray-600 group-hover/item:text-gray-400 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-white truncate">{item.title}</p>
                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    <button
                                      onClick={() => cycleTimeBlock(dayIdx, itemIdx)}
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${TIME_BLOCK_COLORS[tb]} cursor-pointer hover:opacity-80 transition-opacity`}
                                      title="Click to change time block"
                                    >
                                      <TbIcon className="w-2.5 h-2.5" />
                                      {tb}
                                    </button>
                                    {item.costEstimate > 0 && (
                                      <span className="text-[10px] text-gray-500">${item.costEstimate}</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeItem(dayIdx, itemIdx)}
                                  className="text-gray-600 hover:text-rose-400 transition-colors shrink-0 mt-0.5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                        {day.items.length === 0 && (
                          <p className="text-xs text-gray-600 text-center py-4">
                            Drop items here or add activities below
                          </p>
                        )}
                      </div>

                      {/* Add activity button */}
                      <div className="px-2 pb-2">
                        {addActivityDay === dayIdx ? (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-2 max-h-48 overflow-y-auto">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-gray-300">Add activity</p>
                              <button onClick={() => setAddActivityDay(null)} className="text-gray-500 hover:text-white">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {venuesAvailableToAdd.length === 0 ? (
                              <p className="text-xs text-gray-500 text-center py-2">All venues are already in your itinerary</p>
                            ) : (
                              <div className="space-y-1">
                                {venuesAvailableToAdd.slice(0, 10).map(v => (
                                  <button
                                    key={v.id}
                                    onClick={() => addItemToDay(dayIdx, v)}
                                    className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-white/10 transition-colors text-left"
                                  >
                                    <span className="text-xs shrink-0">{categoryIcons[v.category]}</span>
                                    <span className="text-xs text-gray-300 truncate flex-1">{v.name}</span>
                                    <span className="text-[10px] text-gray-500">{v.priceLevel}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddActivityDay(dayIdx)}
                            className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-gray-500 hover:text-violet-400 hover:bg-white/5 rounded-lg transition-all border border-dashed border-white/10 hover:border-violet-500/30"
                          >
                            <Plus className="w-3 h-3" /> Add Activity
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trip cost summary */}
                <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Total Activities Cost</p>
                    <p className="text-xs text-gray-400">{editableDays.reduce((s, d) => s + d.items.length, 0)} activities across {editableDays.length} days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-violet-400">${totalTripCost}</p>
                    {groupSize > 1 && (
                      <p className="text-xs text-gray-500">${Math.round(totalTripCost / groupSize)} per person</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Budget sidebar */}
              {budget && (
                <div className="xl:w-80 shrink-0">
                  <div className="sticky top-32">
                    <BudgetSummary budget={budget} groupSize={groupSize} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Navigation Footer ─── */}
      <div className="sticky bottom-0 z-30 bg-gray-900/80 backdrop-blur-xl border-t border-white/10 lg:block">
        <div className={`max-w-7xl mx-auto px-4 py-3 flex items-center justify-between ${step === 4 && shortlist.size > 0 ? 'lg:flex' : ''}`}>
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={step === 1}
            className={step === 1 ? 'invisible' : ''}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          <div className="flex items-center gap-3">
            {step < 5 && (
              <Button
                variant="gradient"
                onClick={() => {
                  if (step === 4) {
                    setEditableDays([])
                    setSaved(false)
                  }
                  goNext()
                }}
                disabled={!canProceed}
              >
                {step === 4 ? 'Build Itinerary' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {step === 5 && (
              <Link href="/trips">
                <Button variant="ghost" size="sm">
                  View Saved Trips <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

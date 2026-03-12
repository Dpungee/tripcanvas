'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, RotateCcw, Save, Check, Edit3, ChevronRight, ChevronLeft,
  MapPin, Calendar, Users, Palette, ClipboardCheck, Plus, X, UserRound,
  ThumbsUp, ThumbsDown, Plane, Moon, Mountain, Armchair,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ItineraryTimeline } from '@/components/itinerary/ItineraryTimeline'
import { BudgetSummary } from '@/components/budget/BudgetSummary'
import { destinations } from '@/data/destinations'
import { generateItinerary } from '@/lib/itinerary-generator'
import { calculateBudget } from '@/lib/budget-calculator'
import { useApp, SavedTripFull } from '@/lib/store'
import {
  TripType, Vibe, BudgetTier, VenueCategory, Itinerary, BudgetBreakdown,
  tripTypeLabels, vibeLabels, vibeEmojis, categoryLabels, categoryIcons,
} from '@/types'

// ─── Types ───

interface Guest {
  id: string
  name: string
  arrivalDate: string
  arrivalTime: string
}

type CategoryVote = Record<string, Record<VenueCategory, 'up' | 'down' | null>>
// guestId -> category -> vote

// ─── Helpers ───

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-fuchsia-500', 'bg-lime-500',
  'bg-orange-500', 'bg-teal-500',
]

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff)
}

const STEPS = [
  { num: 1, label: 'Destination & Dates', icon: MapPin },
  { num: 2, label: 'Guests', icon: Users },
  { num: 3, label: 'Vibes & Preferences', icon: Palette },
  { num: 4, label: 'Review & Generate', icon: ClipboardCheck },
] as const

const ALL_CATEGORIES = Object.keys(categoryLabels) as VenueCategory[]

// ─── Component ───

export default function PlannerClient() {
  const searchParams = useSearchParams()
  const app = useApp()

  // Wizard step (1-4) or 'result'
  const [wizardStep, setWizardStep] = useState(1)
  const [showResult, setShowResult] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tripName, setTripName] = useState('')
  const [editingName, setEditingName] = useState(false)

  // Step 1: Destination & Dates
  const [destinationId, setDestinationId] = useState('miami')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [tripType, setTripType] = useState<TripType>('weekend-getaway')
  const [destSearch, setDestSearch] = useState('')

  // Step 2: Guest Management
  const [isSolo, setIsSolo] = useState(false)
  const [soloName, setSoloName] = useState('')
  const [guests, setGuests] = useState<Guest[]>([])
  const [newGuestName, setNewGuestName] = useState('')
  const [newGuestArrivalDate, setNewGuestArrivalDate] = useState('')
  const [newGuestArrivalTime, setNewGuestArrivalTime] = useState('')

  // Step 3: Vibes & Preferences
  const [vibes, setVibes] = useState<Vibe[]>(['foodie'])
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('mid')
  const [nightlifePreference, setNightlifePreference] = useState<'none' | 'some' | 'heavy'>('some')
  const [relaxVsAdventure, setRelaxVsAdventure] = useState(50)
  const [soloCategories, setSoloCategories] = useState<VenueCategory[]>([])
  const [categoryVotes, setCategoryVotes] = useState<CategoryVote>({})

  // Result state
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [budget, setBudget] = useState<BudgetBreakdown | null>(null)

  // Derived
  const tripLength = useMemo(() => {
    if (startDate && endDate) return daysBetween(startDate, endDate)
    return 3
  }, [startDate, endDate])

  const groupSize = useMemo(() => {
    if (isSolo) return 1
    return Math.max(1, guests.length)
  }, [isSolo, guests.length])

  const todayStr = useMemo(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  }, [])

  // Compute preferred categories from votes (group mode)
  const votedCategories = useMemo((): VenueCategory[] => {
    if (isSolo) return soloCategories
    if (guests.length === 0) return []
    const tally: Record<VenueCategory, number> = {} as Record<VenueCategory, number>
    ALL_CATEGORIES.forEach(c => { tally[c] = 0 })
    Object.values(categoryVotes).forEach(guestVotes => {
      ALL_CATEGORIES.forEach(c => {
        if (guestVotes[c] === 'up') tally[c] += 1
        if (guestVotes[c] === 'down') tally[c] -= 1
      })
    })
    return ALL_CATEGORIES
      .filter(c => tally[c] > 0)
      .sort((a, b) => tally[b] - tally[a])
  }, [isSolo, soloCategories, guests.length, categoryVotes])

  const filteredDestinations = useMemo(() => {
    if (!destSearch.trim()) return destinations
    const q = destSearch.toLowerCase()
    return destinations.filter(d =>
      d.name.toLowerCase().includes(q) || d.stateId.toLowerCase().includes(q)
    )
  }, [destSearch])

  // Read query params on mount
  useEffect(() => {
    const destParam = searchParams.get('destination')
    const typeParam = searchParams.get('type')
    if (destParam && destinations.find(d => d.id === destParam)) {
      setDestinationId(destParam)
    }
    if (typeParam && typeParam in tripTypeLabels) {
      setTripType(typeParam as TripType)
    }
  }, [searchParams])

  // ─── Handlers ───

  const toggleVibe = (v: Vibe) => setVibes(prev =>
    prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
  )

  const toggleSoloCategory = (c: VenueCategory) => setSoloCategories(prev =>
    prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
  )

  const addGuest = () => {
    if (!newGuestName.trim()) return
    const guest: Guest = {
      id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newGuestName.trim(),
      arrivalDate: newGuestArrivalDate,
      arrivalTime: newGuestArrivalTime,
    }
    setGuests(prev => [...prev, guest])
    setNewGuestName('')
    setNewGuestArrivalDate('')
    setNewGuestArrivalTime('')
  }

  const removeGuest = (id: string) => {
    setGuests(prev => prev.filter(g => g.id !== id))
    setCategoryVotes(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const setVote = (guestId: string, cat: VenueCategory, vote: 'up' | 'down' | null) => {
    setCategoryVotes(prev => {
      const guestVotes = prev[guestId] || ({} as Record<VenueCategory, 'up' | 'down' | null>)
      const currentVote = guestVotes[cat]
      return {
        ...prev,
        [guestId]: {
          ...guestVotes,
          [cat]: currentVote === vote ? null : vote,
        },
      }
    })
  }

  const getVoteTally = (cat: VenueCategory): { up: number; down: number } => {
    let up = 0, down = 0
    Object.values(categoryVotes).forEach(guestVotes => {
      if (guestVotes[cat] === 'up') up++
      if (guestVotes[cat] === 'down') down++
    })
    return { up, down }
  }

  const handleGenerate = () => {
    const input = {
      destinationId,
      tripLength,
      groupSize,
      budgetTier,
      tripType,
      vibes,
      preferredCategories: votedCategories,
      nightlifePreference,
      relaxationVsAdventure: relaxVsAdventure,
    }
    const itin = generateItinerary(input)
    const budg = calculateBudget(input, itin)
    setItinerary(itin)
    setBudget(budg)
    setSaved(false)
    const dest = destinations.find(d => d.id === destinationId)
    setTripName(`${dest?.name || 'My'} ${tripTypeLabels[tripType]}`)
    setShowResult(true)
    app.addActivity(`Generated ${dest?.name} itinerary`, '✨')
    app.notify('Itinerary generated!', 'success')
  }

  const handleRegenerate = () => {
    handleGenerate()
    app.notify('Itinerary regenerated with new variations!', 'info')
  }

  const handleSave = () => {
    if (!itinerary || !budget) return
    const trip: SavedTripFull = {
      id: `trip-${Date.now()}`,
      name: tripName,
      destinationId, tripType, vibes, budgetTier,
      days: tripLength, groupSize,
      itinerary, budget,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    app.saveTrip(trip)
    setSaved(true)
    app.notify(`"${tripName}" saved to your trips!`, 'success')
  }

  const goNext = () => setWizardStep(prev => Math.min(4, prev + 1))
  const goBack = () => setWizardStep(prev => Math.max(1, prev - 1))

  const dest = destinations.find(d => d.id === destinationId)

  // ─── Result View ───

  if (showResult && itinerary && budget) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            {editingName ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="text" value={tripName} onChange={e => setTripName(e.target.value)}
                  className="text-2xl md:text-3xl font-bold bg-transparent border-b-2 border-primary focus:outline-none"
                  autoFocus onBlur={() => setEditingName(false)}
                  onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                />
              </div>
            ) : (
              <h1
                className="text-2xl md:text-3xl font-bold flex items-center gap-2 cursor-pointer group"
                onClick={() => setEditingName(true)}
              >
                {tripName}
                <Edit3 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </h1>
            )}
            <p className="text-muted-foreground mt-1">
              {tripLength} days &middot; {groupSize} {groupSize === 1 ? 'traveler' : 'travelers'} &middot; {budgetTier} budget &middot; {tripTypeLabels[tripType]}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {vibes.map(v => (
                <Badge key={v} variant="purple" className="text-[10px]">{vibeEmojis[v]} {vibeLabels[v]}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => { setShowResult(false); setWizardStep(1); setSaved(false) }}>
              <RotateCcw className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleRegenerate}>
              <Sparkles className="w-4 h-4 mr-1" /> Regenerate
            </Button>
            <Button variant={saved ? 'outline' : 'gradient'} size="sm" onClick={handleSave} disabled={saved}>
              {saved ? <Check className="w-4 h-4 mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              {saved ? 'Saved!' : 'Save Trip'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ItineraryTimeline days={itinerary.days} editable destinationId={destinationId} />
          </div>
          <div className="space-y-6">
            <BudgetSummary budget={budget} groupSize={groupSize} />
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-3">Trip Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Destination</span><span className="font-medium">{dest?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{tripLength} days</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Group Size</span><span className="font-medium">{groupSize}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Trip Type</span><span className="font-medium">{tripTypeLabels[tripType]}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Activities</span><span className="font-medium">{itinerary.days.reduce((s, d) => s + d.items.length, 0)}</span></div>
                {startDate && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Dates</span><span className="font-medium">{startDate} to {endDate}</span></div>
                )}
              </div>
            </div>
            {!isSolo && guests.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-3">Travelers</h3>
                <div className="space-y-2">
                  {guests.map((g, i) => (
                    <div key={g.id} className="flex items-center gap-3 text-sm">
                      <div className={`w-7 h-7 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold`}>
                        {getInitials(g.name)}
                      </div>
                      <span className="font-medium">{g.name}</span>
                      {g.arrivalDate && (
                        <span className="text-muted-foreground ml-auto text-xs">
                          <Plane className="w-3 h-3 inline mr-1" />
                          {g.arrivalDate} {g.arrivalTime}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Link href="/saved" className="block">
              <Button variant="outline" className="w-full">View All Saved Trips</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── Wizard View ───

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Plan Your Perfect Trip</h1>
        <p className="text-muted-foreground mt-2">Follow the steps below to build your ideal itinerary</p>
      </div>

      {/* Progress Stepper */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          {/* Background line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
            style={{ width: `${((wizardStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map(({ num, label, icon: Icon }) => {
            const isActive = wizardStep === num
            const isComplete = wizardStep > num
            return (
              <button
                key={num}
                onClick={() => { if (num <= wizardStep) setWizardStep(num) }}
                className="relative z-10 flex flex-col items-center gap-1.5"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isComplete
                    ? 'bg-primary border-primary text-white'
                    : isActive
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background border-border text-muted-foreground'
                }`}>
                  {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[11px] font-medium hidden sm:block ${
                  isActive ? 'text-primary' : isComplete ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {/* ─── STEP 1: Destination & Dates ─── */}
        {wizardStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Destination */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Where are you going?
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Pick your dream destination</p>

              <input
                type="text"
                placeholder="Search destinations..."
                value={destSearch}
                onChange={e => setDestSearch(e.target.value)}
                className="w-full mb-4 px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredDestinations.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDestinationId(d.id)}
                    className={`relative overflow-hidden rounded-xl aspect-[4/3] group transition-all ${
                      destinationId === d.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]' : 'hover:scale-[1.02]'
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url(${d.heroImage})` }}
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                    <div className="absolute inset-0 flex items-end p-2">
                      <span className="text-white font-semibold text-sm text-left leading-tight drop-shadow-md">{d.name}</span>
                    </div>
                    {destinationId === d.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {filteredDestinations.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">No destinations match your search.</p>
              )}
            </div>

            {/* Dates */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> When are you traveling?
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Select your start and end dates</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    min={todayStr}
                    onChange={e => {
                      setStartDate(e.target.value)
                      if (endDate && e.target.value > endDate) setEndDate('')
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || todayStr}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {startDate && endDate && (
                <div className="mt-3 px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                  <span className="font-medium text-primary">{tripLength} {tripLength === 1 ? 'day' : 'days'}</span>
                  <span className="text-muted-foreground ml-1">trip</span>
                </div>
              )}
            </div>

            {/* Trip Type */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-1">What type of trip?</h2>
              <p className="text-sm text-muted-foreground mb-4">This helps us tailor your itinerary</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {(Object.entries(tripTypeLabels) as [TripType, string][]).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => setTripType(type)}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      tripType === type
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'hover:bg-accent hover:border-border'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Guest Management ─── */}
        {wizardStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Solo vs Group Toggle */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Who&apos;s coming?
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Tell us about your travel group</p>

              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setIsSolo(true)}
                  className={`flex-1 py-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    isSolo
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <UserRound className={`w-8 h-8 ${isSolo ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-semibold text-sm ${isSolo ? 'text-primary' : ''}`}>Solo Trip</span>
                  <span className="text-xs text-muted-foreground">Just me, myself & I</span>
                </button>
                <button
                  onClick={() => setIsSolo(false)}
                  className={`flex-1 py-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    !isSolo
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <Users className={`w-8 h-8 ${!isSolo ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-semibold text-sm ${!isSolo ? 'text-primary' : ''}`}>Group Trip</span>
                  <span className="text-xs text-muted-foreground">Friends, family, or colleagues</span>
                </button>
              </div>

              {/* Solo Name */}
              {isSolo && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground block">Your Name</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                      {soloName ? getInitials(soloName) : '?'}
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={soloName}
                      onChange={e => setSoloName(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Solo traveler - party of one!</p>
                </div>
              )}

              {/* Group Guest Management */}
              {!isSolo && (
                <div className="space-y-4">
                  {/* Add Guest Form */}
                  <div className="p-4 rounded-lg bg-muted/50 border border-dashed space-y-3">
                    <p className="text-sm font-medium">Add a guest</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Guest name *"
                        value={newGuestName}
                        onChange={e => setNewGuestName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addGuest()}
                        className="px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <input
                        type="date"
                        value={newGuestArrivalDate}
                        min={startDate || todayStr}
                        onChange={e => setNewGuestArrivalDate(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        title="Flight arrival date (optional)"
                      />
                      <input
                        type="time"
                        value={newGuestArrivalTime}
                        onChange={e => setNewGuestArrivalTime(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        title="Flight arrival time (optional)"
                      />
                    </div>
                    <Button size="sm" onClick={addGuest} disabled={!newGuestName.trim()}>
                      <Plus className="w-4 h-4 mr-1" /> Add Guest
                    </Button>
                  </div>

                  {/* Guest List */}
                  {guests.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{guests.length} {guests.length === 1 ? 'guest' : 'guests'}</p>
                      </div>
                      {guests.map((g, i) => (
                        <div key={g.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                          <div className={`w-9 h-9 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {getInitials(g.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{g.name}</p>
                            {g.arrivalDate && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Plane className="w-3 h-3" />
                                Arrives {g.arrivalDate}{g.arrivalTime ? ` at ${g.arrivalTime}` : ''}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeGuest(g.id)}
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {guests.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No guests added yet. Add your travel companions above.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP 3: Vibes & Preferences ─── */}
        {wizardStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Vibes */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" /> Select your vibes
              </h2>
              <p className="text-sm text-muted-foreground mb-4">What energy are you looking for? Pick as many as you like.</p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(vibeLabels) as [Vibe, string][]).map(([vibe, label]) => (
                  <button
                    key={vibe}
                    onClick={() => toggleVibe(vibe)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                      vibes.includes(vibe)
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'hover:bg-accent hover:border-border'
                    }`}
                  >
                    {vibeEmojis[vibe]} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Budget Tier</h2>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { tier: 'budget' as BudgetTier, sign: '$', desc: 'Keep it lean' },
                  { tier: 'mid' as BudgetTier, sign: '$$', desc: 'Balanced comfort' },
                  { tier: 'luxury' as BudgetTier, sign: '$$$', desc: 'Treat yourself' },
                ]).map(({ tier, sign, desc }) => (
                  <button
                    key={tier}
                    onClick={() => setBudgetTier(tier)}
                    className={`py-4 rounded-xl border-2 font-medium text-sm transition-all flex flex-col items-center gap-1 ${
                      budgetTier === tier
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <span className="text-xl">{sign}</span>
                    <span className="capitalize font-semibold">{tier}</span>
                    <span className="text-[11px] text-muted-foreground">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nightlife */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Moon className="w-5 h-5 text-primary" /> Nightlife Preference
              </h2>
              <p className="text-sm text-muted-foreground mb-4">How much do you want to hit the town after dark?</p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'none' as const, label: 'None', desc: 'Early to bed' },
                  { value: 'some' as const, label: 'Some', desc: 'A night or two out' },
                  { value: 'heavy' as const, label: 'Heavy', desc: 'Let\'s go all out' },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setNightlifePreference(opt.value)}
                    className={`py-3 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-0.5 ${
                      nightlifePreference === opt.value
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <span className="font-semibold">{opt.label}</span>
                    <span className="text-[11px] text-muted-foreground">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Relaxation vs Adventure */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                Relaxation vs Adventure
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {relaxVsAdventure < 30 ? 'Adventure-heavy' : relaxVsAdventure > 70 ? 'Relaxation-heavy' : 'Balanced'}
              </p>
              <input
                type="range" min={0} max={100} value={relaxVsAdventure}
                onChange={e => setRelaxVsAdventure(Number(e.target.value))}
                className="w-full accent-primary h-2 rounded-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1"><Mountain className="w-3 h-3" /> Adventure</span>
                <span className="flex items-center gap-1"><Armchair className="w-3 h-3" /> Relaxation</span>
              </div>
            </div>

            {/* Activity / Category Voting */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-1">
                {isSolo ? 'Preferred Activities' : 'Activity Voting'}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {isSolo
                  ? 'Check the types of activities you\'re interested in.'
                  : guests.length === 0
                    ? 'Add guests in Step 2 to enable group voting.'
                    : 'Each guest can vote on activity categories. Top-voted categories shape your itinerary.'
                }
              </p>

              {/* Solo Mode: Simple checkboxes */}
              {isSolo && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleSoloCategory(cat)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${
                        soloCategories.includes(cat)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <span className="text-base">{categoryIcons[cat]}</span>
                      <span>{categoryLabels[cat]}</span>
                      {soloCategories.includes(cat) && <Check className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Group Mode: Voting table */}
              {!isSolo && guests.length > 0 && (
                <div className="overflow-x-auto -mx-2 px-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Category</th>
                        {guests.map((g, i) => (
                          <th key={g.id} className="py-2 px-1 text-center">
                            <div className={`w-7 h-7 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[10px] font-bold mx-auto`}>
                              {getInitials(g.name)}
                            </div>
                          </th>
                        ))}
                        <th className="py-2 pl-3 text-center font-medium text-muted-foreground">Tally</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ALL_CATEGORIES.map(cat => {
                        const tally = getVoteTally(cat)
                        const net = tally.up - tally.down
                        return (
                          <tr key={cat} className="border-b last:border-0">
                            <td className="py-2.5 pr-4">
                              <span className="flex items-center gap-2">
                                <span>{categoryIcons[cat]}</span>
                                <span className="font-medium">{categoryLabels[cat]}</span>
                              </span>
                            </td>
                            {guests.map(g => {
                              const vote = categoryVotes[g.id]?.[cat] ?? null
                              return (
                                <td key={g.id} className="py-2.5 px-1 text-center">
                                  <div className="inline-flex gap-0.5">
                                    <button
                                      onClick={() => setVote(g.id, cat, 'up')}
                                      className={`p-1 rounded transition-colors ${
                                        vote === 'up'
                                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                          : 'text-muted-foreground hover:text-emerald-500'
                                      }`}
                                    >
                                      <ThumbsUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setVote(g.id, cat, 'down')}
                                      className={`p-1 rounded transition-colors ${
                                        vote === 'down'
                                          ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                                          : 'text-muted-foreground hover:text-rose-500'
                                      }`}
                                    >
                                      <ThumbsDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              )
                            })}
                            <td className="py-2.5 pl-3 text-center">
                              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                                net > 0
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : net < 0
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                    : 'bg-muted text-muted-foreground'
                              }`}>
                                {net > 0 ? '+' : ''}{net}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!isSolo && guests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Go back to Step 2 to add guests first.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP 4: Review & Generate ─── */}
        {wizardStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-primary" /> Review Your Trip
              </h2>
              <p className="text-sm text-muted-foreground mb-6">Double-check everything before we generate your itinerary.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Destination */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Destination</p>
                  <p className="font-semibold">{dest?.name || 'Not selected'}</p>
                </div>

                {/* Dates */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dates</p>
                  <p className="font-semibold">
                    {startDate && endDate
                      ? `${startDate} to ${endDate} (${tripLength} days)`
                      : `${tripLength} days (no dates set)`
                    }
                  </p>
                </div>

                {/* Trip Type */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trip Type</p>
                  <p className="font-semibold">{tripTypeLabels[tripType]}</p>
                </div>

                {/* Group */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Travelers</p>
                  <p className="font-semibold">
                    {isSolo
                      ? `Solo${soloName ? ` (${soloName})` : ''}`
                      : `${guests.length} ${guests.length === 1 ? 'guest' : 'guests'}`
                    }
                  </p>
                </div>

                {/* Budget */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Budget</p>
                  <p className="font-semibold capitalize">{budgetTier} ({budgetTier === 'budget' ? '$' : budgetTier === 'mid' ? '$$' : '$$$'})</p>
                </div>

                {/* Nightlife */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nightlife</p>
                  <p className="font-semibold capitalize">{nightlifePreference}</p>
                </div>
              </div>

              {/* Vibes */}
              <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vibes</p>
                <div className="flex flex-wrap gap-1.5">
                  {vibes.length > 0 ? vibes.map(v => (
                    <Badge key={v} variant="purple" className="text-xs">{vibeEmojis[v]} {vibeLabels[v]}</Badge>
                  )) : (
                    <span className="text-sm text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>

              {/* Preferred Categories */}
              {votedCategories.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {isSolo ? 'Preferred Activities' : 'Top-Voted Activities'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {votedCategories.map(c => (
                      <Badge key={c} className="text-xs">{categoryIcons[c]} {categoryLabels[c]}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Guests summary */}
              {!isSolo && guests.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Guest List</p>
                  <div className="flex flex-wrap gap-2">
                    {guests.map((g, i) => (
                      <div key={g.id} className="flex items-center gap-1.5 text-sm">
                        <div className={`w-6 h-6 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[9px] font-bold`}>
                          {getInitials(g.name)}
                        </div>
                        <span>{g.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Slider summary */}
              <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pace</p>
                <p className="font-semibold">
                  {relaxVsAdventure < 30 ? 'Adventure-heavy' : relaxVsAdventure > 70 ? 'Relaxation-heavy' : 'Balanced'} ({relaxVsAdventure}%)
                </p>
              </div>
            </div>

            {/* Generate Button */}
            <Button variant="gradient" size="xl" className="w-full" onClick={handleGenerate}>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate My Itinerary
            </Button>
          </div>
        )}

        {/* ─── Navigation Buttons ─── */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={wizardStep === 1}
            className={wizardStep === 1 ? 'invisible' : ''}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          <div className="text-sm text-muted-foreground">
            Step {wizardStep} of {STEPS.length}
          </div>

          {wizardStep < 4 ? (
            <Button onClick={goNext}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <div className="invisible">
              <Button>Placeholder</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

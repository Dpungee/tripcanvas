'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, RotateCcw, Save, Check, Edit3, Calendar, MapPin, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ItineraryTimeline } from '@/components/itinerary/ItineraryTimeline'
import { BudgetSummary } from '@/components/budget/BudgetSummary'
import { destinations } from '@/data/destinations'
import { states } from '@/data/states'
import { generateItinerary } from '@/lib/itinerary-generator'
import { calculateBudget } from '@/lib/budget-calculator'
import { useApp, SavedTripFull } from '@/lib/store'
import {
  TripType, Vibe, BudgetTier, VenueCategory, Itinerary, BudgetBreakdown,
  tripTypeLabels, vibeLabels, vibeEmojis,
} from '@/types'

function formatDateRange(startIso: string, days: number): string {
  const start = new Date(startIso + 'T12:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + days - 1)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
}

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function PlannerClient() {
  const searchParams = useSearchParams()
  const app = useApp()

  const [step, setStep] = useState<'configure' | 'result'>('configure')
  const [saved, setSaved] = useState(false)
  const [tripName, setTripName] = useState('')
  const [editingName, setEditingName] = useState(false)

  // Form state
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null)
  const [destinationId, setDestinationId] = useState('miami')
  const [startDate, setStartDate] = useState(todayIso())
  const [tripLength, setTripLength] = useState(3)
  const [groupSize, setGroupSize] = useState(4)
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('mid')
  const [tripType, setTripType] = useState<TripType>('weekend-getaway')
  const [vibes, setVibes] = useState<Vibe[]>(['foodie', 'party'])
  const [categories, setCategories] = useState<VenueCategory[]>([])
  const [nightlifePreference, setNightlifePreference] = useState<'none' | 'some' | 'heavy'>('some')
  const [relaxVsAdventure, setRelaxVsAdventure] = useState(50)

  // Result state
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [budget, setBudget] = useState<BudgetBreakdown | null>(null)

  useEffect(() => {
    const destParam = searchParams.get('destination')
    const typeParam = searchParams.get('type')
    if (destParam && destinations.find(d => d.id === destParam)) {
      setDestinationId(destParam)
      const st = states.find(s => s.destinations.includes(destParam))
      if (st) setSelectedStateId(st.id)
    }
    if (typeParam && typeParam in tripTypeLabels) {
      setTripType(typeParam as TripType)
    }
  }, [searchParams])

  const toggleVibe = (v: Vibe) => setVibes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])

  const handleGenerate = () => {
    const input = {
      destinationId, tripLength, groupSize, budgetTier, tripType, vibes,
      preferredCategories: categories, nightlifePreference, relaxationVsAdventure: relaxVsAdventure,
    }
    const itin = generateItinerary(input)
    const budg = calculateBudget(input, itin)
    setItinerary(itin)
    setBudget(budg)
    setSaved(false)
    const dest = destinations.find(d => d.id === destinationId)
    setTripName(`${dest?.name || 'My'} ${tripTypeLabels[tripType]}`)
    setStep('result')
    app.addActivity(`Generated ${dest?.name} itinerary`, '✨')
    app.notify('Itinerary generated!', 'success')
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

  const dest = destinations.find(d => d.id === destinationId)
  const stateDests = selectedStateId
    ? destinations.filter(d => states.find(s => s.id === selectedStateId)?.destinations.includes(d.id))
    : []

  if (step === 'result' && itinerary && budget) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Result header */}
        <div className="rounded-2xl border bg-gradient-to-r from-indigo-50 to-purple-50 p-5 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {editingName ? (
                <input
                  type="text" value={tripName} onChange={(e) => setTripName(e.target.value)}
                  className="text-2xl md:text-3xl font-bold bg-transparent border-b-2 border-primary focus:outline-none w-full"
                  autoFocus onBlur={() => setEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                />
              ) : (
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 cursor-pointer group" onClick={() => setEditingName(true)}>
                  {tripName}
                  <Edit3 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </h1>
              )}

              {/* Destination + Dates — prominent at top */}
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{dest?.name}</span>
                  {dest?.stateId && <span className="text-muted-foreground">· {states.find(s => s.id === dest.stateId)?.name}</span>}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{formatDateRange(startDate, tripLength)}</span>
                  <span className="text-muted-foreground">({tripLength} days)</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                <span>{groupSize} travelers</span>
                <span>·</span>
                <span className="capitalize">{budgetTier} budget</span>
                <span>·</span>
                <span>{tripTypeLabels[tripType]}</span>
              </div>

              <div className="flex gap-1.5 mt-2">
                {vibes.map(v => (
                  <Badge key={v} variant="purple" className="text-[10px]">{vibeEmojis[v]} {vibeLabels[v]}</Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => { setStep('configure'); setSaved(false) }}>
                <RotateCcw className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleGenerate}>
                <Sparkles className="w-4 h-4 mr-1" /> Regenerate
              </Button>
              <Button variant={saved ? 'outline' : 'gradient'} size="sm" onClick={handleSave} disabled={saved}>
                {saved ? <Check className="w-4 h-4 mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                {saved ? 'Saved!' : 'Save Trip'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ItineraryTimeline days={itinerary.days} editable checkable destinationId={destinationId} startDate={startDate} />
          </div>
          <div className="space-y-6">
            <BudgetSummary budget={budget} groupSize={groupSize} />
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-3">Trip Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Destination</span><span className="font-medium">{dest?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dates</span><span className="font-medium">{formatDateRange(startDate, tripLength)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Group Size</span><span className="font-medium">{groupSize}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Trip Type</span><span className="font-medium">{tripTypeLabels[tripType]}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Activities</span><span className="font-medium">{itinerary.days.reduce((s, d) => s + d.items.length, 0)}</span></div>
              </div>
            </div>
            <Link href="/saved" className="block">
              <Button variant="outline" className="w-full">View All Saved Trips</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold">Plan Your Perfect Trip</h1>
        <p className="text-muted-foreground mt-2">Tell us what you&apos;re looking for and we&apos;ll build your ideal itinerary</p>
      </div>

      <div className="space-y-6">
        {/* Step 1: State picker */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-1">Where are you going?</h2>
          <p className="text-sm text-muted-foreground mb-4">Pick a state, then choose your destination</p>

          {/* State grid — compact chips */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-4">
            {states.map(state => (
              <button
                key={state.id}
                onClick={() => {
                  if (selectedStateId === state.id) {
                    setSelectedStateId(null)
                  } else {
                    setSelectedStateId(state.id)
                    const firstDest = destinations.find(d => state.destinations.includes(d.id))
                    if (firstDest) setDestinationId(firstDest.id)
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all text-left ${
                  selectedStateId === state.id
                    ? 'bg-primary text-white border-primary'
                    : 'hover:bg-accent'
                }`}
              >
                <span className="font-bold text-[11px] opacity-70 flex-shrink-0">{state.abbreviation}</span>
                <span className="truncate">{state.name}</span>
              </button>
            ))}
          </div>

          {/* City picker — shows when a state is selected */}
          {selectedStateId && stateDests.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{states.find(s => s.id === selectedStateId)?.name}</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Select a destination</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {stateDests.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDestinationId(d.id)}
                    className={`relative overflow-hidden rounded-xl aspect-[4/3] group ${destinationId === d.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  >
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url(${d.heroImage})` }} />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                    {destinationId === d.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm text-center px-2">{d.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!selectedStateId && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Click a state above to see available destinations
            </p>
          )}
        </div>

        {/* Trip Details — now includes date */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Trip Details</h2>
          <div className="space-y-5">
            {/* Date row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  min={todayIso()}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Trip Length</label>
                <div className="flex items-center gap-2">
                  {[2, 3, 4, 5, 7].map(n => (
                    <button key={n} onClick={() => setTripLength(n)}
                      className={`w-12 h-12 rounded-xl border font-semibold text-sm transition-all ${tripLength === n ? 'bg-primary text-white border-primary' : 'hover:bg-accent'}`}>
                      {n}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Group + Budget row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Group Size</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[1, 2, 4, 6, 8, 10].map(n => (
                    <button key={n} onClick={() => setGroupSize(n)}
                      className={`w-12 h-12 rounded-xl border font-semibold text-sm transition-all ${groupSize === n ? 'bg-primary text-white border-primary' : 'hover:bg-accent'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Budget</label>
                <div className="flex gap-2">
                  {(['budget', 'mid', 'luxury'] as BudgetTier[]).map(tier => (
                    <button key={tier} onClick={() => setBudgetTier(tier)}
                      className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all ${budgetTier === tier ? 'bg-primary text-white border-primary' : 'hover:bg-accent'}`}>
                      {tier === 'budget' ? '$' : tier === 'mid' ? '$$' : '$$$'}
                      <span className="block text-[10px] mt-0.5 opacity-80">{tier}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Type */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">What type of trip?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {(Object.entries(tripTypeLabels) as [TripType, string][]).map(([type, label]) => (
              <button key={type} onClick={() => setTripType(type)}
                className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${tripType === type ? 'bg-primary text-white border-primary' : 'hover:bg-accent'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Vibes */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Select your vibes</h2>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(vibeLabels) as [Vibe, string][]).map(([vibe, label]) => (
              <button key={vibe} onClick={() => toggleVibe(vibe)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${vibes.includes(vibe) ? 'bg-primary text-white border-primary' : 'hover:bg-accent'}`}>
                {vibeEmojis[vibe]} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Preferences</h2>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">Nightlife Preference</label>
              <div className="flex gap-2">
                {([
                  { value: 'none' as const, label: 'No nightlife' },
                  { value: 'some' as const, label: 'Some nightlife' },
                  { value: 'heavy' as const, label: 'Heavy nightlife' },
                ]).map(opt => (
                  <button key={opt.value} onClick={() => setNightlifePreference(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${nightlifePreference === opt.value ? 'bg-primary text-white border-primary' : 'hover:bg-accent'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                Relaxation vs Adventure: {relaxVsAdventure < 30 ? 'Adventure-heavy' : relaxVsAdventure > 70 ? 'Relaxation-heavy' : 'Balanced'}
              </label>
              <input type="range" min={0} max={100} value={relaxVsAdventure}
                onChange={(e) => setRelaxVsAdventure(Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Adventure</span><span>Relaxation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Generate */}
        <Button variant="gradient" size="xl" className="w-full" onClick={handleGenerate}>
          <Sparkles className="w-5 h-5 mr-2" />
          Generate My Itinerary
        </Button>
      </div>
    </div>
  )
}

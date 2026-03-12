'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Star, DollarSign, Calendar, Plane, Heart, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VenueCard } from '@/components/venue/VenueCard'
import { StayCard } from '@/components/stay/StayCard'
import { BudgetSummary } from '@/components/budget/BudgetSummary'
import { ItineraryTimeline } from '@/components/itinerary/ItineraryTimeline'
import { getDestinationById } from '@/data/destinations'
import { getVenuesByDestination } from '@/data/venues'
import { getStaysByDestination } from '@/data/stays'
import { getStateById } from '@/data/states'
import { generateItinerary } from '@/lib/itinerary-generator'
import { calculateBudget } from '@/lib/budget-calculator'
import { formatCurrency } from '@/lib/utils'
import { useApp } from '@/lib/store'
import { VenueCategory, BudgetTier, categoryLabels, categoryIcons, Venue, PriceLevel } from '@/types'

const tabs = ['overview', 'activities', 'restaurants', 'nightlife', 'stays', 'itinerary', 'budget'] as const
type Tab = typeof tabs[number]

const priceFilters = [
  { value: 'all', label: 'All Prices' },
  { value: '$', label: '$ Budget' },
  { value: '$$', label: '$$ Moderate' },
  { value: '$$$', label: '$$$ Upscale' },
  { value: '$$$$', label: '$$$$ Luxury' },
] as const

export default function DestinationClient({ destinationId }: { destinationId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [stayNights, setStayNights] = useState(3)
  const [venueFilter, setVenueFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'rating' | 'price-low' | 'price-high'>('rating')
  const [sampleBudgetTier, setSampleBudgetTier] = useState<BudgetTier>('mid')

  const app = useApp()
  const dest = getDestinationById(destinationId)
  if (!dest) return <div className="max-w-7xl mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold">Destination not found</h1><Link href="/explore" className="text-primary mt-4 block">Browse all destinations</Link></div>

  const state = getStateById(dest.stateId)
  const allVenues = getVenuesByDestination(destinationId)
  const stays = getStaysByDestination(destinationId)
  const liked = app.isFavoriteDestination(destinationId)

  const restaurants = allVenues.filter(v => v.category === 'restaurant' || v.category === 'brunch')
  const nightlife = allVenues.filter(v => ['bar', 'club', 'rooftop', 'live-music'].includes(v.category))
  const activities = allVenues.filter(v => ['museum', 'spa', 'outdoor', 'tour', 'event', 'shopping'].includes(v.category))

  const filterByPrice = (list: Venue[]) => {
    if (priceFilter === 'all') return list
    return list.filter(v => v.priceLevel === priceFilter)
  }

  const sortVenues = (list: Venue[]) => {
    const s = [...list]
    if (sortBy === 'rating') s.sort((a, b) => b.rating - a.rating)
    if (sortBy === 'price-low') s.sort((a, b) => (a.avgPrice || 0) - (b.avgPrice || 0))
    if (sortBy === 'price-high') s.sort((a, b) => (b.avgPrice || 0) - (a.avgPrice || 0))
    return s
  }

  const filteredActivities = useMemo(() => {
    let list = activities
    if (venueFilter !== 'all') list = list.filter(v => v.category === venueFilter)
    list = filterByPrice(list)
    return sortVenues(list)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueFilter, priceFilter, sortBy, destinationId])

  const sampleItinerary = useMemo(() => generateItinerary({
    destinationId, tripLength: 3, groupSize: 4, budgetTier: sampleBudgetTier,
    tripType: 'weekend-getaway', vibes: ['foodie', 'party'],
    preferredCategories: [], nightlifePreference: 'some', relaxationVsAdventure: 50,
  }), [destinationId, sampleBudgetTier])

  const sampleBudget = useMemo(() => calculateBudget({
    destinationId, tripLength: 3, groupSize: 4, budgetTier: sampleBudgetTier,
    tripType: 'weekend-getaway', vibes: ['foodie'],
    preferredCategories: [], nightlifePreference: 'some', relaxationVsAdventure: 50,
  }, sampleItinerary), [destinationId, sampleBudgetTier, sampleItinerary])

  const venueCategories = Array.from(new Set(allVenues.map(v => v.category)))
  const activityCategories = Array.from(new Set(activities.map(v => v.category)))

  const handleToggleFavorite = () => {
    app.toggleFavoriteDestination(destinationId)
    app.notify(liked ? `Removed ${dest.name} from favorites` : `Added ${dest.name} to favorites`)
    app.addActivity(liked ? `Removed ${dest.name} from favorites` : `Saved ${dest.name} to favorites`, liked ? '💔' : '❤️')
  }

  const handleAddVenue = (venue: Venue) => {
    app.toggleFavoriteVenue(venue.id)
    app.notify(`Added ${venue.name} to favorites`)
  }

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      app.notify('Link copied to clipboard!', 'info')
    }
  }

  const renderVenueGrid = (list: Venue[], emptyMsg: string) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.length > 0 ? list.map(v => <VenueCard key={v.id} venue={v} onAdd={handleAddVenue} />) :
        <p className="text-muted-foreground col-span-full text-center py-12">{emptyMsg}</p>}
    </div>
  )

  const PriceFilterBar = () => (
    <div className="flex gap-1">
      {priceFilters.map(pf => (
        <button key={pf.value} onClick={() => setPriceFilter(pf.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${priceFilter === pf.value ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}`}>
          {pf.label}
        </button>
      ))}
    </div>
  )

  const SortSelect = () => (
    <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
      className="h-9 px-3 rounded-lg border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/20">
      <option value="rating">Top Rated</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option>
    </select>
  )

  return (
    <div>
      {/* Hero */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${dest.heroImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <Link href={`/explore/${dest.stateId}`} className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 transition-colors">
              <ArrowLeft className="w-4 h-4" /> {state?.name || 'Back'}
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold text-white">{dest.name}</h1>
                <div className="flex flex-wrap gap-2 mt-3">{dest.tags.slice(0, 5).map(tag => <Badge key={tag} className="bg-white/20 text-white border-white/30 text-xs">{tag}</Badge>)}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleToggleFavorite} className="p-2.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </button>
                <button onClick={handleShare} className="p-2.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <Share2 className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-500" /><span className="text-muted-foreground">Avg:</span><span className="font-semibold">{formatCurrency(dest.avgDailyBudget)}/day</span></div>
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" /><span className="text-muted-foreground">Best:</span><span className="font-semibold">{dest.bestMonths.slice(0, 3).join(', ')}</span></div>
            <div className="flex items-center gap-2"><Plane className="w-4 h-4 text-purple-500" /><span className="font-semibold">{dest.quickStats.nearestAirport}</span></div>
            <div className="flex items-center gap-2">🍽 {dest.foodRating}/5 · 🌙 {dest.nightlifeRating}/5 · 😌 {dest.relaxationRating}/5</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b sticky top-16 z-40 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-1 -mx-4 px-4">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
              >{tab.charAt(0).toUpperCase() + tab.slice(1)}{tab === 'restaurants' ? ` (${restaurants.length})` : tab === 'nightlife' ? ` (${nightlife.length})` : tab === 'activities' ? ` (${activities.length})` : tab === 'stays' ? ` (${stays.length})` : ''}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-fade-in">
            <div className="max-w-3xl"><h2 className="text-2xl font-bold mb-3">About {dest.name}</h2><p className="text-muted-foreground leading-relaxed">{dest.description}</p></div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Explore by Category</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {venueCategories.map(cat => (
                  <button key={cat} onClick={() => setActiveTab(cat === 'restaurant' || cat === 'brunch' ? 'restaurants' : ['bar','club','rooftop','live-music'].includes(cat) ? 'nightlife' : 'activities')}
                    className="rounded-xl border bg-card p-4 text-center hover:shadow-md transition-all hover:border-primary/30">
                    <div className="text-2xl mb-1">{categoryIcons[cat]}</div>
                    <h4 className="font-medium text-xs">{categoryLabels[cat]}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{allVenues.filter(v => v.category === cat).length} spots</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Top Picks</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...allVenues].sort((a, b) => b.rating - a.rating).slice(0, 6).map(v => <VenueCard key={v.id} venue={v} onAdd={handleAddVenue} />)}
              </div>
            </div>
            {stays.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Where to Stay</h3><button onClick={() => setActiveTab('stays')} className="text-sm text-primary font-medium">View all &rarr;</button></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{stays.slice(0, 3).map(s => <StayCard key={s.id} stay={s} nights={stayNights} />)}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold">Things to Do ({filteredActivities.length})</h2>
              <div className="flex gap-2">
                <select value={venueFilter} onChange={e => setVenueFilter(e.target.value)} className="h-9 px-3 rounded-lg border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="all">All Categories</option>
                  {activityCategories.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>)}
                </select>
                <SortSelect />
              </div>
            </div>
            <div className="mb-6"><PriceFilterBar /></div>
            {renderVenueGrid(filteredActivities, 'No activities match your filters.')}
          </div>
        )}

        {activeTab === 'restaurants' && (
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold">Restaurants & Dining ({filterByPrice(restaurants).length})</h2>
              <SortSelect />
            </div>
            <div className="mb-6"><PriceFilterBar /></div>
            {renderVenueGrid(sortVenues(filterByPrice(restaurants)), `No restaurants match the selected price filter.`)}
          </div>
        )}

        {activeTab === 'nightlife' && (
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold">Nightlife ({filterByPrice(nightlife).length})</h2>
              <SortSelect />
            </div>
            <div className="mb-6"><PriceFilterBar /></div>
            {renderVenueGrid(sortVenues(filterByPrice(nightlife)), `No nightlife matches the selected price filter.`)}
          </div>
        )}

        {activeTab === 'stays' && (
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold">Where to Stay ({stays.length})</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Nights:</span>
                {[2, 3, 4, 5, 7].map(n => (
                  <button key={n} onClick={() => setStayNights(n)} className={`w-9 h-9 rounded-lg border text-sm font-medium transition-all ${stayNights === n ? 'bg-primary text-white border-primary' : 'hover:bg-accent'}`}>{n}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stays.length > 0 ? stays.map(s => <StayCard key={s.id} stay={s} nights={stayNights} />) :
                <p className="text-muted-foreground col-span-full text-center py-12">No stays data yet.</p>}
            </div>
          </div>
        )}

        {activeTab === 'itinerary' && (
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Sample 3-Day Itinerary</h2>
                <p className="text-muted-foreground mt-1">A curated weekend trip for 4 travelers</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {(['budget', 'mid', 'luxury'] as BudgetTier[]).map(tier => (
                    <button key={tier} onClick={() => setSampleBudgetTier(tier)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sampleBudgetTier === tier ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}`}>
                      {tier === 'budget' ? '$ Budget' : tier === 'mid' ? '$$ Mid' : '$$$ Luxury'}
                    </button>
                  ))}
                </div>
                <Link href={`/planner?destination=${destinationId}`}><Button variant="gradient" size="sm">Customize</Button></Link>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><ItineraryTimeline days={sampleItinerary.days} destinationId={destinationId} /></div>
              <div><BudgetSummary budget={sampleBudget} groupSize={4} /></div>
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="animate-fade-in max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Budget Guide for {dest.name}</h2>
            <div className="flex gap-1 mb-6">
              {(['budget', 'mid', 'luxury'] as BudgetTier[]).map(tier => (
                <button key={tier} onClick={() => setSampleBudgetTier(tier)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sampleBudgetTier === tier ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}`}>
                  {tier === 'budget' ? '$ Budget' : tier === 'mid' ? '$$ Mid-Range' : '$$$ Luxury'}
                </button>
              ))}
            </div>
            <BudgetSummary budget={sampleBudget} groupSize={4} />
            <div className="mt-6"><Link href={`/planner?destination=${destinationId}`}><Button variant="gradient" size="lg" className="w-full">Plan Your Trip to {dest.name}</Button></Link></div>
          </div>
        )}
      </div>
    </div>
  )
}

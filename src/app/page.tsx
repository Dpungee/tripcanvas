'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, MapPin, Sparkles, Users, Calendar, DollarSign, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DestinationCard } from '@/components/destination/DestinationCard'
import { getAllStates } from '@/data/states'
import {
  getFeaturedDestinations,
  getTrendingPartyDestinations,
  getLuxuryDestinations,
  getRelaxingDestinations,
  searchDestinations,
} from '@/data/destinations'
import { useApp } from '@/lib/store'
import { tripTypeLabels, vibeEmojis, type TripType } from '@/types'

const tripTypes: { type: TripType; emoji: string }[] = [
  { type: 'weekend-getaway', emoji: '🌴' },
  { type: 'birthday', emoji: '🎂' },
  { type: 'bachelor-party', emoji: '🎩' },
  { type: 'bachelorette-party', emoji: '👑' },
  { type: 'girls-trip', emoji: '💅' },
  { type: 'guys-trip', emoji: '🍻' },
  { type: 'romantic', emoji: '💕' },
  { type: 'family', emoji: '👨‍👩‍👧‍👦' },
  { type: 'solo', emoji: '🧳' },
  { type: 'luxury-vacation', emoji: '✨' },
]

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const app = useApp()
  const states = getAllStates()
  const featured = getFeaturedDestinations()
  const partyDests = getTrendingPartyDestinations()
  const luxuryDests = getLuxuryDestinations()
  const relaxDests = getRelaxingDestinations()

  const searchResults = searchQuery.length > 1 ? searchDestinations(searchQuery) : []

  const handleSearchSelect = (destName: string) => {
    app.addActivity(`Searched for "${destName}"`, '🔍')
    setSearchQuery('')
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-yellow-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            <Badge className="bg-white/20 text-white border-white/30 mb-6 text-sm px-3 py-1">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Your dream trip starts here
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Plan trips that
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
                everyone remembers
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl">
              Discover destinations, build day-by-day itineraries, compare stays, and split costs with your crew — all in one place.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search destinations... (e.g. Miami, Nashville, Aspen)"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white text-gray-900 placeholder:text-gray-400 text-base shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border overflow-hidden z-50">
                  {searchResults.slice(0, 5).map(d => (
                    <Link key={d.id} href={`/destinations/${d.id}`}
                      onClick={() => handleSearchSelect(d.name)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${d.heroImage})` }} />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{d.name}</p>
                        <p className="text-xs text-gray-500">{d.tags.slice(0, 3).join(' · ')}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/planner">
                <Button variant="gradient" size="lg" className="bg-white text-indigo-700 hover:bg-white/90 shadow-xl">
                  <Calendar className="w-4 h-4 mr-2" /> Start Planning
                </Button>
              </Link>
              <Link href="/explore">
                <Button size="lg" className="bg-white/15 backdrop-blur-sm border border-white/30 hover:bg-white/25">
                  <MapPin className="w-4 h-4 mr-2" /> Explore States
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trip Type Selector */}
      <section className="py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">What are you planning?</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {tripTypes.map(({ type, emoji }) => (
              <Link key={type} href={`/planner?type=${type}`}
                className="flex-shrink-0 px-4 py-2.5 rounded-xl border bg-card hover:bg-accent hover:border-primary/30 transition-all text-sm font-medium flex items-center gap-2 whitespace-nowrap">
                <span>{emoji}</span>
                {tripTypeLabels[type]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Featured Destinations</h2>
              <p className="text-muted-foreground mt-1">Top picks for your next getaway</p>
            </div>
            <Link href="/explore" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(d => (
              <DestinationCard key={d.id} destination={d} variant="featured" />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Party Destinations */}
      <section className="py-16 bg-gradient-to-b from-purple-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">🎉 Trending Party Destinations</h2>
              <p className="text-muted-foreground mt-1">Where the bachelor and bachelorette parties are heading</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {partyDests.map(d => (
              <DestinationCard key={d.id} destination={d} />
            ))}
          </div>
        </div>
      </section>

      {/* Luxury Escapes */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Luxury Escapes</h2>
              <p className="text-muted-foreground mt-1">Treat yourself to something extraordinary</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {luxuryDests.map(d => (
              <DestinationCard key={d.id} destination={d} />
            ))}
          </div>
        </div>
      </section>

      {/* Relaxing Getaways */}
      <section className="py-16 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">😌 Relaxing Getaways</h2>
              <p className="text-muted-foreground mt-1">Unwind and recharge at these peaceful destinations</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relaxDests.map(d => (
              <DestinationCard key={d.id} destination={d} />
            ))}
          </div>
        </div>
      </section>

      {/* Browse by State */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Browse by State</h2>
            <p className="text-muted-foreground mt-1">Explore what each state has to offer</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {states.map(state => (
              <Link key={state.id} href={`/explore/${state.id}`} className="group">
                <div className="relative overflow-hidden rounded-xl aspect-[3/2]">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${state.heroImage})` }} />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <span className="text-2xl font-bold">{state.abbreviation}</span>
                    <span className="text-sm font-medium mt-0.5">{state.name}</span>
                    <span className="text-xs opacity-80 mt-1">{state.destinations.length} destinations</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to plan something amazing?</h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Pick a destination, set your vibe, and let TripCanvas build your perfect itinerary in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/planner">
              <Button size="xl" className="bg-white text-indigo-700 hover:bg-white/90 shadow-xl w-full sm:w-auto">
                <Sparkles className="w-5 h-5 mr-2" />
                Generate My Itinerary
              </Button>
            </Link>
            <Link href="/group">
              <Button size="xl" className="bg-white/15 border border-white/30 hover:bg-white/25 w-full sm:w-auto">
                <Users className="w-5 h-5 mr-2" />
                Plan with Friends
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

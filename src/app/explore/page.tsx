'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DestinationCard } from '@/components/destination/DestinationCard'
import { getAllStates } from '@/data/states'
import { destinations, searchDestinations } from '@/data/destinations'
import { useApp } from '@/lib/store'
import { DestinationTag } from '@/types'

const filterTags: { tag: DestinationTag; label: string; emoji: string }[] = [
  { tag: 'nightlife', label: 'Nightlife', emoji: '🌙' },
  { tag: 'beach', label: 'Beach', emoji: '🏖️' },
  { tag: 'party', label: 'Party', emoji: '🎉' },
  { tag: 'luxury', label: 'Luxury', emoji: '✨' },
  { tag: 'relaxing', label: 'Relaxing', emoji: '😌' },
  { tag: 'foodie', label: 'Foodie', emoji: '🍽️' },
  { tag: 'romantic', label: 'Romantic', emoji: '💕' },
  { tag: 'outdoors', label: 'Outdoors', emoji: '🏔️' },
  { tag: 'culture', label: 'Culture', emoji: '🎭' },
  { tag: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { tag: 'group-friendly', label: 'Group-Friendly', emoji: '👥' },
  { tag: 'hidden-gem', label: 'Hidden Gems', emoji: '💎' },
  { tag: 'wellness', label: 'Wellness', emoji: '🧘' },
]

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<DestinationTag[]>([])
  const app = useApp()
  const states = getAllStates()

  const toggleFilter = (tag: DestinationTag) => {
    setActiveFilters(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  let filtered = query.length > 1 ? searchDestinations(query) : destinations

  if (activeFilters.length > 0) {
    filtered = filtered.filter(d =>
      activeFilters.some(f => d.tags.includes(f))
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Explore Destinations</h1>
        <p className="text-muted-foreground mt-2">Browse {destinations.length} destinations across {states.length} states</p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destinations..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filterTags.map(({ tag, label, emoji }) => (
            <button
              key={tag}
              onClick={() => toggleFilter(tag)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                activeFilters.includes(tag)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-accent border-border'
              }`}
            >
              {emoji} {label}
            </button>
          ))}
          {activeFilters.length > 0 && (
            <button
              onClick={() => setActiveFilters([])}
              className="px-3 py-1.5 rounded-full text-sm font-medium text-destructive hover:bg-red-50 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Browse by State */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold mb-4">Browse by State</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {states.map(state => (
            <Link key={state.id} href={`/explore/${state.id}`} className="group text-center">
              <div className="relative overflow-hidden rounded-xl aspect-square mb-1.5">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${state.heroImage})` }}
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{state.abbreviation}</span>
                </div>
              </div>
              <span className="text-xs font-medium">{state.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {activeFilters.length > 0 || query ? `${filtered.length} results` : 'All Destinations'}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(d => (
            <DestinationCard key={d.id} destination={d} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg font-medium text-muted-foreground">No destinations found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  )
}

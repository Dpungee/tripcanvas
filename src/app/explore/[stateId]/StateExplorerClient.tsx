'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DestinationCard } from '@/components/destination/DestinationCard'
import { getStateById } from '@/data/states'
import { getDestinationsByState } from '@/data/destinations'
import { getVenuesByDestination } from '@/data/venues'
import { formatCurrency } from '@/lib/utils'
import { useApp } from '@/lib/store'
import { VenueCategory, categoryLabels, categoryIcons } from '@/types'

export default function StateExplorerClient({ stateId }: { stateId: string }) {
  const app = useApp()
  const state = getStateById(stateId)

  useEffect(() => {
    if (state) {
      app.addActivity(`Explored ${state.name}`, '🗺️')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateId])

  if (!state) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">State not found</h1>
      <Link href="/explore" className="text-primary mt-4 block">Browse all states</Link>
    </div>
  )

  const dests = getDestinationsByState(stateId)
  const allVenues = dests.flatMap(d => getVenuesByDestination(d.id))
  const categoryCounts: Partial<Record<VenueCategory, number>> = {}
  allVenues.forEach(v => {
    categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1
  })

  return (
    <div>
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${state.heroImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <Link href="/explore" className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-3 transition-colors">
              <ArrowLeft className="w-4 h-4" /> All States
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold text-white">{state.name}</h1>
            <p className="text-white/80 mt-2 max-w-2xl">{state.description}</p>
            <div className="flex items-center gap-4 mt-3 text-white/70 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {dests.length} destinations
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> {formatCurrency(state.budgetRange.low)} - {formatCurrency(state.budgetRange.high)}/day
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Highlights */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Highlights</h2>
          <div className="flex flex-wrap gap-2">
            {state.highlights.map(h => (
              <Badge key={h} variant="secondary" className="text-sm px-3 py-1">{h}</Badge>
            ))}
          </div>
        </div>

        {/* Destinations */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Popular Destinations in {state.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dests.map(d => (
              <DestinationCard key={d.id} destination={d} />
            ))}
          </div>
        </div>

        {/* Category Sections */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">What to Explore</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(Object.entries(categoryCounts) as [VenueCategory, number][]).map(([cat, count]) => (
              <div key={cat} className="rounded-xl border bg-card p-4 text-center hover:shadow-md transition-all cursor-pointer">
                <div className="text-3xl mb-2">{categoryIcons[cat]}</div>
                <h3 className="font-semibold text-sm">{categoryLabels[cat]}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{count} spots</p>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Guide */}
        <div className="rounded-xl border bg-gradient-to-r from-emerald-50 to-blue-50 p-6">
          <h2 className="text-xl font-bold mb-4">Budget Guide for {state.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white p-4 border">
              <Badge variant="success" className="mb-2">Budget</Badge>
              <p className="text-2xl font-bold">{formatCurrency(state.budgetRange.low)}<span className="text-sm font-normal text-muted-foreground">/day</span></p>
              <p className="text-sm text-muted-foreground mt-1">Hostels, street food, free attractions</p>
            </div>
            <div className="rounded-xl bg-white p-4 border">
              <Badge variant="info" className="mb-2">Mid-Range</Badge>
              <p className="text-2xl font-bold">{formatCurrency(Math.round((state.budgetRange.low + state.budgetRange.high) / 2))}<span className="text-sm font-normal text-muted-foreground">/day</span></p>
              <p className="text-sm text-muted-foreground mt-1">Nice hotels, restaurants, activities</p>
            </div>
            <div className="rounded-xl bg-white p-4 border">
              <Badge variant="warning" className="mb-2">Luxury</Badge>
              <p className="text-2xl font-bold">{formatCurrency(state.budgetRange.high)}<span className="text-sm font-normal text-muted-foreground">/day</span></p>
              <p className="text-sm text-muted-foreground mt-1">5-star resorts, fine dining, VIP</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link href={`/planner`}>
            <Button variant="gradient" size="lg">
              Plan a Trip to {state.name}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

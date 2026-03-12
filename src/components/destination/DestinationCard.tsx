'use client'

import Link from 'next/link'
import { MapPin, Star, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Destination } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface DestinationCardProps {
  destination: Destination
  variant?: 'default' | 'compact' | 'featured'
}

const tagColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'purple' | 'pink'> = {
  nightlife: 'purple',
  party: 'pink',
  luxury: 'warning',
  beach: 'info',
  foodie: 'success',
  romantic: 'pink',
  relaxing: 'info',
  culture: 'purple',
  outdoors: 'success',
  'group-friendly': 'default',
  family: 'info',
  wellness: 'success',
  'hidden-gem': 'warning',
}

export function DestinationCard({ destination, variant = 'default' }: DestinationCardProps) {
  if (variant === 'featured') {
    return (
      <Link href={`/destinations/${destination.id}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl aspect-[4/5] bg-gray-100">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url(${destination.heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-1.5 text-white/80 text-sm mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{destination.name}</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{destination.name}</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {destination.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between text-white/90 text-sm">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                {formatCurrency(destination.avgDailyBudget)}/day
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                {destination.nightlifeRating}/5 nightlife
              </span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link href={`/destinations/${destination.id}`} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
        <div
          className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0"
          style={{ backgroundImage: `url(${destination.heroImage})` }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{destination.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(destination.avgDailyBudget)}/day avg</p>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/destinations/${destination.id}`} className="group block">
      <div className="rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="relative aspect-[16/10] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${destination.heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-1.5">
            {destination.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant={tagColors[tag] || 'secondary'} className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{destination.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{destination.description}</p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <span className="text-sm font-medium">{formatCurrency(destination.avgDailyBudget)}/day</span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>🍽 {destination.foodRating}/5</span>
              <span>🌙 {destination.nightlifeRating}/5</span>
              <span>😌 {destination.relaxationRating}/5</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

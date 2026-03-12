'use client'

import { Star, MapPin, Clock, DollarSign, Bookmark, Map, CalendarCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Venue, categoryIcons, categoryLabels } from '@/types'
import { getGoogleMapsUrl, getGoogleSearchUrl } from '@/lib/utils'
import { destinations } from '@/data/destinations'
import { useState } from 'react'
import { ReservationModal } from '@/components/booking/ReservationModal'

interface VenueCardProps {
  venue: Venue
  variant?: 'default' | 'compact' | 'list'
  onAdd?: (venue: Venue) => void
}

const RESERVABLE_CATEGORIES = ['restaurant', 'bar', 'brunch', 'spa', 'rooftop', 'club', 'live-music', 'tour']

function getLocationName(destinationId: string): string {
  const dest = destinations.find(d => d.id === destinationId)
  return dest ? dest.name : ''
}

export function VenueCard({ venue, variant = 'default', onAdd }: VenueCardProps) {
  const [saved, setSaved] = useState(false)
  const [showReservation, setShowReservation] = useState(false)
  const icon = categoryIcons[venue.category] || '📍'
  const mapsUrl = getGoogleMapsUrl(venue.name, venue.address)
  const locationName = getLocationName(venue.destinationId)
  const searchUrl = getGoogleSearchUrl(venue.name, locationName)
  const isReservable = RESERVABLE_CATEGORIES.includes(venue.category)

  if (variant === 'list') {
    return (
      <>
        <div className="flex items-start gap-4 p-4 rounded-xl border hover:shadow-md transition-all">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="w-20 h-20 rounded-lg bg-cover bg-center flex-shrink-0 hover:opacity-90 transition-opacity"
            style={{ backgroundImage: `url(${venue.imageUrl})` }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-primary transition-colors">{venue.name}</a>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {venue.neighborhood}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{venue.rating}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{venue.description}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">{icon} {venue.category}</Badge>
              <span className="text-sm font-medium text-emerald-600">{venue.priceLevel}</span>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-emerald-600 flex items-center gap-0.5 transition-colors">
                <Map className="w-3 h-3" /> Map
              </a>
              {onAdd && (
                <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={() => onAdd(venue)}>
                  + Add to Trip
                </Button>
              )}
              {isReservable && (
                <Button size="sm" variant="gradient" className="h-7 text-xs" onClick={() => setShowReservation(true)}>
                  <CalendarCheck className="w-3 h-3 mr-1" /> Reserve
                </Button>
              )}
            </div>
          </div>
        </div>
        {showReservation && (
          <ReservationModal venue={venue} onClose={() => setShowReservation(false)} />
        )}
      </>
    )
  }

  if (variant === 'compact') {
    return (
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors cursor-pointer">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{venue.name}</h4>
          <p className="text-xs text-muted-foreground">{venue.priceLevel} · {venue.neighborhood}</p>
        </div>
        <div className="flex items-center gap-0.5 text-xs">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          {venue.rating}
        </div>
      </a>
    )
  }

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <div className="relative aspect-[16/10] overflow-hidden">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${venue.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </a>
          <button
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors z-10"
            onClick={() => setSaved(!saved)}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-primary text-primary' : 'text-gray-600'}`} />
          </button>
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-[11px]">
              {icon} {venue.category}
            </Badge>
            <span className="text-white font-semibold text-sm">{venue.priceLevel}</span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-1">
            <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="font-semibold group-hover:text-primary transition-colors">
              {venue.name}
            </a>
            <div className="flex items-center gap-0.5 text-sm flex-shrink-0 ml-2">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{venue.rating}</span>
            </div>
          </div>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">
            <MapPin className="w-3 h-3" /> {venue.neighborhood} · {venue.address}
          </a>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{venue.description}</p>
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {venue.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {venue.avgPrice != null && (
                <><DollarSign className="w-3.5 h-3.5" /><span>~${venue.avgPrice} avg</span></>
              )}
              <Clock className="w-3.5 h-3.5 ml-3" />
              <span>{venue.hours}</span>
            </div>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              <Map className="w-3 h-3" /> Maps
            </a>
          </div>
          {isReservable && (
            <Button
              onClick={() => setShowReservation(true)}
              className="w-full mt-3"
              variant="gradient"
              size="sm"
            >
              <CalendarCheck className="w-4 h-4 mr-1.5" />
              Reserve a Table
            </Button>
          )}
        </div>
      </div>

      {showReservation && (
        <ReservationModal venue={venue} onClose={() => setShowReservation(false)} />
      )}
    </>
  )
}

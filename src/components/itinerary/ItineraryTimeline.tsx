'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ItineraryDay, ItineraryItem, Venue, categoryIcons, categoryLabels, TimeBlock, VenueCategory } from '@/types'
import {
  formatCurrency,
  getGoogleMapsUrl,
  getGoogleMapsDirectionsUrl,
  getGoogleSearchUrl,
  getYelpSearchUrl,
  getTripAdvisorSearchUrl,
  getOpenTableSearchUrl,
} from '@/lib/utils'
import { getVenueById } from '@/data/venues'
import { destinations } from '@/data/destinations'
import {
  Clock, MapPin, CalendarDays, Trash2, GripVertical, AlertCircle,
  ChevronDown, ChevronUp, Star, DollarSign, Navigation, ExternalLink,
  Map, Search, Route, Globe, Utensils, MessageSquare,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ItineraryTimelineProps {
  days: ItineraryDay[]
  editable?: boolean
  destinationId?: string
  onRemoveItem?: (dayIndex: number, itemId: string) => void
}

const timeBlockColors: Record<TimeBlock, string> = {
  morning: 'border-l-amber-400',
  afternoon: 'border-l-blue-400',
  evening: 'border-l-purple-400',
  'late-night': 'border-l-pink-400',
}

const timeBlockBg: Record<TimeBlock, string> = {
  morning: 'bg-amber-50 text-amber-700',
  afternoon: 'bg-blue-50 text-blue-700',
  evening: 'bg-purple-50 text-purple-700',
  'late-night': 'bg-pink-50 text-pink-700',
}

const timeBlockLabels: Record<TimeBlock, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  'late-night': 'Late Night',
}

const timeBlockIcons: Record<TimeBlock, string> = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌆',
  'late-night': '🌙',
}

function getLocationName(destinationId: string): string {
  const dest = destinations.find(d => d.id === destinationId)
  return dest ? dest.name : ''
}

// Quick action link button used in venue cards
function QuickLink({ href, icon: Icon, label, variant = 'default' }: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  variant?: 'default' | 'primary' | 'maps'
}) {
  const baseClasses = 'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98]'
  const variants = {
    default: 'bg-secondary hover:bg-secondary/80 text-foreground',
    primary: 'bg-primary/10 hover:bg-primary/20 text-primary',
    maps: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700',
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClasses} ${variants[variant]}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </a>
  )
}

function VenueDetailCard({ venue }: { venue: Venue }) {
  const locationName = getLocationName(venue.destinationId)
  const mapsUrl = getGoogleMapsUrl(venue.name, venue.address)
  const directionsUrl = getGoogleMapsDirectionsUrl(venue.address)
  const googleUrl = getGoogleSearchUrl(venue.name, locationName)
  const yelpUrl = getYelpSearchUrl(venue.name, locationName)
  const tripAdvisorUrl = getTripAdvisorSearchUrl(venue.name, locationName)
  const isRestaurant = ['restaurant', 'brunch'].includes(venue.category)
  const openTableUrl = isRestaurant ? getOpenTableSearchUrl(venue.name, locationName) : null

  return (
    <div className="mt-3 rounded-xl border bg-secondary/30 overflow-hidden animate-fade-in">
      <div className="flex flex-col sm:flex-row">
        {/* Venue Image */}
        <div className="sm:w-48 h-36 sm:h-auto flex-shrink-0 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${venue.imageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <Badge variant="secondary" className="text-[10px] bg-white/90 text-gray-800 backdrop-blur-sm">
              {categoryLabels[venue.category] || venue.category}
            </Badge>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
            >
              <Map className="w-3.5 h-3.5 text-emerald-600" />
            </a>
          </div>
        </div>

        {/* Venue Info */}
        <div className="flex-1 p-3.5 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed">{venue.description}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
            >
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate underline decoration-dashed underline-offset-2">{venue.address}</span>
            </a>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>{venue.hours}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Star className="w-3 h-3 flex-shrink-0 text-amber-500" />
              <span>{venue.rating} rating</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="w-3 h-3 flex-shrink-0" />
              <span>{venue.priceLevel} · ~{formatCurrency(venue.avgPrice || 0)}/person</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {venue.tags.slice(0, 5).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-secondary rounded-full text-[10px] text-muted-foreground capitalize">
                {tag}
              </span>
            ))}
          </div>

          {/* Real-time search action buttons */}
          <div className="pt-1.5 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
              Live info & reviews
            </p>
            <div className="flex flex-wrap gap-1.5">
              <QuickLink href={mapsUrl} icon={Map} label="Google Maps" variant="maps" />
              <QuickLink href={directionsUrl} icon={Route} label="Directions" variant="maps" />
              <QuickLink href={googleUrl} icon={Search} label="Search Google" />
              <QuickLink href={yelpUrl} icon={Star} label="Yelp" />
              <QuickLink href={tripAdvisorUrl} icon={Globe} label="TripAdvisor" />
              {openTableUrl && (
                <QuickLink href={openTableUrl} icon={Utensils} label="OpenTable" variant="primary" />
              )}
            </div>
          </div>

          {/* Neighborhood + App Link */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              {venue.neighborhood}
            </span>
            <Link
              href={`/destinations/${venue.destinationId}`}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
            >
              View destination <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function ItineraryItemCard({ item, editable, onRemove, destinationId }: {
  item: ItineraryItem
  editable?: boolean
  onRemove?: () => void
  destinationId?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const icon = categoryIcons[item.category as keyof typeof categoryIcons] || '📍'
  const venue = item.venueId ? getVenueById(item.venueId) : undefined
  const locationName = destinationId ? getLocationName(destinationId) : ''

  // Google Maps link for the venue name (works even without full venue data)
  const quickMapsUrl = venue
    ? getGoogleMapsUrl(venue.name, venue.address)
    : getGoogleSearchUrl(item.title, locationName)

  return (
    <div className={`relative pl-4 border-l-2 ${timeBlockColors[item.timeBlock]} py-3 group`}>
      <div className="flex items-start gap-3">
        {editable && (
          <button className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Icon with venue image if available */}
        {venue ? (
          <a
            href={quickMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 relative shadow-sm hover:shadow-md transition-shadow ring-1 ring-black/5"
          >
            <div
              className="absolute inset-0 bg-cover bg-center hover:scale-110 transition-transform duration-300"
              style={{ backgroundImage: `url(${venue.imageUrl})` }}
            />
          </a>
        ) : (
          <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center text-lg flex-shrink-0">
            {icon}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <a
                  href={quickMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sm truncate hover:text-primary transition-colors"
                >
                  {item.title}
                </a>
                {/* Quick Google Maps icon always visible */}
                <a
                  href={quickMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-muted-foreground hover:text-emerald-600 transition-colors"
                  title="Open in Google Maps"
                >
                  <Map className="w-3.5 h-3.5" />
                </a>
                {venue && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-0.5 text-xs text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                  >
                    {expanded ? 'Less' : 'Details'}
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2.5 mt-0.5 text-xs text-muted-foreground">
                <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${timeBlockBg[item.timeBlock]} font-medium`}>
                  {timeBlockIcons[item.timeBlock]} {item.startTime} - {item.endTime}
                </span>
                {item.travelTime && item.travelTime !== '—' && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" />
                    {item.travelTime}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <span className="text-sm font-semibold">{formatCurrency(item.costEstimate)}</span>
              {editable && (
                <button
                  onClick={onRemove}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              )}
            </div>
          </div>

          {/* Brief info line */}
          <div className="flex items-center gap-3 mt-1.5">
            {venue && (
              <a
                href={getGoogleMapsUrl(venue.name, venue.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
              >
                <MapPin className="w-3 h-3" /> {venue.neighborhood}
              </a>
            )}
            {venue && (
              <a
                href={getYelpSearchUrl(venue.name, locationName)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-amber-600 flex items-center gap-0.5 transition-colors"
                title="See reviews on Yelp"
              >
                <Star className="w-3 h-3 text-amber-500" /> {venue.rating}
              </a>
            )}
            {venue && (
              <span className="text-xs text-muted-foreground">
                {venue.priceLevel}
              </span>
            )}
            {item.reservationNeeded && (
              <Badge variant="warning" className="text-[10px] flex items-center gap-0.5">
                <AlertCircle className="w-2.5 h-2.5" />
                Reservation
              </Badge>
            )}
          </div>

          {/* Short description when collapsed */}
          {!expanded && item.notes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.notes}</p>
          )}

          {/* Expanded venue detail card */}
          {expanded && venue && <VenueDetailCard venue={venue} />}
        </div>
      </div>
    </div>
  )
}

export function ItineraryTimeline({ days, editable = false, destinationId, onRemoveItem }: ItineraryTimelineProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set(days.map((_, i) => i)))

  const toggleDay = (idx: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {days.map((day, dayIdx) => (
        <div key={day.dayNumber} className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <button
            onClick={() => toggleDay(dayIdx)}
            className="w-full p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b flex items-center justify-between hover:from-indigo-100/60 hover:to-purple-100/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Day {day.dayNumber}</h3>
                <p className="text-sm text-muted-foreground">{day.theme}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold">{formatCurrency(day.totalCost)}</p>
                <p className="text-xs text-muted-foreground">{day.items.length} activities</p>
              </div>
              {expandedDays.has(dayIdx) ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {expandedDays.has(dayIdx) && (
            <div className="p-4 space-y-1">
              {day.items.map(item => (
                <ItineraryItemCard
                  key={item.id}
                  item={item}
                  editable={editable}
                  destinationId={destinationId}
                  onRemove={() => onRemoveItem?.(dayIdx, item.id)}
                />
              ))}
              {day.items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <p>No activities planned yet</p>
                  <p className="text-xs mt-1">Add activities from the destination page</p>
                </div>
              )}

              {/* Day summary footer */}
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  {Array.from(new Set(day.items.map(i => i.category))).map(cat => (
                    <span key={cat} className="flex items-center gap-0.5">
                      {categoryIcons[cat as VenueCategory] || '📍'}
                      <span className="capitalize">{cat === 'live-music' ? 'Live Music' : cat}</span>
                    </span>
                  ))}
                </div>
                <span className="font-medium text-foreground">
                  Day total: {formatCurrency(day.totalCost)}
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

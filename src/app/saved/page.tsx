'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Calendar, MapPin, Users, DollarSign, Trash2, Clock, ArrowRight, Sparkles, Star, CalendarCheck, Hotel, UtensilsCrossed, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { destinations } from '@/data/destinations'
import { getVenuesByDestination } from '@/data/venues'
import { formatCurrency } from '@/lib/utils'
import { useApp } from '@/lib/store'
import { tripTypeLabels, vibeEmojis, Vibe, categoryIcons, StayBooking, VenueReservation } from '@/types'

export default function SavedTripsPage() {
  const app = useApp()
  const [activeTab, setActiveTab] = useState<'trips' | 'bookings' | 'favorites' | 'recent'>('trips')

  const favoriteDests = destinations.filter(d => app.isFavoriteDestination(d.id))
  const allVenues = destinations.flatMap(d => getVenuesByDestination(d.id))
  const favoriteVenuesList = allVenues.filter(v => app.isFavoriteVenue(v.id))

  const activeBookings = app.stayBookings.filter(b => b.status === 'confirmed')
  const activeReservations = app.venueReservations.filter(r => r.status === 'confirmed')
  const totalBookings = activeBookings.length + activeReservations.length

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const displayDate = (dateStr: string) => {
    try {
      return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      })
    } catch { return dateStr }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Your Trips</h1>
          <p className="text-muted-foreground mt-1">
            {app.savedTrips.length} saved trips · {totalBookings} bookings · {favoriteDests.length} favorites
          </p>
        </div>
        <Link href="/planner">
          <Button variant="gradient">
            <Sparkles className="w-4 h-4 mr-2" /> New Trip
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b pb-1 overflow-x-auto">
        {([
          { key: 'trips', label: `Saved Trips (${app.savedTrips.length})` },
          { key: 'bookings', label: `Bookings (${totalBookings})` },
          { key: 'favorites', label: `Favorites (${favoriteDests.length + favoriteVenuesList.length})` },
          { key: 'recent', label: 'Recent' },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Saved Trips */}
      {activeTab === 'trips' && (
        <div className="space-y-4 animate-fade-in">
          {app.savedTrips.map(trip => {
            const dest = destinations.find(d => d.id === trip.destinationId)
            return (
              <div key={trip.id} className="rounded-xl border bg-card hover:shadow-md transition-all overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-48 h-32 sm:h-auto bg-cover bg-center flex-shrink-0"
                    style={{ backgroundImage: `url(${dest?.heroImage})` }} />
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{trip.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" /> {dest?.name}
                        </p>
                      </div>
                      <Badge variant="purple">{tripTypeLabels[trip.tripType]}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {trip.vibes.map(v => (
                        <Badge key={v} variant="secondary" className="text-[10px]">
                          {vibeEmojis[v as Vibe]} {v}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {trip.days} days</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {trip.groupSize} people</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {formatCurrency(trip.budget.total)} total</span>
                      <span className="flex items-center gap-1 font-medium text-foreground">{formatCurrency(trip.budget.perPerson)}/person</span>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Updated {formatDate(trip.updatedAt)}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm"
                          className="text-destructive hover:text-destructive hover:bg-red-50 h-8"
                          onClick={() => {
                            app.deleteTrip(trip.id)
                            app.notify(`Deleted "${trip.name}"`, 'info')
                            app.addActivity(`Deleted trip "${trip.name}"`, '🗑️')
                          }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Link href={`/planner?destination=${trip.destinationId}`}>
                          <Button variant="outline" size="sm" className="h-8">
                            View Trip <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {app.savedTrips.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🗺️</div>
              <h3 className="text-lg font-semibold mb-2">No saved trips yet</h3>
              <p className="text-muted-foreground mb-6">Start planning your next adventure!</p>
              <Link href="/planner">
                <Button variant="gradient">Plan Your First Trip</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Bookings */}
      {activeTab === 'bookings' && (
        <div className="animate-fade-in space-y-8">
          {/* Stay Bookings */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Hotel className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Stay Bookings ({app.stayBookings.length})</h2>
            </div>
            {app.stayBookings.length > 0 ? (
              <div className="space-y-4">
                {app.stayBookings.map(booking => (
                  <div key={booking.id} className={`rounded-xl border overflow-hidden transition-all ${booking.status === 'cancelled' ? 'opacity-60' : 'hover:shadow-md'}`}>
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-40 h-28 sm:h-auto bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${booking.imageUrl})` }} />
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              {booking.status === 'confirmed'
                                ? <CheckCircle className="w-4 h-4 text-green-500" />
                                : <AlertCircle className="w-4 h-4 text-gray-400" />
                              }
                              <h3 className="font-semibold">{booking.stayName}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {booking.location} · {booking.destinationName}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <Badge className={booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                              {booking.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">{booking.confirmationCode}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarCheck className="w-3.5 h-3.5" />
                            {displayDate(booking.checkIn)} → {displayDate(booking.checkOut)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> {booking.guests} guest{booking.guests !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <DollarSign className="w-3.5 h-3.5" /> {formatCurrency(booking.totalPrice)} · {booking.nights} night{booking.nights !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {booking.status === 'confirmed' && (
                          <div className="flex justify-end mt-3 pt-3 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-red-50 h-8 text-xs"
                              onClick={() => {
                                app.cancelStayBooking(booking.id)
                                app.notify('Booking cancelled', 'info')
                              }}
                            >
                              <X className="w-3.5 h-3.5 mr-1" /> Cancel Booking
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl">
                <div className="text-4xl mb-3">🏨</div>
                <h3 className="font-semibold mb-1">No stay bookings yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Browse destinations and book a stay!</p>
                <Link href="/explore">
                  <Button variant="gradient" size="sm">Explore Stays</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Venue Reservations */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Venue Reservations ({app.venueReservations.length})</h2>
            </div>
            {app.venueReservations.length > 0 ? (
              <div className="space-y-4">
                {app.venueReservations.map(res => (
                  <div key={res.id} className={`rounded-xl border overflow-hidden transition-all ${res.status === 'cancelled' ? 'opacity-60' : 'hover:shadow-md'}`}>
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-40 h-28 sm:h-auto bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${res.imageUrl})` }} />
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              {res.status === 'confirmed'
                                ? <CheckCircle className="w-4 h-4 text-green-500" />
                                : <AlertCircle className="w-4 h-4 text-gray-400" />
                              }
                              <h3 className="font-semibold">{res.venueName}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {res.destinationName}
                              <span className="ml-1">{categoryIcons[res.venueCategory]} {res.venueCategory}</span>
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <Badge className={res.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                              {res.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">{res.confirmationCode}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarCheck className="w-3.5 h-3.5" />
                            {displayDate(res.date)} at {res.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> {res.partySize} guest{res.partySize !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {res.specialRequests && (
                          <p className="text-xs text-muted-foreground mt-2 italic">"{res.specialRequests}"</p>
                        )}
                        {res.status === 'confirmed' && (
                          <div className="flex justify-end mt-3 pt-3 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-red-50 h-8 text-xs"
                              onClick={() => {
                                app.cancelVenueReservation(res.id)
                                app.notify('Reservation cancelled', 'info')
                              }}
                            >
                              <X className="w-3.5 h-3.5 mr-1" /> Cancel Reservation
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl">
                <div className="text-4xl mb-3">🍽️</div>
                <h3 className="font-semibold mb-1">No venue reservations yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Find restaurants and venues to reserve!</p>
                <Link href="/explore">
                  <Button variant="gradient" size="sm">Explore Venues</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Favorites */}
      {activeTab === 'favorites' && (
        <div className="animate-fade-in">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Favorite Destinations ({favoriteDests.length})</h2>
            {favoriteDests.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteDests.map(d => (
                  <Link key={d.id} href={`/destinations/${d.id}`} className="group">
                    <div className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-md transition-all">
                      <div className="w-14 h-14 rounded-lg bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${d.heroImage})` }} />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{d.name}</h4>
                        <p className="text-xs text-muted-foreground">{formatCurrency(d.avgDailyBudget)}/day · {d.tags.slice(0, 2).join(', ')}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          app.toggleFavoriteDestination(d.id)
                          app.notify(`Removed ${d.name} from favorites`, 'info')
                        }}
                        className="p-1 flex-shrink-0"
                      >
                        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No favorite destinations yet. Explore and save some!</p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Favorite Venues ({favoriteVenuesList.length})</h2>
            {favoriteVenuesList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {favoriteVenuesList.map(venue => (
                  <div key={venue.id} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 text-lg">
                      {categoryIcons[venue.category] || '📍'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{venue.name}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {venue.rating}
                        {venue.avgPrice && <> · {formatCurrency(venue.avgPrice)}</>}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        app.toggleFavoriteVenue(venue.id)
                        app.notify(`Removed ${venue.name} from favorites`, 'info')
                      }}
                      className="p-1 flex-shrink-0"
                    >
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No favorite venues yet. Browse destinations to find some!</p>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {activeTab === 'recent' && (
        <div className="animate-fade-in">
          {app.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {app.recentActivity.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
              <p className="text-muted-foreground">Start exploring destinations to see your activity here!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

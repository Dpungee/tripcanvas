'use client'

import { useState } from 'react'
import { X, Calendar, Users, Star, MapPin, CheckCircle, ChevronLeft, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Venue, VenueReservation, categoryIcons, categoryLabels } from '@/types'
import { useApp } from '@/lib/store'
import { getDestinationById } from '@/data/destinations'

interface ReservationModalProps {
  venue: Venue
  onClose: () => void
}

function generateConfirmationCode(): string {
  return 'TC' + Math.random().toString(36).toUpperCase().slice(2, 8)
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function displayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

const timeSlots = [
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM',
  '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM',
]

export function ReservationModal({ venue, onClose }: ReservationModalProps) {
  const app = useApp()
  const dest = getDestinationById(venue.destinationId)
  const today = new Date()

  const [step, setStep] = useState<'details' | 'confirmed'>('details')
  const [date, setDate] = useState(formatDate(addDays(today, 3)))
  const [time, setTime] = useState('7:00 PM')
  const [partySize, setPartySize] = useState(2)
  const [specialRequests, setSpecialRequests] = useState('')
  const [confirmationCode, setConfirmationCode] = useState('')

  const icon = categoryIcons[venue.category] || '📍'
  const label = categoryLabels[venue.category] || venue.category

  const handleConfirm = () => {
    const code = generateConfirmationCode()
    setConfirmationCode(code)
    const reservation: VenueReservation = {
      id: `res-${Date.now()}`,
      confirmationCode: code,
      venueId: venue.id,
      venueName: venue.name,
      venueCategory: venue.category,
      destinationId: venue.destinationId,
      destinationName: dest?.name || venue.destinationId,
      imageUrl: venue.imageUrl,
      date,
      time,
      partySize,
      specialRequests,
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
    }
    app.addVenueReservation(reservation)
    app.notify(`Reservation confirmed at ${venue.name}!`, 'success')
    setStep('confirmed')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            {step === 'confirmed' && (
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {step === 'details' ? 'Make a Reservation' : 'Reservation Confirmed!'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Venue summary */}
        <div className="p-5 border-b">
          <div className="flex gap-3">
            <div
              className="w-20 h-20 rounded-xl bg-cover bg-center flex-shrink-0"
              style={{ backgroundImage: `url(${venue.imageUrl})` }}
            />
            <div className="flex-1 min-w-0">
              <Badge className="mb-1 text-[10px]">{icon} {label}</Badge>
              <h3 className="font-semibold text-sm leading-tight">{venue.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {venue.neighborhood}
                {dest && <span>· {dest.name}</span>}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{venue.rating}</span>
                </div>
                <span className="text-xs text-muted-foreground">{venue.priceLevel}</span>
                {venue.hours && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Clock className="w-3 h-3" /> {venue.hours}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step: Details */}
        {step === 'details' && (
          <div className="p-5 space-y-5">
            {/* Date */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={date}
                  min={formatDate(addDays(today, 1))}
                  onChange={e => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Time</label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setTime(slot)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                      time === slot
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-200 hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Party size */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Party Size</label>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
                  <button
                    onClick={() => setPartySize(p => Math.max(1, p - 1))}
                    className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-sm transition-colors"
                  >−</button>
                  <span className="w-8 text-center font-medium text-sm">{partySize}</span>
                  <button
                    onClick={() => setPartySize(p => Math.min(20, p + 1))}
                    className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-sm transition-colors"
                  >+</button>
                </div>
                <span className="text-sm text-muted-foreground">guests</span>
              </div>
            </div>

            {/* Special requests */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Special Requests <span className="normal-case font-normal">(optional)</span>
              </label>
              <textarea
                value={specialRequests}
                onChange={e => setSpecialRequests(e.target.value)}
                placeholder="Allergies, accessibility needs, special occasions..."
                rows={3}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              This is a demo reservation. No real booking will be made.
            </p>

            <Button onClick={handleConfirm} className="w-full" variant="gradient" size="lg">
              Confirm Reservation
            </Button>
          </div>
        )}

        {/* Step: Confirmed */}
        {step === 'confirmed' && (
          <div className="p-5 text-center space-y-5">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-700">You're reserved!</h3>
                <p className="text-muted-foreground text-sm mt-1">Your table is waiting for you</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 text-left space-y-3 border border-indigo-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Confirmation</p>
                  <p className="text-2xl font-bold tracking-widest text-primary">{confirmationCode}</p>
                </div>
                <div
                  className="w-14 h-14 rounded-xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${venue.imageUrl})` }}
                />
              </div>
              <div className="pt-2 border-t border-indigo-100 space-y-2">
                <p className="font-semibold text-sm">{venue.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {venue.neighborhood} · {venue.address}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Date</p>
                    <p className="font-semibold text-xs mt-0.5">{displayDate(date)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Time</p>
                    <p className="font-semibold text-xs mt-0.5">{time}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Guests</p>
                    <p className="font-semibold text-xs mt-0.5">{partySize} people</p>
                  </div>
                </div>
                {specialRequests && (
                  <p className="text-xs text-muted-foreground pt-1">Note: {specialRequests}</p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              View your reservation in <strong>Saved → Bookings</strong>
            </p>

            <Button onClick={onClose} className="w-full" variant="gradient">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { X, Calendar, Users, Star, MapPin, CheckCircle, CreditCard, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Stay, StayBooking } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { useApp } from '@/lib/store'
import { getDestinationById } from '@/data/destinations'

interface BookingModalProps {
  stay: Stay
  onClose: () => void
}

function generateConfirmationCode(): string {
  return 'TC' + Math.random().toString(36).toUpperCase().slice(2, 8)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function displayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn).getTime()
  const b = new Date(checkOut).getTime()
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)))
}

export function BookingModal({ stay, onClose }: BookingModalProps) {
  const app = useApp()
  const dest = getDestinationById(stay.destinationId)

  const today = new Date()
  const defaultCheckIn = formatDate(addDays(today, 7))
  const defaultCheckOut = formatDate(addDays(today, 10))

  const [step, setStep] = useState<'details' | 'payment' | 'confirmed'>('details')
  const [checkIn, setCheckIn] = useState(defaultCheckIn)
  const [checkOut, setCheckOut] = useState(defaultCheckOut)
  const [guests, setGuests] = useState(Math.min(2, stay.maxGuests))
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [confirmationCode, setConfirmationCode] = useState('')

  const nights = nightsBetween(checkIn, checkOut)
  const subtotal = stay.nightlyPrice * nights
  const taxes = Math.round(subtotal * 0.14)
  const fees = Math.round(subtotal * 0.06)
  const total = subtotal + taxes + fees

  const handleConfirmDetails = () => {
    if (!checkIn || !checkOut || nights < 1) return
    setStep('payment')
  }

  const handleConfirmPayment = () => {
    const code = generateConfirmationCode()
    setConfirmationCode(code)
    const booking: StayBooking = {
      id: `booking-${Date.now()}`,
      confirmationCode: code,
      stayId: stay.id,
      stayName: stay.name,
      stayType: stay.type,
      destinationId: stay.destinationId,
      destinationName: dest?.name || stay.destinationId,
      imageUrl: stay.imageUrl,
      location: stay.location,
      checkIn,
      checkOut,
      guests,
      nights,
      nightlyPrice: stay.nightlyPrice,
      totalPrice: total,
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
    }
    app.addStayBooking(booking)
    app.notify(`Booking confirmed! Code: ${code}`, 'success')
    setStep('confirmed')
  }

  const typeLabels: Record<string, string> = {
    hotel: 'Hotel', resort: 'Resort', airbnb: 'Rental', villa: 'Villa', cabin: 'Cabin', penthouse: 'Penthouse',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            {step === 'payment' && (
              <button onClick={() => setStep('details')} className="p-1 rounded-lg hover:bg-gray-100">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {step === 'details' && 'Book Your Stay'}
              {step === 'payment' && 'Payment Details'}
              {step === 'confirmed' && 'Booking Confirmed!'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stay summary card */}
        <div className="p-5 border-b">
          <div className="flex gap-3">
            <div
              className="w-20 h-20 rounded-xl bg-cover bg-center flex-shrink-0"
              style={{ backgroundImage: `url(${stay.imageUrl})` }}
            />
            <div className="flex-1 min-w-0">
              <Badge className="mb-1 text-[10px]">{typeLabels[stay.type] || stay.type}</Badge>
              <h3 className="font-semibold text-sm leading-tight">{stay.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {stay.location}
                {dest && <span>· {dest.name}</span>}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{stay.rating}</span>
                <span className="text-xs text-muted-foreground">· Up to {stay.maxGuests} guests</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step: Details */}
        {step === 'details' && (
          <div className="p-5 space-y-5">
            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Check-in</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={checkIn}
                    min={formatDate(addDays(today, 1))}
                    onChange={e => {
                      setCheckIn(e.target.value)
                      if (e.target.value >= checkOut) {
                        setCheckOut(formatDate(addDays(new Date(e.target.value), 1)))
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Check-out</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={checkOut}
                    min={formatDate(addDays(new Date(checkIn), 1))}
                    onChange={e => setCheckOut(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            {/* Guests */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Guests</label>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
                  <button
                    onClick={() => setGuests(g => Math.max(1, g - 1))}
                    className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-sm transition-colors"
                  >−</button>
                  <span className="w-8 text-center font-medium text-sm">{guests}</span>
                  <button
                    onClick={() => setGuests(g => Math.min(stay.maxGuests, g + 1))}
                    className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-sm transition-colors"
                  >+</button>
                </div>
                <span className="text-sm text-muted-foreground">Max {stay.maxGuests}</span>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{formatCurrency(stay.nightlyPrice)} × {nights} night{nights !== 1 ? 's' : ''}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxes (14%)</span>
                <span>{formatCurrency(taxes)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service fees</span>
                <span>{formatCurrency(fees)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t text-base">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <Button onClick={handleConfirmDetails} className="w-full" variant="gradient" size="lg">
              Continue to Payment
            </Button>
          </div>
        )}

        {/* Step: Payment */}
        {step === 'payment' && (
          <div className="p-5 space-y-5">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={cardNumber}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 16)
                      setCardNumber(v.replace(/(\d{4})/g, '$1 ').trim())
                    }}
                    className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setCardExpiry(v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v)
                    }}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    maxLength={4}
                    value={cardCvc}
                    onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{displayDate(checkIn)} → {displayDate(checkOut)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base">
                <span>Total due</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              This is a demo booking. No real payment will be charged.
            </p>

            <Button
              onClick={handleConfirmPayment}
              className="w-full"
              variant="gradient"
              size="lg"
              disabled={!cardNumber || !cardName || !cardExpiry || !cardCvc}
            >
              Confirm Booking · {formatCurrency(total)}
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
                <h3 className="text-xl font-bold text-green-700">You're booked!</h3>
                <p className="text-muted-foreground text-sm mt-1">Your stay has been confirmed</p>
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
                  style={{ backgroundImage: `url(${stay.imageUrl})` }}
                />
              </div>
              <div className="pt-2 border-t border-indigo-100 space-y-1.5">
                <p className="font-semibold text-sm">{stay.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {stay.location}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Check-in</p>
                    <p className="font-semibold text-xs mt-0.5">{displayDate(checkIn)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Check-out</p>
                    <p className="font-semibold text-xs mt-0.5">{displayDate(checkOut)}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>{nights} night{nights !== 1 ? 's' : ''} · {guests} guest{guests !== 1 ? 's' : ''}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              View your booking in <strong>Saved → Bookings</strong>
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

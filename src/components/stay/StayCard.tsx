'use client'

import { Star, Users, MapPin, Bookmark } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Stay } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'

interface StayCardProps {
  stay: Stay
  nights?: number
}

export function StayCard({ stay, nights = 3 }: StayCardProps) {
  const [saved, setSaved] = useState(false)
  const totalCost = stay.nightlyPrice * nights

  const typeLabels: Record<string, string> = {
    hotel: 'Hotel',
    resort: 'Resort',
    airbnb: 'Rental',
    villa: 'Villa',
    cabin: 'Cabin',
    penthouse: 'Penthouse',
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative aspect-[16/10] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${stay.imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <button
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
          onClick={() => setSaved(!saved)}
        >
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-primary text-primary' : 'text-gray-600'}`} />
        </button>
        <Badge className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-foreground border-0 text-[11px]">
          {typeLabels[stay.type] || stay.type}
        </Badge>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold group-hover:text-primary transition-colors">{stay.name}</h3>
          <div className="flex items-center gap-0.5 text-sm flex-shrink-0 ml-2">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{stay.rating}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {stay.location}
        </p>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{stay.description}</p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {stay.amenities.slice(0, 4).map(a => (
            <Badge key={a} variant="outline" className="text-[10px]">{a}</Badge>
          ))}
          {stay.amenities.length > 4 && (
            <Badge variant="outline" className="text-[10px]">+{stay.amenities.length - 4}</Badge>
          )}
        </div>

        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <div>
            <span className="text-lg font-bold">{formatCurrency(stay.nightlyPrice)}</span>
            <span className="text-sm text-muted-foreground"> / night</span>
            <p className="text-xs text-muted-foreground">{formatCurrency(totalCost)} total · {nights} nights</p>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>Up to {stay.maxGuests}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

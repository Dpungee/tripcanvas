'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { MapPin, Menu, X, Compass, Heart, Users, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/store'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const app = useApp()
  const savedCount = app.savedTrips.length
  const favCount = app.favoriteDestinations.length

  useEffect(() => { setMounted(true) }, [])

  const totalCount = mounted ? savedCount + favCount : 0

  return (
    <nav className="sticky top-0 z-50 glass border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">TripCanvas</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/explore" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              Explore
            </Link>
            <Link href="/planner" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Plan Trip
            </Link>
            <Link href="/group" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              Group Plan
            </Link>
            <Link href="/saved" className="relative px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5">
              <Heart className="w-4 h-4" />
              Saved
              {totalCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {totalCount}
                </span>
              )}
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm">Sign In</Button>
            <Button variant="gradient" size="sm">Get Started</Button>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-white animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            <Link href="/explore" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors">Explore Destinations</Link>
            <Link href="/planner" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors">Plan a Trip</Link>
            <Link href="/group" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors">Group Planning</Link>
            <Link href="/saved" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors">
              Saved Trips {totalCount > 0 && `(${totalCount})`}
            </Link>
            <div className="pt-3 border-t flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">Sign In</Button>
              <Button variant="gradient" size="sm" className="flex-1">Get Started</Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

import { Compass } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">TripCanvas</span>
            </div>
            <p className="text-sm leading-relaxed">Plan unforgettable trips with friends. Discover destinations, build itineraries, and split costs — all in one place.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Explore</h4>
            <div className="space-y-2 text-sm">
              <Link href="/explore" className="block hover:text-white transition-colors">Destinations</Link>
              <Link href="/explore" className="block hover:text-white transition-colors">States</Link>
              <Link href="/planner" className="block hover:text-white transition-colors">Trip Planner</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Trip Types</h4>
            <div className="space-y-2 text-sm">
              <span className="block">Bachelor Parties</span>
              <span className="block">Bachelorette Trips</span>
              <span className="block">Girls Trips</span>
              <span className="block">Weekend Getaways</span>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Company</h4>
            <div className="space-y-2 text-sm">
              <span className="block">About</span>
              <span className="block">Blog</span>
              <span className="block">Careers</span>
              <span className="block">Contact</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-10 pt-8 text-center text-sm">
          <p>2026 TripCanvas. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

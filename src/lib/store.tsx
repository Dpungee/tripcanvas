'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import {
  SavedTrip, Itinerary, BudgetBreakdown, GroupTrip, Traveler, Vote,
  GroupNote, BudgetSplit, TripType, Vibe, BudgetTier, Destination, Venue, Stay,
  StayBooking, VenueReservation,
} from '@/types'
import { destinations } from '@/data/destinations'

// ─── Custom (manually built) trip ───
export interface CustomTripPickedItem {
  id: string
  venueId: string
  dayNumber: number
  timeBlock: 'morning' | 'afternoon' | 'evening' | 'late-night'
  notes?: string
}

export interface CustomTripFull {
  id: string
  name: string
  destinationId: string
  startDate: string
  groupSize: number
  numDays: number
  items: CustomTripPickedItem[]
  createdAt: string
  updatedAt: string
}

// ─── Saved trip with full data ───
export interface SavedTripFull {
  id: string
  name: string
  destinationId: string
  tripType: TripType
  vibes: Vibe[]
  budgetTier: BudgetTier
  days: number
  groupSize: number
  itinerary: Itinerary
  budget: BudgetBreakdown
  createdAt: string
  updatedAt: string
}

// ─── Group trip with full data ───
export interface GroupTripFull {
  id: string
  name: string
  destinationId: string | null
  travelers: Traveler[]
  votes: Record<string, Record<string, 'up' | 'down'>> // destId -> { travelerId -> vote }
  notes: { id: string; travelerId: string; content: string; createdAt: string }[]
  budgetTotal: number
  createdAt: string
}

// ─── Notification ───
export interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

// ─── Store shape ───
interface AppState {
  // Favorites
  favoriteDestinations: string[]
  favoriteVenues: string[]
  favoriteStays: string[]
  toggleFavoriteDestination: (id: string) => void
  toggleFavoriteVenue: (id: string) => void
  toggleFavoriteStay: (id: string) => void
  isFavoriteDestination: (id: string) => boolean
  isFavoriteVenue: (id: string) => boolean
  isFavoriteStay: (id: string) => boolean

  // Saved trips
  savedTrips: SavedTripFull[]
  saveTrip: (trip: SavedTripFull) => void
  deleteTrip: (id: string) => void
  updateTripName: (id: string, name: string) => void

  // Custom trips
  customTrips: CustomTripFull[]
  saveCustomTrip: (trip: CustomTripFull) => void
  deleteCustomTrip: (id: string) => void
  updateCustomTrip: (trip: CustomTripFull) => void

  // Group trips
  groupTrips: GroupTripFull[]
  activeGroupTrip: GroupTripFull | null
  createGroupTrip: (name: string) => string
  setActiveGroupTrip: (id: string) => void
  addTraveler: (name: string) => void
  removeTraveler: (id: string) => void
  castVote: (destId: string, travelerId: string, value: 'up' | 'down') => void
  addGroupNote: (travelerId: string, content: string) => void
  setGroupDestination: (destId: string) => void

  // Bookings
  stayBookings: StayBooking[]
  venueReservations: VenueReservation[]
  addStayBooking: (booking: StayBooking) => void
  cancelStayBooking: (id: string) => void
  addVenueReservation: (res: VenueReservation) => void
  cancelVenueReservation: (id: string) => void

  // Recent activity
  recentActivity: { action: string; timestamp: string; icon: string }[]
  addActivity: (action: string, icon: string) => void

  // Notifications
  notifications: Notification[]
  notify: (message: string, type?: 'success' | 'error' | 'info') => void
  dismissNotification: (id: string) => void
}

const AppContext = createContext<AppState | null>(null)

// ─── Helper to load from localStorage safely ───
function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const data = window.localStorage.getItem(`tripcanvas_${key}`)
    return data ? JSON.parse(data) : fallback
  } catch {
    return fallback
  }
}
function saveToStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(`tripcanvas_${key}`, JSON.stringify(value))
  } catch { /* quota exceeded, silently fail */ }
}

// ─── Default sample data ───
const defaultSavedTrips: SavedTripFull[] = [
  {
    id: 'saved-demo-1',
    name: 'Miami Bachelorette Bash',
    destinationId: 'miami',
    tripType: 'bachelorette-party',
    vibes: ['party', 'luxury'],
    budgetTier: 'luxury',
    days: 4,
    groupSize: 8,
    itinerary: { id: 'itin-demo-1', destinationId: 'miami', tripType: 'bachelorette-party', vibes: ['party', 'luxury'], budgetTier: 'luxury', groupSize: 8, days: [], totalCost: 9600, perPersonCost: 1200 },
    budget: { lodging: 4800, food: 1600, drinks: 1200, activities: 1000, transportation: 600, misc: 400, total: 9600, perPerson: 1200 },
    createdAt: '2026-03-08T10:00:00Z',
    updatedAt: '2026-03-09T14:30:00Z',
  },
  {
    id: 'saved-demo-2',
    name: 'Nashville Weekend',
    destinationId: 'nashville',
    tripType: 'girls-trip',
    vibes: ['party', 'foodie'],
    budgetTier: 'mid',
    days: 3,
    groupSize: 6,
    itinerary: { id: 'itin-demo-2', destinationId: 'nashville', tripType: 'girls-trip', vibes: ['party', 'foodie'], budgetTier: 'mid', groupSize: 6, days: [], totalCost: 5400, perPersonCost: 900 },
    budget: { lodging: 2400, food: 1200, drinks: 800, activities: 540, transportation: 270, misc: 190, total: 5400, perPerson: 900 },
    createdAt: '2026-03-05T09:00:00Z',
    updatedAt: '2026-03-06T16:00:00Z',
  },
]

const defaultGroupTrip: GroupTripFull = {
  id: 'group-demo-1',
  name: 'Spring Break 2026',
  destinationId: null,
  travelers: [
    { id: 'me', name: 'You (Host)', avatar: '👑', vibePreferences: ['party', 'foodie'], budgetPreference: 'mid' },
    { id: 't2', name: 'Sarah', avatar: '💃', vibePreferences: ['party', 'wellness'], budgetPreference: 'luxury' },
    { id: 't3', name: 'Mike', avatar: '🎸', vibePreferences: ['adventure', 'foodie'], budgetPreference: 'mid' },
    { id: 't4', name: 'Jess', avatar: '🌺', vibePreferences: ['chill', 'romantic'], budgetPreference: 'mid' },
  ],
  votes: {
    'miami': { 'me': 'up', 't2': 'up', 't3': 'up' },
    'nashville': { 'me': 'up', 't4': 'up' },
    'las-vegas': { 't2': 'up', 't3': 'up', 't4': 'down' },
    'scottsdale': { 't4': 'up' },
  },
  notes: [
    { id: 'n1', travelerId: 'me', content: 'I think Miami would be perfect! South Beach is amazing.', createdAt: '2 hours ago' },
    { id: 'n2', travelerId: 't2', content: 'Nashville could be fun too — the honky tonks are so much fun for groups!', createdAt: '1 hour ago' },
    { id: 'n3', travelerId: 't3', content: "I'm down for wherever but would love some good food options.", createdAt: '30 min ago' },
  ],
  budgetTotal: 4800,
  createdAt: '2026-03-10T08:00:00Z',
}

const defaultActivity = [
  { action: 'Created "Miami Bachelorette Bash"', timestamp: '2 days ago', icon: '✨' },
  { action: 'Generated Nashville itinerary', timestamp: '5 days ago', icon: '📋' },
  { action: 'Added LIV Nightclub to favorites', timestamp: '1 week ago', icon: '❤️' },
]

// ─── Provider ───
export function AppProvider({ children }: { children: ReactNode }) {
  const [favoriteDestinations, setFavDests] = useState<string[]>([])
  const [favoriteVenues, setFavVenues] = useState<string[]>([])
  const [favoriteStays, setFavStays] = useState<string[]>([])
  const [savedTrips, setSavedTrips] = useState<SavedTripFull[]>([])
  const [customTrips, setCustomTrips] = useState<CustomTripFull[]>([])
  const [groupTrips, setGroupTrips] = useState<GroupTripFull[]>([])
  const [activeGroupTripId, setActiveGroupTripId] = useState<string | null>(null)
  const [stayBookings, setStayBookings] = useState<StayBooking[]>([])
  const [venueReservations, setVenueReservations] = useState<VenueReservation[]>([])
  const [recentActivity, setRecentActivity] = useState<{ action: string; timestamp: string; icon: string }[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setFavDests(loadFromStorage('favDests', ['miami', 'nashville', 'las-vegas', 'scottsdale', 'sedona']))
    setFavVenues(loadFromStorage('favVenues', ['v-miami-4', 'v-nash-1', 'v-miami-1', 'v-nash-8', 'v-sed-2']))
    setFavStays(loadFromStorage('favStays', []))
    setSavedTrips(loadFromStorage('savedTrips', defaultSavedTrips))
    setCustomTrips(loadFromStorage('customTrips', []))
    setGroupTrips(loadFromStorage('groupTrips', [defaultGroupTrip]))
    setActiveGroupTripId(loadFromStorage('activeGroupTrip', 'group-demo-1'))
    setStayBookings(loadFromStorage('stayBookings', []))
    setVenueReservations(loadFromStorage('venueReservations', []))
    setRecentActivity(loadFromStorage('activity', defaultActivity))
    setLoaded(true)
  }, [])

  // Persist on changes
  useEffect(() => { if (loaded) saveToStorage('favDests', favoriteDestinations) }, [favoriteDestinations, loaded])
  useEffect(() => { if (loaded) saveToStorage('favVenues', favoriteVenues) }, [favoriteVenues, loaded])
  useEffect(() => { if (loaded) saveToStorage('favStays', favoriteStays) }, [favoriteStays, loaded])
  useEffect(() => { if (loaded) saveToStorage('savedTrips', savedTrips) }, [savedTrips, loaded])
  useEffect(() => { if (loaded) saveToStorage('customTrips', customTrips) }, [customTrips, loaded])
  useEffect(() => { if (loaded) saveToStorage('groupTrips', groupTrips) }, [groupTrips, loaded])
  useEffect(() => { if (loaded) saveToStorage('activeGroupTrip', activeGroupTripId) }, [activeGroupTripId, loaded])
  useEffect(() => { if (loaded) saveToStorage('stayBookings', stayBookings) }, [stayBookings, loaded])
  useEffect(() => { if (loaded) saveToStorage('venueReservations', venueReservations) }, [venueReservations, loaded])
  useEffect(() => { if (loaded) saveToStorage('activity', recentActivity) }, [recentActivity, loaded])

  // ─── Favorites ───
  const toggleFavoriteDestination = useCallback((id: string) => {
    setFavDests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }, [])
  const toggleFavoriteVenue = useCallback((id: string) => {
    setFavVenues(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }, [])
  const toggleFavoriteStay = useCallback((id: string) => {
    setFavStays(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }, [])

  // ─── Saved trips ───
  const saveTrip = useCallback((trip: SavedTripFull) => {
    setSavedTrips(prev => {
      const exists = prev.findIndex(t => t.id === trip.id)
      if (exists >= 0) {
        const updated = [...prev]
        updated[exists] = { ...trip, updatedAt: new Date().toISOString() }
        return updated
      }
      return [trip, ...prev]
    })
    setRecentActivity(prev => [{ action: `Saved "${trip.name}"`, timestamp: 'Just now', icon: '💾' }, ...prev.slice(0, 19)])
  }, [])

  const deleteTrip = useCallback((id: string) => {
    setSavedTrips(prev => prev.filter(t => t.id !== id))
  }, [])

  const updateTripName = useCallback((id: string, name: string) => {
    setSavedTrips(prev => prev.map(t => t.id === id ? { ...t, name, updatedAt: new Date().toISOString() } : t))
  }, [])

  // ─── Custom trips ───
  const saveCustomTrip = useCallback((trip: CustomTripFull) => {
    setCustomTrips(prev => {
      const exists = prev.findIndex(t => t.id === trip.id)
      if (exists >= 0) {
        const updated = [...prev]
        updated[exists] = { ...trip, updatedAt: new Date().toISOString() }
        return updated
      }
      return [trip, ...prev]
    })
    setRecentActivity(prev => [{ action: `Saved "${trip.name}"`, timestamp: 'Just now', icon: '🗺️' }, ...prev.slice(0, 19)])
  }, [])

  const deleteCustomTrip = useCallback((id: string) => {
    setCustomTrips(prev => prev.filter(t => t.id !== id))
  }, [])

  const updateCustomTrip = useCallback((trip: CustomTripFull) => {
    setCustomTrips(prev => prev.map(t => t.id === trip.id ? { ...trip, updatedAt: new Date().toISOString() } : t))
  }, [])

  // ─── Group trips ───
  const createGroupTrip = useCallback((name: string) => {
    const id = `group-${Date.now()}`
    const trip: GroupTripFull = {
      id, name, destinationId: null,
      travelers: [{ id: 'me', name: 'You (Host)', avatar: '👑', vibePreferences: ['party', 'foodie'], budgetPreference: 'mid' }],
      votes: {}, notes: [], budgetTotal: 0, createdAt: new Date().toISOString(),
    }
    setGroupTrips(prev => [trip, ...prev])
    setActiveGroupTripId(id)
    return id
  }, [])

  const activeGroupTrip = groupTrips.find(g => g.id === activeGroupTripId) || null

  const setActiveGroupTrip = useCallback((id: string) => setActiveGroupTripId(id), [])

  const addTraveler = useCallback((name: string) => {
    if (!activeGroupTripId) return
    const emojis = ['🎉', '🌟', '🔥', '🎪', '🎯', '💫', '🚀', '🌈', '⚡', '🎶']
    const newT: Traveler = {
      id: `t-${Date.now()}`, name,
      avatar: emojis[Math.floor(Math.random() * emojis.length)] || '🎉',
      vibePreferences: ['chill'], budgetPreference: 'mid',
    }
    setGroupTrips(prev => prev.map(g =>
      g.id === activeGroupTripId ? { ...g, travelers: [...g.travelers, newT] } : g
    ))
  }, [activeGroupTripId])

  const removeTraveler = useCallback((id: string) => {
    if (!activeGroupTripId || id === 'me') return
    setGroupTrips(prev => prev.map(g =>
      g.id === activeGroupTripId ? { ...g, travelers: g.travelers.filter(t => t.id !== id) } : g
    ))
  }, [activeGroupTripId])

  const castVote = useCallback((destId: string, travelerId: string, value: 'up' | 'down') => {
    if (!activeGroupTripId) return
    setGroupTrips(prev => prev.map(g => {
      if (g.id !== activeGroupTripId) return g
      const destVotes = { ...(g.votes[destId] || {}) }
      if (destVotes[travelerId] === value) {
        delete destVotes[travelerId]
      } else {
        destVotes[travelerId] = value
      }
      return { ...g, votes: { ...g.votes, [destId]: destVotes } }
    }))
  }, [activeGroupTripId])

  const addGroupNote = useCallback((travelerId: string, content: string) => {
    if (!activeGroupTripId) return
    setGroupTrips(prev => prev.map(g =>
      g.id === activeGroupTripId ? {
        ...g,
        notes: [...g.notes, { id: `n-${Date.now()}`, travelerId, content, createdAt: 'Just now' }]
      } : g
    ))
  }, [activeGroupTripId])

  const setGroupDestination = useCallback((destId: string) => {
    if (!activeGroupTripId) return
    setGroupTrips(prev => prev.map(g =>
      g.id === activeGroupTripId ? { ...g, destinationId: destId } : g
    ))
  }, [activeGroupTripId])

  // ─── Bookings ───
  const addStayBooking = useCallback((booking: StayBooking) => {
    setStayBookings(prev => [booking, ...prev])
    setRecentActivity(prev => [{ action: `Booked ${booking.stayName}`, timestamp: 'Just now', icon: '🏨' }, ...prev.slice(0, 19)])
  }, [])

  const cancelStayBooking = useCallback((id: string) => {
    setStayBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b))
  }, [])

  const addVenueReservation = useCallback((res: VenueReservation) => {
    setVenueReservations(prev => [res, ...prev])
    setRecentActivity(prev => [{ action: `Reserved table at ${res.venueName}`, timestamp: 'Just now', icon: '🍽️' }, ...prev.slice(0, 19)])
  }, [])

  const cancelVenueReservation = useCallback((id: string) => {
    setVenueReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' as const } : r))
  }, [])

  // ─── Activity ───
  const addActivity = useCallback((action: string, icon: string) => {
    setRecentActivity(prev => [{ action, timestamp: 'Just now', icon }, ...prev.slice(0, 19)])
  }, [])

  // ─── Notifications ───
  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `notif-${Date.now()}`
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000)
  }, [])
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return (
    <AppContext.Provider value={{
      favoriteDestinations, favoriteVenues, favoriteStays,
      toggleFavoriteDestination, toggleFavoriteVenue, toggleFavoriteStay,
      isFavoriteDestination: (id) => favoriteDestinations.includes(id),
      isFavoriteVenue: (id) => favoriteVenues.includes(id),
      isFavoriteStay: (id) => favoriteStays.includes(id),
      savedTrips, saveTrip, deleteTrip, updateTripName,
      customTrips, saveCustomTrip, deleteCustomTrip, updateCustomTrip,
      groupTrips, activeGroupTrip, createGroupTrip, setActiveGroupTrip,
      addTraveler, removeTraveler, castVote, addGroupNote, setGroupDestination,
      stayBookings, venueReservations, addStayBooking, cancelStayBooking, addVenueReservation, cancelVenueReservation,
      recentActivity, addActivity,
      notifications, notify, dismissNotification,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import {
  SavedTrip, Itinerary, BudgetBreakdown, GroupTrip, Traveler, Vote,
  GroupNote, BudgetSplit, TripType, Vibe, BudgetTier, Destination, Venue, Stay,
  Poll, PollOption,
} from '@/types'
import { destinations } from '@/data/destinations'

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
  polls: Poll[]
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
  createPoll: (question: string, options: string[]) => void
  votePoll: (pollId: string, optionId: string, travelerId: string) => void
  closePoll: (pollId: string) => void
  deletePoll: (pollId: string) => void
  setTravelerBudgetLimit: (travelerId: string, limit: number) => void
  generateInviteCode: () => string
  joinTripFromCode: (code: string, guestName: string) => boolean

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
  polls: [
    {
      id: 'poll-demo-1', question: 'Hotel or Airbnb?', createdBy: 'me', closed: false, createdAt: '1 hour ago',
      options: [
        { id: 'opt-0', text: 'Hotel', votes: ['me', 't2'] },
        { id: 'opt-1', text: 'Airbnb', votes: ['t3', 't4'] },
      ],
    },
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
  const [groupTrips, setGroupTrips] = useState<GroupTripFull[]>([])
  const [activeGroupTripId, setActiveGroupTripId] = useState<string | null>(null)
  const [recentActivity, setRecentActivity] = useState<{ action: string; timestamp: string; icon: string }[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setFavDests(loadFromStorage('favDests', ['miami', 'nashville', 'las-vegas', 'scottsdale', 'sedona']))
    setFavVenues(loadFromStorage('favVenues', ['v-miami-4', 'v-nash-1', 'v-miami-1', 'v-nash-8', 'v-sed-2']))
    setFavStays(loadFromStorage('favStays', []))
    setSavedTrips(loadFromStorage('savedTrips', defaultSavedTrips))
    setGroupTrips(loadFromStorage('groupTrips', [defaultGroupTrip]))
    setActiveGroupTripId(loadFromStorage('activeGroupTrip', 'group-demo-1'))
    setRecentActivity(loadFromStorage('activity', defaultActivity))
    setLoaded(true)
  }, [])

  // Persist on changes
  useEffect(() => { if (loaded) saveToStorage('favDests', favoriteDestinations) }, [favoriteDestinations, loaded])
  useEffect(() => { if (loaded) saveToStorage('favVenues', favoriteVenues) }, [favoriteVenues, loaded])
  useEffect(() => { if (loaded) saveToStorage('favStays', favoriteStays) }, [favoriteStays, loaded])
  useEffect(() => { if (loaded) saveToStorage('savedTrips', savedTrips) }, [savedTrips, loaded])
  useEffect(() => { if (loaded) saveToStorage('groupTrips', groupTrips) }, [groupTrips, loaded])
  useEffect(() => { if (loaded) saveToStorage('activeGroupTrip', activeGroupTripId) }, [activeGroupTripId, loaded])
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

  // ─── Group trips ───
  const createGroupTrip = useCallback((name: string) => {
    const id = `group-${Date.now()}`
    const trip: GroupTripFull = {
      id, name, destinationId: null,
      travelers: [{ id: 'me', name: 'You (Host)', avatar: '👑', vibePreferences: ['party', 'foodie'], budgetPreference: 'mid' }],
      votes: {}, notes: [], polls: [], budgetTotal: 0, createdAt: new Date().toISOString(),
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

  // ─── Polls ───
  const createPoll = useCallback((question: string, options: string[]) => {
    if (!activeGroupTripId) return
    const poll: Poll = {
      id: `poll-${Date.now()}`,
      question,
      options: options.map((text, i) => ({ id: `opt-${i}`, text, votes: [] })),
      createdBy: 'me',
      closed: false,
      createdAt: 'Just now',
    }
    setGroupTrips(prev => prev.map(g =>
      g.id === activeGroupTripId ? { ...g, polls: [...(g.polls || []), poll] } : g
    ))
  }, [activeGroupTripId])

  const votePoll = useCallback((pollId: string, optionId: string, travelerId: string) => {
    if (!activeGroupTripId) return
    setGroupTrips(prev => prev.map(g => {
      if (g.id !== activeGroupTripId) return g
      return {
        ...g,
        polls: (g.polls || []).map(p => {
          if (p.id !== pollId || p.closed) return p
          return {
            ...p,
            options: p.options.map(opt => {
              const without = opt.votes.filter(v => v !== travelerId)
              if (opt.id === optionId) {
                // Toggle: if already voted, remove; otherwise add
                return { ...opt, votes: opt.votes.includes(travelerId) ? without : [...without, travelerId] }
              }
              return { ...opt, votes: without }
            }),
          }
        }),
      }
    }))
  }, [activeGroupTripId])

  const closePoll = useCallback((pollId: string) => {
    if (!activeGroupTripId) return
    setGroupTrips(prev => prev.map(g =>
      g.id === activeGroupTripId
        ? { ...g, polls: (g.polls || []).map(p => p.id === pollId ? { ...p, closed: true } : p) }
        : g
    ))
  }, [activeGroupTripId])

  const deletePoll = useCallback((pollId: string) => {
    if (!activeGroupTripId) return
    setGroupTrips(prev => prev.map(g =>
      g.id === activeGroupTripId
        ? { ...g, polls: (g.polls || []).filter(p => p.id !== pollId) }
        : g
    ))
  }, [activeGroupTripId])

  // ─── Budget Limits ───
  const setTravelerBudgetLimit = useCallback((travelerId: string, limit: number) => {
    if (!activeGroupTripId) return
    setGroupTrips(prev => prev.map(g =>
      g.id === activeGroupTripId
        ? { ...g, travelers: g.travelers.map(t => t.id === travelerId ? { ...t, budgetLimit: limit } : t) }
        : g
    ))
  }, [activeGroupTripId])

  // ─── Invite System ───
  const generateInviteCode = useCallback((): string => {
    if (!activeGroupTrip) return ''
    const payload = { tripId: activeGroupTrip.id, tripName: activeGroupTrip.name, t: Date.now().toString(36) }
    return btoa(JSON.stringify(payload))
  }, [activeGroupTrip])

  const joinTripFromCode = useCallback((code: string, guestName: string): boolean => {
    try {
      const payload = JSON.parse(atob(code))
      const { tripId, tripName } = payload
      if (!tripId || !tripName) return false

      const emojis = ['🎉', '🌟', '🔥', '🎪', '🎯', '💫', '🚀', '🌈', '⚡', '🎶']
      const newTraveler: Traveler = {
        id: `t-${Date.now()}`, name: guestName,
        avatar: emojis[Math.floor(Math.random() * emojis.length)] || '🎉',
        vibePreferences: ['chill'], budgetPreference: 'mid',
      }

      setGroupTrips(prev => {
        const existing = prev.find(g => g.id === tripId)
        if (existing) {
          return prev.map(g => g.id === tripId ? { ...g, travelers: [...g.travelers, newTraveler] } : g)
        }
        // Create a new trip shell from the invite
        const trip: GroupTripFull = {
          id: tripId, name: tripName, destinationId: null,
          travelers: [
            { id: 'host', name: 'Host', avatar: '👑', vibePreferences: ['party'], budgetPreference: 'mid' },
            newTraveler,
          ],
          votes: {}, notes: [], polls: [], budgetTotal: 0, createdAt: new Date().toISOString(),
        }
        return [trip, ...prev]
      })
      setActiveGroupTripId(tripId)
      return true
    } catch {
      return false
    }
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
      groupTrips, activeGroupTrip, createGroupTrip, setActiveGroupTrip,
      addTraveler, removeTraveler, castVote, addGroupNote, setGroupDestination,
      createPoll, votePoll, closePoll, deletePoll,
      setTravelerBudgetLimit, generateInviteCode, joinTripFromCode,
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

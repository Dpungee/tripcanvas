// ============================================
// TripCanvas Core Types
// ============================================

export type TripType =
  | 'weekend-getaway'
  | 'birthday'
  | 'bachelor-party'
  | 'bachelorette-party'
  | 'girls-trip'
  | 'guys-trip'
  | 'romantic'
  | 'family'
  | 'solo'
  | 'luxury-vacation'

export type Vibe =
  | 'party'
  | 'chill'
  | 'foodie'
  | 'luxury'
  | 'wellness'
  | 'outdoorsy'
  | 'culture'
  | 'romantic'
  | 'adventure'

export type PriceLevel = '$' | '$$' | '$$$' | '$$$$'

export type VenueCategory =
  | 'restaurant'
  | 'bar'
  | 'club'
  | 'museum'
  | 'spa'
  | 'outdoor'
  | 'tour'
  | 'rooftop'
  | 'live-music'
  | 'brunch'
  | 'event'
  | 'shopping'

export type StayType =
  | 'hotel'
  | 'resort'
  | 'airbnb'
  | 'villa'
  | 'cabin'
  | 'penthouse'

export type BudgetTier = 'budget' | 'mid' | 'luxury'

export type TimeBlock = 'morning' | 'afternoon' | 'evening' | 'late-night'

export type DestinationTag =
  | 'nightlife'
  | 'luxury'
  | 'relaxing'
  | 'foodie'
  | 'romantic'
  | 'group-friendly'
  | 'beach'
  | 'family'
  | 'culture'
  | 'outdoors'
  | 'party'
  | 'hidden-gem'
  | 'wellness'

// ============================================
// Core Models
// ============================================

export interface USState {
  id: string
  name: string
  abbreviation: string
  heroImage: string
  description: string
  destinations: string[] // destination IDs
  budgetRange: { low: number; high: number }
  highlights: string[]
}

export interface Destination {
  id: string
  name: string
  stateId: string
  heroImage: string
  description: string
  tags: DestinationTag[]
  avgDailyBudget: number
  bestMonths: string[]
  nightlifeRating: number // 1-5
  foodRating: number
  relaxationRating: number
  latitude?: number
  longitude?: number
  quickStats: {
    avgTemp: string
    timezone: string
    nearestAirport: string
  }
}

export interface Venue {
  id: string
  destinationId: string
  name: string
  category: VenueCategory
  subcategory?: string
  description: string
  priceLevel: PriceLevel
  avgPrice?: number
  rating: number // 1-5
  neighborhood: string
  address: string
  hours: string
  bookingUrl?: string
  tags: string[]
  imageUrl: string
}

export interface Stay {
  id: string
  destinationId: string
  name: string
  type: StayType
  nightlyPrice: number
  maxGuests: number
  location: string
  amenities: string[]
  rating: number
  imageUrl: string
  vibeTags: string[]
  description: string
}

export interface ItineraryItem {
  id: string
  title: string
  venueId?: string
  timeBlock: TimeBlock
  startTime: string
  endTime: string
  costEstimate: number
  travelTime?: string
  reservationNeeded: boolean
  notes: string
  category: VenueCategory | 'transport' | 'free-time'
}

export interface ItineraryDay {
  dayNumber: number
  date?: string
  theme: string
  items: ItineraryItem[]
  totalCost: number
}

export interface Itinerary {
  id: string
  destinationId: string
  tripType: TripType
  vibes: Vibe[]
  budgetTier: BudgetTier
  groupSize: number
  days: ItineraryDay[]
  totalCost: number
  perPersonCost: number
}

export interface BudgetBreakdown {
  lodging: number
  food: number
  drinks: number
  activities: number
  transportation: number
  misc: number
  total: number
  perPerson: number
}

export interface TripPlannerInput {
  destinationId: string
  tripLength: number
  groupSize: number
  budgetTier: BudgetTier
  tripType: TripType
  vibes: Vibe[]
  preferredCategories: VenueCategory[]
  nightlifePreference: 'none' | 'some' | 'heavy'
  relaxationVsAdventure: number // 0-100 slider
}

export interface Traveler {
  id: string
  name: string
  avatar: string
  vibePreferences: Vibe[]
  budgetPreference: BudgetTier
  budgetLimit?: number
}

export interface Poll {
  id: string
  question: string
  options: PollOption[]
  createdBy: string
  closed: boolean
  createdAt: string
}

export interface PollOption {
  id: string
  text: string
  votes: string[]
}

export interface GroupTrip {
  id: string
  name: string
  destinationId?: string
  travelers: Traveler[]
  votes: Vote[]
  notes: GroupNote[]
  itineraryVersions: Itinerary[]
  budgetSplit: BudgetSplit[]
}

export interface Vote {
  id: string
  travelerId: string
  targetId: string
  targetType: 'destination' | 'venue' | 'stay'
  value: 'up' | 'down'
}

export interface GroupNote {
  id: string
  travelerId: string
  content: string
  createdAt: string
}

export interface BudgetSplit {
  travelerId: string
  amount: number
  paid: number
}

export interface SavedTrip {
  id: string
  name: string
  destinationId: string
  itinerary: Itinerary
  createdAt: string
  updatedAt: string
  budget: BudgetBreakdown
  groupSize: number
  tripType: TripType
}

// Label maps
export const tripTypeLabels: Record<TripType, string> = {
  'weekend-getaway': 'Weekend Getaway',
  'birthday': 'Birthday Trip',
  'bachelor-party': 'Bachelor Party',
  'bachelorette-party': 'Bachelorette Party',
  'girls-trip': 'Girls Trip',
  'guys-trip': 'Guys Trip',
  'romantic': 'Romantic Trip',
  'family': 'Family Trip',
  'solo': 'Solo Trip',
  'luxury-vacation': 'Luxury Vacation',
}

export const vibeLabels: Record<Vibe, string> = {
  party: 'Party',
  chill: 'Chill',
  foodie: 'Foodie',
  luxury: 'Luxury',
  wellness: 'Wellness',
  outdoorsy: 'Outdoorsy',
  culture: 'Culture',
  romantic: 'Romantic',
  adventure: 'Adventure',
}

export const vibeEmojis: Record<Vibe, string> = {
  party: '🎉',
  chill: '😌',
  foodie: '🍽️',
  luxury: '✨',
  wellness: '🧘',
  outdoorsy: '🏔️',
  culture: '🎭',
  romantic: '💕',
  adventure: '🏄',
}

export const categoryLabels: Record<VenueCategory, string> = {
  restaurant: 'Restaurants',
  bar: 'Bars & Lounges',
  club: 'Clubs & Nightlife',
  museum: 'Museums & Culture',
  spa: 'Spas & Wellness',
  outdoor: 'Outdoor Adventures',
  tour: 'Tours',
  rooftop: 'Rooftop Venues',
  'live-music': 'Live Music',
  brunch: 'Brunch Spots',
  event: 'Events',
  shopping: 'Shopping',
}

export const categoryIcons: Record<VenueCategory, string> = {
  restaurant: '🍽️',
  bar: '🍸',
  club: '🪩',
  museum: '🏛️',
  spa: '💆',
  outdoor: '🏕️',
  tour: '🗺️',
  rooftop: '🌃',
  'live-music': '🎵',
  brunch: '🥂',
  event: '🎪',
  shopping: '🛍️',
}

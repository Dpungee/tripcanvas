import {
  TripPlannerInput,
  Itinerary,
  ItineraryDay,
  ItineraryItem,
  Venue,
  Vibe,
  VenueCategory,
  TimeBlock,
  BudgetTier,
} from '@/types'
import { getVenuesByDestination } from '@/data/venues'
import { getStaysByDestination } from '@/data/stays'

const budgetMultipliers: Record<BudgetTier, number> = {
  budget: 0.6,
  mid: 1.0,
  luxury: 1.8,
}

const vibeToCategories: Record<Vibe, VenueCategory[]> = {
  party: ['club', 'bar', 'rooftop', 'brunch', 'live-music'],
  chill: ['spa', 'brunch', 'restaurant', 'outdoor'],
  foodie: ['restaurant', 'brunch', 'tour', 'bar'],
  luxury: ['restaurant', 'spa', 'rooftop', 'shopping'],
  wellness: ['spa', 'outdoor', 'brunch', 'restaurant'],
  outdoorsy: ['outdoor', 'tour', 'restaurant', 'bar'],
  culture: ['museum', 'tour', 'restaurant', 'live-music'],
  romantic: ['restaurant', 'spa', 'rooftop', 'tour'],
  adventure: ['outdoor', 'tour', 'bar', 'live-music'],
}

function scoreVenueForTrip(venue: Venue, input: TripPlannerInput): number {
  let score = 0
  const priceMap: Record<string, number> = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 }
  const venuePrice = priceMap[venue.priceLevel] || 2

  // ============ BUDGET MATCHING (dominant factor) ============
  // Budget tier strongly controls which venues appear
  if (input.budgetTier === 'budget') {
    // Budget trips: strongly prefer $ and $$, penalize $$$ and reject $$$$
    if (venuePrice <= 2) score += 8           // $ or $$ get big boost
    else if (venuePrice === 3) score -= 6     // $$$ heavily penalized
    else score -= 15                          // $$$$ essentially excluded
  } else if (input.budgetTier === 'mid') {
    // Mid trips: prefer $$ and $$$, allow some $ and $$$$
    if (venuePrice === 2 || venuePrice === 3) score += 6  // sweet spot
    else if (venuePrice === 1) score -= 2                  // $ is fine but not ideal
    else score -= 4                                        // $$$$ less likely
  } else {
    // Luxury trips: strongly prefer $$$ and $$$$, penalize budget
    if (venuePrice >= 3) score += 8           // $$$ and $$$$ get big boost
    else if (venuePrice === 2) score -= 4     // $$ less ideal
    else score -= 12                          // $ essentially excluded
  }

  // ============ VIBE MATCHING ============
  for (const vibe of input.vibes) {
    const preferred = vibeToCategories[vibe]
    if (preferred.includes(venue.category)) score += 3
    const vibeTags = venue.tags.map(t => t.toLowerCase())
    if (vibeTags.includes(vibe)) score += 2
  }

  // Category preference
  if (input.preferredCategories.includes(venue.category)) score += 2

  // ============ NIGHTLIFE PREFERENCE ============
  if (input.nightlifePreference === 'heavy' && ['club', 'bar', 'rooftop', 'live-music'].includes(venue.category)) {
    score += 3
  }
  if (input.nightlifePreference === 'none' && ['club'].includes(venue.category)) {
    score -= 8
  }

  // Group-friendly bonus
  if (input.groupSize > 4 && venue.tags.includes('group-friendly')) {
    score += 2
  }

  // Rating bonus (minor tiebreaker)
  score += (venue.rating - 4) * 0.5

  return score
}

function assignTimeBlock(category: VenueCategory): TimeBlock {
  switch (category) {
    case 'brunch': return 'morning'
    case 'museum':
    case 'outdoor':
    case 'tour':
    case 'shopping': return 'afternoon'
    case 'restaurant':
    case 'spa': return Math.random() > 0.5 ? 'afternoon' : 'evening'
    case 'rooftop':
    case 'bar': return 'evening'
    case 'club':
    case 'live-music':
    case 'event': return 'late-night'
    default: return 'afternoon'
  }
}

function getTimeRange(block: TimeBlock): { start: string; end: string } {
  switch (block) {
    case 'morning': return { start: '9:00 AM', end: '11:30 AM' }
    case 'afternoon': return { start: '12:00 PM', end: '3:00 PM' }
    case 'evening': return { start: '6:00 PM', end: '9:00 PM' }
    case 'late-night': return { start: '10:00 PM', end: '1:00 AM' }
  }
}

export function generateItinerary(input: TripPlannerInput): Itinerary {
  const allVenues = getVenuesByDestination(input.destinationId)
  const allStays = getStaysByDestination(input.destinationId)
  const multiplier = budgetMultipliers[input.budgetTier]

  // If no venues exist for this destination, return a placeholder itinerary
  if (allVenues.length === 0) {
    const days: ItineraryDay[] = Array.from({ length: input.tripLength }, (_, d) => ({
      dayNumber: d + 1,
      theme: d === 0 ? 'Arrival & Exploration' : d === input.tripLength - 1 ? 'Last Day Highlights' : 'Free Day',
      items: [
        {
          id: `item-${d}-0`,
          title: 'Explore the area',
          timeBlock: 'morning' as TimeBlock,
          startTime: '9:00 AM',
          endTime: '12:00 PM',
          costEstimate: 0,
          travelTime: '—',
          reservationNeeded: false,
          notes: 'Detailed venue data coming soon for this destination. Explore on your own!',
          category: 'outdoor' as VenueCategory,
        },
        {
          id: `item-${d}-1`,
          title: 'Local dining',
          timeBlock: 'evening' as TimeBlock,
          startTime: '7:00 PM',
          endTime: '9:00 PM',
          costEstimate: Math.round(40 * multiplier),
          travelTime: '10 min',
          reservationNeeded: false,
          notes: 'Check local recommendations for the best restaurants in the area.',
          category: 'restaurant' as VenueCategory,
        },
      ],
      totalCost: Math.round(40 * multiplier),
    }))

    const totalCost = days.reduce((s, d) => s + d.totalCost, 0) + (200 * input.tripLength)
    return {
      id: `itin-${Date.now()}`,
      destinationId: input.destinationId,
      tripType: input.tripType,
      vibes: input.vibes,
      budgetTier: input.budgetTier,
      groupSize: input.groupSize,
      days,
      totalCost: Math.round(totalCost),
      perPersonCost: Math.round(totalCost / input.groupSize),
    }
  }

  // Score and sort venues
  const scored = allVenues.map(v => ({
    venue: v,
    score: scoreVenueForTrip(v, input),
  })).sort((a, b) => b.score - a.score)

  const days: ItineraryDay[] = []
  const usedVenueIds = new Set<string>()

  const dayThemes = [
    'Arrival & Exploration',
    'Culture & Adventure',
    'Food & Relaxation',
    'Nightlife & Entertainment',
    'Hidden Gems',
    'Last Day Highlights',
  ]

  for (let d = 0; d < input.tripLength; d++) {
    const items: ItineraryItem[] = []
    const dayVenues: Venue[] = []

    // Pick 3-5 venues per day based on relaxation vs adventure
    const targetCount = input.relaxationVsAdventure > 60 ? 3 : input.relaxationVsAdventure > 30 ? 4 : 5

    // Ensure variety of time blocks
    const timeBlockTargets: TimeBlock[] = ['morning', 'afternoon', 'evening']
    if (input.nightlifePreference !== 'none') {
      timeBlockTargets.push('late-night')
    }

    for (const tb of timeBlockTargets) {
      if (items.length >= targetCount) break

      // First try unused venues, then allow reuse if we've exhausted all options
      let candidates = scored.filter(s =>
        !usedVenueIds.has(s.venue.id) &&
        assignTimeBlock(s.venue.category) === tb
      )
      if (candidates.length === 0) {
        candidates = scored.filter(s => assignTimeBlock(s.venue.category) === tb)
      }

      if (candidates.length > 0) {
        // Add some randomness
        const topN = candidates.slice(0, Math.min(3, candidates.length))
        const pick = topN[Math.floor(Math.random() * topN.length)]
        if (!pick) continue

        usedVenueIds.add(pick.venue.id)
        dayVenues.push(pick.venue)

        const timeRange = getTimeRange(tb)
        const cost = (pick.venue.avgPrice || 30) * multiplier

        items.push({
          id: `item-${d}-${items.length}`,
          title: pick.venue.name,
          venueId: pick.venue.id,
          timeBlock: tb,
          startTime: timeRange.start,
          endTime: timeRange.end,
          costEstimate: Math.round(cost),
          travelTime: '15 min',
          reservationNeeded: pick.venue.priceLevel === '$$$' || pick.venue.priceLevel === '$$$$',
          notes: pick.venue.description,
          category: pick.venue.category,
        })
      }
    }

    // Ensure at least a restaurant for each day
    if (!items.some(i => i.category === 'restaurant')) {
      const restaurants = scored.filter(s =>
        !usedVenueIds.has(s.venue.id) && s.venue.category === 'restaurant'
      )
      if (restaurants.length > 0 && restaurants[0]) {
        const r = restaurants[0].venue
        usedVenueIds.add(r.id)
        const cost = (r.avgPrice || 40) * multiplier
        items.push({
          id: `item-${d}-food`,
          title: r.name,
          venueId: r.id,
          timeBlock: 'evening',
          startTime: '7:00 PM',
          endTime: '9:00 PM',
          costEstimate: Math.round(cost),
          travelTime: '10 min',
          reservationNeeded: true,
          notes: r.description,
          category: 'restaurant',
        })
      }
    }

    // Sort items by time block order
    const blockOrder: Record<TimeBlock, number> = { morning: 0, afternoon: 1, evening: 2, 'late-night': 3 }
    items.sort((a, b) => blockOrder[a.timeBlock] - blockOrder[b.timeBlock])

    const dayCost = items.reduce((sum, i) => sum + i.costEstimate, 0)

    days.push({
      dayNumber: d + 1,
      theme: dayThemes[d % dayThemes.length] || `Day ${d + 1}`,
      items,
      totalCost: dayCost,
    })
  }

  // Calculate stay cost
  const bestStay = allStays.sort((a, b) => {
    const aFit = input.budgetTier === 'luxury' ? b.nightlyPrice - a.nightlyPrice : a.nightlyPrice - b.nightlyPrice
    return aFit
  })[0]
  const stayCostPerNight = bestStay ? bestStay.nightlyPrice * multiplier : 200

  const activitiesTotal = days.reduce((sum, d) => sum + d.totalCost, 0)
  const stayTotal = stayCostPerNight * input.tripLength
  const totalCost = (activitiesTotal + stayTotal) * (input.groupSize > 1 ? 1 : 1)

  return {
    id: `itin-${Date.now()}`,
    destinationId: input.destinationId,
    tripType: input.tripType,
    vibes: input.vibes,
    budgetTier: input.budgetTier,
    groupSize: input.groupSize,
    days,
    totalCost: Math.round(totalCost),
    perPersonCost: Math.round(totalCost / input.groupSize),
  }
}

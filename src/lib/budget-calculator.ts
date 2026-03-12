import { BudgetBreakdown, BudgetTier, Itinerary, TripPlannerInput } from '@/types'
import { getStaysByDestination } from '@/data/stays'

const dailyCosts: Record<BudgetTier, {
  food: number
  drinks: number
  activities: number
  transportation: number
  misc: number
}> = {
  budget: { food: 40, drinks: 15, activities: 20, transportation: 12, misc: 10 },
  mid: { food: 90, drinks: 40, activities: 55, transportation: 25, misc: 20 },
  luxury: { food: 200, drinks: 80, activities: 120, transportation: 55, misc: 45 },
}

export function calculateBudget(input: TripPlannerInput, itinerary?: Itinerary): BudgetBreakdown {
  const stays = getStaysByDestination(input.destinationId)
  const costs = dailyCosts[input.budgetTier]

  // Find appropriate stay based on budget tier
  const sortedStays = [...stays].sort((a, b) => {
    if (input.budgetTier === 'budget') return a.nightlyPrice - b.nightlyPrice
    if (input.budgetTier === 'luxury') return b.nightlyPrice - a.nightlyPrice
    return Math.abs(a.nightlyPrice - 250) - Math.abs(b.nightlyPrice - 250)
  })

  const selectedStay = sortedStays[0]
  const nightlyRate = selectedStay ? selectedStay.nightlyPrice : (input.budgetTier === 'budget' ? 80 : input.budgetTier === 'mid' ? 200 : 500)
  const lodgingTotal = nightlyRate * input.tripLength

  // Use actual itinerary costs when available for more accurate breakdown
  let foodTotal = costs.food * input.tripLength
  let drinksTotal = costs.drinks * input.tripLength
  let activitiesTotal = costs.activities * input.tripLength

  if (itinerary) {
    // Pull real costs from the itinerary items by category
    let realFood = 0
    let realDrinks = 0
    let realActivities = 0

    for (const day of itinerary.days) {
      for (const item of day.items) {
        if (['restaurant', 'brunch'].includes(item.category)) {
          realFood += item.costEstimate
        } else if (['bar', 'club', 'rooftop', 'live-music'].includes(item.category)) {
          realDrinks += item.costEstimate
        } else {
          realActivities += item.costEstimate
        }
      }
    }

    // Use whichever is higher — real itinerary costs or the daily estimate
    // This prevents the budget from looking unrealistically low
    foodTotal = Math.max(realFood, costs.food * input.tripLength)
    drinksTotal = Math.max(realDrinks, costs.drinks * input.tripLength)
    activitiesTotal = Math.max(realActivities, costs.activities * input.tripLength)
  }

  const transportTotal = costs.transportation * input.tripLength
  const miscTotal = costs.misc * input.tripLength

  const total = lodgingTotal + foodTotal + drinksTotal + activitiesTotal + transportTotal + miscTotal

  return {
    lodging: Math.round(lodgingTotal),
    food: Math.round(foodTotal),
    drinks: Math.round(drinksTotal),
    activities: Math.round(activitiesTotal),
    transportation: Math.round(transportTotal),
    misc: Math.round(miscTotal),
    total: Math.round(total),
    perPerson: Math.round(total / input.groupSize),
  }
}

export function getBudgetPresets(destinationId: string, tripLength: number, groupSize: number) {
  return {
    budget: calculateBudget({
      destinationId, tripLength, groupSize,
      budgetTier: 'budget', tripType: 'weekend-getaway',
      vibes: ['chill'], preferredCategories: [],
      nightlifePreference: 'some', relaxationVsAdventure: 50,
    }),
    mid: calculateBudget({
      destinationId, tripLength, groupSize,
      budgetTier: 'mid', tripType: 'weekend-getaway',
      vibes: ['chill'], preferredCategories: [],
      nightlifePreference: 'some', relaxationVsAdventure: 50,
    }),
    luxury: calculateBudget({
      destinationId, tripLength, groupSize,
      budgetTier: 'luxury', tripType: 'weekend-getaway',
      vibes: ['luxury'], preferredCategories: [],
      nightlifePreference: 'some', relaxationVsAdventure: 50,
    }),
  }
}

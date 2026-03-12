# TripCanvas

A premium trip planning web app for vacations, bachelor/bachelorette parties, girls trips, guys trips, and group getaways. Built with Next.js 16, TypeScript, Tailwind CSS, and shadcn/ui-inspired components.

## Features

- **Destination Discovery** — Browse 30+ destinations across 8 U.S. states with rich data, ratings, and tags
- **Venue Explorer** — Restaurants, bars, clubs, museums, spas, outdoor activities and more with pricing and ratings
- **Stay Finder** — Hotels, resorts, Airbnb-style rentals, villas, cabins with amenities and nightly pricing
- **Itinerary Builder** — AI-ready rules-based itinerary generation with day-by-day scheduling
- **Budget Planner** — Detailed cost breakdowns with per-person splits across lodging, food, drinks, activities, transport
- **Group Planning** — Traveler lists, destination voting, shared notes, and budget splitting
- **Trip Type Support** — Weekend getaways, birthday trips, bachelor/bachelorette parties, girls/guys trips, romantic, family, solo, luxury

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 3
- **UI Components:** Custom shadcn/ui-style components (Button, Badge, Card, etc.)
- **Icons:** Lucide React
- **Database Schema:** Prisma (PostgreSQL ready)
- **Form Handling:** React Hook Form + Zod (ready to wire)
- **Data:** Comprehensive mock data with realistic venues, stays, and pricing

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page with hero, search, featured destinations
│   ├── explore/           # Explore all destinations + state explorer
│   ├── destinations/      # Individual destination detail pages
│   ├── planner/           # Trip planner with itinerary generation
│   ├── group/             # Group trip planning with voting
│   └── saved/             # Saved trips dashboard
├── components/
│   ├── ui/                # Base UI components (Button, Badge, Card)
│   ├── shared/            # Navbar, Footer
│   ├── destination/       # DestinationCard
│   ├── venue/             # VenueCard
│   ├── stay/              # StayCard
│   ├── itinerary/         # ItineraryTimeline
│   ├── budget/            # BudgetSummary
│   └── group/             # Group planning components
├── data/                  # Mock data (states, destinations, venues, stays)
├── lib/                   # Utilities, itinerary generator, budget calculator
└── types/                 # TypeScript type definitions
prisma/
└── schema.prisma          # Full database schema ready for PostgreSQL
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Hero, search, trip types, featured destinations, browse by state |
| Explore | `/explore` | All destinations with tag filters and state grid |
| State Detail | `/explore/[stateId]` | State overview, destinations, categories, budget guide |
| Destination | `/destinations/[id]` | Tabbed detail with activities, restaurants, nightlife, stays, itinerary, budget |
| Trip Planner | `/planner` | Full planner form with itinerary generation |
| Group Planner | `/group` | Traveler list, voting, notes, budget split |
| Saved Trips | `/saved` | Saved trips, favorites, recent activity |

## Seeded Data

- **8 states:** Florida, California, New York, Texas, Nevada, Tennessee, Arizona, Colorado
- **30+ destinations:** Miami, Las Vegas, Nashville, NYC, LA, Austin, Scottsdale, Sedona, and more
- **70+ venues:** Restaurants, bars, clubs, museums, spas, outdoor activities
- **30+ stays:** Hotels, resorts, villas, cabins, Airbnb-style rentals

## Itinerary Generation

The itinerary generator uses a deterministic rules-based system:
- Scores venues based on vibe match, budget tier, category preferences
- Distributes activities across morning/afternoon/evening/late-night
- Respects nightlife preferences and relaxation vs adventure balance
- Avoids overloading days; ensures food options throughout
- Easily replaceable with AI API calls

## Future API Integration Plan

The architecture is designed for easy integration with:
- **Hotels API** (Booking.com, Hotels.com) — Replace mock stays data
- **Restaurant API** (Yelp, Google Places) — Replace mock venue data
- **Maps API** (Google Maps, Mapbox) — Add real maps and directions
- **Weather API** (OpenWeather) — Add weather forecasts
- **Booking API** (OpenTable, Resy) — Enable real reservations
- **AI API** (OpenAI, Anthropic) — Replace rules-based itinerary generation
- **Auth** (NextAuth.js, Clerk) — Add user authentication
- **Database** (Supabase, PlanetScale) — Connect Prisma schema to real DB

## Environment Variables

For future database integration:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/tripcanvas"
```

## License

MIT

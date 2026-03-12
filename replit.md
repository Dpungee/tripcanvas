# TripCanvas

A Next.js travel planning application migrated from Vercel to Replit.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS + Radix UI components
- **ORM**: Prisma (PostgreSQL)
- **Forms**: React Hook Form + Zod
- **Language**: TypeScript

## Key Features

- **Booking flow** — "Book Now" on stay cards opens a multi-step modal (dates → payment → confirmation) with a generated confirmation code
- **Reservation flow** — "Reserve a Table" on restaurant/bar/venue cards opens a reservation modal (date, time slot, party size, special requests)
- All bookings/reservations saved to localStorage and viewable in Saved → Bookings tab
- Bookings can be cancelled from the Bookings tab

## Project Structure

- `src/app/` — Next.js App Router pages and layouts
- `src/components/` — Shared UI components
- `src/data/` — Static/mock data
- `src/lib/` — Utilities and helpers
- `src/types/` — TypeScript type definitions
- `prisma/` — Prisma schema (PostgreSQL, ready for DB integration)

## Running the App

The app runs via the "Start application" workflow:

```
npm run dev
```

Binds to `0.0.0.0:5000` for Replit preview compatibility.

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (required for Prisma / real DB)

## Notes

- Currently using mock data; Prisma schema is ready for real DB integration when `DATABASE_URL` is provided
- Images from `images.unsplash.com` are allowed via Next.js remote patterns

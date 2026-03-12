import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyDetailed(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function getRatingStars(rating: number): string {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty)
}

export function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Real-time search & map URL generators
export function getGoogleMapsUrl(name: string, address: string): string {
  const query = encodeURIComponent(`${name} ${address}`)
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

export function getGoogleMapsDirectionsUrl(address: string): string {
  const dest = encodeURIComponent(address)
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`
}

export function getGoogleSearchUrl(name: string, location: string): string {
  const query = encodeURIComponent(`${name} ${location} reviews hours menu`)
  return `https://www.google.com/search?q=${query}`
}

export function getYelpSearchUrl(name: string, location: string): string {
  const find = encodeURIComponent(name)
  const loc = encodeURIComponent(location)
  return `https://www.yelp.com/search?find_desc=${find}&find_loc=${loc}`
}

export function getTripAdvisorSearchUrl(name: string, location: string): string {
  const query = encodeURIComponent(`${name} ${location}`)
  return `https://www.tripadvisor.com/Search?q=${query}`
}

export function getOpenTableSearchUrl(name: string, location: string): string {
  const query = encodeURIComponent(`${name} ${location}`)
  return `https://www.opentable.com/s?term=${query}`
}

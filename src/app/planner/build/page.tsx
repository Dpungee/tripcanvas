import { Suspense } from 'react'
import BuildClient from './BuildClient'

export const metadata = { title: 'Build Your Trip – TripCanvas' }

export default function BuildPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96 text-muted-foreground">Loading builder...</div>}>
      <BuildClient />
    </Suspense>
  )
}

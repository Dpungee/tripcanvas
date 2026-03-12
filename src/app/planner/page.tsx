import { Suspense } from 'react'
import PlannerClient from './PlannerClient'

export default function PlannerPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-xl w-64 mx-auto mb-4" />
          <div className="h-5 bg-gray-200 rounded-xl w-96 mx-auto" />
        </div>
      </div>
    }>
      <PlannerClient />
    </Suspense>
  )
}

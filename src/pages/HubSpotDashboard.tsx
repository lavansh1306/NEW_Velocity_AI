// src/pages/HubSpotDashboard.tsx
import { Suspense } from 'react'
import HubSpotHub from '@/components/hubspot/HubSpotHub'

export default function HubSpotDashboard() {
  return (
    <Suspense fallback={<div>Loading HubSpot Dashboard...</div>}>
      <HubSpotHub />
    </Suspense>
  )
}

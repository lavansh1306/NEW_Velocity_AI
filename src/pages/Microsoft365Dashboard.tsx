// src/pages/Microsoft365Dashboard.tsx
import { Suspense } from 'react'
import Microsoft365Hub from '@/components/microsoft365/Microsoft365Hub'

export default function Microsoft365Dashboard() {
  return (
    <Suspense fallback={<div>Loading Microsoft 365 Dashboard...</div>}>
      <Microsoft365Hub />
    </Suspense>
  )
}

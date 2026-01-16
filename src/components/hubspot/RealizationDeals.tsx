// src/components/hubspot/RealizationDeals.tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiUrl } from '@/lib/api'
import { hubspotFetch } from '@/lib/hubspot-fetch'
import { RealizationDeal } from '@/lib/types'

export default function RealizationDeals() {
  const [deals, setDeals] = useState<RealizationDeal[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRealizationDeals()
  }, [])

  const fetchRealizationDeals = async () => {
    try {
      setLoading(true)
      const response = await hubspotFetch(apiUrl('/api/hubspot/realization'))
      if (!response.ok) throw new Error('Failed to fetch realization data')
      const data = await response.json()
      setDeals(data.deals || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Card><CardContent className="pt-6">Loading realization data...</CardContent></Card>
  if (error) return <Card><CardContent className="pt-6 text-destructive">Error: {error}</CardContent></Card>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Value Realization - {deals.length} Deals</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Time saved and revenue impact per deal with associated campaigns
          </p>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {deals.map((deal, index) => {
          const hours = Number(deal.timeSaved?.totalHours || 0)
          const days = Number((hours / 24).toFixed(2))
          const revenue = (deal as any).revenuePullForward ?? deal.amount ?? 0
          const campaigns = deal.campaigns || []

          return (
            <Card key={deal.id || `realization-${index}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{deal.dealname || 'Untitled'}</CardTitle>
                  <Badge variant="outline">
                    ${Number(deal.amount || 0).toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="border rounded p-4">
                    <p className="text-sm text-muted-foreground font-semibold">Time Saved</p>
                    <p className="text-2xl font-bold">{hours} hrs</p>
                    <p className="text-xs text-muted-foreground mt-1">{days} days</p>
                  </div>
                  <div className="border rounded p-4">
                    <p className="text-sm text-muted-foreground font-semibold">Revenue Impact</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${Number(revenue).toLocaleString()}
                    </p>
                  </div>
                  <div className="border rounded p-4">
                    <p className="text-sm text-muted-foreground font-semibold">Campaigns</p>
                    <p className="text-2xl font-bold">{campaigns.length}</p>
                  </div>
                </div>

                {campaigns.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Associated Campaigns</p>
                    <div className="space-y-2">
                      {campaigns.map((campaign, idx) => (
                        <div key={idx} className="border rounded p-3 text-sm">
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : '—'} to{' '}
                            {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">Deal ID: {deal.id}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {deals.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No realization data available
          </CardContent>
        </Card>
      )}
    </div>
  )
}

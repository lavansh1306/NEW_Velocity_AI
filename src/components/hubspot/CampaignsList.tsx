// src/components/hubspot/CampaignsList.tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiUrl } from '@/lib/api'
import { hubspotFetch } from '@/lib/hubspot-fetch'
import { Campaign } from '@/lib/types'

export default function CampaignsList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await hubspotFetch(apiUrl('/api/hubspot/campaigns'))
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Card><CardContent className="pt-6">Loading campaigns...</CardContent></Card>
  if (error) return <Card><CardContent className="pt-6 text-destructive">Error: {error}</CardContent></Card>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Campaigns: {campaigns.length}</CardTitle>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {campaigns.map(campaign => (
          <Card key={campaign.campaignId}>
            <CardHeader>
              <CardTitle>{campaign.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-semibold">
                    {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-semibold">
                    {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Visits</p>
                  <p className="font-semibold">{(campaign as any).visits || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Conversions</p>
                  <p className="font-semibold">{(campaign as any).conversions || 0}</p>
                </div>
              </div>

              {(campaign as any).visits && (campaign as any).conversions && (
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Conversion Rate:{' '}
                    <Badge variant="secondary">
                      {Math.round(((campaign as any).conversions / Math.max(1, (campaign as any).visits)) * 100)}%
                    </Badge>
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">ID: {campaign.campaignId}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No campaigns found
          </CardContent>
        </Card>
      )}
    </div>
  )
}

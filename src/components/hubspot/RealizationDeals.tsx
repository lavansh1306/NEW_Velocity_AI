// src/components/hubspot/RealizationDeals.tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiUrl } from '@/lib/api'
import { hubspotFetch } from '@/lib/hubspot-fetch'
import { RealizationDeal } from '@/lib/types'

export default function RealizationDeals() {
  const [deals, setDeals] = useState<RealizationDeal[]>([])
  const [aggregateMetrics, setAggregateMetrics] = useState<{
    totalTimeSavedHours: number
    totalTimeSavedDays: number
    totalRevenueImpact: number
    dealCount: number
    averageTimeSavedPerDeal: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRealizationDeals()
    fetchAggregateMetrics()
  }, [])

  const fetchAggregateMetrics = async () => {
    try {
      const response = await hubspotFetch(apiUrl('/api/hubspot/ai-metrics'))
      if (!response.ok) throw new Error('Failed to fetch metrics')
      const data = await response.json()
      setAggregateMetrics(data)
    } catch (err) {
      console.error('Failed to fetch aggregate metrics:', err)
    }
  }

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
      {/* Aggregate Metrics Summary */}
      {aggregateMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-200">Total Hours Saved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-900 dark:text-red-100">{aggregateMetrics.totalTimeSavedHours}</div>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">Across all deals</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-200">Total Revenue Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-900 dark:text-blue-100">${aggregateMetrics.totalRevenueImpact.toLocaleString()}</div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Estimated acceleration</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-200">Avg Time/Deal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-900 dark:text-green-100">{aggregateMetrics.averageTimeSavedPerDeal}</div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">Hours per deal</p>
            </CardContent>
          </Card>
        </div>
      )}

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
                  <div className="flex-1">
                    <CardTitle className="text-xl">{deal.dealname || 'Untitled'}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Deal ID: {deal.id}</p>
                  </div>
                  <Badge variant="outline">
                    ${Number(deal.amount || 0).toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI Metrics Grid - Column Layout */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Time Saved</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{hours} hrs</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{days} days</p>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">Revenue Im</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">${(revenue / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">Estimated</p>
                  </div>

                  <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Stage</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-2">{deal.stage || '—'}</p>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">Deal Progress</p>
                  </div>
                </div>

                {campaigns.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Associated Campaigns ({campaigns.length})</p>
                    <div className="space-y-2">
                      {campaigns.map((campaign, idx) => (
                        <div key={idx} className="border rounded p-3 text-sm bg-slate-50 dark:bg-slate-900">
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

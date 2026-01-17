// src/components/hubspot/DealsList.tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiUrl } from '@/lib/api'
import { Deal } from '@/lib/types'
import { hubspotFetch } from '@/lib/hubspot-fetch'

export default function DealsList() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [dealMetrics, setDealMetrics] = useState<Record<string, { timeSaved: number; revenue: number }>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDeals()
    fetchDealMetrics()
  }, [])

  const fetchDealMetrics = async () => {
    try {
      const response = await hubspotFetch(apiUrl('/api/hubspot/realization'))
      if (response.ok) {
        const data = await response.json()
        const metrics: Record<string, { timeSaved: number; revenue: number }> = {}
        (data.deals || []).forEach((deal: any) => {
          metrics[deal.id] = {
            timeSaved: Number(deal.timeSaved?.totalHours || 0),
            revenue: Number((deal as any).revenuePullForward || 0)
          }
        })
        setDealMetrics(metrics)
      }
    } catch (err) {
      console.error('Failed to fetch deal metrics:', err)
    }
  }

  const fetchDeals = async () => {
    try {
      setLoading(true)
      const headers: Record<string, string> = {
        credentials: 'include'
      }
      const storeKey = localStorage.getItem('hubspot_storeKey')
      if (storeKey) {
        headers['X-HubSpot-StoreKey'] = storeKey
      }
      
      const response = await fetch(apiUrl('/api/hubspot/deals'), {
        credentials: 'include',
        headers
      })
      console.log('[DealsList] Response status:', response.status)
      if (!response.ok) throw new Error('Failed to fetch deals')
      const data = await response.json()
      setDeals(data.deals || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('[DealsList] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Card><CardContent className="pt-6">Loading deals...</CardContent></Card>
  if (error) return <Card><CardContent className="pt-6 text-destructive">Error: {error}</CardContent></Card>

  const totalValue = deals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
  const contactsSet = new Set<string>()
  deals.forEach(d => {
    d.contacts?.forEach(c => {
      if (c?.email) contactsSet.add(c.email)
    })
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-200">AI-Saved Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {Object.values(dealMetrics).reduce((sum, m) => sum + m.timeSaved, 0)} hrs
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Deal Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${deals.length > 0 ? Math.round(totalValue / deals.length).toLocaleString() : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {deals.map((deal, index) => {
          const metrics = dealMetrics[deal.dealId] || { timeSaved: 0, revenue: 0 }
          
          return (
            <Card key={deal.dealId || `deal-${index}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{deal.dealName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">ID: {deal.dealId}</p>
                  </div>
                  <Badge variant="outline">{deal.stage || 'Unknown'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Deal Details Grid - 4 Columns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="border rounded-lg p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Deal Value</p>
                    <p className="font-bold text-lg mt-1">${Number(deal.amount || 0).toLocaleString()}</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Pipeline</p>
                    <p className="font-bold text-lg mt-1">{deal.pipeline || '—'}</p>
                  </div>
                  <div className="border rounded-lg p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200">
                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase">AI Time Saved</p>
                    <p className="font-bold text-lg text-orange-900 dark:text-orange-100 mt-1">{metrics.timeSaved} hrs</p>
                  </div>
                  <div className="border rounded-lg p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase">Revenue Im</p>
                    <p className="font-bold text-lg text-green-900 dark:text-green-100 mt-1">${(metrics.revenue / 1000).toFixed(1)}K</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-semibold">
                      {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Close Date</p>
                    <p className="font-semibold">
                      {deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>

                {deal.contacts && deal.contacts.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Associated Contacts ({deal.contacts.length})</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {deal.contacts.map((contact, idx) => (
                        <div key={idx} className="border rounded p-2 text-sm">
                          <p className="font-medium">
                            {contact.firstname} {contact.lastname}
                          </p>
                          <p className="text-muted-foreground">{contact.email || 'No email'}</p>
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
            No deals found
          </CardContent>
        </Card>
      )}
    </div>
  )
}

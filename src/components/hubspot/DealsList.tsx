// src/components/hubspot/DealsList.tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiUrl } from '@/lib/api'
import { Deal } from '@/lib/types'

export default function DealsList() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDeals()
  }, [])

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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactsSet.size}</div>
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
        {deals.map((deal, index) => (
          <Card key={deal.dealId || `deal-${index}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{deal.dealName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">ID: {deal.dealId}</p>
                </div>
                <Badge variant="outline">{deal.stage || 'Unknown'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-semibold">${Number(deal.amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pipeline</p>
                  <p className="font-semibold">{deal.pipeline || '—'}</p>
                </div>
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
        ))}
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

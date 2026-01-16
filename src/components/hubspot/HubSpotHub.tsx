// src/components/hubspot/HubSpotHub.tsx
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiUrl } from '@/lib/api'
import DealsList from './DealsList'
import ContactsList from './ContactsList'
import CampaignsList from './CampaignsList'
import TicketsList from './TicketsList'
import RealizationDeals from './RealizationDeals'

interface HubSpotAuthStatus {
  authenticated: boolean
  expiresAt?: number | null
}

export default function HubSpotHub() {
  const [authStatus, setAuthStatus] = useState<HubSpotAuthStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if we just completed OAuth (URL has connected=true)
    const params = new URLSearchParams(window.location.search)
    
    if (params.get('connected') === 'true') {
      // OAuth successful, store storeKey if provided
      const storeKey = params.get('storeKey')
      if (storeKey) {
        localStorage.setItem('hubspot_storeKey', storeKey)
        console.log('[HubSpot] StoreKey stored:', storeKey)
      }
      setAuthStatus({ authenticated: true })
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      setLoading(false)
    } else {
      // Try to fetch auth status from backend
      fetchAuthStatus()
    }
  }, [])

  const fetchAuthStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch(apiUrl('/api/hubspot/auth/status'), {
        credentials: 'include' // Send cookies with request
      })
      const data = await response.json()
      setAuthStatus(data)
    } catch (error) {
      console.error('Failed to fetch auth status:', error)
      setAuthStatus({ authenticated: false })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Loading HubSpot integration...</p>
        </div>
      </div>
    )
  }

  if (!authStatus?.authenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>HubSpot Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Connect your HubSpot account to view deals, contacts, campaigns, and more
            </p>
            <div className="space-x-2">
              <Button
                onClick={() => {
                  window.location.href = apiUrl('/api/hubspot/auth/connect')
                }}
              >
                Connect HubSpot
              </Button>
              <Button variant="outline" onClick={fetchAuthStatus}>
                Refresh Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">HubSpot Analytics</h2>
          <p className="text-muted-foreground">
            Manage your deals, contacts, campaigns, and tickets
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            window.location.href = apiUrl('/api/hubspot/auth/disconnect')
          }}
        >
          Disconnect
        </Button>
      </div>

      <Tabs defaultValue="deals" className="w-full">
        <TabsList>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="realization">AI Realization</TabsTrigger>
        </TabsList>

        <TabsContent value="deals">
          <DealsList />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactsList />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignsList />
        </TabsContent>

        <TabsContent value="tickets">
          <TicketsList />
        </TabsContent>

        <TabsContent value="realization">
          <RealizationDeals />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// src/components/hubspot/HubSpotHub.tsx
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { apiUrl } from '@/lib/api'
import DealsList from './DealsList'
import ContactsList from './ContactsList'
import CampaignsList from './CampaignsList'
import TicketsList from './TicketsList'
import RealizationDeals from './RealizationDeals'

interface HubSpotAuthStatus {
  authenticated: boolean
  userId?: string | null
  portalId?: string | null
  expiresAt?: number | null
}

type AuthState = 
  | { status: 'initializing' } // Initial load
  | { status: 'verifying-portal'; attempt: number } // Waiting for portalId
  | { status: 'authenticated'; data: HubSpotAuthStatus } // Ready to render
  | { status: 'unauthenticated' } // Need to connect
  | { status: 'error'; message: string } // Fatal error

const MAX_PORTAL_RETRIES = 3
const RETRY_DELAY_MS = 800

export default function HubSpotHub() {
  const [authState, setAuthState] = useState<AuthState>({ status: 'initializing' })

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    console.log('[HubSpot Gatekeeper] Starting initialization...')
    
    // Check if we just completed OAuth
    const params = new URLSearchParams(window.location.search)
    const justConnected = params.get('connected') === 'true'
    
    if (justConnected) {
      console.log('[HubSpot Gatekeeper] OAuth callback detected')
      
      // Store storeKey if provided
      const storeKey = params.get('storeKey')
      if (storeKey) {
        localStorage.setItem('hubspot_storeKey', storeKey)
        console.log('[HubSpot Gatekeeper] StoreKey saved:', storeKey)
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // Wait for session propagation before verifying
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Start verification with retry logic
    await verifyAuthWithRetry(1)
  }

  const verifyAuthWithRetry = async (attempt: number) => {
    console.log(`[HubSpot Gatekeeper] Verification attempt ${attempt}/${MAX_PORTAL_RETRIES}`)
    setAuthState({ status: 'verifying-portal', attempt })
    
    try {
      const response = await fetch(apiUrl('/api/hubspot/auth/status'), {
        credentials: 'include',
        headers: {
          'x-hubspot-storekey': localStorage.getItem('hubspot_storeKey') || ''
        }
      })
      
      // CRITICAL: Handle explicit 401/403 as auth failure - don't retry
      if (response.status === 401 || response.status === 403) {
        console.log('[HubSpot Gatekeeper] Explicit auth failure (401/403) - redirect to connect')
        setAuthState({ status: 'unauthenticated' })
        return
      }
      
      if (!response.ok) {
        throw new Error(`Auth status check failed: ${response.status}`)
      }
      
      const data: HubSpotAuthStatus = await response.json()
      console.log('[HubSpot Gatekeeper] Auth response:', data)
      
      // Store storeKey from response if provided
      if ((data as any).storeKey) {
        localStorage.setItem('hubspot_storeKey', (data as any).storeKey)
      }
      
      // GATEKEEPER LOGIC: Check authentication state
      if (!data.authenticated) {
        console.log('[HubSpot Gatekeeper] Not authenticated')
        setAuthState({ status: 'unauthenticated' })
        return
      }
      
      // CRITICAL: portalId must be present
      if (!data.portalId) {
        console.warn(`[HubSpot Gatekeeper] Authenticated but missing portalId (attempt ${attempt})`)
        
        if (attempt < MAX_PORTAL_RETRIES) {
          // Retry after delay - portalId may still be propagating
          console.log(`[HubSpot Gatekeeper] Retrying in ${RETRY_DELAY_MS}ms...`)
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
          await verifyAuthWithRetry(attempt + 1)
          return
        } else {
          // Max retries reached - show error with reconnect option, DON'T auto-redirect
          console.error('[HubSpot Gatekeeper] Max retries reached, portalId still missing')
          setAuthState({ 
            status: 'error', 
            message: 'Portal ID not found. Please reconnect your HubSpot account.' 
          })
          return
        }
      }
      
      // SUCCESS: Authenticated with portalId
      console.log('[HubSpot Gatekeeper] ✅ Verified: portalId=' + data.portalId)
      setAuthState({ status: 'authenticated', data })
      
    } catch (error) {
      console.error('[HubSpot Gatekeeper] Verification error:', error)
      
      if (attempt < MAX_PORTAL_RETRIES) {
        // Retry on network errors
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
        await verifyAuthWithRetry(attempt + 1)
      } else {
        setAuthState({ 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Failed to verify authentication' 
        })
      }
    }
  }

  const handleReconnect = () => {
    console.log('[HubSpot Gatekeeper] Initiating reconnection...')
    window.location.href = apiUrl('/api/hubspot/auth/connect')
  }

  const handleRetry = () => {
    setAuthState({ status: 'initializing' })
    initializeAuth()
  }

  // GATEKEEPER: Initializing state
  if (authState.status === 'initializing') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div>
            <p className="text-lg font-medium">Initializing HubSpot</p>
            <p className="text-sm text-muted-foreground">Please wait...</p>
          </div>
        </div>
      </div>
    )
  }

  // GATEKEEPER: Verifying Portal ID
  if (authState.status === 'verifying-portal') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div>
            <p className="text-lg font-medium">Verifying Portal Access</p>
            <p className="text-sm text-muted-foreground">
              Confirming your HubSpot portal ID... (Attempt {authState.attempt}/{MAX_PORTAL_RETRIES})
            </p>
          </div>
        </div>
      </div>
    )
  }

  // GATEKEEPER: Error state
  if (authState.status === 'error') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Connection Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">{authState.message}</p>
            <div className="space-x-2">
              <Button onClick={handleReconnect}>
                Reconnect HubSpot
              </Button>
              <Button variant="outline" onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // GATEKEEPER: Not authenticated
  if (authState.status === 'unauthenticated') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect Your HubSpot Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              Connect your HubSpot account to manage deals, contacts, and campaigns
            </p>
            <Button 
              onClick={handleReconnect}
              size="lg"
            >
              Connect HubSpot
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ✅ GATEKEEPER PASSED: Render dashboard with portalId confirmed
  const { data } = authState as { status: 'authenticated'; data: HubSpotAuthStatus }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">HubSpot Analytics</h2>
          <p className="text-muted-foreground">
            Connected to Portal: {data.portalId}
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

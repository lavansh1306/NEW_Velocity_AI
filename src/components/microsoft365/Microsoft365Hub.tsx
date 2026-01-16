// src/components/microsoft365/Microsoft365Hub.tsx
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiUrl } from '@/lib/api'
import MeetingsMetrics from './MeetingsMetrics'
import EmailMetrics from './EmailMetrics'
import ROICalculator from './ROICalculator'

interface AuthStatus {
  authenticated: boolean
  account?: {
    oid: string
    upn?: string
    name?: string
  }
  tenantId?: string
}

export default function Microsoft365Hub() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuthStatus()
  }, [])

  const fetchAuthStatus = async () => {
    try {
      const response = await fetch(apiUrl('/api/microsoft365/auth/status'))
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
          <p className="text-muted-foreground">Loading Microsoft 365 integration...</p>
        </div>
      </div>
    )
  }

  if (!authStatus?.authenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Microsoft 365 Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Connect your Microsoft 365 account to view meeting metrics and ROI calculations
            </p>
            <Button
              onClick={() => {
                window.location.href = apiUrl('/api/microsoft365/auth/login')
              }}
            >
              Connect Microsoft 365
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Microsoft 365 Analytics</h2>
          <p className="text-muted-foreground">
            Connected as {authStatus.account?.name || authStatus.account?.upn || 'User'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            window.location.href = apiUrl('/api/microsoft365/auth/logout')
          }}
        >
          Disconnect
        </Button>
      </div>

      <Tabs defaultValue="meetings" className="w-full">
        <TabsList>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="roi">ROI Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="meetings">
          <MeetingsMetrics />
        </TabsContent>

        <TabsContent value="email">
          <EmailMetrics />
        </TabsContent>

        <TabsContent value="roi">
          <ROICalculator />
        </TabsContent>
      </Tabs>
    </div>
  )
}

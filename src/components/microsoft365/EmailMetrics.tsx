// src/components/microsoft365/EmailMetrics.tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiUrl } from '@/lib/api'

export default function EmailMetrics() {
  const [report, setReport] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmailMetrics()
  }, [])

  const fetchEmailMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch(apiUrl('/api/microsoft365/metrics/email?period=D30'))
      if (!response.ok) {
        throw new Error('Failed to fetch email metrics')
      }
      const data = await response.json()
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading email metrics...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Activity (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {report ? (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Email activity report for the last 30 days. Data provided by Microsoft Graph API.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No email data available</p>
        )}
      </CardContent>
    </Card>
  )
}

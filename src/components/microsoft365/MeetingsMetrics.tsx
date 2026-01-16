// src/components/microsoft365/MeetingsMetrics.tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiUrl } from '@/lib/api'

export default function MeetingsMetrics() {
  const [meetings, setMeetings] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response = await fetch(apiUrl('/api/microsoft365/metrics/meetings'))
      if (!response.ok) {
        throw new Error('Failed to fetch meetings')
      }
      const data = await response.json()
      setMeetings(data)
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
          <p className="text-muted-foreground">Loading meetings...</p>
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
        <CardTitle>Online Meetings</CardTitle>
      </CardHeader>
      <CardContent>
        {meetings?.meetings && meetings.meetings.length > 0 ? (
          <div className="space-y-4">
            {meetings.meetings.map((meeting: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-4">
                <h4 className="font-semibold">{meeting.subject || 'Untitled Meeting'}</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  {meeting.startDateTime && new Date(meeting.startDateTime).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No meetings found</p>
        )}
      </CardContent>
    </Card>
  )
}

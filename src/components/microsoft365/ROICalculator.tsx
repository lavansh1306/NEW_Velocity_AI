// src/components/microsoft365/ROICalculator.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiUrl } from '@/lib/api'

export default function ROICalculator() {
  const [beforeStart, setBeforeStart] = useState('')
  const [beforeEnd, setBeforeEnd] = useState('')
  const [afterStart, setAfterStart] = useState('')
  const [afterEnd, setAfterEnd] = useState('')
  const [costPerHour, setCostPerHour] = useState('50')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCalculateROI = async () => {
    if (!beforeStart || !beforeEnd || !afterStart || !afterEnd) {
      setError('Please fill in all date fields')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        beforeStart,
        beforeEnd,
        afterStart,
        afterEnd,
        costPerHour
      })
      const response = await fetch(apiUrl(`/api/microsoft365/roi?${params}`))
      if (!response.ok) {
        throw new Error('Failed to calculate ROI')
      }
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ROI Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="beforeStart">Before Period Start</Label>
            <Input
              id="beforeStart"
              type="datetime-local"
              value={beforeStart}
              onChange={(e) => setBeforeStart(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="beforeEnd">Before Period End</Label>
            <Input
              id="beforeEnd"
              type="datetime-local"
              value={beforeEnd}
              onChange={(e) => setBeforeEnd(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="afterStart">After Period Start</Label>
            <Input
              id="afterStart"
              type="datetime-local"
              value={afterStart}
              onChange={(e) => setAfterStart(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="afterEnd">After Period End</Label>
            <Input
              id="afterEnd"
              type="datetime-local"
              value={afterEnd}
              onChange={(e) => setAfterEnd(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="costPerHour">Cost Per Hour ($)</Label>
            <Input
              id="costPerHour"
              type="number"
              value={costPerHour}
              onChange={(e) => setCostPerHour(e.target.value)}
              min="0"
              step="10"
            />
          </div>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          onClick={handleCalculateROI}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Calculating...' : 'Calculate ROI'}
        </Button>

        {result && result.users && (
          <div className="space-y-4">
            <h3 className="font-semibold">Results</h3>
            {result.users.map((user: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p className="font-semibold">{user.displayName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Time Saved</p>
                    <p className="text-lg font-bold">{user.totalTimeSavedHours} hrs</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Money Saved</p>
                    <p className="text-lg font-bold text-green-600">
                      ${user.estimatedMoneySaved.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Meeting Time: {user.meetingTimeSavedHours} hrs</p>
                  <p>Email Time: {user.emailTimeSavedHours} hrs</p>
                  <p>Focus Gain: {user.focusGainHours} hrs</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

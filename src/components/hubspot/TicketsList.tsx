// src/components/hubspot/TicketsList.tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiUrl } from '@/lib/api'
import { hubspotFetch } from '@/lib/hubspot-fetch'
import { Ticket } from '@/lib/types'

export default function TicketsList() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await hubspotFetch(apiUrl('/api/hubspot/tickets'))
      if (!response.ok) throw new Error('Failed to fetch tickets')
      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Card><CardContent className="pt-6">Loading tickets...</CardContent></Card>
  if (error) return <Card><CardContent className="pt-6 text-destructive">Error: {error}</CardContent></Card>

  const getStatusColor = (status?: string) => {
    if (!status) return 'secondary'
    if (status.toLowerCase().includes('closed') || status.toLowerCase().includes('resolved')) return 'default'
    if (status.toLowerCase().includes('open') || status.toLowerCase().includes('new')) return 'outline'
    return 'secondary'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Tickets: {tickets.length}</CardTitle>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {tickets.map((ticket, index) => (
          <Card key={ticket.ticketId || `ticket-${index}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{ticket.subject || 'Untitled Ticket'}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">ID: {ticket.ticketId}</p>
                </div>
                <div className="flex gap-2">
                  {ticket.priority && (
                    <Badge 
                      variant={ticket.priority === 'HIGH' ? 'destructive' : 'secondary'}
                    >
                      {ticket.priority}
                    </Badge>
                  )}
                  <Badge variant={getStatusColor(ticket.stage)}>
                    {ticket.stage || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Pipeline</p>
                  <p className="font-semibold">{ticket.pipeline || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-semibold">
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Closed</p>
                  <p className="font-semibold">
                    {ticket.closedAt ? new Date(ticket.closedAt).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tickets.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No tickets found
          </CardContent>
        </Card>
      )}
    </div>
  )
}

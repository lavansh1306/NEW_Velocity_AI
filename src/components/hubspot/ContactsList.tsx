// src/components/hubspot/ContactsList.tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiUrl } from '@/lib/api'
import { hubspotFetch } from '@/lib/hubspot-fetch'
import { Contact } from '@/lib/types'

export default function ContactsList() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await hubspotFetch(apiUrl('/api/hubspot/contacts'))
      if (!response.ok) throw new Error('Failed to fetch contacts')
      const data = await response.json()
      setContacts(data.contacts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Card><CardContent className="pt-6">Loading contacts...</CardContent></Card>
  if (error) return <Card><CardContent className="pt-6 text-destructive">Error: {error}</CardContent></Card>

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Contacts: {contacts.length}</CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((contact, index) => (
          <Card key={contact.contactId || `contact-${index}`}>
            <CardContent className="pt-6">
              <p className="font-semibold">
                {contact.firstname} {contact.lastname}
              </p>
              <p className="text-sm text-muted-foreground">{contact.email || 'No email'}</p>
              <p className="text-xs text-muted-foreground mt-2">ID: {contact.contactId}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {contacts.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No contacts found
          </CardContent>
        </Card>
      )}
    </div>
  )
}

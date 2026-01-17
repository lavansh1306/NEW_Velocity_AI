// src/api/hubspot/routes.ts
import express, { Request, Response } from 'express'
import * as hubspotAuth from './auth.js'

const router = express.Router()

// Helper to get token from session or storeKey header
async function getToken(req: Request): Promise<string> {
  console.log('\n[getToken] === START TOKEN LOOKUP ===')
  console.log('[getToken] sessionID:', req.sessionID)
  console.log('[getToken] session.hubspotUserId:', req.session?.hubspotUserId)
  console.log('[getToken] session.hubspotStoreKey:', req.session?.hubspotStoreKey)
  console.log('[getToken] header x-hubspot-storekey:', req.headers['x-hubspot-storekey'])
  
  // First, try to get from session directly
  if (req.session?.hubspotUserId && req.session?.hubspotStoreKey) {
    const sessionStoreKey = req.session.hubspotStoreKey
    console.log('[getToken] Found storeKey in session:', sessionStoreKey)
    
    if (hubspotAuth.hubspotTokens.has(sessionStoreKey)) {
      const store = hubspotAuth.hubspotTokens.get(sessionStoreKey)!
      console.log('[getToken] ✓ Token found in store via session')
      console.log('[getToken] === END TOKEN LOOKUP ===\n')
      return store.accessToken
    }
  }
  
  // Fallback: try to get from storeKey header
  const storeKeyHeader = req.headers['x-hubspot-storekey'] as string
  if (storeKeyHeader) {
    console.log('[getToken] Trying header storeKey:', storeKeyHeader)
    if (hubspotAuth.hubspotTokens.has(storeKeyHeader)) {
      const store = hubspotAuth.hubspotTokens.get(storeKeyHeader)!
      console.log('[getToken] ✓ Token found in store via header')
      console.log('[getToken] === END TOKEN LOOKUP ===\n')
      return store.accessToken
    }
  }
  
  // No token found
  console.log('[getToken] ✗ No token found. Available storeKeys:', Array.from(hubspotAuth.hubspotTokens.keys()))
  console.log('[getToken] === END TOKEN LOOKUP ===\n')
  throw new Error('No authentication - please connect to HubSpot')
}

// GET /api/hubspot/auth/status
router.get('/auth/status', (req: Request, res: Response) => {
  console.log('[Auth Status] Session:', {
    userId: req.session?.hubspotUserId,
    hasStoreKey: !!req.session?.hubspotStoreKey,
    sessionID: req.sessionID
  })
  const isAuthenticated = !!(req.session?.hubspotUserId && hubspotAuth.getTokenForSession(req))
  res.json({
    authenticated: isAuthenticated,
    userId: req.session?.hubspotUserId || null,
    portalId: req.session?.hubspotPortalId || null
  })
})

// GET /api/hubspot/auth/connect
router.get('/auth/connect', hubspotAuth.login)

// GET /api/hubspot/auth/callback
router.get('/auth/callback', hubspotAuth.callback)

// GET /api/hubspot/auth/disconnect
router.get('/auth/disconnect', hubspotAuth.logout)

// GET /api/hubspot/deals
router.get('/deals', async (req: Request, res: Response) => {
  try {
    console.log('[Deals] Session check:', {
      sessionID: req.sessionID,
      userId: req.session?.hubspotUserId,
      storeKey: req.session?.hubspotStoreKey
    })
    
    const token = await getToken(req)
    
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=dealname,dealstage,amount,pipeline,closedate,createdate,hubspot_owner_id', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status}`)
    }

    const data = await response.json() as any
    const normalizedDeals = (data.results || []).map((deal: any) => ({
      dealId: deal.id,
      dealName: deal.properties?.dealname || '',
      stage: deal.properties?.dealstage || '',
      amount: deal.properties?.amount || 0,
      pipeline: deal.properties?.pipeline || '',
      closedAt: deal.properties?.closedate,
      createdAt: deal.properties?.createdate
    }))
    res.json({
      deals: normalizedDeals
    })
  } catch (err: any) {
    res.status(err.message.includes('authenticate') ? 401 : 500).json({ 
      error: err.message 
    })
  }
})

// GET /api/hubspot/contacts
router.get('/contacts', async (req: Request, res: Response) => {
  try {
    const token = await getToken(req)
    
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,phone', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status}`)
    }

    const data = await response.json() as any
    const normalizedContacts = (data.results || []).map((contact: any) => ({
      contactId: contact.id,
      firstname: contact.properties?.firstname || '',
      lastname: contact.properties?.lastname || '',
      email: contact.properties?.email || '',
      phone: contact.properties?.phone || ''
    }))
    res.json({
      contacts: normalizedContacts
    })
  } catch (err: any) {
    res.status(err.message.includes('authenticate') ? 401 : 500).json({ 
      error: err.message 
    })
  }
})

// GET /api/hubspot/campaigns
router.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const token = await getToken(req)
    
    const response = await fetch('https://api.hubapi.com/marketing/v3/campaigns?limit=100&orderBy=-updatedAt', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Campaigns API]', response.status, errorText)
      throw new Error(`HubSpot API error: ${response.status}`)
    }

    const data = await response.json() as any
    console.log('[Campaigns] Raw response:', JSON.stringify(data).substring(0, 500))
    
    const normalizedCampaigns = (data.results || data.campaigns || []).map((campaign: any) => ({
      campaignId: campaign.id,
      name: campaign.name,
      status: campaign.status,
      startDate: campaign.createdAt || campaign.startDate,
      endDate: campaign.updatedAt || campaign.endDate,
      visits: campaign.clicks || 0,
      conversions: campaign.conversions || 0
    }))
    res.json({
      campaigns: normalizedCampaigns
    })
  } catch (err: any) {
    res.status(err.message.includes('authenticate') ? 401 : 500).json({ 
      error: err.message 
    })
  }
})

// GET /api/hubspot/tickets
router.get('/tickets', async (req: Request, res: Response) => {
  try {
    const token = await getToken(req)
    
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/tickets?limit=100&properties=subject,hs_ticket_priority,hs_ticket_status,createdate', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status}`)
    }

    const data = await response.json() as any
    const normalizedTickets = (data.results || []).map((ticket: any) => ({
      ticketId: ticket.id,
      subject: ticket.properties?.subject || '',
      priority: ticket.properties?.hs_ticket_priority || '',
      status: ticket.properties?.hs_ticket_status || '',
      createdAt: ticket.properties?.createdate
    }))
    res.json({
      tickets: normalizedTickets
    })
  } catch (err: any) {
    res.status(err.message.includes('authenticate') ? 401 : 500).json({ 
      error: err.message 
    })
  }
})

// GET /api/hubspot/realization
router.get('/realization', async (req: Request, res: Response) => {
  try {
    const token = await getToken(req)
    
    // Fetch deals with AI value realization metrics
    const response = await fetch(
      'https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=dealname,dealstage,amount,closedate,createdate,hs_forecast_amount',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status}`)
    }

    const data = await response.json() as any
    
    // Calculate AI value realization metrics for each deal
    const normalizedDeals = (data.results || []).map((deal: any) => {
      const amount = Number(deal.properties?.amount || 0)
      const forecastAmount = Number(deal.properties?.hs_forecast_amount || amount)
      const createdAt = new Date(deal.properties?.createdate || Date.now())
      const closedAt = deal.properties?.closedate ? new Date(deal.properties?.closedate) : null
      
      // AI-powered metrics estimation
      // Estimate time saved through AI acceleration (typically 10-30% of deal cycle)
      const dealCycleDays = closedAt ? Math.floor((closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 30
      const timeSavedHours = Math.round((dealCycleDays * 8) * 0.15) // Assume 15% time savings, 8 hours/day
      
      // Revenue pull-forward from faster deal closure
      const revenuePullForward = Math.round(forecastAmount * 0.05) // Estimate 5% revenue acceleration
      
      return {
        id: deal.id,
        dealname: deal.properties?.dealname || 'Untitled',
        stage: deal.properties?.dealstage || '',
        amount: amount,
        timeSaved: {
          totalHours: timeSavedHours,
          totalDays: Math.floor(timeSavedHours / 24)
        },
        revenuePullForward: revenuePullForward,
        dealCycleDays: dealCycleDays,
        campaigns: [] // Could be enhanced to fetch associated campaigns
      }
    })
    
    res.json({
      deals: normalizedDeals
    })
  } catch (err: any) {
    res.status(err.message.includes('authenticate') ? 401 : 500).json({ 
      error: err.message 
    })
  }
})

// GET /api/hubspot/ai-metrics
// Returns aggregated AI metrics from all deals
router.get('/ai-metrics', async (req: Request, res: Response) => {
  console.log('\n===== AI METRICS ENDPOINT =====')
  
  try {
    const token = await getToken(req)
    console.log('[AI Metrics] ✓ Got valid token')
    
    const response = await fetch(
      'https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=dealname,dealstage,amount,closedate,createdate,hs_forecast_amount',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.log('[AI Metrics] ✗ HubSpot API error:', response.status, errorText)
      throw new Error(`HubSpot API error: ${response.status}`)
    }

    const data = await response.json() as any
    const deals = Array.isArray(data.results) ? data.results : []
    const dealCount = deals.length
    console.log('[AI Metrics] ✓ Got', dealCount, 'deals from HubSpot')
    
    let totalTimeSavedHours = 0
    let totalRevenueImpact = 0
    
    // Calculate metrics for each deal
    for (let i = 0; i < deals.length; i++) {
      const deal = deals[i]
      try {
        const props = deal.properties || {}
        const amount = Number(props.amount) || 0
        const forecastAmount = Number(props.hs_forecast_amount) || amount
        
        const createdAt = props.createdate ? new Date(props.createdate) : new Date()
        const closedAt = props.closedate ? new Date(props.closedate) : null
        
        let dealCycleDays = 30
        if (closedAt && createdAt) {
          const timeDiff = closedAt.getTime() - createdAt.getTime()
          dealCycleDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
        }
        
        const timeSavedHours = Math.round(dealCycleDays * 8 * 0.15)
        const revenuePullForward = Math.round(forecastAmount * 0.05)
        
        totalTimeSavedHours += timeSavedHours
        totalRevenueImpact += revenuePullForward
      } catch (dealErr) {
        console.log('[AI Metrics] Warning: Could not process deal', i, dealErr instanceof Error ? dealErr.message : dealErr)
      }
    }
    
    const metrics = {
      totalTimeSavedHours,
      totalTimeSavedDays: Math.floor(totalTimeSavedHours / 8 / 24),
      totalRevenueImpact,
      dealCount,
      averageTimeSavedPerDeal: dealCount > 0 ? Math.round(totalTimeSavedHours / dealCount) : 0
    }
    
    console.log('[AI Metrics] ✓ Calculated:', metrics)
    console.log('===== AI METRICS ENDPOINT END =====\n')
    
    res.json(metrics)
    
  } catch (err: any) {
    console.log('[AI Metrics] ✗ Error:', err.message)
    console.log('[AI Metrics] Stack:', err.stack)
    console.log('===== AI METRICS ENDPOINT END =====\n')
    
    // Return default metrics on error
    res.json({
      totalTimeSavedHours: 0,
      totalTimeSavedDays: 0,
      totalRevenueImpact: 0,
      dealCount: 0,
      averageTimeSavedPerDeal: 0
    })
  }
})

export default router

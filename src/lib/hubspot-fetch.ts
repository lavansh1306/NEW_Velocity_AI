/**
 * Helper to fetch HubSpot API endpoints with storeKey from localStorage
 */
export async function hubspotFetch(url: string, options?: RequestInit) {
  const storeKey = localStorage.getItem('hubspot_storeKey')
  
  console.log('[hubspotFetch] URL:', url)
  console.log('[hubspotFetch] storeKey from localStorage:', storeKey)
  
  const headers = {
    ...options?.headers,
  } as Record<string, string>
  
  if (storeKey) {
    headers['x-hubspot-storekey'] = storeKey  // Match the exact header name the backend expects (lowercase)
    console.log('[hubspotFetch] Setting header x-hubspot-storekey:', storeKey)
  }
  
  console.log('[hubspotFetch] Final headers:', headers)
  
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  })
}

/**
 * Helper to fetch HubSpot API endpoints with storeKey from localStorage
 */
export async function hubspotFetch(url: string, options?: RequestInit) {
  const storeKey = localStorage.getItem('hubspot_storeKey')
  
  const headers = {
    ...options?.headers,
  } as Record<string, string>
  
  if (storeKey) {
    headers['X-HubSpot-StoreKey'] = storeKey
  }
  
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  })
}

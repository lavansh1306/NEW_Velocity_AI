/**
 * Local Storage utility for managing application state persistence
 */

const STORAGE_KEYS = {
  JIRA_CONNECTED: 'jiraConnected',
} as const;

/**
 * Get the Jira connection status from localStorage
 * @returns {boolean} Jira connection status (defaults to true if not set)
 */
export const getJiraConnected = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.JIRA_CONNECTED);
    return stored !== null ? JSON.parse(stored) : true;
  } catch (error) {
    console.error('Failed to read Jira connection status from localStorage:', error);
    return true;
  }
};

/**
 * Set the Jira connection status in localStorage
 * @param {boolean} connected - The Jira connection status
 */
export const setJiraConnected = (connected: boolean): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.JIRA_CONNECTED, JSON.stringify(connected));
  } catch (error) {
    console.error('Failed to save Jira connection status to localStorage:', error);
  }
};

/**
 * Clear all application storage
 */
export const clearAppStorage = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear app storage:', error);
  }
};

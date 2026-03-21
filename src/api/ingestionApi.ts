const BASE_URL = import.meta.env.VITE_LLM_URL || 'http://127.0.0.1:8000';

export const ingestionApi = {
  syncMeet: async (userId: string, projectId: string) => {
    const res = await fetch(`${BASE_URL}/sync-latest-meet?user_id=${userId}&project_id=${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      if (res.status === 400) {
        throw new Error('AUTH_REQUIRED');
      }
      const text = await res.text();
      throw new Error(text || 'Failed to sync Google Drive');
    }
    return res.json();
  },

  syncEmail: async (userId: string, projectId: string) => {
    const res = await fetch(`${BASE_URL}/sync-latest-email?user_id=${userId}&project_id=${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      if (res.status === 400) {
        throw new Error('AUTH_REQUIRED');
      }
      const text = await res.text();
      throw new Error(text || 'Failed to sync Gmail');
    }
    return res.json();
  },

  getLoginUrl: (userId: string) => {
    return `${BASE_URL}/auth/google/login?user_id=${userId}`;
  }
};

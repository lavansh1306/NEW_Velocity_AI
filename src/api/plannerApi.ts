const BASE_URL = (import.meta.env.VITE_LLM_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');

export const plannerApi = {
  checkHealth: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/`);
      return res.ok;
    } catch {
      return false;
    }
  },

  decompose: async (description: string) => {
    const res = await fetch(`${BASE_URL}/api/v1/planner/decompose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_description: description }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Decomposition failed (${res.status})`);
    }
    return res.json();
  },

  allocate: async (payload: {
    org_id: string;
    start_date: string;
    end_date: string;
    tasks: Array<{
      task_name: string;
      estimated_hours: number;
      required_skills: string[];
      task_description?: string;
    }>;
  }) => {
    const res = await fetch(`${BASE_URL}/api/v1/planner/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Allocation failed (${res.status})`);
    }
    return res.json();
  },
};

const BASE_URL = import.meta.env.VITE_LLM_URL || '[http://127.0.0.1:8000](http://127.0.0.1:8000)';

export const plannerApi = {
  checkHealth: async () => {
    const res = await fetch(`${BASE_URL}/`);
    return res.ok;
  },
  
  decompose: async (description: string) => {
    const res = await fetch(`${BASE_URL}/api/v1/planner/decompose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_description: description }),
    });
    if (!res.ok) throw new Error('Decomposition failed');
    return res.json();
  }
};
import React, { useEffect, useState } from 'react';
import { loadProjects, getNormalizedEventsForProject } from '@/lib/dataService';
import type { ManualVsAutomatedByApp, NormalizedEvent } from '@/lib/types';

export default function DebugNormalization() {
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [selected, setSelected] = useState<string>('1');
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [breakdown, setBreakdown] = useState<ManualVsAutomatedByApp[] | null>(null);

  useEffect(() => {
    loadProjects().then((ps) => setProjects(ps.map((p) => ({ id: p.id, title: p.title }))));
  }, []);

  useEffect(() => {
    if (!selected) return;
    getNormalizedEventsForProject(selected).then((ev) => {
      setEvents(ev);
      // compute simple manual/automated breakdown per app
      const apps = ['Asana', 'Jira', 'Zapier', 'HubSpot', 'Microsoft365'] as const;
      const result = apps.map((app) => ({ app, manual: 0, automated: 0 })) as ManualVsAutomatedByApp[];
      const lookup = new Map(result.map((r) => [r.app, r]));
      for (const e of ev) {
        const entry = lookup.get(e.app as any);
        if (!entry) continue;
        if (e.actionType === 'automation') entry.automated += 1;
        else entry.manual += 1;
      }
      setBreakdown(result);
    });
  }, [selected]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Debug: Normalized events</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Project: </label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id} - {p.title}
            </option>
          ))}
        </select>
      </div>

      <h3>Summary</h3>
      {breakdown ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>App</th>
              <th style={{ textAlign: 'right' }}>Manual</th>
              <th style={{ textAlign: 'right' }}>Automated</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((b) => (
              <tr key={b.app}>
                <td>{b.app}</td>
                <td style={{ textAlign: 'right' }}>{b.manual}</td>
                <td style={{ textAlign: 'right' }}>{b.automated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>Loading...</div>
      )}

      <h3 style={{ marginTop: 18 }}>Sample normalized events (first 50)</h3>
      <pre style={{ maxHeight: 320, overflow: 'auto', background: '#f6f8fa', padding: 12 }}>
        {JSON.stringify(events.slice(0, 50), null, 2)}
      </pre>
    </div>
  );
}

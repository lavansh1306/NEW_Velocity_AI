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
    <div className="p-6 md:p-8">
      <h2 className="text-lg font-semibold mb-4">Debug: Normalized events</h2>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="text-sm">Project:</label>
        <select
          className="rounded border px-3 py-2 text-sm"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id} - {p.title}
            </option>
          ))}
        </select>
      </div>

      <h3 className="text-md font-medium mt-2 mb-2">Summary</h3>
      {breakdown ? (
        <div className="overflow-x-auto bg-white rounded-lg border p-2">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">App</th>
                <th className="text-right">Manual</th>
                <th className="text-right">Automated</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((b) => (
                <tr key={b.app} className="border-t">
                  <td className="py-2">{b.app}</td>
                  <td className="py-2 text-right">{b.manual}</td>
                  <td className="py-2 text-right">{b.automated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>Loading...</div>
      )}

      <h3 className="text-md font-medium mt-4 mb-2">Sample normalized events (first 50)</h3>
      <div className="max-h-80 overflow-auto rounded bg-gray-50 p-3">
        <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(events.slice(0, 50), null, 2)}</pre>
      </div>
    </div>
  );
}

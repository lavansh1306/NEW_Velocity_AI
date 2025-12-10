import { useState } from 'react';

export default function StandardTimeCatalogTab() {
  const [entries, setEntries] = useState([
    { taskName: 'Lead Triage & Initial Qualification', minutes: 1.5, category: 'Marketing', source: 'HubSpot', executions: 2847 },
    { taskName: 'Deal Stage Update in CRM', minutes: 2.0, category: 'Sales', source: 'HubSpot', executions: 1243 },
    { taskName: 'Meeting Notes Transcription', minutes: 8.0, category: 'Operations', source: 'MS 365', executions: 412 },
    { taskName: 'Customer Support Ticket Categorization', minutes: 3.5, category: 'Customer Success', source: 'Zendesk', executions: 1892 },
    { taskName: 'Weekly Report Generation', minutes: 45.0, category: 'Operations', source: 'Multiple', executions: 52 },
  ]);

  const [formData, setFormData] = useState({
    taskName: '',
    minutes: '',
    category: 'Marketing',
    source: '',
  });

  const addEntry = () => {
    if (!formData.taskName || !formData.minutes) {
      alert('Please fill in task name and standard time');
      return;
    }

    const newEntry = {
      taskName: formData.taskName,
      minutes: parseFloat(formData.minutes),
      category: formData.category,
      source: formData.source,
      executions: 0,
    };

    setEntries([newEntry, ...entries]);
    setFormData({ taskName: '', minutes: '', category: 'Marketing', source: '' });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Standard Time Catalog (STC)</h2>
        <p className="text-gray-600 mt-1">Admin Configuration Panel • Define standard minutes for repeatable tasks</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Add New Standard Task</h3>
          <button
            onClick={addEntry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            + Add Entry
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Task Name"
            value={formData.taskName}
            onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            placeholder="Standard Minutes"
            value={formData.minutes}
            onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option>Marketing</option>
            <option>Sales</option>
            <option>Operations</option>
            <option>Customer Success</option>
          </select>
          <input
            type="text"
            placeholder="Source System"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Task Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Standard Time</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Executions</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{entry.taskName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {entry.minutes} {entry.minutes === 1 ? 'minute' : 'minutes'}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">
                    {entry.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{entry.source}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-500">
                  {entry.executions.toLocaleString()} executions
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

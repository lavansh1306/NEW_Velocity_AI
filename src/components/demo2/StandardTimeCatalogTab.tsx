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
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Standard Time Catalog (STC)</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">Admin Configuration Panel • Define standard minutes for repeatable tasks</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Add New Standard Task</h3>
          <button
            onClick={addEntry}
            className="px-4 sm:px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 text-xs sm:text-sm flex-shrink-0 w-full sm:w-auto transition-colors"
          >
            + Add Entry
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="Task Name"
            value={formData.taskName}
            onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
            className="px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Standard Minutes"
            value={formData.minutes}
            onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
            className="px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-xs sm:text-sm\">
          <thead className="bg-gray-50 border-b border-gray-200\">
            <tr>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-bold text-gray-700 uppercase text-xs\">Task Name</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-bold text-gray-700 uppercase text-xs\">Standard Time</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-bold text-gray-700 uppercase text-xs\">Category</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-bold text-gray-700 uppercase text-xs\">Source</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-bold text-gray-700 uppercase text-xs hidden sm:table-cell\">Executions</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right font-bold text-gray-700 uppercase text-xs\">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 sm:px-6 py-2 sm:py-4 font-semibold text-gray-900">{entry.taskName}</td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-600">
                  {entry.minutes} {entry.minutes === 1 ? 'min' : 'min'}
                </td>
                <td className="px-3 sm:px-6 py-2 sm:py-4">
                  <span className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">
                    {entry.category}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-600 text-xs sm:text-sm">{entry.source}</td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 font-semibold text-gray-500 hidden sm:table-cell">
                  {entry.executions.toLocaleString()}
                </td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 text-right">
                  <button className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-semibold">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

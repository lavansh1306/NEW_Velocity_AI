import React, { useState } from 'react';
import { RecommendationCard } from './RecommendationCard';
import { PredictionResult, EmployeeRecord } from './types';
import { PieChart, CheckCircle2, AlertTriangle, Users, Plus, Search, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

interface ProjectCheckDashboardProps {
  results: PredictionResult[];
  fullDataset: EmployeeRecord[]; // Needed for manual search
  onConfirmProject: (selectedEmployees: EmployeeRecord[]) => void;
}

export const ProjectCheckDashboard: React.FC<ProjectCheckDashboardProps> = ({ results, fullDataset, onConfirmProject }) => {
  
  // --- STATE ---
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualAdds, setManualAdds] = useState<EmployeeRecord[]>([]);

  // --- HELPERS ---
  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleManualAdd = (employee: EmployeeRecord) => {
    if (!manualAdds.find(e => e.id === employee.id) && !results.find(r => r.employeeId === employee.id)) {
      setManualAdds([...manualAdds, employee]);
      setSelectedIds(prev => [...prev, employee.id]); // Auto-select added user
    }
    setSearchQuery(''); // Reset search
  };

  const handleCreate = () => {
    // 1. Gather all selected records (from AI results + Manual Adds)
    const aiSelected = results
      .filter(r => selectedIds.includes(r.employeeId))
      .map(r => fullDataset.find(e => e.id === r.employeeId)!) // Map back to full record
      .filter(Boolean);
    
    const manualSelected = manualAdds.filter(e => selectedIds.includes(e.id));
    
    const finalTeam = [...aiSelected, ...manualSelected];
    onConfirmProject(finalTeam);
  };

  // Filter for Manual Search (Exclude already displayed/added people)
  const searchResults = searchQuery.length > 2 
    ? fullDataset.filter(e => 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !results.some(r => r.employeeId === e.id) &&
        !manualAdds.some(m => m.id === e.id)
      ).slice(0, 5)
    : [];

  // Stats
  const highMatch = results.filter(r => r.score > 85).length;
  const mediumMatch = results.filter(r => r.score > 70 && r.score <= 85).length;

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. Summary Stats (Preserved) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600"><Users className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{results.length}</div>
            <div className="text-xs font-medium text-gray-500 uppercase">Candidates Found</div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600"><CheckCircle2 className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{highMatch}</div>
            <div className="text-xs font-medium text-gray-500 uppercase">Strong Matches (&gt;85%)</div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{mediumMatch}</div>
            <div className="text-xs font-medium text-gray-500 uppercase">Potential Fits</div>
          </div>
        </div>
      </div>

      {/* 2. AI Recommendations Grid */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-gray-400" />
          AI Recommendations
        </h3>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {results.map((res) => (
            <div 
              key={res.employeeId} 
              onClick={() => toggleSelection(res.employeeId)}
              className={`cursor-pointer transition-all border-2 rounded-xl relative ${selectedIds.includes(res.employeeId) ? 'border-indigo-600 bg-indigo-50/10' : 'border-transparent'}`}
            >
              {selectedIds.includes(res.employeeId) && (
                <div className="absolute top-[-10px] right-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
                  SELECTED
                </div>
              )}
              <RecommendationCard result={res} />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Manual Add Section */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          Add Other Team Members
        </h3>
        <p className="text-sm text-slate-500 mb-4">Search the full employee database to manually add resources.</p>
        
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          
          {/* Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
              {searchResults.map(emp => (
                <div 
                  key={emp.id}
                  onClick={() => handleManualAdd(emp)}
                  className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                >
                  <div>
                    <div className="font-bold text-sm text-slate-800">{emp.name}</div>
                    <div className="text-xs text-slate-500">{emp.role} • {emp.skills.slice(0, 2).join(', ')}</div>
                  </div>
                  <Plus className="w-4 h-4 text-indigo-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Display Manually Added Users */}
        {manualAdds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {manualAdds.map(emp => (
              <div key={emp.id} className="bg-white p-3 rounded-lg border border-indigo-100 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      {emp.name.substring(0,2).toUpperCase()}
                   </div>
                   <div>
                     <div className="font-bold text-sm">{emp.name}</div>
                     <div className="text-xs text-slate-500">Manually Added</div>
                   </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toggleSelection(emp.id)} className={selectedIds.includes(emp.id) ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}>
                  {selectedIds.includes(emp.id) ? 'Selected' : 'Select'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Sticky Footer for Action */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <div className="bg-white p-2 rounded-full shadow-2xl border border-slate-200 pointer-events-auto flex items-center gap-4 pl-6 animate-in slide-in-from-bottom-4">
          <div className="text-sm font-medium text-slate-600">
             <span className="font-bold text-indigo-600">{selectedIds.length}</span> members selected
          </div>
          <Button 
            onClick={handleCreate} 
            disabled={selectedIds.length === 0}
            className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 shadow-lg shadow-indigo-200"
          >
            Create Project & Sync Jira <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

    </div>
  );
};
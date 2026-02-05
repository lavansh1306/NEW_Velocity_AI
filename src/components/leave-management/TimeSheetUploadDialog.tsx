import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Task } from './types';

interface TimesheetUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (newTasks: Task[]) => void;
}

// --- SMART MAPPING LOGIC ---
const COLUMN_ALIASES = {
  projectName: ['project', 'proj', 'client', 'account'],
  taskName: ['task', 'activity', 'ticket', 'item', 'description', 'work'],
  assignee: ['assignee', 'employee', 'user', 'resource', 'person', 'name'],
  hours: ['hours', 'hrs', 'duration', 'time', 'spent', 'effort'],
  day: ['day', 'date', 'weekday']
};

export const TimesheetUploadDialog: React.FC<TimesheetUploadDialogProps> = ({ open, onOpenChange, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columnMap, setColumnMap] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          if (data.length === 0) throw new Error("File is empty");
          
          identifyColumns(data);
          setParsedData(data);
          setError(null);
        } catch (err) {
          console.error(err);
          setError("Failed to parse file. Please ensure it is a valid .csv or .xlsx file.");
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error('Failed to load xlsx library:', err);
      setError("Failed to load file processor. Please try again.");
    }
  };

  // The "AI" Logic: Guess which column maps to which internal field
  const identifyColumns = (data: any[]) => {
    const headers = Object.keys(data[0]).map(h => h.toLowerCase().trim());
    const newMap: any = {};

    Object.entries(COLUMN_ALIASES).forEach(([field, aliases]) => {
      // Find a header that includes any of the aliases
      const match = Object.keys(data[0]).find(header => 
        aliases.some(alias => header.toLowerCase().includes(alias))
      );
      if (match) newMap[field] = match;
    });

    setColumnMap(newMap);
  };

  const processAndImport = () => {
    // Convert raw data to Task objects using the map
    const newTasks: Task[] = parsedData.map((row, index) => {
      // Helper to parse Day (0-4) from string
      const rawDay = row[columnMap.day];
      let dayIndex = 0;
      if (typeof rawDay === 'string') {
        const lower = rawDay.toLowerCase();
        if (lower.includes('mon')) dayIndex = 0;
        else if (lower.includes('tue')) dayIndex = 1;
        else if (lower.includes('wed')) dayIndex = 2;
        else if (lower.includes('thu')) dayIndex = 3;
        else if (lower.includes('fri')) dayIndex = 4;
      } else if (typeof rawDay === 'number') {
        dayIndex = Math.min(4, Math.max(0, rawDay - 1));
      }

      return {
        id: Date.now() + index,
        projectName: row[columnMap.projectName] || "Unassigned Project",
        taskName: row[columnMap.taskName] || "Imported Task",
        assignee: row[columnMap.assignee] || "Unassigned",
        hours: Number(row[columnMap.hours]) || 0,
        day: dayIndex,
        requiredSkills: ["General"], // Default
        logs: [],
        totalLogged: 0,
        isReallocated: false,
        isCancelled: false
      };
    });

    onImport(newTasks);
    onOpenChange(false);
    setParsedData([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-50">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg"><FileSpreadsheet className="w-5 h-5 text-emerald-600"/></div>
            <div>
              <DialogTitle className="text-xl">Import Timesheets</DialogTitle>
              <DialogDescription>Supports .xlsx and .csv. Auto-detects column names.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 1. Upload Area */}
          {!parsedData.length && (
            <div 
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-slate-400 mb-3" />
              <p className="text-sm font-bold text-slate-700">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-400 mt-1">Excel or CSV formats accepted</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {/* 2. Mapping Review */}
          {parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                <h4 className="text-xs font-black uppercase text-slate-500 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500"/> System Auto-Mapping
                </h4>
                <div className="grid gap-2 text-sm">
                  {Object.entries(columnMap).map(([field, header]) => (
                    <div key={field} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                      <span className="font-mono text-slate-500 capitalize">{field}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                      <span className="font-bold text-indigo-700">{String(header)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center px-2">
                <span className="text-sm text-slate-500">Found <b>{parsedData.length}</b> rows</span>
                <Button variant="ghost" className="text-xs text-red-500 hover:text-red-600" onClick={() => setParsedData([])}>
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700" 
            disabled={parsedData.length === 0}
            onClick={processAndImport}
          >
            Import {parsedData.length} Tasks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

//issue test
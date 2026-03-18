import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { fileParsingService, ParsedTask, ParsedProjectData } from '@/services/fileParsingService';

interface TaskUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksImported: (tasks: ParsedTask[], projectName?: string, projectDescription?: string) => void;
  employees: any[];
}

export const TaskUploadDialog: React.FC<TaskUploadDialogProps> = ({
  isOpen,
  onClose,
  onTasksImported,
  employees,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedProjectData | null>(null);
  const [editedTasks, setEditedTasks] = useState<ParsedTask[]>([]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    setIsParsing(true);

    try {
      const data = await fileParsingService.parseFile(file);
      setParsedData(data);
      setEditedTasks(data.tasks);
    } catch (err: any) {
      setError(err.message || 'Failed to parse file');
    } finally {
      setIsUploading(false);
      setIsParsing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTaskChange = (index: number, field: keyof ParsedTask, value: string) => {
    const newTasks = [...editedTasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setEditedTasks(newTasks);
  };

  const handleRemoveTask = (index: number) => {
    if (editedTasks.length > 1) {
      setEditedTasks(editedTasks.filter((_, i) => i !== index));
    }
  };

  const handleAddTasks = () => {
    if (editedTasks.length === 0) {
      setError('Please ensure at least one task is present');
      return;
    }

    onTasksImported(
      editedTasks,
      parsedData?.projectName,
      parsedData?.projectDescription
    );
    
    // Reset
    setParsedData(null);
    setEditedTasks([]);
    setError(null);
    onClose();
  };

  const handleClose = () => {
    setParsedData(null);
    setEditedTasks([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Project Tasks</DialogTitle>
          <DialogDescription>
            Import tasks from CSV, XLSX, or PDF files. The file will be analyzed by AI to extract and structure task information.
          </DialogDescription>
        </DialogHeader>

        {!parsedData ? (
          <div className="space-y-4 py-4">
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#E7E5E4] rounded-xl p-8 cursor-pointer hover:bg-[#FAFAF9] transition-colors bg-white"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />

              <div className="flex flex-col items-center gap-3">
                {isUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-[#0F766E] animate-spin" />
                    <p className="text-sm font-medium text-[#1C1917]">
                      Parsing your file with AI...
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-[#78716C]" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-[#1C1917]">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-[#A8A29E] mt-1">
                        CSV, XLSX, or PDF files (Max. 10MB)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="text-xs text-[#A8A29E] space-y-1">
              <p className="font-medium">Supported formats:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>CSV with task name, assignee, hours, dates, timeline</li>
                <li>Excel spreadsheets with task information</li>
                <li>PDF documents with project scope or task lists</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {parsedData.projectName && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#1C1917]">
                  Project Name (from file)
                </label>
                <input
                  type="text"
                  value={parsedData.projectName}
                  onChange={(e) =>
                    setParsedData({ ...parsedData, projectName: e.target.value })
                  }
                  className="w-full h-10 px-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F766E] text-[#1C1917]"
                />
              </div>
            )}

            {parsedData.projectDescription && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#1C1917]">
                  Description (from file)
                </label>
                <textarea
                  value={parsedData.projectDescription}
                  onChange={(e) =>
                    setParsedData({
                      ...parsedData,
                      projectDescription: e.target.value,
                    })
                  }
                  className="w-full h-20 px-3 py-2 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F766E] text-[#1C1917] resize-none"
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-[#1C1917]">
                  Parsed Tasks ({editedTasks.length})
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditedTasks([]);
                    setParsedData(null);
                  }}
                  className="text-[#78716C] hover:text-[#1C1917]"
                >
                  Upload Different File
                </Button>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider bg-[#FAFAF9] rounded-lg">
                <div className="col-span-3">Task Name</div>
                <div className="col-span-2">Assignee</div>
                <div className="col-span-1">Hours</div>
                <div className="col-span-2">Start Date</div>
                <div className="col-span-2">Due Date</div>
                <div className="col-span-2">Timeline</div>
              </div>

              {/* Tasks list */}
              <div className="space-y-2 max-h-96 overflow-y-auto border border-[#E7E5E4] rounded-lg">
                {editedTasks.map((task, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 px-3 py-2 bg-white items-center border-b border-[#E7E5E4] last:border-b-0"
                  >
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) =>
                          handleTaskChange(index, 'name', e.target.value)
                        }
                        placeholder="Task name"
                        className="w-full text-xs bg-transparent focus:outline-none text-[#1C1917] placeholder:text-[#A8A29E] border-b border-transparent hover:border-[#E7E5E4] focus:border-[#1C1917]"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={task.assignee}
                        onChange={(e) =>
                          handleTaskChange(index, 'assignee', e.target.value)
                        }
                        className="w-full text-xs bg-transparent focus:outline-none text-[#78716C] border-b border-transparent hover:border-[#E7E5E4] focus:border-[#1C1917]"
                      >
                        <option value="Unassigned">Unassigned</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.name}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        min="0"
                        value={task.hours}
                        onChange={(e) =>
                          handleTaskChange(index, 'hours', e.target.value)
                        }
                        placeholder="0"
                        className="w-full text-xs bg-transparent focus:outline-none text-[#1C1917] border-b border-transparent hover:border-[#E7E5E4] focus:border-[#1C1917]"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="date"
                        value={task.startDate}
                        onChange={(e) =>
                          handleTaskChange(index, 'startDate', e.target.value)
                        }
                        className="w-full text-xs bg-transparent focus:outline-none text-[#1C1917] border-b border-transparent hover:border-[#E7E5E4] focus:border-[#1C1917]"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="date"
                        value={task.dueDate}
                        onChange={(e) =>
                          handleTaskChange(index, 'dueDate', e.target.value)
                        }
                        className="w-full text-xs bg-transparent focus:outline-none text-[#1C1917] border-b border-transparent hover:border-[#E7E5E4] focus:border-[#1C1917]"
                      />
                    </div>
                    <div className="col-span-2 flex justify-between items-center">
                      <input
                        type="text"
                        value={task.timeline}
                        onChange={(e) =>
                          handleTaskChange(index, 'timeline', e.target.value)
                        }
                        placeholder="Week 1"
                        className="w-full text-xs bg-transparent focus:outline-none text-[#1C1917] placeholder:text-[#A8A29E] border-b border-transparent hover:border-[#E7E5E4] focus:border-[#1C1917]"
                      />
                      <button
                        onClick={() => handleRemoveTask(index)}
                        disabled={editedTasks.length <= 1}
                        className="text-rose-400 hover:text-rose-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors ml-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleClose}>
            {parsedData ? 'Cancel' : 'Close'}
          </Button>
          {parsedData && (
            <Button
              onClick={handleAddTasks}
              disabled={editedTasks.length === 0}
              className="bg-[#0F766E] text-white hover:bg-[#0D635E]"
            >
              Add {editedTasks.length} Task{editedTasks.length !== 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

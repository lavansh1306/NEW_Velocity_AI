import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, AlertCircle, FileUp, Check } from 'lucide-react';
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-[#E7E5E4]">
        <DialogHeader className="border-b border-[#E7E5E4] pb-4">
          <DialogTitle className="text-2xl font-light text-[#1C1917] tracking-tight">Upload Project Tasks</DialogTitle>
          <DialogDescription className="text-[#78716C] leading-relaxed">
            Import tasks from CSV, XLSX, or PDF files. Our AI will intelligently extract and structure the task information.
          </DialogDescription>
        </DialogHeader>

        {!parsedData ? (
          <div className="space-y-5 py-6">
            {error && (
              <div className="flex gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-rose-900">Error Parsing File</p>
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              </div>
            )}

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#E7E5E4] rounded-2xl p-12 cursor-pointer hover:bg-[#FAFAF9] hover:border-[#0F766E]/30 transition-all bg-white group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />

              <div className="flex flex-col items-center gap-4">
                {isUploading ? (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#0F766E]/10 rounded-full animate-pulse" />
                      <Loader2 className="w-12 h-12 text-[#0F766E] animate-spin relative" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[#1C1917]">Parsing your file with AI...</p>
                      <p className="text-xs text-[#A8A29E] mt-1">This may take a few seconds</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-[#FAFAF9] rounded-xl group-hover:bg-[#0F766E]/10 transition-colors">
                      <FileUp className="w-8 h-8 text-[#0F766E]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[#1C1917]">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-[#A8A29E] mt-2">
                        CSV, XLSX, or PDF files up to 10MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Supported Formats Info */}
            <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Supported Formats</p>
              <ul className="text-xs text-[#78716C] space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#0F766E] rounded-full" />
                  CSV with task name, assignee, hours, dates, timeline
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#0F766E] rounded-full" />
                  Excel spreadsheets with task information
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#0F766E] rounded-full" />
                  PDF documents with project scope or task lists
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-6">
            {error && (
              <div className="flex gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            {/* Project Details from File */}
            {parsedData.projectName && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#A8A29E] uppercase tracking-wider">
                  Project Name (Detected)
                </label>
                <input
                  type="text"
                  value={parsedData.projectName}
                  onChange={(e) =>
                    setParsedData({ ...parsedData, projectName: e.target.value })
                  }
                  className="w-full h-11 px-4 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F766E] text-[#1C1917] placeholder:text-[#A8A29E] transition-all"
                />
              </div>
            )}

            {parsedData.projectDescription && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#A8A29E] uppercase tracking-wider">
                  Description (Detected)
                </label>
                <textarea
                  value={parsedData.projectDescription}
                  onChange={(e) =>
                    setParsedData({
                      ...parsedData,
                      projectDescription: e.target.value,
                    })
                  }
                  className="w-full h-20 px-4 py-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F766E] text-[#1C1917] placeholder:text-[#A8A29E] resize-none transition-all"
                />
              </div>
            )}

            {/* Tasks Section */}
            <div className="space-y-3 border-t border-[#E7E5E4] pt-5">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-[#1C1917]">Parsed Tasks</h3>
                  <p className="text-xs text-[#A8A29E] mt-1">
                    Review and edit tasks before importing ({editedTasks.length} task{editedTasks.length !== 1 ? 's' : ''})
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditedTasks([]);
                    setParsedData(null);
                  }}
                  className="text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAFAF9] h-8"
                >
                  <FileUp className="w-4 h-4 mr-1" />
                  Upload Different File
                </Button>
              </div>

              {/* Column Headers */}
              <div className="grid grid-cols-12 gap-3 px-4 py-3 text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider bg-[#FAFAF9] rounded-xl sticky top-0 z-10">
                <div className="col-span-3">Task Name</div>
                <div className="col-span-2">Assignee</div>
                <div className="col-span-1">Hours</div>
                <div className="col-span-2">Start Date</div>
                <div className="col-span-2">Due Date</div>
                <div className="col-span-2">Timeline</div>
              </div>

              {/* Tasks List */}
              <div className="space-y-1 max-h-96 overflow-y-auto border border-[#E7E5E4] rounded-xl bg-white">
                {editedTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-[#A8A29E]">
                    <p className="text-sm">No tasks to display</p>
                  </div>
                ) : (
                  editedTasks.map((task, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-[#FAFAF9] border-b border-[#E7E5E4] last:border-b-0 transition-colors"
                    >
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={task.name}
                          onChange={(e) =>
                            handleTaskChange(index, 'name', e.target.value)
                          }
                          placeholder="Task name"
                          className="w-full text-sm bg-transparent focus:outline-none text-[#1C1917] placeholder:text-[#A8A29E] font-medium"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={task.assignee}
                          onChange={(e) =>
                            handleTaskChange(index, 'assignee', e.target.value)
                          }
                          className="w-full text-sm bg-transparent focus:outline-none text-[#78716C] cursor-pointer"
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
                          className="w-full text-sm bg-transparent focus:outline-none text-[#1C1917] text-center placeholder:text-[#A8A29E]"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="date"
                          value={task.startDate}
                          onChange={(e) =>
                            handleTaskChange(index, 'startDate', e.target.value)
                          }
                          className="w-full text-sm bg-transparent focus:outline-none text-[#1C1917]"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="date"
                          value={task.dueDate}
                          onChange={(e) =>
                            handleTaskChange(index, 'dueDate', e.target.value)
                          }
                          className="w-full text-sm bg-transparent focus:outline-none text-[#1C1917]"
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
                          className="w-full text-sm bg-transparent focus:outline-none text-[#1C1917] placeholder:text-[#A8A29E]"
                        />
                        <button
                          onClick={() => handleRemoveTask(index)}
                          disabled={editedTasks.length <= 1}
                          className="text-rose-400 hover:text-rose-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors ml-2"
                          title="Remove task"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-[#E7E5E4] pt-4 gap-2">
          <Button 
            variant="ghost" 
            onClick={handleClose}
            className="text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAFAF9] h-11 rounded-lg"
          >
            {parsedData ? 'Cancel' : 'Close'}
          </Button>
          {parsedData && (
            <Button
              onClick={handleAddTasks}
              disabled={editedTasks.length === 0}
              className="bg-[#0F766E] hover:bg-[#0D635E] text-white px-6 h-11 rounded-lg gap-2 disabled:opacity-50 font-medium"
            >
              <Check className="w-4 h-4" />
              Add {editedTasks.length} Task{editedTasks.length !== 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

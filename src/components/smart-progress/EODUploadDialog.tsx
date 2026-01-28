import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea'; // Assuming you have this or standard <textarea>
import { FileText, Loader2, UploadCloud } from 'lucide-react';

interface EODUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  scope: string[];
  onAnalyze: (content: string) => void;
  isAnalyzing: boolean;
}

export const EODUploadDialog: React.FC<EODUploadDialogProps> = ({ 
  open, onOpenChange, taskName, scope, onAnalyze, isAnalyzing 
}) => {
  const [content, setContent] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Submit EOD Report</DialogTitle>
          <DialogDescription>
            Upload your daily work log for <strong>{taskName}</strong>. The AI will verify progress against the assigned scope.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Scope Reminder */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Assigned Subtasks:</h4>
            <ul className="list-disc list-inside text-sm text-slate-700">
              {scope.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>

          {/* Input Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Work Log / Commit Message</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
              placeholder="e.g. Completed the Login API and fixed the Auth bugs. Still working on the Dashboard..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={() => onAnalyze(content)} 
            disabled={!content.trim() || isAnalyzing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
            ) : (
              <><UploadCloud className="w-4 h-4 mr-2" /> Submit EOD</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { CheckCircle2, Copy, FileJson } from 'lucide-react';

interface JsonOutputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
}

export const JsonOutputDialog: React.FC<JsonOutputDialogProps> = ({ open, onOpenChange, data }) => {
  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    alert("Copied to clipboard!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg"><CheckCircle2 className="w-6 h-6 text-emerald-600"/></div>
            <div>
              <DialogTitle>Project Created Successfully</DialogTitle>
              <DialogDescription>
                The following payload is ready to be sent to the Jira API.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-slate-950 p-4 rounded-lg border border-slate-800 relative mt-4">
          <button 
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
            title="Copy JSON"
          >
            <Copy className="w-4 h-4" />
          </button>
          <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
            {jsonString}
          </pre>
        </div>

        <DialogFooter className="mt-4">
          <Button onClick={() => onOpenChange(false)} className="bg-slate-900 text-white hover:bg-slate-800">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
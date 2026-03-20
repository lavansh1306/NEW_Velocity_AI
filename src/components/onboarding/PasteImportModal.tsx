import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ParsedMember {
  name: string;
  email: string;
  role: string;
}

interface Props {
  onImport: (members: ParsedMember[]) => void;
  onClose: () => void;
}

export default function PasteImportModal({ onImport, onClose }: Props) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedMember[]>([]);

  const handleTextChange = (value: string) => {
    setText(value);

    if (!value.trim()) {
      setPreview([]);
      return;
    }

    const lines = value.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) {
      setPreview([]);
      return;
    }

    // Detect if first line is a header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('name') || firstLine.includes('email');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const parsed = dataLines.map(line => {
      // Support tab, comma, or pipe separated
      const parts = line.split(/\t|,|\|/).map(p => p.trim());
      return {
        name: parts[0] || '',
        email: parts[1] || '',
        role: parts[2] || 'Engineer',
      };
    }).filter(m => m.name || m.email);

    setPreview(parsed);
  };

  const handleImport = () => {
    if (preview.length === 0) return;
    onImport(preview);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7E5E4] flex items-center justify-between">
          <h2 className="text-base font-medium text-[#1C1917]">Paste Team Data</h2>
          <button onClick={onClose} className="text-[#A8A29E] hover:text-[#1C1917] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <p className="text-sm text-[#78716C] font-light">
            Paste data from Excel, Google Sheets, or any spreadsheet. Use tab, comma, or pipe to separate columns.
          </p>
          <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2.5">
            <div className="text-[11px] font-medium text-[#78716C] mb-1">Format</div>
            <code className="text-[11px] text-[#57534E] font-mono">Name, Email, Role</code>
          </div>

          <textarea
            className="w-full h-40 p-3 border border-[#E7E5E4] bg-white rounded-lg font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] placeholder:text-[#D6D3D1]"
            placeholder={`Jane Doe\tjane@company.com\tEngineer\nBob Smith\tbob@company.com\tDesigner`}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            autoFocus
          />

          {preview.length > 0 && (
            <div className="bg-[#F0FDFA] border border-[#CCFBF1] rounded-lg p-3">
              <div className="text-xs font-medium text-[#134E4A] mb-2">
                {preview.length} member{preview.length !== 1 ? 's' : ''} detected
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {preview.slice(0, 8).map((m, i) => (
                  <div key={i} className="text-[11px] text-[#57534E] flex gap-3">
                    <span className="font-medium w-28 truncate">{m.name}</span>
                    <span className="text-[#78716C] w-40 truncate">{m.email}</span>
                    <span className="text-[#A8A29E] truncate">{m.role}</span>
                  </div>
                ))}
                {preview.length > 8 && (
                  <div className="text-[11px] text-[#A8A29E]">...and {preview.length - 8} more</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E7E5E4] flex gap-3 justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="h-9 px-5 border-[#E7E5E4] text-[#57534E] font-normal"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={preview.length === 0}
            className="h-9 px-5 bg-[#1C1917] hover:bg-[#292524] text-white font-normal disabled:opacity-40"
          >
            Import {preview.length > 0 ? `${preview.length} Members` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}

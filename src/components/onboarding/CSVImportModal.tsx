import { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, FileText, Download, ClipboardPaste, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { getSkillsForRole } from '@/services/skillSuggester';
import { toast } from 'sonner';

interface ParsedMember {
  name: string;
  email: string;
  role: string;
  skills: string[];
}

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (members: ParsedMember[]) => void;
}

const HEADER_ALIASES: Record<string, string[]> = {
  name: ['name', 'full_name', 'fullname', 'member', 'employee'],
  email: ['email', 'email_address', 'emailaddress', 'mail'],
  role: ['role', 'title', 'job_title', 'jobtitle', 'position'],
  skills: ['skills', 'skill', 'technologies', 'tech'],
};

function mapHeader(raw: string): string | null {
  const normalized = raw.toLowerCase().trim().replace(/[^a-z_]/g, '');
  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(normalized)) return canonical;
  }
  return null;
}

function parseSkillsString(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[;,]/)
    .map(s => s.trim())
    .filter(Boolean);
}

export default function CSVImportModal({ open, onOpenChange, onImport }: CSVImportModalProps) {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [preview, setPreview] = useState<ParsedMember[]>([]);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setPreview([]);
    setPasteText('');
    setFileName('');
    setMode('upload');
  };

  const parseCSVText = (text: string) => {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });

    if (result.errors.length > 0) {
      toast.error('CSV parsing error: ' + result.errors[0].message);
      return;
    }

    const rows = result.data as Record<string, string>[];
    if (rows.length === 0) {
      toast.error('No data rows found');
      return;
    }

    // Map headers
    const headerMap: Record<string, string> = {};
    const rawHeaders = result.meta.fields || [];
    for (const h of rawHeaders) {
      const mapped = mapHeader(h);
      if (mapped) headerMap[h] = mapped;
    }

    const members: ParsedMember[] = rows
      .map(row => {
        const mapped: Record<string, string> = {};
        for (const [rawKey, value] of Object.entries(row)) {
          const canonical = headerMap[rawKey];
          if (canonical) mapped[canonical] = value;
        }

        const name = (mapped.name || '').trim();
        const email = (mapped.email || '').trim();
        const role = (mapped.role || 'Engineer').trim();
        const skills = mapped.skills
          ? parseSkillsString(mapped.skills)
          : getSkillsForRole(role);

        return { name, email, role, skills };
      })
      .filter(m => m.name || m.email);

    if (members.length === 0) {
      toast.error('No valid members found. Ensure CSV has name/email columns.');
      return;
    }

    setPreview(members);
  };

  const parseXLSXData = (json: any[][]) => {
    if (json.length === 0) {
      toast.error('No data rows found in Excel sheet');
      return;
    }
    const rawHeaders = json[0] as string[];
    const rows = json.slice(1) as any[][];

    // Map headers
    const headerMap: Record<number, string> = {};
    rawHeaders.forEach((h, i) => {
      if (!h) return;
      const mapped = mapHeader(String(h));
      if (mapped) headerMap[i] = mapped;
    });

    const members: ParsedMember[] = rows
      .map(row => {
        const mapped: Record<string, string> = {};
        row.forEach((value, i) => {
          const canonical = headerMap[i];
          if (canonical && value !== undefined && value !== null) {
            mapped[canonical] = String(value);
          }
        });

        const name = (mapped.name || '').trim();
        const email = (mapped.email || '').trim();
        const role = (mapped.role || 'Engineer').trim();
        const skills = mapped.skills
          ? parseSkillsString(mapped.skills)
          : getSkillsForRole(role);

        return { name, email, role, skills };
      })
      .filter(m => m.name || m.email);

    if (members.length === 0) {
      toast.error('No valid members found. Ensure sheet has name/email columns.');
      return;
    }

    setPreview(members);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsv = file.name.endsWith('.csv') || file.type.includes('text');

    if (!isCsv && !isExcel) {
      toast.error('Please upload a valid CSV or Excel file');
      return;
    }

    setFileName(file.name);

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          parseXLSXData(json as any[][]);
        } catch (err) {
          toast.error('Failed to parse Excel file');
          console.error('[CSVImportModal] Excel parse err:', err);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (content) parseCSVText(content);
      };
      reader.readAsText(file);
    }

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handlePasteChange = (text: string) => {
    setPasteText(text);
    if (text.trim()) {
      parseCSVText(text);
    } else {
      setPreview([]);
    }
  };

  const handleImport = () => {
    if (preview.length === 0) return;
    onImport(preview);
    resetState();
    onOpenChange(false);
  };

  const downloadSampleCSV = () => {
    const sampleData = `name,email,role,skills
John Doe,john.doe@company.com,Frontend Developer,React;TypeScript;CSS
Jane Smith,jane.smith@company.com,Backend Developer,Node.js;Python;PostgreSQL
Bob Johnson,bob.johnson@company.com,Product Designer,Figma;Design Systems;UI/UX`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_team_members.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#1C1917] font-medium">Import Team Members from File</DialogTitle>
          <DialogDescription className="text-[#78716C]">
            Upload a CSV / Excel file or paste values to import team members.
          </DialogDescription>
        </DialogHeader>

        {/* Mode tabs */}
        <div className="flex gap-2 border-b border-[#E7E5E4] pb-3">
          <button
            onClick={() => { setMode('upload'); setPreview([]); setPasteText(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 ${
              mode === 'upload'
                ? 'bg-[#1C1917] text-white shadow-sm'
                : 'text-[#78716C] hover:bg-[#F5F5F4]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>
          <button
            onClick={() => { setMode('paste'); setPreview([]); setFileName(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 ${
              mode === 'paste'
                ? 'bg-[#1C1917] text-white shadow-sm'
                : 'text-[#78716C] hover:bg-[#F5F5F4]'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            Paste Data
          </button>
        </div>

        {/* Upload mode */}
        {mode === 'upload' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-[#E7E5E4] rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-[#0F766E]/40 hover:bg-[#F0FDFA]/30 transition-all duration-300 cursor-pointer"
            >
              <Upload className="w-8 h-8 text-[#D6D3D1]" />
              {fileName ? (
                <div className="flex items-center gap-2 text-sm text-[#1C1917]">
                  <FileText className="w-4 h-4" />
                  {fileName}
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#78716C]">Click to browse or drag a file</p>
                  <p className="text-xs text-[#A8A29E]">Accepts .csv, .xlsx, .xls files</p>
                </>
              )}
            </button>
          </div>
        )}

        {/* Paste mode */}
        {mode === 'paste' && (
          <textarea
            value={pasteText}
            onChange={(e) => handlePasteChange(e.target.value)}
            placeholder={`name,email,role,skills\nJohn Doe,john@company.com,Engineer,React;Node.js`}
            className="w-full h-32 border border-[#E7E5E4] rounded-lg p-3 text-sm font-mono text-[#1C1917] placeholder:text-[#D6D3D1] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]/40 resize-none"
          />
        )}

        {/* Download sample */}
        <button
          onClick={downloadSampleCSV}
          className="flex items-center gap-1.5 text-xs text-[#0F766E] hover:underline self-start"
        >
          <Download className="w-3.5 h-3.5" />
          Download sample CSV
        </button>

        {/* Preview table */}
        {preview.length > 0 && (
          <div className="border border-[#E7E5E4] rounded-xl overflow-hidden">
            <div className="bg-[#FAFAF9] px-3 py-2 text-xs font-medium text-[#78716C] border-b border-[#E7E5E4]">
              Preview ({preview.length} member{preview.length !== 1 ? 's' : ''})
            </div>
            <div className="max-h-48 overflow-y-auto overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E7E5E4] bg-[#FAFAF9]/50">
                    <th className="text-left px-3 py-2 text-xs font-medium text-[#78716C]">Name</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-[#78716C]">Email</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-[#78716C]">Role</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-[#78716C]">Skills</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((m, i) => (
                    <tr key={i} className="border-b border-[#E7E5E4] last:border-b-0 hover:bg-[#FAFAF9] transition-colors">
                      <td className="px-3 py-2 text-[#1C1917]">{m.name || '—'}</td>
                      <td className="px-3 py-2 text-[#57534E]">{m.email || '—'}</td>
                      <td className="px-3 py-2 text-[#57534E]">{m.role}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {m.skills.slice(0, 3).map((s, j) => (
                            <span key={j} className="bg-[#F0FDFA] text-[#0F766E] text-[10px] px-1.5 py-0.5 rounded-full">
                              {s}
                            </span>
                          ))}
                          {m.skills.length > 3 && (
                            <span className="text-[10px] text-[#A8A29E]">+{m.skills.length - 3}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { resetState(); onOpenChange(false); }}
            className="border-[#E7E5E4] text-[#57534E] rounded-xl h-11 transition-all duration-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={preview.length === 0}
            className="bg-[#1C1917] hover:bg-[#292524] text-white rounded-xl h-11 shadow-sm transition-all duration-300 gap-2"
          >
            <Users className="w-4 h-4" />
            Import {preview.length} Member{preview.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

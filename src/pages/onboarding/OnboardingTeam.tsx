import { useState, useRef, useEffect } from 'react';
import { useVoice } from '@/contexts/VoiceContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X, Plus, Loader2, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { toast } from 'sonner';
import TeamInviteBanner from '@/components/onboarding/TeamInviteBanner';
import PasteImportModal from '@/components/onboarding/PasteImportModal';
import JiraImportModal from '@/components/onboarding/JiraImportModal';
import { getSkillsForRole } from '@/services/skillSuggester';

const PREDEFINED_ROLES = [
  "Engineer",
  "Designer",
  "Product Manager",
  "Engineering Manager",
  "QA Engineer",
  "Data Scientist",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer"
];

export default function OnboardingTeam() {
  const navigate = useNavigate();
  const { saveTeamMembers, loading, error, clearError, inviteCode, orgName } = useOnboarding();
  const [members, setMembers] = useState<Array<{ name: string; email: string; role: string; type?: string; skills: string[] }>>([
    { name: '', email: '', role: 'Engineer', type: 'employee', skills: getSkillsForRole('Engineer') },
    { name: '', email: '', role: 'Engineer', type: 'employee', skills: getSkillsForRole('Engineer') },
    { name: '', email: '', role: 'Engineer', type: 'employee', skills: getSkillsForRole('Engineer') },
  ]);
  const [openRoleDropdown, setOpenRoleDropdown] = useState<number | null>(null);
  const [activeSkillInput, setActiveSkillInput] = useState<number | null>(null);
  const [newSkillText, setNewSkillText] = useState<string>('');
  const [isCSVMode, setIsCSVMode] = useState(false);
  const [csvData, setCSVData] = useState<string>('');
  const [csvInputMode, setCSVInputMode] = useState<'upload' | 'paste'>('upload');
  const [importModal, setImportModal] = useState<'paste' | 'jira' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isListening, status, startListening, stopListening } = useVoice();

  // Handle voice actions via event delegation
  useEffect(() => {
    const handleAddVoiceMember = (e: any) => {
      const { name, email, role } = e.detail;
      console.log('[OnboardingTeam] Voice member addition:', { name, email, role });
      
      const newMember = {
        name: name || '',
        email: email || '',
        role: role || 'Engineer',
        type: 'employee',
        skills: getSkillsForRole(role || 'Engineer')
      };
      
      setMembers(prev => {
        // Find if there's an empty row to replace, otherwise append
        const emptyIdx = prev.findIndex(m => !m.name && !m.email);
        if (emptyIdx !== -1) {
          const updated = [...prev];
          updated[emptyIdx] = newMember;
          return updated;
        }
        return [...prev, newMember];
      });
      
      toast.success(`Added ${name || 'new member'}!`);
    };

    window.addEventListener('velo-add-member', handleAddVoiceMember);
    return () => window.removeEventListener('velo-add-member', handleAddVoiceMember);
  }, []);

  const addMember = () => {
    setMembers([...members, { name: '', email: '', role: 'Engineer', type: 'employee', skills: getSkillsForRole('Engineer') }]);
  };

  const handleCSVFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.type.includes('text')) {
      toast.error('Please upload a valid CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setCSVData(content);
        toast.success('CSV file loaded successfully');
      } catch (error) {
        toast.error('Failed to read CSV file');
        console.error('File read error:', error);
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (csv: string) => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
      toast.error('CSV must have header row and at least one data row');
      return [];
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const parsedMembers = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (!values[0]) continue;

      const nameIdx = headers.indexOf('name') >= 0 ? headers.indexOf('name') : 0;
      const emailIdx = headers.indexOf('email') >= 0 ? headers.indexOf('email') : 1;
      const roleIdx = headers.indexOf('role') >= 0 ? headers.indexOf('role') : 2;

      const role = values[roleIdx] || 'Engineer';
      parsedMembers.push({
        name: values[nameIdx] || '',
        email: values[emailIdx] || '',
        role,
        skills: getSkillsForRole(role)
      });
    }

    return parsedMembers;
  };

  const downloadSampleCSV = () => {
    const sampleData = `name,email,role
John Doe,john@example.com,Frontend Developer
Jane Smith,jane@example.com,Backend Developer
Mike Johnson,mike@example.com,Product Manager
Sarah Williams,sarah@example.com,Designer
Tom Brown,tom@example.com,QA Engineer
Emily Davis,emily@example.com,DevOps Engineer
Alex Martinez,alex@example.com,Full Stack Developer
Chris Wilson,chris@example.com,Data Scientist
Rachel Green,rachel@example.com,Engineering Manager
David Lee,david@example.com,Frontend Developer`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_team_members.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded');
  };

  const handleCSVImport = () => {
    if (!csvData.trim()) {
      toast.error('Please upload or paste CSV data');
      return;
    }

    const parsedMembers = parseCSV(csvData);
    if (parsedMembers.length === 0) {
      toast.error('No valid team members found in CSV');
      return;
    }

    setMembers(parsedMembers);
    setIsCSVMode(false);
    setCSVData('');
    toast.success(`${parsedMembers.length} team members imported`);
  };

  const handleImportMembers = (imported: { name: string; email: string; role: string }[]) => {
    // Merge imported members, replacing empty placeholder rows
    const filledMembers = members.filter(m => m.name.trim() || m.email.trim());
    // Ensure imported members have skills auto-populated
    const importedWithSkills = imported.map(m => ({
      ...m,
      skills: getSkillsForRole(m.role)
    }));
    setMembers([...filledMembers, ...importedWithSkills]);
    setImportModal(null);
    toast.success(`${imported.length} team member${imported.length !== 1 ? 's' : ''} imported`);
  };

  const removeMember = (index: number) => {
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };

  const updateMember = (index: number, field: string, value: string | string[]) => {
    const newMembers = members.map((member, i) => {
      if (i === index) {
        const updated = { ...member, [field]: value };
        // Auto-populate skills when role changes
        if (field === 'role' && typeof value === 'string') {
          updated.skills = getSkillsForRole(value);
        }
        return updated;
      }
      return member;
    });
    setMembers(newMembers);
  };

  const addSkillToMember = (index: number, skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const newMembers = members.map((member, i) => {
      if (i === index) {
        const skills = member.skills || [];
        if (!skills.includes(trimmed)) {
          return { ...member, skills: [...skills, trimmed] };
        }
      }
      return member;
    });
    setMembers(newMembers);
  };

  const removeSkillFromMember = (index: number, skillToRemove: string) => {
    const newMembers = members.map((member, i) => {
      if (i === index) {
        return { ...member, skills: (member.skills || []).filter(s => s !== skillToRemove) };
      }
      return member;
    });
    setMembers(newMembers);
  };

  const handleContinue = async () => {
    clearError();
    try {
      // Only save members that have an email
      const validMembers = members.filter(m => m.email.trim());
      console.log('[OnboardingTeam] handleContinue called with', { validMembersCount: validMembers.length, members });
      if (validMembers.length > 0) {
        console.log('[OnboardingTeam] Saving team members:', validMembers);
        await saveTeamMembers(validMembers);
        console.log('[OnboardingTeam] Team members saved successfully');
      } else {
        console.log('[OnboardingTeam] No valid team members to save, skipping');
      }
      navigate('/onboarding/settings');
    } catch (error: any) {
      console.error('[OnboardingTeam] Error:', error);
      console.error('[OnboardingTeam] Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] font-['Inter',sans-serif] relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-[900px] mx-auto px-8 py-8">
        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/onboarding/welcome')} className="text-sm text-[#78716C] hover:text-[#1C1917] flex items-center gap-1 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-xl font-light text-[#1C1917]">Step 2 of 4: Add Your Team</span>
          <button onClick={() => navigate('/onboarding/settings')} className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
            Skip Step
          </button>
        </div>

        {/* Invite Banner */}
        {inviteCode && (
          <TeamInviteBanner
            teamName={orgName || ''}
            inviteCode={inviteCode}
          />
        )}

        <p className="text-base text-[#78716C] text-center mb-6 font-light max-w-xl mx-auto">
          Add the people you'll be planning projects with. You can always add more later.
        </p>

        {/* Voice Add Member */}
        <div className="flex flex-col items-center mb-8">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              isListening
                ? 'bg-red-50 border-2 border-red-300 text-red-600 animate-pulse'
                : 'bg-teal-50 border-2 border-teal-200 text-teal-700 hover:bg-teal-100'
            }`}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isListening ? 'Stop Listening' : 'Add member by voice'}
          </button>
          <p className="text-xs text-[#78716C] mt-2">
            {status === 'listening' ? 'Listening...' : 
             status === 'processing' ? 'Thinking...' : 
             status === 'speaking' ? 'Speaking...' : 
             'Try: "Add Sarah as frontend developer"'}
          </p>
        </div>

        {/* Table */}
        {!isCSVMode && (
          <div className="mb-6">
            <div className="bg-[#FAFAF9] px-4 py-3 border-b border-[#E7E5E4] flex gap-4">
              <div className="flex-1 text-xs font-normal text-[#78716C] uppercase">Name</div>
              <div className="flex-1 text-xs font-normal text-[#78716C] uppercase">Email</div>
              <div className="w-[200px] text-xs font-normal text-[#78716C] uppercase">Role</div>
              <div className="flex-1 text-xs font-normal text-[#78716C] uppercase">Skills</div>
              <div className="w-8"></div>
            </div>

          <div className="space-y-0 pb-32">
            {members.map((member, idx) => (
              <div key={idx} className="flex gap-4 px-4 py-4 border-b border-[#E7E5E4] items-center group relative z-0" style={{ zIndex: openRoleDropdown === idx ? 50 : 1 }}>
                <div className="flex-1">
                  <Input
                    placeholder="Jane Doe"
                    value={member.name || ''}
                    onChange={(e) => updateMember(idx, 'name', e.target.value)}
                    className="h-10 border-transparent hover:border-[#E7E5E4] focus:border-[#0F766E] bg-transparent px-2 placeholder:text-[#D6D3D1]"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="jane@company.com"
                    value={member.email || ''}
                    onChange={(e) => updateMember(idx, 'email', e.target.value)}
                    className="h-10 border-transparent hover:border-[#E7E5E4] focus:border-[#0F766E] bg-transparent px-2 placeholder:text-[#D6D3D1]"
                  />
                </div>
                <div className="w-[200px] relative">
                  <Input
                    placeholder="Select or type role"
                    value={member.role || ''}
                    onChange={(e) => updateMember(idx, 'role', e.target.value)}
                    onFocus={() => setOpenRoleDropdown(idx)}
                    onBlur={() => setTimeout(() => setOpenRoleDropdown(null), 200)}
                    className="h-10 border-transparent hover:border-[#E7E5E4] focus:border-[#0F766E] bg-transparent px-2 w-full placeholder:text-[#D6D3D1]"
                  />
                  {openRoleDropdown === idx && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#E7E5E4] rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
                      {PREDEFINED_ROLES.filter(role => role.toLowerCase().includes((member.role || '').toLowerCase())).map((role) => (
                        <div
                          key={role}
                          className="px-3 py-2 text-sm text-[#1C1917] hover:bg-[#F5F5F4] cursor-pointer"
                          onMouseDown={() => {
                            updateMember(idx, 'role', role);
                            setOpenRoleDropdown(null);
                          }}
                        >
                          {role}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skills Column */}
                <div className="flex-1 flex flex-wrap gap-1.5 items-center content-start">
                  {(member.skills || []).map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center gap-1 px-2 py-1 bg-[#0F766E]/10 border border-[#0F766E]/30 rounded-full text-xs text-[#0F766E] whitespace-nowrap"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkillFromMember(idx, skill)}
                        className="ml-0.5 hover:text-[#EF4444] transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {activeSkillInput === idx ? (
                    <Input
                      autoFocus
                      value={newSkillText}
                      onChange={(e) => setNewSkillText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addSkillToMember(idx, newSkillText);
                          setNewSkillText('');
                          setActiveSkillInput(null);
                        } else if (e.key === 'Escape') {
                          setNewSkillText('');
                          setActiveSkillInput(null);
                        }
                      }}
                      onBlur={() => {
                        if (newSkillText.trim()) {
                          addSkillToMember(idx, newSkillText);
                        }
                        setNewSkillText('');
                        setActiveSkillInput(null);
                      }}
                      placeholder="Add skill..."
                      className="h-7 px-2 py-1 text-xs border-[#E7E5E4] focus:border-[#0F766E] bg-transparent w-24"
                    />
                  ) : (
                    <button
                      onClick={() => setActiveSkillInput(idx)}
                      className="p-1 rounded-full border border-dashed border-[#0F766E]/30 hover:border-[#0F766E]/60 hover:bg-[#0F766E]/5 transition-colors"
                      title="Add skill"
                    >
                      <Plus className="h-3 w-3 text-[#0F766E]" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => removeMember(idx)}
                  className="w-8 h-8 flex items-center justify-center text-[#D6D3D1] hover:text-[#EF4444] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        )}

        {!isCSVMode && (
          <div className="flex justify-center mb-8">
            <Button
              variant="outline"
              onClick={addMember}
              className="h-10 px-6 border-[#E7E5E4] text-[#57534E] font-normal hover:bg-[#FAFAF9]"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Team Member
            </Button>
          </div>
        )}

        {/* Import Options */}
        {!isCSVMode && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E7E5E4]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-[#FDFDFB] text-[#A8A29E]">OR</span>
              </div>
            </div>

            <div className="mb-12">
              <p className="text-sm text-[#78716C] text-center mb-4 font-light">Import your team</p>
              {/* Jira — primary import CTA */}
              <div className="flex justify-center mb-4">
                <button
                  onClick={() => setImportModal('jira')}
                  className="flex items-center gap-3 px-8 py-4 bg-[#0052CC] hover:bg-[#0052CC]/90 text-white rounded-xl transition-all text-sm font-medium shadow-md"
                >
                  <span className="text-xl">🔗</span>
                  <div className="text-left">
                    <div className="font-semibold">Import from Jira</div>
                    <div className="text-xs text-blue-200 font-light">Your team is already there</div>
                  </div>
                </button>
              </div>
              <p className="text-xs text-[#A8A29E] text-center mb-3">or import another way</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setIsCSVMode(true)}
                  className="flex items-center gap-2 px-5 py-3 border-2 border-[#E7E5E4] bg-white rounded-lg hover:border-[#0F766E]/40 hover:bg-[#FAFAF9] transition-all text-sm font-medium text-[#1C1917]"
                >
                  <span className="text-lg">📊</span> CSV File
                </button>
                <button
                  onClick={() => setImportModal('paste')}
                  className="flex items-center gap-2 px-5 py-3 border-2 border-[#E7E5E4] bg-white rounded-lg hover:border-[#0F766E]/40 hover:bg-[#FAFAF9] transition-all text-sm font-medium text-[#1C1917]"
                >
                  <span className="text-lg">📋</span> Paste Data
                </button>
              </div>
            </div>
          </>
        )}

        {/* CSV Import Panel (existing, preserved) */}
        {isCSVMode && (
          <div className="mb-12 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-[#1C1917]">Import Team Members from CSV</h3>
              <button
                onClick={() => {
                  setIsCSVMode(false);
                  setCSVData('');
                }}
                className="text-[#78716C] hover:text-[#1C1917] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-[#2DD4BF]/5 border border-[#2DD4BF]/20 rounded-lg p-3">
              <div className="text-xs font-medium text-[#292524] mb-2">CSV Format</div>
              <div className="text-xs text-[#78716C] font-mono bg-white p-2 rounded border border-[#E5E5E5]">
                name,email,role
              </div>
            </div>

            <div className="flex gap-3 border-b border-[#E5E5E5]">
              <button
                onClick={() => setCSVInputMode('upload')}
                className={`px-4 py-2 text-xs font-medium transition-all border-b-2 ${csvInputMode === 'upload' ? 'text-[#2DD4BF] border-[#2DD4BF]' : 'text-[#78716C] border-transparent hover:text-[#57534E]'}`}
              >
                Upload File
              </button>
              <button
                onClick={() => setCSVInputMode('paste')}
                className={`px-4 py-2 text-xs font-medium transition-all border-b-2 ${csvInputMode === 'paste' ? 'text-[#2DD4BF] border-[#2DD4BF]' : 'text-[#78716C] border-transparent hover:text-[#57534E]'}`}
              >
                Paste Data
              </button>
            </div>

            {csvInputMode === 'upload' ? (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-[#2DD4BF]/30 rounded-lg p-8 text-center hover:border-[#2DD4BF]/50 hover:bg-[#2DD4BF]/3 transition-all">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="inline-flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <div className="text-3xl">📁</div>
                    <div className="text-sm font-medium text-[#292524]">Click to upload CSV file</div>
                    <div className="text-xs text-[#78716C]">or drag and drop</div>
                  </button>
                </div>
                {csvData && (
                  <div className="p-3 bg-[#7C9A82]/10 border border-[#7C9A82]/20 rounded-lg">
                    <div className="text-xs font-medium text-[#7C9A82] mb-1">✓ File loaded</div>
                    <div className="text-xs text-[#57534E] font-mono">{csvData.split('\n').length - 1} rows ready to import</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-medium text-[#737373] uppercase tracking-wide block">Paste CSV Data</label>
                <textarea
                  value={csvData}
                  onChange={(e) => setCSVData(e.target.value)}
                  className="w-full h-40 p-3 border-[#E5E5E5] bg-white rounded-lg border font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20 focus:border-[#2DD4BF]"
                  placeholder="name,email,role&#10;John Doe,john@example.com,Frontend Developer&#10;Jane Smith,jane@example.com,Backend Developer"
                  disabled={loading}
                />
              </div>
            )}

            <button
              onClick={downloadSampleCSV}
              className="text-xs font-medium text-[#2DD4BF] hover:text-[#2DD4BF]/80 transition-colors"
            >
              ↓ Download Sample CSV
            </button>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCSVImport}
                disabled={loading || !csvData.trim()}
                className="flex-1 h-10 bg-[#2DD4BF] hover:bg-[#2DD4BF]/90 text-[#1C1917] font-medium rounded-lg transition-all"
              >
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</> : 'Import Members'}
              </Button>
              <Button
                onClick={() => {
                  setIsCSVMode(false);
                  setCSVData('');
                }}
                variant="outline"
                className="h-10 px-6 border-[#E7E5E4] text-[#57534E] font-normal hover:bg-[#FAFAF9]"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="bg-[#F0FDFA] border border-[#CCFBF1] rounded-lg p-4 mb-8 text-center">
          <p className="text-sm text-[#134E4A] font-light">
            <span className="font-medium mr-1">💡 TIP:</span>
            Don't worry about getting everything perfect. You can edit roles and add skills later.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button onClick={() => navigate('/onboarding/welcome')} className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
            ← Back
          </button>
          <Button
            onClick={handleContinue}
            disabled={loading}
            className="h-10 px-8 bg-[#1C1917] hover:bg-[#292524] text-white rounded-lg font-normal transition-all duration-200 shadow-md disabled:opacity-50"
          >
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Continue →'}
          </Button>
        </div>
      </div>

      {/* Import Modals */}
      {importModal === 'paste' && (
        <PasteImportModal
          onImport={handleImportMembers}
          onClose={() => setImportModal(null)}
        />
      )}
      {importModal === 'jira' && (
        <JiraImportModal
          onImport={handleImportMembers}
          onClose={() => setImportModal(null)}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import { Plus, X, Loader2, Users, FileSpreadsheet, ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TeamInviteBanner from '@/components/onboarding/TeamInviteBanner';
import PasteImportModal from '@/components/onboarding/PasteImportModal';
import CSVImportModal from '@/components/onboarding/CSVImportModal';
import { getSkillsForRole } from '@/services/skillSuggester';
import { peopleService } from '@/services/peopleService';
import { setupProgressService } from '@/services/setupProgressService';
import { toast } from 'sonner';

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

interface Member {
  name: string;
  email: string;
  role: string;
  skills: string[];
}

interface PeopleEmptyStateProps {
  teamName: string;
  inviteCode: string;
  teamId: string;
  organizationId: string;
  onMembersAdded: () => void;
}

export function PeopleEmptyState({ teamName, inviteCode, teamId, organizationId, onMembersAdded }: PeopleEmptyStateProps) {
  const [members, setMembers] = useState<Member[]>([
    { name: '', email: '', role: 'Engineer', skills: getSkillsForRole('Engineer') },
    { name: '', email: '', role: 'Engineer', skills: getSkillsForRole('Engineer') },
    { name: '', email: '', role: 'Engineer', skills: getSkillsForRole('Engineer') },
  ]);
  const [openRoleDropdown, setOpenRoleDropdown] = useState<number | null>(null);
  const [activeSkillInput, setActiveSkillInput] = useState<number | null>(null);
  const [newSkillText, setNewSkillText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [importModal, setImportModal] = useState<'csv' | 'paste' | null>(null);

  const addMember = () => {
    setMembers([...members, { name: '', email: '', role: 'Engineer', skills: getSkillsForRole('Engineer') }]);
  };

  const removeMember = (index: number) => {
    const next = [...members];
    next.splice(index, 1);
    setMembers(next);
  };

  const updateMember = (index: number, field: string, value: string | string[]) => {
    setMembers(prev => prev.map((m, i) => {
      if (i !== index) return m;
      const updated = { ...m, [field]: value };
      if (field === 'role' && typeof value === 'string') {
        updated.skills = getSkillsForRole(value);
      }
      return updated;
    }));
  };

  const addSkillToMember = (index: number, skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    setMembers(prev => prev.map((m, i) => {
      if (i !== index) return m;
      if (m.skills.includes(trimmed)) return m;
      return { ...m, skills: [...m.skills, trimmed] };
    }));
  };

  const removeSkillFromMember = (index: number, skillToRemove: string) => {
    setMembers(prev => prev.map((m, i) => {
      if (i !== index) return m;
      return { ...m, skills: m.skills.filter(s => s !== skillToRemove) };
    }));
  };

  const handleImportMembers = (imported: Array<{ name: string; email: string; role: string; skills?: string[] }>) => {
    const filledMembers = members.filter(m => m.name.trim() || m.email.trim());
    const withSkills = imported.map(m => ({
      ...m,
      skills: m.skills && m.skills.length > 0 ? m.skills : getSkillsForRole(m.role),
    }));
    setMembers([...filledMembers, ...withSkills]);
    setImportModal(null);
    toast.success(`${imported.length} team member${imported.length !== 1 ? 's' : ''} imported`);
  };

  const handleSave = async () => {
    const validMembers = members.filter(m => m.email.trim());
    if (validMembers.length === 0) {
      toast.error('Add at least one member with an email address');
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    let failCount = 0;

    for (const member of validMembers) {
      try {
        await peopleService.addTeamMember(organizationId, teamId, {
          name: member.name.trim() || member.email.split('@')[0],
          email: member.email.trim(),
          role: member.role,
          skills: member.skills.join(','),
        });
        successCount++;
      } catch (err) {
        console.error('Failed to add member:', member.email, err);
        failCount++;
      }
    }

    if (successCount > 0) {
      await setupProgressService.markStepComplete(organizationId, 'team_members_added');
      toast.success(`${successCount} team member${successCount !== 1 ? 's' : ''} added`);
      if (failCount > 0) {
        toast.error(`${failCount} member${failCount !== 1 ? 's' : ''} failed to save`);
      }
      onMembersAdded();
    } else {
      toast.error('Failed to add team members');
    }

    setIsSaving(false);
  };

  const validCount = members.filter(m => m.email.trim()).length;

  return (
    <div>
      {/* Title Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-full bg-[#F5F5F4] flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-[#D6D3D1]" />
        </div>
        <h3 className="text-lg font-medium text-[#1C1917] mb-1">Build Your Team</h3>
        <p className="text-sm text-[#78716C] font-light text-center max-w-xl">
          Add the people you'll be planning projects with. You can always add more later.
        </p>
      </div>

      {/* Invite Banner */}
      {inviteCode && (
        <TeamInviteBanner teamName={teamName} inviteCode={inviteCode} />
      )}

      {/* Member Table */}
      <div className="mb-6 border border-[#E7E5E4] rounded-2xl overflow-hidden bg-white shadow-sm">
        {/* Header */}
        <div className="bg-[#FAFAF9] px-4 py-3 border-b border-[#E7E5E4] hidden md:flex gap-4">
          <div className="flex-1 text-xs font-normal text-[#78716C] uppercase tracking-wider">Name</div>
          <div className="flex-1 text-xs font-normal text-[#78716C] uppercase tracking-wider">Email</div>
          <div className="w-[200px] text-xs font-normal text-[#78716C] uppercase tracking-wider">Role</div>
          <div className="flex-1 text-xs font-normal text-[#78716C] uppercase tracking-wider hidden lg:block">Skills</div>
          <div className="w-8"></div>
        </div>

        {/* Rows */}
        <div className="space-y-0">
          {members.map((member, idx) => (
            <div
              key={idx}
              className="flex flex-col md:flex-row gap-2 md:gap-4 px-4 py-4 border-b border-[#E7E5E4] last:border-b-0 md:items-center group relative transition-colors hover:bg-[#FAFAF9]/50"
              style={{ zIndex: openRoleDropdown === idx ? 50 : 1 }}
            >
              <div className="flex-1">
                <Input
                  placeholder="Jane Doe"
                  value={member.name}
                  onChange={(e) => updateMember(idx, 'name', e.target.value)}
                  className="h-10 border-transparent hover:border-[#E7E5E4] focus:border-[#0F766E] bg-transparent px-2 placeholder:text-[#D6D3D1]"
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="jane@company.com"
                  value={member.email}
                  onChange={(e) => updateMember(idx, 'email', e.target.value)}
                  className="h-10 border-transparent hover:border-[#E7E5E4] focus:border-[#0F766E] bg-transparent px-2 placeholder:text-[#D6D3D1]"
                />
              </div>
              <div className="w-[200px] relative">
                <Input
                  placeholder="Select or type role"
                  value={member.role}
                  onChange={(e) => updateMember(idx, 'role', e.target.value)}
                  onFocus={() => setOpenRoleDropdown(idx)}
                  onBlur={() => setTimeout(() => setOpenRoleDropdown(null), 200)}
                  className="h-10 border-transparent hover:border-[#E7E5E4] focus:border-[#0F766E] bg-transparent px-2 w-full placeholder:text-[#D6D3D1]"
                />
                {openRoleDropdown === idx && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#E7E5E4] rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
                    {PREDEFINED_ROLES.filter(role =>
                      role.toLowerCase().includes((member.role || '').toLowerCase())
                    ).map((role) => (
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

              {/* Skills — hidden on smaller screens */}
              <div className="flex-1 flex-wrap gap-1.5 items-center content-start hidden lg:flex">
                {member.skills.map((skill) => (
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
                      if (newSkillText.trim()) addSkillToMember(idx, newSkillText);
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

      {/* Add Member Button */}
      <div className="flex justify-center mb-8">
        <Button
          variant="outline"
          onClick={addMember}
          className="h-11 px-6 border-[#E7E5E4] text-[#57534E] font-normal hover:bg-[#FAFAF9] rounded-xl transition-all duration-300"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Team Member
        </Button>
      </div>

      {/* Import Options */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E7E5E4]"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-4 bg-[#FAFAF9] text-[#A8A29E]">OR</span>
        </div>
      </div>

      <div className="mb-10">
        <p className="text-sm text-[#78716C] text-center mb-4 font-light">Import your team</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={() => setImportModal('csv')}
            className="flex items-center gap-2.5 px-5 py-3 border border-[#E7E5E4] bg-white rounded-xl hover:border-[#0F766E]/40 hover:bg-[#F0FDFA]/30 hover:shadow-sm transition-all duration-300 text-sm font-medium text-[#1C1917]"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0F766E]" /> CSV File
          </button>
          <button
            onClick={() => setImportModal('paste')}
            className="flex items-center gap-2.5 px-5 py-3 border border-[#E7E5E4] bg-white rounded-xl hover:border-[#0F766E]/40 hover:bg-[#F0FDFA]/30 hover:shadow-sm transition-all duration-300 text-sm font-medium text-[#1C1917]"
          >
            <ClipboardPaste className="w-4 h-4 text-[#0F766E]" /> Paste Data
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSave}
          disabled={isSaving || validCount === 0}
          className="h-12 px-8 bg-[#1C1917] hover:bg-[#292524] text-white font-medium rounded-xl shadow-sm disabled:opacity-50 transition-all duration-300"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            `Save ${validCount} Team Member${validCount !== 1 ? 's' : ''}`
          )}
        </Button>
      </div>

      {/* Import Modals */}
      <CSVImportModal
        open={importModal === 'csv'}
        onOpenChange={(v) => { if (!v) setImportModal(null); }}
        onImport={handleImportMembers}
      />

      {importModal === 'paste' && (
        <PasteImportModal
          onImport={(imported) => handleImportMembers(imported.map(m => ({ ...m, skills: [] })))}
          onClose={() => setImportModal(null)}
        />
      )}
    </div>
  );
}

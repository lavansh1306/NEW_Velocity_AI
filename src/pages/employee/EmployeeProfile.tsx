import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EmployeeProfile() {
  const { user, orgId, orgName, updatePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Member data from DB
  const [displayName, setDisplayName] = useState('');
  const [memberId, setMemberId] = useState<string | null>(null);
  const [joinedAt, setJoinedAt] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Designation
  const [designation, setDesignation] = useState('');

  // Security
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSaved, setPassSaved] = useState(false);

  // Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [skillsChanged, setSkillsChanged] = useState(false);

  useEffect(() => {
    if (!user || !orgId) { setLoading(false); return; }
    supabase
      .from('organization_members')
      .select('id, display_name, role, joined_at, skills')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setDisplayName((data as any).display_name || user.email?.split('@')[0] || '');
          setMemberId((data as any).id);
          setJoinedAt((data as any).joined_at);
          setRole((data as any).role);
          const memberSkills = (data as any).skills || [];
          setSkills(Array.isArray(memberSkills) ? memberSkills : []);
        } else {
          setDisplayName(user.email?.split('@')[0] || '');
        }
        setLoading(false);
      });
    supabase
      .from('users')
      .select('designation')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setDesignation((data as any).designation || '');
      });
  }, [user, orgId]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('users').update({ name: displayName, designation }).eq('id', user.id);
    if (memberId) {
      await supabase.from('organization_members').update({ display_name: displayName }).eq('id', memberId);
    }
    setSaving(false);
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    setPassError('');
    if (newPass.length < 8) { setPassError('Password must be at least 8 characters.'); return; }
    if (newPass !== confirmPass) { setPassError('Passwords do not match.'); return; }
    try {
      await updatePassword(newPass);
      setPassSaved(true);
      setNewPass(''); setConfirmPass('');
      setTimeout(() => setPassSaved(false), 3000);
    } catch (e: any) {
      setPassError(e.message || 'Failed to update password.');
    }
  };

  const handleAddSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills([...skills, trimmedSkill]);
      setNewSkill('');
      setSkillsChanged(true);
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
    setSkillsChanged(true);
  };

  const handleSaveSkills = async () => {
    if (!memberId) return;
    setSaving(true);
    await supabase.from('organization_members').update({ skills }).eq('id', memberId);
    setSaving(false);
    setSkillsChanged(false);
  };

  const email = user?.email ?? '';
  const initials = (displayName || email.split('@')[0]).slice(0, 2).toUpperCase();
  const joinedFormatted = joinedAt ? new Date(joinedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-teal-400" /></div>;

  return (
    <div className="max-w-[900px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-6 mb-10">
        <div className="w-20 h-20 rounded-full bg-[#2DD4BF] flex items-center justify-center text-[#1C1917] font-semibold text-2xl shadow-[0_0_20px_rgba(45,212,191,0.2)]">
          {initials}
        </div>
        <div>
          <h1 className="text-3xl font-light text-[#1C1917] tracking-tight">{displayName || email.split('@')[0]}</h1>
          <p className="text-sm text-[#78716C] font-light mt-1">{email}</p>
          {orgName && <p className="text-xs text-[#A8A29E] mt-0.5">{orgName}{role ? ` · ${role}` : ''}</p>}
        </div>
        <div className="ml-auto">
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)} className="border-[#E7E5E4] text-[#57534E] font-light h-9 px-5">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#1C1917] hover:bg-[#292524] text-white font-light h-9 px-5">{saving ? 'Saving…' : 'Save Changes'}</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)} className="border-[#E7E5E4] text-[#57534E] hover:text-[#1C1917] hover:bg-white font-light h-9 px-5">Edit Profile</Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start border-b border-[#E7E5E4] bg-transparent h-auto p-0 space-x-8 rounded-none mb-8">
          {['Personal', 'Work', 'Skills', 'Security'].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab.toLowerCase()}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1C1917] data-[state=active]:text-[#1C1917] data-[state=active]:shadow-none px-0 py-4 bg-transparent text-[#78716C] hover:text-[#1C1917] font-light text-sm transition-all"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* PERSONAL */}
        <TabsContent value="personal">
          <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-8 shadow-sm space-y-6">
            <div>
              <Label className="text-xs text-[#A8A29E] uppercase tracking-wide mb-2 block">Display Name</Label>
              {isEditing ? (
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="h-[44px] border-[#E7E5E4] font-light text-[#1C1917] bg-white" />
              ) : (
                <div className="text-base text-[#1C1917] font-light">{displayName || '—'}</div>
              )}
            </div>
            <div>
              <Label className="text-xs text-[#A8A29E] uppercase tracking-wide mb-2 block">Email Address</Label>
              <div className="text-base text-[#1C1917] font-light">{email}</div>
              <div className="text-xs text-[#A8A29E] mt-1">Email is managed by authentication — contact your manager to change it.</div>
            </div>
            <div>
              <Label className="text-xs text-[#A8A29E] uppercase tracking-wide mb-2 block">Organisation</Label>
              <div className="text-base text-[#1C1917] font-light">{orgName || '—'}</div>
            </div>
          </div>
        </TabsContent>

        {/* WORK */}
        <TabsContent value="work">
          <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-8 shadow-sm space-y-6">
            <div>
              <Label className="text-xs text-[#A8A29E] uppercase tracking-wide mb-2 block">Designation</Label>
              {isEditing ? (
                <Input
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  className="h-[44px] border-[#E7E5E4] font-light text-[#1C1917] bg-white"
                  placeholder="e.g. Senior Developer"
                />
              ) : (
                <div className="text-base text-[#1C1917] font-light">
                  {designation || <span className="text-[#A8A29E]">Not set — click Edit Profile to add</span>}
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs text-[#A8A29E] uppercase tracking-wide mb-2 block">Role</Label>
              <div className="text-base text-[#1C1917] font-light capitalize">{role || 'Employee'}</div>
            </div>
            <div>
              <Label className="text-xs text-[#A8A29E] uppercase tracking-wide mb-2 block">Joined</Label>
              <div className="text-base text-[#1C1917] font-light">{joinedFormatted}</div>
            </div>
            <div>
              <Label className="text-xs text-[#A8A29E] uppercase tracking-wide mb-2 block">Organisation</Label>
              <div className="text-base text-[#1C1917] font-light">{orgName || '—'}</div>
            </div>
          </div>
        </TabsContent>

        {/* SKILLS */}
        <TabsContent value="skills">
          <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-8 shadow-sm space-y-6">
            <div>
              <Label className="text-xs text-[#A8A29E] uppercase tracking-wide mb-4 block">Your Skills</Label>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {skills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F5F4] border border-[#E7E5E4] text-sm text-[#1C1917] font-light"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(idx)}
                        className="ml-1 text-[#A8A29E] hover:text-[#1C1917] transition-colors"
                        title="Remove skill"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {skills.length === 0 && (
                <p className="text-sm text-[#A8A29E] mb-6 font-light">No skills added yet. Add your first skill below.</p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-[#A8A29E] uppercase tracking-wide mb-2 block">Add New Skill</Label>
              <div className="flex gap-3">
                <Input
                  type="text"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                  className="flex-1 h-[44px] border-[#E7E5E4] font-light text-[#1C1917] bg-white"
                  placeholder="E.g., React, Node.js, TypeScript..."
                />
                <Button
                  onClick={handleAddSkill}
                  disabled={!newSkill.trim()}
                  className="bg-[#1C1917] hover:bg-[#292524] text-white font-light h-[44px] px-6"
                >
                  Add
                </Button>
              </div>
            </div>

            {skillsChanged && (
              <div className="pt-4 border-t border-[#E7E5E4]">
                <Button
                  onClick={handleSaveSkills}
                  disabled={saving}
                  className="bg-[#0F766E] hover:bg-[#0D9488] text-white font-light h-[44px] px-8"
                >
                  {saving ? 'Saving…' : 'Save Skills'}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="security">
          <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-light text-[#1C1917]">Change Password</h2>
            <div>
              <Label className="text-xs text-[#A8A29E] uppercase tracking-wide mb-2 block">New Password</Label>
              <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="h-[44px] border-[#E7E5E4] font-light text-[#1C1917] bg-white" placeholder="Min. 8 characters" />
            </div>
            <div>
              <Label className="text-xs text-[#A8A29E] uppercase tracking-wide mb-2 block">Confirm Password</Label>
              <Input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="h-[44px] border-[#E7E5E4] font-light text-[#1C1917] bg-white" placeholder="Re-enter password" />
            </div>
            {passError && <div className="text-sm text-[#BE123C]">{passError}</div>}
            {passSaved && <div className="text-sm text-[#0F766E]">Password updated successfully.</div>}
            <Button onClick={handlePasswordChange} disabled={!newPass || !confirmPass} className="bg-[#1C1917] hover:bg-[#292524] text-white font-light h-[44px] px-8">
              Update Password
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

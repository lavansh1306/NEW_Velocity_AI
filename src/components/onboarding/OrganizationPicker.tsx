import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  X,
  Plus,
  Search,
  Building2,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { isPersonalEmail, getEmailDomain } from '@/lib/emailDomains';

export interface Organization {
  id: string;
  name: string;
  domain: string;
  members: number;
  industry: string;
}

interface OrganizationPickerProps {
  value: string;
  onSelect: (org: Organization | null) => void;
  onCreate: (name: string) => void;
  onClear: () => void;
}

export const OrganizationPicker: React.FC<OrganizationPickerProps> = ({
  value: orgName,
  onSelect,
  onCreate,
  onClear
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isCreatingNewOrg, setIsCreatingNewOrg] = useState(false);
  const [searchResults, setSearchResults] = useState<Organization[]>([]);
  const [searching, setSearching] = useState(false);
  const [domainOrg, setDomainOrg] = useState<Organization | null>(null);
  const [domainChecked, setDomainChecked] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Domain-based org detection on mount (for corporate emails)
  useEffect(() => {
    if (!user?.email || domainChecked) return;
    setDomainChecked(true);

    if (isPersonalEmail(user.email)) return; // Skip for gmail, yahoo, etc.

    const domain = getEmailDomain(user.email);
    if (!domain) return;

    (async () => {
      try {
        const { data: users } = await supabase
          .from('users')
          .select('organization_id')
          .ilike('email', `%@${domain}`)
          .not('organization_id', 'is', null)
          .limit(1);

        if (!users || users.length === 0) return;

        const orgId = users[0].organization_id;
        const { data: org } = await supabase
          .from('organizations')
          .select('id, name, users:users(id)')
          .eq('id', orgId)
          .single();

        if (org) {
          setDomainOrg({
            id: org.id,
            name: org.name,
            domain,
            members: org.users?.length || 0,
            industry: '',
          });
        }
      } catch {
        // Silently fail — domain check is best-effort
      }
    })();
  }, [user?.email, domainChecked]);

  // Debounced search against real Supabase data
  const doSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, users:users(id)')
        .ilike('name', `%${query.trim()}%`)
        .limit(8);

      if (error) throw error;

      setSearchResults(
        (data || []).map((org: any) => ({
          id: org.id,
          name: org.name,
          domain: '',
          members: org.users?.length || 0,
          industry: '',
        }))
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleOrgInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setShowSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const exactMatch = useMemo(() => {
    return searchResults.some(org => org.name.toLowerCase() === searchTerm.toLowerCase());
  }, [searchResults, searchTerm]);

  const handleOrgSelect = (org: Organization) => {
    setSelectedOrg(org);
    setIsCreatingNewOrg(false);
    setShowSuggestions(false);
    onSelect(org);
  };

  const handleCreateNewOrg = () => {
    setIsCreatingNewOrg(true);
    setSelectedOrg(null);
    setShowSuggestions(false);
    onCreate(searchTerm.trim());
  };

  const handleClearOrg = () => {
    setSelectedOrg(null);
    setIsCreatingNewOrg(false);
    setSearchTerm('');
    setDomainOrg(null);
    onClear();
  };

  return (
    <div className="w-full">
      <Label htmlFor="org-name" className="text-sm font-medium text-[#57534E] mb-1.5 block">
        Organization Name <span className="text-[#BE123C] ml-0.5">*</span>
      </Label>

      {/* Domain-detected org suggestion */}
      {domainOrg && !selectedOrg && !isCreatingNewOrg && (
        <div className="mb-3 p-3 bg-[#F0FDFA] border border-[#0F766E]/20 rounded-xl animate-in fade-in duration-200">
          <p className="text-xs text-[#0F766E] font-medium mb-2">We found your organization:</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0F766E]" />
              <span className="text-sm font-medium text-[#1C1917]">{domainOrg.name}</span>
              <span className="text-xs text-[#78716C]">· {domainOrg.members} members</span>
            </div>
            <button
              type="button"
              className="text-xs text-[#0F766E] font-medium hover:underline"
              onClick={() => handleOrgSelect(domainOrg)}
            >
              Join this org →
            </button>
          </div>
        </div>
      )}

      {/* Selected org confirmation chip */}
      {selectedOrg ? (
        <div className="flex items-center gap-2 h-11 px-3 rounded-lg border border-[#0F766E]/30 bg-[#F0FDFA] animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#0F766E] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm text-[#1C1917] font-medium">{selectedOrg.name}</span>
            <span className="text-xs text-[#78716C] ml-2 font-light">
              {selectedOrg.members > 0 ? `${selectedOrg.members.toLocaleString()} members` : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearOrg}
            className="text-[#A8A29E] hover:text-[#78716C] transition-colors flex-shrink-0"
            aria-label="Clear organization"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : isCreatingNewOrg ? (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E]">
            <Plus className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-light">Creating new organization: <strong className="font-medium">{orgName}</strong></span>
            <button
              type="button"
              onClick={handleClearOrg}
              className="ml-auto text-[#92400E]/60 hover:text-[#92400E] transition-colors"
              aria-label="Cancel new organization"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative" ref={suggestionsRef}>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            {searching ? (
              <Loader2 className="w-4 h-4 text-[#A8A29E] animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-[#A8A29E]" />
            )}
          </div>
          <Input
            id="org-name"
            className="h-11 pl-9 rounded-lg border-[#E7E5E4] bg-[#FAFAF9] focus:bg-white focus:ring-2 focus:ring-[#1C1917]/10 transition-all font-light placeholder:text-[#A8A29E]"
            placeholder="Search or enter your organization name"
            value={searchTerm}
            onChange={handleOrgInputChange}
            onFocus={() => { if (searchTerm.trim().length >= 2) setShowSuggestions(true); }}
            autoComplete="off"
          />

          {/* Search results dropdown */}
          {showSuggestions && searchTerm.trim().length >= 2 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E7E5E4] rounded-lg shadow-lg max-h-56 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-150">
              {searchResults.length > 0 && (
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#A8A29E] font-medium border-b border-[#F5F5F4]">
                  Existing organizations
                </div>
              )}
              {searchResults.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  className="w-full text-left px-3 py-2.5 hover:bg-[#F5F5F4] cursor-pointer transition-colors flex items-center gap-3 border-b border-[#F5F5F4] last:border-0"
                  onMouseDown={() => handleOrgSelect(org)}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#FAFAF9] border border-[#E7E5E4] flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-[#78716C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#1C1917] font-medium truncate">{org.name}</div>
                    <div className="text-xs text-[#A8A29E] font-light">
                      {org.members > 0 ? `${org.members.toLocaleString()} members` : 'New'}
                    </div>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] flex-shrink-0" />
                </button>
              ))}

              {/* Create new option */}
              {!exactMatch && searchTerm.trim().length >= 2 && (
                <>
                  {searchResults.length > 0 && (
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#A8A29E] font-medium border-b border-[#F5F5F4] bg-[#FAFAF9]">
                      Not listed?
                    </div>
                  )}
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-[#FFFBEB]/50 cursor-pointer transition-colors flex items-center gap-3"
                    onMouseDown={handleCreateNewOrg}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center flex-shrink-0">
                      <Plus className="w-4 h-4 text-[#92400E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#1C1917] font-medium">Create "{searchTerm.trim()}"</div>
                      <div className="text-xs text-[#78716C] font-light">Register as a new organization on Velocity AI</div>
                    </div>
                  </button>
                </>
              )}

              {searchResults.length === 0 && !searching && (
                <div className="px-3 py-3 text-sm text-[#A8A29E] text-center font-light">
                  No organizations found for "{searchTerm.trim()}"
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-[#78716C] mt-1.5 font-light">
        {selectedOrg
          ? 'You\'ll be linked to this organization\'s workspace.'
          : isCreatingNewOrg
            ? 'A new organization will be created when you sign up.'
            : 'Search for your company to join existing teammates, or create a new one.'}
      </p>
    </div>
  );
};

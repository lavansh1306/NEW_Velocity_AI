import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  X, 
  Plus, 
  Search, 
  Building2 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface Organization {
  id: string;
  name: string;
  domain: string;
  members: number;
  industry: string;
}

const MOCK_ORGS: Organization[] = [
  { id: '1', name: 'Velocity AI', domain: 'velocityai.tech', members: 12, industry: 'Technology' },
  { id: '2', name: 'Google', domain: 'google.com', members: 150000, industry: 'Technology' },
  { id: '3', name: 'Acme Corp', domain: 'acme.com', members: 450, industry: 'Manufacturing' },
  { id: '4', name: 'Meta', domain: 'meta.com', members: 80000, industry: 'Social Media' },
  { id: '5', name: 'Tesla', domain: 'tesla.com', members: 120000, industry: 'Automotive' },
];

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
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isCreatingNewOrg, setIsCreatingNewOrg] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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

  const filteredOrgs = useMemo(() => {
    if (searchTerm.trim().length < 1) return [];
    return MOCK_ORGS.filter(org => 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.domain.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const exactMatch = useMemo(() => {
    return MOCK_ORGS.some(org => org.name.toLowerCase() === searchTerm.toLowerCase());
  }, [searchTerm]);

  const handleOrgInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

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
    onClear();
  };

  return (
    <div className="w-full">
      <Label htmlFor="org-name" className="text-sm font-medium text-[#57534E] mb-1.5 block">
        Organization Name
      </Label>

      {/* Selected org confirmation chip */}
      {selectedOrg ? (
        <div className="flex items-center gap-2 h-11 px-3 rounded-lg border border-[#0F766E]/30 bg-[#F0FDFA] animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#0F766E] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm text-[#1C1917] font-medium">{selectedOrg.name}</span>
            <span className="text-xs text-[#78716C] ml-2 font-light">
              {selectedOrg.domain} · {selectedOrg.members.toLocaleString()} members
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
            <Search className="w-4.5 h-4.5 text-[#A8A29E]" />
          </div>
          <Input
            id="org-name"
            className="h-11 pl-9 rounded-lg border-[#E7E5E4] bg-[#FAFAF9] focus:bg-white focus:ring-2 focus:ring-[#1C1917]/10 transition-all font-light placeholder:text-[#A8A29E]"
            placeholder="Search or enter your organization name"
            value={searchTerm}
            onChange={handleOrgInputChange}
            onFocus={() => { if (searchTerm.trim().length >= 1) setShowSuggestions(true); }}
            autoComplete="off"
          />

          {/* Search results dropdown */}
          {showSuggestions && searchTerm.trim().length >= 1 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E7E5E4] rounded-lg shadow-lg max-h-56 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-150">
              {filteredOrgs.length > 0 && (
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#A8A29E] font-medium border-b border-[#F5F5F4]">
                  Existing organizations
                </div>
              )}
              {filteredOrgs.map((org) => (
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
                    <div className="text-xs text-[#A8A29E] font-light">{org.domain} · {org.members.toLocaleString()} members · {org.industry}</div>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] flex-shrink-0" />
                </button>
              ))}

              {/* Create new option */}
              {!exactMatch && searchTerm.trim().length >= 2 && (
                <>
                  {filteredOrgs.length > 0 && (
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

              {filteredOrgs.length === 0 && searchTerm.trim().length < 2 && (
                <div className="px-3 py-3 text-sm text-[#A8A29E] text-center font-light">
                  Type at least 2 characters to search
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

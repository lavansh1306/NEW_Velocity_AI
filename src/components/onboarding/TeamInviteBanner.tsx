import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  teamName: string;
  inviteCode: string;
}

export default function TeamInviteBanner({ teamName, inviteCode }: Props) {
  const [copiedField, setCopiedField] = useState<'code' | 'link' | null>(null);

  const inviteLink = `${window.location.origin}/onboarding/join?code=${inviteCode}`;

  const copyToClipboard = (text: string, field: 'code' | 'link') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  return (
    <div className="bg-gradient-to-r from-[#0F766E] to-[#134E4A] rounded-xl p-5 mb-8 text-white">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">📨</span>
        <div>
          <h3 className="text-sm font-semibold mb-0.5">
            Invite Your Team{teamName ? ` to ${teamName}` : ''}
          </h3>
          <p className="text-xs text-white/70 font-light">
            Share this code or link for instant team member signup
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Invite Code */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/60 mb-1.5 block">
            Invite Code
          </label>
          <div className="flex gap-2">
            <code className="flex-1 bg-white/15 backdrop-blur px-3 py-2 rounded-lg font-mono text-sm font-semibold tracking-widest">
              {inviteCode}
            </code>
            <button
              onClick={() => copyToClipboard(inviteCode, 'code')}
              className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              {copiedField === 'code' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedField === 'code' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Share Link */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/60 mb-1.5 block">
            Share Link
          </label>
          <div className="flex gap-2">
            <input
              value={inviteLink}
              readOnly
              onClick={(e) => e.currentTarget.select()}
              className="flex-1 bg-white/15 backdrop-blur px-3 py-2 rounded-lg text-xs text-white border-none outline-none font-light truncate"
            />
            <button
              onClick={() => copyToClipboard(inviteLink, 'link')}
              className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              {copiedField === 'link' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedField === 'link' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

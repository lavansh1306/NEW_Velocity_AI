import React, { useState } from 'react';
import { Button } from './ui/button';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import SwapHorizOutlined from '@mui/icons-material/SwapHorizOutlined';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';

// ========== TYPES ==========

export type SuggestionCategory = 'reallocation' | 'overload' | 'risk';

export interface AISuggestionImpact {
    summary: string;
    affectedMembers?: string[];
    affectedProjects?: string[];
    timelineEffect?: string;
    hoursImpact?: string;
    riskLevel?: 'high' | 'medium' | 'low';
}

export interface AISuggestion {
    id: string;
    confidence: number;
    category: SuggestionCategory;
    title: string;
    reasoning: string;
    impact: AISuggestionImpact;
}

// ========== HELPERS ==========

const categoryConfig: Record<SuggestionCategory, { label: string; icon: React.ReactNode; color: string; bg: string; border: string; accent: string }> = {
    reallocation: {
        label: 'Reallocation',
        icon: <SwapHorizOutlined style={{ fontSize: 14 }} />,
        color: 'text-[#2DD4BF]',
        bg: 'bg-[#2DD4BF]/8',
        border: 'border-[#2DD4BF]/20',
        accent: 'border-l-[#2DD4BF]',
    },
    overload: {
        label: 'Overload',
        icon: <WarningAmberOutlined style={{ fontSize: 14 }} />,
        color: 'text-[#C2714F]',
        bg: 'bg-[#C2714F]/8',
        border: 'border-[#C2714F]/20',
        accent: 'border-l-[#C2714F]',
    },
    risk: {
        label: 'Risk Management',
        icon: <TrendingUpOutlined style={{ fontSize: 14 }} />,
        color: 'text-[#B4942D]',
        bg: 'bg-[#B4942D]/8',
        border: 'border-[#B4942D]/20',
        accent: 'border-l-[#B4942D]',
    },
};

const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return { text: 'text-[#7C9A82]', bg: 'bg-[#7C9A82]/10', ring: 'ring-[#7C9A82]/20' };
    if (confidence >= 75) return { text: 'text-[#B4942D]', bg: 'bg-[#B4942D]/10', ring: 'ring-[#B4942D]/20' };
    return { text: 'text-[#C2714F]', bg: 'bg-[#C2714F]/10', ring: 'ring-[#C2714F]/20' };
};

const getRiskBadge = (level: string) => {
    const config: Record<string, { bg: string; text: string }> = {
        high: { bg: 'bg-[#C2714F]/10', text: 'text-[#C2714F]' },
        medium: { bg: 'bg-[#B4942D]/10', text: 'text-[#B4942D]' },
        low: { bg: 'bg-[#7C9A82]/10', text: 'text-[#7C9A82]' },
    };
    return config[level] || config.low;
};

// ========== COMPONENT ==========

interface AISuggestionCardProps {
    suggestion: AISuggestion;
    onIgnore?: (id: string) => void;
    compact?: boolean;
}

export const AISuggestionCard = ({ suggestion, onIgnore, compact = false }: AISuggestionCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    const cat = categoryConfig[suggestion.category];
    const conf = getConfidenceColor(suggestion.confidence);

    if (isDismissed) return null;

    return (
        <div className={`relative rounded-xl border border-[#E7E5E4] bg-white border-l-[3px] ${cat.accent} transition-all duration-300 overflow-hidden ${isExpanded ? 'shadow-[0_4px_16px_rgba(0,0,0,0.06)]' : 'hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]'}`}>
            <div className={`${compact ? 'px-3 py-2.5' : 'px-4 py-3.5'}`}>
                {/* Top row: Confidence + Category */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ring-1 ${conf.bg} ${conf.text} ${conf.ring}`}>
                            <AutoAwesomeOutlined style={{ fontSize: 10 }} />
                            {suggestion.confidence}%
                        </span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${cat.bg} ${cat.color} border ${cat.border}`}>
                            {cat.icon}
                            {cat.label}
                        </span>
                    </div>
                </div>

                {/* What: Title */}
                <h4 className={`text-[#1C1917] font-medium ${compact ? 'text-[12px]' : 'text-[13px]'} leading-snug mb-1`}>
                    {suggestion.title}
                </h4>

                {/* Why: Reasoning — clamped to 2 lines when collapsed */}
                <p className={`text-[#57534E] font-light leading-relaxed mb-2.5 ${compact ? 'text-[11px]' : 'text-xs'} ${!isExpanded ? 'line-clamp-2' : ''}`}>
                    {suggestion.reasoning}
                </p>

                {/* CTA Buttons */}
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        className={`flex-1 ${compact ? 'h-7 text-[10px]' : 'h-8 text-[11px]'} bg-[#1C1917] hover:bg-[#292524] text-white font-normal rounded-lg shadow-sm transition-all`}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? 'Close' : 'Review'}
                        <ExpandMoreOutlined style={{ fontSize: 14 }} className={`ml-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className={`flex-1 ${compact ? 'h-7 text-[10px]' : 'h-8 text-[11px]'} border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAFAF9] font-normal rounded-lg transition-all`}
                        onClick={() => {
                            setIsDismissed(true);
                            onIgnore?.(suggestion.id);
                        }}
                    >
                        Ignore
                    </Button>
                </div>
            </div>

            {/* Expanded Impact Panel */}
            {isExpanded && (
                <div className="border-t border-[#E7E5E4] bg-[#FAFAF9] px-4 py-3 animate-in slide-in-from-top-2 fade-in duration-300">
                    {/* Impact Summary */}
                    <div className="flex items-start gap-2 mb-3">
                        <AutoAwesomeOutlined style={{ fontSize: 14 }} className="text-[#2DD4BF] mt-0.5 shrink-0" />
                        <div>
                            <div className="text-[10px] text-[#78716C] font-medium uppercase tracking-wider mb-0.5">Impact Analysis</div>
                            <p className="text-xs text-[#1C1917] font-light leading-relaxed">{suggestion.impact.summary}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {/* Affected Members */}
                        {suggestion.impact.affectedMembers && suggestion.impact.affectedMembers.length > 0 && (
                            <div className="bg-white rounded-lg border border-[#E7E5E4] p-2.5">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <GroupsOutlined style={{ fontSize: 12 }} className="text-[#A8A29E]" />
                                    <span className="text-[10px] text-[#78716C] font-medium uppercase tracking-wider">People Affected</span>
                                </div>
                                <div className="space-y-0.5">
                                    {suggestion.impact.affectedMembers.map((m, i) => (
                                        <div key={i} className="text-xs text-[#292524] font-light">{m}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Affected Projects */}
                        {suggestion.impact.affectedProjects && suggestion.impact.affectedProjects.length > 0 && (
                            <div className="bg-white rounded-lg border border-[#E7E5E4] p-2.5">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <AssignmentOutlined style={{ fontSize: 12 }} className="text-[#A8A29E]" />
                                    <span className="text-[10px] text-[#78716C] font-medium uppercase tracking-wider">Projects Affected</span>
                                </div>
                                <div className="space-y-0.5">
                                    {suggestion.impact.affectedProjects.map((p, i) => (
                                        <div key={i} className="text-xs text-[#292524] font-light">{p}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Timeline + Hours + Risk */}
                    <div className="flex items-center flex-wrap gap-3 mt-2.5 pt-2.5 border-t border-[#E7E5E4]/60">
                        {suggestion.impact.timelineEffect && (
                            <div className="flex items-center gap-1.5">
                                <AccessTimeOutlined style={{ fontSize: 13 }} className="text-[#A8A29E]" />
                                <span className="text-[11px] text-[#57534E] font-light">{suggestion.impact.timelineEffect}</span>
                            </div>
                        )}
                        {suggestion.impact.hoursImpact && (
                            <div className="flex items-center gap-1.5">
                                <SwapHorizOutlined style={{ fontSize: 13 }} className="text-[#A8A29E]" />
                                <span className="text-[11px] text-[#57534E] font-light">{suggestion.impact.hoursImpact}</span>
                            </div>
                        )}
                        {suggestion.impact.riskLevel && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getRiskBadge(suggestion.impact.riskLevel).bg} ${getRiskBadge(suggestion.impact.riskLevel).text}`}>
                                {suggestion.impact.riskLevel.charAt(0).toUpperCase() + suggestion.impact.riskLevel.slice(1)} Risk
                            </span>
                        )}
                    </div>

                    {/* Apply action */}
                    <div className="mt-3 flex justify-end">
                        <Button
                            size="sm"
                            className="h-7 text-[11px] bg-[#2DD4BF] hover:bg-[#14B8A6] text-white font-normal rounded-lg shadow-sm transition-all px-4"
                            onClick={() => setIsExpanded(false)}
                        >
                            <CheckCircleOutlined style={{ fontSize: 14 }} className="mr-1.5" />
                            Apply Suggestion
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ========== PANEL WRAPPER ==========

interface AISuggestionPanelProps {
    suggestions: AISuggestion[];
    title?: string;
    compact?: boolean;
    className?: string;
}

export const AISuggestionPanel = ({ suggestions, title = 'AI Suggestions', compact = false, className = '' }: AISuggestionPanelProps) => {
    return (
        <div className={className}>
            <div className="flex items-center gap-2 mb-4">
                <AutoAwesomeOutlined style={{ fontSize: 18 }} className="text-[#2DD4BF]" />
                <h3 className={`${compact ? 'text-sm' : 'text-base'} font-medium text-[#1C1917]`}>{title}</h3>
            </div>
            <div className="space-y-3">
                {suggestions.map((s) => (
                    <AISuggestionCard key={s.id} suggestion={s} compact={compact} />
                ))}
            </div>
        </div>
    );
};

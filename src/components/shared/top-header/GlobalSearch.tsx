import React, { useState, useEffect, useRef } from 'react';
import { Search, Briefcase, Users, CheckSquare, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { searchService, type SearchResult } from '@/services/searchService';
import { useIsMobile } from '@/hooks/use-mobile';


export const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = setTimeout(async () => {
            if (query.length > 1) {
                setIsLoading(true);
                const searchResults = await searchService.searchAll(query);
                setResults(searchResults);
                setSelectedIndex(-1);
                setIsOpen(true);
                setIsLoading(false);
            } else {
                setResults([]);
                setIsOpen(false);
                setSelectedIndex(-1);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(handler);
    }, [query]);

    useEffect(() => {
        const handleSlash = (e) => {
            if (e.key === "/" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
                e.preventDefault();
                if (inputRef.current) inputRef.current.focus();
            }
        };
        window.addEventListener("keydown", handleSlash);
        return () => window.removeEventListener("keydown", handleSlash);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (path: string) => {
        navigate(path);
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < results.length) {
                handleSelect(results[selectedIndex].path);
            } else if (results.length > 0) {
                // If no item is selected, default to the first one
                handleSelect(results[0].path);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div ref={containerRef} className="flex-1 w-full max-w-xl relative">
            <div className="relative group">
                <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A8A29E] group-focus-within:text-[#191919] transition-colors"
                    strokeWidth={1.75}
                />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    ref={inputRef}
                    placeholder={isMobile ? "Search..." : "Search projects, people, tasks... (press /)"}
                    className="pl-10 h-10 bg-white border border-[#E7E5E4] rounded-lg text-sm focus:bg-white focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF]/20 focus:shadow-sm transition-all placeholder:text-[#D6D3D1] font-light shadow-sm"
                />
                <button
                    onClick={() => { if (query.length > 1) setIsOpen(true); }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-[#F5F5F4] rounded-md transition-colors"
                >
                    <Search className="h-3.5 w-3.5 text-[#2DD4BF]" strokeWidth={2} />
                </button>
            </div>

            {isOpen && (
                <div className={`absolute top-full ${isMobile ? '-right-4 w-[calc(100vw-32px)]' : 'left-0 right-0'} mt-2 bg-white border border-[#E7E5E4] rounded-xl shadow-xl shadow-stone-200/50 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}>
                    <div className="p-2">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="w-5 h-5 border-2 border-[#2DD4BF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-sm text-[#A8A29E]">Searching...</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
                                {results.map((result, idx) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleSelect(result.path)}
                                        className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left ${idx === selectedIndex ? 'bg-[#FAFAF9] ring-1 ring-[#E7E5E4]' : 'hover:bg-[#FAFAF9]'}`}
                                    >
                                        <div className="w-8 h-8 rounded bg-[#F5F5F4] flex items-center justify-center text-[#78716C]">
                                            {result.type === 'project' && <Briefcase className="w-4 h-4" strokeWidth={1.5} />}
                                            {result.type === 'people' && <Users className="w-4 h-4" strokeWidth={1.5} />}
                                            {result.type === 'task' && <CheckSquare className="w-4 h-4" strokeWidth={1.5} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[#1C1917] truncate">{result.title}</p>
                                            <p className="text-[10px] text-[#A8A29E] uppercase tracking-wider font-medium">{result.subtitle}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-[#D6D3D1]" strokeWidth={1.5} />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-sm text-[#A8A29E]">No matching results found.</p>
                            </div>
                        )}
                    </div>
                    {!isMobile && (
                        <div className="p-3 bg-[#FAFAF9] border-t border-[#F5F5F4] flex items-center justify-between">
                            <span className="text-[10px] text-[#A8A29E] font-medium uppercase tracking-widest">Global Search</span>
                            <div className="flex gap-2">
                                <span className="px-1.5 py-0.5 rounded border border-[#E7E5E4] text-[9px] text-[#78716C] bg-white">ESC to close</span>
                                <span className="px-1.5 py-0.5 rounded border border-[#E7E5E4] text-[9px] text-[#78716C] bg-white">↕ to navigate</span>
                                <span className="px-1.5 py-0.5 rounded border border-[#E7E5E4] text-[9px] text-[#78716C] bg-white">↵ to select</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

import React from 'react';
import { AutoAwesomeOutlined, SyncOutlined, DescriptionOutlined, CloudUploadOutlined, CloseOutlined, ErrorOutlineOutlined } from '@mui/icons-material';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface PlanHeaderProps {
    projectDescription: string;
    setProjectDescription: (desc: string) => void;
    uploadedFileName: string | null;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    clearFileUpload: () => void;
    descriptionError: string | null;
    isAnalyzing: boolean;
    analysisStatus: string;
    thoughtLines: string[];
    handleAnalyze: () => void;
}

export const PlanHeader: React.FC<PlanHeaderProps> = ({
    projectDescription, setProjectDescription, uploadedFileName, handleFileUpload, clearFileUpload,
    descriptionError, isAnalyzing, analysisStatus, thoughtLines, handleAnalyze
}) => {
    return (
        <>
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-4xl font-light tracking-tight mb-2 text-[#1C1917]">Plan My Project</h1>
                <p className="text-sm text-[#78716C]">AI-Powered Task Decomposition & Resource Allocation</p>
            </div>

            {/* Input Card */}
            <div className="relative rounded-2xl mb-10 p-[1px]" style={{
                 backgroundImage: isAnalyzing ? 'linear-gradient(135deg, #0F766E, #10B981)' : 'linear-gradient(135deg, #E7E5E4, #CCFBF1)',
                 animation: isAnalyzing ? 'gradientShift 2s ease infinite' : 'none'
            }}>
                <div className="bg-white/85 backdrop-blur-[40px] rounded-2xl p-10">
                    <Label className="text-sm font-light text-[#78716C] block mb-3">Project Description</Label>
                    
                    <div className="relative mb-5 rounded-xl overflow-hidden" style={{ border: '1px solid #E7E5E4', background: 'rgba(255,255,255,0.6)' }}>
                        <Textarea 
                            value={projectDescription} 
                            onChange={e => setProjectDescription(e.target.value)} 
                            className="min-h-[140px] font-light rounded-xl border-none focus:bg-white transition-all duration-300 resize-y pb-12"
                            style={{ background: 'transparent' }}
                            placeholder="Describe your project in detail..."
                        />
                        
                        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2.5" style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0.7))' }}>
                            {uploadedFileName ? (
                                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #F0FDFA, #CCFBF1)', border: '1px solid #99F6E4' }}>
                                    <DescriptionOutlined style={{ fontSize: 14 }} className="text-[#0F766E]" />
                                    <span className="text-xs text-[#1C1917] font-light max-w-[180px] truncate">{uploadedFileName}</span>
                                    <button type="button" onClick={clearFileUpload} className="p-0.5 rounded text-[#78716C] hover:text-[#1C1917]">
                                        <CloseOutlined style={{ fontSize: 12 }} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#78716C] hover:text-[#0F766E] hover:bg-[#F0FDFA] cursor-pointer">
                                    <CloudUploadOutlined style={{ fontSize: 16 }} />
                                    <span className="text-xs font-light">Upload document</span>
                                    <input type="file" className="hidden" accept=".pdf,.docx,.doc,.txt" onChange={handleFileUpload} />
                                </label>
                            )}
                        </div>
                    </div>
                    
                    {descriptionError && (
                        <div className="flex items-start gap-2.5 mb-5 p-4 rounded-xl border border-[#FECDD3] bg-[#FFF1F2]">
                            <ErrorOutlineOutlined style={{ fontSize: 18 }} className="text-[#BE123C] mt-0.5 shrink-0" />
                            <span className="text-sm text-[#BE123C] font-light">{descriptionError}</span>
                        </div>
                    )}

                    {isAnalyzing && (
                        <div className="mt-4 p-4 bg-[#F5F5F4] rounded-xl space-y-2">
                            <div className="text-[#0F766E] font-medium text-sm flex items-center gap-2">
                                <SyncOutlined className="animate-spin" style={{ fontSize: 14 }} />
                                {analysisStatus}
                            </div>
                            {thoughtLines.map((line, i) => (
                                <div key={i} className="text-xs text-[#78716C] ml-6 animate-in fade-in">{line}</div>
                            ))}
                        </div>
                    )}

                    <div className="mt-6">
                        <Button 
                            onClick={handleAnalyze} 
                            disabled={isAnalyzing}
                            className="w-full h-11 bg-[#1C1917] hover:bg-[#0F766E] transition-colors text-white"
                        >
                            {isAnalyzing ? <><SyncOutlined className="mr-2 animate-spin" style={{fontSize: 16}}/> Processing...</> : <><AutoAwesomeOutlined className="mr-2" style={{fontSize: 16}}/> Analyze with AI</>}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};
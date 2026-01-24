import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Search, Sparkles } from 'lucide-react';

interface ProjectCheckInputProps {
  onAnalyze: (description: string) => void;
  isAnalyzing: boolean;
}

export const ProjectCheckInput: React.FC<ProjectCheckInputProps> = ({ onAnalyze, isAnalyzing }) => {
  const [desc, setDesc] = useState('');

  return (
    <Card className="p-6 border-indigo-100 bg-gradient-to-r from-white to-indigo-50/30">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">AI Resource Allocator</h3>
            <p className="text-sm text-gray-500">Describe your project requirements. Our ML model will analyze historical performance to find the best-fit team.</p>
          </div>
          
          <Textarea 
            placeholder="E.g., We need a team for a new Fintech dashboard using React and Node.js. Requires strong API integration skills..."
            className="min-h-[120px] bg-white text-base resize-none border-indigo-200 focus:border-indigo-500"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />

          <div className="flex justify-end">
            <Button 
              onClick={() => onAnalyze(desc)} 
              disabled={!desc.trim() || isAnalyzing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-6 rounded-xl shadow-xl shadow-indigo-200 transition-all hover:scale-105"
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">Analyzing Dataset...</span>
              ) : (
                <span className="flex items-center gap-2"><Search className="w-4 h-4"/> Find Matching Talent</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
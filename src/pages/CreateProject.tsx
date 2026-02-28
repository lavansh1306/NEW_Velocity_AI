import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, ChevronDown, Check } from 'lucide-react';

// Mock data for team members based on the design
const TEAM_MEMBERS = [
  { id: 1, name: 'Sarah Chen', role: 'Frontend Lead', availability: '0%', initials: 'SC' },
  { id: 2, name: 'Marcus Johnson', role: 'Backend Dev', availability: '5%', initials: 'MJ' },
  { id: 3, name: 'Emily Rodriguez', role: 'UI Designer', availability: '7%', initials: 'ER' },
  { id: 4, name: 'David Kim', role: 'Full Stack', availability: '0%', initials: 'DK' },
  { id: 5, name: 'Alex Park', role: 'DevOps Engineer', availability: '35%', initials: 'AP' },
];

export default function CreateProject() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([{ id: 1, name: '', assignee: '', hours: '', timeline: '' }]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  const handleAddTask = () => {
    setTasks([...tasks, { id: Date.now(), name: '', assignee: '', hours: '', timeline: '' }]);
  };

  const toggleMember = (id: number) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <VelocityAISidebar>
      <div className="bg-[#FAFAF9] min-h-screen p-8 md:p-12 font-['Inter',sans-serif]">
        <div className="max-w-[1200px] mx-auto">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-[#E7E5E4] rounded-full transition-colors text-[#78716C]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-light text-[#1C1917] tracking-tight">Create New Project</h1>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-[24px] border border-[#E7E5E4] p-8 shadow-sm">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* Left Column: Form Fields */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-4 gap-6">
                  <div className="col-span-3 space-y-2">
                    <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Project Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Mobile App Redesign" 
                      className="w-full h-11 px-4 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C1917] text-[#1C1917] placeholder:text-[#A8A29E]"
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Key</label>
                    <input 
                      type="text" 
                      className="w-full h-11 px-4 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C1917] text-[#1C1917]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Project Type</label>
                  <div className="relative">
                    <select className="w-full h-11 px-4 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-[#1C1917] text-[#1C1917]">
                      <option>Scrum Software Development</option>
                      <option>Kanban</option>
                      <option>Task Tracking</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Project Lead</label>
                  <div className="relative">
                    <select className="w-full h-11 px-4 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-[#1C1917] text-[#78716C]">
                      <option value="" disabled selected>Select a lead</option>
                      <option>Sarah Chen</option>
                      <option>John Doe</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Description</label>
                  <textarea 
                    placeholder="Describe the project goals and objectives..." 
                    className="w-full h-32 px-4 py-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C1917] text-[#1C1917] placeholder:text-[#A8A29E] resize-none"
                  />
                </div>
              </div>

              {/* Right Column: Team Selection */}
              <div className="lg:col-span-1 border-l border-[#E7E5E4] lg:pl-12">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-medium text-[#1C1917]">Add Team Members</h3>
                  <span className="text-xs text-[#78716C] bg-[#F5F5F4] px-2 py-1 rounded-md">{selectedMembers.length} selected</span>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {TEAM_MEMBERS.map(member => (
                    <div 
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                        selectedMembers.includes(member.id) 
                          ? 'bg-[#FAFAF9] border-[#1C1917]' 
                          : 'bg-white border-transparent hover:bg-[#FAFAF9]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-white border border-[#E7E5E4] flex items-center justify-center text-xs font-medium text-[#1C1917] shadow-sm">
                        {member.initials}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-[#1C1917]">{member.name}</p>
                          <span className={`text-xs font-medium ${member.availability === '0%' ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                            {member.availability}
                          </span>
                        </div>
                        <p className="text-xs text-[#78716C]">{member.role}</p>
                      </div>
                      {selectedMembers.includes(member.id) && (
                        <Check className="w-4 h-4 text-[#1C1917]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Section: Initial Plan */}
            <div className="mt-12 pt-8 border-t border-[#E7E5E4]">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-lg font-medium text-[#1C1917]">Initial Project Plan</h3>
                  <p className="text-sm text-[#78716C] mt-1">Outline key tasks and assign responsibilities</p>
                </div>
                <Button 
                  onClick={handleAddTask}
                  variant="outline"
                  className="bg-white border-[#E7E5E4] text-[#1C1917] hover:bg-[#FAFAF9] h-9 text-xs"
                >
                  <Plus className="w-3 h-3 mr-2" /> Add Task
                </Button>
              </div>

              <div className="bg-[#FAFAF9] rounded-xl border border-[#E7E5E4] overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[#E7E5E4] text-xs font-bold text-[#A8A29E] uppercase tracking-wider">
                  <div className="col-span-5">Task Name</div>
                  <div className="col-span-3">Assignee</div>
                  <div className="col-span-2">Est. Hours</div>
                  <div className="col-span-2">Timeline</div>
                </div>
                
                <div className="divide-y divide-[#E7E5E4]">
                  {tasks.map((task, index) => (
                    <div key={task.id} className="grid grid-cols-12 gap-4 px-6 py-3 bg-white items-center">
                      <div className="col-span-5">
                        <input 
                          type="text" 
                          placeholder={index === 0 ? "e.g. Database Setup" : "Task name"}
                          className="w-full text-sm bg-transparent focus:outline-none placeholder:text-[#D6D3D1] text-[#1C1917]"
                        />
                      </div>
                      <div className="col-span-3">
                        <select className="w-full text-sm bg-transparent focus:outline-none text-[#78716C]">
                          <option>Unassigned</option>
                          {TEAM_MEMBERS.filter(m => selectedMembers.includes(m.id)).map(m => (
                            <option key={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="number" 
                          placeholder="0"
                          className="w-20 text-sm bg-transparent focus:outline-none placeholder:text-[#D6D3D1] text-[#1C1917]"
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="text" 
                          placeholder="e.g. Week 1"
                          className="w-full text-sm bg-transparent focus:outline-none placeholder:text-[#D6D3D1] text-[#1C1917]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 mt-8">
              <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F5F4]"
              >
                Cancel
              </Button>
              <Button 
                className="bg-[#1C1917] hover:bg-[#292524] text-white px-8 rounded-xl"
              >
                Create Project
              </Button>
            </div>

          </div>
        </div>
      </div>
    </VelocityAISidebar>
  );
}
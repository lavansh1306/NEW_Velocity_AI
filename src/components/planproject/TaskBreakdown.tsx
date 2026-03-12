import React from 'react';
import { AutoAwesomeOutlined, AddOutlined, CloseOutlined, CheckOutlined } from '@mui/icons-material';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { EditableTask } from '../../types'; // Adjust path as needed

interface TaskBreakdownProps {
    tasks: EditableTask[];
    editingTaskId: string | null;
    editForm: { task: string; estimatedHours: number };
    showAddRow: boolean;
    addForm: { task: string; estimatedHours: number };
    setEditForm: React.Dispatch<React.SetStateAction<{ task: string; estimatedHours: number }>>;
    setAddForm: React.Dispatch<React.SetStateAction<{ task: string; estimatedHours: number }>>;
    setShowAddRow: (show: boolean) => void;
    startEdit: (t: EditableTask) => void;
    saveEdit: () => void;
    handleRemoveTask: (id: string) => void;
    handleAddTask: () => void;
    cancelEdit: () => void;
}

export const TaskBreakdown: React.FC<TaskBreakdownProps> = ({
    tasks, editingTaskId, editForm, showAddRow, addForm,
    setEditForm, setAddForm, setShowAddRow,
    startEdit, saveEdit, handleRemoveTask, handleAddTask, cancelEdit
}) => {
    return (
        <div className="relative rounded-2xl mb-10 p-[1px]" style={{ background: 'linear-gradient(135deg, rgba(231,229,228,0.6), rgba(204,251,241,0.3), rgba(231,229,228,0.6))' }}>
            <div className="bg-white/85 backdrop-blur-[40px] rounded-2xl p-10" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)' }}>
                
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F0FDFA, #CCFBF1)' }}>
                            <AutoAwesomeOutlined style={{ fontSize: 16 }} className="text-[#0F766E]" />
                        </div>
                        <h2 className="text-xl font-light text-[#1C1917]">Generated Task Breakdown</h2>
                    </div>
                    <Button variant="outline" className="h-9 px-4 rounded-lg border-[#E7E5E4] bg-white/50 hover:bg-white text-[#78716C]" onClick={() => setShowAddRow(true)}>
                        <AddOutlined style={{ fontSize: 14 }} className="mr-1.5" /> Add Task
                    </Button>
                </div>

                <div className="w-full">
                    <div className="flex items-center pb-4 border-b border-[#E7E5E4] mb-2">
                        <div className="flex-1 text-xs text-[#78716C] uppercase tracking-wider font-light">Task Name</div>
                        <div className="w-28 text-right text-xs text-[#78716C] uppercase tracking-wider font-light">Est. Hours</div>
                        <div className="w-24 text-right text-xs text-[#78716C] uppercase tracking-wider font-light">Actions</div>
                    </div>

                    <div className="space-y-0.5">
                        {tasks.map((task) => (
                            <div key={task.id} className="flex items-center py-4 border-b border-[#F5F5F4] last:border-0 hover:bg-[#F0FDFA]/30 transition-all px-2 -mx-2 rounded-lg group">
                                {editingTaskId === task.id ? (
                                    <div className="contents">
                                        <div className="flex-1 pr-4">
                                            <Input className="h-8 text-sm font-light border-[#E7E5E4] bg-white rounded-lg" value={editForm.task} onChange={e => setEditForm(f => ({ ...f, task: e.target.value }))} autoFocus />
                                        </div>
                                        <div className="w-28 flex justify-end pr-4">
                                            <Input type="number" className="h-8 w-20 text-sm font-light border-[#E7E5E4] bg-white rounded-lg text-right" value={editForm.estimatedHours} onChange={e => setEditForm(f => ({ ...f, estimatedHours: Number(e.target.value) }))} />
                                        </div>
                                        <div className="w-24 flex justify-end gap-1">
                                            <button type="button" onClick={saveEdit} className="p-1.5 rounded-md text-[#0F766E] hover:bg-[#CCFBF1] transition-colors"><CheckOutlined style={{ fontSize: 14 }} /></button>
                                            <button type="button" onClick={cancelEdit} className="p-1.5 rounded-md bg-[#F5F5F4] text-[#78716C] hover:bg-[#E7E5E4] transition-colors"><CloseOutlined style={{ fontSize: 14 }} /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="contents">
                                        <div className="flex-1 text-sm text-[#1C1917] font-light">{task.task}</div>
                                        <div className="w-28 text-right text-sm text-[#78716C] font-light">{task.estimatedHours}h</div>
                                        <div className="w-24 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="button" onClick={() => startEdit(task)} className="p-1.5 rounded-md text-[#78716C] hover:bg-[#F5F5F4] hover:text-[#1C1917] transition-colors"><AutoAwesomeOutlined style={{ fontSize: 14 }} /></button>
                                            <button type="button" onClick={() => handleRemoveTask(task.id)} className="p-1.5 rounded-md text-[#78716C] hover:bg-[#FFF1F2] hover:text-[#BE123C] transition-colors"><CloseOutlined style={{ fontSize: 14 }} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {showAddRow && (
                            <div className="flex items-center py-4 border-b border-[#F5F5F4] px-2 -mx-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #FAFAF9, #F0FDFA)' }}>
                                <div className="flex-1 pr-4">
                                    <Input placeholder="New task name..." className="h-8 text-sm font-light border-[#E7E5E4] bg-white rounded-lg" value={addForm.task} onChange={e => setAddForm(f => ({ ...f, task: e.target.value }))} autoFocus />
                                </div>
                                <div className="w-28 flex justify-end pr-4">
                                    <Input type="number" placeholder="Hrs" className="h-8 w-20 text-sm font-light border-[#E7E5E4] bg-white rounded-lg text-right" value={addForm.estimatedHours || ''} onChange={e => setAddForm(f => ({ ...f, estimatedHours: Number(e.target.value) }))} />
                                </div>
                                <div className="w-24 flex justify-end gap-1">
                                    <button type="button" onClick={handleAddTask} className="p-1.5 rounded-md text-[#0F766E] hover:bg-[#CCFBF1] transition-colors"><CheckOutlined style={{ fontSize: 14 }} /></button>
                                    <button type="button" onClick={() => { setShowAddRow(false); setAddForm({ task: '', estimatedHours: 0 }); }} className="p-1.5 rounded-md bg-[#F5F5F4] text-[#78716C] hover:bg-[#E7E5E4] transition-colors"><CloseOutlined style={{ fontSize: 14 }} /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
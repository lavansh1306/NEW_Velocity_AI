import React, { useState } from 'react';
import { Plus, X, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../ui/button';

interface Leave {
  id: string;
  employee: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface ProjectLeaveManagementProps {
  projectId: string;
  projectName: string;
}

export const ProjectLeaveManagement: React.FC<ProjectLeaveManagementProps> = ({ projectId, projectName }) => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const handleAddLeave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    const newLeave: Leave = {
      id: `${projectId}-${Date.now()}`,
      employee: formData.employee,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      status: 'pending',
    };

    setLeaves([...leaves, newLeave]);
    setFormData({ employee: '', startDate: '', endDate: '', reason: '' });
    setShowForm(false);
  };

  const handleRemoveLeave = (id: string) => {
    setLeaves(leaves.filter(leave => leave.id !== id));
  };

  const handleApprove = (id: string) => {
    setLeaves(leaves.map(leave => 
      leave.id === id ? { ...leave, status: 'approved' } : leave
    ));
  };

  const handleReject = (id: string) => {
    setLeaves(leaves.map(leave => 
      leave.id === id ? { ...leave, status: 'rejected' } : leave
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-light text-gray-900">Leave Management for {projectName}</h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 h-10 px-4 rounded-xl font-light text-white"
        >
          <Plus className="w-4 h-4" />
          Add Leave
        </Button>
      </div>

      {/* Form for adding new leave */}
      {showForm && (
        <form onSubmit={handleAddLeave} className="bg-indigo-50 rounded-xl p-4 mb-6 border border-indigo-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-light text-gray-700 mb-2">Employee Name *</label>
              <input
                type="text"
                value={formData.employee}
                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                placeholder="Enter employee name"
                className="w-full px-4 py-2 border border-indigo-300 rounded-lg font-light focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm font-light text-gray-700 mb-2">Reason</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g., Vacation, Sick Leave"
                className="w-full px-4 py-2 border border-indigo-300 rounded-lg font-light focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-light text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-indigo-300 rounded-lg font-light focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm font-light text-gray-700 mb-2">End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-indigo-300 rounded-lg font-light focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              onClick={() => setShowForm(false)}
              variant="outline"
              className="rounded-lg font-light"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-light"
            >
              Add Leave
            </Button>
          </div>
        </form>
      )}

      {/* List of leaves */}
      <div className="space-y-3">
        {leaves.length === 0 ? (
          <div className="text-center py-8 text-gray-500 font-light">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No leave requests yet. Click "Add Leave" to create one.</p>
          </div>
        ) : (
          leaves.map((leave) => (
            <div
              key={leave.id}
              className={`border-2 rounded-lg p-4 flex items-center justify-between transition-colors ${getStatusColor(leave.status)}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(leave.status)}
                  <span className="font-light text-sm font-semibold">{leave.employee}</span>
                  <span className="text-xs font-light px-2 py-1 bg-white/50 rounded">
                    {leave.reason || 'Leave'}
                  </span>
                </div>
                <p className="text-xs font-light text-opacity-75">
                  {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {leave.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleApprove(leave.id)}
                      className="bg-green-600 hover:bg-green-700 text-white rounded px-3 py-1 text-sm font-light h-8"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(leave.id)}
                      className="bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1 text-sm font-light h-8"
                    >
                      Reject
                    </Button>
                  </>
                )}
                <button
                  onClick={() => handleRemoveLeave(leave.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {leaves.length > 0 && (
        <div className="mt-6 pt-4 border-t border-indigo-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-semibold text-indigo-600">{leaves.filter(l => l.status === 'pending').length}</p>
              <p className="text-xs font-light text-gray-600">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-green-600">{leaves.filter(l => l.status === 'approved').length}</p>
              <p className="text-xs font-light text-gray-600">Approved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-red-600">{leaves.filter(l => l.status === 'rejected').length}</p>
              <p className="text-xs font-light text-gray-600">Rejected</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

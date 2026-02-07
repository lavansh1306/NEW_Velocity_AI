import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle2, XCircle, Bot, Zap, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface LeaveRequest {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface ApprovalResult {
  leaveId: number;
  approved: boolean;
  reason: string;
  validationsPassed: string[];
  validationsFailed: string[];
  confidence: number;
  timestamp: string;
  decisionMethod: 'weighted-scoring' | 'gemini-reasoning' | 'hybrid';
  weightedScore?: number;
}

interface ApprovalSummary {
  total: number;
  approved: number;
  rejected: number;
  averageConfidence: number;
  commonFailures: Record<string, number>;
}

interface LeaveApprovalAgentProps {
  leaves: LeaveRequest[];
  onApprovalsComplete?: (results: ApprovalResult[], summary: ApprovalSummary) => void;
}

export const LeaveApprovalAgent: React.FC<LeaveApprovalAgentProps> = ({ leaves, onApprovalsComplete }) => {
  const [isApproving, setIsApproving] = useState(false);
  const [approvalResults, setApprovalResults] = useState<ApprovalResult[]>([]);
  const [summary, setSummary] = useState<ApprovalSummary | null>(null);
  const [selectedResult, setSelectedResult] = useState<ApprovalResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const apiUrl = (path: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    return `${baseUrl}${path}`;
  };

  const approveAllLeaves = async () => {
    if (leaves.length === 0) {
      toast.error('No leave requests to approve');
      return;
    }

    setIsApproving(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(apiUrl('/api/leave-approval/approve-batch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaves: leaves.map(l => ({
            id: l.id,
            name: l.name,
            startDate: l.startDate,
            endDate: l.endDate,
            reason: l.reason,
            status: l.status,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setApprovalResults(data.data.results);
        setSummary(data.data.summary);
        onApprovalsComplete?.(data.data.results, data.data.summary);

        const approvedCount = data.data.results.filter((r: ApprovalResult) => r.approved).length;
        toast.success(`Agent processed ${leaves.length} leave requests. ${approvedCount} approved.`, {
          duration: 5000,
        });
      } else {
        toast.error('Failed to process leave requests');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error approving leaves:', error);
        toast.error(`Error: ${error.message}`);
      }
    } finally {
      setIsApproving(false);
      abortControllerRef.current = null;
    }
  };

  const cancelApproval = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsApproving(false);
      toast.info('Approval process cancelled');
    }
  };

  const resetResults = () => {
    setApprovalResults([]);
    setSummary(null);
    setSelectedResult(null);
  };

  // Show summary if available
  if (summary && approvalResults.length > 0) {
    return (
      <div className="space-y-4">
        {/* Summary Card */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Bot className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Leave Approval Agent - Results</CardTitle>
                  <CardDescription>Automated leave request processing completed</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50">
                Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{summary.total}</div>
                <div className="text-xs text-slate-600">Total Processed</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{summary.approved}</div>
                <div className="text-xs text-green-600">Approved</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{summary.rejected}</div>
                <div className="text-xs text-red-600">Rejected</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{summary.averageConfidence}%</div>
                <div className="text-xs text-blue-600">Avg. Confidence</div>
              </div>
            </div>

            {/* Common Failures */}
            {Object.keys(summary.commonFailures).length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <div className="text-sm font-medium text-amber-900">Common Issues</div>
                </div>
                <ul className="text-xs space-y-1">
                  {Object.entries(summary.commonFailures).map(([failure, count]) => (
                    <li key={failure} className="text-amber-700">
                      • {failure}: {count} case(s)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={resetResults} variant="outline" className="flex-1">
                Process New Requests
              </Button>
              <Button onClick={() => {}} className="flex-1 bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Finalize Approvals
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Detailed Results ({approvalResults.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {approvalResults.map((result) => (
              <button
                key={result.leaveId}
                onClick={() => setSelectedResult(result)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedResult?.leaveId === result.leaveId
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {result.approved ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-slate-900">
                        Leave #{result.leaveId}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {result.reason.substring(0, 50)}...
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <Badge variant={result.approved ? 'default' : 'secondary'} className="text-xs">
                      {result.confidence}%
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Result Details */}
        {selectedResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedResult.approved ? '✓ Approved' : '✗ Review Needed'} - Leave #{selectedResult.leaveId}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-slate-600 uppercase font-semibold">Reason</div>
                <div className="text-sm text-slate-900">{selectedResult.reason}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-600 uppercase font-semibold">Decision Method</div>
                  <div className="mt-1">
                    <Badge variant="outline" 
                      className={
                        selectedResult.decisionMethod === 'weighted-scoring' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        selectedResult.decisionMethod === 'gemini-reasoning' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-pink-50 text-pink-700 border-pink-200'
                      }
                    >
                      {selectedResult.decisionMethod === 'weighted-scoring' && '⚡ Weighted Score'}
                      {selectedResult.decisionMethod === 'gemini-reasoning' && '🤖 Gemini AI'}
                      {selectedResult.decisionMethod === 'hybrid' && '🔄 Hybrid'}
                    </Badge>
                  </div>
                </div>
                {selectedResult.weightedScore !== undefined && (
                  <div>
                    <div className="text-xs text-slate-600 uppercase font-semibold">Weighted Score</div>
                    <div className="mt-1 text-lg font-bold text-indigo-600">{selectedResult.weightedScore}/100</div>
                  </div>
                )}
              </div>

              {selectedResult.validationsPassed.length > 0 && (
                <div>
                  <div className="text-xs text-slate-600 uppercase font-semibold mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Validations Passed
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedResult.validationsPassed.map((v) => (
                      <Badge key={v} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedResult.validationsFailed.length > 0 && (
                <div>
                  <div className="text-xs text-slate-600 uppercase font-semibold mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Validations Failed
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedResult.validationsFailed.map((v) => (
                      <Badge key={v} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-500 pt-2 border-t">
                <Clock className="w-3 h-3 inline mr-1" />
                Processed: {new Date(selectedResult.timestamp).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show initial state with approve button
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Bot className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle>Leave Approval Agent</CardTitle>
              <CardDescription>
                Auto-approve leave requests ({leaves.length} pending)
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-50">
            Ready
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-900 flex items-start gap-2">
            <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Hybrid AI Approval Mode</div>
              <div className="text-xs text-blue-700 mt-1">
                Uses Weighted Scoring for routine approvals and Gemini AI for complex borderline cases
              </div>
            </div>
          </div>
        </div>

        {leaves.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-medium text-slate-900 mb-2">Pending Approvals:</div>
              <ul className="space-y-2">
                {leaves.slice(0, 5).map((leave) => (
                  <li key={leave.id} className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {leave.name} - {leave.startDate} to {leave.endDate}
                    </span>
                  </li>
                ))}
                {leaves.length > 5 && (
                  <li className="text-xs text-slate-500 italic">
                    +{leaves.length - 5} more...
                  </li>
                )}
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              {isApproving ? (
                <Button onClick={cancelApproval} variant="outline" className="flex-1">
                  Cancel
                </Button>
              ) : (
                <>
                  <Button onClick={approveAllLeaves} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                    <Zap className="w-4 h-4 mr-2" />
                    Run Agent
                  </Button>
                </>
              )}
            </div>

            {isApproving && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-600">
                <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
                Processing {leaves.length} leave requests...
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-slate-500">
            No pending leave requests
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveApprovalAgent;

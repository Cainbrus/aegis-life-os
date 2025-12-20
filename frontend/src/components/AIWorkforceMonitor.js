import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AIWorkforceMonitor = ({ ownerMode, authStatus }) => {
  const [workforceStatus, setWorkforceStatus] = useState(null);
  const [activeJobs, setActiveJobs] = useState([]);
  const [workforceActivity, setWorkforceActivity] = useState([]);

  useEffect(() => {
    if (ownerMode) {
      loadWorkforceStatus();
      const interval = setInterval(loadWorkforceStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [ownerMode]);

  const loadWorkforceStatus = async () => {
    try {
      const response = await axios.get(`${API}/workforce/status`);
      setWorkforceStatus(response.data);
      setActiveJobs(response.data.active_jobs || []);
      setWorkforceActivity(response.data.recent_activity || []);
    } catch (error) {
      console.error('Failed to load workforce status:', error);
      // Fallback to mock data for demo
      setMockWorkforceData();
    }
  };

  const setMockWorkforceData = () => {
    setWorkforceStatus({
      owner_status: "ACTIVE",
      manager_status: "COORDINATING",
      workers_active: 8,
      total_workers: 12,
      current_load: "MODERATE"
    });

    setActiveJobs([
      {
        id: "job_001",
        title: "Analyzing morning schedule conflicts",
        assigned_to: "Calendar Agent (L3)",
        status: "IN_PROGRESS",
        priority: "HIGH",
        started_at: "2 minutes ago"
      },
      {
        id: "job_002", 
        title: "Processing security threat assessment",
        assigned_to: "Security Specialist (L4)",
        status: "ANALYZING",
        priority: "CRITICAL",
        started_at: "30 seconds ago"
      },
      {
        id: "job_003",
        title: "Optimizing photo organization",
        assigned_to: "Photos Agent (L3)",
        status: "QUEUED",
        priority: "LOW",
        started_at: "Pending"
      }
    ]);

    setWorkforceActivity([
      {
        timestamp: "09:15:32",
        agent: "L2 Manager",
        action: "Delegated conflict analysis to Calendar Agent",
        type: "DELEGATION"
      },
      {
        timestamp: "09:15:28",
        agent: "L1 Owner",
        action: "Approved proactive suggestion deployment",
        type: "APPROVAL"
      },
      {
        timestamp: "09:15:15",
        agent: "Security Agent (L4)",
        action: "Completed behavioral pattern analysis",
        type: "COMPLETION"
      },
      {
        timestamp: "09:14:52",
        agent: "L2 Manager",
        action: "Assigned priority scoring to Analytics Worker",
        type: "DELEGATION"
      }
    ]);
  };

  if (!ownerMode) {
    return null; // Only show to owner
  }

  return (
    <div className="ai-workforce-monitor bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="text-2xl mr-3">🏢</span>
        AI Workforce Status
      </h2>

      {/* Workforce Hierarchy Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* L1 Owner Status */}
        <div className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-2xl mr-2">👑</span>
              <span className="font-semibold">L1 Owner</span>
            </div>
            <div className={`px-2 py-1 rounded text-xs ${
              workforceStatus?.owner_status === 'ACTIVE' 
                ? 'bg-green-800 text-green-200' 
                : 'bg-gray-800 text-gray-200'
            }`}>
              {workforceStatus?.owner_status || 'ACTIVE'}
            </div>
          </div>
          <div className="text-sm text-purple-200">
            Kernel Guardian • Constitutional Oversight
          </div>
          <div className="text-xs text-purple-300 mt-1">
            Monitoring all workforce operations
          </div>
        </div>

        {/* L2 Manager Status */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🎯</span>
              <span className="font-semibold">L2 Manager</span>
            </div>
            <div className={`px-2 py-1 rounded text-xs ${
              workforceStatus?.manager_status === 'COORDINATING' 
                ? 'bg-blue-800 text-blue-200' 
                : 'bg-gray-800 text-gray-200'
            }`}>
              {workforceStatus?.manager_status || 'COORDINATING'}
            </div>
          </div>
          <div className="text-sm text-blue-200">
            AI Orchestrator • Task Delegation
          </div>
          <div className="text-xs text-blue-300 mt-1">
            Managing {workforceStatus?.workers_active || 8} active workers
          </div>
        </div>

        {/* L3/L4 Workers Status */}
        <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-2xl mr-2">👷</span>
              <span className="font-semibold">L3/L4 Workers</span>
            </div>
            <div className={`px-2 py-1 rounded text-xs ${
              (workforceStatus?.workers_active || 0) > 6
                ? 'bg-green-800 text-green-200' 
                : 'bg-yellow-800 text-yellow-200'
            }`}>
              {workforceStatus?.workers_active || 8}/{workforceStatus?.total_workers || 12}
            </div>
          </div>
          <div className="text-sm text-green-200">
            Specialist Agents • Task Execution  
          </div>
          <div className="text-xs text-green-300 mt-1">
            Load: {workforceStatus?.current_load || 'MODERATE'}
          </div>
        </div>
      </div>

      {/* Active Jobs Board */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <span className="text-xl mr-2">📋</span>
          Active Jobs
        </h3>
        <div className="space-y-2">
          {activeJobs.map((job, idx) => (
            <div key={idx} className="bg-slate-700 rounded-lg p-3 border-l-4 border-blue-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-white mb-1">{job.title}</div>
                  <div className="text-sm text-slate-300 mb-1">
                    👤 Assigned to: {job.assigned_to}
                  </div>
                  <div className="text-xs text-slate-400">
                    Started: {job.started_at}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <div className={`px-2 py-1 rounded text-xs ${
                    job.status === 'IN_PROGRESS' ? 'bg-blue-800 text-blue-200' :
                    job.status === 'ANALYZING' ? 'bg-yellow-800 text-yellow-200' :
                    'bg-gray-800 text-gray-200'
                  }`}>
                    {job.status}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    job.priority === 'CRITICAL' ? 'bg-red-800 text-red-200' :
                    job.priority === 'HIGH' ? 'bg-orange-800 text-orange-200' :
                    'bg-slate-800 text-slate-200'
                  }`}>
                    {job.priority}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Workforce Activity */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <span className="text-xl mr-2">⚡</span>
          Recent Activity
        </h3>
        <div className="bg-slate-700 rounded-lg p-4 max-h-48 overflow-y-auto">
          <div className="space-y-2">
            {workforceActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start space-x-3 text-sm">
                <div className="text-slate-400 font-mono text-xs w-16">
                  {activity.timestamp}
                </div>
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'DELEGATION' ? 'bg-blue-400' :
                  activity.type === 'APPROVAL' ? 'bg-green-400' :
                  activity.type === 'COMPLETION' ? 'bg-purple-400' :
                  'bg-gray-400'
                }`}></div>
                <div className="flex-1">
                  <span className="text-slate-300 font-medium">{activity.agent}</span>
                  <span className="text-slate-400"> • {activity.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workforce Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
        <div className="space-x-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
            Assign Task
          </button>
          <button className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded text-sm">
            Workforce Config
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIWorkforceMonitor;
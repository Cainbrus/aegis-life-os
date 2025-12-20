import React, { useState, useEffect } from 'react';

// =============================================
// MEETING SUMMARY SCREEN
// Shows after meeting with notes, action items, next meeting
// =============================================
export const MeetingSummaryScreen = ({ onClose, meetingData }) => {
  const defaultMeeting = {
    title: 'Team Meeting',
    date: 'Today, 10:00 AM - 11:15 AM',
    attendees: ['You', 'Sarah Chen', 'Mike Johnson', 'Lisa Park', 'David Kim'],
    summary: `The team discussed Q1 progress and upcoming deliverables. Key points included the new product launch timeline, marketing budget allocation, and customer feedback integration.

Sarah presented the latest user research findings showing 87% satisfaction rate. Mike raised concerns about the development timeline which were addressed by adjusting sprint priorities.

The team agreed to focus on core features for the MVP and defer advanced analytics to phase 2.`,
    keyDecisions: [
      'MVP launch date set for March 15th',
      'Marketing budget increased by 20%',
      'New hire approved for frontend team',
      'Weekly standups moved to 9:30 AM'
    ],
    actionItems: [
      { task: 'Send proposal draft to client', assignee: 'You', due: 'Tomorrow', priority: 'high' },
      { task: 'Review budget spreadsheet', assignee: 'You', due: 'Wed', priority: 'medium' },
      { task: 'Schedule user interviews', assignee: 'Sarah', due: 'Friday', priority: 'medium' },
      { task: 'Update project timeline', assignee: 'Mike', due: 'Thursday', priority: 'high' }
    ],
    nextMeeting: {
      title: 'Follow-up: Q1 Review',
      date: 'Thursday, 2:00 PM',
      location: 'Conference Room B'
    }
  };

  const meeting = meetingData || defaultMeeting;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">
      {/* Header */}
      <div className="bg-green-600/20 backdrop-blur-xl p-4 border-b border-green-500/30">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-green-400 font-medium">← Back</button>
          <h1 className="text-lg font-bold">📝 Meeting Summary</h1>
          <button className="text-green-400 text-sm">Share</button>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-20">
        {/* Meeting Info */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-1">{meeting.title}</h2>
          <p className="text-slate-400 text-sm">{meeting.date}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {meeting.attendees.map((person, idx) => (
              <span key={idx} className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-full">
                {person}
              </span>
            ))}
          </div>
        </div>

        {/* AI Summary */}
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-4 border border-green-500/30">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">🤖</span>
            <h3 className="font-semibold text-green-300">AI-Generated Summary</h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{meeting.summary}</p>
        </div>

        {/* Key Decisions */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700">
          <h3 className="font-semibold text-yellow-300 mb-3 flex items-center">
            <span className="mr-2">⚡</span> Key Decisions
          </h3>
          <ul className="space-y-2">
            {meeting.keyDecisions.map((decision, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-sm">
                <span className="text-yellow-400 mt-0.5">✓</span>
                <span className="text-slate-300">{decision}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Items */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700">
          <h3 className="font-semibold text-cyan-300 mb-3 flex items-center">
            <span className="mr-2">📋</span> Your Action Items
          </h3>
          <div className="space-y-3">
            {meeting.actionItems.filter(item => item.assignee === 'You').map((item, idx) => (
              <div key={idx} className={`bg-slate-700/50 rounded-xl p-3 border-l-4 ${
                item.priority === 'high' ? 'border-red-500' : 'border-yellow-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{item.task}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {item.priority}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-1">Due: {item.due}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Next Meeting */}
        <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-2xl p-4 border border-blue-500/30">
          <h3 className="font-semibold text-blue-300 mb-3 flex items-center">
            <span className="mr-2">📅</span> Next Meeting Scheduled
          </h3>
          <div className="bg-blue-500/10 rounded-xl p-3">
            <p className="text-white font-medium">{meeting.nextMeeting.title}</p>
            <p className="text-blue-300 text-sm">{meeting.nextMeeting.date}</p>
            <p className="text-slate-400 text-sm">{meeting.nextMeeting.location}</p>
          </div>
          <button className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors">
            Add to Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================
// FINANCIAL DASHBOARD
// Shows spending, budgets, bills, transactions
// =============================================
export const FinancialDashboard = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const financialData = {
    balance: 4287.50,
    monthlySpend: 2847,
    lastMonthSpend: 2540,
    budget: 3500,
    categories: [
      { name: 'Food & Dining', amount: 680, budget: 600, icon: '🍔', color: 'bg-orange-500' },
      { name: 'Shopping', amount: 520, budget: 400, icon: '🛍️', color: 'bg-pink-500' },
      { name: 'Transport', amount: 340, budget: 350, icon: '🚗', color: 'bg-blue-500' },
      { name: 'Entertainment', amount: 280, budget: 300, icon: '🎬', color: 'bg-purple-500' },
      { name: 'Bills & Utilities', amount: 450, budget: 500, icon: '💡', color: 'bg-yellow-500' },
      { name: 'Other', amount: 577, budget: 600, icon: '📦', color: 'bg-slate-500' }
    ],
    recentTransactions: [
      { name: 'Uber Eats', amount: -32.50, date: 'Today', category: 'Food' },
      { name: 'Netflix', amount: -15.99, date: 'Yesterday', category: 'Entertainment' },
      { name: 'Shell Petrol', amount: -78.40, date: 'Yesterday', category: 'Transport' },
      { name: 'Salary Deposit', amount: 4500, date: '2 days ago', category: 'Income' },
      { name: 'Amazon', amount: -156.00, date: '3 days ago', category: 'Shopping' },
      { name: 'Woolworths', amount: -89.30, date: '3 days ago', category: 'Food' }
    ],
    upcomingBills: [
      { name: 'Electricity', amount: 156.80, due: 'In 3 days', icon: '💡' },
      { name: 'Phone Plan', amount: 89, due: 'In 7 days', icon: '📱' },
      { name: 'Rent', amount: 1800, due: 'In 12 days', icon: '🏠' },
      { name: 'Internet', amount: 79, due: 'In 15 days', icon: '📡' }
    ]
  };

  const spendPercent = (financialData.monthlySpend / financialData.budget) * 100;
  const spendChange = ((financialData.monthlySpend - financialData.lastMonthSpend) / financialData.lastMonthSpend * 100).toFixed(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">
      {/* Header */}
      <div className="bg-emerald-600/20 backdrop-blur-xl p-4 border-b border-emerald-500/30">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-emerald-400 font-medium">← Back</button>
          <h1 className="text-lg font-bold">💰 Financial Dashboard</h1>
          <button className="text-emerald-400 text-sm">Settings</button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl p-5 shadow-lg">
          <p className="text-emerald-100 text-sm">Available Balance</p>
          <p className="text-4xl font-bold text-white mt-1">${financialData.balance.toLocaleString()}</p>
          <div className="flex items-center mt-3 space-x-4">
            <div>
              <p className="text-emerald-200 text-xs">This Month</p>
              <p className="text-white font-semibold">-${financialData.monthlySpend}</p>
            </div>
            <div className={`text-xs px-2 py-1 rounded ${spendChange > 0 ? 'bg-red-500/30 text-red-200' : 'bg-green-500/30 text-green-200'}`}>
              {spendChange > 0 ? '↑' : '↓'} {Math.abs(spendChange)}% vs last month
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 space-x-2 mb-4">
        {['overview', 'bills', 'transactions'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-4 pb-20">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Budget Progress */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">Monthly Budget</h3>
                <span className="text-slate-400 text-sm">${financialData.monthlySpend} / ${financialData.budget}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${
                    spendPercent > 90 ? 'bg-red-500' : spendPercent > 70 ? 'bg-yellow-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(spendPercent, 100)}%` }}
                ></div>
              </div>
              <p className="text-slate-400 text-xs mt-2">
                {spendPercent < 100 
                  ? `$${(financialData.budget - financialData.monthlySpend).toFixed(0)} remaining`
                  : `$${(financialData.monthlySpend - financialData.budget).toFixed(0)} over budget!`
                }
              </p>
            </div>

            {/* Categories */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700">
              <h3 className="font-semibold text-white mb-3">Spending by Category</h3>
              <div className="space-y-3">
                {financialData.categories.map((cat, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center">
                        <span className="mr-2">{cat.icon}</span>
                        <span className="text-slate-300">{cat.name}</span>
                      </span>
                      <span className={cat.amount > cat.budget ? 'text-red-400' : 'text-slate-400'}>
                        ${cat.amount} / ${cat.budget}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${cat.color}`}
                        style={{ width: `${Math.min((cat.amount / cat.budget) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bills' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-white mb-3">Upcoming Bills</h3>
            {financialData.upcomingBills.map((bill, idx) => (
              <div key={idx} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{bill.icon}</span>
                  <div>
                    <p className="text-white font-medium">{bill.name}</p>
                    <p className="text-slate-400 text-sm">{bill.due}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">${bill.amount}</p>
                  <button className="text-emerald-400 text-xs">Pay Now</button>
                </div>
              </div>
            ))}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mt-4">
              <p className="text-emerald-300 text-sm">💡 Set up auto-pay to never miss a bill</p>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-white mb-3">Recent Transactions</h3>
            {financialData.recentTransactions.map((tx, idx) => (
              <div key={idx} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{tx.name}</p>
                  <p className="text-slate-400 text-sm">{tx.date} • {tx.category}</p>
                </div>
                <p className={`font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-white'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount < 0 ? '-' : ''}${Math.abs(tx.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================
// FAMILY TRACKER DASHBOARD
// Shows family members locations, safe zones, alerts
// =============================================
export const FamilyTrackerDashboard = ({ onClose }) => {
  const familyMembers = [
    { 
      name: 'Sophie', 
      relation: 'Daughter',
      avatar: '👧',
      status: 'At School',
      location: 'Greenfield High School',
      battery: 78,
      lastSeen: '2 mins ago',
      safe: true,
      coordinates: { lat: -33.8688, lng: 151.2093 }
    },
    { 
      name: 'Dad', 
      relation: 'Father',
      avatar: '👴',
      status: 'At Home',
      location: '42 Oak Street',
      battery: 45,
      lastSeen: '5 mins ago',
      safe: true,
      coordinates: { lat: -33.8700, lng: 151.2100 }
    },
    { 
      name: 'Mum', 
      relation: 'Mother',
      avatar: '👵',
      status: 'Shopping',
      location: 'Westfield Mall',
      battery: 62,
      lastSeen: 'Just now',
      safe: true,
      coordinates: { lat: -33.8750, lng: 151.2050 }
    }
  ];

  const safeZones = [
    { name: 'Home', icon: '🏠', members: 1 },
    { name: 'School', icon: '🏫', members: 1 },
    { name: 'Work', icon: '💼', members: 0 },
    { name: 'Grandparents', icon: '👴', members: 0 }
  ];

  const recentAlerts = [
    { type: 'left_zone', message: 'Sophie left School zone', time: '10 mins ago', icon: '📍' },
    { type: 'arrived', message: 'Mum arrived at Westfield Mall', time: '25 mins ago', icon: '✓' },
    { type: 'low_battery', message: 'Dad\'s phone battery is low (45%)', time: '1 hour ago', icon: '🔋' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">
      {/* Header */}
      <div className="bg-amber-600/20 backdrop-blur-xl p-4 border-b border-amber-500/30">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-amber-400 font-medium">← Back</button>
          <h1 className="text-lg font-bold">👨‍👩‍👧 Family Tracker</h1>
          <button className="text-amber-400 text-sm">+ Add</button>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="h-48 bg-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-purple-900/50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-slate-400 text-sm">Live Map View</p>
            <p className="text-slate-500 text-xs">All family members visible</p>
          </div>
        </div>
        {/* Family member pins */}
        <div className="absolute top-8 left-1/4 flex flex-col items-center">
          <span className="text-2xl">👧</span>
          <span className="text-xs bg-green-500 text-white px-1 rounded">Sophie</span>
        </div>
        <div className="absolute top-16 right-1/3 flex flex-col items-center">
          <span className="text-2xl">👴</span>
          <span className="text-xs bg-green-500 text-white px-1 rounded">Dad</span>
        </div>
        <div className="absolute bottom-8 right-1/4 flex flex-col items-center">
          <span className="text-2xl">👵</span>
          <span className="text-xs bg-green-500 text-white px-1 rounded">Mum</span>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-20">
        {/* Family Members */}
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Family Members</h3>
          {familyMembers.map((member, idx) => (
            <div key={idx} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{member.avatar}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-medium">{member.name}</p>
                      <span className={`w-2 h-2 rounded-full ${member.safe ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </div>
                    <p className="text-slate-400 text-sm">{member.status}</p>
                    <p className="text-slate-500 text-xs">{member.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-sm text-slate-400">
                    <span className={member.battery < 50 ? 'text-yellow-400' : 'text-green-400'}>🔋</span>
                    <span className="ml-1">{member.battery}%</span>
                  </div>
                  <p className="text-slate-500 text-xs">{member.lastSeen}</p>
                  <button className="text-amber-400 text-xs mt-1">Track →</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Safe Zones */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
          <h3 className="font-semibold text-white mb-3">Safe Zones</h3>
          <div className="grid grid-cols-4 gap-3">
            {safeZones.map((zone, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto text-xl">
                  {zone.icon}
                </div>
                <p className="text-slate-300 text-xs mt-1">{zone.name}</p>
                <p className="text-slate-500 text-xs">{zone.members} here</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
          <h3 className="font-semibold text-white mb-3">Recent Alerts</h3>
          <div className="space-y-2">
            {recentAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-center space-x-3 text-sm">
                <span>{alert.icon}</span>
                <span className="text-slate-300 flex-1">{alert.message}</span>
                <span className="text-slate-500 text-xs">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Button */}
        <button className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-bold transition-colors">
          🆘 Family Emergency Alert
        </button>
      </div>
    </div>
  );
};

// =============================================
// HEALTH DASHBOARD
// Shows medications, wellness, health stats
// =============================================
export const HealthDashboard = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('medications');

  const healthData = {
    medications: [
      { name: 'Metformin', dose: '500mg', time: '8:00 AM', taken: true, streak: 14 },
      { name: 'Vitamin D', dose: '1000 IU', time: '8:00 AM', taken: true, streak: 14 },
      { name: 'Metformin', dose: '500mg', time: '8:00 PM', taken: false, streak: 14 },
      { name: 'Melatonin', dose: '3mg', time: '10:00 PM', taken: false, streak: 7 }
    ],
    moodHistory: [
      { date: 'Today', mood: '😊', note: 'Feeling productive' },
      { date: 'Yesterday', mood: '😐', note: 'A bit tired' },
      { date: '2 days ago', mood: '😊', note: 'Great day!' },
      { date: '3 days ago', mood: '😔', note: 'Stressed about work' },
      { date: '4 days ago', mood: '😊', note: 'Weekend vibes' }
    ],
    stats: {
      avgMood: 3.8,
      medCompliance: 92,
      daysTracked: 45
    },
    upcomingAppointments: [
      { type: 'Doctor', name: 'Dr. Wilson - Checkup', date: 'Jan 15, 10:00 AM', icon: '👨‍⚕️' },
      { type: 'Dentist', name: 'Dental Cleaning', date: 'Jan 22, 2:30 PM', icon: '🦷' }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">
      {/* Header */}
      <div className="bg-rose-600/20 backdrop-blur-xl p-4 border-b border-rose-500/30">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-rose-400 font-medium">← Back</button>
          <h1 className="text-lg font-bold">💊 Health Dashboard</h1>
          <button className="text-rose-400 text-sm">Settings</button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/80 rounded-xl p-3 text-center border border-slate-700">
            <p className="text-2xl font-bold text-rose-400">{healthData.stats.medCompliance}%</p>
            <p className="text-slate-400 text-xs">Med Compliance</p>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-3 text-center border border-slate-700">
            <p className="text-2xl font-bold text-yellow-400">😊</p>
            <p className="text-slate-400 text-xs">Avg Mood</p>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-3 text-center border border-slate-700">
            <p className="text-2xl font-bold text-green-400">{healthData.stats.daysTracked}</p>
            <p className="text-slate-400 text-xs">Days Tracked</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 space-x-2 mb-4">
        {['medications', 'wellness', 'appointments'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab 
                ? 'bg-rose-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-4 pb-20">
        {activeTab === 'medications' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Today's Medications</h3>
            {healthData.medications.map((med, idx) => (
              <div key={idx} className={`bg-slate-800/80 rounded-xl p-4 border ${med.taken ? 'border-green-500/30' : 'border-slate-700'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${med.taken ? 'bg-green-500/20' : 'bg-slate-700'}`}>
                      {med.taken ? '✓' : '💊'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{med.name}</p>
                      <p className="text-slate-400 text-sm">{med.dose} • {med.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {med.taken ? (
                      <span className="text-green-400 text-sm">Taken ✓</span>
                    ) : (
                      <button className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-lg text-sm transition-colors">
                        Take Now
                      </button>
                    )}
                    <p className="text-slate-500 text-xs mt-1">🔥 {med.streak} day streak</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'wellness' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
              <h3 className="font-semibold text-white mb-3">How are you feeling today?</h3>
              <div className="flex justify-around">
                {['😊', '🙂', '😐', '😔', '😢'].map((mood, idx) => (
                  <button key={idx} className="text-3xl hover:scale-125 transition-transform">
                    {mood}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
              <h3 className="font-semibold text-white mb-3">Mood History</h3>
              <div className="space-y-2">
                {healthData.moodHistory.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{entry.date}</span>
                    <span className="text-xl">{entry.mood}</span>
                    <span className="text-slate-500 text-xs max-w-[120px] truncate">{entry.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Upcoming Appointments</h3>
            {healthData.upcomingAppointments.map((apt, idx) => (
              <div key={idx} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{apt.icon}</span>
                  <div>
                    <p className="text-white font-medium">{apt.name}</p>
                    <p className="text-slate-400 text-sm">{apt.date}</p>
                  </div>
                </div>
              </div>
            ))}
            <button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl text-sm font-medium transition-colors">
              + Add Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  MeetingSummaryScreen,
  FinancialDashboard,
  FamilyTrackerDashboard,
  HealthDashboard
};

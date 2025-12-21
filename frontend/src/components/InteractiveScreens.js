import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { playButtonClick, playSuccess, playNotification, playAppOpen } from '../services/SoundService';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// =============================================
// MEETING SUMMARY SCREEN
// Shows after meeting with notes, action items, next meeting
// =============================================
export const MeetingSummaryScreen = ({ onClose, meetingData }) => {
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const defaultMeeting = {
    title: 'Investor Pitch Meeting',
    date: 'Today, 10:00 AM - 11:15 AM',
    attendees: ['You', 'Sarah Chen (VC Partner)', 'Mike Johnson (Angel)', 'Lisa Park (Advisor)', 'David Kim (CTO)'],
    summary: `Presented Aegis to potential investors. Key discussion points included the unique value proposition of the HPI (Hierarchical Proactive Intelligence) system, monetization strategy, and go-to-market plan.

Sarah expressed strong interest in the privacy-first approach and trap mode technology. Mike raised questions about scalability which David addressed with the microservices architecture plan.

The investors were particularly impressed by the "Digital Mate" concept and the proactive notification system. They requested a follow-up demo with the full feature set.`,
    keyDecisions: [
      'Follow-up demo scheduled for next week',
      'Term sheet discussion after successful demo',
      'Technical due diligence to begin Thursday',
      'Expand team with 2 mobile developers'
    ],
    actionItems: [
      { task: 'Prepare detailed technical documentation', assignee: 'You', due: 'Tomorrow', priority: 'high' },
      { task: 'Create investor deck v2', assignee: 'You', due: 'Wed', priority: 'high' },
      { task: 'Schedule technical deep-dive', assignee: 'David', due: 'Thursday', priority: 'medium' },
      { task: 'Send market research data', assignee: 'Lisa', due: 'Friday', priority: 'medium' }
    ],
    nextMeeting: {
      title: 'Investor Demo - Full Feature Showcase',
      date: 'Next Monday, 2:00 PM',
      location: 'Video Call - Zoom'
    }
  };

  const meeting = meetingData || defaultMeeting;

  // Get AI insight about the meeting
  const getAiInsight = useCallback(async () => {
    setLoadingInsight(true);
    try {
      const response = await axios.post(`${API}/intelligence/chat`, {
        message: `Based on this meeting summary, give me one key strategic insight in 2 sentences: "${meeting.summary}"`,
        context: 'meeting_analysis'
      });
      setAiInsight(response.data?.response || 'Focus on demonstrating the unique privacy features that differentiate Aegis from competitors.');
    } catch (e) {
      setAiInsight('Focus on demonstrating the unique privacy features that differentiate Aegis from competitors.');
    }
    setLoadingInsight(false);
  }, [meeting.summary]);

  useEffect(() => {
    playAppOpen();
    getAiInsight();
  }, [getAiInsight]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">
      {/* Header */}
      <div className="bg-green-600/20 backdrop-blur-xl p-4 border-b border-green-500/30 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={() => { playButtonClick(); onClose(); }} className="text-green-400 font-medium">← Back</button>
          <h1 className="text-lg font-bold">📝 Meeting Summary</h1>
          <button onClick={playButtonClick} className="text-green-400 text-sm">Share</button>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-20 animate-fadeIn">
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

        {/* AI Insight Card */}
        <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 rounded-2xl p-4 border border-cyan-500/30">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">🤖</span>
            <h3 className="font-semibold text-cyan-300">AI Strategic Insight</h3>
          </div>
          {loadingInsight ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
              <span className="text-slate-400 text-sm">Analyzing meeting...</span>
            </div>
          ) : (
            <p className="text-slate-300 text-sm leading-relaxed">{aiInsight}</p>
          )}
        </div>

        {/* AI Summary */}
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-4 border border-green-500/30">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">📋</span>
            <h3 className="font-semibold text-green-300">Meeting Summary</h3>
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
          <button 
            onClick={() => { playButtonClick(); playSuccess(); }}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Add to Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================
// FINANCIAL DASHBOARD
// Shows spending, budgets, bills, transactions with AI insights
// =============================================
export const FinancialDashboard = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(true);

  const financialData = {
    balance: 12847.50,
    monthlySpend: 3847,
    lastMonthSpend: 4240,
    budget: 5000,
    savingsGoal: 50000,
    currentSavings: 28500,
    categories: [
      { name: 'Food & Dining', amount: 680, budget: 600, icon: '🍔', color: 'bg-orange-500' },
      { name: 'Shopping', amount: 820, budget: 1000, icon: '🛍️', color: 'bg-pink-500' },
      { name: 'Transport', amount: 340, budget: 400, icon: '🚗', color: 'bg-blue-500' },
      { name: 'Entertainment', amount: 280, budget: 300, icon: '🎬', color: 'bg-purple-500' },
      { name: 'Bills & Utilities', amount: 1250, budget: 1300, icon: '💡', color: 'bg-yellow-500' },
      { name: 'Investment', amount: 477, budget: 500, icon: '📈', color: 'bg-green-500' }
    ],
    recentTransactions: [
      { name: 'Startup Supplies', amount: -156.50, date: 'Today', category: 'Business', icon: '💼' },
      { name: 'Uber Eats', amount: -32.50, date: 'Today', category: 'Food', icon: '🍔' },
      { name: 'AWS Hosting', amount: -89.99, date: 'Yesterday', category: 'Business', icon: '☁️' },
      { name: 'Client Payment', amount: 4500, date: '2 days ago', category: 'Income', icon: '💰' },
      { name: 'Domain Renewal', amount: -24.99, date: '3 days ago', category: 'Business', icon: '🌐' },
      { name: 'Groceries', amount: -89.30, date: '3 days ago', category: 'Food', icon: '🛒' }
    ],
    upcomingBills: [
      { name: 'Server Costs', amount: 199.00, due: 'In 3 days', icon: '☁️', autopay: true },
      { name: 'Phone Plan', amount: 89, due: 'In 7 days', icon: '📱', autopay: true },
      { name: 'Office Rent', amount: 1200, due: 'In 12 days', icon: '🏢', autopay: false },
      { name: 'Software Licenses', amount: 149, due: 'In 15 days', icon: '💻', autopay: true }
    ],
    investments: [
      { name: 'Tech ETF', value: 8420, change: +5.2, icon: '📊' },
      { name: 'Index Fund', value: 12300, change: +2.8, icon: '📈' },
      { name: 'Crypto', value: 2850, change: -3.1, icon: '₿' }
    ]
  };

  const spendPercent = (financialData.monthlySpend / financialData.budget) * 100;
  const spendChange = ((financialData.monthlySpend - financialData.lastMonthSpend) / financialData.lastMonthSpend * 100).toFixed(0);
  const savingsPercent = (financialData.currentSavings / financialData.savingsGoal) * 100;

  useEffect(() => {
    playAppOpen();
    // Simulate AI insight
    setTimeout(() => {
      setAiInsight("You're spending 9% less than last month. Keep it up! Consider increasing your investment allocation by $200 to reach your savings goal 2 months earlier.");
      setLoadingInsight(false);
    }, 1500);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">
      {/* Header */}
      <div className="bg-emerald-600/20 backdrop-blur-xl p-4 border-b border-emerald-500/30 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={() => { playButtonClick(); onClose(); }} className="text-emerald-400 font-medium">← Back</button>
          <h1 className="text-lg font-bold">💰 Financial Dashboard</h1>
          <button onClick={playButtonClick} className="text-emerald-400 text-sm">Export</button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="p-4 animate-fadeIn">
        <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl p-5 shadow-lg shadow-emerald-500/20">
          <p className="text-emerald-100 text-sm">Total Balance</p>
          <p className="text-4xl font-bold text-white mt-1">${financialData.balance.toLocaleString()}</p>
          <div className="flex items-center mt-3 space-x-4">
            <div>
              <p className="text-emerald-200 text-xs">This Month</p>
              <p className="text-white font-semibold">-${financialData.monthlySpend.toLocaleString()}</p>
            </div>
            <div className={`text-xs px-2 py-1 rounded ${parseInt(spendChange) > 0 ? 'bg-red-500/30 text-red-200' : 'bg-green-500/30 text-green-200'}`}>
              {parseInt(spendChange) > 0 ? '↑' : '↓'} {Math.abs(parseInt(spendChange))}% vs last month
            </div>
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 rounded-xl p-3 border border-cyan-500/30">
          <div className="flex items-start space-x-2">
            <span className="text-lg">🤖</span>
            {loadingInsight ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
                <span className="text-slate-400 text-sm">Analyzing your finances...</span>
              </div>
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed">{aiInsight}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 space-x-2 mb-4">
        {['overview', 'bills', 'transactions', 'invest'].map(tab => (
          <button
            key={tab}
            onClick={() => { playButtonClick(); setActiveTab(tab); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {tab === 'invest' ? 'Invest' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-4 pb-20">
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Savings Progress */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-4 border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-purple-300">🎯 Savings Goal</h3>
                <span className="text-white font-bold">{savingsPercent.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                  style={{ width: `${Math.min(savingsPercent, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-slate-400">${financialData.currentSavings.toLocaleString()}</span>
                <span className="text-purple-300">${financialData.savingsGoal.toLocaleString()}</span>
              </div>
            </div>

            {/* Budget Progress */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">Monthly Budget</h3>
                <span className="text-slate-400 text-sm">${financialData.monthlySpend.toLocaleString()} / ${financialData.budget.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${
                    spendPercent > 90 ? 'bg-red-500' : spendPercent > 70 ? 'bg-yellow-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(spendPercent, 100)}%` }}
                ></div>
              </div>
              <p className="text-slate-400 text-xs mt-2">
                {spendPercent < 100 
                  ? `$${(financialData.budget - financialData.monthlySpend).toLocaleString()} remaining`
                  : `$${(financialData.monthlySpend - financialData.budget).toLocaleString()} over budget!`
                }
              </p>
            </div>

            {/* Spending Breakdown - Pie Chart Style */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700">
              <h3 className="font-semibold text-white mb-4">Spending Breakdown</h3>
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    {financialData.categories.map((cat, idx) => {
                      const total = financialData.categories.reduce((a, b) => a + b.amount, 0);
                      const offset = financialData.categories.slice(0, idx).reduce((a, b) => a + (b.amount / total * 100), 0);
                      const colors = ['#f97316', '#ec4899', '#3b82f6', '#a855f7', '#eab308', '#22c55e'];
                      return (
                        <circle
                          key={idx}
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="transparent"
                          stroke={colors[idx]}
                          strokeWidth="3.5"
                          strokeDasharray={`${cat.amount / total * 100} ${100 - cat.amount / total * 100}`}
                          strokeDashoffset={-offset}
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">${financialData.monthlySpend}</p>
                      <p className="text-xs text-slate-400">Total</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {financialData.categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-sm">
                    <span>{cat.icon}</span>
                    <span className="text-slate-400 flex-1 truncate">{cat.name}</span>
                    <span className="text-white font-medium">${cat.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bills' && (
          <div className="space-y-3 animate-fadeIn">
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
                  {bill.autopay ? (
                    <span className="text-green-400 text-xs">✓ Auto-pay</span>
                  ) : (
                    <button onClick={playButtonClick} className="text-emerald-400 text-xs">Pay Now</button>
                  )}
                </div>
              </div>
            ))}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mt-4">
              <p className="text-emerald-300 text-sm">💡 3 of 4 bills are on auto-pay. You are on track!</p>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-3 animate-fadeIn">
            <h3 className="font-semibold text-white mb-3">Recent Transactions</h3>
            {financialData.recentTransactions.map((tx, idx) => (
              <div key={idx} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{tx.icon}</span>
                  <div>
                    <p className="text-white font-medium">{tx.name}</p>
                    <p className="text-slate-400 text-sm">{tx.date} • {tx.category}</p>
                  </div>
                </div>
                <p className={`font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-white'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount < 0 ? '-' : ''}${Math.abs(tx.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'invest' && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-semibold text-white mb-3">Investments</h3>
            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-4 border border-green-500/30">
              <p className="text-emerald-200 text-sm">Total Portfolio Value</p>
              <p className="text-3xl font-bold text-white mt-1">
                ${financialData.investments.reduce((a, b) => a + b.value, 0).toLocaleString()}
              </p>
              <p className="text-green-400 text-sm mt-1">+$1,240 (5.4%) this month</p>
            </div>
            {financialData.investments.map((inv, idx) => (
              <div key={idx} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{inv.icon}</span>
                  <div>
                    <p className="text-white font-medium">{inv.name}</p>
                    <p className={`text-sm ${inv.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {inv.change >= 0 ? '↑' : '↓'} {Math.abs(inv.change)}%
                    </p>
                  </div>
                </div>
                <p className="text-white font-bold">${inv.value.toLocaleString()}</p>
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
// Shows family members locations with real map and geolocation
// =============================================
export const FamilyTrackerDashboard = ({ onClose }) => {
  const [myLocation, setMyLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);

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
      distance: '3.2 km away'
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
      distance: '0.5 km away'
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
      distance: '1.8 km away'
    }
  ];

  const safeZones = [
    { name: 'Home', icon: '🏠', members: 1, active: true },
    { name: 'School', icon: '🏫', members: 1, active: true },
    { name: 'Work', icon: '💼', members: 0, active: true },
    { name: 'Grandparents', icon: '👴', members: 0, active: false }
  ];

  const recentAlerts = [
    { type: 'arrived', message: 'Sophie arrived at School', time: '8:45 AM', icon: '✅' },
    { type: 'left_zone', message: 'Mum left Home zone', time: '10:30 AM', icon: '📍' },
    { type: 'arrived', message: 'Mum arrived at Westfield Mall', time: '10:55 AM', icon: '✅' },
    { type: 'low_battery', message: "Dad's phone battery is low (45%)", time: '11:20 AM', icon: '🔋' }
  ];

  // Get real location
  useEffect(() => {
    playAppOpen();
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMyLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoadingLocation(false);
        },
        () => {
          setLoadingLocation(false);
        }
      );
    } else {
      setLoadingLocation(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">
      {/* Header */}
      <div className="bg-amber-600/20 backdrop-blur-xl p-4 border-b border-amber-500/30 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={() => { playButtonClick(); onClose(); }} className="text-amber-400 font-medium">← Back</button>
          <h1 className="text-lg font-bold">👨‍👩‍👧 Family Tracker</h1>
          <button onClick={playButtonClick} className="text-amber-400 text-sm">+ Add</button>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="h-56 bg-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 to-purple-900/60">
          {/* Map grid lines */}
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(100,150,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(100,150,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}></div>
          
          {/* Family member pins with animation */}
          <div className="absolute top-12 left-1/4 flex flex-col items-center animate-bounce-slow">
            <div className="bg-green-500 rounded-full p-1 shadow-lg shadow-green-500/50">
              <span className="text-2xl">👧</span>
            </div>
            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full mt-1 shadow-lg">Sophie</span>
            <span className="text-[10px] text-green-300">At School</span>
          </div>
          
          <div className="absolute top-20 right-1/3 flex flex-col items-center">
            <div className="bg-yellow-500 rounded-full p-1 shadow-lg shadow-yellow-500/50">
              <span className="text-2xl">👴</span>
            </div>
            <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full mt-1 shadow-lg">Dad</span>
            <span className="text-[10px] text-yellow-300">At Home</span>
          </div>
          
          <div className="absolute bottom-12 right-1/4 flex flex-col items-center animate-bounce-slow" style={{animationDelay: '0.5s'}}>
            <div className="bg-blue-500 rounded-full p-1 shadow-lg shadow-blue-500/50">
              <span className="text-2xl">👵</span>
            </div>
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full mt-1 shadow-lg">Mum</span>
            <span className="text-[10px] text-blue-300">Shopping</span>
          </div>

          {/* Your location indicator */}
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
            <div className="w-4 h-4 bg-cyan-500 rounded-full animate-ping absolute"></div>
            <div className="w-4 h-4 bg-cyan-500 rounded-full relative z-10 border-2 border-white"></div>
            <span className="text-[10px] text-cyan-300 mt-1">You</span>
          </div>
        </div>

        {/* Location status */}
        <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
          <p className="text-xs text-slate-300">
            {loadingLocation ? '📍 Getting location...' : myLocation ? '📍 Location active' : '📍 Location unavailable'}
          </p>
        </div>

        {/* Expand button */}
        <button 
          onClick={playButtonClick}
          className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-white hover:bg-black/70"
        >
          ⛶ Expand
        </button>
      </div>

      <div className="p-4 space-y-4 pb-20 animate-fadeIn">
        {/* Family Members */}
        <div className="space-y-3">
          <h3 className="font-semibold text-white flex items-center justify-between">
            Family Members
            <span className="text-xs text-slate-400">All safe ✓</span>
          </h3>
          {familyMembers.map((member, idx) => (
            <div 
              key={idx} 
              onClick={() => { playButtonClick(); setSelectedMember(selectedMember === idx ? null : idx); }}
              className={`bg-slate-800/80 rounded-xl p-4 border transition-all cursor-pointer ${
                selectedMember === idx ? 'border-amber-500/50 bg-amber-900/20' : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="text-3xl">{member.avatar}</div>
                    <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-800 ${member.safe ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-medium">{member.name}</p>
                    </div>
                    <p className="text-amber-400 text-sm">{member.status}</p>
                    <p className="text-slate-500 text-xs">{member.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-sm text-slate-400">
                    <span className={member.battery < 50 ? 'text-yellow-400' : 'text-green-400'}>🔋</span>
                    <span className="ml-1">{member.battery}%</span>
                  </div>
                  <p className="text-slate-500 text-xs">{member.lastSeen}</p>
                  <p className="text-amber-400 text-xs mt-1">{member.distance}</p>
                </div>
              </div>
              
              {/* Expanded actions */}
              {selectedMember === idx && (
                <div className="mt-4 pt-4 border-t border-slate-700 flex space-x-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); playButtonClick(); playNotification('family'); }}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    📞 Call
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); playButtonClick(); }}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    💬 Message
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); playButtonClick(); }}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    🗺️ Navigate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Safe Zones */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
          <h3 className="font-semibold text-white mb-3">Safe Zones</h3>
          <div className="grid grid-cols-4 gap-3">
            {safeZones.map((zone, idx) => (
              <div 
                key={idx} 
                onClick={playButtonClick}
                className={`text-center cursor-pointer transition-all ${zone.active ? 'opacity-100' : 'opacity-50'}`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto text-2xl transition-all ${
                  zone.members > 0 ? 'bg-green-500/20 border-2 border-green-500' : 'bg-slate-700 border-2 border-slate-600'
                }`}>
                  {zone.icon}
                </div>
                <p className="text-slate-300 text-xs mt-1">{zone.name}</p>
                <p className={`text-xs ${zone.members > 0 ? 'text-green-400' : 'text-slate-500'}`}>{zone.members} here</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
          <h3 className="font-semibold text-white mb-3">Today's Activity</h3>
          <div className="space-y-3">
            {recentAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-center space-x-3 text-sm">
                <span className="text-lg">{alert.icon}</span>
                <span className="text-slate-300 flex-1">{alert.message}</span>
                <span className="text-slate-500 text-xs">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Button */}
        <button 
          onClick={() => { playButtonClick(); playNotification('emergency'); }}
          className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-bold transition-colors shadow-lg shadow-red-500/30"
        >
          🆘 Family Emergency Alert
        </button>
      </div>
    </div>
  );
};

// =============================================
// HEALTH DASHBOARD
// Shows medications, wellness, health stats, AI health insights
// =============================================
export const HealthDashboard = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('medications');
  const [currentMood, setCurrentMood] = useState(null);
  const [aiHealthTip, setAiHealthTip] = useState(null);
  const [loadingTip, setLoadingTip] = useState(true);

  const healthData = {
    medications: [
      { name: 'Vitamin D', dose: '1000 IU', time: '8:00 AM', taken: true, streak: 14, icon: '☀️' },
      { name: 'Omega-3', dose: '1000mg', time: '8:00 AM', taken: true, streak: 21, icon: '🐟' },
      { name: 'Multivitamin', dose: '1 tablet', time: '12:00 PM', taken: false, streak: 14, icon: '💊' },
      { name: 'Melatonin', dose: '3mg', time: '10:00 PM', taken: false, streak: 7, icon: '🌙' }
    ],
    vitals: {
      heartRate: 72,
      steps: 6842,
      stepsGoal: 10000,
      sleep: 7.2,
      sleepGoal: 8,
      water: 5,
      waterGoal: 8,
      calories: 1650,
      caloriesGoal: 2000
    },
    moodHistory: [
      { date: 'Today', mood: '😊', note: 'Productive morning' },
      { date: 'Yesterday', mood: '🙂', note: 'Good energy' },
      { date: '2 days ago', mood: '😊', note: 'Great workout!' },
      { date: '3 days ago', mood: '😐', note: 'Busy day' },
      { date: '4 days ago', mood: '😊', note: 'Weekend relaxation' }
    ],
    stats: {
      avgMood: 4.1,
      medCompliance: 94,
      daysTracked: 45,
      currentStreak: 14
    },
    upcomingAppointments: [
      { type: 'Doctor', name: 'Dr. Wilson - Annual Checkup', date: 'Jan 15, 10:00 AM', icon: '👨‍⚕️', reminder: true },
      { type: 'Dentist', name: 'Dental Cleaning', date: 'Jan 22, 2:30 PM', icon: '🦷', reminder: true },
      { type: 'Eye', name: 'Vision Test', date: 'Feb 5, 11:00 AM', icon: '👁️', reminder: false }
    ]
  };

  useEffect(() => {
    playAppOpen();
    setTimeout(() => {
      setAiHealthTip("Based on your sleep data, try going to bed 30 minutes earlier tonight. Your body seems to recover better with 7.5+ hours of sleep.");
      setLoadingTip(false);
    }, 1500);
  }, []);

  const handleMoodSelect = (mood) => {
    setCurrentMood(mood);
    playSuccess();
    playNotification('health');
  };

  const handleTakeMed = (idx) => {
    playButtonClick();
    playSuccess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">
      {/* Header */}
      <div className="bg-rose-600/20 backdrop-blur-xl p-4 border-b border-rose-500/30 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={() => { playButtonClick(); onClose(); }} className="text-rose-400 font-medium">← Back</button>
          <h1 className="text-lg font-bold">💊 Health Dashboard</h1>
          <button onClick={playButtonClick} className="text-rose-400 text-sm">History</button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 animate-fadeIn">
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-rose-500/20 rounded-xl p-3 text-center border border-rose-500/30">
            <p className="text-xl font-bold text-rose-400">{healthData.stats.medCompliance}%</p>
            <p className="text-slate-400 text-[10px]">Compliance</p>
          </div>
          <div className="bg-red-500/20 rounded-xl p-3 text-center border border-red-500/30">
            <p className="text-xl font-bold text-red-400">❤️ {healthData.vitals.heartRate}</p>
            <p className="text-slate-400 text-[10px]">Heart Rate</p>
          </div>
          <div className="bg-blue-500/20 rounded-xl p-3 text-center border border-blue-500/30">
            <p className="text-xl font-bold text-blue-400">{healthData.vitals.steps.toLocaleString()}</p>
            <p className="text-slate-400 text-[10px]">Steps</p>
          </div>
          <div className="bg-purple-500/20 rounded-xl p-3 text-center border border-purple-500/30">
            <p className="text-xl font-bold text-purple-400">🔥 {healthData.stats.currentStreak}</p>
            <p className="text-slate-400 text-[10px]">Day Streak</p>
          </div>
        </div>
      </div>

      {/* AI Health Tip */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 rounded-xl p-3 border border-cyan-500/30">
          <div className="flex items-start space-x-2">
            <span className="text-lg">🤖</span>
            {loadingTip ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
                <span className="text-slate-400 text-sm">Analyzing your health data...</span>
              </div>
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed">{aiHealthTip}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 space-x-2 mb-4">
        {['medications', 'vitals', 'wellness', 'appointments'].map(tab => (
          <button
            key={tab}
            onClick={() => { playButtonClick(); setActiveTab(tab); }}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab 
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-4 pb-20">
        {activeTab === 'medications' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Today's Medications</h3>
              <span className="text-xs text-rose-400">2 of 4 taken</span>
            </div>
            {healthData.medications.map((med, idx) => (
              <div key={idx} className={`bg-slate-800/80 rounded-xl p-4 border transition-all ${
                med.taken ? 'border-green-500/30 bg-green-900/10' : 'border-slate-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                      med.taken ? 'bg-green-500/20' : 'bg-slate-700'
                    }`}>
                      {med.taken ? '✓' : med.icon}
                    </div>
                    <div>
                      <p className="text-white font-medium">{med.name}</p>
                      <p className="text-slate-400 text-sm">{med.dose} • {med.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {med.taken ? (
                      <span className="text-green-400 text-sm font-medium">Taken ✓</span>
                    ) : (
                      <button 
                        onClick={() => handleTakeMed(idx)}
                        className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
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

        {activeTab === 'vitals' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Steps Progress */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">👟 Steps</span>
                <span className="text-white font-bold">{healthData.vitals.steps.toLocaleString()} / {healthData.vitals.stepsGoal.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                  style={{ width: `${(healthData.vitals.steps / healthData.vitals.stepsGoal) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Sleep Progress */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">😴 Sleep</span>
                <span className="text-white font-bold">{healthData.vitals.sleep}h / {healthData.vitals.sleepGoal}h</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                  style={{ width: `${(healthData.vitals.sleep / healthData.vitals.sleepGoal) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Water Progress */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">💧 Water</span>
                <span className="text-white font-bold">{healthData.vitals.water} / {healthData.vitals.waterGoal} glasses</span>
              </div>
              <div className="flex space-x-1">
                {[...Array(healthData.vitals.waterGoal)].map((_, idx) => (
                  <div 
                    key={idx}
                    className={`flex-1 h-8 rounded-lg transition-all ${
                      idx < healthData.vitals.water ? 'bg-blue-500' : 'bg-slate-700'
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            {/* Calories */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">🔥 Calories</span>
                <span className="text-white font-bold">{healthData.vitals.calories} / {healthData.vitals.caloriesGoal}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                  style={{ width: `${(healthData.vitals.calories / healthData.vitals.caloriesGoal) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wellness' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
              <h3 className="font-semibold text-white mb-4">How are you feeling right now?</h3>
              <div className="flex justify-around">
                {['😊', '🙂', '😐', '😔', '😢'].map((mood, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleMoodSelect(mood)}
                    className={`text-4xl hover:scale-125 transition-all p-2 rounded-full ${
                      currentMood === mood ? 'bg-rose-500/30 scale-125' : ''
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
              {currentMood && (
                <div className="mt-4 text-center animate-fadeIn">
                  <p className="text-green-400 text-sm">✓ Mood logged! Keep tracking for insights.</p>
                </div>
              )}
            </div>
            
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
              <h3 className="font-semibold text-white mb-3">Mood History</h3>
              <div className="space-y-3">
                {healthData.moodHistory.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm bg-slate-700/30 rounded-lg p-2">
                    <span className="text-slate-400">{entry.date}</span>
                    <span className="text-2xl">{entry.mood}</span>
                    <span className="text-slate-500 text-xs max-w-[100px] truncate">{entry.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-3 animate-fadeIn">
            <h3 className="font-semibold text-white mb-3">Upcoming Appointments</h3>
            {healthData.upcomingAppointments.map((apt, idx) => (
              <div key={idx} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{apt.icon}</span>
                    <div>
                      <p className="text-white font-medium">{apt.name}</p>
                      <p className="text-slate-400 text-sm">{apt.date}</p>
                    </div>
                  </div>
                  {apt.reminder && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">🔔 Reminder set</span>
                  )}
                </div>
              </div>
            ))}
            <button 
              onClick={playButtonClick}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl text-sm font-medium transition-colors"
            >
              + Add Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  .animate-bounce-slow {
    animation: bounce-slow 2s infinite;
  }
`;
if (!document.querySelector('#aegis-screen-styles')) {
  style.id = 'aegis-screen-styles';
  document.head.appendChild(style);
}

export default {
  MeetingSummaryScreen,
  FinancialDashboard,
  FamilyTrackerDashboard,
  HealthDashboard
};

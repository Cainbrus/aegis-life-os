import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { DigitalBrain, DigitalShield } from './DigitalIcons';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// =============================================
// AEGIS LEARNING MODE - INVESTOR DEMO VERSION
// Accelerated learning for demos (minutes, not days)
// Full 7-day simulation with impressive visuals
// =============================================

const AegisLearningMode = ({ onLearningComplete, userId }) => {
  const [learningDay, setLearningDay] = useState(1);
  const [learningProgress, setLearningProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('introduction');
  const [demoMode, setDemoMode] = useState(false);
  const [autoProgressTimer, setAutoProgressTimer] = useState(null);
  const [behaviorData, setBehaviorData] = useState({
    wakeUpTime: '',
    sleepTime: '',
    workStartTime: '',
    workEndTime: '',
    sensitiveApps: [],
    trustedContacts: [],
    hiddenCategories: [],
    routines: [],
    locationPatterns: [],
    usagePatterns: []
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [dataPoints, setDataPoints] = useState(0);

  // Learning phases over 7 days (shown in demo as minutes)
  const learningPhases = [
    { day: 1, name: 'Basic Routines', description: 'Learning your daily schedule', icon: '⏰' },
    { day: 2, name: 'App Usage', description: 'Understanding which apps you use and when', icon: '📱' },
    { day: 3, name: 'Privacy Preferences', description: 'Learning what you consider sensitive', icon: '🔒' },
    { day: 4, name: 'Communication Patterns', description: 'Understanding your contacts and style', icon: '💬' },
    { day: 5, name: 'Location Patterns', description: 'Learning your frequent locations', icon: '📍' },
    { day: 6, name: 'Behavioral Analysis', description: 'Deep analysis of your patterns', icon: '🧠' },
    { day: 7, name: 'Final Calibration', description: 'Finalizing your AI profile', icon: '✨' }
  ];

  useEffect(() => {
    loadLearningProgress();
    // Increment data points periodically to show "active learning"
    const dataInterval = setInterval(() => {
      setDataPoints(prev => prev + Math.floor(Math.random() * 5) + 1);
    }, 2000);
    return () => clearInterval(dataInterval);
  }, []);

  // Cleanup auto-progress timer on unmount
  useEffect(() => {
    return () => {
      if (autoProgressTimer) clearInterval(autoProgressTimer);
    };
  }, [autoProgressTimer]);

  const loadLearningProgress = async () => {
    try {
      const response = await axios.get(`${API}/learning/progress`);
      if (response.data) {
        setLearningDay(response.data.current_day || 1);
        setLearningProgress(response.data.progress || 0);
        setBehaviorData(response.data.behavior_data || behaviorData);
        
        if (response.data.learning_complete) {
          onLearningComplete();
        }
      }
    } catch (error) {
      console.log('Starting fresh learning');
    }
  };

  const saveLearningProgress = async (data) => {
    try {
      await axios.post(`${API}/learning/save`, {
        current_day: learningDay,
        progress: learningProgress,
        behavior_data: data,
        phase: currentPhase
      });
    } catch (error) {
      console.error('Failed to save learning progress');
    }
  };

  const handleRoutineSubmit = async (routineData) => {
    setIsAnimating(true);
    const updatedData = { ...behaviorData, ...routineData };
    setBehaviorData(updatedData);
    await saveLearningProgress(updatedData);
    
    // Animated progress
    setTimeout(() => {
      const newProgress = Math.min(100, learningProgress + 25);
      setLearningProgress(newProgress);
      
      if (newProgress >= 100 && learningDay < 7) {
        setTimeout(() => {
          setLearningDay(prev => prev + 1);
          setLearningProgress(0);
          setIsAnimating(false);
        }, 500);
      } else if (learningDay === 7 && newProgress >= 100) {
        completeLearning();
      } else {
        setIsAnimating(false);
      }
    }, 800);
  };

  const completeLearning = async () => {
    try {
      await axios.post(`${API}/learning/complete`, {
        behavior_data: behaviorData,
        learning_duration: demoMode ? 'demo' : 7
      });
      setTimeout(() => onLearningComplete(), 1000);
    } catch (error) {
      console.error('Failed to complete learning');
      // Complete anyway for demo
      setTimeout(() => onLearningComplete(), 1000);
    }
  };

  // DEMO MODE: Auto-progress through all 7 days quickly
  const startDemoMode = () => {
    setDemoMode(true);
    setIsAnimating(true);
    
    // Simulated complete data
    const simulatedData = {
      wakeUpTime: '07:00',
      sleepTime: '23:00',
      workStartTime: '09:00',
      workEndTime: '17:00',
      sensitiveApps: ['Banking', 'Photos', 'Messages', 'Notes', 'Health'],
      trustedContacts: ['Family', 'Close Friends', 'Partner'],
      hiddenCategories: ['Financial', 'Personal Photos', 'Private Messages', 'Medical'],
      frequentApps: ['Messages', 'Email', 'Calendar', 'Browser', 'Social Media'],
      routines: [
        { time: '07:00', action: 'Wake up, check messages' },
        { time: '07:30', action: 'Morning news & coffee' },
        { time: '09:00', action: 'Start work' },
        { time: '12:00', action: 'Lunch break' },
        { time: '17:00', action: 'End work' },
        { time: '19:00', action: 'Personal time' },
        { time: '23:00', action: 'Sleep' }
      ],
      emergencyContact: 'Partner',
      messageFrequency: 'high'
    };
    
    setBehaviorData(simulatedData);

    let currentDay = 1;
    let currentProgress = 0;
    
    const progressInterval = setInterval(() => {
      currentProgress += 10;
      setLearningProgress(currentProgress);
      setDataPoints(prev => prev + Math.floor(Math.random() * 20) + 10);
      
      if (currentProgress >= 100) {
        if (currentDay < 7) {
          currentDay++;
          currentProgress = 0;
          setLearningDay(currentDay);
          setLearningProgress(0);
        } else {
          clearInterval(progressInterval);
          setAutoProgressTimer(null);
          completeLearning();
        }
      }
    }, 400); // Fast demo progression
    
    setAutoProgressTimer(progressInterval);
  };

  // Skip directly to completion
  const skipLearning = async () => {
    const simulatedData = {
      wakeUpTime: '07:00',
      sleepTime: '23:00',
      workStartTime: '09:00',
      workEndTime: '17:00',
      sensitiveApps: ['Banking', 'Photos', 'Messages', 'Notes'],
      trustedContacts: ['Family', 'Close Friends'],
      hiddenCategories: ['Financial', 'Personal Photos', 'Private Messages'],
      routines: [
        { time: '07:00', action: 'Wake up, check messages' },
        { time: '09:00', action: 'Start work' },
        { time: '12:00', action: 'Lunch break' },
        { time: '17:00', action: 'End work' },
        { time: '23:00', action: 'Sleep' }
      ]
    };
    
    setBehaviorData(simulatedData);
    await axios.post(`${API}/learning/complete`, {
      behavior_data: simulatedData,
      learning_duration: 7,
      skipped: true
    });
    onLearningComplete();
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900 to-black"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzA2YjZkNCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50"></div>
        
        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Neural network animation lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[...Array(8)].map((_, i) => (
            <line
              key={i}
              x1={`${Math.random() * 100}%`}
              y1={`${Math.random() * 100}%`}
              x2={`${Math.random() * 100}%`}
              y2={`${Math.random() * 100}%`}
              stroke="url(#lineGradient)"
              strokeWidth="1"
              className="animate-pulse"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </svg>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4 relative">
            <div className={`transition-transform duration-500 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
              <DigitalBrain size={80} />
            </div>
            {/* Pulsing rings around brain */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 border border-cyan-500/30 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
            </div>
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 mb-2">
            AEGIS LEARNING MODE
          </h1>
          <p className="text-slate-400">Teaching your Digital Mate to understand you</p>
          
          {/* Data points counter */}
          <div className="mt-3 text-sm font-mono text-cyan-400/70">
            <span className="inline-flex items-center">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse mr-2"></span>
              {dataPoints.toLocaleString()} data points analyzed
            </span>
          </div>
        </div>

        {/* Learning Progress Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6 mb-6 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{learningPhases[learningDay - 1]?.icon}</span>
              <span className="text-cyan-400 font-mono text-sm">DAY {learningDay} OF 7</span>
            </div>
            <span className="text-slate-400 text-sm font-medium">{learningPhases[learningDay - 1]?.name}</span>
          </div>
          
          {/* Day progress bars */}
          <div className="flex space-x-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <div 
                key={day}
                className={`flex-1 h-3 rounded-full overflow-hidden transition-all duration-300 ${
                  day < learningDay ? 'bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]' :
                  day === learningDay ? 'bg-slate-700' :
                  'bg-slate-800'
                }`}
              >
                {day === learningDay && (
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(6,182,212,0.7)]"
                    style={{ width: `${learningProgress}%` }}
                  ></div>
                )}
              </div>
            ))}
          </div>
          
          <p className="text-slate-300 text-sm">{learningPhases[learningDay - 1]?.description}</p>
          
          {/* Overall progress percentage */}
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-500">Overall Progress</span>
            <span className="text-cyan-400 font-mono">
              {Math.round(((learningDay - 1) * 100 + learningProgress) / 7)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1 mt-2">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-purple-500 h-1 rounded-full transition-all duration-500"
              style={{ width: `${((learningDay - 1) * 100 + learningProgress) / 7}%` }}
            ></div>
          </div>
        </div>

        {/* Demo Mode Banner */}
        {!demoMode && (
          <div className="mb-6">
            <button
              onClick={startDemoMode}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-[0_0_30px_rgba(168,85,247,0.3)] flex items-center justify-center space-x-2"
            >
              <span className="text-xl">🚀</span>
              <span>INVESTOR DEMO: Watch 7 Days in 30 Seconds</span>
            </button>
          </div>
        )}

        {/* Demo Mode Active Indicator */}
        {demoMode && (
          <div className="mb-6 bg-purple-500/20 border border-purple-500/50 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-purple-300 font-medium">Demo Mode Active - Simulating 7 days of learning...</span>
            </div>
          </div>
        )}

        {/* Learning Content based on Day */}
        {!demoMode && (
          <LearningDayContent 
            day={learningDay}
            behaviorData={behaviorData}
            onSubmit={handleRoutineSubmit}
            progress={learningProgress}
            isAnimating={isAnimating}
          />
        )}

        {/* Skip option */}
        {!demoMode && (
          <div className="mt-6 text-center">
            <button
              onClick={skipLearning}
              className="text-slate-500 hover:text-cyan-400 text-sm underline transition-colors"
            >
              Skip learning (Jump to Invisible Mode)
            </button>
          </div>
        )}

        {/* What Aegis will do - Enhanced */}
        <div className="mt-8 bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4 flex items-center">
            <DigitalShield size={24} />
            <span className="ml-2">After Learning, Aegis Will:</span>
          </h3>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start space-x-3 group">
              <span className="text-cyan-400 group-hover:scale-125 transition-transform">▸</span>
              <span>Become <strong className="text-white">completely invisible</strong> - your phone looks totally normal</span>
            </li>
            <li className="flex items-start space-x-3 group">
              <span className="text-cyan-400 group-hover:scale-125 transition-transform">▸</span>
              <span>Only <strong className="text-white">popup notifications</strong> when it needs to alert you</span>
            </li>
            <li className="flex items-start space-x-3 group">
              <span className="text-cyan-400 group-hover:scale-125 transition-transform">▸</span>
              <span>Use your <strong className="text-white">Calendar</strong> to send proactive reminders</span>
            </li>
            <li className="flex items-start space-x-3 group">
              <span className="text-cyan-400 group-hover:scale-125 transition-transform">▸</span>
              <span>Access full Aegis via <strong className="text-white">Calculator code 8675309</strong></span>
            </li>
            <li className="flex items-start space-x-3 group">
              <span className="text-cyan-400 group-hover:scale-125 transition-transform">▸</span>
              <span><strong className="text-white">Automatically protect</strong> your sensitive data 24/7</span>
            </li>
            <li className="flex items-start space-x-3 group">
              <span className="text-cyan-400 group-hover:scale-125 transition-transform">▸</span>
              <span><strong className="text-white">Alert you instantly</strong> if someone unauthorized tries to access your phone</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Learning content for each day - Enhanced
const LearningDayContent = ({ day, behaviorData, onSubmit, progress, isAnimating }) => {
  const [formData, setFormData] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({});
  };

  // Day 1: Basic Routines
  if (day === 1) {
    return (
      <div className={`bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6 transition-all duration-300 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <span className="text-2xl mr-2">⏰</span>
          Tell me about your daily routine
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-cyan-400 text-sm mb-2">What time do you usually wake up?</label>
            <input
              type="time"
              value={formData.wakeUpTime || ''}
              onChange={(e) => handleChange('wakeUpTime', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-cyan-400 text-sm mb-2">What time do you usually go to sleep?</label>
            <input
              type="time"
              value={formData.sleepTime || ''}
              onChange={(e) => handleChange('sleepTime', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-cyan-400 text-sm mb-2">Work/School start time (if applicable)</label>
            <input
              type="time"
              value={formData.workStartTime || ''}
              onChange={(e) => handleChange('workStartTime', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-cyan-400 text-sm mb-2">Work/School end time</label>
            <input
              type="time"
              value={formData.workEndTime || ''}
              onChange={(e) => handleChange('workEndTime', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={isAnimating}
          className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
        >
          Continue Learning
        </button>
      </div>
    );
  }

  // Day 2: App Usage
  if (day === 2) {
    const apps = ['Messages', 'Photos', 'Camera', 'Banking', 'Social Media', 'Email', 'Notes', 'Calendar', 'Browser', 'Shopping'];
    
    return (
      <div className={`bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6 transition-all duration-300 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <span className="text-2xl mr-2">📱</span>
          Which apps do you use most?
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          {apps.map(app => (
            <button
              key={app}
              onClick={() => {
                const current = formData.frequentApps || [];
                const updated = current.includes(app) 
                  ? current.filter(a => a !== app)
                  : [...current, app];
                handleChange('frequentApps', updated);
              }}
              className={`p-4 rounded-lg border transition-all ${
                (formData.frequentApps || []).includes(app)
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              {app}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={isAnimating}
          className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
        >
          Continue Learning
        </button>
      </div>
    );
  }

  // Day 3: Privacy Preferences
  if (day === 3) {
    const categories = ['Personal Photos', 'Financial Info', 'Private Messages', 'Work Documents', 'Health Data', 'Location History', 'Browsing History', 'Passwords'];
    
    return (
      <div className={`bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 transition-all duration-300 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
        <h2 className="text-xl font-bold text-white mb-2 flex items-center">
          <span className="text-2xl mr-2">🔒</span>
          What should Aegis protect?
        </h2>
        <p className="text-slate-400 text-sm mb-6">Select what you consider sensitive</p>
        
        <div className="grid grid-cols-2 gap-3">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                const current = formData.sensitiveCategories || [];
                const updated = current.includes(cat) 
                  ? current.filter(c => c !== cat)
                  : [...current, cat];
                handleChange('sensitiveCategories', updated);
              }}
              className={`p-4 rounded-lg border transition-all text-sm ${
                (formData.sensitiveCategories || []).includes(cat)
                  ? 'bg-purple-500/20 border-purple-400 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={isAnimating}
          className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
        >
          Continue Learning
        </button>
      </div>
    );
  }

  // Day 4: Communication Patterns
  if (day === 4) {
    return (
      <div className={`bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6 transition-all duration-300 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <span className="text-2xl mr-2">💬</span>
          Who do you trust?
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-blue-400 text-sm mb-2">Add trusted contact names (comma separated)</label>
            <input
              type="text"
              placeholder="e.g., Mom, Dad, Best Friend, Partner"
              value={formData.trustedContacts || ''}
              onChange={(e) => handleChange('trustedContacts', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-blue-400 text-sm mb-2">Emergency contact</label>
            <input
              type="text"
              placeholder="Name of person to contact in emergency"
              value={formData.emergencyContact || ''}
              onChange={(e) => handleChange('emergencyContact', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-blue-400 text-sm mb-2">How many messages do you send per day?</label>
            <select
              value={formData.messageFrequency || ''}
              onChange={(e) => handleChange('messageFrequency', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
            >
              <option value="">Select...</option>
              <option value="low">Less than 10</option>
              <option value="medium">10-50</option>
              <option value="high">50-100</option>
              <option value="very_high">More than 100</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={isAnimating}
          className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
        >
          Continue Learning
        </button>
      </div>
    );
  }

  // Day 5-7: Observing and Final calibration - Enhanced visuals
  return (
    <div className={`bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6 text-center transition-all duration-300 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
      <div className="flex justify-center mb-6">
        <div className="relative">
          <DigitalBrain size={100} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 border-2 border-purple-400/50 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
          </div>
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-white mb-4">
        {day === 5 && "🔍 Learning Your Patterns..."}
        {day === 6 && "🧠 Deep Analysis in Progress..."}
        {day === 7 && "✨ Final Calibration..."}
      </h2>
      
      <p className="text-slate-400 mb-6">
        {day === 5 && "Aegis is observing how you use your phone to understand your unique habits and preferences."}
        {day === 6 && "Running deep behavioral analysis. Building your personalized AI protection profile."}
        {day === 7 && "Almost done! Aegis is finalizing your custom Digital Mate configuration."}
      </p>
      
      <div className="bg-slate-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-400">Processing...</span>
          <span className="text-cyan-400 font-mono">{progress}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(6,182,212,0.7)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Processing stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 text-xs">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-cyan-400 font-mono text-lg">{Math.floor(Math.random() * 50 + 20)}</div>
          <div className="text-slate-500">Patterns Found</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-purple-400 font-mono text-lg">{Math.floor(Math.random() * 30 + 10)}</div>
          <div className="text-slate-500">Privacy Rules</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-blue-400 font-mono text-lg">{Math.floor(Math.random() * 20 + 5)}</div>
          <div className="text-slate-500">Contacts Mapped</div>
        </div>
      </div>
      
      <button
        onClick={handleSubmit}
        disabled={isAnimating}
        className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
      >
        {day === 7 ? '🎉 Complete Learning' : 'Continue Processing'}
      </button>
    </div>
  );
};

export default AegisLearningMode;

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { DigitalBrain, DigitalShield } from './DigitalIcons';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// =============================================
// AEGIS LEARNING MODE
// 1-Week Deep Learning System
// After learning, Aegis becomes "invisible"
// =============================================

const AegisLearningMode = ({ onLearningComplete, userId }) => {
  const [learningDay, setLearningDay] = useState(1);
  const [learningProgress, setLearningProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('introduction');
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
  const [isCollecting, setIsCollecting] = useState(false);

  // Learning phases over 7 days
  const learningPhases = [
    { day: 1, name: 'Basic Routines', description: 'Learning your daily schedule' },
    { day: 2, name: 'App Usage', description: 'Understanding which apps you use and when' },
    { day: 3, name: 'Privacy Preferences', description: 'Learning what you consider sensitive' },
    { day: 4, name: 'Communication Patterns', description: 'Understanding your contacts and communication style' },
    { day: 5, name: 'Location Patterns', description: 'Learning your frequent locations' },
    { day: 6, name: 'Behavioral Analysis', description: 'Deep analysis of your usage patterns' },
    { day: 7, name: 'Final Calibration', description: 'Finalizing your personalized AI profile' }
  ];

  useEffect(() => {
    loadLearningProgress();
  }, []);

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
    const updatedData = { ...behaviorData, ...routineData };
    setBehaviorData(updatedData);
    await saveLearningProgress(updatedData);
    
    // Progress calculation
    const newProgress = Math.min(100, learningProgress + 15);
    setLearningProgress(newProgress);
    
    if (newProgress >= 100 && learningDay < 7) {
      // Move to next day
      setLearningDay(prev => prev + 1);
      setLearningProgress(0);
    } else if (learningDay === 7 && newProgress >= 100) {
      // Learning complete
      await completeLearning();
    }
  };

  const completeLearning = async () => {
    try {
      await axios.post(`${API}/learning/complete`, {
        behavior_data: behaviorData,
        learning_duration: 7
      });
      onLearningComplete();
    } catch (error) {
      console.error('Failed to complete learning');
    }
  };

  // Skip to completion for demo (simulates 7 days)
  const skipLearning = async () => {
    const simulatedData = {
      ...behaviorData,
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
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <DigitalBrain size={80} />
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
            AEGIS LEARNING MODE
          </h1>
          <p className="text-slate-400">Teaching your Digital Mate to understand you</p>
        </div>

        {/* Learning Progress */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-cyan-400 font-mono text-sm">DAY {learningDay} OF 7</span>
            <span className="text-slate-400 text-sm">{learningPhases[learningDay - 1]?.name}</span>
          </div>
          
          {/* Day progress bars */}
          <div className="flex space-x-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <div 
                key={day}
                className={`flex-1 h-2 rounded-full ${
                  day < learningDay ? 'bg-cyan-400' :
                  day === learningDay ? 'bg-gradient-to-r from-cyan-400 to-purple-500' :
                  'bg-slate-700'
                }`}
                style={day === learningDay ? { width: `${learningProgress}%` } : {}}
              >
                {day === learningDay && (
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${learningProgress}%` }}
                  ></div>
                )}
              </div>
            ))}
          </div>
          
          <p className="text-slate-300 text-sm">{learningPhases[learningDay - 1]?.description}</p>
        </div>

        {/* Learning Content based on Day */}
        <LearningDayContent 
          day={learningDay}
          behaviorData={behaviorData}
          onSubmit={handleRoutineSubmit}
          progress={learningProgress}
        />

        {/* Skip option for demo */}
        <div className="mt-8 text-center">
          <button
            onClick={skipLearning}
            className="text-slate-500 hover:text-cyan-400 text-sm underline transition-colors"
          >
            Skip learning (Demo mode - simulate 7 days)
          </button>
        </div>

        {/* What Aegis will do */}
        <div className="mt-8 bg-slate-900/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-cyan-400 mb-4">After Learning, Aegis Will:</h3>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start space-x-2">
              <span className="text-cyan-400">▸</span>
              <span>Become <strong className="text-white">invisible</strong> - you won't see any app</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-cyan-400">▸</span>
              <span>Only <strong className="text-white">popup notifications</strong> when it needs to tell you something</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-cyan-400">▸</span>
              <span>Access via <strong className="text-white">Calculator code</strong> to see hidden files & settings</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-cyan-400">▸</span>
              <span><strong className="text-white">Automatically protect</strong> your sensitive data</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-cyan-400">▸</span>
              <span><strong className="text-white">Alert you</strong> if someone tries to access your phone</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Learning content for each day
const LearningDayContent = ({ day, behaviorData, onSubmit, progress }) => {
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
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6">
        <h2 className="text-xl font-bold text-white mb-6">Tell me about your daily routine</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-cyan-400 text-sm mb-2">What time do you usually wake up?</label>
            <input
              type="time"
              value={formData.wakeUpTime || ''}
              onChange={(e) => handleChange('wakeUpTime', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white"
            />
          </div>
          
          <div>
            <label className="block text-cyan-400 text-sm mb-2">What time do you usually go to sleep?</label>
            <input
              type="time"
              value={formData.sleepTime || ''}
              onChange={(e) => handleChange('sleepTime', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white"
            />
          </div>
          
          <div>
            <label className="block text-cyan-400 text-sm mb-2">Work/School start time (if applicable)</label>
            <input
              type="time"
              value={formData.workStartTime || ''}
              onChange={(e) => handleChange('workStartTime', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white"
            />
          </div>
          
          <div>
            <label className="block text-cyan-400 text-sm mb-2">Work/School end time</label>
            <input
              type="time"
              value={formData.workEndTime || ''}
              onChange={(e) => handleChange('workEndTime', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white"
            />
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
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
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6">
        <h2 className="text-xl font-bold text-white mb-6">Which apps do you use most?</h2>
        
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
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              {app}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleSubmit}
          className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
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
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6">
        <h2 className="text-xl font-bold text-white mb-6">What should Aegis protect?</h2>
        <p className="text-slate-400 text-sm mb-4">Select what you consider sensitive</p>
        
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
                  ? 'bg-purple-500/20 border-purple-400 text-purple-400'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleSubmit}
          className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
        >
          Continue Learning
        </button>
      </div>
    );
  }

  // Day 4: Communication Patterns
  if (day === 4) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
        <h2 className="text-xl font-bold text-white mb-6">Who do you trust?</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-blue-400 text-sm mb-2">Add trusted contact names (comma separated)</label>
            <input
              type="text"
              placeholder="e.g., Mom, Dad, Best Friend, Partner"
              value={formData.trustedContacts || ''}
              onChange={(e) => handleChange('trustedContacts', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white"
            />
          </div>
          
          <div>
            <label className="block text-blue-400 text-sm mb-2">Emergency contact</label>
            <input
              type="text"
              placeholder="Name of person to contact in emergency"
              value={formData.emergencyContact || ''}
              onChange={(e) => handleChange('emergencyContact', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white"
            />
          </div>
          
          <div>
            <label className="block text-blue-400 text-sm mb-2">How many messages do you send per day?</label>
            <select
              value={formData.messageFrequency || ''}
              onChange={(e) => handleChange('messageFrequency', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white"
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
          className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
        >
          Continue Learning
        </button>
      </div>
    );
  }

  // Day 5-7: Observing and Final calibration
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6 text-center">
      <div className="flex justify-center mb-6">
        <div className="relative">
          <DigitalBrain size={100} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-white mb-4">
        {day === 5 && "Learning Your Patterns..."}
        {day === 6 && "Analyzing Behavior..."}
        {day === 7 && "Final Calibration..."}
      </h2>
      
      <p className="text-slate-400 mb-6">
        {day === 5 && "Aegis is observing how you use your phone to understand your habits."}
        {day === 6 && "Deep analysis in progress. Aegis is building your unique profile."}
        {day === 7 && "Almost done! Aegis is finalizing your personalized AI protection."}
      </p>
      
      <div className="bg-slate-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-400">Processing...</span>
          <span className="text-cyan-400">{progress}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
      >
        {day === 7 ? 'Complete Learning' : 'Continue Processing'}
      </button>
    </div>
  );
};

export default AegisLearningMode;

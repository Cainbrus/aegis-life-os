import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const ContextualHub = ({ authStatus, onAppOpen, trapActive, ownerMode }) => {
  const [currentContext, setCurrentContext] = useState('general');
  const [contextualCards, setContextualCards] = useState([]);
  const [proactiveBriefing, setProactiveBriefing] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState('morning');

  useEffect(() => {
    determineContext();
    loadContextualContent();
    const interval = setInterval(() => {
      determineContext();
      loadContextualContent();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [authStatus]);

  const determineContext = () => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let context = 'general';
    let timeContext = 'morning';

    if (hour >= 5 && hour < 12) {
      context = 'morning';
      timeContext = 'morning';
    } else if (hour >= 12 && hour < 17) {
      context = isWeekend ? 'weekend_afternoon' : 'work';
      timeContext = 'afternoon';
    } else if (hour >= 17 && hour < 22) {
      context = 'evening';
      timeContext = 'evening';
    } else {
      context = 'night';
      timeContext = 'night';
    }

    setCurrentContext(context);
    setTimeOfDay(timeContext);
  };

  const loadContextualContent = async () => {
    try {
      if (ownerMode) {
        // Load real proactive content for owner
        const briefingResponse = await axios.get(`${API}/proactive/briefing?type=${timeOfDay}`);
        setProactiveBriefing(briefingResponse.data);
      }

      // Generate contextual cards based on current context
      generateContextualCards();
    } catch (error) {
      console.error('Failed to load contextual content:', error);
      generateContextualCards(); // Fallback to static cards
    }
  };

  const generateContextualCards = () => {
    const cards = getContextualCards(currentContext, trapActive, ownerMode);
    setContextualCards(cards);
  };

  const getContextualCards = (context, isTrap, isOwner) => {
    const baseCards = [];

    switch (context) {
      case 'morning':
        baseCards.push(
          {
            id: 'morning_briefing',
            title: '🌅 Good Morning',
            type: 'briefing',
            content: isOwner ? 'Ready to make today amazing! Here\'s what\'s ahead.' : 'Have a great day ahead!',
            priority: 'high',
            actions: [
              { text: 'View Schedule', action: () => onAppOpen('calendar') },
              { text: 'Check Weather', action: () => handleWeatherCheck() }
            ]
          },
          {
            id: 'morning_routine',
            title: '☕ Morning Essentials',
            type: 'routine',
            content: 'Your usual morning apps and shortcuts',
            priority: 'medium',
            actions: [
              { text: 'News', action: () => handleQuickAction('news') },
              { text: 'Messages', action: () => onAppOpen('messages') },
              { text: 'Email', action: () => handleQuickAction('email') }
            ]
          }
        );
        break;

      case 'work':
        baseCards.push(
          {
            id: 'work_focus',
            title: '💼 Work Mode Active',
            type: 'focus',
            content: isOwner ? 'Optimized for productivity. Distractions minimized.' : 'Focus mode enabled',
            priority: 'high',
            actions: [
              { text: 'Calendar', action: () => onAppOpen('calendar') },
              { text: 'Notes', action: () => onAppOpen('notes') },
              { text: 'Settings', action: () => onAppOpen('settings') }
            ]
          },
          {
            id: 'upcoming_meeting',
            title: '📅 Next Meeting',
            type: 'alert',
            content: isTrap ? 'Team standup in 30 minutes' : (isOwner ? 'AI analysis suggests preparation time needed' : 'No meetings scheduled'),
            priority: 'high',
            actions: [
              { text: 'Prepare', action: () => handleMeetingPrep() },
              { text: 'Join Early', action: () => handleQuickAction('meeting') }
            ]
          }
        );
        break;

      case 'evening':
        baseCards.push(
          {
            id: 'evening_wind_down',
            title: '🌆 Evening Relaxation',
            type: 'lifestyle',
            content: 'Time to unwind and reflect on the day',
            priority: 'medium',
            actions: [
              { text: 'Netflix', action: () => handleQuickAction('netflix') },
              { text: 'Music', action: () => handleQuickAction('music') },
              { text: 'Photos', action: () => onAppOpen('photos') }
            ]
          },
          {
            id: 'daily_summary',
            title: '📊 Day Summary',
            type: 'insight',
            content: isOwner ? 'AI has prepared your daily insights and achievements' : 'Review today\'s activities',
            priority: 'low',
            actions: [
              { text: 'View Insights', action: () => handleDailySummary() },
              { text: 'Plan Tomorrow', action: () => handlePlanTomorrow() }
            ]
          }
        );
        break;

      case 'night':
        baseCards.push(
          {
            id: 'night_mode',
            title: '🌙 Night Mode',
            type: 'system',
            content: 'Optimized for nighttime use with reduced notifications',
            priority: 'medium',
            actions: [
              { text: 'Sleep Timer', action: () => handleSleepTimer() },
              { text: 'Do Not Disturb', action: () => handleQuickAction('dnd') }
            ]
          }
        );
        break;

      default:
        baseCards.push(
          {
            id: 'general_assistant',
            title: isOwner ? '🤖 Your Digital Mate' : '📱 Assistant',
            type: 'assistant',
            content: isOwner ? 'I\'m here to help with whatever you need' : 'How can I help you today?',
            priority: 'medium',
            actions: [
              { text: 'Quick Actions', action: () => handleQuickActions() },
              { text: 'Voice Command', action: () => handleVoiceCommand() }
            ]
          }
        );
    }

    // Add proactive intelligence cards for owner mode
    if (isOwner) {
      baseCards.push(
        {
          id: 'proactive_suggestions',
          title: '💡 Smart Suggestions',
          type: 'intelligence',
          content: 'AI has identified opportunities and optimizations for you',
          priority: 'high',
          actions: [
            { text: 'View All', action: () => handleProactiveSuggestions() },
            { text: 'Quick Fix', action: () => handleQuickFix() }
          ]
        }
      );
    }

    return baseCards;
  };

  const handleWeatherCheck = async () => {
    // Mock weather data for demo
    setWeatherData({
      temp: '72°F',
      condition: 'Partly Cloudy',
      forecast: 'Perfect day ahead!'
    });
  };

  const handleMeetingPrep = () => {
    // Mock meeting preparation
    console.log('Preparing for meeting with AI assistance...');
  };

  const handleDailySummary = async () => {
    if (ownerMode) {
      try {
        const response = await axios.get(`${API}/proactive/daily-summary`);
        console.log('Daily summary:', response.data);
      } catch (error) {
        console.log('Mock daily summary: 8 tasks completed, 3 meetings attended, 15 messages processed');
      }
    }
  };

  const handlePlanTomorrow = () => {
    console.log('AI is analyzing tomorrow\'s optimal schedule...');
  };

  const handleSleepTimer = () => {
    console.log('Setting up sleep optimization...');
  };

  const handleQuickActions = () => {
    console.log('Opening quick actions menu...');
  };

  const handleVoiceCommand = () => {
    console.log('Listening for "Hey Mate" command...');
  };

  const handleProactiveSuggestions = async () => {
    if (ownerMode) {
      try {
        const response = await axios.get(`${API}/proactive/suggestions`);
        console.log('Proactive suggestions:', response.data);
      } catch (error) {
        console.log('Mock suggestions: Optimize calendar, backup photos, update passwords');
      }
    }
  };

  const handleQuickFix = () => {
    console.log('Applying AI-recommended quick fixes...');
  };

  const handleQuickAction = (action) => {
    console.log(`Quick action: ${action}`);
  };

  const getContextualStyling = () => {
    switch (currentContext) {
      case 'morning':
        return 'bg-gradient-to-br from-yellow-900 via-slate-900 to-orange-900';
      case 'work':
        return 'bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-900';
      case 'evening':
        return 'bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900';
      case 'night':
        return 'bg-gradient-to-br from-slate-900 via-gray-900 to-black';
      default:
        return 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-900 bg-opacity-20';
      case 'medium': return 'border-yellow-500 bg-yellow-900 bg-opacity-20';
      case 'low': return 'border-green-500 bg-green-900 bg-opacity-20';
      default: return 'border-slate-500 bg-slate-900 bg-opacity-20';
    }
  };

  return (
    <div className={`min-h-screen text-white transition-all duration-1000 ${getContextualStyling()}`}>
      {/* Dynamic Header */}
      <div className="p-6 border-b border-slate-700 bg-slate-900 bg-opacity-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {trapActive ? 'My Phone' : ownerMode ? 'Aegis Life OS' : 'Digital Assistant'}
            </h1>
            <p className="text-slate-400 text-sm">
              {currentContext.charAt(0).toUpperCase() + currentContext.slice(1).replace('_', ' ')} Mode • {new Date().toLocaleTimeString()}
            </p>
          </div>
          
          {ownerMode && (
            <div className="text-right">
              <div className="text-green-400 text-sm">🛡️ Owner Mode</div>
              <div className="text-xs text-slate-400">Full Intelligence Active</div>
            </div>
          )}
          
          {trapActive && (
            <div className="text-right">
              <div className="text-blue-400 text-sm">📱 Phone Unlocked</div>
              <div className="text-xs text-slate-400">Standard Access</div>
            </div>
          )}
        </div>
      </div>

      {/* Weather Widget (if loaded) */}
      {weatherData && (
        <div className="p-4 bg-blue-900 bg-opacity-30 border-b border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{weatherData.temp}</div>
              <div className="text-sm text-blue-300">{weatherData.condition}</div>
            </div>
            <div className="text-sm text-blue-200">{weatherData.forecast}</div>
          </div>
        </div>
      )}

      {/* Contextual Cards Grid */}
      <div className="p-6 space-y-4">
        {contextualCards.map((card) => (
          <div
            key={card.id}
            className={`
              rounded-lg border-l-4 p-6 transition-all duration-300 hover:transform hover:scale-[1.02]
              ${getPriorityColor(card.priority)}
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                <p className="text-slate-300 text-sm">{card.content}</p>
              </div>
              
              <div className={`
                px-2 py-1 rounded text-xs font-medium
                ${card.priority === 'high' ? 'bg-red-800 text-red-200' :
                  card.priority === 'medium' ? 'bg-yellow-800 text-yellow-200' :
                  'bg-green-800 text-green-200'}
              `}>
                {card.priority}
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex flex-wrap gap-2">
              {card.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.action}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm font-medium transition-all"
                >
                  {action.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Proactive Briefing Section (Owner Mode Only) */}
      {ownerMode && proactiveBriefing && (
        <div className="p-6 border-t border-slate-700">
          <h2 className="text-xl font-semibold mb-4">🧠 Proactive Intelligence</h2>
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-medium mb-2">{proactiveBriefing.title}</h3>
            <p className="text-slate-300 text-sm mb-3">{proactiveBriefing.summary}</p>
            
            {proactiveBriefing.insights && (
              <div className="space-y-1">
                {proactiveBriefing.insights.map((insight, idx) => (
                  <div key={idx} className="text-xs text-blue-300">• {insight}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick App Access */}
      <div className="p-6 border-t border-slate-700">
        <h2 className="text-lg font-semibold mb-4">📱 Quick Access</h2>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
          {[
            { name: 'Messages', icon: '💬', app: 'messages' },
            { name: 'Photos', icon: '📸', app: 'photos' },
            { name: 'Calendar', icon: '📅', app: 'calendar' },
            { name: 'Calculator', icon: '🔢', app: 'calculator' },
            { name: 'Settings', icon: '⚙️', app: 'settings' },
            { name: 'Banking', icon: '💳', app: 'banking' }
          ].map((app, idx) => (
            <button
              key={idx}
              onClick={() => onAppOpen(app.app)}
              className="bg-slate-800 hover:bg-slate-700 rounded-lg p-3 text-center transition-all transform hover:scale-105"
            >
              <div className="text-2xl mb-1">{app.icon}</div>
              <div className="text-xs font-medium">{app.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContextualHub;
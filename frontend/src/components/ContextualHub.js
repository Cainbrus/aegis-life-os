import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AIWorkforceMonitor from './AIWorkforceMonitor';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ContextualHub = ({ authStatus, onAppOpen, trapActive, ownerMode }) => {
  const [currentContext, setCurrentContext] = useState('general');
  const [contextualCards, setContextualCards] = useState([]);
  const [proactiveBriefing, setProactiveBriefing] = useState(null);
  const [privacyStats, setPrivacyStats] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [goalPlan, setGoalPlan] = useState(null);

  useEffect(() => {
    determineContext();
    loadContextualContent();
    const interval = setInterval(() => {
      determineContext();
      loadContextualContent();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [authStatus, ownerMode]);

  const determineContext = () => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let context = 'general';

    if (hour >= 5 && hour < 12) {
      context = 'morning';
    } else if (hour >= 12 && hour < 17) {
      context = isWeekend ? 'weekend_afternoon' : 'work';
    } else if (hour >= 17 && hour < 22) {
      context = 'evening';
    } else {
      context = 'night';
    }

    setCurrentContext(context);
  };

  const loadContextualContent = async () => {
    try {
      // Load contextual cards from backend
      const cardsResponse = await axios.get(`${API}/context/cards`);
      if (cardsResponse.data.cards) {
        setContextualCards(cardsResponse.data.cards);
      }

      if (ownerMode) {
        // Load proactive briefing
        try {
          const briefingResponse = await axios.get(`${API}/intelligence/briefing`);
          setProactiveBriefing(briefingResponse.data);
        } catch (e) {
          console.log('Briefing not available');
        }

        // Load privacy stats
        try {
          const privacyResponse = await axios.get(`${API}/privacy/stats`);
          setPrivacyStats(privacyResponse.data);
        } catch (e) {
          console.log('Privacy stats not available');
        }
      }
    } catch (error) {
      console.error('Failed to load contextual content:', error);
      // Generate fallback cards
      setContextualCards(getFallbackCards());
    }
  };

  const getFallbackCards = () => {
    const hour = new Date().getHours();
    const cards = [];

    if (hour >= 5 && hour < 12) {
      cards.push({
        id: 'greeting',
        type: 'greeting',
        title: 'Good Morning',
        subtitle: 'Ready to start your day',
        icon: '🌅',
        priority: 1
      });
    } else if (hour >= 12 && hour < 17) {
      cards.push({
        id: 'greeting',
        type: 'greeting',
        title: 'Good Afternoon',
        subtitle: 'Stay productive',
        icon: '☀️',
        priority: 1
      });
    } else {
      cards.push({
        id: 'greeting',
        type: 'greeting',
        title: 'Good Evening',
        subtitle: 'Time to wind down',
        icon: '🌙',
        priority: 1
      });
    }

    return cards;
  };

  const handleChatSubmit = async () => {
    if (!chatMessage.trim()) return;

    setIsThinking(true);
    try {
      const response = await axios.post(`${API}/intelligence/chat`, {
        message: chatMessage,
        context: currentContext
      });
      
      setChatResponse(response.data);
      setChatMessage('');
    } catch (error) {
      console.error('Chat failed:', error);
      setChatResponse({
        response: "I'm having trouble connecting. Please try again.",
        suggestions: []
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleGoalSubmit = async () => {
    if (!goalInput.trim()) return;

    setIsThinking(true);
    try {
      const response = await axios.post(`${API}/intelligence/process-goal`, {
        goal: goalInput
      });
      
      setGoalPlan(response.data.plan);
      setGoalInput('');
    } catch (error) {
      console.error('Goal processing failed:', error);
    } finally {
      setIsThinking(false);
    }
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

      {/* Contextual Cards */}
      <div className="p-6 space-y-4">
        {contextualCards.map((card) => (
          <div
            key={card.id}
            className={`
              rounded-lg p-4 transition-all duration-300 hover:transform hover:scale-[1.01]
              ${card.type === 'greeting' ? 'bg-gradient-to-r from-blue-900 to-purple-900 border border-blue-700' :
                card.type === 'status' ? 'bg-slate-800 border border-slate-700' :
                card.type === 'action' ? 'bg-yellow-900 bg-opacity-30 border border-yellow-700' :
                'bg-slate-800 border border-slate-700'}
            `}
          >
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{card.icon}</span>
              <div>
                <h3 className="font-semibold">{card.title}</h3>
                <p className="text-sm text-slate-400">{card.subtitle}</p>
                {card.detail && (
                  <p className="text-xs text-blue-400 mt-1">{card.detail}</p>
                )}
              </div>
            </div>
            {card.action && (
              <button 
                onClick={() => console.log(card.action)}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm"
              >
                View
              </button>
            )}
          </div>
        ))}
      </div>

      {/* AI Workforce Monitor (Owner Mode Only) */}
      {ownerMode && (
        <div className="p-6 border-t border-slate-700">
          <AIWorkforceMonitor 
            ownerMode={ownerMode}
            authStatus={authStatus}
          />
        </div>
      )}

      {/* Chat with Digital Mate (Owner Mode) */}
      {ownerMode && (
        <div className="p-6 border-t border-slate-700">
          <h2 className="text-lg font-semibold mb-4">💬 Chat with Your Digital Mate</h2>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                placeholder="Ask me anything..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
              />
              <button
                onClick={handleChatSubmit}
                disabled={isThinking}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded"
              >
                {isThinking ? '...' : 'Send'}
              </button>
            </div>
            
            {chatResponse && (
              <div className="mt-4 p-4 bg-slate-900 rounded-lg">
                <p className="text-slate-200">{chatResponse.response}</p>
                {chatResponse.suggestions && chatResponse.suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {chatResponse.suggestions.map((suggestion, idx) => (
                      <span key={idx} className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs">
                        💡 {suggestion}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Goal Planner (Owner Mode) */}
      {ownerMode && (
        <div className="p-6 border-t border-slate-700">
          <h2 className="text-lg font-semibold mb-4">🎯 AI Goal Planner</h2>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGoalSubmit()}
                placeholder="What do you want to achieve? (e.g., 'Plan a vacation to Japan')"
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
              />
              <button
                onClick={handleGoalSubmit}
                disabled={isThinking}
                className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-4 py-2 rounded"
              >
                {isThinking ? '...' : 'Plan'}
              </button>
            </div>
            
            {goalPlan && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-900 rounded-lg">
                  <h3 className="font-semibold text-green-400 mb-2">✓ Goal Understood</h3>
                  <p className="text-slate-300">{goalPlan.understood_goal}</p>
                </div>
                
                {goalPlan.execution_plan && goalPlan.execution_plan.length > 0 && (
                  <div className="p-4 bg-slate-900 rounded-lg">
                    <h3 className="font-semibold text-blue-400 mb-2">📋 Execution Plan</h3>
                    <div className="space-y-2">
                      {goalPlan.execution_plan.map((step, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs">{step.step}</span>
                          <div>
                            <p className="text-slate-200">{step.action}</p>
                            <p className="text-xs text-slate-400">Agent: {step.agent}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {goalPlan.suggestions && goalPlan.suggestions.length > 0 && (
                  <div className="p-4 bg-yellow-900 bg-opacity-30 rounded-lg border border-yellow-700">
                    <h3 className="font-semibold text-yellow-400 mb-2">💡 AI Suggestions</h3>
                    <ul className="space-y-1">
                      {goalPlan.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-sm text-yellow-200">• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Privacy Guardian Status (Owner Mode) */}
      {ownerMode && privacyStats && (
        <div className="p-6 border-t border-slate-700">
          <h2 className="text-lg font-semibold mb-4">🧠 Privacy Guardian</h2>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{privacyStats.total_analyzed}</div>
                <div className="text-xs text-slate-400">Items Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{privacyStats.accepted_suggestions}</div>
                <div className="text-xs text-slate-400">Accepted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{Math.round(privacyStats.trust_level * 100)}%</div>
                <div className="text-xs text-slate-400">Trust Level</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400 capitalize">{privacyStats.learning_mode?.replace('_', ' ')}</div>
                <div className="text-xs text-slate-400">Learning Mode</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center">
              {privacyStats.mode_explanation?.[privacyStats.learning_mode] || 'AI is learning your privacy preferences'}
            </p>
          </div>
        </div>
      )}

      {/* Proactive Briefing Section (Owner Mode Only) */}
      {ownerMode && proactiveBriefing && proactiveBriefing.briefing_type !== 'locked' && (
        <div className="p-6 border-t border-slate-700">
          <h2 className="text-xl font-semibold mb-4">🧠 Proactive Intelligence</h2>
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-medium mb-2">{proactiveBriefing.title}</h3>
            <p className="text-slate-300 text-sm mb-3">{proactiveBriefing.summary}</p>
            
            {proactiveBriefing.insights && proactiveBriefing.insights.length > 0 && (
              <div className="space-y-1 mb-4">
                <h4 className="text-sm font-semibold text-blue-400">Insights:</h4>
                {proactiveBriefing.insights.map((insight, idx) => (
                  <div key={idx} className="text-xs text-blue-300">• {insight}</div>
                ))}
              </div>
            )}
            
            {proactiveBriefing.action_items && proactiveBriefing.action_items.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {proactiveBriefing.action_items.map((item, idx) => (
                  <button 
                    key={idx}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    {item.text}
                  </button>
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

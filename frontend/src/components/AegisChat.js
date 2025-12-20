import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// =============================================
// AEGIS CHAT - Talk to your Digital Mate
// AI companion that knows you and helps you
// =============================================

const AegisChat = ({ onClose, userName = "Boss" }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: 'aegis',
      text: `Hey ${userName}! 👋 What's on your mind? I'm here to help with anything - whether you want to chat, need advice, or want me to do something for you.`,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mood, setMood] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Quick action suggestions based on context
  const quickActions = [
    "How am I doing financially?",
    "What's on my calendar today?",
    "I'm feeling stressed",
    "Check on my family",
    "Show me my hidden files",
    "Help me relax"
  ];

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      from: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await axios.post(`${API}/intelligence/chat`, {
        message: text,
        context: {
          mood: mood,
          recentMessages: messages.slice(-5).map(m => m.text)
        }
      });

      const aegisResponse = {
        id: Date.now() + 1,
        from: 'aegis',
        text: response.data.response || getSmartResponse(text),
        timestamp: new Date(),
        actions: response.data.actions
      };

      setTimeout(() => {
        setMessages(prev => [...prev, aegisResponse]);
        setIsTyping(false);
      }, 1000 + Math.random() * 1000);

    } catch (error) {
      // Fallback to smart local responses
      const aegisResponse = {
        id: Date.now() + 1,
        from: 'aegis',
        text: getSmartResponse(text),
        timestamp: new Date()
      };

      setTimeout(() => {
        setMessages(prev => [...prev, aegisResponse]);
        setIsTyping(false);
      }, 800);
    }
  };

  const getSmartResponse = (input) => {
    const lowerInput = input.toLowerCase();
    
    // Mood/emotional responses
    if (lowerInput.includes('stress') || lowerInput.includes('anxious') || lowerInput.includes('worried')) {
      return "I hear you. Stress is tough. 💙 Want to try a quick breathing exercise together? Or I can play some calming music. Sometimes just talking about it helps too - what's weighing on you?";
    }
    if (lowerInput.includes('sad') || lowerInput.includes('down') || lowerInput.includes('depressed')) {
      return "I'm sorry you're feeling this way. 💙 Remember, it's okay to not be okay. Would you like to talk about it? I'm here for you, no judgment. Also, when did you last go outside or talk to someone you care about?";
    }
    if (lowerInput.includes('happy') || lowerInput.includes('great') || lowerInput.includes('good')) {
      return "That's amazing to hear! 🎉 What's got you feeling so good? I love seeing you happy! Let's keep that energy going!";
    }
    if (lowerInput.includes('tired') || lowerInput.includes('exhausted')) {
      return "You've been pushing hard lately - I've noticed. 😴 Your screen time has been up 40% this week. Maybe it's time for a break? Want me to block notifications for an hour so you can rest?";
    }
    
    // Financial
    if (lowerInput.includes('money') || lowerInput.includes('financ') || lowerInput.includes('spend')) {
      return "Let me check your finances... 💰 This month you've spent $2,847. That's about 12% more than last month. Your biggest categories are Food ($680), Shopping ($520), and Transport ($340). Want me to show you a breakdown or help set a budget?";
    }
    if (lowerInput.includes('bill') || lowerInput.includes('payment')) {
      return "Looking at your upcoming bills... 📅 You have electricity ($156) due in 3 days, phone ($89) due next week, and rent ($1,800) due on the 1st. Total: $2,045. Want me to remind you before each one?";
    }
    
    // Calendar/Schedule
    if (lowerInput.includes('calendar') || lowerInput.includes('schedule') || lowerInput.includes('today')) {
      return "Here's your day: ☀️\n\n• 10:00am - Team Meeting (Conference Room B)\n• 12:30pm - Lunch with Sarah\n• 3:00pm - Client Call\n• 6:00pm - Gym\n\nYou've got 2 hours free between 1-3pm. Want me to block that for focused work?";
    }
    
    // Family
    if (lowerInput.includes('family') || lowerInput.includes('mum') || lowerInput.includes('dad') || lowerInput.includes('kids')) {
      return "Your family check-in: 👨‍👩‍👧\n\n• Mum - Last called 5 days ago. She mentioned her garden.\n• Dad - Haven't talked in 2 weeks. His birthday is in 18 days!\n• Sophie - At school right now, all good.\n\nWant me to send a quick message to anyone?";
    }
    
    // Hidden files/Vault
    if (lowerInput.includes('hidden') || lowerInput.includes('vault') || lowerInput.includes('secret')) {
      return "Your Phantom Vault has 23 files: 📁\n\n• 12 photos\n• 8 documents\n• 3 videos\n\nLast accessed 2 days ago. Everything is encrypted and secure. Want to open the vault? (Use calculator code 8675309)";
    }
    
    // Relax/Chill
    if (lowerInput.includes('relax') || lowerInput.includes('chill') || lowerInput.includes('calm')) {
      return "Let's take a moment. 🧘\n\nTry this: Close your eyes, take 4 deep breaths. Breathe in for 4 seconds, hold for 4, out for 4.\n\nI can also:\n• Play calming music\n• Block all notifications for an hour\n• Show you some funny videos\n\nWhat sounds good?";
    }
    
    // Help
    if (lowerInput.includes('help') || lowerInput.includes('can you')) {
      return "I can help with lots of things! 🛡️\n\n• Check your schedule & remind you of things\n• Monitor your finances & spending\n• Keep an eye on your family's safety\n• Protect your privacy & hide sensitive stuff\n• Just chat when you need someone to talk to\n\nWhat would you like to do?";
    }
    
    // Default friendly response
    const responses = [
      "Tell me more about that. I'm listening. 💙",
      "That's interesting! How does that make you feel?",
      "I'm here for you. What else is on your mind?",
      "Got it. Is there anything I can do to help with that?",
      "Thanks for sharing. What would make today better for you?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleMoodSelect = (selectedMood) => {
    setMood(selectedMood);
    const moodMessages = {
      great: "Awesome! Love to see you thriving! 🎉 What's making today so good?",
      okay: "Okay is okay! Sometimes that's just how it is. Anything I can help with?",
      rough: "I'm sorry to hear that. 💙 Want to talk about it? I'm here for you, no pressure."
    };
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      from: 'aegis',
      text: moodMessages[selectedMood],
      timestamp: new Date()
    }]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-xl p-4 flex items-center justify-between border-b border-slate-700">
        <button onClick={onClose} className="text-cyan-400 font-medium flex items-center">
          <span className="mr-1">←</span> Back
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold">💙 Chat with Aegis</h1>
          <p className="text-xs text-slate-400">Your Digital Mate</p>
        </div>
        <div className="w-16"></div>
      </div>

      {/* Mood Check (if not set) */}
      {!mood && (
        <div className="bg-slate-800/50 p-4 border-b border-slate-700">
          <p className="text-sm text-slate-300 text-center mb-3">How are you feeling right now?</p>
          <div className="flex justify-center space-x-4">
            {[
              { id: 'great', emoji: '😊', label: 'Great' },
              { id: 'okay', emoji: '😐', label: 'Okay' },
              { id: 'rough', emoji: '😔', label: 'Rough' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => handleMoodSelect(m.id)}
                className="flex flex-col items-center p-3 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
              >
                <span className="text-2xl mb-1">{m.emoji}</span>
                <span className="text-xs text-slate-400">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.from === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-md'
                  : 'bg-slate-700 text-white rounded-bl-md'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.from === 'user' ? 'text-cyan-200' : 'text-slate-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              
              {/* Action buttons if provided */}
              {msg.actions && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {msg.actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(action.text)}
                      className="text-xs bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded-full transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 overflow-x-auto">
        <div className="flex space-x-2">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(action)}
              className="whitespace-nowrap text-xs bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 px-3 py-2 rounded-full transition-colors border border-slate-600"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-800/80 backdrop-blur-xl border-t border-slate-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputText)}
            placeholder="Talk to Aegis..."
            className="flex-1 bg-slate-700 border border-slate-600 rounded-full px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white p-3 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AegisChat;

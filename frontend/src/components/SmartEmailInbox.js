// =============================================
// AEGIS SMART EMAIL INBOX
// Shows AI-filtered emails with categories,
// blocked threats, and auto-extracted reminders
// =============================================

import React, { useState, useEffect } from 'react';
import { playButtonClick, playAppOpen, playNotification } from '../services/SoundService';

const SmartEmailInbox = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);

  useEffect(() => {
    playAppOpen();
  }, []);

  // Email data with Aegis intelligence applied
  const emails = {
    inbox: [
      {
        id: 1,
        from: 'Sarah Chen',
        fromEmail: 'sarah.chen@venturevc.com',
        subject: 'RE: Follow-up on Aegis Demo',
        preview: 'Thanks for the great presentation yesterday! The team was very impressed with the trap mode feature...',
        time: '10:30 AM',
        category: 'work',
        important: true,
        hasReminder: true,
        reminderText: 'Reply by tomorrow',
        avatar: '👩‍💼',
        read: false
      },
      {
        id: 2,
        from: 'Mum',
        fromEmail: 'mum@gmail.com',
        subject: 'Dinner on Sunday?',
        preview: 'Hi love, are you free for dinner this Sunday? Dad wants to BBQ and Sophie is asking about you...',
        time: '9:15 AM',
        category: 'personal',
        important: false,
        avatar: '👵',
        read: false
      },
      {
        id: 3,
        from: 'Calendar',
        fromEmail: 'calendar@google.com',
        subject: 'Reminder: Investor Meeting Tomorrow',
        preview: 'Your event "Investor Pitch - Series A" is scheduled for tomorrow at 10:00 AM...',
        time: 'Yesterday',
        category: 'reminder',
        important: true,
        avatar: '📅',
        read: true
      },
      {
        id: 4,
        from: 'AWS Billing',
        fromEmail: 'billing@aws.amazon.com',
        subject: 'Your AWS Invoice for December',
        preview: 'Your monthly AWS charges: $89.99. Auto-payment scheduled for Dec 25...',
        time: 'Yesterday',
        category: 'finance',
        important: false,
        avatar: '☁️',
        read: true
      },
      {
        id: 5,
        from: 'David Kim',
        fromEmail: 'david.kim@aegis.io',
        subject: 'Technical Architecture Doc',
        preview: 'Hey, I finished the technical documentation for the investor due diligence. Attached is the PDF...',
        time: 'Yesterday',
        category: 'work',
        important: true,
        hasReminder: true,
        reminderText: 'Review before Friday',
        avatar: '👨‍💻',
        read: true
      },
      {
        id: 6,
        from: 'Netflix',
        fromEmail: 'info@netflix.com',
        subject: 'New releases you might like',
        preview: 'Based on your watching history, we think you\'ll love these new shows...',
        time: '2 days ago',
        category: 'promo',
        important: false,
        avatar: '🎬',
        read: true
      },
    ],
    blocked: [
      {
        id: 101,
        from: 'Account Security',
        fromEmail: 'security@bankk-alert.com',
        subject: '⚠️ Your account has been compromised!',
        preview: 'Click here immediately to verify your identity and restore access to your account...',
        time: '8:45 AM',
        threat: 'phishing',
        threatLevel: 'high',
        reason: 'Fake bank domain, suspicious links detected',
        avatar: '🚫'
      },
      {
        id: 102,
        from: 'Prize Winner',
        fromEmail: 'winner@free-prize-claim.net',
        subject: 'You\'ve WON $1,000,000!!!',
        preview: 'Congratulations! You have been selected as our lucky winner. Claim your prize now...',
        time: 'Yesterday',
        threat: 'scam',
        threatLevel: 'high',
        reason: 'Known scam pattern, suspicious sender',
        avatar: '🚫'
      },
      {
        id: 103,
        from: 'Pharmacy Deals',
        fromEmail: 'deals@cheap-meds-online.ru',
        subject: 'Special offer just for you',
        preview: 'Get 90% off on all medications. No prescription needed...',
        time: 'Yesterday',
        threat: 'spam',
        threatLevel: 'medium',
        reason: 'Spam content, suspicious domain',
        avatar: '🚫'
      },
      {
        id: 104,
        from: 'IT Support',
        fromEmail: 'support@microsoft-help.xyz',
        subject: 'Action Required: Password Expiry',
        preview: 'Your Microsoft password will expire in 24 hours. Click here to reset...',
        time: '2 days ago',
        threat: 'phishing',
        threatLevel: 'high',
        reason: 'Impersonating Microsoft, fake domain',
        avatar: '🚫'
      },
      {
        id: 105,
        from: 'Crypto Investment',
        fromEmail: 'invest@guaranteed-returns.io',
        subject: 'Make $10,000/day with this simple trick',
        preview: 'Our AI trading bot guarantees 500% returns. Limited spots available...',
        time: '3 days ago',
        threat: 'scam',
        threatLevel: 'high',
        reason: 'Investment scam pattern detected',
        avatar: '🚫'
      },
      {
        id: 106,
        from: 'Newsletter',
        fromEmail: 'news@marketing-blast.com',
        subject: 'You won\'t believe these deals!',
        preview: 'Unsubscribed sender continues to email. Promotional content...',
        time: '3 days ago',
        threat: 'spam',
        threatLevel: 'low',
        reason: 'Ignored unsubscribe request',
        avatar: '🚫'
      },
      {
        id: 107,
        from: 'Unknown Tracker',
        fromEmail: 'tracker@analytics.com',
        subject: 'RE: Your recent purchase',
        preview: '[Hidden tracking pixel detected and blocked]',
        time: '4 days ago',
        threat: 'tracking',
        threatLevel: 'medium',
        reason: '3 tracking pixels blocked',
        avatar: '👁️'
      },
    ],
    reminders: [
      {
        id: 201,
        title: 'Reply to Sarah Chen',
        source: 'Email: RE: Follow-up on Aegis Demo',
        dueDate: 'Tomorrow',
        priority: 'high',
        icon: '📧'
      },
      {
        id: 202,
        title: 'Review Technical Architecture Doc',
        source: 'Email: Technical Architecture Doc',
        dueDate: 'Friday',
        priority: 'high',
        icon: '📄'
      },
      {
        id: 203,
        title: 'AWS Payment Due',
        source: 'Email: AWS Invoice for December',
        dueDate: 'Dec 25',
        priority: 'medium',
        icon: '💳'
      },
      {
        id: 204,
        title: 'Dinner at Mum\'s',
        source: 'Email: Dinner on Sunday?',
        dueDate: 'Sunday',
        priority: 'low',
        icon: '🍽️'
      },
    ]
  };

  const categoryColors = {
    work: 'bg-blue-500',
    personal: 'bg-green-500',
    reminder: 'bg-purple-500',
    finance: 'bg-emerald-500',
    promo: 'bg-gray-500'
  };

  const threatColors = {
    high: 'bg-red-500 text-red-100',
    medium: 'bg-orange-500 text-orange-100',
    low: 'bg-yellow-500 text-yellow-100'
  };

  // Email detail view
  if (selectedEmail) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700">
          <button 
            onClick={() => { playButtonClick(); setSelectedEmail(null); }}
            className="text-blue-400"
          >
            ← Back
          </button>
          <div className="flex space-x-4">
            <button className="text-slate-400 hover:text-white">🗑️</button>
            <button className="text-slate-400 hover:text-white">📁</button>
            <button className="text-slate-400 hover:text-white">↩️</button>
          </div>
        </div>
        <div className="p-4">
          <h1 className="text-xl font-bold mb-2">{selectedEmail.subject}</h1>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-xl">
              {selectedEmail.avatar}
            </div>
            <div>
              <p className="font-medium">{selectedEmail.from}</p>
              <p className="text-slate-400 text-sm">{selectedEmail.fromEmail}</p>
            </div>
          </div>
          {selectedEmail.hasReminder && (
            <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-lg p-3 mb-4 flex items-center space-x-2">
              <span>🛡️</span>
              <span className="text-cyan-300 text-sm">Aegis set reminder: {selectedEmail.reminderText}</span>
            </div>
          )}
          <p className="text-slate-300 leading-relaxed">{selectedEmail.preview}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-blue-600 p-4">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => { playButtonClick(); onClose(); }}
            className="text-white"
          >
            ← Back
          </button>
          <h1 className="text-lg font-bold">✉️ Smart Inbox</h1>
          <button className="text-white">⚙️</button>
        </div>
        
        {/* Aegis Protection Summary */}
        <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🛡️</span>
            <div>
              <p className="text-sm font-medium">Aegis Email Protection</p>
              <p className="text-xs text-blue-200">{emails.blocked.length} threats blocked today</p>
            </div>
          </div>
          <div className="text-green-400 text-sm font-bold">Active ✓</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-800 border-b border-slate-700">
        {[
          { id: 'inbox', label: 'Inbox', count: emails.inbox.filter(e => !e.read).length },
          { id: 'blocked', label: 'Blocked', count: emails.blocked.length },
          { id: 'reminders', label: 'Reminders', count: emails.reminders.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { playButtonClick(); setActiveTab(tab.id); }}
            className={`flex-1 py-3 text-sm font-medium relative ${
              activeTab === tab.id 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-slate-400'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                tab.id === 'blocked' ? 'bg-red-500' : 'bg-blue-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="pb-20">
        {/* Inbox Tab */}
        {activeTab === 'inbox' && (
          <div>
            {emails.inbox.map(email => (
              <button
                key={email.id}
                onClick={() => { playButtonClick(); setSelectedEmail(email); }}
                className={`w-full p-4 border-b border-slate-800 text-left hover:bg-slate-800/50 transition-colors ${
                  !email.read ? 'bg-slate-800/30' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                    {email.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${!email.read ? 'text-white' : 'text-slate-300'}`}>
                          {email.from}
                        </span>
                        {email.important && <span className="text-yellow-400">⭐</span>}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColors[email.category]} text-white`}>
                          {email.category}
                        </span>
                      </div>
                      <span className="text-slate-500 text-xs">{email.time}</span>
                    </div>
                    <p className={`text-sm ${!email.read ? 'font-medium text-white' : 'text-slate-400'}`}>
                      {email.subject}
                    </p>
                    <p className="text-slate-500 text-sm truncate">{email.preview}</p>
                    {email.hasReminder && (
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-cyan-400 text-xs">🛡️ {email.reminderText}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Blocked Tab */}
        {activeTab === 'blocked' && (
          <div>
            <div className="p-4 bg-red-500/10 border-b border-red-500/20">
              <p className="text-red-400 text-sm">
                🛡️ Aegis automatically blocked {emails.blocked.length} suspicious emails
              </p>
            </div>
            {emails.blocked.map(email => (
              <div
                key={email.id}
                className="p-4 border-b border-slate-800 opacity-75"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                    {email.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 line-through">{email.from}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${threatColors[email.threatLevel]}`}>
                          {email.threat.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-slate-500 text-xs">{email.time}</span>
                    </div>
                    <p className="text-slate-500 text-sm line-through">{email.subject}</p>
                    <div className="flex items-center space-x-1 mt-2 bg-slate-800 rounded-lg p-2">
                      <span className="text-red-400">🛡️</span>
                      <span className="text-slate-400 text-xs">{email.reason}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reminders Tab */}
        {activeTab === 'reminders' && (
          <div>
            <div className="p-4 bg-cyan-500/10 border-b border-cyan-500/20">
              <p className="text-cyan-400 text-sm">
                🛡️ Aegis automatically created {emails.reminders.length} reminders from your emails
              </p>
            </div>
            {emails.reminders.map(reminder => (
              <div
                key={reminder.id}
                className="p-4 border-b border-slate-800 flex items-center space-x-3"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  reminder.priority === 'high' ? 'bg-red-500/20' :
                  reminder.priority === 'medium' ? 'bg-yellow-500/20' : 'bg-green-500/20'
                }`}>
                  {reminder.icon}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{reminder.title}</p>
                  <p className="text-slate-500 text-sm">{reminder.source}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    reminder.priority === 'high' ? 'text-red-400' :
                    reminder.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {reminder.dueDate}
                  </p>
                  <p className="text-slate-500 text-xs">{reminder.priority}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartEmailInbox;

// =============================================
// AEGIS SETUP WIZARD
// Onboarding flow for setting up essential features
// Emergency → Lost Phone → Family → Done
// =============================================

import React, { useState } from 'react';
import { playButtonClick, playSuccess, playNotification } from '../services/SoundService';

const SetupWizard = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState({
    emergency: {
      contacts: [
        { id: 1, name: '', phone: '', relation: '' }
      ],
      autoCall000: true,
      sendLocation: true
    },
    lostPhone: {
      message: '',
      reward: '',
      contactEmail: '',
      contactPhone: ''
    },
    family: {
      members: []
    }
  });

  const steps = [
    { id: 'welcome', title: 'Welcome to Aegis', icon: '🛡️' },
    { id: 'emergency', title: 'Emergency Contacts', icon: '🆘' },
    { id: 'lost_phone', title: 'Lost Phone Setup', icon: '📍' },
    { id: 'family', title: 'Family Protection', icon: '👨‍👩‍👧' },
    { id: 'complete', title: 'All Set!', icon: '✅' }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep) / (steps.length - 1)) * 100;

  const nextStep = () => {
    playButtonClick();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      if (currentStep === steps.length - 2) {
        playSuccess();
      }
    } else {
      onComplete(setupData);
    }
  };

  const prevStep = () => {
    playButtonClick();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipStep = () => {
    playButtonClick();
    nextStep();
  };

  const addEmergencyContact = () => {
    setSetupData(prev => ({
      ...prev,
      emergency: {
        ...prev.emergency,
        contacts: [
          ...prev.emergency.contacts,
          { id: Date.now(), name: '', phone: '', relation: '' }
        ]
      }
    }));
  };

  const updateEmergencyContact = (id, field, value) => {
    setSetupData(prev => ({
      ...prev,
      emergency: {
        ...prev.emergency,
        contacts: prev.emergency.contacts.map(c => 
          c.id === id ? { ...c, [field]: value } : c
        )
      }
    }));
  };

  const removeEmergencyContact = (id) => {
    setSetupData(prev => ({
      ...prev,
      emergency: {
        ...prev.emergency,
        contacts: prev.emergency.contacts.filter(c => c.id !== id)
      }
    }));
  };

  const addFamilyMember = () => {
    setSetupData(prev => ({
      ...prev,
      family: {
        ...prev.family,
        members: [
          ...prev.family.members,
          { id: Date.now(), name: '', relation: '', phone: '' }
        ]
      }
    }));
  };

  const updateFamilyMember = (id, field, value) => {
    setSetupData(prev => ({
      ...prev,
      family: {
        ...prev.family,
        members: prev.family.members.map(m => 
          m.id === id ? { ...m, [field]: value } : m
        )
      }
    }));
  };

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return (
          <div className="text-center py-8">
            <div className="text-8xl mb-6 animate-pulse">🛡️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Welcome to Aegis</h2>
            <p className="text-slate-300 mb-6 max-w-md mx-auto">
              Your personal digital guardian. Let&apos;s set up a few things to keep you protected.
            </p>
            <div className="space-y-3 text-left max-w-sm mx-auto">
              <div className="flex items-center space-x-3 bg-slate-800/50 rounded-xl p-3">
                <span className="text-2xl">🆘</span>
                <div>
                  <p className="text-white font-medium">Emergency Contacts</p>
                  <p className="text-slate-400 text-sm">Who to call in emergencies</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-slate-800/50 rounded-xl p-3">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="text-white font-medium">Lost Phone</p>
                  <p className="text-slate-400 text-sm">How to find your phone</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-slate-800/50 rounded-xl p-3">
                <span className="text-2xl">👨‍👩‍👧</span>
                <div>
                  <p className="text-white font-medium">Family Protection</p>
                  <p className="text-slate-400 text-sm">Keep your family safe</p>
                </div>
              </div>
            </div>
            <p className="text-slate-500 text-sm mt-6">Takes about 2 minutes</p>
          </div>
        );

      case 'emergency':
        return (
          <div className="py-4">
            <div className="text-center mb-6">
              <span className="text-5xl">🆘</span>
              <h2 className="text-xl font-bold text-white mt-3">Emergency Contacts</h2>
              <p className="text-slate-400 text-sm mt-1">Who should Aegis contact in an emergency?</p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              {setupData.emergency.contacts.map((contact, idx) => (
                <div key={contact.id} className="bg-slate-800/70 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-sm">Contact #{idx + 1}</span>
                    {idx > 0 && (
                      <button
                        onClick={() => removeEmergencyContact(contact.id)}
                        className="text-red-400 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Name"
                      value={contact.name}
                      onChange={(e) => updateEmergencyContact(contact.id, 'name', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={contact.phone}
                      onChange={(e) => updateEmergencyContact(contact.id, 'phone', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    />
                    <select
                      value={contact.relation}
                      onChange={(e) => updateEmergencyContact(contact.id, 'relation', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="">Relationship</option>
                      <option value="spouse">Spouse/Partner</option>
                      <option value="parent">Parent</option>
                      <option value="child">Child</option>
                      <option value="sibling">Sibling</option>
                      <option value="friend">Friend</option>
                      <option value="doctor">Doctor</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              ))}

              <button
                onClick={addEmergencyContact}
                className="w-full py-3 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
              >
                + Add Another Contact
              </button>

              <div className="bg-slate-800/50 rounded-xl p-4 mt-4">
                <label className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Auto-call 000</p>
                    <p className="text-slate-400 text-xs">In severe emergencies</p>
                  </div>
                  <button
                    onClick={() => setSetupData(prev => ({
                      ...prev,
                      emergency: { ...prev.emergency, autoCall000: !prev.emergency.autoCall000 }
                    }))}
                    className={`w-12 h-7 rounded-full transition-colors ${
                      setupData.emergency.autoCall000 ? 'bg-red-500' : 'bg-slate-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      setupData.emergency.autoCall000 ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>
              </div>
            </div>
          </div>
        );

      case 'lost_phone':
        return (
          <div className="py-4">
            <div className="text-center mb-6">
              <span className="text-5xl">📍</span>
              <h2 className="text-xl font-bold text-white mt-3">Lost Phone Setup</h2>
              <p className="text-slate-400 text-sm mt-1">What should someone see if they find your phone?</p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700">
                <label className="block text-sm text-slate-400 mb-2">Message to finder</label>
                <textarea
                  placeholder="e.g., This phone belongs to me. Please return it!"
                  value={setupData.lostPhone.message}
                  onChange={(e) => setSetupData(prev => ({
                    ...prev,
                    lostPhone: { ...prev.lostPhone, message: e.target.value }
                  }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  rows={2}
                />
              </div>

              <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700">
                <label className="block text-sm text-slate-400 mb-2">Reward offer (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., $50 reward for safe return"
                  value={setupData.lostPhone.reward}
                  onChange={(e) => setSetupData(prev => ({
                    ...prev,
                    lostPhone: { ...prev.lostPhone, reward: e.target.value }
                  }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700">
                <label className="block text-sm text-slate-400 mb-2">Your contact email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={setupData.lostPhone.contactEmail}
                  onChange={(e) => setSetupData(prev => ({
                    ...prev,
                    lostPhone: { ...prev.lostPhone, contactEmail: e.target.value }
                  }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700">
                <label className="block text-sm text-slate-400 mb-2">Your contact phone</label>
                <input
                  type="tel"
                  placeholder="Alternative phone number"
                  value={setupData.lostPhone.contactPhone}
                  onChange={(e) => setSetupData(prev => ({
                    ...prev,
                    lostPhone: { ...prev.lostPhone, contactPhone: e.target.value }
                  }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              {/* Preview */}
              {(setupData.lostPhone.message || setupData.lostPhone.reward) && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-yellow-400 text-xs font-medium mb-2">Preview of lock screen:</p>
                  <div className="bg-slate-900 rounded-lg p-3 text-center">
                    <p className="text-white text-sm">{setupData.lostPhone.message || 'Your message here'}</p>
                    {setupData.lostPhone.reward && (
                      <p className="text-green-400 text-xs mt-1">🎁 {setupData.lostPhone.reward}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'family':
        return (
          <div className="py-4">
            <div className="text-center mb-6">
              <span className="text-5xl">👨‍👩‍👧</span>
              <h2 className="text-xl font-bold text-white mt-3">Family Protection</h2>
              <p className="text-slate-400 text-sm mt-1">Add family members to track their safety</p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              {setupData.family.members.length === 0 ? (
                <div className="text-center py-8 bg-slate-800/50 rounded-xl">
                  <p className="text-slate-400 mb-4">No family members added yet</p>
                  <button
                    onClick={addFamilyMember}
                    className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors"
                  >
                    + Add Family Member
                  </button>
                </div>
              ) : (
                <>
                  {setupData.family.members.map((member, idx) => (
                    <div key={member.id} className="bg-slate-800/70 rounded-xl p-4 border border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-400 text-sm">Family Member #{idx + 1}</span>
                        <button
                          onClick={() => setSetupData(prev => ({
                            ...prev,
                            family: {
                              ...prev.family,
                              members: prev.family.members.filter(m => m.id !== member.id)
                            }
                          }))}
                          className="text-red-400 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Name"
                          value={member.name}
                          onChange={(e) => updateFamilyMember(member.id, 'name', e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                        />
                        <select
                          value={member.relation}
                          onChange={(e) => updateFamilyMember(member.id, 'relation', e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                        >
                          <option value="">Relationship</option>
                          <option value="spouse">Spouse/Partner</option>
                          <option value="child">Child</option>
                          <option value="parent">Parent</option>
                          <option value="sibling">Sibling</option>
                        </select>
                        <input
                          type="tel"
                          placeholder="Their phone number"
                          value={member.phone}
                          onChange={(e) => updateFamilyMember(member.id, 'phone', e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addFamilyMember}
                    className="w-full py-3 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
                  >
                    + Add Another Member
                  </button>
                </>
              )}

              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-sm">
                  💡 Family members will need to accept an invite to be tracked
                </p>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-8">
            <div className="text-8xl mb-6">✅</div>
            <h2 className="text-2xl font-bold text-white mb-4">You&apos;re All Set!</h2>
            <p className="text-slate-300 mb-8 max-w-md mx-auto">
              Aegis is now configured to protect you. Here&apos;s what&apos;s active:
            </p>
            
            <div className="space-y-3 text-left max-w-sm mx-auto mb-8">
              <div className="flex items-center space-x-3 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                <span className="text-green-400 text-xl">✓</span>
                <div>
                  <p className="text-white font-medium">Emergency Protection</p>
                  <p className="text-slate-400 text-sm">{setupData.emergency.contacts.filter(c => c.name).length} contacts configured</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                <span className="text-green-400 text-xl">✓</span>
                <div>
                  <p className="text-white font-medium">Lost Phone Protection</p>
                  <p className="text-slate-400 text-sm">GPS tracking ready</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                <span className="text-green-400 text-xl">✓</span>
                <div>
                  <p className="text-white font-medium">Family Safety</p>
                  <p className="text-slate-400 text-sm">{setupData.family.members.length > 0 ? `${setupData.family.members.length} members added` : 'Can add later'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
                <span className="text-cyan-400 text-xl">🛡️</span>
                <div>
                  <p className="text-white font-medium">AI Protection Active</p>
                  <p className="text-slate-400 text-sm">Spam, scam & threat detection ON</p>
                </div>
              </div>
            </div>

            <p className="text-slate-500 text-sm">
              Tap any app to see what Aegis has done for you
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-900 via-slate-900 to-black flex flex-col">
      {/* Progress bar */}
      <div className="p-4">
        <div className="w-full bg-slate-800 rounded-full h-1.5">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step, idx) => (
            <div 
              key={step.id}
              className={`text-xs ${idx <= currentStep ? 'text-cyan-400' : 'text-slate-600'}`}
            >
              {step.icon}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {currentStep > 0 && currentStep < steps.length - 1 ? (
            <button
              onClick={prevStep}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex space-x-3">
            {currentStep > 0 && currentStep < steps.length - 1 && (
              <button
                onClick={skipStep}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Skip
              </button>
            )}
            <button
              onClick={nextStep}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:opacity-90 transition-all"
            >
              {currentStep === 0 ? 'Get Started' : 
               currentStep === steps.length - 1 ? 'Enter Aegis' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;

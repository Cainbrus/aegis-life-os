import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const VoiceInterface = ({ ownerMode, onVoiceCommand, onDuressDetected }) => {
  const [isListening, setIsListening] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [voiceResponse, setVoiceResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customWakeName, setCustomWakeName] = useState('Mate');
  const [duressPhrase, setDuressPhrase] = useState('help me please');
  
  const recognition = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = handleSpeechResult;
      recognition.current.onerror = handleSpeechError;
      recognition.current.onend = handleSpeechEnd;
    }

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Start ambient listening for wake word (owner mode only)
    if (ownerMode) {
      startAmbientListening();
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, [ownerMode]);

  const startAmbientListening = () => {
    if (recognition.current && ownerMode) {
      setIsListening(true);
      recognition.current.start();
    }
  };

  const stopListening = () => {
    if (recognition.current) {
      recognition.current.stop();
    }
    setIsListening(false);
    setWakeWordDetected(false);
  };

  const handleSpeechResult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join(' ')
      .toLowerCase();

    console.log('Voice detected:', transcript);

    // Check for duress phrase first (critical security feature)
    if (transcript.includes(duressPhrase.toLowerCase())) {
      handleDuressDetected(transcript);
      return;
    }

    // Check for wake word
    if (!wakeWordDetected && transcript.includes(`hey ${customWakeName.toLowerCase()}`)) {
      setWakeWordDetected(true);
      setVoiceResponse(`Yes? I'm listening.`);
      speak(`Yes? I'm listening.`);
      
      // Continue listening for command
      setTimeout(() => {
        if (recognition.current) {
          recognition.current.start();
        }
      }, 1000);
      return;
    }

    // Process command if wake word was detected
    if (wakeWordDetected) {
      setVoiceCommand(transcript);
      processVoiceCommand(transcript);
    }
  };

  const handleSpeechError = (event) => {
    console.error('Speech recognition error:', event.error);
    
    // Restart listening in ambient mode for owner
    if (ownerMode && !wakeWordDetected) {
      setTimeout(() => {
        if (recognition.current) {
          recognition.current.start();
        }
      }, 2000);
    }
  };

  const handleSpeechEnd = () => {
    // Restart ambient listening for owner mode
    if (ownerMode && !wakeWordDetected && isListening) {
      setTimeout(() => {
        if (recognition.current) {
          recognition.current.start();
        }
      }, 1000);
    }
  };

  const processVoiceCommand = async (command) => {
    if (!ownerMode) {
      setVoiceResponse("Voice commands require owner authentication");
      speak("Voice commands require owner authentication");
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await axios.post(`${API}/voice/process`, {
        command: command,
        wake_word: customWakeName,
        context: 'voice_interface'
      });

      const aiResponse = response.data.response || "I didn't understand that command.";
      setVoiceResponse(aiResponse);
      speak(aiResponse);

      // Execute any actions suggested by the AI
      if (response.data.action_plan) {
        executeVoiceActions(response.data.action_plan);
      }

      if (onVoiceCommand) {
        onVoiceCommand(command, response.data);
      }

    } catch (error) {
      console.error('Voice command processing failed:', error);
      const fallbackResponse = getFallbackResponse(command);
      setVoiceResponse(fallbackResponse);
      speak(fallbackResponse);
    }

    setIsProcessing(false);
    setWakeWordDetected(false);
    
    // Resume ambient listening
    setTimeout(() => {
      if (recognition.current && ownerMode) {
        recognition.current.start();
      }
    }, 2000);
  };

  const getFallbackResponse = (command) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('time')) {
      return `It's ${new Date().toLocaleTimeString()}`;
    } else if (lowerCommand.includes('weather')) {
      return "I'd check the weather for you, but I don't have access to weather data right now.";
    } else if (lowerCommand.includes('open') || lowerCommand.includes('launch')) {
      return "I can help open apps. Try saying 'open messages' or 'open calendar'.";
    } else if (lowerCommand.includes('help')) {
      return `I'm ${customWakeName}, your digital assistant. I can help with apps, information, and tasks. What would you like to do?`;
    } else {
      return "I'm still learning that command. Try asking about time, weather, or opening apps.";
    }
  };

  const executeVoiceActions = (actions) => {
    actions.forEach(action => {
      if (action.action === 'open_app' && action.app_name) {
        if (onVoiceCommand) {
          onVoiceCommand(`open ${action.app_name}`, { action: 'open_app', app: action.app_name });
        }
      }
    });
  };

  const handleDuressDetected = async (transcript) => {
    console.log('DURESS PHRASE DETECTED:', transcript);
    
    try {
      // Send silent duress alert to backend
      await axios.post(`${API}/emergency/duress`, {
        phrase: transcript,
        timestamp: new Date().toISOString(),
        location: 'voice_interface'
      });

      if (onDuressDetected) {
        onDuressDetected(transcript);
      }

      // Continue normal operation - DO NOT alert the user that duress was detected
      // This is critical for safety - the duress must be silent
      
    } catch (error) {
      console.error('Duress alert failed:', error);
    }
  };

  const speak = (text) => {
    if (synthRef.current && ownerMode) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 0.7;
      
      // Use a pleasant voice if available
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Karen') || 
        voice.name.includes('Samantha') || 
        voice.name.includes('Female')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      synthRef.current.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startAmbientListening();
    }
  };

  return (
    <div className="voice-interface">
      {/* Voice Status Indicator */}
      <div className={`
        fixed top-4 right-4 z-50 p-3 rounded-full transition-all duration-300
        ${isListening ? 
          wakeWordDetected ? 'bg-green-500 animate-pulse' : 'bg-blue-500' 
          : 'bg-slate-700'
        }
      `}>
        <div className="text-white text-center">
          {isListening ? (
            wakeWordDetected ? (
              <div>
                <div className="text-xl">🎙️</div>
                <div className="text-xs">Listening</div>
              </div>
            ) : (
              <div>
                <div className="text-xl">👂</div>
                <div className="text-xs">Wake Word</div>
              </div>
            )
          ) : (
            <div>
              <div className="text-xl">🔇</div>
              <div className="text-xs">Silent</div>
            </div>
          )}
        </div>
      </div>

      {/* Voice Command Display */}
      {(voiceCommand || voiceResponse) && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-lg">
            {voiceCommand && (
              <div className="mb-2">
                <div className="text-xs text-slate-400">You said:</div>
                <div className="text-sm text-white">{voiceCommand}</div>
              </div>
            )}
            
            {voiceResponse && (
              <div>
                <div className="text-xs text-slate-400">{customWakeName} responds:</div>
                <div className="text-sm text-blue-300">{voiceResponse}</div>
              </div>
            )}

            {isProcessing && (
              <div className="text-center text-blue-400">
                <div className="animate-spin text-lg">🧠</div>
                <div className="text-xs">Processing...</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voice Controls (Owner Mode Only) */}
      {ownerMode && (
        <div className="fixed bottom-20 right-4 z-40">
          <button
            onClick={toggleListening}
            className={`
              p-3 rounded-full shadow-lg transition-all
              ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
            `}
          >
            <div className="text-white text-center">
              <div className="text-xl">{isListening ? '🛑' : '🎤'}</div>
              <div className="text-xs">{isListening ? 'Stop' : 'Voice'}</div>
            </div>
          </button>
        </div>
      )}

      {/* Training Mode (for setup) */}
      <div className="hidden">
        <div>Wake word: "Hey {customWakeName}"</div>
        <div>Duress phrase: "{duressPhrase}"</div>
      </div>
    </div>
  );
};

export default VoiceInterface;
import React from 'react';

// =============================================
// DIGITAL ELECTRONIC ICONS
// All icons are circuit-board / electronic style
// =============================================

// DIGITAL BRAIN - Circuit board neural network
export const DigitalBrain = ({ size = 80, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      <filter id="brainGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    
    {/* Brain outline - circuit style */}
    <path
      d="M50 10 
         C30 10 15 25 15 40 
         C15 50 20 55 20 60 
         C20 70 15 75 15 80 
         C15 90 25 95 35 95 
         L40 95 L40 90 L45 90 L45 95 
         L55 95 L55 90 L60 90 L60 95 
         L65 95 
         C75 95 85 90 85 80 
         C85 75 80 70 80 60 
         C80 55 85 50 85 40 
         C85 25 70 10 50 10"
      fill="none"
      stroke="url(#brainGrad)"
      strokeWidth="2"
      filter="url(#brainGlow)"
    />
    
    {/* Circuit traces inside brain */}
    <g stroke="#22d3ee" strokeWidth="1.5" fill="none" opacity="0.8">
      {/* Left hemisphere circuits */}
      <path d="M25 35 L35 35 L35 45 L30 45 L30 55"/>
      <path d="M30 45 L40 45 L40 35 L45 35"/>
      <path d="M25 55 L35 55 L35 65 L25 65"/>
      <path d="M35 55 L35 70 L40 70"/>
      
      {/* Right hemisphere circuits */}
      <path d="M55 35 L65 35 L65 45 L70 45"/>
      <path d="M60 45 L60 55 L70 55 L70 65 L75 65"/>
      <path d="M65 55 L65 70 L60 70 L60 75"/>
      <path d="M55 65 L55 75 L65 75"/>
      
      {/* Center connections */}
      <path d="M45 40 L55 40"/>
      <path d="M45 50 L55 50"/>
      <path d="M45 60 L55 60"/>
      <path d="M48 70 L52 70"/>
    </g>
    
    {/* Circuit nodes */}
    <g fill="#22d3ee">
      <circle cx="25" cy="35" r="3" className="animate-pulse"/>
      <circle cx="35" cy="45" r="2"/>
      <circle cx="30" cy="55" r="3" className="animate-pulse" style={{animationDelay: '0.3s'}}/>
      <circle cx="40" cy="70" r="2"/>
      <circle cx="75" cy="35" r="3" className="animate-pulse" style={{animationDelay: '0.6s'}}/>
      <circle cx="70" cy="45" r="2"/>
      <circle cx="70" cy="65" r="3" className="animate-pulse" style={{animationDelay: '0.9s'}}/>
      <circle cx="65" cy="75" r="2"/>
      <circle cx="50" cy="40" r="2"/>
      <circle cx="50" cy="50" r="3" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
      <circle cx="50" cy="60" r="2"/>
    </g>
    
    {/* Data flow particles */}
    <circle cx="30" cy="40" r="1" fill="#67e8f9" className="animate-ping" style={{animationDuration: '2s'}}/>
    <circle cx="70" cy="55" r="1" fill="#67e8f9" className="animate-ping" style={{animationDuration: '2s', animationDelay: '1s'}}/>
  </svg>
);

// DIGITAL LOCK - Cyber security padlock
export const DigitalLock = ({ size = 80, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="lockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <filter id="lockGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    
    {/* Lock shackle - circuit style */}
    <path
      d="M30 45 L30 30 C30 15 40 10 50 10 C60 10 70 15 70 30 L70 45"
      fill="none"
      stroke="url(#lockGrad)"
      strokeWidth="4"
      strokeLinecap="round"
      filter="url(#lockGlow)"
    />
    
    {/* Lock body - circuit board */}
    <rect x="20" y="45" width="60" height="45" rx="5" fill="#1a1a2e" stroke="url(#lockGrad)" strokeWidth="2" filter="url(#lockGlow)"/>
    
    {/* Circuit pattern on lock body */}
    <g stroke="#a855f7" strokeWidth="1" fill="none" opacity="0.6">
      <path d="M25 55 L35 55 L35 65 L45 65"/>
      <path d="M55 55 L65 55 L65 65"/>
      <path d="M25 75 L40 75 L40 85"/>
      <path d="M60 75 L75 75"/>
      <path d="M55 65 L55 80 L65 80"/>
    </g>
    
    {/* Keyhole - digital scanner */}
    <circle cx="50" cy="62" r="8" fill="#0f0f1a" stroke="#a855f7" strokeWidth="2"/>
    <circle cx="50" cy="62" r="4" fill="#a855f7" className="animate-pulse"/>
    <rect x="48" y="68" width="4" height="12" fill="#a855f7"/>
    
    {/* Circuit nodes */}
    <g fill="#a855f7">
      <circle cx="35" cy="55" r="2"/>
      <circle cx="45" cy="65" r="2" className="animate-pulse"/>
      <circle cx="65" cy="55" r="2"/>
      <circle cx="40" cy="75" r="2" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
    </g>
    
    {/* Security scan line */}
    <rect x="22" y="50" width="56" height="2" fill="#a855f7" opacity="0.3" className="animate-pulse"/>
  </svg>
);

// DIGITAL MASK - Deception/stealth icon
export const DigitalMask = ({ size = 80, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="maskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#db2777" />
      </linearGradient>
      <filter id="maskGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    
    {/* Mask outline */}
    <path
      d="M15 35 
         C15 25 25 15 50 15 
         C75 15 85 25 85 35 
         L85 55 
         C85 70 70 85 50 85 
         C30 85 15 70 15 55 Z"
      fill="#1a1a2e"
      stroke="url(#maskGrad)"
      strokeWidth="2"
      filter="url(#maskGlow)"
    />
    
    {/* Eye holes - digital scanners */}
    <ellipse cx="35" cy="45" rx="12" ry="8" fill="#0f0f1a" stroke="#ec4899" strokeWidth="1.5"/>
    <ellipse cx="65" cy="45" rx="12" ry="8" fill="#0f0f1a" stroke="#ec4899" strokeWidth="1.5"/>
    
    {/* Eye scanner effects */}
    <ellipse cx="35" cy="45" rx="6" ry="4" fill="#ec4899" opacity="0.5" className="animate-pulse"/>
    <ellipse cx="65" cy="45" rx="6" ry="4" fill="#ec4899" opacity="0.5" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
    
    {/* Circuit traces on mask */}
    <g stroke="#ec4899" strokeWidth="1" fill="none" opacity="0.6">
      <path d="M20 30 L30 30 L30 35"/>
      <path d="M70 30 L80 30"/>
      <path d="M25 60 L35 60 L35 70 L45 70"/>
      <path d="M55 70 L65 70 L65 60 L75 60"/>
      <path d="M45 55 L50 55 L50 65 L55 65"/>
    </g>
    
    {/* Circuit nodes */}
    <g fill="#ec4899">
      <circle cx="30" cy="30" r="2" className="animate-pulse"/>
      <circle cx="80" cy="30" r="2"/>
      <circle cx="35" cy="60" r="2" className="animate-pulse" style={{animationDelay: '0.3s'}}/>
      <circle cx="65" cy="60" r="2"/>
      <circle cx="50" cy="55" r="2" className="animate-pulse" style={{animationDelay: '0.6s'}}/>
    </g>
  </svg>
);

// DIGITAL CROWN - Owner/authority icon
export const DigitalCrown = ({ size = 80, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      <filter id="crownGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    
    {/* Crown shape */}
    <path
      d="M10 70 L10 40 L25 55 L40 25 L50 45 L60 25 L75 55 L90 40 L90 70 Z"
      fill="#1a1a2e"
      stroke="url(#crownGrad)"
      strokeWidth="2"
      filter="url(#crownGlow)"
    />
    
    {/* Crown base */}
    <rect x="10" y="70" width="80" height="15" rx="3" fill="#1a1a2e" stroke="url(#crownGrad)" strokeWidth="2"/>
    
    {/* Circuit traces */}
    <g stroke="#22d3ee" strokeWidth="1" fill="none" opacity="0.6">
      <path d="M20 60 L30 60 L30 50"/>
      <path d="M70 60 L80 60"/>
      <path d="M45 55 L55 55"/>
      <path d="M25 75 L40 75"/>
      <path d="M60 75 L75 75"/>
    </g>
    
    {/* Crown jewels - LED nodes */}
    <circle cx="40" cy="30" r="5" fill="#22d3ee" className="animate-pulse" filter="url(#crownGlow)"/>
    <circle cx="50" cy="48" r="4" fill="#06b6d4" className="animate-pulse" style={{animationDelay: '0.3s'}}/>
    <circle cx="60" cy="30" r="5" fill="#22d3ee" className="animate-pulse" style={{animationDelay: '0.6s'}} filter="url(#crownGlow)"/>
    
    {/* Small circuit nodes */}
    <g fill="#22d3ee">
      <circle cx="25" cy="55" r="2"/>
      <circle cx="75" cy="55" r="2"/>
      <circle cx="30" cy="60" r="2" className="animate-pulse" style={{animationDelay: '0.4s'}}/>
      <circle cx="70" cy="60" r="2"/>
    </g>
  </svg>
);

// DIGITAL TARGET - Manager/coordinator icon
export const DigitalTarget = ({ size = 80, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="targetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
      <filter id="targetGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    
    {/* Outer ring */}
    <circle cx="50" cy="50" r="40" fill="none" stroke="url(#targetGrad)" strokeWidth="2" filter="url(#targetGlow)"/>
    
    {/* Middle ring */}
    <circle cx="50" cy="50" r="28" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.7"/>
    
    {/* Inner ring */}
    <circle cx="50" cy="50" r="16" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.5"/>
    
    {/* Center dot */}
    <circle cx="50" cy="50" r="6" fill="#3b82f6" className="animate-pulse" filter="url(#targetGlow)"/>
    
    {/* Crosshair lines */}
    <g stroke="#3b82f6" strokeWidth="1.5" opacity="0.8">
      <path d="M50 5 L50 20"/>
      <path d="M50 80 L50 95"/>
      <path d="M5 50 L20 50"/>
      <path d="M80 50 L95 50"/>
    </g>
    
    {/* Circuit traces */}
    <g stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.5">
      <path d="M25 25 L35 35"/>
      <path d="M75 25 L65 35"/>
      <path d="M25 75 L35 65"/>
      <path d="M75 75 L65 65"/>
    </g>
    
    {/* Corner nodes */}
    <g fill="#3b82f6">
      <circle cx="50" cy="10" r="3" className="animate-pulse"/>
      <circle cx="50" cy="90" r="3" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
      <circle cx="10" cy="50" r="3" className="animate-pulse" style={{animationDelay: '0.25s'}}/>
      <circle cx="90" cy="50" r="3" className="animate-pulse" style={{animationDelay: '0.75s'}}/>
    </g>
  </svg>
);

// DIGITAL GEAR - Worker/processor icon
export const DigitalGear = ({ size = 80, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <filter id="gearGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    
    {/* Gear teeth */}
    <path
      d="M50 5 L55 5 L57 15 L62 17 L70 10 L75 15 L68 23 L70 28 L80 30 L80 35 L70 37 L68 42 L75 50 L70 55 L62 48 L57 50 L55 60 L50 60 L48 50 L43 48 L35 55 L30 50 L37 42 L35 37 L25 35 L25 30 L35 28 L37 23 L30 15 L35 10 L43 17 L48 15 L50 5"
      fill="#1a1a2e"
      stroke="url(#gearGrad)"
      strokeWidth="2"
      filter="url(#gearGlow)"
      transform="translate(0, 17.5)"
    />
    
    {/* Inner circle */}
    <circle cx="50" cy="50" r="15" fill="#0f0f1a" stroke="#8b5cf6" strokeWidth="2"/>
    
    {/* Center processor */}
    <rect x="42" y="42" width="16" height="16" fill="#1a1a2e" stroke="#8b5cf6" strokeWidth="1"/>
    
    {/* Processor pins */}
    <g stroke="#8b5cf6" strokeWidth="1">
      <path d="M45 42 L45 38"/>
      <path d="M50 42 L50 38"/>
      <path d="M55 42 L55 38"/>
      <path d="M45 58 L45 62"/>
      <path d="M50 58 L50 62"/>
      <path d="M55 58 L55 62"/>
      <path d="M42 45 L38 45"/>
      <path d="M42 50 L38 50"/>
      <path d="M42 55 L38 55"/>
      <path d="M58 45 L62 45"/>
      <path d="M58 50 L62 50"/>
      <path d="M58 55 L62 55"/>
    </g>
    
    {/* Center LED */}
    <circle cx="50" cy="50" r="4" fill="#8b5cf6" className="animate-pulse" filter="url(#gearGlow)"/>
  </svg>
);

// DIGITAL CHIP - Specialist/AI icon
export const DigitalChip = ({ size = 80, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <filter id="chipGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    
    {/* Chip body */}
    <rect x="20" y="20" width="60" height="60" rx="5" fill="#1a1a2e" stroke="url(#chipGrad)" strokeWidth="2" filter="url(#chipGlow)"/>
    
    {/* Chip pins - top */}
    <g stroke="#f472b6" strokeWidth="2">
      <path d="M30 20 L30 10"/>
      <path d="M42 20 L42 10"/>
      <path d="M54 20 L54 10"/>
      <path d="M66 20 L66 10"/>
    </g>
    
    {/* Chip pins - bottom */}
    <g stroke="#f472b6" strokeWidth="2">
      <path d="M30 80 L30 90"/>
      <path d="M42 80 L42 90"/>
      <path d="M54 80 L54 90"/>
      <path d="M66 80 L66 90"/>
    </g>
    
    {/* Chip pins - left */}
    <g stroke="#f472b6" strokeWidth="2">
      <path d="M20 32 L10 32"/>
      <path d="M20 44 L10 44"/>
      <path d="M20 56 L10 56"/>
      <path d="M20 68 L10 68"/>
    </g>
    
    {/* Chip pins - right */}
    <g stroke="#f472b6" strokeWidth="2">
      <path d="M80 32 L90 32"/>
      <path d="M80 44 L90 44"/>
      <path d="M80 56 L90 56"/>
      <path d="M80 68 L90 68"/>
    </g>
    
    {/* Internal circuits */}
    <g stroke="#f472b6" strokeWidth="1" fill="none" opacity="0.5">
      <rect x="30" y="30" width="40" height="40" rx="3"/>
      <path d="M35 40 L45 40 L45 50 L55 50"/>
      <path d="M55 40 L55 60 L65 60"/>
      <path d="M35 60 L45 60"/>
    </g>
    
    {/* Center core */}
    <circle cx="50" cy="50" r="8" fill="#0f0f1a" stroke="#f472b6" strokeWidth="1"/>
    <circle cx="50" cy="50" r="4" fill="#f472b6" className="animate-pulse" filter="url(#chipGlow)"/>
    
    {/* Pin end nodes */}
    <g fill="#f472b6">
      <circle cx="30" cy="10" r="2"/>
      <circle cx="42" cy="10" r="2"/>
      <circle cx="54" cy="10" r="2"/>
      <circle cx="66" cy="10" r="2"/>
    </g>
  </svg>
);

// DIGITAL SHIELD - Security icon
export const DigitalShield = ({ size = 80, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="shieldIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
      <filter id="shieldIconGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    
    {/* Shield shape */}
    <path
      d="M50 5 L90 20 L90 50 C90 75 70 90 50 98 C30 90 10 75 10 50 L10 20 Z"
      fill="#1a1a2e"
      stroke="url(#shieldIconGrad)"
      strokeWidth="3"
      filter="url(#shieldIconGlow)"
    />
    
    {/* Circuit pattern */}
    <g stroke="#22d3ee" strokeWidth="1" fill="none" opacity="0.5">
      <path d="M30 30 L40 30 L40 40 L50 40"/>
      <path d="M60 30 L70 30"/>
      <path d="M30 50 L40 50 L40 60"/>
      <path d="M60 50 L70 50 L70 60"/>
      <path d="M45 65 L55 65 L55 75"/>
    </g>
    
    {/* Checkmark - digital style */}
    <path
      d="M35 50 L45 60 L65 35"
      fill="none"
      stroke="url(#shieldIconGrad)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#shieldIconGlow)"
    />
    
    {/* Circuit nodes */}
    <g fill="#22d3ee">
      <circle cx="40" cy="30" r="2" className="animate-pulse"/>
      <circle cx="70" cy="30" r="2"/>
      <circle cx="40" cy="50" r="2" className="animate-pulse" style={{animationDelay: '0.3s'}}/>
      <circle cx="70" cy="50" r="2"/>
      <circle cx="55" cy="75" r="2" className="animate-pulse" style={{animationDelay: '0.6s'}}/>
    </g>
  </svg>
);

// DIGITAL WAVE - Voice/sound icon
export const DigitalWave = ({ size = 80, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
      <filter id="waveGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    
    {/* Sound wave bars */}
    <g filter="url(#waveGlow)">
      <rect x="10" y="40" width="8" height="20" rx="4" fill="url(#waveGrad)" className="animate-pulse"/>
      <rect x="24" y="30" width="8" height="40" rx="4" fill="url(#waveGrad)" className="animate-pulse" style={{animationDelay: '0.1s'}}/>
      <rect x="38" y="20" width="8" height="60" rx="4" fill="url(#waveGrad)" className="animate-pulse" style={{animationDelay: '0.2s'}}/>
      <rect x="52" y="15" width="8" height="70" rx="4" fill="url(#waveGrad)" className="animate-pulse" style={{animationDelay: '0.3s'}}/>
      <rect x="66" y="25" width="8" height="50" rx="4" fill="url(#waveGrad)" className="animate-pulse" style={{animationDelay: '0.4s'}}/>
      <rect x="80" y="35" width="8" height="30" rx="4" fill="url(#waveGrad)" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
    </g>
    
    {/* Connection lines */}
    <g stroke="#3b82f6" strokeWidth="1" opacity="0.3">
      <path d="M14 35 L28 25"/>
      <path d="M28 25 L42 15"/>
      <path d="M56 10 L70 20"/>
      <path d="M70 20 L84 30"/>
    </g>
  </svg>
);

export default {
  DigitalBrain,
  DigitalLock,
  DigitalMask,
  DigitalCrown,
  DigitalTarget,
  DigitalGear,
  DigitalChip,
  DigitalShield,
  DigitalWave
};

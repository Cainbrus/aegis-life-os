import React from 'react';

// Aegis Digital Mate Logo Component
// Shield with digital arm shaking human hand
// "Digital" above, "Mate" below
// Border text: "Better be safe than sorry"

const AegisLogo = ({ size = 200, showText = true, className = "" }) => {
  const scale = size / 200;
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {showText && (
        <div className="text-cyan-400 font-bold text-xl tracking-widest mb-2 font-mono animate-pulse">
          DIGITAL
        </div>
      )}
      
      <svg 
        width={size} 
        height={size * 1.1} 
        viewBox="0 0 200 220" 
        className="drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
      >
        {/* Definitions for gradients and filters */}
        <defs>
          {/* Shield gradient */}
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          
          {/* Shield border gradient */}
          <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          
          {/* Digital arm gradient */}
          <linearGradient id="digitalArmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          
          {/* Human arm gradient */}
          <linearGradient id="humanArmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Circuit pattern */}
          <pattern id="circuitPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M0 10 L10 10 M10 0 L10 10 M10 10 L20 10" stroke="#06b6d4" strokeWidth="0.5" fill="none" opacity="0.3"/>
            <circle cx="10" cy="10" r="1" fill="#06b6d4" opacity="0.5"/>
          </pattern>
        </defs>
        
        {/* Shield shape - outer glow */}
        <path
          d="M100 10 L180 40 L180 100 C180 150 140 190 100 210 C60 190 20 150 20 100 L20 40 Z"
          fill="none"
          stroke="url(#borderGradient)"
          strokeWidth="4"
          filter="url(#glow)"
          className="animate-pulse"
        />
        
        {/* Shield background */}
        <path
          d="M100 15 L175 43 L175 100 C175 147 137 185 100 204 C63 185 25 147 25 100 L25 43 Z"
          fill="url(#shieldGradient)"
        />
        
        {/* Circuit pattern overlay */}
        <path
          d="M100 15 L175 43 L175 100 C175 147 137 185 100 204 C63 185 25 147 25 100 L25 43 Z"
          fill="url(#circuitPattern)"
          opacity="0.5"
        />
        
        {/* Shield border */}
        <path
          d="M100 15 L175 43 L175 100 C175 147 137 185 100 204 C63 185 25 147 25 100 L25 43 Z"
          fill="none"
          stroke="url(#borderGradient)"
          strokeWidth="3"
        />
        
        {/* Handshake - Digital Arm (left side, coming from shield) */}
        <g filter="url(#glow)">
          {/* Digital forearm */}
          <path
            d="M45 95 L70 100 L75 95 L80 100 L85 95"
            stroke="url(#digitalArmGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Digital hand */}
          <path
            d="M85 95 
               L95 90 L98 85 L95 90
               L100 88 L103 82 L100 88
               L105 90 L108 85 L105 90
               L108 95 L105 100
               L95 105 L85 100"
            fill="url(#digitalArmGradient)"
            stroke="#0ea5e9"
            strokeWidth="1"
          />
          
          {/* Circuit lines on digital arm */}
          <path
            d="M50 95 L55 92 M55 98 L60 95 M65 100 L70 97"
            stroke="#22d3ee"
            strokeWidth="1"
            opacity="0.8"
          />
          
          {/* LED dots on digital arm */}
          <circle cx="52" cy="95" r="2" fill="#22d3ee" className="animate-pulse"/>
          <circle cx="62" cy="97" r="1.5" fill="#22d3ee" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
          <circle cx="72" cy="96" r="1.5" fill="#06b6d4" className="animate-pulse" style={{animationDelay: '1s'}}/>
        </g>
        
        {/* Handshake - Human Arm (right side) */}
        <g>
          {/* Human forearm */}
          <path
            d="M155 95 L130 100 L125 98"
            stroke="url(#humanArmGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Human hand */}
          <path
            d="M125 98
               L115 93 L112 88 L115 93
               L110 90 L107 84 L110 90
               L105 92 L102 87 L105 92
               L103 97 L105 102
               L115 107 L125 103"
            fill="url(#humanArmGradient)"
            stroke="#d97706"
            strokeWidth="1"
          />
        </g>
        
        {/* Connection spark/energy at handshake point */}
        <g filter="url(#glow)">
          <circle cx="105" cy="95" r="8" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.5" className="animate-ping"/>
          <circle cx="105" cy="95" r="4" fill="#22d3ee" opacity="0.8"/>
          
          {/* Energy lines */}
          <path d="M105 87 L105 83" stroke="#22d3ee" strokeWidth="1" opacity="0.6"/>
          <path d="M105 103 L105 107" stroke="#22d3ee" strokeWidth="1" opacity="0.6"/>
          <path d="M97 95 L93 95" stroke="#22d3ee" strokeWidth="1" opacity="0.6"/>
          <path d="M113 95 L117 95" stroke="#22d3ee" strokeWidth="1" opacity="0.6"/>
        </g>
        
        {/* Border text - "BETTER BE SAFE THAN SORRY" curved along shield edge */}
        <defs>
          <path id="topTextPath" d="M35 55 Q100 25 165 55" fill="none"/>
          <path id="bottomTextPath" d="M40 170 Q100 200 160 170" fill="none"/>
        </defs>
        
        <text fontSize="8" fill="#94a3b8" fontFamily="monospace" letterSpacing="1">
          <textPath href="#topTextPath" startOffset="50%" textAnchor="middle">
            BETTER BE SAFE
          </textPath>
        </text>
        
        <text fontSize="8" fill="#94a3b8" fontFamily="monospace" letterSpacing="1">
          <textPath href="#bottomTextPath" startOffset="50%" textAnchor="middle">
            THAN SORRY
          </textPath>
        </text>
        
        {/* "A" monogram in center top */}
        <text x="100" y="65" textAnchor="middle" fontSize="24" fontWeight="bold" fill="url(#borderGradient)" fontFamily="monospace">
          A
        </text>
        
        {/* Decorative elements */}
        <circle cx="100" cy="140" r="3" fill="#06b6d4" opacity="0.6" className="animate-pulse"/>
        <circle cx="60" cy="120" r="2" fill="#8b5cf6" opacity="0.4" className="animate-pulse" style={{animationDelay: '0.3s'}}/>
        <circle cx="140" cy="120" r="2" fill="#8b5cf6" opacity="0.4" className="animate-pulse" style={{animationDelay: '0.6s'}}/>
      </svg>
      
      {showText && (
        <div className="text-cyan-400 font-bold text-xl tracking-widest mt-2 font-mono animate-pulse">
          MATE
        </div>
      )}
    </div>
  );
};

// Compact logo for header
export const AegisLogoCompact = ({ size = 50 }) => (
  <div className="flex items-center space-x-2">
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 50 55" 
      className="drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
    >
      <defs>
        <linearGradient id="compactShieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
        <linearGradient id="compactBorderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      
      {/* Shield */}
      <path
        d="M25 3 L45 12 L45 28 C45 40 35 48 25 53 C15 48 5 40 5 28 L5 12 Z"
        fill="url(#compactShieldGradient)"
        stroke="url(#compactBorderGradient)"
        strokeWidth="2"
      />
      
      {/* Handshake icon simplified */}
      <path
        d="M15 28 L22 26 L25 28 L28 26 L35 28"
        stroke="#06b6d4"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="25" cy="28" r="3" fill="#22d3ee" opacity="0.8"/>
      
      {/* A letter */}
      <text x="25" y="20" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#06b6d4" fontFamily="monospace">
        A
      </text>
    </svg>
    
    <div className="flex flex-col">
      <span className="text-cyan-400 font-bold text-xs tracking-wider">DIGITAL</span>
      <span className="text-cyan-300 font-bold text-lg tracking-widest leading-none">MATE</span>
    </div>
  </div>
);

export default AegisLogo;

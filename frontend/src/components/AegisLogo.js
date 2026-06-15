import React from 'react';

// AEGIS DIGITAL MATE - BOLD 3D SHIELD LOGO
// Dramatic, electronic, "in your face" design

const AegisLogo = ({ size = 200, showText = true, className = "" }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {showText && (
        <div className="relative mb-4">
          <div className="text-3xl font-black tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 animate-pulse drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
            DIGITAL
          </div>
          <div className="absolute inset-0 text-3xl font-black tracking-[0.3em] text-blue-400 blur-sm opacity-50">
            DIGITAL
          </div>
        </div>
      )}
      
      <div className="relative" style={{ width: size, height: size * 1.2 }}>
        {/* Outer glow effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-500 to-purple-500 blur-3xl opacity-30 animate-pulse"></div>
        
        <svg 
          width={size} 
          height={size * 1.2} 
          viewBox="0 0 200 240" 
          className="relative z-10 drop-shadow-[0_0_30px_rgba(6,182,212,0.6)]"
        >
          <defs>
            {/* 3D Shield gradient - dark metallic */}
            <linearGradient id="shield3DMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a1a2e" />
              <stop offset="25%" stopColor="#16213e" />
              <stop offset="50%" stopColor="#0f3460" />
              <stop offset="75%" stopColor="#16213e" />
              <stop offset="100%" stopColor="#1a1a2e" />
            </linearGradient>
            
            {/* Metallic edge highlight */}
            <linearGradient id="shieldEdge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="30%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="70%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            
            {/* Neon cyan glow */}
            <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
            
            {/* Electric purple */}
            <linearGradient id="electricPurple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            
            {/* Digital arm - metallic chrome */}
            <linearGradient id="digitalArmChrome" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="25%" stopColor="#67e8f9" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="75%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
            
            {/* Human hand - warm tones */}
            <linearGradient id="humanHandWarm" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            
            {/* Intense glow filter */}
            <filter id="intenseGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur1"/>
              <feGaussianBlur stdDeviation="8" result="blur2"/>
              <feMerge>
                <feMergeNode in="blur2"/>
                <feMergeNode in="blur1"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Circuit board pattern */}
            <pattern id="circuitBold" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <rect width="30" height="30" fill="transparent"/>
              <path d="M0 15 L15 15 L15 0 M15 15 L15 30 M15 15 L30 15" stroke="#06b6d4" strokeWidth="0.8" fill="none" opacity="0.4"/>
              <circle cx="15" cy="15" r="2" fill="#22d3ee" opacity="0.6"/>
              <circle cx="0" cy="15" r="1" fill="#06b6d4" opacity="0.4"/>
              <circle cx="30" cy="15" r="1" fill="#06b6d4" opacity="0.4"/>
              <circle cx="15" cy="0" r="1" fill="#06b6d4" opacity="0.4"/>
              <circle cx="15" cy="30" r="1" fill="#06b6d4" opacity="0.4"/>
            </pattern>
            
            {/* Scan line effect */}
            <pattern id="scanLines" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="2" fill="rgba(6, 182, 212, 0.1)"/>
            </pattern>
          </defs>
          
          {/* OUTER SHIELD SHADOW (3D depth) */}
          <path
            d="M100 15 L180 50 L180 115 C180 170 140 210 100 230 C60 210 20 170 20 115 L20 50 Z"
            fill="#000"
            opacity="0.5"
            transform="translate(5, 5)"
          />
          
          {/* SHIELD BACK LAYER (3D effect) */}
          <path
            d="M100 15 L180 50 L180 115 C180 170 140 210 100 230 C60 210 20 170 20 115 L20 50 Z"
            fill="#0a0a1a"
            stroke="#1e3a5f"
            strokeWidth="2"
          />
          
          {/* MAIN SHIELD BODY */}
          <path
            d="M100 20 L175 52 L175 113 C175 165 137 203 100 222 C63 203 25 165 25 113 L25 52 Z"
            fill="url(#shield3DMain)"
          />
          
          {/* Circuit pattern overlay */}
          <path
            d="M100 20 L175 52 L175 113 C175 165 137 203 100 222 C63 203 25 165 25 113 L25 52 Z"
            fill="url(#circuitBold)"
          />
          
          {/* Scan lines overlay */}
          <path
            d="M100 20 L175 52 L175 113 C175 165 137 203 100 222 C63 203 25 165 25 113 L25 52 Z"
            fill="url(#scanLines)"
          />
          
          {/* SHIELD EDGE - NEON BORDER */}
          <path
            d="M100 20 L175 52 L175 113 C175 165 137 203 100 222 C63 203 25 165 25 113 L25 52 Z"
            fill="none"
            stroke="url(#shieldEdge)"
            strokeWidth="4"
            filter="url(#intenseGlow)"
          />
          
          {/* Inner edge highlight */}
          <path
            d="M100 28 L168 56 L168 112 C168 158 134 193 100 210 C66 193 32 158 32 112 L32 56 Z"
            fill="none"
            stroke="rgba(6, 182, 212, 0.3)"
            strokeWidth="1"
          />
          
          {/* "BETTER BE SAFE" - Top arc text */}
          <defs>
            <path id="topArc" d="M40 65 Q100 30 160 65" fill="none"/>
            <path id="bottomArc" d="M45 185 Q100 215 155 185" fill="none"/>
          </defs>
          
          <text fontSize="9" fontWeight="bold" fill="#94a3b8" fontFamily="monospace" letterSpacing="2" filter="url(#intenseGlow)">
            <textPath href="#topArc" startOffset="50%" textAnchor="middle">
              BETTER BE SAFE
            </textPath>
          </text>
          
          <text fontSize="9" fontWeight="bold" fill="#94a3b8" fontFamily="monospace" letterSpacing="2" filter="url(#intenseGlow)">
            <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">
              THAN SORRY
            </textPath>
          </text>
          
          {/* CENTER "A" MONOGRAM - BOLD */}
          <text x="100" y="75" textAnchor="middle" fontSize="32" fontWeight="900" fill="url(#neonCyan)" fontFamily="monospace" filter="url(#intenseGlow)">
            A
          </text>
          
          {/* HANDSHAKE SECTION - More detailed and bold */}
          <g transform="translate(0, 15)">
            {/* Energy field behind handshake */}
            <ellipse cx="100" cy="115" rx="45" ry="25" fill="rgba(6, 182, 212, 0.1)" filter="url(#intenseGlow)"/>
            
            {/* DIGITAL ARM - Left side (chrome/metallic) */}
            <g filter="url(#intenseGlow)">
              {/* Arm base */}
              <path
                d="M35 115 L55 112 L65 115 L75 112 L85 115"
                stroke="url(#digitalArmChrome)"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
              />
              
              {/* Mechanical segments */}
              <rect x="40" y="108" width="8" height="14" rx="2" fill="#0f172a" stroke="#22d3ee" strokeWidth="1"/>
              <rect x="52" y="108" width="8" height="14" rx="2" fill="#0f172a" stroke="#22d3ee" strokeWidth="1"/>
              <rect x="64" y="108" width="8" height="14" rx="2" fill="#0f172a" stroke="#22d3ee" strokeWidth="1"/>
              
              {/* LED indicators */}
              <circle cx="44" cy="115" r="2" fill="#22d3ee" className="animate-pulse"/>
              <circle cx="56" cy="115" r="2" fill="#06b6d4" className="animate-pulse" style={{animationDelay: '0.3s'}}/>
              <circle cx="68" cy="115" r="2" fill="#22d3ee" className="animate-pulse" style={{animationDelay: '0.6s'}}/>
              
              {/* Digital hand */}
              <path
                d="M85 115 
                   L95 108 L98 100 L96 108
                   L100 106 L103 98 L101 106
                   L105 108 L108 102 L106 108
                   L110 115 L106 122
                   L95 125 L85 120"
                fill="url(#digitalArmChrome)"
                stroke="#67e8f9"
                strokeWidth="1.5"
              />
            </g>
            
            {/* HUMAN ARM - Right side (warm tones) */}
            <g>
              {/* Arm base */}
              <path
                d="M165 115 L145 112 L135 115 L125 112 L115 115"
                stroke="url(#humanHandWarm)"
                strokeWidth="14"
                strokeLinecap="round"
                fill="none"
              />
              
              {/* Human hand */}
              <path
                d="M115 115
                   L105 108 L102 100 L104 108
                   L100 106 L97 98 L99 106
                   L95 108 L92 102 L94 108
                   L90 115 L94 122
                   L105 125 L115 120"
                fill="url(#humanHandWarm)"
                stroke="#fcd34d"
                strokeWidth="1.5"
              />
            </g>
            
            {/* CONNECTION POINT - Energy burst */}
            <g filter="url(#intenseGlow)">
              {/* Outer rings */}
              <circle cx="100" cy="115" r="20" fill="none" stroke="#22d3ee" strokeWidth="0.5" opacity="0.3" className="animate-ping"/>
              <circle cx="100" cy="115" r="15" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.5"/>
              <circle cx="100" cy="115" r="10" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.7"/>
              
              {/* Core energy */}
              <circle cx="100" cy="115" r="6" fill="#22d3ee" opacity="0.9"/>
              <circle cx="100" cy="115" r="3" fill="#ffffff"/>
              
              {/* Energy sparks */}
              <path d="M100 100 L100 95 M100 130 L100 135" stroke="#22d3ee" strokeWidth="2" opacity="0.8"/>
              <path d="M85 115 L80 115 M115 115 L120 115" stroke="#22d3ee" strokeWidth="2" opacity="0.8"/>
              <path d="M88 103 L83 98 M112 127 L117 132" stroke="#22d3ee" strokeWidth="1.5" opacity="0.6"/>
              <path d="M112 103 L117 98 M88 127 L83 132" stroke="#22d3ee" strokeWidth="1.5" opacity="0.6"/>
            </g>
          </g>
          
          {/* Decorative corner accents */}
          <g opacity="0.8">
            <path d="M30 70 L30 60 L40 60" stroke="#06b6d4" strokeWidth="2" fill="none"/>
            <path d="M170 70 L170 60 L160 60" stroke="#8b5cf6" strokeWidth="2" fill="none"/>
            <path d="M50 195 L40 195 L40 185" stroke="#06b6d4" strokeWidth="2" fill="none"/>
            <path d="M150 195 L160 195 L160 185" stroke="#8b5cf6" strokeWidth="2" fill="none"/>
          </g>
          
          {/* Pulsing dots at corners */}
          <circle cx="30" cy="60" r="3" fill="#22d3ee" className="animate-pulse"/>
          <circle cx="170" cy="60" r="3" fill="#a855f7" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
          <circle cx="40" cy="195" r="3" fill="#22d3ee" className="animate-pulse" style={{animationDelay: '1s'}}/>
          <circle cx="160" cy="195" r="3" fill="#a855f7" className="animate-pulse" style={{animationDelay: '1.5s'}}/>
        </svg>
      </div>
      
      {showText && (
        <div className="relative mt-4">
          <div className="text-4xl font-black tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 animate-pulse drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
            MATE
          </div>
          <div className="absolute inset-0 text-4xl font-black tracking-[0.4em] text-blue-400 blur-sm opacity-50">
            MATE
          </div>
        </div>
      )}
    </div>
  );
};

// COMPACT HEADER LOGO - Bold version
export const AegisLogoCompact = ({ size = 50 }) => (
  <div className="flex items-center space-x-3 group">
    <div className="relative">
      <div className="absolute inset-0 bg-blue-500 blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
      <svg 
        width={size} 
        height={size * 1.1} 
        viewBox="0 0 50 55" 
        className="relative drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
      >
        <defs>
          <linearGradient id="compactGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e3a5f" />
          </linearGradient>
          <linearGradient id="compactEdge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="compactGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Shadow */}
        <path
          d="M25 5 L45 15 L45 30 C45 42 35 50 25 55 C15 50 5 42 5 30 L5 15 Z"
          fill="#000"
          opacity="0.3"
          transform="translate(2, 2)"
        />
        
        {/* Shield body */}
        <path
          d="M25 5 L45 15 L45 30 C45 42 35 50 25 55 C15 50 5 42 5 30 L5 15 Z"
          fill="url(#compactGrad)"
          stroke="url(#compactEdge)"
          strokeWidth="2"
          filter="url(#compactGlow)"
        />
        
        {/* Handshake simplified */}
        <path
          d="M12 30 L20 28 L25 30 L30 28 L38 30"
          stroke="#06b6d4"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          filter="url(#compactGlow)"
        />
        
        {/* Center dot */}
        <circle cx="25" cy="30" r="4" fill="#22d3ee" filter="url(#compactGlow)"/>
        <circle cx="25" cy="30" r="2" fill="#ffffff"/>
        
        {/* A letter */}
        <text x="25" y="22" textAnchor="middle" fontSize="12" fontWeight="900" fill="#22d3ee" fontFamily="monospace" filter="url(#compactGlow)">
          A
        </text>
      </svg>
    </div>
    
    <div className="flex flex-col leading-none">
      <span className="text-blue-400 font-black text-sm tracking-widest drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">DIGITAL</span>
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-black text-2xl tracking-wider drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">MATE</span>
    </div>
  </div>
);

export default AegisLogo;

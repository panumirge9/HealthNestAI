// src/components/Logo.jsx
export default function Logo({ className = "w-10 h-10" }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 32 32" fill="none" className="w-full h-full drop-shadow-sm">
        {/* Soft, premium circular glow behind the heartbeat */}
        <circle cx="16" cy="16" r="14" fill="url(#logo-gradient)" fillOpacity="0.15" />
        
        {/* The Heartbeat Line, now drawn with a thick, gradient-filled stroke */}
        <path 
          d="M6 16h4l3-7 5 14 3-7h5" 
          stroke="url(#logo-gradient)" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10b981" /> {/* Emerald 500 */}
            <stop offset="1" stopColor="#047857" /> {/* Emerald 700 */}
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
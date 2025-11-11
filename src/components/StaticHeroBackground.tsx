/**
 * Static optimized hero background
 * Replaces CircuitBackground with CSS-only solution
 * Zero JavaScript overhead
 */

export const StaticHeroBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      {/* Simple gradient orbs - CSS only, no blur for performance */}
      <div 
        className="absolute top-20 -right-20 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(99,102,241,0) 70%)',
          animation: 'pulse 8s ease-in-out infinite'
        }}
      />
      <div 
        className="absolute bottom-20 -left-20 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(129,140,248,0.3) 0%, rgba(129,140,248,0) 70%)',
          animation: 'pulse 10s ease-in-out infinite',
          animationDelay: '2s'
        }}
      />
      
      {/* Simple geometric lines - SVG but static, no animations */}
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M -50,100 Q 150,80 250,120 T 500,100" 
          stroke="rgba(129,140,248,0.4)" 
          strokeWidth="1.5" 
          fill="none" 
          strokeLinecap="round"
        />
        <path 
          d="M -50,45% Q 200,calc(45% - 40px) 400,45% T 700,calc(45% + 20px)" 
          stroke="rgba(167,139,250,0.4)" 
          strokeWidth="1.5" 
          fill="none" 
          strokeLinecap="round"
        />
        <circle cx="250" cy="120" r="3" fill="rgba(199,210,254,0.6)" />
        <circle cx="400" cy="45%" r="3" fill="rgba(221,214,254,0.6)" />
      </svg>
    </div>
  );
};

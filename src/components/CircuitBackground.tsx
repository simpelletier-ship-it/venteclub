export const CircuitBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Gradient pour les impulsions lumineuses */}
          <linearGradient id="pulse1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0">
              <animate attributeName="offset" values="0;1;0" dur="4s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#818cf8" stopOpacity="1">
              <animate attributeName="offset" values="0.5;1.5;0.5" dur="4s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0">
              <animate attributeName="offset" values="1;2;1" dur="4s" repeatCount="indefinite" />
            </stop>
          </linearGradient>

          <linearGradient id="pulse2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0">
              <animate attributeName="offset" values="0;1;0" dur="5s" repeatCount="indefinite" begin="1s" />
            </stop>
            <stop offset="50%" stopColor="#6366f1" stopOpacity="1">
              <animate attributeName="offset" values="0.5;1.5;0.5" dur="5s" repeatCount="indefinite" begin="1s" />
            </stop>
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0">
              <animate attributeName="offset" values="1;2;1" dur="5s" repeatCount="indefinite" begin="1s" />
            </stop>
          </linearGradient>

          <linearGradient id="pulse3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0">
              <animate attributeName="offset" values="0;1;0" dur="6s" repeatCount="indefinite" begin="2s" />
            </stop>
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="1">
              <animate attributeName="offset" values="0.5;1.5;0.5" dur="6s" repeatCount="indefinite" begin="2s" />
            </stop>
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0">
              <animate attributeName="offset" values="1;2;1" dur="6s" repeatCount="indefinite" begin="2s" />
            </stop>
          </linearGradient>
        </defs>

        {/* Circuit ligne 1 - Haut gauche */}
        <g stroke="#818cf8" strokeWidth="2" fill="none" opacity="0.3">
          <path d="M 0,80 L 200,80 L 200,180 L 400,180" />
          <circle cx="200" cy="80" r="4" fill="#818cf8" />
          <circle cx="200" cy="180" r="4" fill="#818cf8" />
        </g>
        <path d="M 0,80 L 200,80 L 200,180 L 400,180" stroke="url(#pulse1)" strokeWidth="3" fill="none" />

        {/* Circuit ligne 2 - Haut droite */}
        <g stroke="#6366f1" strokeWidth="2" fill="none" opacity="0.3">
          <path d="M 100%,120 L calc(100% - 250px),120 L calc(100% - 250px),250 L calc(100% - 450px),250" />
          <circle cx="calc(100% - 250px)" cy="120" r="4" fill="#6366f1" />
          <circle cx="calc(100% - 250px)" cy="250" r="4" fill="#6366f1" />
        </g>
        <path d="M 100%,120 L calc(100% - 250px),120 L calc(100% - 250px),250 L calc(100% - 450px),250" stroke="url(#pulse2)" strokeWidth="3" fill="none" />

        {/* Circuit ligne 3 - Milieu gauche */}
        <g stroke="#818cf8" strokeWidth="2" fill="none" opacity="0.3">
          <path d="M 0,50% L 150,50% L 150,calc(50% + 120px) L 350,calc(50% + 120px)" />
          <circle cx="150" cy="50%" r="4" fill="#818cf8" />
          <circle cx="150" cy="calc(50% + 120px)" r="4" fill="#818cf8" />
        </g>
        <path d="M 0,50% L 150,50% L 150,calc(50% + 120px) L 350,calc(50% + 120px)" stroke="url(#pulse3)" strokeWidth="3" fill="none" />

        {/* Circuit ligne 4 - Milieu droite */}
        <g stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.3">
          <path d="M 100%,calc(50% - 80px) L calc(100% - 180px),calc(50% - 80px) L calc(100% - 180px),calc(50% + 80px) L calc(100% - 380px),calc(50% + 80px)" />
          <circle cx="calc(100% - 180px)" cy="calc(50% - 80px)" r="4" fill="#a78bfa" />
          <circle cx="calc(100% - 180px)" cy="calc(50% + 80px)" r="4" fill="#a78bfa" />
        </g>
        <path d="M 100%,calc(50% - 80px) L calc(100% - 180px),calc(50% - 80px) L calc(100% - 180px),calc(50% + 80px) L calc(100% - 380px),calc(50% + 80px)" stroke="url(#pulse1)" strokeWidth="3" fill="none" />

        {/* Circuit ligne 5 - Bas gauche */}
        <g stroke="#6366f1" strokeWidth="2" fill="none" opacity="0.3">
          <path d="M 0,calc(100% - 150px) L 220,calc(100% - 150px) L 220,calc(100% - 50px) L 420,calc(100% - 50px)" />
          <circle cx="220" cy="calc(100% - 150px)" r="4" fill="#6366f1" />
          <circle cx="220" cy="calc(100% - 50px)" r="4" fill="#6366f1" />
        </g>
        <path d="M 0,calc(100% - 150px) L 220,calc(100% - 150px) L 220,calc(100% - 50px) L 420,calc(100% - 50px)" stroke="url(#pulse2)" strokeWidth="3" fill="none" />

        {/* Circuit ligne 6 - Bas droite */}
        <g stroke="#818cf8" strokeWidth="2" fill="none" opacity="0.3">
          <path d="M 100%,calc(100% - 100px) L calc(100% - 200px),calc(100% - 100px) L calc(100% - 200px),calc(100% - 200px) L calc(100% - 400px),calc(100% - 200px)" />
          <circle cx="calc(100% - 200px)" cy="calc(100% - 100px)" r="4" fill="#818cf8" />
          <circle cx="calc(100% - 200px)" cy="calc(100% - 200px)" r="4" fill="#818cf8" />
        </g>
        <path d="M 100%,calc(100% - 100px) L calc(100% - 200px),calc(100% - 100px) L calc(100% - 200px),calc(100% - 200px) L calc(100% - 400px),calc(100% - 200px)" stroke="url(#pulse3)" strokeWidth="3" fill="none" />
      </svg>
    </div>
  );
};

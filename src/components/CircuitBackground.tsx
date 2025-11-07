export const CircuitBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Gradients pour les impulsions lumineuses */}
          <linearGradient id="pulse1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0">
              <animate attributeName="offset" values="-0.5;1.5" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="30%" stopColor="#818cf8" stopOpacity="0.8">
              <animate attributeName="offset" values="-0.2;1.8" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#c7d2fe" stopOpacity="1">
              <animate attributeName="offset" values="0;2" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="70%" stopColor="#818cf8" stopOpacity="0.8">
              <animate attributeName="offset" values="0.2;2.2" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0">
              <animate attributeName="offset" values="0.5;2.5" dur="3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>

          <linearGradient id="pulse2">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0">
              <animate attributeName="offset" values="-0.5;1.5" dur="4s" repeatCount="indefinite" begin="1s" />
            </stop>
            <stop offset="30%" stopColor="#6366f1" stopOpacity="0.8">
              <animate attributeName="offset" values="-0.2;1.8" dur="4s" repeatCount="indefinite" begin="1s" />
            </stop>
            <stop offset="50%" stopColor="#a5b4fc" stopOpacity="1">
              <animate attributeName="offset" values="0;2" dur="4s" repeatCount="indefinite" begin="1s" />
            </stop>
            <stop offset="70%" stopColor="#6366f1" stopOpacity="0.8">
              <animate attributeName="offset" values="0.2;2.2" dur="4s" repeatCount="indefinite" begin="1s" />
            </stop>
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0">
              <animate attributeName="offset" values="0.5;2.5" dur="4s" repeatCount="indefinite" begin="1s" />
            </stop>
          </linearGradient>

          <linearGradient id="pulse3">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0">
              <animate attributeName="offset" values="-0.5;1.5" dur="5s" repeatCount="indefinite" begin="0.5s" />
            </stop>
            <stop offset="30%" stopColor="#a78bfa" stopOpacity="0.8">
              <animate attributeName="offset" values="-0.2;1.8" dur="5s" repeatCount="indefinite" begin="0.5s" />
            </stop>
            <stop offset="50%" stopColor="#ddd6fe" stopOpacity="1">
              <animate attributeName="offset" values="0;2" dur="5s" repeatCount="indefinite" begin="0.5s" />
            </stop>
            <stop offset="70%" stopColor="#a78bfa" stopOpacity="0.8">
              <animate attributeName="offset" values="0.2;2.2" dur="5s" repeatCount="indefinite" begin="0.5s" />
            </stop>
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0">
              <animate attributeName="offset" values="0.5;2.5" dur="5s" repeatCount="indefinite" begin="0.5s" />
            </stop>
          </linearGradient>

          {/* Filtres pour effet de lueur */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Ligne courbe 1 - Haut gauche avec courbe fluide */}
        <g>
          <path 
            d="M -50,100 Q 150,80 250,120 T 500,100" 
            stroke="#818cf8" 
            strokeWidth="1.5" 
            fill="none" 
            opacity="0.4"
            strokeLinecap="round"
          />
          <path 
            d="M -50,100 Q 150,80 250,120 T 500,100" 
            stroke="url(#pulse1)" 
            strokeWidth="3" 
            fill="none"
            filter="url(#glow)"
            strokeLinecap="round"
          />
        </g>

        {/* Ligne courbe 2 - Haut droite avec courbe en S */}
        <g>
          <path 
            d="M 100%,150 Q calc(100% - 200px),130 calc(100% - 300px),180 T calc(100% - 600px),160" 
            stroke="#6366f1" 
            strokeWidth="1.5" 
            fill="none" 
            opacity="0.4"
            strokeLinecap="round"
          />
          <path 
            d="M 100%,150 Q calc(100% - 200px),130 calc(100% - 300px),180 T calc(100% - 600px),160" 
            stroke="url(#pulse2)" 
            strokeWidth="3" 
            fill="none"
            filter="url(#glow)"
            strokeLinecap="round"
          />
        </g>

        {/* Ligne courbe 3 - Milieu avec vague */}
        <g>
          <path 
            d="M -50,45% Q 200,calc(45% - 40px) 400,45% T 700,calc(45% + 20px)" 
            stroke="#a78bfa" 
            strokeWidth="1.5" 
            fill="none" 
            opacity="0.4"
            strokeLinecap="round"
          />
          <path 
            d="M -50,45% Q 200,calc(45% - 40px) 400,45% T 700,calc(45% + 20px)" 
            stroke="url(#pulse3)" 
            strokeWidth="3" 
            fill="none"
            filter="url(#glow)"
            strokeLinecap="round"
          />
        </g>

        {/* Ligne courbe 4 - Milieu droite ondulante */}
        <g>
          <path 
            d="M 100%,55% Q calc(100% - 250px),calc(55% + 50px) calc(100% - 450px),55% T calc(100% - 800px),calc(55% - 30px)" 
            stroke="#818cf8" 
            strokeWidth="1.5" 
            fill="none" 
            opacity="0.4"
            strokeLinecap="round"
          />
          <path 
            d="M 100%,55% Q calc(100% - 250px),calc(55% + 50px) calc(100% - 450px),55% T calc(100% - 800px),calc(55% - 30px)" 
            stroke="url(#pulse1)" 
            strokeWidth="3" 
            fill="none"
            filter="url(#glow)"
            strokeLinecap="round"
          />
        </g>

        {/* Ligne courbe 5 - Bas gauche élégante */}
        <g>
          <path 
            d="M -50,calc(100% - 180px) Q 180,calc(100% - 220px) 350,calc(100% - 160px) T 650,calc(100% - 200px)" 
            stroke="#6366f1" 
            strokeWidth="1.5" 
            fill="none" 
            opacity="0.4"
            strokeLinecap="round"
          />
          <path 
            d="M -50,calc(100% - 180px) Q 180,calc(100% - 220px) 350,calc(100% - 160px) T 650,calc(100% - 200px)" 
            stroke="url(#pulse2)" 
            strokeWidth="3" 
            fill="none"
            filter="url(#glow)"
            strokeLinecap="round"
          />
        </g>

        {/* Ligne courbe 6 - Bas droite sinueuse */}
        <g>
          <path 
            d="M 100%,calc(100% - 120px) Q calc(100% - 220px),calc(100% - 80px) calc(100% - 400px),calc(100% - 140px) T calc(100% - 750px),calc(100% - 100px)" 
            stroke="#a78bfa" 
            strokeWidth="1.5" 
            fill="none" 
            opacity="0.4"
            strokeLinecap="round"
          />
          <path 
            d="M 100%,calc(100% - 120px) Q calc(100% - 220px),calc(100% - 80px) calc(100% - 400px),calc(100% - 140px) T calc(100% - 750px),calc(100% - 100px)" 
            stroke="url(#pulse3)" 
            strokeWidth="3" 
            fill="none"
            filter="url(#glow)"
            strokeLinecap="round"
          />
        </g>

        {/* Ligne courbe 7 - Bas droite supplémentaire */}
        <g>
          <path 
            d="M 100%,calc(100% - 60px) Q calc(100% - 150px),calc(100% - 90px) calc(100% - 300px),calc(100% - 50px) T calc(100% - 600px),calc(100% - 80px)" 
            stroke="#818cf8" 
            strokeWidth="1.5" 
            fill="none" 
            opacity="0.4"
            strokeLinecap="round"
          />
          <path 
            d="M 100%,calc(100% - 60px) Q calc(100% - 150px),calc(100% - 90px) calc(100% - 300px),calc(100% - 50px) T calc(100% - 600px),calc(100% - 80px)" 
            stroke="url(#pulse1)" 
            strokeWidth="3" 
            fill="none"
            filter="url(#glow)"
            strokeLinecap="round"
          />
        </g>

        {/* Points lumineux aux extrémités et intersections */}
        <g filter="url(#glow)">
          <circle cx="250" cy="120" r="3" fill="#c7d2fe" opacity="0.6">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="400" cy="45%" r="3" fill="#ddd6fe" opacity="0.6">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" begin="0.5s" />
          </circle>
          <circle cx="350" cy="calc(100% - 160px)" r="3" fill="#a5b4fc" opacity="0.6">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.5s" repeatCount="indefinite" begin="1s" />
          </circle>
        </g>
      </svg>
    </div>
  );
};

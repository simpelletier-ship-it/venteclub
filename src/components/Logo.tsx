interface LogoProps {
  showTagline?: boolean;
  className?: string;
}

export const Logo = ({ showTagline = false, className = "" }: LogoProps) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Stylized V Checkmark */}
      <svg 
        width="40" 
        height="40" 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* First stroke of the checkmark */}
        <path 
          d="M5 20 L15 32" 
          stroke="currentColor" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-foreground"
        />
        {/* Second stroke of the checkmark */}
        <path 
          d="M15 32 L35 8" 
          stroke="currentColor" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-foreground"
        />
      </svg>
      
      {/* Text Logo */}
      <div className="flex flex-col">
        <div className="flex items-baseline">
          <span className="text-2xl md:text-3xl font-bold text-foreground">
            ente
          </span>
          <span className="text-2xl md:text-3xl font-bold text-accent">
            .Club
          </span>
        </div>
        {showTagline && (
          <span className="text-xs md:text-sm text-muted-foreground -mt-1">
            Un réseau d'entrepreneurs en action
          </span>
        )}
      </div>
    </div>
  );
};

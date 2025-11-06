import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AnimatedSearchBar = () => {
  const navigate = useNavigate();
  const [currentWord, setCurrentWord] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [dotsLayout, setDotsLayout] = useState<"row" | "grid">("row");
  
  const words = ["entreprise", "franchise", "immeuble", "commerce", "restaurant"];

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 3000);

    return () => clearInterval(wordInterval);
  }, []);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDotsLayout((prev) => prev === "row" ? "grid" : "row");
    }, 2000);

    return () => clearInterval(dotsInterval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/entreprises?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/entreprises");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 relative">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-secondary/30">
          <Search className="absolute left-6 w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Rechercher une ${words[currentWord]}...`}
            className="w-full pl-14 pr-6 py-5 text-lg bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </form>

      {/* Animated Dots */}
      <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex gap-2 transition-all duration-500">
        <div 
          className={`flex gap-2 transition-all duration-500 ${
            dotsLayout === "row" ? "flex-row" : "flex-col"
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-secondary to-primary animate-glow" style={{ animationDelay: "0s" }} />
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent animate-glow" style={{ animationDelay: "0.2s" }} />
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-accent to-secondary animate-glow" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Afficher le bouton après 300px de scroll
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Button
      onClick={scrollToTop}
      className={`fixed bottom-20 md:bottom-6 right-4 z-40 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary-light text-primary-foreground transition-all duration-300 touch-manipulation ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      }`}
      size="icon"
      aria-label="Retour en haut de la page"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
};

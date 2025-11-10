import { useState, useEffect } from "react";

interface Word {
  text: string;
  gender: "un" | "une";
}

export const TypewriterAnimation = () => {
  const [displayedText, setDisplayedText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const words: Word[] = [
    { text: "entreprise", gender: "une" },
    { text: "franchise", gender: "une" },
    { text: "immeuble", gender: "un" },
    { text: "commerce", gender: "un" },
    { text: "restaurant", gender: "un" },
    { text: "café", gender: "un" }
  ];

  const currentWord = words[wordIndex];

  useEffect(() => {
    const updateText = () => {
      if (!isDeleting) {
        // Typing
        if (displayedText.length < currentWord.text.length) {
          setDisplayedText(currentWord.text.substring(0, displayedText.length + 1));
        } else {
          // Wait before deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting
        if (displayedText.length > 0) {
          setDisplayedText(currentWord.text.substring(0, displayedText.length - 1));
        } else {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    };

    const speed = isDeleting ? 50 : 100;
    const timer = setTimeout(updateText, speed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, wordIndex]);

  return (
    <span className="inline-block">
      <span className="font-bold text-[#818cf8]">
        {currentWord.gender} <span className="text-white">{displayedText}</span>
        <span className="animate-pulse text-white">|</span>
      </span>
    </span>
  );
};

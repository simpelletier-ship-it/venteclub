import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Lazy load Web Vitals monitoring
const initWebVitals = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      import("./lib/webVitals").then(({ initWebVitals }) => {
        initWebVitals();
      });
    });
  } else {
    setTimeout(() => {
      import("./lib/webVitals").then(({ initWebVitals }) => {
        initWebVitals();
      });
    }, 1000);
  }
};

createRoot(document.getElementById("root")!).render(<App />);

// Initialiser le monitoring des Web Vitals après le rendu initial
if (typeof window !== 'undefined') {
  initWebVitals();
}

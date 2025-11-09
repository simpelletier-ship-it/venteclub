import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initWebVitals } from "./lib/webVitals";

createRoot(document.getElementById("root")!).render(<App />);

// Initialiser le monitoring des Web Vitals
if (typeof window !== 'undefined') {
  initWebVitals();
}

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { deferNonCriticalResources } from "./lib/deferNonCritical";

// Render app immediately
createRoot(document.getElementById("root")!).render(<App />);

// Defer non-critical resources after initial render
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    deferNonCriticalResources();
  });
}

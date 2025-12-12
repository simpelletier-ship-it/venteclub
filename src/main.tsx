import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";

try {
  console.log("[Boot] Initialisation de l'application Vente.club");
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Élément root introuvable dans index.html");
  }
  createRoot(rootElement).render(<App />);
  console.log("[Boot] Application montée avec succès");
} catch (error) {
  console.error("[Boot Error] Erreur critique au montage de l'application", error);
}


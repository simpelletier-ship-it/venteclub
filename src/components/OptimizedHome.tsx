import { lazy, Suspense } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

// Lazy load the full Home page after initial paint
const Home = lazy(() => import("@/pages/Home"));

export const OptimizedHome = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e3a8a]">
        <LoadingSpinner />
      </div>
    }>
      <Home />
    </Suspense>
  );
};

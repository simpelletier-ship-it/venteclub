import { ReactNode } from "react";
import Header from "./Header";
import { Footer } from "./Footer";
import { AlertCircle } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-accent text-accent-foreground py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span>
          Site en version bêta - Lancement officiel le 1<sup className="text-[0.65em]">er</sup> décembre 2025
        </span>
      </div>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

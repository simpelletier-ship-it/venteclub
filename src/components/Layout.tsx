import { ReactNode } from "react";
import { Header } from "./Header";
import { AlertCircle } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-accent text-accent-foreground py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span>
          Site en version bêta - Lancement officiel le 1er décembre 2025
        </span>
      </div>
      <Header />
      <main>{children}</main>
    </div>
  );
};

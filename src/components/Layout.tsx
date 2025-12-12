import { ReactNode } from "react";
import Header from "./Header";
import { Footer } from "./Footer";
import { ScrollToTop } from "./ScrollToTop";
import { MobileBottomNav } from "./MobileBottomNav";
import { AlertCircle } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen min-h-dvh bg-background flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <ScrollToTop />
      <MobileBottomNav />
    </div>
  );
};

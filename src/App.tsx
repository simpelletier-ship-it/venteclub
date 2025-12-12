import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { EmailVerificationGuard } from "@/components/EmailVerificationGuard";
import { trackPageView } from "@/lib/analytics";
import { useWebVitals } from "@/hooks/usePerformanceMonitoring";
import { MobileNotificationsContainer } from "@/components/MobileNotificationsContainer";
import { ThemeProvider } from "next-themes";

// Lazy load all pages
const Home = lazy(() => import("./pages/Home"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Sell = lazy(() => import("./pages/Sell"));
const ListBusiness = lazy(() => import("./pages/ListBusiness"));
const ListFranchise = lazy(() => import("./pages/ListFranchise"));
const ListProperty = lazy(() => import("./pages/ListProperty"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const BusinessDetails = lazy(() => import("./pages/BusinessDetails"));
const Map = lazy(() => import("./pages/Map"));
const Admin = lazy(() => import("./pages/Admin"));
const Settings = lazy(() => import("./pages/Settings"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Messages = lazy(() => import("./pages/Messages"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LogoutSuccess = lazy(() => import("./pages/LogoutSuccess"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Terms = lazy(() => import("./pages/Terms"));
const Profile = lazy(() => import("./pages/Profile"));
const SellerProfile = lazy(() => import("./pages/SellerProfile"));
const Resources = lazy(() => import("./pages/Resources"));
const FAQ = lazy(() => import("./pages/FAQ"));
const EmailConfirmed = lazy(() => import("./pages/EmailConfirmed"));
const PremiumSuccess = lazy(() => import("./pages/PremiumSuccess"));
const Tools = lazy(() => import("./pages/Tools"));
const SalaryCalculator = lazy(() => import("./pages/SalaryCalculator"));
const TaxReturnCalculator = lazy(() => import("./pages/TaxReturnCalculator"));
const BudgetCalculator = lazy(() => import("./pages/BudgetCalculator"));
const BudgetPlan = lazy(() => import("./pages/BudgetPlan"));
const BudgetExpenses = lazy(() => import("./pages/BudgetExpenses"));
const BudgetHistory = lazy(() => import("./pages/BudgetHistory"));
const BudgetGoals = lazy(() => import("./pages/BudgetGoals"));
const BudgetNetWorth = lazy(() => import("./pages/BudgetNetWorth"));
const BudgetAnalytics = lazy(() => import("./pages/BudgetAnalytics"));
const TaxSimulator = lazy(() => import("./pages/TaxSimulator"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AdminSecurity = lazy(() => import("./pages/AdminSecurity"));
const SecurityCompliance = lazy(() => import("./pages/SecurityCompliance"));

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  useWebVitals();

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <MobileNotificationsContainer />
          <BrowserRouter>
            <AnalyticsTracker />
            <Layout>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-950"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>}>
              <Routes>
                  {/* Homepage */}
                  <Route path="/" element={<Home />} />
                  
                  {/* Auth pages */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/email-confirmed" element={<EmailConfirmed />} />
                  <Route path="/logout-success" element={<LogoutSuccess />} />
                  <Route path="/premium-success" element={<PremiumSuccess />} />
                  
                  {/* Main Budget App - Unified Navigation */}
                  <Route path="/budget" element={<BudgetCalculator />} />
                  <Route path="/budget/planifier" element={<BudgetPlan />} />
                  <Route path="/budget/depenses" element={<BudgetExpenses />} />
                  <Route path="/budget/historique" element={<BudgetHistory />} />
                  <Route path="/budget/objectifs" element={<BudgetGoals />} />
                  <Route path="/budget/valeur-nette" element={<BudgetNetWorth />} />
                  <Route path="/budget/analyses" element={<BudgetAnalytics />} />
                  
                  {/* Legacy redirect */}
                  <Route path="/outils/budget" element={<Navigate to="/budget" replace />} />
                  
                  {/* Tools */}
                  <Route path="/outils" element={<EmailVerificationGuard><Tools /></EmailVerificationGuard>} />
                  <Route path="/outils/salaire" element={<EmailVerificationGuard><SalaryCalculator /></EmailVerificationGuard>} />
                  <Route path="/outils/retour-impot" element={<EmailVerificationGuard><TaxReturnCalculator /></EmailVerificationGuard>} />
                  <Route path="/impots" element={<TaxSimulator />} />
                  
                  {/* Blog */}
                  <Route path="/blog" element={<EmailVerificationGuard><Blog /></EmailVerificationGuard>} />
                  <Route path="/blog/:slug" element={<EmailVerificationGuard><BlogPost /></EmailVerificationGuard>} />
                  
                  {/* Other pages */}
                  <Route path="/a-propos" element={<EmailVerificationGuard><About /></EmailVerificationGuard>} />
                  <Route path="/contact" element={<EmailVerificationGuard><Contact /></EmailVerificationGuard>} />
                  <Route path="/terms" element={<EmailVerificationGuard><Terms /></EmailVerificationGuard>} />
                  <Route path="/ressources" element={<EmailVerificationGuard><Resources /></EmailVerificationGuard>} />
                  <Route path="/faq" element={<EmailVerificationGuard><FAQ /></EmailVerificationGuard>} />
                  
                  {/* User pages */}
                  <Route path="/settings" element={<EmailVerificationGuard><Settings /></EmailVerificationGuard>} />
                  <Route path="/profile/:userId" element={<EmailVerificationGuard><Profile /></EmailVerificationGuard>} />
                  
                  {/* Admin */}
                  <Route path="/admin" element={<EmailVerificationGuard><Admin /></EmailVerificationGuard>} />
                  <Route path="/admin/security" element={<EmailVerificationGuard><AdminSecurity /></EmailVerificationGuard>} />
                  <Route path="/admin/compliance" element={<EmailVerificationGuard><SecurityCompliance /></EmailVerificationGuard>} />
                  
                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

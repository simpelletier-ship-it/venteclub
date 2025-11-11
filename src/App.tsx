import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { EmailVerificationGuard } from "@/components/EmailVerificationGuard";
import { trackPageView } from "@/lib/analytics";
import { useWebVitals } from "@/hooks/usePerformanceMonitoring";
import { MobileNotificationsContainer } from "@/components/MobileNotificationsContainer";
import { ThemeProvider } from "next-themes";

// Critical pages loaded immediately
import Home from "./pages/Home";
import Businesses from "./pages/Businesses";

// Lazy load all other pages
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
const CityPage = lazy(() => import("./pages/CityPage"));
const Terms = lazy(() => import("./pages/Terms"));
const PropertyListings = lazy(() => import("./pages/PropertyListings"));
const Profile = lazy(() => import("./pages/Profile"));
const SellerProfile = lazy(() => import("./pages/SellerProfile"));
const Resources = lazy(() => import("./pages/Resources"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Market = lazy(() => import("./pages/Market"));
const ClubSelect = lazy(() => import("./pages/ClubSelect"));
const FeaturedListing = lazy(() => import("./pages/FeaturedListing"));
const EmailConfirmed = lazy(() => import("./pages/EmailConfirmed"));
const PremiumSuccess = lazy(() => import("./pages/PremiumSuccess"));
const TestEmail = lazy(() => import("./pages/TestEmail"));
const Tools = lazy(() => import("./pages/Tools"));
const SalaryCalculator = lazy(() => import("./pages/SalaryCalculator"));
const TaxReturnCalculator = lazy(() => import("./pages/TaxReturnCalculator"));
const BudgetCalculator = lazy(() => import("./pages/BudgetCalculator"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Lazy load admin security page
const AdminSecurity = lazy(() => import("./pages/AdminSecurity"));
const SecurityCompliance = lazy(() => import("./pages/SecurityCompliance"));

// Analytics and Performance Monitoring component
const AnalyticsTracker = () => {
  const location = useLocation();

  // Track page views
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  // Monitor Web Vitals (Core Web Vitals)
  useWebVitals();

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <MobileNotificationsContainer />
          <BrowserRouter>
            <AnalyticsTracker />
            <Layout>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                <Routes>
                {/* Pages VRAIMENT publiques (accessibles sans compte) */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/email-confirmed" element={<EmailConfirmed />} />
                <Route path="/logout-success" element={<LogoutSuccess />} />
                <Route path="/premium-success" element={<PremiumSuccess />} />
                
                {/* Pages publiques SEO (mais nécessitent email confirmé si connecté) */}
                <Route path="/" element={<EmailVerificationGuard><Home /></EmailVerificationGuard>} />
                <Route path="/entreprises" element={<EmailVerificationGuard><Businesses /></EmailVerificationGuard>} />
                <Route path="/entreprise/:slug" element={<EmailVerificationGuard><BusinessDetails /></EmailVerificationGuard>} />
                <Route path="/a-propos" element={<EmailVerificationGuard><About /></EmailVerificationGuard>} />
                <Route path="/contact" element={<EmailVerificationGuard><Contact /></EmailVerificationGuard>} />
                <Route path="/blog" element={<EmailVerificationGuard><Blog /></EmailVerificationGuard>} />
                <Route path="/blog/:slug" element={<EmailVerificationGuard><BlogPost /></EmailVerificationGuard>} />
                <Route path="/terms" element={<EmailVerificationGuard><Terms /></EmailVerificationGuard>} />
                <Route path="/ressources" element={<EmailVerificationGuard><Resources /></EmailVerificationGuard>} />
                <Route path="/faq" element={<EmailVerificationGuard><FAQ /></EmailVerificationGuard>} />
                <Route path="/marche" element={<EmailVerificationGuard><Market /></EmailVerificationGuard>} />
                <Route path="/club-select" element={<EmailVerificationGuard><ClubSelect /></EmailVerificationGuard>} />
                <Route path="/featured-listing" element={<EmailVerificationGuard><FeaturedListing /></EmailVerificationGuard>} />
                <Route path="/immeubles-commerciaux" element={<EmailVerificationGuard><PropertyListings /></EmailVerificationGuard>} />
                <Route path="/entreprises-a-vendre-montreal" element={<EmailVerificationGuard><CityPage /></EmailVerificationGuard>} />
                <Route path="/entreprises-a-vendre-quebec" element={<EmailVerificationGuard><CityPage /></EmailVerificationGuard>} />
                <Route path="/entreprises-a-vendre-laval" element={<EmailVerificationGuard><CityPage /></EmailVerificationGuard>} />
                <Route path="/entreprises-a-vendre-gatineau" element={<EmailVerificationGuard><CityPage /></EmailVerificationGuard>} />
                <Route path="/entreprises-a-vendre-sherbrooke" element={<EmailVerificationGuard><CityPage /></EmailVerificationGuard>} />
                
                {/* Pages nécessitant email confirmé */}
                <Route path="/sell" element={<EmailVerificationGuard><Sell /></EmailVerificationGuard>} />
                <Route path="/list-business" element={<EmailVerificationGuard><ListBusiness /></EmailVerificationGuard>} />
                <Route path="/list-franchise" element={<EmailVerificationGuard><ListFranchise /></EmailVerificationGuard>} />
                <Route path="/list-property" element={<EmailVerificationGuard><ListProperty /></EmailVerificationGuard>} />
                <Route path="/dashboard" element={<EmailVerificationGuard><Dashboard /></EmailVerificationGuard>} />
                <Route path="/admin" element={<EmailVerificationGuard><Admin /></EmailVerificationGuard>} />
                <Route path="/admin/security" element={<EmailVerificationGuard><AdminSecurity /></EmailVerificationGuard>} />
                <Route path="/admin/compliance" element={<EmailVerificationGuard><SecurityCompliance /></EmailVerificationGuard>} />
                <Route path="/settings" element={<EmailVerificationGuard><Settings /></EmailVerificationGuard>} />
                <Route path="/favorites" element={<EmailVerificationGuard><Favorites /></EmailVerificationGuard>} />
                <Route path="/messages" element={<EmailVerificationGuard><Messages /></EmailVerificationGuard>} />
                <Route path="/profile/:userId" element={<EmailVerificationGuard><Profile /></EmailVerificationGuard>} />
                <Route path="/seller/:sellerId" element={<EmailVerificationGuard><SellerProfile /></EmailVerificationGuard>} />
                <Route path="/test-email" element={<EmailVerificationGuard><TestEmail /></EmailVerificationGuard>} />
                
                {/* Tools Routes */}
                <Route path="/outils" element={<EmailVerificationGuard><Tools /></EmailVerificationGuard>} />
                <Route path="/outils/calculateur-salaire" element={<EmailVerificationGuard><SalaryCalculator /></EmailVerificationGuard>} />
                <Route path="/outils/retour-impot" element={<EmailVerificationGuard><TaxReturnCalculator /></EmailVerificationGuard>} />
                <Route path="/outils/budget" element={<BudgetCalculator />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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

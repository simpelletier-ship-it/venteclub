import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { lazy, Suspense } from "react";

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
const Resources = lazy(() => import("./pages/Resources"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Market = lazy(() => import("./pages/Market"));
const EmailConfirmed = lazy(() => import("./pages/EmailConfirmed"));

const queryClient = new QueryClient();

// Lazy load admin security page
const AdminSecurity = lazy(() => import("./pages/AdminSecurity"));
const SecurityCompliance = lazy(() => import("./pages/SecurityCompliance"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/entreprises" element={<Businesses />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/email-confirmed" element={<EmailConfirmed />} />
                <Route path="/sell" element={<Sell />} />
                <Route path="/list-business" element={<ListBusiness />} />
                <Route path="/list-franchise" element={<ListFranchise />} />
                <Route path="/list-property" element={<ListProperty />} />
                <Route path="/immeubles-commerciaux" element={<PropertyListings />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/entreprise/:slug" element={<BusinessDetails />} />
                <Route path="/map" element={<Map />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/security" element={<AdminSecurity />} />
                <Route path="/admin/compliance" element={<SecurityCompliance />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/logout-success" element={<LogoutSuccess />} />
                
                {/* SEO Pages */}
                <Route path="/a-propos" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/ressources" element={<Resources />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/marche" element={<Market />} />
                
                {/* City Pages - Static routes for SEO */}
                <Route path="/entreprises-a-vendre-montreal" element={<CityPage />} />
                <Route path="/entreprises-a-vendre-quebec" element={<CityPage />} />
                <Route path="/entreprises-a-vendre-laval" element={<CityPage />} />
                <Route path="/entreprises-a-vendre-gatineau" element={<CityPage />} />
                <Route path="/entreprises-a-vendre-sherbrooke" element={<CityPage />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

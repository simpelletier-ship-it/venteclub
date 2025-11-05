import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import Home from "./pages/Home";
import Businesses from "./pages/Businesses";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Sell from "./pages/Sell";
import ListBusiness from "./pages/ListBusiness";
import ListFranchise from "./pages/ListFranchise";
import ListProperty from "./pages/ListProperty";
import Dashboard from "./pages/Dashboard";
import BusinessDetails from "./pages/BusinessDetails";
import Map from "./pages/Map";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import Favorites from "./pages/Favorites";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import LogoutSuccess from "./pages/LogoutSuccess";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import CityPage from "./pages/CityPage";
import Terms from "./pages/Terms";
import PropertyListings from "./pages/PropertyListings";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/entreprises" element={<Businesses />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/sell" element={<Sell />} />
              <Route path="/list-business" element={<ListBusiness />} />
              <Route path="/list-franchise" element={<ListFranchise />} />
              <Route path="/list-property" element={<ListProperty />} />
              <Route path="/immeubles-commerciaux" element={<PropertyListings />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/entreprise/:slug" element={<BusinessDetails />} />
              <Route path="/map" element={<Map />} />
              <Route path="/admin" element={<Admin />} />
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
              
              {/* City Pages - Static routes for SEO */}
              <Route path="/entreprises-a-vendre-montreal" element={<CityPage />} />
              <Route path="/entreprises-a-vendre-quebec" element={<CityPage />} />
              <Route path="/entreprises-a-vendre-laval" element={<CityPage />} />
              <Route path="/entreprises-a-vendre-gatineau" element={<CityPage />} />
              <Route path="/entreprises-a-vendre-sherbrooke" element={<CityPage />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ListBusiness from "./pages/ListBusiness";
import Dashboard from "./pages/Dashboard";
import BusinessDetails from "./pages/BusinessDetails";
import Map from "./pages/Map";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import Favorites from "./pages/Favorites";
import NotFound from "./pages/NotFound";
import LogoutSuccess from "./pages/LogoutSuccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/list-business" element={<ListBusiness />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/business/:id" element={<BusinessDetails />} />
            <Route path="/map" element={<Map />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/logout-success" element={<LogoutSuccess />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import InfluencerProfile from "./pages/InfluencerProfile";
import RegisterInfluencer from "./pages/RegisterInfluencer";
import RegisterBrand from "./pages/RegisterBrand";
import EditInfluencerProfile from "./pages/EditInfluencerProfile";
import CampaignDetail from "./pages/CampaignDetail";
import Messages from "./pages/Messages";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import OnboardingCheck from "./pages/OnboardingCheck";
import NotFound from "./pages/NotFound";
import ProfileHub from "./pages/ProfileHub";
import Settings from "./pages/Settings";
import MobileNav from "@/components/MobileNav";
import { usePushNotifications } from "./hooks/usePushNotifications";

const queryClient = new QueryClient();

const AppRoutes = () => {
  usePushNotifications();
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/influencer/:id" element={<InfluencerProfile />} />
      <Route path="/campaign/:id" element={<CampaignDetail />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding-check" element={<ProtectedRoute><OnboardingCheck /></ProtectedRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/edit-profile" element={<ProtectedRoute><EditInfluencerProfile /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/register" element={<ProtectedRoute><RegisterInfluencer /></ProtectedRoute>} />
      <Route path="/register-brand" element={<ProtectedRoute><RegisterBrand /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfileHub /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
          <MobileNav />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

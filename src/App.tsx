import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UnifiedProfile = lazy(() => import("./pages/UnifiedProfile"));
const RegisterInfluencer = lazy(() => import("./pages/RegisterInfluencer"));
const RegisterBrand = lazy(() => import("./pages/RegisterBrand"));
const EditInfluencerProfile = lazy(() => import("./pages/EditInfluencerProfile"));
const EditBrandProfile = lazy(() => import("./pages/EditBrandProfile"));
const CreateCampaign = lazy(() => import("./pages/CreateCampaign"));
const EditCampaign = lazy(() => import("./pages/EditCampaign"));
const CampaignDetail = lazy(() => import("./pages/CampaignDetail"));
const Messages = lazy(() => import("./pages/Messages"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const OnboardingCheck = lazy(() => import("./pages/OnboardingCheck"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Settings = lazy(() => import("./pages/Settings"));
import MobileNav from "@/components/MobileNav";
import { usePushNotifications } from "./hooks/usePushNotifications";

const RouteFallback = () => <div className="min-h-screen bg-white" />;

const HomeWrapper = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return (
      <DashboardLayout>
        <Index />
      </DashboardLayout>
    );
  }
  return <Index />;
};

const ProfileWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  usePushNotifications();
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomeWrapper />} />
        <Route path="/influencer/:id" element={<ProfileWrapper><UnifiedProfile /></ProfileWrapper>} />
        <Route path="/brand/:id" element={<ProfileWrapper><UnifiedProfile /></ProfileWrapper>} />
        <Route path="/campaign/:id" element={<ProfileWrapper><CampaignDetail /></ProfileWrapper>} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding-check" element={<ProtectedRoute><OnboardingCheck /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

        {/* Protected routes wrapped in DashboardLayout */}
        <Route element={<ProtectedRoute variant="layout"><DashboardLayout><Outlet /></DashboardLayout></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/edit-profile" element={<EditInfluencerProfile />} />
          <Route path="/edit-brand-profile" element={<EditBrandProfile />} />
          <Route path="/create-campaign" element={<CreateCampaign />} />
          <Route path="/edit-campaign/:id" element={<EditCampaign />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/register" element={<RegisterInfluencer />} />
          <Route path="/register-brand" element={<RegisterBrand />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
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
  </ErrorBoundary>
);

export default App;

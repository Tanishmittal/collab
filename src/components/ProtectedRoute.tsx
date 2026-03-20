import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppSplash from "@/components/AppSplash";
import { Skeleton } from "@/components/ui/skeleton";
import { isNativeApp } from "@/lib/platform";

const ProtectedRoute = ({ children, variant }: { children: React.ReactNode; variant?: "default" | "layout" }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return isNativeApp() ? (
      <AppSplash subtitle="Checking your account" />
    ) : (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;

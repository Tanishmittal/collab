import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { Skeleton } from "@/components/ui/skeleton";

const OnboardingCheck = () => {
  const navigate = useNavigate();
  const { status } = useOnboardingCheck();

  useEffect(() => {
    if (status === "needs-onboarding") {
      navigate("/onboarding", { replace: true });
    } else if (status === "complete") {
      navigate("/", { replace: true });
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md px-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
};

export default OnboardingCheck;

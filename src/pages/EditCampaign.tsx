import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCampaignForm } from "@/hooks/useCampaignForm";
import CampaignForm from "@/components/CampaignForm";
import type { Database } from "@/integrations/supabase/types";

type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];

const EditCampaign = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { brandId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [originalCampaign, setOriginalCampaign] = useState<CampaignRow | null>(null);

  const {
    submitting,
    form,
    update,
    deliverableCounts,
    updateDeliverable,
    includeEventVisit,
    setIncludeEventVisit,
    campaignDeliverables,
    handleUpdate,
    loadCampaign,
    activitySummary,
    deliverableOptions,
  } = useCampaignForm(() => navigate("/dashboard"), true, id);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      const campaign = await loadCampaign(id);
      if (!campaign) {
        navigate("/dashboard");
        return;
      }

      setOriginalCampaign(campaign);
      setLoading(false);
    };

    loadData();
  }, [id, loadCampaign, navigate]);

  const handleSave = async () => {
    if (!originalCampaign) return;
    await handleUpdate(originalCampaign);
  };

  if (!brandId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="minimal" title="Edit Campaign" />
        <div className="container px-4 py-10 md:px-6">
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Building2 size={24} />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Brand profile required</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Only brand accounts can edit campaigns.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="minimal" title="Edit Campaign" />
        <div className="container px-4 py-6 md:px-6">
          <div className="mx-auto max-w-4xl space-y-4">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="minimal" title="Edit Campaign" />
      <div className="container max-w-4xl px-4 py-6 md:px-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">
                <CheckCircle size={12} />
                Campaign Editor
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">Edit Campaign</h1>
            </div>
            <Button variant="outline" className="rounded-xl" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          <CampaignForm
            isEdit={true}
            form={form}
            update={update}
            deliverableCounts={deliverableCounts}
            updateDeliverable={updateDeliverable}
            includeEventVisit={includeEventVisit}
            setIncludeEventVisit={setIncludeEventVisit}
            campaignDeliverables={campaignDeliverables}
            activitySummary={activitySummary}
            deliverableOptions={deliverableOptions}
            onSubmit={handleSave}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  );
};

export default EditCampaign;

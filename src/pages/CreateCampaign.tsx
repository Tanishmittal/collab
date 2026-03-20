import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle,
  Clock,
  Layers,
  Loader2,
  MapPin,
  Megaphone,
  Target,
  Users,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BrandAvatar from "@/components/BrandAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCampaignForm } from "@/hooks/useCampaignForm";
import CampaignForm from "@/components/CampaignForm";
import { cn } from "@/lib/utils";
import { goBackOr } from "@/lib/navigation";

const steps = [
  { icon: Megaphone, label: "Identity" },
  { icon: Target, label: "Strategy" },
  { icon: Layers, label: "Logistics" },
];

const nicheColors: Record<string, string> = {
  Food: "text-orange-600 border-orange-200 bg-orange-50",
  Fitness: "text-green-600 border-green-200 bg-green-50",
  Fashion: "text-pink-600 border-pink-200 bg-pink-50",
  Tech: "text-blue-600 border-blue-200 bg-blue-50",
  Travel: "text-teal-600 border-teal-200 bg-teal-50",
  Lifestyle: "text-amber-600 border-amber-200 bg-amber-50",
  Beauty: "text-rose-600 border-rose-200 bg-rose-50",
  Comedy: "text-yellow-600 border-yellow-200 bg-yellow-50",
};

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { brandId } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);

  const {
    submitting,
    form,
    update,
    deliverableCounts,
    updateDeliverable,
    includeEventVisit,
    setIncludeEventVisit,
    campaignDeliverables,
    canProceed,
    handleCreate,
    deliverableOptions,
  } = useCampaignForm(() => navigate("/dashboard"));

  // Preview calculations
  const previewBudget = form.budget ? parseInt(form.budget, 10) : 0;
  const previewSlots = form.influencersNeeded ? parseInt(form.influencersNeeded, 10) : 0;
  const previewApplied = previewSlots > 0 ? Math.max(1, Math.min(previewSlots - 1, Math.floor(previewSlots * 0.6))) : 0;
  const previewProgress = previewSlots > 0 ? Math.min((previewApplied / previewSlots) * 100, 100) : 0;
  const previewSlotsLeft = Math.max(0, previewSlots - previewApplied);
  const previewIsUrgent = previewProgress >= 80 && previewSlotsLeft > 0;
  const previewNicheStyle = nicheColors[form.niche] || "text-teal-600 border-teal-200 bg-teal-50";

  if (!brandId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="minimal" title="Create Campaign" />
        <div className="container px-4 py-10 md:px-6">
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Building2 size={24} />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Create a brand profile first</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Campaign creation is available only for brand accounts. Complete your brand profile, then launch campaigns from the dashboard.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" className="rounded-xl" onClick={() => goBackOr(navigate, "/dashboard")}>
                Go Back
              </Button>
              <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800" onClick={() => navigate("/register-brand")}>
                Complete Brand Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="minimal" title="Create Campaign" />
      <div className="container px-4 py-4 md:px-6 md:py-6">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:grid-cols-[1fr_360px]">
          <div className="p-6 md:p-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">
                  <Zap size={12} />
                  Campaign Builder
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">Launch Campaign</h1>
                <p className="mt-1 text-sm text-slate-500">Define the brief, budget, and creator requirements in one flow.</p>
              </div>

              <div className="hidden gap-1.5 md:flex">
                {steps.map((item, index) => (
                  <div
                    key={item.label}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      index === step ? "w-8 bg-teal-500" : "w-1.5 bg-slate-200"
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-1.5 md:hidden">
                {steps.map((item, index) => (
                  <div
                    key={item.label}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      index === step ? "w-8 bg-teal-500" : "w-1.5 bg-slate-200"
                    )}
                  />
                ))}
              </div>
            </div>

            <CampaignForm
              step={step}
              isEdit={false}
              form={form}
              update={update}
              deliverableCounts={deliverableCounts}
              updateDeliverable={updateDeliverable}
              includeEventVisit={includeEventVisit}
              setIncludeEventVisit={setIncludeEventVisit}
              campaignDeliverables={campaignDeliverables}
              deliverableOptions={deliverableOptions}
            />

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                onClick={() => (step === 0 ? goBackOr(navigate, "/dashboard") : setStep((current) => current - 1))}
                className="h-12 w-full rounded-2xl border-slate-200 px-8 font-bold sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {step === 0 ? "Back" : "Previous"}
              </Button>

              {step < 2 ? (
                <Button
                  onClick={() => setStep((current) => current + 1)}
                  disabled={!canProceed(step)}
                  className="h-12 w-full rounded-2xl bg-slate-900 px-10 font-bold text-white hover:bg-slate-800 sm:w-auto"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreate}
                  disabled={submitting || !canProceed(step)}
                  className="h-12 w-full rounded-2xl bg-teal-600 px-10 font-bold text-white hover:bg-teal-700 sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      Launch Campaign
                      <Zap className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <aside className="hidden border-l border-slate-200 bg-slate-50/70 p-8 lg:flex">
            <div className="flex h-full flex-col">
              <div className="mb-6 inline-flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Live Preview</span>
              </div>

              <div className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-sm">
                <div className="relative z-10 flex flex-grow flex-col p-6">
                  <div className="mb-5 flex items-start">
                    <div className="min-w-0 flex items-center gap-4">
                      <BrandAvatar
                        brand={form.brand || "Brand"}
                        brandLogo={form.brandLogo}
                        className="h-14 w-14 shrink-0 rounded-2xl shadow-sm"
                        fallbackClassName="text-3xl"
                      />
                      <div className="min-w-0">
                        <h4 className="truncate font-display text-xl font-black tracking-wide text-gray-900">
                          {form.brand || "Brand Name"}
                        </h4>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge className={`rounded-md px-2 py-0 text-[10px] font-bold uppercase tracking-widest shadow-none ${previewNicheStyle}`}>
                            {form.niche || "Niche"}
                          </Badge>
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <MapPin size={10} className="text-gray-400" />
                            {form.city || "City"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mb-6 min-h-[40px] whitespace-pre-wrap break-all text-sm leading-relaxed text-gray-600">
                    {form.description || "Describe your campaign to preview how it appears to influencers."}
                  </p>

                  <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <div className="mb-5 flex items-end justify-between">
                      <div>
                        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">Campaign Budget</p>
                        <div className="flex items-end gap-1">
                          <span className="mb-0.5 text-lg font-bold text-teal-600">Rs.</span>
                          <span className="text-3xl font-black tracking-tight text-gray-900">{previewBudget.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-600 shadow-sm">
                          <Clock size={12} className={previewIsUrgent ? "text-rose-500" : "text-teal-600"} />
                          {form.deadline ? "Deadline set" : "TBD"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="mb-2.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
                        <Target size={10} /> Required Deliverables
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {campaignDeliverables.length > 0 ? (
                          campaignDeliverables.map((item, index) => (
                            <div key={`${item}-${index}`} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium tracking-wide text-gray-700 shadow-sm">
                              <Zap size={10} className="text-teal-500" />
                              {item}
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium tracking-wide text-gray-400 shadow-sm">
                            <Zap size={10} className="text-gray-300" />
                            No deliverables yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="mb-4 flex items-end justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          <span className={previewIsUrgent ? "text-rose-600" : "text-teal-600"}>
                            {previewSlots === 0 ? "No slots set" : previewSlotsLeft === 0 ? "No slots left" : `${previewSlotsLeft} slots left`}
                          </span>
                        </p>
                      </div>

                      {previewApplied > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {[...Array(Math.min(previewApplied, 3))].map((_, index) => (
                              <div key={index} className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-white bg-gray-100 text-gray-400 shadow-sm">
                                <Users size={12} />
                              </div>
                            ))}
                            {previewApplied > 3 && (
                              <div className="z-0 flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-white bg-gray-100 text-[10px] font-bold text-gray-600">
                                +{previewApplied - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-gray-500">{previewApplied} applied</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${previewIsUrgent ? "bg-rose-500" : "bg-teal-500"}`}
                        style={{ width: `${previewProgress}%` }}
                      />
                    </div>

                    <Button className="w-full rounded-xl bg-gray-900 py-3 font-bold tracking-wide text-white pointer-events-none hover:bg-gray-900">
                      Apply Now
                    </Button>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-0 bg-teal-50/[0.18]" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;

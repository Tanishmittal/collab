import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  IndianRupee,
  Layers,
  MapPin,
  Minus,
  Plus,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CITIES, NICHES } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { CampaignFormData, CampaignActivitySummary } from "@/hooks/useCampaignForm";

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

interface CampaignFormProps {
  step?: number;
  isEdit?: boolean;
  form: CampaignFormData;
  update: (field: keyof CampaignFormData, value: string | Date | undefined) => void;
  deliverableCounts: Record<string, number>;
  updateDeliverable: (label: string, delta: number) => void;
  includeEventVisit: boolean;
  setIncludeEventVisit: (value: boolean) => void;
  campaignDeliverables: string[];
  activitySummary?: CampaignActivitySummary;
  logoOptions: string[];
  deliverableOptions: readonly string[];
  onSubmit?: () => void;
  submitting?: boolean;
}

const CampaignForm = ({
  step = 0,
  isEdit = false,
  form,
  update,
  deliverableCounts,
  updateDeliverable,
  includeEventVisit,
  setIncludeEventVisit,
  campaignDeliverables,
  activitySummary,
  logoOptions,
  deliverableOptions,
  onSubmit,
  submitting = false,
}: CampaignFormProps) => {
  const targetingLocked = activitySummary ? activitySummary.applicationsCount > 0 : false;
  const commercialLocked = activitySummary ? (activitySummary.acceptedCount > 0 || activitySummary.bookingsCount > 0) : false;

  // Preview calculations
  const previewBudget = form.budget ? parseInt(form.budget, 10) : 0;
  const previewSlots = form.influencersNeeded ? parseInt(form.influencersNeeded, 10) : 0;
  const previewApplied = previewSlots > 0 ? Math.max(1, Math.min(previewSlots - 1, Math.floor(previewSlots * 0.6))) : 0;
  const previewProgress = previewSlots > 0 ? Math.min((previewApplied / previewSlots) * 100, 100) : 0;
  const previewSlotsLeft = Math.max(0, previewSlots - previewApplied);
  const previewIsUrgent = previewProgress >= 80 && previewSlotsLeft > 0;
  const previewNicheStyle = nicheColors[form.niche] || "text-teal-600 border-teal-200 bg-teal-50";

  if (isEdit) {
    // Edit mode: single form layout
    return (
      <div className="space-y-8">
        {(targetingLocked || commercialLocked) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {commercialLocked
              ? "This campaign already has accepted creators or linked bookings. Budget, targeting, deliverables, deadline, and required creator count are locked."
              : "This campaign already has applications. Keep the targeting stable for applicants, so creator count, niche, city, deliverables, and deadline are locked."}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-[1fr_88px]">
          <div className="space-y-2">
            <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Brand Name *</Label>
            <Input
              className="h-14 rounded-2xl border-slate-200 bg-slate-50 px-5 text-lg font-bold shadow-none"
              value={form.brand}
              onChange={(e) => update("brand", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="block text-center text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Mark</Label>
            <Select value={form.brandLogo} onValueChange={(value) => update("brandLogo", value)}>
              <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 text-xl font-bold shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200">
                {logoOptions.map((option) => (
                  <SelectItem key={option} value={option} className="font-bold">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Primary City *</Label>
            <Select value={form.city} onValueChange={(value) => update("city", value)}>
              <SelectTrigger disabled={targetingLocked} className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-5 font-bold shadow-none">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200">
                {CITIES.map((city) => (
                  <SelectItem key={city} value={city} className="font-bold">
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Core Niche *</Label>
            <Select value={form.niche} onValueChange={(value) => update("niche", value)}>
              <SelectTrigger disabled={targetingLocked} className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-5 font-bold shadow-none">
                <SelectValue placeholder="Select niche" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200">
                {NICHES.map((niche) => (
                  <SelectItem key={niche} value={niche} className="font-bold">
                    {niche}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Brief Description *</Label>
          <Textarea
            className="min-h-[160px] rounded-2xl border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed shadow-none"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Budget (Rs.) *</Label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="number"
                disabled={commercialLocked}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 font-bold shadow-none"
                value={form.budget}
                onChange={(e) => update("budget", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Creators Needed *</Label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="number"
                disabled={targetingLocked}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 font-bold shadow-none"
                value={form.influencersNeeded}
                onChange={(e) => update("influencersNeeded", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Requested Deliverables</Label>
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            {deliverableOptions.map((label) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                  <p className="text-xs text-slate-400">Adjust how many of this deliverable you want.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl border-slate-200"
                    onClick={() => updateDeliverable(label, -1)}
                    disabled={targetingLocked || deliverableCounts[label] === 0}
                  >
                    <Minus size={16} />
                  </Button>
                  <div className="w-10 text-center text-base font-bold text-slate-900">{deliverableCounts[label]}</div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl border-slate-200"
                    onClick={() => updateDeliverable(label, 1)}
                    disabled={targetingLocked}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Event Visit</p>
                <p className="text-xs text-slate-400">Turn this on if the creator needs to appear in person.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={targetingLocked}
                className={cn(
                  "rounded-xl border-slate-200 px-4 font-semibold",
                  includeEventVisit && "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                )}
                onClick={() => setIncludeEventVisit(!includeEventVisit)}
              >
                {includeEventVisit ? "Included" : "Add"}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Application Deadline</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={targetingLocked}
                className={cn(
                  "h-14 w-full justify-start rounded-2xl border-slate-200 bg-slate-50 px-5 text-left font-bold shadow-none hover:bg-slate-100",
                  !form.deadline && "text-slate-400"
                )}
              >
                <CalendarIcon className="mr-3 h-5 w-5 text-teal-600/80" />
                {form.deadline ? format(form.deadline, "PPP") : <span>Set closing date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto rounded-2xl border-slate-200 p-0 shadow-xl" align="start">
              <Calendar
                mode="single"
                selected={form.deadline}
                onSelect={(date) => update("deadline", date)}
                initialFocus
                className="rounded-2xl"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-6">
          <Button
            className="rounded-2xl bg-teal-600 px-10 font-bold text-white hover:bg-teal-700"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save Campaign"} <CheckCircle className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Create mode: wizard layout
  if (step === 0) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-[1fr_88px]">
          <div className="space-y-2">
            <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Brand Name *</Label>
            <Input
              placeholder="e.g. Burger Cafe"
              className="h-14 rounded-2xl border-slate-200 bg-slate-50 px-5 text-lg font-bold shadow-none"
              value={form.brand}
              onChange={(e) => update("brand", e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label className="block text-center text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Mark</Label>
            <Select value={form.brandLogo} onValueChange={(value) => update("brandLogo", value)}>
              <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 text-xl font-bold shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200">
                {logoOptions.map((option) => (
                  <SelectItem key={option} value={option} className="font-bold">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Primary City *</Label>
            <Select value={form.city} onValueChange={(value) => update("city", value)}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-5 font-bold shadow-none">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200">
                {CITIES.map((city) => (
                  <SelectItem key={city} value={city} className="font-bold">
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Core Niche *</Label>
            <Select value={form.niche} onValueChange={(value) => update("niche", value)}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-5 font-bold shadow-none">
                <SelectValue placeholder="Select niche" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200">
                {NICHES.map((niche) => (
                  <SelectItem key={niche} value={niche} className="font-bold">
                    {niche}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Brief Description *</Label>
          <Textarea
            placeholder="Describe the campaign goals, audience, and what kind of creators you want."
            className="min-h-[180px] rounded-2xl border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed shadow-none"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            maxLength={1000}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Budget (Rs.) *</Label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="number"
                placeholder="e.g. 25000"
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 font-bold shadow-none"
                value={form.budget}
                onChange={(e) => update("budget", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Creators Needed *</Label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="number"
                placeholder="e.g. 10"
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 font-bold shadow-none"
                value={form.influencersNeeded}
                onChange={(e) => update("influencersNeeded", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Requested Deliverables</Label>
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            {deliverableOptions.map((label) => (
              <div key={label} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                  <p className="text-xs text-slate-400">Adjust how many of this deliverable you want.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl border-slate-200"
                    onClick={() => updateDeliverable(label, -1)}
                    disabled={deliverableCounts[label] === 0}
                  >
                    <Minus size={16} />
                  </Button>
                  <div className="w-10 text-center text-base font-bold text-slate-900">{deliverableCounts[label]}</div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl border-slate-200"
                    onClick={() => updateDeliverable(label, 1)}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Event Visit</p>
                <p className="text-xs text-slate-400">Turn this on if the creator needs to appear in person.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "rounded-xl border-slate-200 px-4 font-semibold",
                  includeEventVisit && "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                )}
                onClick={() => setIncludeEventVisit(!includeEventVisit)}
              >
                {includeEventVisit ? "Included" : "Add"}
              </Button>
            </div>
          </div>
          <p className="ml-1 text-[10px] font-medium italic text-slate-400">Select at least one deliverable to continue.</p>
        </div>

        <div className="space-y-2">
          <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Application Deadline</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-14 w-full justify-start rounded-2xl border-slate-200 bg-slate-50 px-5 text-left font-bold shadow-none hover:bg-slate-100",
                  !form.deadline && "text-slate-400"
                )}
              >
                <CalendarIcon className="mr-3 h-5 w-5 text-teal-600/80" />
                {form.deadline ? format(form.deadline, "PPP") : <span>Set closing date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto rounded-2xl border-slate-200 p-0 shadow-xl" align="start">
              <Calendar
                mode="single"
                selected={form.deadline}
                onSelect={(date) => update("deadline", date)}
                initialFocus
                disabled={(date) => date < new Date()}
                className="rounded-2xl"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-start gap-4 rounded-3xl border border-teal-100 bg-teal-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
            <CheckCircle className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <p className="mb-0.5 text-xs font-bold uppercase tracking-wide text-teal-700">Final Check</p>
            <p className="text-[11px] font-medium leading-relaxed text-teal-700/80">
              Double check the budget, slots, and deliverables. Influencers will apply based on these terms.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CampaignForm;
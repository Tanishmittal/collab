import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Target,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BUSINESS_TYPES,
  DELIVERABLE_OPTIONS,
  CAMPAIGN_GOALS,
  RESPONSE_TIME_OPTIONS,
  BrandFormData,
} from "@/hooks/useBrandRegistration";
import { useManagedOptions } from "@/hooks/useManagedOptions";
import { useAuth } from "@/contexts/AuthContext";
import AvatarUpload from "@/components/AvatarUpload";
import { LocationPicker } from "@/components/LocationPicker";
import { LocationMultiPicker } from "@/components/LocationMultiPicker";

const STEPS = [
  { icon: Building2, label: "Identity" },
  { icon: Target, label: "Fit" },
  { icon: ShieldCheck, label: "Review" },
];

interface BrandRegistrationFormProps {
  step: number;
  setStep: (step: number) => void;
  submitting: boolean;
  form: BrandFormData;
  update: (field: keyof BrandFormData, value: string | string[]) => void;
  toggleArrayItem: (field: "targetNiches" | "targetCities" | "deliverablePreferences" | "campaignGoals", value: string) => void;
  canProceed: () => boolean;
  handleSubmit: () => void;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</Label>
    {children}
  </div>
);

const TagPicker = ({
  label,
  options,
  values,
  onToggle,
}: {
  label: string;
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}) => (
  <div className="space-y-3">
    <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</Label>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = values.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
              selected
                ? "border-orange-200 bg-orange-50 text-orange-600 shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  </div>
);

const BrandRegistrationForm = ({
  step,
  setStep,
  submitting,
  form,
  update,
  toggleArrayItem,
  canProceed,
  handleSubmit,
}: BrandRegistrationFormProps) => {
  const { user } = useAuth();
  const { cities, niches } = useManagedOptions();

  const renderStepIndicator = () => (
    <div className="mb-8 flex items-center justify-center gap-3 sm:gap-5">
      {STEPS.map((stepItem, index) => {
        const Icon = stepItem.icon;
        const active = index === step;
        const completed = index < step;

        return (
          <div key={stepItem.label} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-all ${
                  completed
                    ? "border-orange-500 bg-orange-500 text-white"
                    : active
                    ? "border-orange-200 bg-orange-50 text-orange-500"
                    : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-[0.18em] ${active || completed ? "text-slate-900" : "text-slate-400"}`}>
                {stepItem.label}
              </span>
            </div>
            {index < STEPS.length - 1 && <div className="hidden h-px w-10 bg-slate-200 sm:block" />}
          </div>
        );
      })}
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Brand Avatar">
                <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {user && (
                    <AvatarUpload
                      userId={user.id}
                      currentUrl={form.logoUrl}
                      initials={(form.businessName.trim().charAt(0) || "B").toUpperCase()}
                      onUploaded={(url) => update("logoUrl", url)}
                      onRemove={() => update("logoUrl", "")}
                      size="md"
                    />
                  )}
                  <div className="pt-1">
                    <p className="text-sm font-semibold text-slate-900">Upload your brand mark or logo</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      This image will appear on your public brand profile and on campaign cards.
                    </p>
                  </div>
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Business Name *">
                <Input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="e.g. Blue Tokai" className="h-12 rounded-2xl bg-slate-50 font-medium" />
              </Field>
              <Field label="Category *">
                <Select value={form.businessType} onValueChange={(value) => update("businessType", value)}>
                  <SelectTrigger className="h-12 rounded-2xl bg-slate-50">
                    <SelectValue placeholder="Select a business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Base City *">
                <LocationPicker
                  value={form.city}
                  onChange={(value) => update("city", value)}
                  placeholder="Select your primary city"
                  className="h-12 w-full justify-between rounded-2xl bg-slate-50 font-medium border-slate-200 shadow-none border"
                />
              </Field>
              <Field label="Brand Tagline">
                <Input value={form.brandTagline} onChange={(e) => update("brandTagline", e.target.value)} placeholder="Short one-line positioning" className="h-12 rounded-2xl bg-slate-50 font-medium" />
              </Field>
            </div>

            <Field label="Brand Narrative">
              <Textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="What do you sell, who do you serve, and what kind of campaigns do you run?"
                className="min-h-[120px] rounded-2xl bg-slate-50 p-4 font-medium"
                maxLength={600}
              />
            </Field>
          </motion.div>
        );

      case 1:
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <TagPicker
              label="Target Creator Niches *"
              options={niches}
              values={form.targetNiches}
              onToggle={(value) => toggleArrayItem("targetNiches", value)}
            />

            <div className="space-y-3">
              <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Priority Cities *</Label>
              <LocationMultiPicker
                values={form.targetCities}
                onChange={(value) => toggleArrayItem("targetCities", value)}
                className="w-full h-12 bg-slate-50 border-slate-200"
              />
              {form.targetCities.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {form.targetCities.map((city) => (
                    <span key={city} className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                      {city}
                      <button onClick={() => toggleArrayItem("targetCities", city)} className="ml-2 text-slate-400 hover:text-slate-600">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <TagPicker
              label="Preferred Deliverables *"
              options={DELIVERABLE_OPTIONS}
              values={form.deliverablePreferences}
              onToggle={(value) => toggleArrayItem("deliverablePreferences", value)}
            />

            <TagPicker
              label="Campaign Goals"
              options={CAMPAIGN_GOALS}
              values={form.campaignGoals}
              onToggle={(value) => toggleArrayItem("campaignGoals", value)}
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Campaigns Per Month">
                <Input value={form.campaignsPerMonth} onChange={(e) => update("campaignsPerMonth", e.target.value)} type="number" placeholder="Campaigns / month" className="h-12 rounded-2xl bg-slate-50 font-medium" />
              </Field>
              <Field label="Response Time">
                <Select value={form.responseTimeExpectation} onValueChange={(value) => update("responseTimeExpectation", value)}>
                  <SelectTrigger className="h-12 rounded-2xl bg-slate-50">
                    <SelectValue placeholder="How quickly do you reply?" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPONSE_TIME_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Creator Requirements">
              <Textarea
                value={form.creatorRequirements}
                onChange={(e) => update("creatorRequirements", e.target.value)}
                placeholder="What kind of creators, audience quality, style, or campaign fit do you expect?"
                className="min-h-[110px] rounded-2xl bg-slate-50 p-4 font-medium"
                maxLength={500}
              />
            </Field>
          </motion.div>
        );

      case 2:
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50/80 p-6">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-orange-500 to-orange-400 text-2xl font-black text-white shadow-lg shadow-orange-500/20">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt={form.businessName || "Brand"} className="h-full w-full object-cover" />
                  ) : (
                    form.businessName.charAt(0).toUpperCase() || "?"
                  )}
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold tracking-tight text-slate-950">{form.businessName || "New Brand"}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    <span>{form.city || "Unset city"}</span>
                    <span>•</span>
                    <span>{form.businessType || "Unset category"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SummaryField icon={<Users className="h-4 w-4 text-orange-500" />} label="Representative" value={form.contactName || "Not specified"} />
                <SummaryField icon={<Mail className="h-4 w-4 text-orange-500" />} label="Business Email" value={form.email || "Not specified"} />
                <SummaryField icon={<Phone className="h-4 w-4 text-orange-500" />} label="Phone" value={form.phone || "Optional"} />
                <SummaryField icon={<Globe className="h-4 w-4 text-orange-500" />} label="Website" value={form.website || "Optional"} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniMetric icon={<Briefcase className="h-4 w-4 text-orange-500" />} label="Deliverables" value={String(form.deliverablePreferences.length || 0)} />
                <MiniMetric icon={<Target className="h-4 w-4 text-orange-500" />} label="Goals" value={String(form.campaignGoals.length || 0)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Contact Name">
                <Input value={form.contactName} onChange={(e) => update("contactName", e.target.value)} placeholder="Primary contact person" className="h-12 rounded-2xl bg-slate-50 font-medium" />
              </Field>
              <Field label="Email *">
                <Input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" placeholder="hello@brand.com" className="h-12 rounded-2xl bg-slate-50 font-medium" />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Contact number" className="h-12 rounded-2xl bg-slate-50 font-medium" />
              </Field>
              <Field label="Website">
                <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="brand.com" className="h-12 rounded-2xl bg-slate-50 font-medium" />
              </Field>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-700">
              Public brand profiles should help creators understand brand fit. Budget stays at campaign level and is set when you create a campaign.
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {renderStepIndicator()}

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0 || submitting} className="rounded-xl">
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed() || submitting} className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
              Next
              <ArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-500 hover:to-orange-500">
              {submitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Create Profile
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryField = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-2xl bg-white p-4">
    <div className="mb-1 flex items-center gap-2 text-slate-400">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{label}</span>
    </div>
    <div className="text-sm font-semibold text-slate-900">{value}</div>
  </div>
);

const MiniMetric = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-2xl bg-white p-3">
    <div className="mb-1 flex items-center gap-2 text-slate-400">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{label}</span>
    </div>
    <div className="text-sm font-bold text-slate-900">{value}</div>
  </div>
);

export default BrandRegistrationForm;

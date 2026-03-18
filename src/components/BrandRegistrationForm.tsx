import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Target,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Rocket,
  Info,
  Loader2,
  Briefcase,
  Users,
  Mail,
  Phone,
  Globe,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { CITIES, NICHES } from "@/data/mockData";
import {
  BUSINESS_TYPES,
  DELIVERABLE_OPTIONS,
  CAMPAIGN_GOALS,
  RESPONSE_TIME_OPTIONS,
  BrandFormData,
} from "@/hooks/useBrandRegistration";

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
  isModal?: boolean;
  onClose?: () => void;
}

const BrandRegistrationForm = ({
  step,
  setStep,
  submitting,
  form,
  update,
  toggleArrayItem,
  canProceed,
  handleSubmit,
  isModal = false,
  onClose,
}: BrandRegistrationFormProps) => {
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-4 mb-8">
      {STEPS.map((stepItem, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
              index <= step ? "border-primary bg-primary text-primary-foreground" : "border-slate-200 text-slate-400"
            }`}
          >
            <stepItem.icon size={16} />
          </div>
          <span className={`text-sm font-medium ${index <= step ? "text-primary" : "text-slate-400"}`}>
            {stepItem.label}
          </span>
          {index < STEPS.length - 1 && <div className="h-px w-8 bg-slate-200" />}
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
      <div className="space-y-2">
        <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">{label}</Label>
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
        <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">{label}</Label>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const selected = values.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onToggle(option)}
                className={`rounded-xl border-2 px-4 py-2 text-[10px] font-black uppercase tracking-tight transition-all ${
                  selected
                    ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5"
                    : "border-muted bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    );

    switch (step) {
      case 0:
        return isModal ? (
          <div className="mx-auto max-w-lg space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Business Name *">
                <Input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="e.g. Blue Tokai" className="h-12 rounded-2xl bg-muted/30 font-medium" />
              </Field>
              <Field label="Category *">
                <Select value={form.businessType} onValueChange={(value) => update("businessType", value)}>
                  <SelectTrigger className="h-12 rounded-2xl bg-muted/30">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Base City *">
                <Select value={form.city} onValueChange={(value) => update("city", value)}>
                  <SelectTrigger className="h-12 rounded-2xl bg-muted/30">
                    <SelectValue placeholder="Select primary location" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Brand Tagline">
                <Input value={form.brandTagline} onChange={(e) => update("brandTagline", e.target.value)} placeholder="Short one-line positioning" className="h-12 rounded-2xl bg-muted/30 font-medium" />
              </Field>
            </div>

            <Field label="Brand Narrative *">
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What do you sell, who do you serve, and what kind of campaigns do you run?" className="min-h-[120px] rounded-2xl bg-muted/30 p-4 font-medium" maxLength={600} />
            </Field>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                placeholder="Enter your business name"
                value={form.businessName}
                onChange={(e) => update("businessName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type *</Label>
              <Select value={form.businessType} onValueChange={(value) => update("businessType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Select value={form.city} onValueChange={(value) => update("city", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your city" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandTagline">Brand Tagline (Optional)</Label>
              <Input
                id="brandTagline"
                placeholder="A short catchy phrase about your brand"
                value={form.brandTagline}
                onChange={(e) => update("brandTagline", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                placeholder="Tell us about your business, what you do, and your mission..."
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
              />
            </div>
          </motion.div>
        );

      case 1:
        return isModal ? (
          <div className="mx-auto max-w-lg space-y-6">
            <TagPicker
              label="Target Creator Niches *"
              options={NICHES}
              values={form.targetNiches}
              onToggle={(value) => toggleArrayItem("targetNiches", value)}
            />

            <TagPicker
              label="Priority Cities *"
              options={CITIES}
              values={form.targetCities}
              onToggle={(value) => toggleArrayItem("targetCities", value)}
            />

            <TagPicker
              label="Deliverable Preferences"
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
              <Field label="Campaign Frequency">
                <Input value={form.campaignsPerMonth} onChange={(e) => update("campaignsPerMonth", e.target.value)} type="number" placeholder="Campaigns / month" className="h-12 rounded-2xl bg-muted/30 font-medium" />
              </Field>
              <Field label="Response Time">
                <Select value={form.responseTimeExpectation} onValueChange={(value) => update("responseTimeExpectation", value)}>
                  <SelectTrigger className="h-12 rounded-2xl bg-muted/30">
                    <SelectValue placeholder="How quickly do you reply?" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPONSE_TIME_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Creator Requirements">
              <Textarea value={form.creatorRequirements} onChange={(e) => update("creatorRequirements", e.target.value)} placeholder="What kind of creators, audience quality, style, or campaign fit do you expect?" className="min-h-[110px] rounded-2xl bg-muted/30 p-4 font-medium" maxLength={500} />
            </Field>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="space-y-3">
              <Label>Target Creator Niches *</Label>
              <div className="grid grid-cols-2 gap-2">
                {NICHES.map((niche) => (
                  <div key={niche} className="flex items-center space-x-2">
                    <Checkbox
                      id={`niche-${niche}`}
                      checked={form.targetNiches.includes(niche)}
                      onCheckedChange={() => toggleArrayItem("targetNiches", niche)}
                    />
                    <Label htmlFor={`niche-${niche}`} className="text-sm">
                      {niche}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Target Cities *</Label>
              <div className="grid grid-cols-2 gap-2">
                {CITIES.slice(0, 8).map((city) => (
                  <div key={city} className="flex items-center space-x-2">
                    <Checkbox
                      id={`city-${city}`}
                      checked={form.targetCities.includes(city)}
                      onCheckedChange={() => toggleArrayItem("targetCities", city)}
                    />
                    <Label htmlFor={`city-${city}`} className="text-sm">
                      {city}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Preferred Deliverables *</Label>
              <div className="grid grid-cols-1 gap-2">
                {DELIVERABLE_OPTIONS.map((deliverable) => (
                  <div key={deliverable} className="flex items-center space-x-2">
                    <Checkbox
                      id={`deliverable-${deliverable}`}
                      checked={form.deliverablePreferences.includes(deliverable)}
                      onCheckedChange={() => toggleArrayItem("deliverablePreferences", deliverable)}
                    />
                    <Label htmlFor={`deliverable-${deliverable}`} className="text-sm">
                      {deliverable}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Campaign Goals</Label>
              <div className="grid grid-cols-1 gap-2">
                {CAMPAIGN_GOALS.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={`goal-${goal}`}
                      checked={form.campaignGoals.includes(goal)}
                      onCheckedChange={() => toggleArrayItem("campaignGoals", goal)}
                    />
                    <Label htmlFor={`goal-${goal}`} className="text-sm">
                      {goal}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="creatorRequirements">Creator Requirements</Label>
              <Textarea
                id="creatorRequirements"
                placeholder="Any specific requirements for creators you work with?"
                value={form.creatorRequirements}
                onChange={(e) => update("creatorRequirements", e.target.value)}
                rows={3}
              />
            </div>
          </motion.div>
        );

      case 2:
        return isModal ? (
          <div className="mx-auto max-w-lg space-y-6">
            <div className="relative overflow-hidden rounded-[2rem] border border-muted bg-muted/30 p-6">
              <div className="absolute right-0 top-0 p-4">
                <ShieldCheck className="h-10 w-10 text-primary/20" />
              </div>
              <div className="mb-6 flex items-center gap-4">
                <div className="gradient-primary flex h-16 w-16 items-center justify-center rounded-[1.5rem] text-3xl font-black text-white shadow-xl">
                  {form.businessName.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <h3 className="font-display text-xl font-black leading-none tracking-tight">{form.businessName || "New Brand"}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>{form.city || "Unset city"}</span>
                    <span>·</span>
                    <span>{form.businessType || "Unset category"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Representative *">
                  <Input value={form.contactName} onChange={(e) => update("contactName", e.target.value)} placeholder="Your full name" className="h-10 rounded-xl border-none bg-background/50 font-medium" />
                </Field>
                <Field label="Business Email *">
                  <Input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" placeholder="hello@brand.com" className="h-10 rounded-xl border-none bg-background/50 font-medium" />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Contact number" className="h-10 rounded-xl border-none bg-background/50 font-medium" />
                </Field>
                <Field label="Website">
                  <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="brand.com" className="h-10 rounded-xl border-none bg-background/50 font-medium" />
                </Field>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-background/60 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Deliverables</span>
                  </div>
                  <div className="text-sm font-bold text-foreground">{form.deliverablePreferences.length || 0}</div>
                </div>
                <div className="rounded-xl bg-background/60 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Goals</span>
                  </div>
                  <div className="text-sm font-bold text-foreground">{form.campaignGoals.length || 0}</div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-[11px] font-medium leading-relaxed text-primary/80">
                Public brand profiles should help creators understand brand fit. Budget is intentionally left out here and should be set at campaign level.
              </p>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Review Your Information</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-slate-500 uppercase tracking-wide">Business Info</h4>
                      <div className="mt-2 space-y-1">
                        <p><strong>{form.businessName}</strong></p>
                        <p className="text-sm text-slate-600">{form.businessType}</p>
                        <p className="text-sm text-slate-600 flex items-center gap-1">
                          <MapPin size={14} />
                          {form.city}
                        </p>
                        {form.brandTagline && <p className="text-sm italic">"{form.brandTagline}"</p>}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-slate-500 uppercase tracking-wide">Contact</h4>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm flex items-center gap-1">
                          <Users size={14} />
                          {form.contactName || "Not specified"}
                        </p>
                        <p className="text-sm flex items-center gap-1">
                          <Mail size={14} />
                          {form.email || "Not specified"}
                        </p>
                        {form.phone && (
                          <p className="text-sm flex items-center gap-1">
                            <Phone size={14} />
                            {form.phone}
                          </p>
                        )}
                        {form.website && (
                          <p className="text-sm flex items-center gap-1">
                            <Globe size={14} />
                            {form.website}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-slate-500 uppercase tracking-wide">Description</h4>
                    <p className="mt-2 text-sm">{form.description || "No description provided."}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-slate-500 uppercase tracking-wide">Target Niches</h4>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {form.targetNiches.map((niche) => (
                          <span key={niche} className="px-2 py-1 bg-slate-100 rounded text-xs">
                            {niche}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-slate-500 uppercase tracking-wide">Target Cities</h4>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {form.targetCities.map((city) => (
                          <span key={city} className="px-2 py-1 bg-slate-100 rounded text-xs">
                            {city}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-slate-500 uppercase tracking-wide">Preferences</h4>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs"><strong>Deliverables:</strong> {form.deliverablePreferences.join(", ")}</p>
                        <p className="text-xs"><strong>Goals:</strong> {form.campaignGoals.join(", ")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaignsPerMonth">Campaigns per Month</Label>
                <Input
                  id="campaignsPerMonth"
                  type="number"
                  placeholder="How many campaigns do you run monthly?"
                  value={form.campaignsPerMonth}
                  onChange={(e) => update("campaignsPerMonth", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  placeholder="Primary contact person"
                  value={form.contactName}
                  onChange={(e) => update("contactName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@yourbusiness.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  placeholder="+91 XXXXX XXXXX"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  placeholder="https://yourwebsite.com"
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responseTime">Response Time Expectation</Label>
                <Select value={form.responseTimeExpectation} onValueChange={(value) => update("responseTimeExpectation", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="How quickly do you respond to creators?" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPONSE_TIME_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={isModal ? "p-8" : "container max-w-2xl space-y-6"}>
      {isModal && (
        <>
          <div className="relative mx-auto mb-10 flex max-w-md items-center justify-between px-4">
            {STEPS.map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = index === step;
              const isDone = index < step;
              return (
                <div key={stepItem.label} className="relative z-10 flex flex-col items-center gap-2.5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500 ${
                    isDone
                      ? "gradient-primary rotate-[360deg] text-white"
                      : isActive
                      ? "scale-110 border-2 border-primary bg-primary/10 text-primary shadow-xl shadow-primary/10"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isDone ? <CheckCircle className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {stepItem.label}
                  </span>
                </div>
              );
            })}
            <div className="absolute left-0 right-0 top-6 -z-0 mx-12 h-0.5 bg-muted" />
            <div className="absolute left-0 top-6 -z-0 mx-12 h-0.5 bg-primary transition-all duration-500" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </>
      )}

      {!isModal && renderStepIndicator()}

      <div className="min-h-[420px]">
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
      </div>

      {isModal && (
        <div className="mt-8 flex items-center justify-between border-t border-muted pt-6">
          <Button variant="outline" size="sm" onClick={() => setStep((current) => current - 1)} disabled={step === 0} className="h-12 rounded-2xl px-6 font-bold">
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>

          <div className="flex items-center gap-1.5">
            {STEPS.map((_, index) => (
              <div key={index} className={`h-1.5 rounded-full transition-all duration-300 ${index === step ? "w-6 bg-primary" : "w-1.5 bg-muted"}`} />
            ))}
          </div>

          {step < 2 ? (
            <Button size="sm" onClick={() => setStep((current) => current + 1)} disabled={!canProceed()} className="gradient-primary h-12 rounded-2xl border-0 px-8 font-black uppercase tracking-tight text-white">
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={submitting} className="gradient-primary h-12 rounded-2xl border-0 px-8 font-black uppercase tracking-tight text-white">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : <>Create Account <CheckCircle className="ml-2 h-4 w-4" /></>}
            </Button>
          )}
        </div>
      )}

      {!isModal && (
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => {
              if (step > 0) {
                setStep(step - 1);
              } else if (onClose) {
                onClose();
              }
            }}
            disabled={submitting}
          >
            <ArrowLeft size={16} className="mr-2" />
            {step > 0 ? "Back" : "Cancel"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed() || submitting}
            >
              Next
              <ArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="min-w-[120px]"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Rocket size={16} className="mr-2" />
                  Create Profile
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandRegistrationForm;
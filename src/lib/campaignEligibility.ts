type CampaignEligibilityCampaign = {
  city: string;
  niche: string;
  deliverables?: string[] | null;
  min_followers?: number | null;
  min_engagement_rate?: number | null;
  target_platforms?: string[] | null;
  verified_socials_only?: boolean | null;
  portfolio_required?: boolean | null;
};

type CampaignEligibilityInfluencer = {
  city: string;
  niche: string;
  followers: string;
  engagement_rate?: string | null;
  platforms?: string[] | null;
  is_verified?: boolean | null;
  price_reel?: number | null;
  price_story?: number | null;
  price_visit?: number | null;
};

export type CampaignEligibilityResult = {
  eligible: boolean;
  reasons: string[];
  shortLabel: string;
};

export const parseFollowerCount = (value: string | null | undefined) => {
  if (!value) return 0;
  const normalized = value.trim().toLowerCase().replace(/,/g, "");
  if (!normalized) return 0;

  if (normalized.endsWith("m")) {
    return Math.round(parseFloat(normalized.slice(0, -1)) * 1_000_000);
  }

  if (normalized.endsWith("k")) {
    return Math.round(parseFloat(normalized.slice(0, -1)) * 1_000);
  }

  const numeric = Number(normalized.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const parseEngagementRate = (value: string | null | undefined) => {
  if (!value) return 0;
  const numeric = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeDeliverable = (deliverable: string) => deliverable.toLowerCase();

const requiresReelPricing = (deliverable: string) => normalizeDeliverable(deliverable).includes("reel");
const requiresStoryPricing = (deliverable: string) => normalizeDeliverable(deliverable).includes("story");
const requiresVisitPricing = (deliverable: string) => {
  const normalized = normalizeDeliverable(deliverable);
  return normalized.includes("event visit") || normalized.includes("visit");
};

export const getCampaignEligibility = (
  campaign: CampaignEligibilityCampaign,
  influencer: CampaignEligibilityInfluencer | null,
  hasPortfolio: boolean
): CampaignEligibilityResult => {
  if (!influencer) {
    return {
      eligible: false,
      reasons: ["Create your influencer profile to apply."],
      shortLabel: "Profile required",
    };
  }

  const reasons: string[] = [];

  if (campaign.city && influencer.city !== campaign.city) {
    reasons.push(`Available for ${campaign.city} creators only.`);
  }

  if (campaign.niche && influencer.niche !== campaign.niche) {
    reasons.push(`Best suited for ${campaign.niche} creators.`);
  }

  if ((campaign.target_platforms || []).length > 0) {
    const influencerPlatforms = new Set((influencer.platforms || []).map((platform) => platform.toLowerCase()));
    const matchesPlatform = (campaign.target_platforms || []).some((platform) => influencerPlatforms.has(platform.toLowerCase()));
    if (!matchesPlatform) {
      reasons.push(`Requires ${campaign.target_platforms?.join(" or ")}.`);
    }
  }

  const followerCount = parseFollowerCount(influencer.followers);
  if (campaign.min_followers && followerCount < campaign.min_followers) {
    reasons.push(`Needs ${campaign.min_followers.toLocaleString()}+ followers.`);
  }

  const engagementRate = parseEngagementRate(influencer.engagement_rate);
  if (campaign.min_engagement_rate && engagementRate < campaign.min_engagement_rate) {
    reasons.push(`Needs ${campaign.min_engagement_rate}%+ engagement.`);
  }

  if (campaign.verified_socials_only && (!influencer.is_verified || (influencer.platforms || []).length === 0)) {
    reasons.push("Verified socials required.");
  }

  if (campaign.portfolio_required && !hasPortfolio) {
    reasons.push("Portfolio required.");
  }

  const deliverables = campaign.deliverables || [];
  if (deliverables.some(requiresReelPricing) && !(influencer.price_reel && influencer.price_reel > 0)) {
    reasons.push("Missing reel pricing.");
  }
  if (deliverables.some(requiresStoryPricing) && !(influencer.price_story && influencer.price_story > 0)) {
    reasons.push("Missing story pricing.");
  }
  if (deliverables.some(requiresVisitPricing) && !(influencer.price_visit && influencer.price_visit > 0)) {
    reasons.push("Missing visit pricing.");
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    shortLabel: reasons.length === 0 ? "Eligible" : reasons[0],
  };
};

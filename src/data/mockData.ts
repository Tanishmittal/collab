export interface Influencer {
  id: string;
  name: string;
  city: string;
  niche: string;
  followers: string;
  engagementRate: number;
  platforms: string[];
  priceReel: number;
  priceStory: number;
  priceVisit: number;
  avatar: string;
  coverUrl?: string;
  rating: number;
  completedCampaigns: number;
  bio: string;
  isVerified?: boolean;
}

export interface Campaign {
  id: string;
  brand: string;
  brandLogo: string;
  city: string;
  budget: number;
  influencersNeeded: number;
  influencersApplied: number;
  deliverables: string[];
  niche: string;
  status: "active" | "completed" | "draft";
  postedAt: string;
  deadline?: string;
  description: string;
}

export const CITIES = ["Meerut", "Delhi", "Noida", "Mumbai", "Bangalore", "Pune", "Jaipur", "Lucknow"];
export const NICHES = ["Food", "Fitness", "Fashion", "Tech", "Travel", "Lifestyle", "Beauty", "Comedy"];

export const influencers: Influencer[] = [
  { id: "1", name: "Rahul Sharma", city: "Meerut", niche: "Food", followers: "32K", engagementRate: 4.8, platforms: ["Instagram", "YouTube"], priceReel: 2500, priceStory: 700, priceVisit: 5000, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul", rating: 4.9, completedCampaigns: 45, bio: "Food explorer sharing hidden gems of Meerut's street food culture" },
  { id: "2", name: "Priya Singh", city: "Delhi", niche: "Fashion", followers: "85K", engagementRate: 5.2, platforms: ["Instagram"], priceReel: 5000, priceStory: 1500, priceVisit: 8000, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya", rating: 4.7, completedCampaigns: 62, bio: "Delhi's go-to fashion influencer for ethnic & modern fusion" },
  { id: "3", name: "Amit Verma", city: "Noida", niche: "Fitness", followers: "120K", engagementRate: 6.1, platforms: ["Instagram", "YouTube"], priceReel: 7000, priceStory: 2000, priceVisit: 10000, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amit", rating: 4.8, completedCampaigns: 38, bio: "Certified trainer helping you transform your lifestyle" },
  { id: "4", name: "Sneha Gupta", city: "Meerut", niche: "Lifestyle", followers: "18K", engagementRate: 7.3, platforms: ["Instagram"], priceReel: 1500, priceStory: 400, priceVisit: 3000, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha", rating: 5.0, completedCampaigns: 22, bio: "Lifestyle & home decor enthusiast from the heart of Meerut" },
  { id: "5", name: "Vikram Patel", city: "Mumbai", niche: "Tech", followers: "200K", engagementRate: 3.9, platforms: ["YouTube", "Twitter"], priceReel: 12000, priceStory: 3000, priceVisit: 15000, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram", rating: 4.6, completedCampaigns: 89, bio: "Gadget reviews and tech tutorials for the Indian audience" },
  { id: "6", name: "Anita Joshi", city: "Delhi", niche: "Food", followers: "55K", engagementRate: 5.8, platforms: ["Instagram", "YouTube"], priceReel: 4000, priceStory: 1200, priceVisit: 6000, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anita", rating: 4.9, completedCampaigns: 51, bio: "Exploring Delhi's food scene one bite at a time" },
  { id: "7", name: "Karan Mehta", city: "Bangalore", niche: "Comedy", followers: "150K", engagementRate: 8.2, platforms: ["Instagram", "YouTube"], priceReel: 8000, priceStory: 2500, priceVisit: 12000, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Karan", rating: 4.5, completedCampaigns: 34, bio: "Making Bangalore laugh with relatable content" },
  { id: "8", name: "Ritu Agarwal", city: "Jaipur", niche: "Travel", followers: "67K", engagementRate: 4.5, platforms: ["Instagram"], priceReel: 3500, priceStory: 900, priceVisit: 5500, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ritu", rating: 4.8, completedCampaigns: 41, bio: "Discovering Rajasthan's royal heritage and hidden spots" },
  { id: "9", name: "Deepak Kumar", city: "Meerut", niche: "Fitness", followers: "28K", engagementRate: 6.8, platforms: ["Instagram", "YouTube"], priceReel: 2000, priceStory: 600, priceVisit: 4000, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Deepak", rating: 4.7, completedCampaigns: 19, bio: "Local fitness coach turning Meerut health-conscious" },
  { id: "10", name: "Meera Nair", city: "Pune", niche: "Beauty", followers: "95K", engagementRate: 5.5, platforms: ["Instagram", "YouTube"], priceReel: 6000, priceStory: 1800, priceVisit: 9000, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Meera", rating: 4.9, completedCampaigns: 57, bio: "Skincare & makeup tutorials for Indian skin tones" },
];

export const campaigns: Campaign[] = [
  { id: "1", brand: "Burger Cafe", brandLogo: "🍔", city: "Meerut", budget: 15000, influencersNeeded: 5, influencersApplied: 12, deliverables: ["1 Reel", "2 Stories"], niche: "Food", status: "active", postedAt: "2 hours ago", description: "Looking for food influencers to promote our new burger menu. Visit our cafe, try our new items, and create engaging content!" },
  { id: "2", brand: "FitZone Gym", brandLogo: "💪", city: "Delhi", budget: 25000, influencersNeeded: 3, influencersApplied: 8, deliverables: ["2 Reels", "3 Stories", "1 Post"], niche: "Fitness", status: "active", postedAt: "5 hours ago", description: "Promote our new gym launch in South Delhi. We need energetic fitness creators to showcase our facilities." },
  { id: "3", brand: "StyleHub", brandLogo: "👗", city: "Noida", budget: 40000, influencersNeeded: 8, influencersApplied: 22, deliverables: ["1 Reel", "1 Story", "1 Post"], niche: "Fashion", status: "active", postedAt: "1 day ago", description: "Summer collection launch! Need fashion influencers for our new ethnic wear line." },
  { id: "4", brand: "TechMart", brandLogo: "📱", city: "Mumbai", budget: 50000, influencersNeeded: 4, influencersApplied: 15, deliverables: ["1 YouTube Video", "2 Reels"], niche: "Tech", status: "active", postedAt: "3 hours ago", description: "Review our latest smartphone accessories. Looking for genuine tech reviewers." },
  { id: "5", brand: "Chai Corner", brandLogo: "☕", city: "Meerut", budget: 8000, influencersNeeded: 10, influencersApplied: 6, deliverables: ["1 Reel", "1 Story"], niche: "Food", status: "active", postedAt: "6 hours ago", description: "Grand opening of our new outlet! Need local food influencers for a visit and review." },
  { id: "6", brand: "GlowUp Skincare", brandLogo: "✨", city: "Pune", budget: 35000, influencersNeeded: 6, influencersApplied: 18, deliverables: ["1 Reel", "3 Stories"], niche: "Beauty", status: "active", postedAt: "12 hours ago", description: "Launch campaign for our new organic skincare range. Looking for beauty creators with authentic reviews." },
];

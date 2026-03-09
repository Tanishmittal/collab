import type { Influencer } from "./mockData";

export interface Review {
  id: string;
  brand: string;
  brandLogo: string;
  rating: number;
  comment: string;
  campaign: string;
  date: string;
}

export interface PortfolioItem {
  id: string;
  type: "reel" | "story" | "post" | "video";
  thumbnail: string;
  title: string;
  brand: string;
  views: string;
  likes: string;
  platform: string;
}

export const getReviewsForInfluencer = (id: string): Review[] => {
  const allReviews: Record<string, Review[]> = {
    "1": [
      { id: "r1", brand: "Burger Cafe", brandLogo: "🍔", rating: 5, comment: "Rahul created an amazing reel that got us 200+ walk-ins in a week! His food photography is top-notch and he really captured the essence of our menu.", campaign: "Menu Launch", date: "2 weeks ago" },
      { id: "r2", brand: "Chai Corner", brandLogo: "☕", rating: 5, comment: "Excellent work! The story series he created drove massive engagement. Very professional and delivered on time.", campaign: "Grand Opening", date: "1 month ago" },
      { id: "r3", brand: "Spice Garden", brandLogo: "🌶️", rating: 4, comment: "Good content quality. Would have liked a bit more creativity in the reel transitions, but overall great reach and results.", campaign: "Diwali Special", date: "2 months ago" },
      { id: "r4", brand: "Pizza Hub", brandLogo: "🍕", rating: 5, comment: "Best food influencer in Meerut! His honest reviews bring genuine customers. The visit and review format works perfectly.", campaign: "New Outlet Launch", date: "3 months ago" },
    ],
    "2": [
      { id: "r5", brand: "StyleHub", brandLogo: "👗", rating: 5, comment: "Priya's fashion sense is impeccable. She styled our ethnic wear collection beautifully and the content went viral!", campaign: "Summer Collection", date: "1 week ago" },
      { id: "r6", brand: "LuxeWear", brandLogo: "👜", rating: 4, comment: "Great work on the reel. Her audience is very engaged and we saw a 30% increase in website traffic.", campaign: "Brand Collab", date: "3 weeks ago" },
      { id: "r7", brand: "TrendZ", brandLogo: "✨", rating: 5, comment: "Absolutely loved the content! She understands fashion marketing and delivers quality consistently.", campaign: "Festive Edit", date: "1 month ago" },
    ],
    "3": [
      { id: "r8", brand: "FitZone Gym", brandLogo: "💪", rating: 5, comment: "Amit's workout reels are incredibly motivating. We got 50+ new memberships from his content alone!", campaign: "Gym Launch", date: "1 week ago" },
      { id: "r9", brand: "ProteinMax", brandLogo: "🥤", rating: 5, comment: "Professional, punctual, and his content converts. Best fitness influencer in Noida.", campaign: "Product Review", date: "2 months ago" },
    ],
  };
  return allReviews[id] || [
    { id: "rg1", brand: "Local Brand", brandLogo: "🏪", rating: 5, comment: "Fantastic work! Very professional and the content performed well above expectations.", campaign: "Brand Promotion", date: "2 weeks ago" },
    { id: "rg2", brand: "Startup Co", brandLogo: "🚀", rating: 4, comment: "Good content creator. Delivered on time and the quality was great. Would work again!", campaign: "Launch Campaign", date: "1 month ago" },
  ];
};

export const getPortfolioForInfluencer = (id: string): PortfolioItem[] => {
  const nicheContent: Record<string, PortfolioItem[]> = {
    "1": [
      { id: "p1", type: "reel", thumbnail: "", title: "Meerut's Best Street Chaat", brand: "Burger Cafe", views: "45K", likes: "3.2K", platform: "Instagram" },
      { id: "p2", type: "reel", thumbnail: "", title: "Hidden Food Gems of Meerut", brand: "Chai Corner", views: "62K", likes: "4.8K", platform: "Instagram" },
      { id: "p3", type: "story", thumbnail: "", title: "New Cafe Review", brand: "Spice Garden", views: "28K", likes: "1.9K", platform: "Instagram" },
      { id: "p4", type: "video", thumbnail: "", title: "Top 10 Street Foods", brand: "Personal", views: "120K", likes: "8.5K", platform: "YouTube" },
      { id: "p5", type: "reel", thumbnail: "", title: "Pizza Making BTS", brand: "Pizza Hub", views: "38K", likes: "2.7K", platform: "Instagram" },
      { id: "p6", type: "post", thumbnail: "", title: "Diwali Special Menu", brand: "Spice Garden", views: "15K", likes: "1.2K", platform: "Instagram" },
    ],
    "2": [
      { id: "p7", type: "reel", thumbnail: "", title: "Ethnic Wear Lookbook", brand: "StyleHub", views: "85K", likes: "6.2K", platform: "Instagram" },
      { id: "p8", type: "reel", thumbnail: "", title: "Street Style Delhi", brand: "LuxeWear", views: "72K", likes: "5.1K", platform: "Instagram" },
      { id: "p9", type: "story", thumbnail: "", title: "Fashion Week Highlights", brand: "TrendZ", views: "45K", likes: "3.4K", platform: "Instagram" },
      { id: "p10", type: "reel", thumbnail: "", title: "Fusion Fashion Tips", brand: "Personal", views: "110K", likes: "7.8K", platform: "Instagram" },
      { id: "p11", type: "post", thumbnail: "", title: "Sustainable Fashion Edit", brand: "EcoWear", views: "32K", likes: "2.5K", platform: "Instagram" },
      { id: "p12", type: "reel", thumbnail: "", title: "Wedding Season Outfits", brand: "Personal", views: "95K", likes: "6.9K", platform: "Instagram" },
    ],
  };
  return nicheContent[id] || [
    { id: "pg1", type: "reel", thumbnail: "", title: "Featured Content #1", brand: "Brand Collab", views: "35K", likes: "2.4K", platform: "Instagram" },
    { id: "pg2", type: "reel", thumbnail: "", title: "Featured Content #2", brand: "Personal", views: "48K", likes: "3.1K", platform: "Instagram" },
    { id: "pg3", type: "story", thumbnail: "", title: "Brand Story Series", brand: "Local Brand", views: "22K", likes: "1.6K", platform: "Instagram" },
    { id: "pg4", type: "video", thumbnail: "", title: "Behind the Scenes", brand: "Personal", views: "67K", likes: "4.5K", platform: "YouTube" },
  ];
};

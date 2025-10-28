export type UserRole = 'Level 1' | 'Level 2' | 'Level 3';

export type Platform = 'YouTube' | 'Instagram' | 'Twitter' | 'TikTok';

export type Influencer = {
  id: string;
  name: string;
  platform: Platform;
  category: string;
  language: string;
  region: string;
  channelLink: string;
  handle: string;
  email: string;
  mobile: string;
  pan: string; // Faking PAN as a string
  agency?: {
    name: string;
    contact: string;
  };
  lastPromotionBy: string;
  lastPromotionDate: string;
  lastPricePaid: number;
  averageViews: number;
  avatar: string; // URL to image
};

export type Campaign = {
  id: string;
  name: string;
  department: string;
  deliverables: string;
  date: string;
  pricePaid: number;
  averageViews: number;
  influencerId: string;
  approved: boolean;
};

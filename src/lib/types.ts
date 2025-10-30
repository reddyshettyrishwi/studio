
export type UserRole = 'Level 1' | 'Level 2' | 'Level 3';

export type Platform = 'YouTube' | 'Instagram';

export type ApprovalStatus = 'Approved' | 'Pending' | 'Rejected';

export type PlatformDetails = {
  platform: Platform;
  channelName: string;
  channelLink: string;
  handle: string;
  averageViews: number;
};

export type Influencer = {
  id: string;
  name: string;
  platforms: PlatformDetails[];
  category: string;
  language: string;
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
  approvalStatus: ApprovalStatus;
};

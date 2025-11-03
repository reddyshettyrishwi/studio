
export type UserRole = 'Admin' | 'Manager' | 'Executive';

export type Platform = 'YouTube' | 'Instagram';

export type ApprovalStatus = 'Approved' | 'Pending' | 'Rejected' | 'Completed';

export type PlatformDetails = {
  platform: Platform;
  channelName: string;
  handle: string;
};

export type Influencer = {
  id: string;
  name:string;
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
  lastPricePaid?: number;
  avatar: string; // URL to image
};

export type Campaign = {
  id: string;
  name: string;
  department: string;
  deliverables: string;
  date: string;
  pricePaid: number;
  influencerId: string;
  approvalStatus: ApprovalStatus;
};

export type PendingUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Pending';
};

export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: 'Pending' | 'Approved';
}

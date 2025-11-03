
import type { Influencer, Campaign, PendingUser, User } from './types';

// In-memory data store
const store = {
  influencers: [
    {
      id: 'inf-1',
      name: 'Alexina Jordan',
      platforms: [
        {
          platform: 'YouTube',
          channelName: "Alexina's Tech",
          handle: 'alexinatech',
        },
        {
          platform: 'Instagram',
          channelName: 'Alexina.Tech',
          handle: 'alexina.tech',
        }
      ],
      category: 'Tech',
      language: 'English',
      email: 'alexina@example.com',
      mobile: '+1-202-555-0176',
      pan: 'ABCDE1234F',
      agency: {
        name: 'TechStars Agency',
        contact: 'contact@techstars.com',
      },
      lastPromotionBy: 'Marketing',
      lastPromotionDate: '2024-05-20',
      lastPricePaid: 415000,
      avatar: 'https://picsum.photos/seed/1/100/100',
    },
    {
      id: 'inf-2',
      name: 'Ben Carter',
      platforms: [{
          platform: 'Instagram',
          channelName: 'Ben Carter Style',
          handle: 'bencarterstyle',
      }],
      category: 'Fashion',
      language: 'English',
      email: 'ben.carter@example.com',
      mobile: '+44-20-7946-0958',
      pan: 'FGHIJ5678K',
      lastPromotionBy: 'Sales',
      lastPromotionDate: '2024-06-15',
      lastPricePaid: 290500,
      avatar: 'https://picsum.photos/seed/2/100/100',
    },
    {
      id: 'inf-5',
      name: 'Elena Garcia',
      platforms: [{
          platform: 'YouTube',
          channelName: 'Vida de Elena',
          handle: 'elenagarciavida',
      }],
      category: 'Lifestyle',
      language: 'English',
      email: 'elena.garcia@example.com',
      mobile: '+34-91-123-45-67',
      pan: 'VWXYZ7890N',
      agency: {
        name: 'Vida Social',
        contact: 'hola@vidasocial.es',
      },
      lastPromotionBy: 'Brand',
      lastPromotionDate: '2024-04-22',
      lastPricePaid: 498000,
      avatar: 'https://picsum.photos/seed/5/100/100',
    },
    {
      id: 'inf-6',
      name: 'Fumiko Tanaka',
      platforms: [{
          platform: 'Instagram',
          channelName: 'Fumiko Eats',
          handle: 'fumikoeats',
      }],
      category: 'Food',
      language: 'English',
      email: 'fumiko.tanaka@example.com',
      mobile: '+81-3-1234-5678',
      pan: 'BCDA1234E',
      lastPromotionBy: 'Marketing',
      lastPromotionDate: '2024-02-18',
      lastPricePaid: 232400,
      avatar: 'https://picsum.photos/seed/6/100/100',
    },
    {
      id: 'inf-8',
      name: 'Hannah Schmidt',
      platforms: [{
          platform: 'YouTube',
          channelName: 'Hannah Lernt',
          handle: 'hannahlernt',
      }],
      category: 'Education',
      language: 'English',
      email: 'hannah.schmidt@example.com',
      mobile: '+49-30-1234567',
      pan: 'MNOPQ3456G',
      lastPromotionBy: 'Brand',
      lastPromotionDate: '2024-05-30',
      lastPricePaid: 398400,
      avatar: 'https://picsum.photos/seed/8/100/100',
    },
    {
      id: 'inf-10',
      name: 'Jasmine Chen',
      platforms: [{
          platform: 'Instagram',
          channelName: 'Jasmine Travels',
          handle: 'jasminetravels',
      }],
      category: 'Travel',
      language: 'English',
      email: 'jasmine.chen@example.com',
      mobile: '+86-10-1234-5678',
      pan: 'WXYZA5678I',
      lastPromotionBy: 'Marketing',
      lastPromotionDate: '2024-01-12',
      lastPricePaid: 581000,
      avatar: 'https://picsum.photos/seed/10/100/100',
    },
    {
      id: 'inf-11',
      name: 'Liam Murphy',
      platforms: [
          {
              platform: 'YouTube',
              channelName: "Liam's Garage",
              handle: 'liamsgarage',
          },
          {
              platform: 'Instagram',
              channelName: 'Liam Drives',
              handle: 'liamdrives',
          }
      ],
      category: 'Automotive',
      language: 'English',
      email: 'liam.murphy@example.com',
      mobile: '+1-416-555-0192',
      pan: 'PQRS6789J',
      lastPromotionBy: 'Marketing',
      lastPromotionDate: '2024-07-10',
      lastPricePaid: 456500,
      avatar: 'https://picsum.photos/seed/11/100/100',
    },
    {
      id: 'inf-12',
      name: 'Sofia Rossi',
      platforms: [{
          platform: 'Instagram',
          channelName: 'Art by Sofia',
          handle: 'artbysofia',
      }],
      category: 'Art',
      language: 'English',
      email: 'sofia.rossi@example.com',
      mobile: '+39-06-12345678',
      pan: 'KLMN0123K',
      lastPromotionBy: 'Brand',
      lastPromotionDate: '2024-03-25',
      lastPricePaid: 332000,
      avatar: 'https://picsum.photos/seed/12/100/100',
    },
    {
      id: 'inf-13',
      name: 'Priya Sharma',
      platforms: [{
          platform: 'YouTube',
          channelName: 'Bolly Fitness',
          handle: 'bollyfitness',
      }],
      category: 'Fitness',
      language: 'Hindi',
      email: 'priya.sharma@example.com',
      mobile: '+91-11-91234-5678',
      pan: 'UVWX4567L',
      lastPromotionBy: 'Sales',
      lastPromotionDate: '2024-06-05',
      lastPricePaid: 315400,
      avatar: 'https://picsum.photos/seed/13/100/100',
    },
    {
      id: 'inf-14',
      name: 'Ravi Kumar',
      platforms: [{
          platform: 'Instagram',
          channelName: "Ravi's Tech Telugu",
          handle: 'ravistechtelugu',
      }],
      category: 'Tech',
      language: 'Telugu',
      email: 'ravi.kumar@example.com',
      mobile: '+91-9876543210',
      pan: 'YZAB8901M',
      agency: {
        name: 'South Digital',
        contact: 'contact@southdigital.com',
      },
      lastPromotionBy: 'Marketing',
      lastPromotionDate: '2024-05-18',
      lastPricePaid: 249000,
      avatar: 'https://picsum.photos/seed/14/100/100',
    },
  ],
  campaigns: [
    {
      id: 'camp-1',
      name: 'Summer Fashion Launch',
      department: 'Sales',
      deliverables: '2 Instagram Posts, 3 Stories',
      date: '2024-06-15',
      pricePaid: 290500,
      influencerId: 'inf-2',
      approvalStatus: 'Approved',
    },
    {
      id: 'camp-2',
      name: 'New Gadget Unboxing',
      department: 'Marketing',
      deliverables: '1 YouTube Video',
      date: '2024-05-20',
      pricePaid: 415000,
      influencerId: 'inf-1',
      approvalStatus: 'Pending',
    },
    {
      id: 'camp-5',
      name: 'Lifestyle Vlog Series',
      department: 'Brand',
      deliverables: '3 YouTube Videos',
      date: '2024-04-22',
      pricePaid: 498000,
      influencerId: 'inf-5',
      approvalStatus: 'Rejected',
    },
    {
      id: 'camp-6',
      name: 'Japanese Food Tour',
      department: 'Marketing',
      deliverables: '5 Instagram Posts',
      date: '2024-02-18',
      pricePaid: 232400,
      influencerId: 'inf-6',
      approvalStatus: 'Approved',
    },
    {
      id: 'camp-7',
      name: 'Fitness Challenge 2024',
      department: 'Sales',
      deliverables: '1 YouTube Video, 2 Instagram Reels',
      date: '2024-06-05',
      pricePaid: 315400,
      influencerId: 'inf-13',
      approvalStatus: 'Completed',
    },
    {
      id: 'camp-8',
      name: 'DIY Art Project',
      department: 'Brand',
      deliverables: '4 Instagram Posts',
      date: '2024-03-25',
      pricePaid: 332000,
      influencerId: 'inf-12',
      approvalStatus: 'Approved',
    },
      {
      id: 'camp-9',
      name: 'New Car Review',
      department: 'Marketing',
      deliverables: '1 long-form YouTube video',
      date: '2024-07-10',
      pricePaid: 456500,
      influencerId: 'inf-11',
      approvalStatus: 'Pending',
    },
    {
      id: 'camp-10',
      name: 'Travel Diary: Bali',
      department: 'Marketing',
      deliverables: '3 Instagram Posts, 1 Reel',
      date: '2024-07-22',
      pricePaid: 600000,
      influencerId: 'inf-10',
      approvalStatus: 'Pending',
    },
    {
      id: 'camp-11',
      name: 'German Language Course Promo',
      department: 'Brand',
      deliverables: '2 YouTube Mentions',
      date: '2024-08-01',
      pricePaid: 420000,
      influencerId: 'inf-8',
      approvalStatus: 'Pending',
    },
    {
      id: 'camp-12',
      name: 'Telugu Tech Gadget Giveaway',
      department: 'Marketing',
      deliverables: '1 Instagram Live, 2 Posts',
      date: '2024-07-28',
      pricePaid: 280000,
      influencerId: 'inf-14',
      approvalStatus: 'Approved',
    },
    {
      id: 'camp-13',
      name: 'Healthy Living Series',
      department: 'Sales',
      deliverables: 'Weekly YouTube videos for a month',
      date: '2024-08-05',
      pricePaid: 350000,
      influencerId: 'inf-13',
      approvalStatus: 'Pending',
    },
    {
      id: 'camp-14',
      name: 'Winter Fashion Haul',
      department: 'Sales',
      deliverables: '3 Instagram Posts, 1 Reel',
      date: '2024-10-01',
      pricePaid: 320000,
      influencerId: 'inf-2',
      approvalStatus: 'Pending'
    },
    {
      id: 'camp-15',
      name: 'New Smartphone Launch',
      department: 'Marketing',
      deliverables: '1 YouTube Review, 2 Instagram Stories',
      date: '2024-10-05',
      pricePaid: 450000,
      influencerId: 'inf-1',
      approvalStatus: 'Pending'
    },
    {
      id: 'camp-16',
      name: 'Food Festival Coverage',
      department: 'Brand',
      deliverables: '5 Instagram Stories, 1 Post',
      date: '2024-10-12',
      pricePaid: 250000,
      influencerId: 'inf-6',
      approvalStatus: 'Pending'
    }
  ],
  pendingUsers: [
      { id: 'user-1', name: 'Charlie Brown', email: 'charlie.brown@example.com', role: 'Manager', status: 'Pending' },
      { id: 'user-2', name: 'Lucy van Pelt', email: 'lucy.vanpelt@example.com', role: 'Executive', status: 'Pending' },
      { id: 'user-3', name: 'Linus van Pelt', email: 'linus.vanpelt@example.com', role: 'Manager', status: 'Pending' },
  ],
  allUsers: [
      { id: 'user-1', name: 'Charlie Brown', email: 'charlie.brown@example.com', password: 'password', role: 'Manager' },
      { id: 'user-2', name: 'Lucy van Pelt', email: 'lucy.vanpelt@example.com', password: 'password', role: 'Executive' },
      { id: 'user-3', name: 'Linus van Pelt', email: 'linus.vanpelt@example.com', password: 'password', role: 'Manager' },
      { id: 'user-4', name: 'Approved Manager', email: 'manager@approved.com', password: 'password', role: 'Manager' }
  ],
  approvedUsers: ['manager@approved.com'],
};

// Exporting copies of the data to prevent direct mutation from components
export const influencers: Influencer[] = [...store.influencers];
export const campaigns: Campaign[] = [...store.campaigns];

// Functions to manage user data state
export const getPendingUsers = () => [...store.pendingUsers];

export const approveUser = (userId: string) => {
    const userToApprove = store.pendingUsers.find(u => u.id === userId);
    if (userToApprove) {
        store.pendingUsers = store.pendingUsers.filter(u => u.id !== userId);
        const fullUser = store.allUsers.find(u => u.email === userToApprove.email);
        if (fullUser && !store.approvedUsers.includes(fullUser.email)) {
            store.approvedUsers.push(fullUser.email);
        }
    }
};

export const rejectUser = (userId: string) => {
    const userToReject = store.pendingUsers.find(u => u.id === userId);
    if (userToReject) {
        store.pendingUsers = store.pendingUsers.filter(u => u.id !== userId);
        store.allUsers = store.allUsers.filter(u => u.email !== userToReject.email);
    }
};


export const addUser = (user: Omit<User, 'id'>) => {
    const newUser: User = {
        id: `user-${Date.now()}`,
        ...user,
    };
    store.allUsers.push(newUser);
    if (user.role !== 'Admin') {
        const newPendingUser: PendingUser = {
            id: newUser.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: 'Pending',
        };
        store.pendingUsers.push(newPendingUser);
    }
};

export const isUserApproved = (email: string): boolean => {
    return store.approvedUsers.includes(email);
};

export const findUserByCredentials = (email: string, password?: string): User | undefined => {
    return store.allUsers.find(u => u.email === email && (password ? u.password === password : true));
};

export const allUsers = (): User[] => [...store.allUsers];

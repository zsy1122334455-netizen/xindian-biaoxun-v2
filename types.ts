export enum UserRole {
  FREE = 'FREE',
  VIP = 'VIP',
  SVIP = 'SVIP'
}

export interface Membership {
  role: UserRole;
  planType?: 'monthly' | 'annual';
  expiryDate?: string;
  vipCities?: string[];
  svipTrialUntil?: string | null; // SVIP 覆盖截止日，YYYY-MM-DD
  svipTrialUsed?: boolean; // 是否已用过免费体验
  paidAmount?: number;
}

export const EXPORT_LIMITS = {
  [UserRole.FREE]: 0,
  [UserRole.VIP]: 10,
  [UserRole.SVIP]: 50,
};

export enum ViewName {
  HOME = 'HOME',
  OPPORTUNITY_LIST = 'OPPORTUNITY_LIST',
  ENTERPRISE_LIST = 'ENTERPRISE_LIST',
  SUBSCRIPTION = 'SUBSCRIPTION',
  USER_CENTER = 'USER_CENTER',
  ANNOUNCEMENT_DETAIL = 'ANNOUNCEMENT_DETAIL',
  ENTERPRISE_DETAIL = 'ENTERPRISE_DETAIL',
  ADD_SUBSCRIPTION = 'ADD_SUBSCRIPTION',
  SUBSCRIPTION_MANAGEMENT = 'SUBSCRIPTION_MANAGEMENT',
  MEMBER_CENTER = 'MEMBER_CENTER',
  PROJECT_CONTACTS = 'PROJECT_CONTACTS',
  BROWSING_HISTORY = 'BROWSING_HISTORY',
  ENTERPRISE_INFO = 'ENTERPRISE_INFO',
  PROJECT_TIMELINE = 'PROJECT_TIMELINE',
  EXPORT_RECORDS = 'EXPORT_RECORDS',
  MY_SCHEDULE = 'MY_SCHEDULE',
  ADD_SCHEDULE = 'ADD_SCHEDULE',
  SELECT_OPPORTUNITY = 'SELECT_OPPORTUNITY',
  CONTACT_PROJECTS = 'CONTACT_PROJECTS',
  MESSAGE_LIST = 'MESSAGE_LIST',
  FEEDBACK = 'FEEDBACK',
}

export interface Opportunity {
  id: string;
  title: string;
  tags: string[];
  region: string;
  amount: string;
  date: string;
  deadline?: string;
  status?: string;
  isStarred?: boolean;
  type: 'engineering' | 'procurement' | 'service';
  projectType?: string;
  projectCode?: string;
  hasPublicContacts?: boolean;
  currentStage?: string;
  isMultiBid?: boolean;
  clarificationDate?: string;
  clarificationTitle?: string;
  ownerName?: string;
  agencyName?: string | null;
  winnerName?: string;
  sourceUrl?: string;
  ownerContacts?: { name: string; phone: string; role: string }[];
  agencyContacts?: { name: string; phone: string; role: string }[];
}

export interface Enterprise {
  id: string;
  name: string;
  industry: string;
  role?: string;
  location: string;
  legalRep: string;
  capital?: string;
  enterpriseType?: string;
  date: string;
  isFollowed: boolean;
  tags?: string[];
  projectContacts?: number;
  winningBids?: number;
  businessScope?: string;
  address?: string;
  creditCode?: string;
  contactPerson?: string;
  contactPhone?: string;
}

export interface EnterpriseData {
  name: string;
  qualifications: string[];
  description: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  keywords: string[];
  region: string;
  isDefault: boolean;
  amountRange?: {
    min?: string;
    max?: string;
    preset?: string;
  };
  projectTypes?: string[];
  showCandidateAnnouncement?: boolean;
  showTransactionResult?: boolean;
  publishTime?: string;
  organizationForm?: string;
  fundingSource?: string;
  qualificationRequirement?: string;
  openingDeadline?: string;
  excludeKeywords?: string[];
  industryClassification?: string[];
  announcementType?: string;
}

export interface ExportRecord {
  id: string;
  name: string;
  date: string;
  size: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'processing';
}

export interface NavProps {
  currentView: ViewName;
  onChangeView: (view: ViewName) => void;
}
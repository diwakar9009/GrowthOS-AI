export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  niche?: string;
  platform?: 'instagram' | 'youtube' | 'both';
  streak: number;
  lastActive?: string;
  points: number;
  createdAt: string;
  isApproved?: boolean;
  role?: 'admin' | 'user';
}

export interface MarketingTask {
  id: string;
  title: string;
  description: string;
  type: 'caption' | 'trend' | 'suggestion' | 'tool';
  content?: any;
  createdAt: string;
}

export interface TrendIdea {
  keyword: string;
  description: string;
  platform: 'instagram' | 'youtube';
  relevance: number;
}

export interface GrowthSuggestion {
  id: string;
  text: string;
  action: string;
  platform: 'instagram' | 'youtube';
  priority: 'low' | 'medium' | 'high';
}

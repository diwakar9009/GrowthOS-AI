export const APP_NAME = "GrowthOS AI";
export const APP_DESCRIPTION = "All-in-One AI-Powered Digital Marketing Platform";

export const NICHES = [
  "Fitness",
  "Tech & Gadgets",
  "Fashion & Lifestyle",
  "Food & Cooking",
  "Travel",
  "Finance & Investing",
  "Education",
  "Entertainment",
  "Gaming",
  "Business & Entrepreneurship"
];

export const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: 'Instagram' },
  { id: 'youtube', name: 'YouTube', icon: 'Youtube' },
  { id: 'both', name: 'Both', icon: 'LayoutGrid' }
];

export const MOCK_TRENDS = [
  { keyword: "AI Tools for Creators", description: "How AI is changing the content game.", platform: "youtube", relevance: 95 },
  { keyword: "Minimalist Aesthetic", description: "Clean and simple visual storytelling.", platform: "instagram", relevance: 88 },
  { keyword: "Hinglish Content", description: "Mixing Hindi and English for better engagement in India.", platform: "both", relevance: 92 },
  { keyword: "Short-form Storytelling", description: "Hooking viewers in the first 3 seconds.", platform: "both", relevance: 98 }
];

export const MOCK_SUGGESTIONS = [
  { id: '1', text: "Post 1 Reel about your niche at 7 PM", action: "Create Reel", platform: "instagram", priority: "high" },
  { id: '2', text: "Reply to top 5 comments on your latest post", action: "Engage", platform: "both", priority: "medium" },
  { id: '3', text: "Use trending audio: 'Lofi Beats' for your next video", action: "Find Audio", platform: "instagram", priority: "high" }
];

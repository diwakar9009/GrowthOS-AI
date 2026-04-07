import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { 
  Wrench, 
  Search, 
  Link as LinkIcon, 
  Mail, 
  Globe, 
  Copy, 
  Check, 
  Sparkles,
  Loader2,
  Megaphone,
  Download,
  Image as ImageIcon,
  Video,
  FileDown,
  CheckCircle2,
  Users,
  Hash,
  Calculator,
  Split,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingBag,
  UserCircle,
  MessageSquare,
  PenTool,
  Layout,
  Type as TypeIcon,
  Ear,
  Magnet,
  ListTree,
  FileText,
  MessageCircle,
  CalendarRange,
  Coins,
  Target,
  ShieldAlert,
  FileSpreadsheet,
  PhoneCall,
  ExternalLink,
  Newspaper,
  ShieldCheck,
  Clock,
  Heart,
  HeartHandshake,
  FileBarChart,
  Library,
  ClipboardCheck,
  Zap as ZapIcon,
  FilePieChart,
  UserPlus
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, addDoc, query, orderBy, onSnapshot, handleFirestoreError, OperationType } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";

type ToolType = 'ads' | 'seo' | 'email' | 'utm' | 'downloader' | 'compressor' | 'competitor' | 'influencer' | 'hashtag' | 'strategy' | 'roi' | 'abtest' | 'brand-voice' | 'product-desc' | 'bio-gen' | 'video-script' | 'review-reply' | 'social-listening' | 'lead-magnet' | 'email-sequence' | 'landing-page' | 'campaign-brief' | 'social-reply' | 'content-calendar' | 'ad-budget' | 'lead-scorer' | 'sales-script' | 'crisis-comms' | 'press-release' | 'link-bio' | 'advocacy' | 'content-curation' | 'social-audit' | 'post-optimizer' | 'community-mgr' | 'report-gen';

export function Tools() {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<ToolType>('strategy');
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Tool Inputs
  const [input1, setInput1] = useState("");
  const [input2, setInput2] = useState("");

  // Existing Tool States
  const [url, setUrl] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const runTool = async () => {
    if (!input1 || !user) return;
    setLoading(true);
    setResult(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let prompt = "";

      if (activeTool === 'ads') {
        prompt = `Generate 3 high-converting ad copies for ${input1}. Target Platform: ${input2 || 'Google/Meta'}. Include Headline, Primary Text, and CTA.`;
      } else if (activeTool === 'seo') {
        prompt = `Generate a list of 10 high-intent SEO keywords and 3 blog title ideas for the topic: ${input1}. Focus on ${input2 || 'general'} niche.`;
      } else if (activeTool === 'email') {
        prompt = `Generate 5 catchy and high-open-rate email subject lines for: ${input1}. Context: ${input2 || 'Marketing Newsletter'}.`;
      } else if (activeTool === 'competitor') {
        prompt = `Using real-time search data, analyze the digital marketing strategy for the following competitor or niche: ${input1}. 
        Focus area: ${input2 || 'General Strategy'}.
        
        Please provide:
        1. **Estimated Target Audience**: Who are they targeting?
        2. **Content Themes**: What are their main messaging pillars and content styles?
        3. **Strategy Analysis**: How are they positioning themselves in the ${input2 || 'market'}?
        4. **Counter-Strategies & Gaps**: Suggest specific ways to compete or gaps in their current approach that can be exploited.
        
        Use recent information and specific examples if available. Format the output clearly with Markdown headers.`;
      } else if (activeTool === 'influencer') {
        prompt = `Find 5 potential influencers or content creators in the ${input1} niche. 
        Focus on: ${input2 || 'Instagram/YouTube'}.
        Provide:
        - Creator type (Micro/Macro)
        - Content style
        - Why they are a good fit
        - Estimated engagement level.`;
      } else if (activeTool === 'hashtag') {
        prompt = `Generate a strategic set of 30 hashtags for a post about ${input1}. 
        Platform: ${input2 || 'Instagram'}.
        Categorize them into:
        - High volume (Broad)
        - Medium volume (Niche)
        - Low volume (Community)
        - Branded/Campaign specific.`;
      } else if (activeTool === 'strategy') {
        prompt = `Generate a comprehensive 30-day digital marketing strategy for ${input1}. 
        Goal: ${input2 || 'Brand Awareness & Growth'}.
        Include:
        - Weekly themes
        - Content mix (Educational, Promotional, Interactive)
        - Key performance indicators (KPIs) to track
        - Budget allocation suggestions.`;
      } else if (activeTool === 'roi') {
        prompt = `Calculate and analyze the Marketing ROI for a campaign with:
        - Total Spend: ${input1}
        - Total Revenue/Conversions: ${input2 || '0'}
        Provide:
        - ROI Percentage
        - Cost Per Acquisition (CPA)
        - Return on Ad Spend (ROAS)
        - 3 Strategic suggestions to improve these metrics.`;
      } else if (activeTool === 'abtest') {
        prompt = `Create a detailed A/B test plan for: ${input1}. 
        Goal: ${input2 || 'Improve Conversion Rate'}.
        Include:
        - Hypothesis (If we change X, then Y will happen)
        - Control (A) vs. Variant (B) details
        - Key metrics to measure
        - Minimum sample size suggestion
        - Duration of the test.`;
      } else if (activeTool === 'brand-voice') {
        prompt = `Analyze the following text and define the Brand Voice: "${input1}". 
        Focus on: ${input2 || 'Tone, Style, and Vocabulary'}.
        Provide:
        - Voice Characteristics (3-5 adjectives)
        - Do's and Don'ts for writing in this voice
        - A sample rewrite of a generic marketing sentence in this voice.`;
      } else if (activeTool === 'product-desc') {
        prompt = `Generate a compelling e-commerce product description for: ${input1}. 
        Target Audience: ${input2 || 'General Consumers'}.
        Include:
        - Catchy Title
        - Benefit-driven description
        - Bulleted key features
        - Call to action.`;
      } else if (activeTool === 'bio-gen') {
        prompt = `Generate 3 creative social media bios for: ${input1}. 
        Platform: ${input2 || 'Instagram/Twitter'}.
        Include:
        - Professional version
        - Creative/Witty version
        - Minimalist version
        - Relevant emojis and a CTA.`;
      } else if (activeTool === 'video-script') {
        prompt = `Write a high-engagement short-form video script (TikTok/Reels/Shorts) for: ${input1}. 
        Goal: ${input2 || 'Viral Growth'}.
        Include:
        - The Hook (first 3 seconds)
        - The Body (value/story)
        - The CTA (ending)
        - Visual/Audio cues.`;
      } else if (activeTool === 'review-reply') {
        prompt = `Generate a professional and empathetic response to this customer review: "${input1}". 
        Review Sentiment: ${input2 || 'General'}.
        Ensure the response:
        - Acknowledges the feedback
        - Addresses specific points
        - Maintains a helpful brand tone.`;
      } else if (activeTool === 'social-listening') {
        prompt = `Perform a social listening analysis for the brand/topic: "${input1}". 
        Context: ${input2 || 'General Sentiment'}.
        Provide:
        - Estimated Sentiment Analysis (Positive/Neutral/Negative)
        - Key Trending Conversations/Themes
        - Potential Brand Risks or Opportunities
        - Suggested engagement strategy.`;
      } else if (activeTool === 'lead-magnet') {
        prompt = `Generate 5 high-converting lead magnet ideas for: ${input1}. 
        Target Audience: ${input2 || 'Potential Customers'}.
        For each idea, provide:
        - Title
        - Format (e.g., PDF, Webinar, Quiz)
        - The "Big Promise" (Value Proposition)
        - A simple opt-in page headline.`;
      } else if (activeTool === 'email-sequence') {
        prompt = `Create a 5-email welcome sequence for: ${input1}. 
        Goal: ${input2 || 'Nurture & Convert'}.
        Outline:
        - Email 1: The Welcome & Value
        - Email 2: The Logic/Problem
        - Email 3: The Solution/Proof
        - Email 4: The Offer/Urgency
        - Email 5: The Final Call/FAQ.`;
      } else if (activeTool === 'landing-page') {
        prompt = `Generate a high-converting landing page structure and copy for: ${input1}. 
        Primary Goal: ${input2 || 'Lead Generation'}.
        Include:
        - Hero Headline & Sub-headline
        - Problem/Solution sections
        - Key Benefits (3-5)
        - Social Proof placement ideas
        - Primary and Secondary CTAs.`;
      } else if (activeTool === 'campaign-brief') {
        prompt = `Create a professional Marketing Campaign Brief for: ${input1}. 
        Campaign Goal: ${input2 || 'Product Launch'}.
        Include:
        - Campaign Objectives (SMART goals)
        - Target Audience Personas
        - Key Messaging & Value Prop
        - Channel Strategy (Social, Email, Ads)
        - Creative Requirements.`;
      } else if (activeTool === 'social-reply') {
        prompt = `Generate 3 variations of a social media reply for this comment: "${input1}". 
        Brand Tone: ${input2 || 'Friendly & Professional'}.
        Include:
        - A helpful/informative reply
        - A witty/engaging reply
        - A short/minimalist reply.`;
      } else if (activeTool === 'content-calendar') {
        prompt = `Generate a 7-day social media content calendar for: ${input1}. 
        Platforms: ${input2 || 'Instagram & LinkedIn'}.
        Include:
        - Day-by-day post topics
        - Suggested content formats
        - Best time to post (estimated)
        - Engagement prompt for each day.`;
      } else if (activeTool === 'ad-budget') {
        prompt = `Optimize an ad budget of ${input1} for a ${input2 || 'Digital Marketing'} campaign. 
        Provide:
        - Recommended allocation across channels (Meta, Google, TikTok, etc.)
        - Estimated Reach/Impressions
        - Target CPC/CPA benchmarks
        - Scaling strategy (how to increase spend if successful).`;
      } else if (activeTool === 'lead-scorer') {
        prompt = `Analyze and score this lead: "${input1}". 
        Context: ${input2 || 'B2B SaaS'}.
        Provide:
        - Lead Score (0-100)
        - Qualification Status (MQL, SQL, or Junk)
        - Key Strengths/Weaknesses of the lead
        - Recommended next action for sales.`;
      } else if (activeTool === 'sales-script') {
        prompt = `Generate a professional sales script for: ${input1}. 
        Type: ${input2 || 'Cold Call'}.
        Include:
        - The Hook/Opening
        - Value Proposition
        - Handling 2 common objections
        - The Close/Next Step.`;
      } else if (activeTool === 'crisis-comms') {
        prompt = `Draft a crisis communication response for: "${input1}". 
        Severity: ${input2 || 'Medium'}.
        Include:
        - Official Statement
        - Internal talking points for staff
        - Social media response template
        - Recommended channel strategy.`;
      } else if (activeTool === 'press-release') {
        prompt = `Write a professional press release for: ${input1}. 
        Announcement Type: ${input2 || 'Product Launch'}.
        Include:
        - Catchy Headline & Dateline
        - Lead Paragraph (Who, What, When, Where, Why)
        - Executive Quote placeholder
        - Boilerplate & Media Contact info.`;
      } else if (activeTool === 'link-bio') {
        prompt = `Optimize a Link-in-bio page for: ${input1}. 
        Primary Goal: ${input2 || 'Drive Traffic'}.
        Suggest:
        - 5 High-priority links with catchy titles
        - Profile bio optimization
        - Visual layout suggestions
        - Tracking/Analytics strategy.`;
      } else if (activeTool === 'advocacy') {
        prompt = `Generate an Employee Advocacy post for: ${input1}. 
        Tone: ${input2 || 'Proud & Professional'}.
        Provide:
        - 3 Variations of the post for employees to share
        - Why this matters to the company
        - Suggested image/video type.`;
      } else if (activeTool === 'content-curation') {
        prompt = `Find and curate 5 high-quality content pieces (articles, videos, or news) for the topic: "${input1}". 
        Target Audience: ${input2 || 'General'}.
        For each piece, provide:
        - A suggested social media share caption
        - Why it's relevant to the audience
        - A "Takeaway" or "Insight" to add value to the share.`;
      } else if (activeTool === 'social-audit') {
        prompt = `Perform a comprehensive social media audit for: "${input1}". 
        Platform(s): ${input2 || 'All'}.
        Analyze:
        - Profile Optimization (Bio, Links, Visuals)
        - Content Performance (Engagement, Consistency)
        - Audience Growth & Demographics
        - 3 Immediate improvements to boost results.`;
      } else if (activeTool === 'post-optimizer') {
        prompt = `Determine the best times to post for: "${input1}". 
        Platform: ${input2 || 'Instagram/LinkedIn'}.
        Provide:
        - 3 Recommended time slots (with reasoning)
        - Frequency suggestions (daily/weekly)
        - Content type recommendations for each slot.`;
      } else if (activeTool === 'community-mgr') {
        prompt = `Create a community management strategy for: "${input1}". 
        Goal: ${input2 || 'Engagement & Loyalty'}.
        Include:
        - Engagement rules & response times
        - Strategies for handling negative feedback
        - Ideas for community-building activities (polls, Q&As, etc.)
        - Tracking metrics for community health.`;
      } else if (activeTool === 'report-gen') {
        prompt = `Generate a professional monthly marketing report summary for: "${input1}". 
        Key Results: ${input2 || 'General Performance'}.
        Include:
        - Executive Summary
        - Key Wins & Achievements
        - Metrics Breakdown (Reach, Engagement, Conversions)
        - Next Month's Focus & Recommendations.`;
      }

      if (activeTool === 'utm') {
        const baseUrl = input1.startsWith('http') ? input1 : `https://${input1}`;
        const utm = `${baseUrl}?utm_source=${input2 || 'google'}&utm_medium=cpc&utm_campaign=growth_os&utm_content=ai_assistant`;
        setResult(utm);
      } else {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: (activeTool === 'competitor' || activeTool === 'influencer' || activeTool === 'strategy') ? { tools: [{ googleSearch: {} }] } : undefined
        });
        const text = response.text || "No result generated.";
        setResult(text);

        try {
          await addDoc(collection(db, `users/${user.uid}/tasks`), {
            userId: user.uid,
            title: `Tool: ${activeTool.toUpperCase()} - ${input1}`,
            type: 'tool',
            content: text,
            createdAt: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/tasks`);
        }
      }
    } catch (error) {
      console.error("Tool error:", error);
      setResult("Error running tool. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!url) return;
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert("Download started! (Mock)");
    }, 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxWidth = 800;
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        setCompressedImage(compressed);
        setCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const tools = [
    { id: 'strategy', name: 'Strategy Gen', icon: Sparkles, desc: '30-day campaign plan', category: 'Strategy' },
    { id: 'competitor', name: 'Competitor Analysis', icon: Search, desc: 'Analyze market gaps & strategy', category: 'Strategy' },
    { id: 'roi', name: 'ROI Calc', icon: Calculator, desc: 'Analyze campaign ROI', category: 'Strategy' },
    { id: 'abtest', name: 'A/B Planner', icon: Split, desc: 'Design experiments', category: 'Strategy' },
    
    { id: 'ads', name: 'Ad Copy', icon: Megaphone, desc: 'High-converting ad copy', category: 'Content' },
    { id: 'video-script', name: 'Video Script', icon: Video, desc: 'TikTok/Reels/Shorts scripts', category: 'Content' },
    { id: 'product-desc', name: 'Product Desc', icon: ShoppingBag, desc: 'E-commerce product copy', category: 'Content' },
    { id: 'email', name: 'Email Subjects', icon: Mail, desc: 'Boost open rates', category: 'Content' },
    { id: 'bio-gen', name: 'Bio Generator', icon: UserCircle, desc: 'Social media profile bios', category: 'Content' },
    { id: 'brand-voice', name: 'Brand Voice', icon: TypeIcon, desc: 'Define your brand tone', category: 'Content' },
    { id: 'review-reply', name: 'Review Reply', icon: MessageSquare, desc: 'AI customer responses', category: 'Content' },
    
    { id: 'seo', name: 'SEO Keywords', icon: Globe, desc: 'AI keyword research', category: 'Growth' },
    { id: 'influencer', name: 'Influencer Find', icon: Users, desc: 'Discover creators', category: 'Growth' },
    { id: 'hashtag', name: 'Hashtag Gen', icon: Hash, desc: 'Viral hashtag sets', category: 'Growth' },
    
    { id: 'utm', name: 'UTM Builder', icon: LinkIcon, desc: 'Track your links', category: 'Utilities' },
    { id: 'downloader', name: 'Downloader', icon: Download, desc: 'Save social content', category: 'Utilities' },
    { id: 'compressor', name: 'Compressor', icon: ImageIcon, desc: 'Optimize image size', category: 'Utilities' },
    
    { id: 'social-listening', name: 'Social Listening', icon: Ear, desc: 'Analyze brand mentions', category: 'Enterprise' },
    { id: 'campaign-brief', name: 'Campaign Brief', icon: FileText, desc: 'Professional campaign plans', category: 'Enterprise' },
    { id: 'lead-magnet', name: 'Lead Magnet', icon: Magnet, desc: 'Generate lead gen ideas', category: 'Enterprise' },
    { id: 'email-sequence', name: 'Email Sequence', icon: ListTree, desc: 'Plan email drip campaigns', category: 'Enterprise' },
    { id: 'landing-page', name: 'Landing Page', icon: Layout, desc: 'High-converting LP copy', category: 'Enterprise' },
    { id: 'social-reply', name: 'Social Reply', icon: MessageCircle, desc: 'AI social comment replies', category: 'Enterprise' },
    { id: 'content-calendar', name: 'Content Calendar', icon: CalendarRange, desc: 'Weekly content planning', category: 'Enterprise' },
    { id: 'ad-budget', name: 'Budget Planner', icon: Coins, desc: 'Optimize ad spend', category: 'Enterprise' },
    { id: 'lead-scorer', name: 'Lead Scorer', icon: Target, desc: 'AI lead qualification', category: 'Enterprise' },
    { id: 'sales-script', name: 'Sales Script', icon: PhoneCall, desc: 'Cold call & discovery scripts', category: 'Enterprise' },
    { id: 'crisis-comms', name: 'Crisis Comms', icon: ShieldAlert, desc: 'Brand crisis management', category: 'Enterprise' },
    { id: 'press-release', name: 'Press Release', icon: FileSpreadsheet, desc: 'Professional PR drafting', category: 'Enterprise' },
    { id: 'link-bio', name: 'Link-in-Bio', icon: ExternalLink, desc: 'Optimize social links', category: 'Enterprise' },
    { id: 'advocacy', name: 'Advocacy Post', icon: HeartHandshake, desc: 'Employee advocacy content', category: 'Enterprise' },
    { id: 'report-gen', name: 'Report Gen', icon: FileBarChart, desc: 'Monthly client reports', category: 'Enterprise' },
    
    { id: 'content-curation', name: 'Content Curation', icon: Library, desc: 'Find & share relevant content', category: 'Utilities' },
    { id: 'social-audit', name: 'Social Audit', icon: ClipboardCheck, desc: 'Analyze profile performance', category: 'Utilities' },
    { id: 'post-optimizer', name: 'Post Optimizer', icon: Clock, desc: 'Best times to post', category: 'Utilities' },
    { id: 'community-mgr', name: 'Community Manager', icon: UserPlus, desc: 'Engagement & loyalty strategy', category: 'Utilities' },
  ];

  const filteredTools = tools.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['Strategy', 'Content', 'Growth', 'Enterprise', 'Utilities'];

  const newTools = ['social-listening', 'campaign-brief', 'lead-magnet', 'email-sequence', 'landing-page', 'social-reply', 'content-calendar', 'ad-budget', 'lead-scorer', 'sales-script', 'crisis-comms', 'press-release', 'link-bio', 'advocacy', 'content-curation', 'social-audit', 'post-optimizer', 'community-mgr', 'report-gen'];

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Marketing Intelligence Suite
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium">
            Professional-grade AI tools inspired by HubSpot, Hootsuite & Sprout Social.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search 30+ tools..." 
            className="pl-9 bg-muted/50 border-none focus:ring-primary/20 h-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Tool Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="hidden lg:block space-y-6">
            {categories.map(category => (
              <div key={category} className="space-y-2">
                <h3 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-4">
                  {category}
                </h3>
                <div className="space-y-1">
                  {tools.filter(t => t.category === category).map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setActiveTool(tool.id as ToolType);
                        setResult(null);
                        setInput1("");
                        setInput2("");
                        setCompressedImage(null);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-all group",
                        activeTool === tool.id 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                          : "hover:bg-accent text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <tool.icon className={cn("h-4 w-4 shrink-0", activeTool === tool.id ? "" : "group-hover:text-primary")} />
                        <span className="truncate">{tool.name}</span>
                      </div>
                      {newTools.includes(tool.id) && (
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                          activeTool === tool.id ? "bg-primary-foreground text-primary" : "bg-primary/10 text-primary"
                        )}>
                          NEW
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Tool Selector */}
          <div className="lg:hidden space-y-4">
            <div className="flex overflow-x-auto pb-2 space-x-2 no-scrollbar">
              {['All', ...categories].map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSearchQuery(category === 'All' ? '' : category);
                  }}
                  className={cn(
                    "flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border",
                    (searchQuery === category || (category === 'All' && searchQuery === ''))
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-muted text-muted-foreground border-transparent"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
            
            <div className="flex overflow-x-auto pb-4 space-x-3 no-scrollbar">
              {filteredTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id as ToolType);
                    setResult(null);
                    setInput1("");
                    setInput2("");
                    setCompressedImage(null);
                  }}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl transition-all border p-2 space-y-2",
                    activeTool === tool.id 
                      ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105" 
                      : "bg-card text-muted-foreground border-border hover:border-primary/50"
                  )}
                >
                  <tool.icon className={cn("h-6 w-6", activeTool === tool.id ? "text-primary-foreground" : "text-primary")} />
                  <span className="text-[10px] font-bold text-center leading-tight line-clamp-2">{tool.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tool Workspace */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {activeTool === 'downloader' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5 text-primary" />
                  <span>Social Media Downloader</span>
                </CardTitle>
                <CardDescription>Download reels, videos, and shorts instantly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input 
                    placeholder="Paste Instagram/YouTube URL here..." 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <Button onClick={handleDownload} disabled={downloading || !url}>
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/50 p-4 text-center">
                    <Video className="mb-2 h-6 w-6 text-muted-foreground" />
                    <span className="text-xs font-medium">Video (MP4)</span>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-1">Download</Button>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/50 p-4 text-center">
                    <ImageIcon className="mb-2 h-6 w-6 text-muted-foreground" />
                    <span className="text-xs font-medium">Thumbnail (JPG)</span>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-1">Download</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : activeTool === 'compressor' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <span>Image Compressor</span>
                </CardTitle>
                <CardDescription>Reduce image size without losing quality.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-primary/50">
                  {compressing ? (
                    <div className="flex flex-col items-center space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Compressing image...</p>
                    </div>
                  ) : compressedImage ? (
                    <div className="flex flex-col items-center space-y-4">
                      <img src={compressedImage} alt="Compressed" className="h-32 w-32 rounded-lg object-cover shadow-md" />
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Compressed successfully!</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button asChild variant="outline" size="sm">
                          <a href={compressedImage} download="compressed-image.jpg">
                            <FileDown className="mr-2 h-4 w-4" />
                            Download
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setCompressedImage(null)}>
                          Try another
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2 text-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB</p>
                      </div>
                      <input 
                        type="file" 
                        className="absolute inset-0 h-full w-full opacity-0 cursor-pointer" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>{tools.find(t => t.id === activeTool)?.name} Assistant</span>
                </CardTitle>
                <CardDescription>
                  {activeTool === 'strategy' && "Generate a full 30-day marketing strategy for any brand."}
                  {activeTool === 'roi' && "Calculate your campaign ROI, CPA, and ROAS instantly."}
                  {activeTool === 'abtest' && "Design a scientific A/B test to optimize your conversions."}
                  {activeTool === 'ads' && "Generate persuasive copy for Google, Meta, or LinkedIn ads."}
                  {activeTool === 'seo' && "Discover high-ranking keywords and content ideas."}
                  {activeTool === 'email' && "Create subject lines that people actually click."}
                  {activeTool === 'utm' && "Quickly build trackable URLs for your campaigns."}
                  {activeTool === 'competitor' && "Research competitor strategies and find market gaps using real-time data."}
                  {activeTool === 'influencer' && "Discover potential influencers and creators for partnerships."}
                  {activeTool === 'hashtag' && "Generate strategic hashtag sets to boost your social reach."}
                  {activeTool === 'brand-voice' && "Analyze existing content to define and document your brand voice."}
                  {activeTool === 'product-desc' && "Create persuasive, benefit-driven descriptions for your e-commerce products."}
                  {activeTool === 'bio-gen' && "Generate professional and creative bios for your social media profiles."}
                  {activeTool === 'video-script' && "Write engaging scripts for TikTok, Reels, or YouTube Shorts."}
                  {activeTool === 'review-reply' && "Generate professional and thoughtful responses to customer reviews."}
                  {activeTool === 'social-listening' && "Analyze brand sentiment and trending conversations around your topic."}
                  {activeTool === 'lead-magnet' && "Generate high-converting ideas for lead magnets and opt-in offers."}
                  {activeTool === 'email-sequence' && "Plan a multi-step email nurture sequence to convert leads."}
                  {activeTool === 'landing-page' && "Generate a professional structure and copy for high-converting landing pages."}
                  {activeTool === 'campaign-brief' && "Create a detailed professional brief for your next marketing campaign."}
                  {activeTool === 'social-reply' && "Draft engaging and helpful replies to social media comments."}
                  {activeTool === 'content-calendar' && "Generate a strategic 7-day content calendar for your brand."}
                  {activeTool === 'ad-budget' && "Optimize your ad budget allocation across different digital channels."}
                  {activeTool === 'lead-scorer' && "Analyze lead data to determine quality and sales readiness."}
                  {activeTool === 'sales-script' && "Generate persuasive scripts for cold calls, emails, or discovery meetings."}
                  {activeTool === 'crisis-comms' && "Draft professional responses and strategies for brand crisis management."}
                  {activeTool === 'press-release' && "Write professional press releases for launches or major announcements."}
                  {activeTool === 'link-bio' && "Optimize your social media link-in-bio for maximum conversions."}
                  {activeTool === 'advocacy' && "Generate content for employees to share and boost brand reach."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {activeTool === 'utm' ? "Base URL" : 
                       activeTool === 'competitor' ? "Competitor/Niche" : 
                       activeTool === 'influencer' ? "Niche/Topic" :
                       activeTool === 'hashtag' ? "Post Topic" : 
                       activeTool === 'roi' ? "Total Ad Spend ($)" :
                       activeTool === 'abtest' ? "What are you testing?" :
                       activeTool === 'strategy' ? "Brand/Product Name" : 
                       activeTool === 'brand-voice' ? "Sample Text" :
                       activeTool === 'product-desc' ? "Product Name" :
                       activeTool === 'bio-gen' ? "Profile Name/Niche" :
                       activeTool === 'video-script' ? "Video Topic" :
                       activeTool === 'review-reply' ? "Customer Review" : 
                       activeTool === 'social-listening' ? "Brand/Topic" :
                       activeTool === 'lead-magnet' ? "Product/Offer" :
                       activeTool === 'email-sequence' ? "Offer/Topic" :
                       activeTool === 'landing-page' ? "Product/Service" :
                       activeTool === 'campaign-brief' ? "Campaign Name" :
                       activeTool === 'social-reply' ? "Social Comment" :
                       activeTool === 'content-calendar' ? "Brand/Niche" :
                       activeTool === 'ad-budget' ? "Total Budget ($)" : 
                       activeTool === 'lead-scorer' ? "Lead Description" :
                       activeTool === 'sales-script' ? "Product/Service" :
                       activeTool === 'crisis-comms' ? "Crisis Description" :
                       activeTool === 'press-release' ? "Announcement Topic" :
                       activeTool === 'link-bio' ? "Brand/Profile" :
                       activeTool === 'advocacy' ? "Company News/Topic" : "Product/Service Name"}
                    </label>
                    {activeTool === 'brand-voice' || activeTool === 'review-reply' || activeTool === 'social-reply' || activeTool === 'lead-scorer' || activeTool === 'crisis-comms' || activeTool === 'social-audit' ? (
                      <textarea 
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={activeTool === 'brand-voice' ? "Paste a sample of your writing..." : activeTool === 'social-reply' ? "Paste the social comment here..." : activeTool === 'lead-scorer' ? "Describe the lead (role, company, interaction)..." : activeTool === 'crisis-comms' ? "Describe the situation..." : activeTool === 'social-audit' ? "Describe the current social presence..." : "Paste the text here..."}
                        value={input1}
                        onChange={(e) => setInput1(e.target.value)}
                      />
                    ) : (
                      <Input 
                        placeholder={activeTool === 'utm' ? "example.com" : 
                                     activeTool === 'competitor' ? "e.g., Nike, Coffee Shops" : 
                                     activeTool === 'influencer' ? "e.g., Sustainable Fashion" :
                                     activeTool === 'hashtag' ? "e.g., Vegan Recipes" : 
                                     activeTool === 'roi' ? "e.g., 5000" :
                                     activeTool === 'abtest' ? "e.g., Landing Page Headline" :
                                     activeTool === 'strategy' ? "e.g., Eco-Friendly Skincare" : 
                                     activeTool === 'product-desc' ? "e.g., Wireless Earbuds" :
                                     activeTool === 'bio-gen' ? "e.g., Digital Nomad" :
                                     activeTool === 'video-script' ? "e.g., Morning Routine" : 
                                     activeTool === 'ad-budget' ? "e.g., 10000" : 
                                     activeTool === 'sales-script' ? "e.g., SEO Services" :
                                     activeTool === 'press-release' ? "e.g., New Office Opening" :
                                     activeTool === 'link-bio' ? "e.g., Fitness Coach" :
                                     activeTool === 'advocacy' ? "e.g., New Feature Launch" : 
                                     activeTool === 'content-curation' ? "e.g., AI in Marketing" :
                                     activeTool === 'post-optimizer' ? "e.g., Tech Startup" :
                                     activeTool === 'community-mgr' ? "e.g., SaaS Users Group" :
                                     activeTool === 'report-gen' ? "e.g., Acme Corp Q1" : "e.g., Luxury Watches"} 
                        value={input1}
                        onChange={(e) => setInput1(e.target.value)}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {activeTool === 'ads' ? "Target Platform" : 
                       activeTool === 'seo' ? "Niche Focus" : 
                       activeTool === 'email' ? "Campaign Goal" : 
                       activeTool === 'competitor' ? "Analysis Focus" : 
                       activeTool === 'influencer' ? "Platform" :
                       activeTool === 'hashtag' ? "Platform" : 
                       activeTool === 'roi' ? "Total Revenue ($)" :
                       activeTool === 'abtest' ? "Target Metric" :
                       activeTool === 'strategy' ? "Primary Goal" : 
                       activeTool === 'brand-voice' ? "Focus Area" :
                       activeTool === 'product-desc' ? "Target Audience" :
                       activeTool === 'bio-gen' ? "Platform" :
                       activeTool === 'video-script' ? "Video Goal" :
                       activeTool === 'review-reply' ? "Sentiment" : 
                       activeTool === 'social-listening' ? "Context" :
                       activeTool === 'lead-magnet' ? "Target Audience" :
                       activeTool === 'email-sequence' ? "Goal" :
                       activeTool === 'landing-page' ? "Primary Goal" :
                       activeTool === 'campaign-brief' ? "Goal" :
                       activeTool === 'social-reply' ? "Brand Tone" :
                       activeTool === 'content-calendar' ? "Platforms" :
                       activeTool === 'ad-budget' ? "Campaign Type" : 
                       activeTool === 'lead-scorer' ? "Industry/Context" :
                       activeTool === 'sales-script' ? "Script Type" :
                       activeTool === 'crisis-comms' ? "Severity" :
                       activeTool === 'press-release' ? "Announcement Type" :
                       activeTool === 'link-bio' ? "Primary Goal" :
                       activeTool === 'advocacy' ? "Tone" : 
                       activeTool === 'content-curation' ? "Target Audience" :
                       activeTool === 'social-audit' ? "Platforms to Audit" :
                       activeTool === 'post-optimizer' ? "Target Platform" :
                       activeTool === 'community-mgr' ? "Primary Goal" :
                       activeTool === 'report-gen' ? "Key Results/Metrics" : "Source (e.g., facebook)"}
                    </label>
                    <Input 
                      placeholder={activeTool === 'competitor' ? "e.g., Social Media, Pricing" : 
                                   activeTool === 'influencer' ? "e.g., Instagram, TikTok" :
                                   activeTool === 'hashtag' ? "e.g., Instagram, Twitter" : 
                                   activeTool === 'roi' ? "e.g., 15000" :
                                   activeTool === 'abtest' ? "e.g., Conversion Rate" :
                                   activeTool === 'strategy' ? "e.g., Sales, Brand Awareness" : 
                                   activeTool === 'brand-voice' ? "e.g., Professional, Bold" :
                                   activeTool === 'product-desc' ? "e.g., Busy Professionals" :
                                   activeTool === 'bio-gen' ? "e.g., Instagram" :
                                   activeTool === 'video-script' ? "e.g., Educational" :
                                   activeTool === 'review-reply' ? "e.g., Positive/Negative" : 
                                   activeTool === 'ad-budget' ? "e.g., Lead Gen" : 
                                   activeTool === 'lead-scorer' ? "e.g., B2B SaaS" :
                                   activeTool === 'sales-script' ? "e.g., Cold Call" :
                                   activeTool === 'crisis-comms' ? "e.g., High" :
                                   activeTool === 'press-release' ? "e.g., Product Launch" :
                                   activeTool === 'link-bio' ? "e.g., Drive Sales" :
                                   activeTool === 'advocacy' ? "e.g., Enthusiastic" : "e.g., Instagram, Real Estate, Sale"} 
                      value={input2}
                      onChange={(e) => setInput2(e.target.value)}
                    />
                  </div>
                </div>
                <Button className="w-full shadow-lg shadow-primary/20" onClick={runTool} disabled={loading || !input1}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}
                  Run {tools.find(t => t.id === activeTool)?.name}
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

          {result && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Result</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert text-sm font-sans leading-relaxed">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

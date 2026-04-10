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
  UserPlus,
  ChevronDown,
  X,
  AlertCircle,
  ArrowLeft,
  Printer
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, addDoc, query, orderBy, onSnapshot, handleFirestoreError, OperationType } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";

type ToolType = 'ads' | 'seo' | 'email' | 'utm' | 'downloader' | 'compressor' | 'competitor' | 'influencer' | 'hashtag' | 'strategy' | 'roi' | 'abtest' | 'brand-voice' | 'product-desc' | 'bio-gen' | 'video-script' | 'review-reply' | 'social-listening' | 'lead-magnet' | 'email-sequence' | 'landing-page' | 'campaign-brief' | 'social-reply' | 'content-calendar' | 'ad-budget' | 'lead-scorer' | 'sales-script' | 'crisis-comms' | 'press-release' | 'link-bio' | 'advocacy' | 'content-curation' | 'social-audit' | 'post-optimizer' | 'community-mgr' | 'report-gen' | 'youtube-seo' | 'market-research' | 'content-repurpose' | 'keyword-gap' | 'competitor-pricing' | 'ad-creative' | 'site-audit' | 'rank-tracker' | 'backlink-checker' | 'robots-sitemap' | 'url-shortener' | 'qr-generator' | 'contract-gen' | 'time-estimate';

export function Tools() {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<ToolType>('strategy');
  const [mobileView, setMobileView] = useState<'list' | 'workspace'>('list');
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const handlePrint = () => {
    window.print();
  };

  const isValidYouTubeUrl = (url: string) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return pattern.test(url);
  };

  const runTool = async () => {
    if (!input1 || !user) return;
    
    if (activeTool === 'youtube-seo' && !isValidYouTubeUrl(input1)) {
      setError("Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=...)");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let prompt = "";

      if (activeTool === 'ads') {
        prompt = `Perform professional internet research on current high-performing ad trends and competitor strategies for: "${input1}". 
        Target Platform: ${input2 || 'Google/Meta'}.
        Using real-time search data, generate 3 high-converting ad copies including:
        - Catchy Headlines & Benefit-driven Primary Text
        - Strategic CTAs optimized for mobile users
        - Competitive Analysis: How these ads outperform current competitor offerings
        - Mobile Focus: Specific layout or visual suggestions for mobile-first ad formats.`;
      } else if (activeTool === 'seo') {
        prompt = `Perform a deep-dive SEO and keyword research for the topic: "${input1}". 
        Focus Niche: ${input2 || 'General'}.
        Using real-time search data and competitive benchmarking, provide:
        - 10 High-intent, trending SEO keywords with estimated difficulty and search volume
        - 5 Long-tail keyword opportunities competitors are missing
        - 3 Blog title ideas optimized for current search trends and mobile readability
        - Content structure recommendations with a focus on mobile user experience (Core Web Vitals).`;
      } else if (activeTool === 'email') {
        prompt = `Generate professional email marketing content for: "${input1}". 
        Context: ${input2 || 'Marketing Newsletter'}.
        Using real-time data on email marketing trends, provide:
        - 5 High-open-rate subject lines (A/B test ideas)
        - A structured email body with a clear hook, value, and CTA
        - Mobile Optimization: Specific advice for mobile-friendly layouts and "fat-finger" CTAs
        - Competitive Edge: How to stand out in a crowded inbox based on current industry benchmarks.`;
      } else if (activeTool === 'competitor') {
        prompt = `Using professional internet search and real-time data, perform a deep-dive digital marketing analysis for: "${input1}". 
        Focus area: ${input2 || 'General Strategy'}.
        
        Please provide a comprehensive report including:
        1. **Target Audience Analysis**: Detailed breakdown of their primary and secondary audience segments, demographics, and psychographics.
        2. **Content Themes & Messaging**: Analysis of their main content pillars, brand voice, and recurring messaging themes across social and web.
        3. **Competitive Gaps**: Identify specific weaknesses, underserved audience segments, or missing content types in their current strategy.
        4. **Counter-Strategies**: Actionable, step-by-step recommendations on how to out-position them and capture their market share.
        5. **Unique Value Proposition (UVP)**: What makes them stand out, and how can we differentiate?
        
        Use recent information, specific examples, and data points if available.`;
      } else if (activeTool === 'influencer') {
        prompt = `Perform professional internet research to find 10 potential influencers or content creators in the niche: "${input1}". 
        Platform Focus: ${input2 || 'Instagram/YouTube/TikTok'}.
        Using real-time search, provide for each:
        - Name & Handle
        - Creator type (Micro/Macro/Mega)
        - Content style & Audience alignment
        - Estimated engagement rates & recent viral content
        - Why they are a strategic fit for this niche.`;
      } else if (activeTool === 'hashtag') {
        prompt = `Perform real-time internet research to generate a strategic set of 30 hashtags for: "${input1}". 
        Platform: ${input2 || 'Instagram'}.
        Using current trending data, categorize them into:
        - High volume (Broad) & Medium volume (Niche)
        - Low volume (Community) & Branded/Campaign specific
        - Analysis of which hashtags competitors are currently using successfully.`;
      } else if (activeTool === 'strategy') {
        prompt = `Generate a comprehensive professional 30-day digital marketing strategy for: "${input1}". 
        Goal: ${input2 || 'Brand Awareness & Growth'}.
        Using real-time internet search and competitive benchmarking, include:
        - Weekly themes & Content mix (Educational, Promotional, Interactive)
        - Competitive Counter-Moves: Specific tactics to outperform top competitors
        - Mobile-First Approach: How to optimize the entire 30-day funnel for mobile users
        - Key performance indicators (KPIs) & Budget allocation suggestions.`;
      } else if (activeTool === 'youtube-seo') {
        prompt = `First, use Google Search to find and review the content of the YouTube video at ${input1}. 
        You MUST attempt to find the video's current title, full description, and if available, the transcript or a detailed summary of the video content.
        
        Based on your detailed review of the actual video content (not just the URL), generate:
        1. **3 SEO-Friendly Titles**: Catchy, high-CTR, and keyword-rich, specifically tailored to the video's unique value proposition.
        2. **Optimized Description**: Including a strong hook, a 2-3 paragraph summary of the video's actual content, key takeaways, and clear CTAs.
        3. **15 Trending Hashtags**: Highly relevant to the specific topics and keywords identified in the video.
        4. **20 High-Volume Keywords/Tags**: Strategic tags derived from the video's transcript and metadata for maximum search visibility.
        
        Tailor all metadata for: ${input2 || 'General Audience'}.`;
      } else if (activeTool === 'roi') {
        prompt = `Perform a professional ROI analysis and competitive benchmarking for a campaign with:
        - Total Spend: ₹${input1}
        - Total Revenue/Conversions: ₹${input2 || '0'}
        Using real-time industry data, provide:
        - ROI, ROAS, and CPA calculations
        - Benchmarking: How these results compare to industry averages for similar campaigns
        - 3 Actionable steps to improve ROI based on current market efficiencies.`;
      } else if (activeTool === 'abtest') {
        prompt = `Design a professional, scientific A/B test plan for: "${input1}". 
        Target Metric: ${input2 || 'Conversion Rate'}.
        Using real-time data on conversion rate optimization (CRO) trends, provide:
        - Hypothesis & Variable definitions (Control vs. Variant)
        - Mobile-Specific Testing: Ideas for mobile-only A/B tests
        - Sample size & Duration recommendations
        - Competitive Insights: What top brands are currently testing in this niche.`;
      } else if (activeTool === 'brand-voice') {
        prompt = `Perform a professional analysis to define and document the brand voice for: "${input1}". 
        Focus Area: ${input2 || 'General Branding'}.
        Using real-time internet search to analyze the brand's current presence (if any) and competitor tones, provide:
        - Core Brand Personality Traits
        - Tone & Style Guidelines (Do's and Don'ts)
        - Sample messaging for different platforms (LinkedIn vs. TikTok)
        - Competitive Differentiation: How this voice stands out from the competition.`;
      } else if (activeTool === 'product-desc') {
        prompt = `Generate professional, high-converting product descriptions for: "${input1}". 
        Target Audience: ${input2 || 'General'}.
        Using real-time internet search to analyze top-performing e-commerce listings in this niche, provide:
        - 3 Variations (Short, Story-driven, Feature-rich)
        - SEO-optimized keywords for product search
        - Mobile-First Formatting: Bullet points and scannable text for mobile shoppers
        - Competitive Edge: Highlighting USPs that competitors are missing.`;
      } else if (activeTool === 'bio-gen') {
        prompt = `Generate 5 professional and creative social media bios for: "${input1}". 
        Platform: ${input2 || 'Instagram/LinkedIn'}.
        Using real-time data on high-converting bio trends, provide:
        - 5 Variations (Professional, Witty, Minimalist, etc.)
        - Mobile Optimization: Effective use of emojis and line breaks for mobile readability
        - Link-in-bio strategy suggestions.`;
      } else if (activeTool === 'video-script') {
        prompt = `Write a professional, high-engagement video script for: "${input1}". 
        Video Goal: ${input2 || 'Educational/Viral'}.
        Using real-time data on trending video formats (TikTok/Reels/Shorts), provide:
        - The Hook (first 3 seconds)
        - Visual & Audio cues for each scene
        - Call to Action (CTA) optimized for mobile interaction
        - Competitive Analysis: What makes this script more engaging than current trending videos in this niche.`;
      } else if (activeTool === 'review-reply') {
        prompt = `Generate professional and thoughtful responses to this customer review: "${input1}". 
        Sentiment: ${input2 || 'Analyze automatically'}.
        Using real-time data on brand reputation management, provide:
        - 3 Variations (Professional, Empathetic, Action-oriented)
        - SEO benefits: Incorporating keywords naturally into the reply
        - Strategy for turning a negative review into a positive brand moment.`;
      } else if (activeTool === 'social-listening') {
        prompt = `Perform a professional social listening and sentiment analysis for the brand/topic: "${input1}". 
        Context: ${input2 || 'General Sentiment'}.
        Using real-time internet search and social media data, provide:
        - Detailed Sentiment Analysis (Positive/Neutral/Negative) with recent examples
        - Top 5 Trending Conversations & Hashtags
        - Major Customer Pain Points, Complaints, or Praises
        - Viral mentions or recent news events
        - Strategic engagement recommendations.`;
      } else if (activeTool === 'lead-magnet') {
        prompt = `Perform professional internet research to generate 5 high-converting lead magnet ideas for: "${input1}". 
        Target Audience: ${input2 || 'General'}.
        Using real-time search data, provide:
        - 5 Unique Lead Magnet concepts (e.g., Checklists, Webinars, Tools)
        - Landing Page Hook & Value Proposition for each
        - Mobile-First Delivery: How to ensure the lead magnet is easily consumable on mobile.`;
      } else if (activeTool === 'email-sequence') {
        prompt = `Plan a professional 5-step email nurture sequence for: "${input1}". 
        Goal: ${input2 || 'Conversion/Onboarding'}.
        Using real-time data on email automation best practices, provide:
        - Subject lines & Core message for each of the 5 emails
        - Timing & Trigger recommendations
        - Mobile Optimization: Ensuring every email is perfectly readable on mobile devices.`;
      } else if (activeTool === 'landing-page') {
        prompt = `Generate a professional structure and high-converting copy for a landing page for: "${input1}". 
        Primary Goal: ${input2 || 'Lead Generation/Sales'}.
        Using real-time internet search and competitive benchmarking, provide:
        - Headline, Sub-headline, and Hero Section copy
        - Benefit-driven features & Social Proof sections
        - Mobile Responsiveness Plan: Specific layout advice for mobile-first users
        - Competitive Analysis: How this LP outperforms top competitors in the niche.`;
      } else if (activeTool === 'campaign-brief') {
        prompt = `Create a professional, comprehensive campaign brief for: "${input1}". 
        Goal: ${input2 || 'Growth/Launch'}.
        Using real-time internet search and professional standards, include:
        - Campaign Objectives & Target Audience
        - Messaging Pillars & Creative Direction
        - Competitive Benchmarking: Analysis of similar successful campaigns
        - Channel Strategy & Success Metrics.`;
      } else if (activeTool === 'social-reply') {
        prompt = `Draft professional and engaging replies to this social media comment: "${input1}". 
        Brand Tone: ${input2 || 'Friendly & Helpful'}.
        Using real-time data on social media engagement trends, provide:
        - 3 Variations (Helpful, Witty, Brand-aligned)
        - Strategy for driving further engagement or conversion from the comment.`;
      } else if (activeTool === 'content-calendar') {
        prompt = `Generate a professional 7-day strategic social media content calendar for: "${input1}". 
        Platforms: ${input2 || 'Instagram & LinkedIn'}.
        Using real-time internet search for trending topics in this niche, provide:
        - Day-by-day post topics, formats, and estimated best times to post
        - Mobile-First Content: Suggestions for vertical video, carousels, and mobile-friendly captions
        - Engagement prompts & Hashtag strategy for each day.`;
      } else if (activeTool === 'ad-budget') {
        prompt = `Perform a professional ad budget optimization for a total spend of ₹${input1}. 
        Campaign Type: ${input2 || 'Digital Marketing'}.
        Using real-time data on current ad platform costs (CPM/CPC), provide:
        - Recommended allocation across channels (Meta, Google, TikTok, etc.)
        - Estimated Reach, Impressions, and Conversions based on current benchmarks
        - Scaling strategy & Competitive cost analysis.`;
      } else if (activeTool === 'lead-scorer') {
        prompt = `Perform a professional AI lead qualification and scoring for: "${input1}". 
        Industry/Context: ${input2 || 'B2B SaaS'}.
        Using real-time data on lead quality benchmarks, provide:
        - Lead Score (0-100) & Qualification Status (MQL, SQL, or Junk)
        - Detailed analysis of strengths/weaknesses
        - Recommended next action for the sales team.`;
      } else if (activeTool === 'sales-script') {
        prompt = `Generate a professional, high-converting sales script for: "${input1}". 
        Script Type: ${input2 || 'Cold Call/Discovery'}.
        Using real-time data on successful sales methodologies, provide:
        - The Hook, Value Proposition, and Objection Handling
        - The Close & Next Step
        - Competitive Edge: How to position against common competitor objections.`;
      } else if (activeTool === 'crisis-comms') {
        prompt = `Draft a professional crisis communication strategy and response for: "${input1}". 
        Severity: ${input2 || 'Medium/High'}.
        Using real-time data on brand reputation management, provide:
        - Official Statement & Internal talking points
        - Social media response templates & Channel strategy
        - Monitoring plan to track sentiment recovery.`;
      } else if (activeTool === 'press-release') {
        prompt = `Write a professional, news-ready press release for: "${input1}". 
        Announcement Type: ${input2 || 'Product Launch/Major News'}.
        Using real-time PR standards and trending news formats, include:
        - Catchy Headline, Dateline, and Lead Paragraph
        - Executive Quote placeholder & Boilerplate
        - Media Contact info & Distribution strategy.`;
      } else if (activeTool === 'link-bio') {
        prompt = `Perform a professional optimization of a Link-in-bio page for: "${input1}". 
        Primary Goal: ${input2 || 'Drive Conversions'}.
        Using real-time data on high-performing mobile landing pages, suggest:
        - 5 High-priority links with conversion-optimized titles
        - Mobile-First Layout: Visual hierarchy and button placement for mobile users
        - Tracking & Analytics strategy.`;
      } else if (activeTool === 'advocacy') {
        prompt = `Generate a professional Employee Advocacy content set for: "${input1}". 
        Tone: ${input2 || 'Proud & Professional'}.
        Using real-time data on employee advocacy trends, provide:
        - 3 Variations of the post for employees to share on LinkedIn/Twitter
        - Why this matters to the brand's reach
        - Suggested visual assets for maximum engagement.`;
      } else if (activeTool === 'content-curation') {
        prompt = `Find and curate 5 high-quality content pieces (articles, videos, or news) for the topic: "${input1}". 
        Target Audience: ${input2 || 'General'}.
        For each piece, provide:
        - A suggested social media share caption
        - Why it's relevant to the audience
        - A "Takeaway" or "Insight" to add value to the share.`;
      } else if (activeTool === 'social-audit') {
        prompt = `Perform a professional deep-dive social media audit for the profile: "${input1}". 
        Competitors/Platforms: ${input2 || 'Identify top 3 competitors automatically'}.
        Using real-time internet search and social media data, provide a comprehensive report including:
        1. **Profile Optimization**: Detailed analysis of Bio, Profile Picture, Cover Image, Links, and overall branding consistency.
        2. **Content Performance**: Analysis of recent posts, engagement rates, content variety, and visual quality.
        3. **Audience Engagement**: How the brand interacts with followers, response quality, and community sentiment.
        4. **Competitive Benchmarking**: Analyze 2-3 top competitors (either provided or identified). Compare their content strategy, engagement tactics, and audience sentiment versus the target profile.
        5. **Mobile Responsiveness Audit**: Evaluate the profile's mobile-first experience. Are the links easy to tap? Is the bio readable? Are the visuals optimized for vertical scrolling?
        6. **Actionable Recommendations**: Provide a clear roadmap on how to out-perform the identified competitors and specific steps to enhance mobile responsiveness and user experience.`;
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
      } else if (activeTool === 'market-research') {
        prompt = `Perform a professional deep-dive market research for the niche/topic: "${input1}". 
        Focus: ${input2 || 'Market Trends & Consumer Behavior'}.
        Using real-time internet search and professional data, provide:
        - Current Market Size, Growth Potential & CAGR
        - 5 Major Trends shaping this niche in 2024-2026
        - Detailed Consumer Personas & Pain Points
        - 5 High-potential sub-niches or blue-ocean opportunities
        - Regulatory or technological shifts to watch.`;
      } else if (activeTool === 'content-repurpose') {
        prompt = `Perform a professional content repurposing strategy for: "${input1}". 
        Target Audience: ${input2 || 'General'}.
        Using real-time data on high-performing content formats, repurpose into:
        - 1 LinkedIn Thought Leadership Post
        - 1 Instagram Carousel Outline (Mobile-optimized)
        - 1 Twitter/X Thread
        - 1 Short-form Video Script (TikTok/Reels)
        - 1 Email Newsletter Segment.`;
      } else if (activeTool === 'keyword-gap') {
        prompt = `Perform a professional keyword gap analysis and search intent research for: "${input1}". 
        Competitor (optional): ${input2 || 'General Market'}.
        Using real-time search data, identify:
        - 15 High-value keywords competitors are ranking for but you aren't
        - 5 "Low-hanging fruit" keywords with high volume and low difficulty
        - Search Intent analysis for each keyword (Informational, Transactional, etc.)
        - Content strategy to capture these gaps
        - Estimated traffic potential.`;
      } else if (activeTool === 'report-gen') {
        prompt = `Generate a professional, executive-level marketing report summary for: "${input1}". 
        Key Results/Metrics: ${input2 || 'General Performance'}.
        Using real-time data visualization best practices, include:
        - Executive Summary & Key Wins
        - Metrics Breakdown (Reach, Engagement, Conversions) with industry benchmarking
        - Next Month's Strategic Focus & Recommendations.`;
      } else if (activeTool === 'competitor-pricing') {
        prompt = `Perform a professional internet research and competitive pricing analysis for: "${input1}". 
        Competitors: ${input2 || 'Identify top 3 automatically'}.
        Using real-time search data, provide:
        - Pricing models of top competitors (Subscription, One-time, Tiered, etc.)
        - Estimated price points and value propositions
        - Discounting and promotion strategies observed
        - Strategic recommendations for your own pricing to remain competitive.`;
      } else if (activeTool === 'ad-creative') {
        prompt = `Generate professional ad creative concepts and visual ideas for: "${input1}". 
        Platform: ${input2 || 'Meta/Instagram'}.
        Using real-time data on high-performing visual trends, provide:
        - 3 Creative Concepts (e.g., User-Generated Content style, Minimalist, Bold Typography)
        - Detailed visual descriptions for images/videos
        - Color palette and font recommendations based on current design trends
        - Mobile-First Design: Ensuring visuals are optimized for small screens and vertical formats.`;
      } else if (activeTool === 'site-audit') {
        prompt = `As a Senior Technical SEO Auditor, perform a professional deep-dive research on the website: ${input1}
        Focus Area: ${input2 || "General SEO Health"}
        
        Please provide a comprehensive Site Audit Report including:
        1. **Technical SEO Issues**: Potential crawl errors, site speed bottlenecks, and mobile-friendliness issues.
        2. **On-Page Optimization**: Analysis of meta tags, header structures, and keyword density.
        3. **Content Quality**: Evaluation of E-E-A-T signals and content gaps.
        4. **Actionable Fixes**: Priority list of technical and content improvements to boost rankings.`;
      } else if (activeTool === 'rank-tracker') {
        prompt = `As an SEO Strategist, analyze the search engine ranking potential for:
        Website/URL: ${input1}
        Target Keywords: ${input2}
        
        Please provide:
        1. **Estimated Current Position**: Based on current SERP data for these keywords.
        2. **Competitor Comparison**: Who is currently outranking this site and why.
        3. **Ranking Difficulty**: A score from 1-100 and explanation.
        4. **Optimization Strategy**: Specific steps to move to the top 3 positions.`;
      } else if (activeTool === 'backlink-checker') {
        prompt = `As a Link Building Expert, perform deep research on the backlink profile and authority of: ${input1}
        Competitors to compare: ${input2}
        
        Please provide:
        1. **Authority Analysis**: Estimated Domain Authority and Trust Flow.
        2. **Backlink Opportunities**: High-authority sites in this niche that are likely to link back.
        3. **Competitor Backlink Gaps**: Where competitors have links that this site is missing.
        4. **Link Building Strategy**: A 4-week plan to acquire high-quality, relevant backlinks.`;
      } else if (activeTool === 'robots-sitemap') {
        prompt = `As a Technical SEO Specialist, generate a professional Robots.txt and Sitemap structure for:
        Website URL: ${input1}
        Specific Requirements: ${input2}
        
        Please provide:
        1. **Optimized Robots.txt**: Including proper Allow/Disallow rules and sitemap reference.
        2. **XML Sitemap Structure**: A logical hierarchy of pages to be indexed.
        3. **Indexing Strategy**: Tips on how to ensure Google crawls the most important pages first.`;
      } else if (activeTool === 'url-shortener') {
        prompt = `As a Digital Marketer, suggest a professional URL shortening and tracking strategy for:
        Long URL: ${input1}
        Campaign Name/Context: ${input2}
        
        Please provide:
        1. **Branded Short Link Suggestions**: Using custom domains or professional slugs.
        2. **Tracking Parameter Setup (UTM)**: The exact UTM string to append for accurate analytics.
        3. **QR Code Usage Strategy**: Where and how to use a QR code for this link to maximize offline-to-online conversion.`;
      } else if (activeTool === 'qr-generator') {
        prompt = `As a Creative Designer, provide a strategy for a custom, high-converting QR code for:
        Target URL/Content: ${input1}
        Brand Style/Context: ${input2}
        
        Please provide:
        1. **Design Concept**: How to style the QR code (colors, logo integration, frame) to match the brand.
        2. **Call-to-Action (CTA)**: The perfect text to place around the QR code to encourage scans.
        3. **Placement Strategy**: The best physical or digital locations to place this QR code for maximum engagement.`;
      } else if (activeTool === 'contract-gen') {
        prompt = `As a Professional Freelance Consultant, generate a comprehensive Service Agreement/Contract outline for:
        Service/Project: ${input1}
        Client Details & Terms: ${input2}
        
        Please provide a professional contract structure including:
        1. **Scope of Work**: Detailed breakdown of deliverables.
        2. **Payment Terms**: Milestone-based structure and late fee clauses.
        3. **IP & Confidentiality**: Standard protection for both parties.
        4. **Termination & Dispute Resolution**: Clear exit strategy and legal jurisdiction.`;
      } else if (activeTool === 'time-estimate') {
        prompt = `As a Project Manager, provide a professional time and cost estimate for:
        Project/Task: ${input1}
        Complexity/Details: ${input2}
        
        Please provide:
        1. **Phase Breakdown**: Estimated hours for Research, Design, Development, and Testing.
        2. **Total Estimated Hours**: A realistic range (Min-Max).
        3. **Resource Requirements**: What tools or additional help might be needed.
        4. **Risk Assessment**: Potential bottlenecks that could delay the project.`;
      }

      if (activeTool === 'utm') {
        const baseUrl = input1.startsWith('http') ? input1 : `https://${input1}`;
        const utm = `${baseUrl}?utm_source=${input2 || 'google'}&utm_medium=cpc&utm_campaign=growth_os&utm_content=ai_assistant`;
        setResult(utm);
      } else {
        const isDeepSearchTool = [
          'competitor', 'influencer', 'strategy', 'youtube-seo', 
          'market-research', 'keyword-gap', 'social-listening', 
          'social-audit', 'ads', 'seo', 'campaign-brief', 
          'crisis-comms', 'report-gen', 'content-curation',
          'post-optimizer', 'community-mgr', 'email', 'hashtag',
          'roi', 'abtest', 'brand-voice', 'product-desc', 'bio-gen',
          'video-script', 'review-reply', 'lead-magnet', 'email-sequence',
          'landing-page', 'social-reply', 'content-calendar', 'ad-budget',
          'lead-scorer', 'sales-script', 'press-release', 'link-bio',
          'advocacy', 'content-repurpose', 'competitor-pricing', 'ad-creative',
          'site-audit', 'rank-tracker', 'backlink-checker', 'robots-sitemap',
          'url-shortener', 'qr-generator', 'contract-gen', 'time-estimate'
        ].includes(activeTool);

        const response = await ai.models.generateContent({
          model: isDeepSearchTool ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview",
          contents: prompt,
          config: isDeepSearchTool ? { tools: [{ googleSearch: {} }] } : undefined
        });
        const text = response.text || "No result generated.";
        
        if (activeTool === 'youtube-seo' && text.toLowerCase().includes("could not find") && text.toLowerCase().includes("video")) {
          setError("We couldn't fetch the content for this video. Please ensure the URL is correct and the video is public.");
          setLoading(false);
          return;
        }

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
      console.error("Tool Error:", error);
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/tasks`);
      setError("An unexpected error occurred while running the tool. Please try again later.");
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
    { id: 'competitor-pricing', name: 'Competitor Pricing', icon: Coins, desc: 'Analyze competitor pricing models', category: 'Strategy' },
    { id: 'market-research', name: 'Market Research', icon: Globe, desc: 'Deep dive into niche trends', category: 'Strategy' },
    { id: 'roi', name: 'ROI Calc', icon: Calculator, desc: 'Analyze campaign ROI', category: 'Strategy' },
    { id: 'abtest', name: 'A/B Planner', icon: Split, desc: 'Design experiments', category: 'Strategy' },
    
    { id: 'ads', name: 'Ad Copy', icon: Megaphone, desc: 'High-converting ad copy', category: 'Content' },
    { id: 'ad-creative', name: 'Ad Creative', icon: ImageIcon, desc: 'Visual concepts for ads', category: 'Content' },
    { id: 'site-audit', name: 'Site Audit', icon: Search, desc: 'Deep technical SEO website audit', category: 'SEO' },
    { id: 'rank-tracker', name: 'Rank Tracker', icon: TrendingUpIcon, desc: 'Analyze keyword ranking potential', category: 'SEO' },
    { id: 'backlink-checker', name: 'Backlink Checker', icon: LinkIcon, desc: 'Analyze backlink profile and gaps', category: 'SEO' },
    { id: 'robots-sitemap', name: 'SEO Utilities', icon: FileText, desc: 'Generate Robots.txt and Sitemaps', category: 'SEO' },
    { id: 'video-script', name: 'Video Script', icon: Video, desc: 'TikTok/Reels/Shorts scripts', category: 'Content' },
    { id: 'content-repurpose', name: 'Repurpose AI', icon: ZapIcon, desc: 'Blog to social content', category: 'Content' },
    { id: 'product-desc', name: 'Product Desc', icon: ShoppingBag, desc: 'E-commerce product copy', category: 'Content' },
    { id: 'email', name: 'Email Subjects', icon: Mail, desc: 'Boost open rates', category: 'Content' },
    { id: 'bio-gen', name: 'Bio Generator', icon: UserCircle, desc: 'Social media profile bios', category: 'Content' },
    { id: 'brand-voice', name: 'Brand Voice', icon: TypeIcon, desc: 'Define your brand tone', category: 'Content' },
    { id: 'review-reply', name: 'Review Reply', icon: MessageSquare, desc: 'AI customer responses', category: 'Content' },
    
    { id: 'seo', name: 'SEO Keywords', icon: Globe, desc: 'AI keyword research', category: 'Growth' },
    { id: 'keyword-gap', name: 'Keyword Gap', icon: Target, desc: 'Find missing keyword opportunities', category: 'Growth' },
    { id: 'youtube-seo', name: 'YouTube SEO', icon: Video, desc: 'Optimize video for search', category: 'Growth' },
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
    { id: 'contract-gen', name: 'Contract Gen', icon: FileText, desc: 'Generate professional service agreements', category: 'Enterprise' },
    { id: 'time-estimate', name: 'Time Estimate', icon: Clock, desc: 'Professional project time & cost estimation', category: 'Enterprise' },
    
    { id: 'content-curation', name: 'Content Curation', icon: Library, desc: 'Find & share relevant content', category: 'Utilities' },
    { id: 'url-shortener', name: 'URL Strategy', icon: LinkIcon, desc: 'Shorten links and setup UTM tracking', category: 'Utilities' },
    { id: 'qr-generator', name: 'QR Strategy', icon: Layout, desc: 'Design high-converting QR codes', category: 'Utilities' },
    { id: 'social-audit', name: 'Social Audit', icon: ClipboardCheck, desc: 'Analyze profile performance', category: 'Utilities' },
    { id: 'post-optimizer', name: 'Post Optimizer', icon: Clock, desc: 'Best times to post', category: 'Utilities' },
    { id: 'community-mgr', name: 'Community Manager', icon: UserPlus, desc: 'Engagement & loyalty strategy', category: 'Utilities' },
  ];

  const filteredTools = tools.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['Strategy', 'Content', 'Growth', 'SEO', 'Enterprise', 'Utilities'];

  const newTools = ['competitor', 'social-listening', 'campaign-brief', 'lead-magnet', 'email-sequence', 'landing-page', 'social-reply', 'content-calendar', 'ad-budget', 'lead-scorer', 'sales-script', 'crisis-comms', 'press-release', 'link-bio', 'advocacy', 'content-curation', 'social-audit', 'post-optimizer', 'community-mgr', 'report-gen', 'youtube-seo', 'competitor-pricing', 'ad-creative', 'site-audit', 'rank-tracker', 'backlink-checker', 'robots-sitemap', 'url-shortener', 'qr-generator', 'contract-gen', 'time-estimate'];

  return (
    <div className="space-y-4 md:space-y-8 pb-10">
      <div className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-4",
        mobileView === 'workspace' ? "hidden lg:flex" : "flex"
      )}>
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
            className="pl-9 pr-9 bg-muted/50 border-none focus:ring-primary/20 h-11 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Tool Sidebar */}
        <div className={cn(
          "lg:col-span-1 space-y-6",
          mobileView === 'workspace' ? "hidden lg:block" : "block"
        )}>
          <div className="hidden lg:block space-y-6 sticky top-24">
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
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categories</h3>
              <span className="text-[10px] text-primary font-medium">Swipe to explore</span>
            </div>
            <div className="flex overflow-x-auto pb-2 space-x-2 no-scrollbar -mx-4 px-4">
              {['All', ...categories].map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSearchQuery(category === 'All' ? '' : category);
                  }}
                  className={cn(
                    "flex-shrink-0 px-5 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap",
                    (searchQuery === category || (category === 'All' && searchQuery === ''))
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                      : "bg-card text-muted-foreground border-border hover:border-primary/30"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
            
            <div className="flex items-center justify-between px-1 mt-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tools</h3>
              <span className="text-[10px] text-muted-foreground">{filteredTools.length} tools found</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {filteredTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id as ToolType);
                    setResult(null);
                    setError(null);
                    setInput1("");
                    setInput2("");
                    setCompressedImage(null);
                    setMobileView('workspace');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center min-h-[100px] sm:aspect-square rounded-2xl transition-all border p-3 space-y-2 text-center group",
                    activeTool === tool.id 
                      ? "bg-primary/10 border-primary shadow-inner scale-[0.98]" 
                      : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "p-2 sm:p-2.5 rounded-xl transition-all",
                    activeTool === tool.id 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  )}>
                    <tool.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className={cn(
                    "text-[10px] sm:text-[11px] font-bold leading-tight line-clamp-2",
                    activeTool === tool.id ? "text-primary" : ""
                  )}>{tool.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tool Workspace */}
        <div className={cn(
          "lg:col-span-3",
          mobileView === 'list' ? "hidden lg:block" : "block"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Mobile Sticky Header */}
              <div className="lg:hidden sticky top-0 z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-md border-b mb-4 flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 px-3 rounded-xl hover:bg-accent flex items-center gap-2 border-primary/20"
                  onClick={() => setMobileView('list')}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-xs font-bold">Tools</span>
                </Button>
                <div className="flex flex-col overflow-hidden flex-1">
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Active Tool</span>
                  <h2 className="text-sm font-bold truncate">
                    {tools.find(t => t.id === activeTool)?.name}
                  </h2>
                </div>
              </div>

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
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input 
                    placeholder="Paste Instagram/YouTube URL here..." 
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError(null);
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleDownload} disabled={downloading || !url} className="w-full sm:w-auto">
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
                <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 sm:p-8 transition-colors hover:border-primary/50">
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
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {(() => {
                      const Icon = tools.find(t => t.id === activeTool)?.icon || Sparkles;
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg sm:text-xl">{tools.find(t => t.id === activeTool)?.name} Assistant</span>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest lg:hidden">
                      {tools.find(t => t.id === activeTool)?.category}
                    </span>
                  </div>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
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
                  {activeTool === 'youtube-seo' && "Analyze video content to generate high-ranking SEO metadata."}
                  {activeTool === 'content-curation' && "Find and share relevant content to build authority."}
                  {activeTool === 'social-audit' && "Analyze your social media profile performance and health."}
                  {activeTool === 'post-optimizer' && "Determine the best times and formats to post for your audience."}
                  {activeTool === 'community-mgr' && "Develop strategies for engagement and customer loyalty."}
                  {activeTool === 'report-gen' && "Generate professional marketing reports from your data."}
                  {activeTool === 'market-research' && "Perform a deep-dive market research for any niche or topic."}
                  {activeTool === 'content-repurpose' && "Repurpose your content into multiple social media formats."}
                  {activeTool === 'keyword-gap' && "Identify missing keyword opportunities your competitors are ranking for."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        {activeTool === 'utm' ? "Base URL" : 
                         activeTool === 'competitor' ? "Competitor/Niche" : 
                         activeTool === 'influencer' ? "Niche/Topic" :
                         activeTool === 'hashtag' ? "Post Topic" : 
                        activeTool === 'roi' ? "Total Ad Spend (₹)" :
                        activeTool === 'abtest' ? "What are you testing?" :
                        activeTool === 'strategy' ? "Brand/Product Name" : 
                        activeTool === 'youtube-seo' ? "YouTube Video URL" :
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
                        activeTool === 'ad-budget' ? "Total Budget (₹)" : 
                        activeTool === 'lead-scorer' ? "Lead Description" :
                        activeTool === 'sales-script' ? "Product/Service" :
                        activeTool === 'crisis-comms' ? "Crisis Description" :
                        activeTool === 'press-release' ? "Announcement Topic" :
                        activeTool === 'link-bio' ? "Brand/Profile" :
                        activeTool === 'market-research' ? "Niche/Topic" :
                        activeTool === 'content-repurpose' ? "Source Content/Topic" :
                        activeTool === 'keyword-gap' ? "Your Brand/Niche" :
                        activeTool === 'social-audit' ? "Profile URL or Name" :
                        activeTool === 'site-audit' ? "Website URL" :
                        activeTool === 'rank-tracker' ? "Website URL" :
                        activeTool === 'backlink-checker' ? "Website URL" :
                        activeTool === 'robots-sitemap' ? "Website URL" :
                        activeTool === 'url-shortener' ? "Long URL" :
                        activeTool === 'qr-generator' ? "Target URL/Content" :
                        activeTool === 'contract-gen' ? "Service/Project Name" :
                        activeTool === 'time-estimate' ? "Project/Task Name" :
                        activeTool === 'advocacy' ? "Company News/Topic" : "Product/Service Name"}
                      </label>
                      {input1 && (
                        <button 
                          onClick={() => setInput1("")}
                          className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </button>
                      )}
                    </div>
                    {activeTool === 'brand-voice' || activeTool === 'review-reply' || activeTool === 'social-reply' || activeTool === 'lead-scorer' || activeTool === 'crisis-comms' || activeTool === 'video-script' || activeTool === 'content-repurpose' ? (
                      <textarea 
                        className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:border-primary/50"
                        placeholder={activeTool === 'brand-voice' ? "Paste a sample of your writing..." : activeTool === 'social-reply' ? "Paste the social comment here..." : activeTool === 'lead-scorer' ? "Describe the lead (role, company, interaction)..." : activeTool === 'crisis-comms' ? "Describe the situation..." : activeTool === 'video-script' ? "What is the video about? (e.g., 5 tips for better sleep)" : activeTool === 'content-repurpose' ? "Paste the content you want to repurpose..." : "Paste the text here..."}
                        value={input1}
                        onChange={(e) => {
                          setInput1(e.target.value);
                          setError(null);
                        }}
                      />
                    ) : (
                      <Input 
                        placeholder={activeTool === 'utm' ? "example.com" : 
                                     activeTool === 'competitor' ? "e.g., Nike, Coffee Shops" : 
                                     activeTool === 'influencer' ? "e.g., Sustainable Fashion" :
                                     activeTool === 'hashtag' ? "e.g., Vegan Recipes" : 
                                     activeTool === 'roi' ? "e.g., ₹5000" :
                                     activeTool === 'abtest' ? "e.g., Landing Page Headline" :
                                     activeTool === 'strategy' ? "e.g., Eco-Friendly Skincare" : 
                                     activeTool === 'youtube-seo' ? "https://youtube.com/watch?v=..." :
                                     activeTool === 'product-desc' ? "e.g., Wireless Earbuds" :
                                     activeTool === 'bio-gen' ? "e.g., Digital Nomad" :
                                     activeTool === 'ad-budget' ? "e.g., ₹10000" : 
                                     activeTool === 'sales-script' ? "e.g., SEO Services" :
                                     activeTool === 'press-release' ? "e.g., New Office Opening" :
                                     activeTool === 'link-bio' ? "e.g., Fitness Coach" :
                                     activeTool === 'advocacy' ? "e.g., New Feature Launch" : 
                                     activeTool === 'content-curation' ? "e.g., AI in Marketing" :
                                     activeTool === 'social-audit' ? "e.g., instagram.com/nike or @nike" :
                                     activeTool === 'post-optimizer' ? "e.g., Tech Startup" :
                                     activeTool === 'community-mgr' ? "e.g., SaaS Users Group" :
                                     activeTool === 'report-gen' ? "e.g., Acme Corp Q1" : 
                                     activeTool === 'competitor-pricing' ? "e.g., SaaS, E-commerce" :
                                     activeTool === 'ad-creative' ? "e.g., Instagram, Facebook" :
                                     activeTool === 'market-research' ? "e.g., Electric Vehicles in India" :
                                     activeTool === 'keyword-gap' ? "e.g., Sustainable Fashion Brand" : 
                                     activeTool === 'site-audit' ? "e.g., https://example.com" :
                                     activeTool === 'rank-tracker' ? "e.g., https://example.com" :
                                     activeTool === 'backlink-checker' ? "e.g., https://example.com" :
                                     activeTool === 'robots-sitemap' ? "e.g., https://example.com" :
                                     activeTool === 'url-shortener' ? "e.g., https://very-long-url.com/..." :
                                     activeTool === 'qr-generator' ? "e.g., https://example.com/promo" :
                                     activeTool === 'contract-gen' ? "e.g., Web Development Services" :
                                     activeTool === 'time-estimate' ? "e.g., E-commerce App Development" : "e.g., Luxury Watches"} 
                        value={input1}
                        onChange={(e) => {
                          setInput1(e.target.value);
                          setError(null);
                        }}
                        className="h-11 sm:h-12 rounded-xl transition-all focus:ring-primary/20"
                      />
                    )}
                  </div>
                  <div className={cn(
                    "space-y-2",
                    (activeTool === 'youtube-seo' || activeTool === 'utm' || activeTool === 'video-script' || activeTool === 'brand-voice' || activeTool === 'review-reply' || activeTool === 'social-reply' || activeTool === 'lead-scorer' || activeTool === 'crisis-comms' || activeTool === 'social-audit') ? "sm:col-span-2" : "sm:col-span-1"
                  )}>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        {activeTool === 'ads' ? "Target Platform" : 
                         activeTool === 'seo' ? "Niche Focus" : 
                         activeTool === 'email' ? "Campaign Goal" : 
                         activeTool === 'competitor' ? "Analysis Focus" : 
                         activeTool === 'influencer' ? "Platform" :
                         activeTool === 'hashtag' ? "Platform" : 
                         activeTool === 'youtube-seo' ? "Target Audience / Niche" :
                         activeTool === 'roi' ? "Total Revenue (₹)" :
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
                         activeTool === 'market-research' ? "Focus Area" :
                         activeTool === 'content-repurpose' ? "Target Audience" :
                         activeTool === 'keyword-gap' ? "Competitor (optional)" :
                         activeTool === 'content-curation' ? "Target Audience" :
                         activeTool === 'social-audit' ? "Competitors & Platforms" :
                         activeTool === 'site-audit' ? "Focus Area (e.g., Speed, Mobile)" :
                         activeTool === 'rank-tracker' ? "Target Keywords" :
                         activeTool === 'backlink-checker' ? "Competitors to compare" :
                         activeTool === 'robots-sitemap' ? "Specific Requirements" :
                         activeTool === 'url-shortener' ? "Campaign Name / Context" :
                         activeTool === 'qr-generator' ? "Brand Style / Context" :
                         activeTool === 'contract-gen' ? "Client Details & Terms" :
                         activeTool === 'time-estimate' ? "Complexity / Details" :
                         activeTool === 'post-optimizer' ? "Target Platform" :
                         activeTool === 'community-mgr' ? "Primary Goal" :
                         activeTool === 'competitor-pricing' ? "Competitors (optional)" :
                         activeTool === 'ad-creative' ? "Target Platform" :
                         activeTool === 'report-gen' ? "Key Results/Metrics" : "Source (e.g., facebook)"}
                      </label>
                      {input2 && (
                        <button 
                          onClick={() => setInput2("")}
                          className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </button>
                      )}
                    </div>
                    <Input 
                      placeholder={activeTool === 'competitor' ? "e.g., Social Media, Pricing" : 
                                   activeTool === 'influencer' ? "e.g., Instagram, TikTok" :
                                   activeTool === 'hashtag' ? "e.g., Instagram, Twitter" : 
                                   activeTool === 'roi' ? "e.g., ₹15000" :
                                   activeTool === 'abtest' ? "e.g., Conversion Rate" :
                                   activeTool === 'strategy' ? "e.g., Sales, Brand Awareness" : 
                                   activeTool === 'youtube-seo' ? "e.g., Tech Enthusiasts" :
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
                                   activeTool === 'advocacy' ? "e.g., Enthusiastic" : 
                                   activeTool === 'market-research' ? "e.g., Consumer Behavior" :
                                   activeTool === 'content-repurpose' ? "e.g., Gen Z" :
                                   activeTool === 'keyword-gap' ? "e.g., Competitor.com" : 
                                   activeTool === 'competitor-pricing' ? "e.g., Competitor1, Competitor2" :
                                   activeTool === 'ad-creative' ? "e.g., Instagram, Facebook" :
                                   activeTool === 'social-audit' ? "e.g., Competitor1, Competitor2, Instagram" :
                                   activeTool === 'site-audit' ? "e.g., Speed, Mobile, Accessibility" :
                                   activeTool === 'rank-tracker' ? "e.g., digital marketing tools, SEO agency" :
                                   activeTool === 'backlink-checker' ? "e.g., competitor1.com, competitor2.com" :
                                   activeTool === 'robots-sitemap' ? "e.g., Disallow /admin, Priority 1.0" :
                                   activeTool === 'url-shortener' ? "e.g., Summer Sale 2024" :
                                   activeTool === 'qr-generator' ? "e.g., Minimalist, Blue Theme" :
                                   activeTool === 'contract-gen' ? "e.g., ₹50,000, Net 15" :
                                   activeTool === 'time-estimate' ? "e.g., High Complexity, 2 Developers" : "e.g., Instagram, Real Estate, Sale"}
                      value={input2}
                      onChange={(e) => {
                        setInput2(e.target.value);
                        setError(null);
                      }}
                      className="h-11 sm:h-12 rounded-xl"
                    />
                  </div>
                </div>
                <Button 
                  className="w-full h-12 sm:h-14 text-sm sm:text-lg font-bold shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-95" 
                  onClick={runTool} 
                  disabled={loading || !input1}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Run AI Tool
                    </>
                  )}
                </Button>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center space-x-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8"
            >
              <Card className="border-primary/20 bg-primary/5 shadow-xl shadow-primary/5 overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center space-x-2 text-xl">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span>Optimized Results</span>
                    </CardTitle>
                    <CardDescription>Your AI-generated marketing content.</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center space-x-2 flex-1 sm:flex-none justify-center h-10 sm:h-9 no-print">
                      <Printer className="h-4 w-4" />
                      <span>Print Report</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopy} className="flex items-center space-x-2 flex-1 sm:flex-none justify-center h-10 sm:h-9 no-print">
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      <span>{copied ? "Copied!" : "Copy All"}</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 print-container">
                  <div className="hidden print:block mb-8 text-center border-b pb-4">
                    <h1 className="text-2xl font-bold text-primary">Marketing Strategy Report</h1>
                    <p className="text-sm text-muted-foreground">Generated by AI Marketing Suite • {new Date().toLocaleDateString()}</p>
                    <p className="text-xs font-bold mt-2 uppercase tracking-widest">{tools.find(t => t.id === activeTool)?.name} Analysis</p>
                  </div>
                  <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:text-primary prose-strong:text-foreground overflow-y-auto overflow-x-auto max-h-[600px] pr-2 custom-scrollbar print:max-h-none print:overflow-visible print:pr-0">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                  <div className="hidden print:block mt-12 pt-4 border-t text-center text-[10px] text-muted-foreground">
                    &copy; {new Date().getFullYear()} AI Marketing Suite. All rights reserved. Confidential Marketing Intelligence.
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

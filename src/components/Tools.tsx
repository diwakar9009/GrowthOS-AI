import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AIService } from "@/lib/gemini";
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
  ArrowRight,
  Printer,
  RotateCcw
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, addDoc, query, orderBy, onSnapshot, handleFirestoreError, OperationType } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";

type ToolType = 'ads' | 'seo' | 'email' | 'utm' | 'downloader' | 'compressor' | 'competitor' | 'influencer' | 'hashtag' | 'strategy' | 'roi' | 'abtest' | 'brand-voice' | 'product-desc' | 'bio-gen' | 'video-script' | 'review-reply' | 'social-listening' | 'lead-magnet' | 'email-sequence' | 'landing-page' | 'campaign-brief' | 'social-reply' | 'content-calendar' | 'ad-budget' | 'lead-scorer' | 'sales-script' | 'crisis-comms' | 'press-release' | 'link-bio' | 'advocacy' | 'content-curation' | 'social-audit' | 'post-optimizer' | 'community-mgr' | 'report-gen' | 'youtube-seo' | 'market-research' | 'content-repurpose' | 'keyword-gap' | 'competitor-pricing' | 'ad-creative' | 'site-audit' | 'rank-tracker' | 'backlink-checker' | 'robots-sitemap' | 'url-shortener' | 'qr-generator' | 'contract-gen' | 'time-estimate';

export function Tools() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);

  useEffect(() => {
    const toolParam = searchParams.get('tool');
    if (toolParam) {
      setActiveTool(toolParam as ToolType);
      setMobileView('workspace');
    } else {
      setActiveTool(null);
      setMobileView('list');
    }
  }, [searchParams]);
  const [mobileView, setMobileView] = useState<'list' | 'workspace'>('list');
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    // Check if API key is defined
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "undefined" || key === "") {
      setApiKeyMissing(true);
    }
  }, []);

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
      let prompt = "";

      const systemInstruction = `You are a Senior Digital Marketing Strategist and Market Research Expert with 15+ years of experience in high-growth startups and Fortune 500 companies. 
      Your goal is to provide deep, professional, and actionable insights. 
      - Always perform multi-step research using Google Search to find the latest data, trends, and competitor activities.
      - NEVER provide generic or "common" answers. Every response must be tailored specifically to the user's input.
      - Use data-driven reasoning and cite specific examples or trends where possible.
      - Maintain a professional, executive-level tone.
      - Format your output with clear headings, bullet points, and bold text for readability.
      - Focus on ROI and actionable steps that can be implemented immediately.`;

      if (activeTool === 'ads') {
        prompt = `As a Senior Performance Marketer, perform deep research on current high-performing ad trends and competitor strategies for: "${input1}". 
        Target Platform: ${input2 || 'Google/Meta'}.
        Using real-time search data, generate 3 high-converting ad copies. 
        For each variation, provide:
        - A psychological hook and benefit-driven primary text.
        - 3 Headline options optimized for CTR.
        - Strategic CTA recommendations.
        - Visual/Creative direction for the ad.
        - Competitive Analysis: Explain exactly why this copy will outperform current competitor ads in this niche.`;
      } else if (activeTool === 'seo') {
        prompt = `As a Senior SEO Strategist, perform a deep-dive SEO and keyword research for the topic: "${input1}". 
        Focus Niche: ${input2 || 'General'}.
        Using real-time search data and competitive benchmarking, provide:
        - 15 High-intent, trending SEO keywords with estimated difficulty, search volume, and search intent (Informational vs. Transactional).
        - 5 "Content Gaps": Specific topics competitors are ignoring.
        - A comprehensive content cluster strategy to build topical authority.
        - Technical SEO recommendations specific to this niche (e.g., schema types, Core Web Vitals focus).
        - 3 Blog title ideas with high organic CTR potential.`;
      } else if (activeTool === 'email') {
        prompt = `As a Direct Response Copywriter, generate professional email marketing content for: "${input1}". 
        Context: ${input2 || 'Marketing Newsletter'}.
        Using real-time data on email marketing trends and high-converting sequences, provide:
        - 5 High-open-rate subject lines using different psychological triggers (Curiosity, Urgency, Benefit).
        - A full, structured email body with a compelling hook, value-driven middle, and a single, clear CTA.
        - Mobile Optimization: Specific formatting advice for mobile-first reading.
        - Competitive Edge: How to stand out in a crowded inbox based on current industry benchmarks.`;
      } else if (activeTool === 'competitor') {
        prompt = `As a Competitive Intelligence Analyst, perform a deep-dive digital marketing analysis for: "${input1}". 
        Focus area: ${input2 || 'General Strategy'}.
        
        Using professional internet search and real-time data, provide a comprehensive report:
        1. **Market Positioning**: Where they stand vs. the market leader.
        2. **Traffic & Acquisition Channels**: Analysis of where their audience comes from (Search, Social, Paid).
        3. **Messaging & Creative Audit**: Deep dive into their brand voice and most successful ad/content themes.
        4. **Vulnerability Analysis**: Identify 3 specific weaknesses in their strategy that we can exploit.
        5. **Execution Roadmap**: A step-by-step plan to out-position them and capture their market share.`;
      } else if (activeTool === 'influencer') {
        prompt = `As an Influencer Marketing Manager, perform deep research to find 10 potential influencers or content creators in the niche: "${input1}". 
        Platform Focus: ${input2 || 'Instagram/YouTube/TikTok'}.
        Using real-time search, provide for each:
        - Name, Handle, and estimated follower count.
        - Detailed Content Analysis: What makes their content resonate?
        - Audience Demographics: Who are they reaching?
        - Estimated Engagement Rate vs. Industry Average.
        - Partnership Strategy: A specific campaign idea for this creator.`;
      } else if (activeTool === 'hashtag') {
        prompt = `As a Social Media Growth Expert, perform real-time research to generate a strategic set of 30 hashtags for: "${input1}". 
        Platform: ${input2 || 'Instagram'}.
        Using current trending data, provide:
        - A categorized list: 5 Broad (1M+), 10 Niche (100k-500k), 10 Community (10k-50k), and 5 Branded/Trending.
        - Analysis of "Banned" or "Shadowbanned" risks in this niche.
        - Strategic advice on hashtag placement and quantity for maximum reach in 2024-2026.`;
      } else if (activeTool === 'strategy') {
        prompt = `As a Senior Digital Marketing Consultant, generate a comprehensive 30-day digital marketing strategy for: "${input1}". 
        Goal: ${input2 || 'Brand Awareness & Growth'}.
        Using real-time internet search and competitive benchmarking, include:
        - **Phase 1 (Days 1-10): Foundation & Awareness** - Specific setup and launch tactics.
        - **Phase 2 (Days 11-20): Engagement & Trust** - Content pillars and community building.
        - **Phase 3 (Days 21-30): Conversion & Scaling** - Retargeting and sales-focused moves.
        - **Competitive Counter-Moves**: Specific tactics to outperform top competitors identified during research.
        - **KPI Dashboard**: Exactly what to measure to ensure ROI.`;
      } else if (activeTool === 'youtube-seo') {
        prompt = `As a YouTube Growth Specialist, perform deep research on the video at ${input1}. 
        You MUST find the video's current title, description, and key content themes.
        
        Based on your research, generate:
        1. **3 High-CTR Titles**: Optimized for both search and "browse" features.
        2. **The "Perfect" Description**: Including a 3-paragraph SEO-optimized summary, timestamps, and strategic links.
        3. **Tag & Keyword Strategy**: 20 high-volume tags and 10 long-tail keywords.
        4. **Thumbnail Direction**: Specific visual suggestions to increase click-through rate.
        Tailor all metadata for: ${input2 || 'General Audience'}.`;
      } else if (activeTool === 'roi') {
        prompt = `As a Marketing Data Analyst, perform a professional ROI analysis and competitive benchmarking for:
        - Total Spend: ₹${input1}
        - Total Revenue/Conversions: ₹${input2 || '0'}
        Using real-time industry data, provide:
        - Detailed ROI, ROAS, and CPA calculations.
        - **Industry Benchmark Comparison**: How these numbers stack up against the top 10% in this niche.
        - **Optimization Roadmap**: 5 specific steps to lower CPA and increase ROAS by at least 20%.`;
      } else if (activeTool === 'abtest') {
        prompt = `As a Conversion Rate Optimization (CRO) Expert, design a scientific A/B test plan for: "${input1}". 
        Target Metric: ${input2 || 'Conversion Rate'}.
        Using real-time data on CRO trends, provide:
        - **The Hypothesis**: A clear "If [Change], then [Result]" statement.
        - **Test Variables**: Detailed breakdown of the Control vs. Variant.
        - **Statistical Significance**: Recommended sample size and duration.
        - **Competitive Insights**: What the market leaders are currently testing in this area.`;
      } else if (activeTool === 'brand-voice') {
        prompt = `As a Brand Strategist, perform a professional analysis to define and document the brand voice for: "${input1}". 
        Focus Area: ${input2 || 'General Branding'}.
        Using real-time search to analyze the brand's current presence and competitor tones, provide:
        - **The Brand Persona**: A detailed description of the brand as a person.
        - **Voice Attributes**: 4 key adjectives with "This, Not That" examples.
        - **Grammar & Style Rules**: Specific guidelines for punctuation, emoji use, and sentence structure.
        - **Platform-Specific Adaptations**: How the voice shifts from LinkedIn to Instagram.`;
      } else if (activeTool === 'product-desc') {
        prompt = `As a Senior E-commerce Copywriter, generate high-converting product descriptions for: "${input1}". 
        Target Audience: ${input2 || 'General'}.
        Using real-time search to analyze top-performing listings, provide:
        - **The "Hero" Description**: A 150-word persuasive narrative.
        - **Feature vs. Benefit Table**: Clearly mapping technical specs to user benefits.
        - **SEO Bullet Points**: 5-7 scannable, keyword-rich points.
        - **Competitive Edge**: Highlighting a unique selling proposition (USP) that competitors are missing.`;
      } else if (activeTool === 'bio-gen') {
        prompt = `As a Social Media Branding Expert, generate 5 professional and creative social media bios for: "${input1}". 
        Platform: ${input2 || 'Instagram/LinkedIn'}.
        Using real-time data on high-converting bio trends, provide:
        - 5 Variations ranging from "Authority-focused" to "Personality-driven".
        - **Link-in-Bio Strategy**: What specific link and CTA should be used.
        - **Visual Layout**: Suggestions for line breaks and emoji placement for mobile readability.`;
      } else if (activeTool === 'video-script') {
        prompt = `As a Viral Content Creator, write a high-engagement video script for: "${input1}". 
        Video Goal: ${input2 || 'Educational/Viral'}.
        Using real-time data on trending formats (TikTok/Reels/Shorts), provide:
        - **The Hook (0-3s)**: 3 different high-retention hook options.
        - **The Body**: A fast-paced, value-dense script with visual and audio cues.
        - **The CTA**: A strategic "soft" or "hard" close.
        - **Retention Strategy**: Specific edits or visual patterns to keep viewers watching.`;
      } else if (activeTool === 'review-reply') {
        prompt = `As a Reputation Management Specialist, generate professional responses to this customer review: "${input1}". 
        Sentiment: ${input2 || 'Analyze automatically'}.
        Using real-time data on brand loyalty, provide:
        - 3 Variations: Professional, Empathetic, and Brand-Personality driven.
        - **SEO Integration**: How to naturally include keywords in the reply to boost local SEO.
        - **Escalation/Recovery Plan**: If negative, a specific path to resolve the issue offline.`;
      } else if (activeTool === 'social-listening') {
        prompt = `As a Social Media Analyst, perform a professional social listening and sentiment analysis for: "${input1}". 
        Context: ${input2 || 'General Sentiment'}.
        Using real-time search and social data, provide:
        - **Sentiment Score**: A detailed breakdown of Positive, Neutral, and Negative mentions.
        - **Trending Topics**: The top 3 recurring themes people are discussing.
        - **Influential Voices**: Who is talking about this brand/topic?
        - **Strategic Recommendations**: How to join the conversation effectively.`;
      } else if (activeTool === 'lead-magnet') {
        prompt = `As a Growth Marketer, generate 5 high-converting lead magnet ideas for: "${input1}". 
        Target Audience: ${input2 || 'General'}.
        Using real-time search data, provide:
        - 5 Unique Concepts (e.g., Interactive Tools, Proprietary Data Reports, Mini-Courses).
        - **The "Big Promise"**: A compelling headline for each.
        - **Delivery Strategy**: How to deliver the value instantly on mobile.
        - **Nurture Path**: What happens immediately after they sign up?`;
      } else if (activeTool === 'email-sequence') {
        prompt = `As an Email Marketing Strategist, plan a professional 5-step email nurture sequence for: "${input1}". 
        Goal: ${input2 || 'Conversion/Onboarding'}.
        Using real-time data on automation best practices, provide:
        - **Email 1**: The Welcome & Value Delivery.
        - **Email 2**: The Problem/Solution Deep-Dive.
        - **Email 3**: Social Proof & Case Studies.
        - **Email 4**: The Logic & Objection Handling.
        - **Email 5**: The Final Call to Action.
        Include subject lines and core messaging for each.`;
      } else if (activeTool === 'landing-page') {
        prompt = `As a Conversion-Focused Web Designer, generate a professional structure and copy for a landing page for: "${input1}". 
        Primary Goal: ${input2 || 'Lead Generation/Sales'}.
        Using real-time search and competitive benchmarking, provide:
        - **The Hero Section**: Headline, sub-headline, and primary CTA.
        - **The "Problem/Solution" Framework**: Compelling copy that addresses user pain points.
        - **Social Proof Strategy**: Where and how to place testimonials or logos.
        - **Mobile-First Layout**: A detailed wireframe description for mobile users.`;
      } else if (activeTool === 'campaign-brief') {
        prompt = `As a Senior Marketing Manager, create a professional campaign brief for: "${input1}". 
        Goal: ${input2 || 'Growth/Launch'}.
        Using real-time search and professional standards, include:
        - **Executive Summary**: The "Why" behind the campaign.
        - **Target Audience Personas**: Detailed demographics and psychographics.
        - **Creative Pillars**: The main themes and visual direction.
        - **Channel Mix & Budget Allocation**: Where to spend for maximum impact.
        - **Success Metrics**: Specific KPIs and tracking plan.`;
      } else if (activeTool === 'social-reply') {
        prompt = `As a Community Manager, draft professional and engaging replies to this social media comment: "${input1}". 
        Brand Tone: ${input2 || 'Friendly & Helpful'}.
        Using real-time data on engagement trends, provide:
        - 3 Variations: Helpful, Witty, and Conversion-oriented.
        - **Engagement Strategy**: How to turn this single comment into a thread or a recurring interaction.`;
      } else if (activeTool === 'content-calendar') {
        prompt = `As a Content Strategist, generate a professional 7-day strategic social media content calendar for: "${input1}". 
        Platforms: ${input2 || 'Instagram & LinkedIn'}.
        Using real-time search for trending topics, provide:
        - **Day 1-7**: Specific post topics, formats (Video, Carousel, Text), and optimized posting times.
        - **Caption Outlines**: Key hooks and CTAs for each post.
        - **Hashtag/Keyword Strategy**: Tailored for each day's content.`;
      } else if (activeTool === 'ad-budget') {
        prompt = `As a Media Buyer, perform a professional ad budget optimization for a total spend of ₹${input1}. 
        Campaign Type: ${input2 || 'Digital Marketing'}.
        Using real-time data on current CPM/CPC costs, provide:
        - **Channel Allocation**: Recommended % split between Meta, Google, LinkedIn, etc.
        - **Estimated Outcomes**: Realistic Reach, Clicks, and Conversions.
        - **Scaling Plan**: How to increase budget if the campaign hits its targets.`;
      } else if (activeTool === 'lead-scorer') {
        prompt = `As a Sales Operations Manager, perform a professional AI lead qualification and scoring for: "${input1}". 
        Industry/Context: ${input2 || 'B2B SaaS'}.
        Using real-time data on lead quality, provide:
        - **Lead Score (0-100)**: Based on fit and intent.
        - **Qualification Analysis**: Why this lead is (or isn't) ready for sales.
        - **Next Steps**: Specific actions for SDRs or AEs.`;
      } else if (activeTool === 'sales-script') {
        prompt = `As a Sales Trainer, generate a professional, high-converting sales script for: "${input1}". 
        Script Type: ${input2 || 'Cold Call/Discovery'}.
        Using real-time data on successful sales methodologies (e.g., SPIN, Challenger), provide:
        - **The Opening**: A 15-second attention-grabbing hook.
        - **Discovery Questions**: 5 deep questions to uncover pain points.
        - **The Pitch**: A value-based solution presentation.
        - **Objection Handling**: Responses to the top 3 common pushbacks.`;
      } else if (activeTool === 'crisis-comms') {
        prompt = `As a PR & Crisis Management Expert, draft a professional response strategy for: "${input1}". 
        Severity: ${input2 || 'Medium/High'}.
        Using real-time data on brand reputation, provide:
        - **The Official Statement**: A transparent, accountable, and action-oriented message.
        - **FAQ for Stakeholders**: Addressing the most likely questions.
        - **Social Media Monitoring Plan**: How to track and respond to the fallout.
        - **Recovery Roadmap**: Steps to rebuild trust over the next 90 days.`;
      } else if (activeTool === 'press-release') {
        prompt = `As a PR Professional, write a news-ready press release for: "${input1}". 
        Announcement Type: ${input2 || 'Product Launch/Major News'}.
        Using real-time PR standards, include:
        - **The Headline**: Compelling and newsworthy.
        - **The Lead**: Addressing the 5 W's (Who, What, When, Where, Why).
        - **Executive Quote**: A professional, visionary statement.
        - **Boilerplate**: A concise "About Us" section.`;
      } else if (activeTool === 'link-bio') {
        prompt = `As a Conversion Rate Optimization Specialist, perform a professional optimization of a Link-in-bio page for: "${input1}". 
        Primary Goal: ${input2 || 'Drive Conversions'}.
        Using real-time data on mobile user behavior, suggest:
        - **Link Hierarchy**: The top 5 links ordered by importance.
        - **Visual Design**: Layout and button styling for maximum mobile CTR.
        - **Analytics Plan**: How to track which links are actually driving revenue.`;
      } else if (activeTool === 'advocacy') {
        prompt = `As an Internal Communications Manager, generate a professional Employee Advocacy content set for: "${input1}". 
        Tone: ${input2 || 'Proud & Professional'}.
        Using real-time data on social sharing, provide:
        - 3 Post Variations for LinkedIn, Twitter, and Instagram.
        - **Sharing Guidelines**: Tips for employees to personalize the message.
        - **Impact Analysis**: How this campaign will boost the brand's organic reach.`;
      } else if (activeTool === 'downloader') {
        prompt = `As a Social Media Specialist, provide a professional strategy and guide for downloading and archiving content from: ${input1}. 
        Focus Context: ${input2 || 'Content Archiving'}.
        Include:
        - Best practices for saving high-quality versions.
        - Copyright and fair use considerations for this specific content type.
        - Strategic ideas on how to use this archived content for internal benchmarking.`;
      } else if (activeTool === 'compressor') {
        prompt = `As a Web Performance Expert, provide a guide on optimizing and compressing the brand assets for "${input1}". 
        Platform Focus: ${input2 || 'Web/Mobile'}.
        Include:
        - Recommended compression ratios for JPEGs, PNGs, and SVGs.
        - Best tools for lossless vs lossy compression in 2024.
        - Impact of optimized assets on Core Web Vitals and user experience.`;
      } else if (activeTool === 'content-curation') {
        prompt = `As a Thought Leadership Strategist, find and curate 5 high-quality content pieces for: "${input1}". 
        Target Audience: ${input2 || 'General'}.
        For each piece, provide:
        - A unique, value-added caption for sharing.
        - **The "Why it Matters"**: Connecting the content to the audience's interests.
        - **Engagement Question**: A prompt to start a conversation.`;
      } else if (activeTool === 'social-audit') {
        prompt = `As a Senior Social Media Auditor, perform a deep-dive audit for the profile: "${input1}". 
        Competitors/Platforms: ${input2 || 'Analyze top 3 competitors'}.
        Using real-time search and social data, provide:
        - **Brand Consistency Score**: Analysis of visuals, bio, and messaging.
        - **Engagement Audit**: Deep dive into what's working and what isn't.
        - **Competitive Benchmarking**: How this profile compares to the leaders in the niche.
        - **The "Growth Roadmap"**: 5 specific changes to double engagement in 30 days.`;
      } else if (activeTool === 'post-optimizer') {
        prompt = `As a Social Media Data Scientist, determine the optimal posting strategy for: "${input1}". 
        Platform: ${input2 || 'Instagram/LinkedIn'}.
        Using real-time data on algorithm shifts, provide:
        - **The "Golden Hours"**: 3 specific time slots with data-backed reasoning.
        - **Content Format Mix**: The ideal ratio of Video vs. Static vs. Carousel.
        - **Frequency Recommendation**: How often to post for maximum reach without burnout.`;
      } else if (activeTool === 'community-mgr') {
        prompt = `As a Senior Community Manager, create a professional engagement strategy for: "${input1}". 
        Goal: ${input2 || 'Engagement & Loyalty'}.
        Using real-time data on community building, include:
        - **Engagement Rituals**: Daily/weekly activities to keep the community active.
        - **Moderation Guidelines**: How to handle conflict and maintain a positive tone.
        - **Loyalty Program Ideas**: How to reward the most active members.
        - **Success Metrics**: How to measure community health beyond just "likes".`;
      } else if (activeTool === 'market-research') {
        prompt = `As a Senior Market Research Analyst, perform a professional deep-dive research for: "${input1}". 
        Focus: ${input2 || 'Market Trends & Consumer Behavior'}.
        Using real-time search and industry reports, provide:
        - **Market Size & Forecast**: Current data and 3-year growth projections.
        - **Consumer Persona Deep-Dive**: Detailed psychographics and buying triggers.
        - **Trend Analysis**: 5 macro and micro trends shaping the future of this niche.
        - **SWOT Analysis**: A professional breakdown of Strengths, Weaknesses, Opportunities, and Threats.`;
      } else if (activeTool === 'content-repurpose') {
        prompt = `As a Content Operations Manager, perform a professional content repurposing strategy for: "${input1}". 
        Target Audience: ${input2 || 'General'}.
        Using real-time data on high-performing formats, repurpose the source into:
        - 1 Long-form LinkedIn Post.
        - 1 High-retention Instagram Carousel outline.
        - 1 Viral-style Short Video script.
        - 1 Twitter/X Thread.
        - 1 Email Newsletter segment.`;
      } else if (activeTool === 'keyword-gap') {
        prompt = `As an SEO Analyst, perform a professional keyword gap analysis for: "${input1}". 
        Competitor (optional): ${input2 || 'General Market'}.
        Using real-time search data, identify:
        - **The "Missing 15"**: High-value keywords competitors rank for that you don't.
        - **Search Intent Mapping**: Categorizing gaps by Informational, Navigational, and Transactional.
        - **Difficulty vs. Opportunity Matrix**: Identifying the easiest wins.
        - **Content Plan**: How to create pages that will outrank the competition for these terms.`;
      } else if (activeTool === 'report-gen') {
        prompt = `As a Marketing Director, generate a professional executive-level report summary for: "${input1}". 
        Key Results/Metrics: ${input2 || 'General Performance'}.
        Using real-time data visualization standards, include:
        - **Executive Summary**: The high-level "State of the Union".
        - **Wins & Learnings**: What worked and what needs to change.
        - **Strategic Pivot**: Recommended shifts for the next reporting period.
        - **ROI Analysis**: Connecting marketing activity to business outcomes.`;
      } else if (activeTool === 'competitor-pricing') {
        prompt = `As a Pricing Strategist, perform a professional competitive pricing analysis for: "${input1}". 
        Competitors: ${input2 || 'Identify top 3 automatically'}.
        Using real-time market data, provide:
        - **Pricing Matrix**: Comparing tiers, features, and price points.
        - **Psychological Pricing Analysis**: How competitors are using anchoring or bundling.
        - **Discounting Trends**: Analysis of seasonal or behavior-based offers.
        - **Strategic Recommendation**: The optimal price point for maximum profit and market share.`;
      } else if (activeTool === 'ad-creative') {
        prompt = `As a Creative Director, generate professional ad creative concepts for: "${input1}". 
        Platform: ${input2 || 'Meta/Instagram'}.
        Using real-time data on visual trends, provide:
        - 3 Distinct Creative Directions (e.g., Minimalist, UGC-style, High-Production).
        - **Visual Storyboard**: Detailed descriptions of imagery or video scenes.
        - **Color & Typography Strategy**: Psychology-backed design choices.
        - **Mobile-First Optimization**: Ensuring the creative stops the scroll on small screens.`;
      } else if (activeTool === 'site-audit') {
        prompt = `As a Senior Technical SEO Auditor, perform a professional deep-dive research on: ${input1}
        Focus Area: ${input2 || "General SEO Health"}
        
        Using real-time technical SEO standards, provide:
        - **Technical Health Check**: Crawlability, indexing, and site architecture analysis.
        - **Performance Audit**: Core Web Vitals and speed bottlenecks.
        - **On-Page Deep Dive**: Content quality, E-E-A-T signals, and keyword optimization.
        - **Priority Action Plan**: A "Fix First" list ranked by impact on rankings.`;
      } else if (activeTool === 'rank-tracker') {
        prompt = `As an SEO Strategist, analyze the search engine ranking potential for:
        Website/URL: ${input1}
        Target Keywords: ${input2}
        
        Using real-time SERP data, provide:
        - **Current Landscape**: Who owns the top 3 spots and why.
        - **Ranking Difficulty Analysis**: A detailed breakdown of what it will take to rank.
        - **Content Optimization Plan**: Specific changes to existing pages to boost position.
        - **SERP Feature Strategy**: How to capture Snippets, People Also Ask, or Local Packs.`;
      } else if (activeTool === 'backlink-checker') {
        prompt = `As a Link Building Expert, perform deep research on the backlink profile of: ${input1}
        Competitors to compare: ${input2}
        
        Using real-time data, provide:
        - **Domain Authority Audit**: Trust Flow and Citation Flow analysis.
        - **Link Gap Analysis**: High-authority sites linking to competitors but not you.
        - **Outreach Strategy**: 5 specific "Linkable Asset" ideas to attract high-quality backlinks.
        - **Toxic Link Check**: Identifying potential risks to the site's authority.`;
      } else if (activeTool === 'robots-sitemap') {
        prompt = `As a Technical SEO Specialist, generate a professional Robots.txt and Sitemap structure for:
        Website URL: ${input1}
        Specific Requirements: ${input2}
        
        Provide:
        - **The Optimized Robots.txt**: Clean, secure, and search-engine friendly.
        - **XML Sitemap Hierarchy**: Logical structure for efficient crawling.
        - **Crawl Budget Strategy**: How to ensure Google spends time on your most important pages.`;
      } else if (activeTool === 'url-shortener') {
        prompt = `As a Digital Marketing Operations Manager, suggest a professional URL strategy for:
        Long URL: ${input1}
        Campaign Context: ${input2}
        
        Provide:
        - **Branded Link Suggestions**: Professional slugs that increase trust.
        - **UTM Architecture**: The exact parameters needed for deep analytics tracking.
        - **Redirection Strategy**: How to handle link expiration or updates.`;
      } else if (activeTool === 'qr-generator') {
        prompt = `As a Creative Technologist, provide a strategy for a high-converting QR code for:
        Target URL: ${input1}
        Brand Context: ${input2}
        
        Provide:
        - **Design Concept**: Visual styling that matches the brand identity.
        - **CTA Strategy**: The exact text and placement to maximize scan rates.
        - **Offline-to-Online Funnel**: What the user should see immediately after scanning.`;
      } else if (activeTool === 'contract-gen') {
        prompt = `As a Professional Legal Consultant for Freelancers, generate a comprehensive contract outline for:
        Service/Project: ${input1}
        Client Details & Terms: ${input2}
        
        Provide a professional structure including:
        - **Detailed Scope of Work**: Deliverables and milestones.
        - **Payment & Late Fee Clauses**: Protecting your cash flow.
        - **IP & Liability Protection**: Standard industry safeguards.
        - **Termination Terms**: A clear and fair exit strategy.`;
      } else if (activeTool === 'time-estimate') {
        prompt = `As a Senior Project Manager, provide a professional time and cost estimate for:
        Project/Task: ${input1}
        Complexity/Details: ${input2}
        
        Provide:
        - **Phase-by-Phase Breakdown**: Hours for Research, Design, Dev, and QA.
        - **The "Realistic" Timeline**: A data-backed range with buffer for risks.
        - **Resource Plan**: Tools and talent needed for successful execution.
        - **Risk Mitigation**: Identifying and planning for potential bottlenecks.`;
      }

      if (activeTool === 'utm') {
        const baseUrl = input1.startsWith('http') ? input1 : `https://${input1}`;
        const utm = `${baseUrl}?utm_source=${input2 || 'google'}&utm_medium=cpc&utm_campaign=growth_os&utm_content=ai_assistant`;
        setResult(utm);
      } else {
        const NEEDS_SEARCH = [
          'competitor', 'influencer', 'trends', 'market-research', 
          'keyword-gap', 'social-listening', 'social-audit', 'ads', 'seo',
          'competitor-pricing', 'site-audit', 'rank-tracker', 'backlink-checker',
          'strategy', 'market-research', 'youtube-seo'
        ].includes(activeTool);

        const text = await AIService.generateContent(prompt, {
          model: NEEDS_SEARCH ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview",
          systemInstruction,
          useSearch: NEEDS_SEARCH
        });
        
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
    } catch (error: any) {
      console.error("Tool Error:", error);
      const errorMessage = error.message || "An unexpected error occurred while running the tool. Please try again later.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!url) return;
    setDownloading(true);
    // Simulate a professional fetching process
    setTimeout(() => {
      setDownloading(false);
      setResult(`Successfully fetched media from: ${url}\n\nNote: In this preview environment, direct downloads are simulated. In a production environment, this would connect to a high-speed media proxy to bypass platform restrictions.`);
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
      
      {apiKeyMissing && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Gemini API Key Missing</p>
              <p className="text-xs opacity-90">AI tools will not work until you add your GEMINI_API_KEY to your Vercel/GitHub environment variables.</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-amber-200 hover:bg-amber-100 text-amber-700 w-full md:w-auto"
            onClick={() => window.open('https://vercel.com/docs/concepts/projects/environment-variables', '_blank')}
          >
            How to fix
          </Button>
        </div>
      )}

      {!activeTool ? (
        <div className="space-y-12 py-4">
          {/* Tool Hero */}
          <section className="relative overflow-hidden rounded-3xl bg-primary/5 border border-primary/10 p-8 md:p-12 text-center space-y-6">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wrench className="h-64 w-64 -rotate-12" />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 relative z-10"
            >
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="h-3 w-3" />
                <span>The Future of Marketing</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                Your AI Marketing <br /> Command Center
              </h2>
              <p className="max-w-xl mx-auto text-sm md:text-base text-muted-foreground font-medium">
                Select from our suite of professional-grade intelligences to automate research, 
                optimize content, and scale your growth.
              </p>
            </motion.div>
          </section>

          {/* Categories Grid */}
          {categories.map(category => (
            <div key={category} className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold tracking-tight">{category}</h3>
                  <p className="text-xs text-muted-foreground font-medium">Select a {category.toLowerCase()} tool to begin analysis.</p>
                </div>
                <div className="hidden md:flex items-center space-x-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{tools.filter(t => t.category === category).length} Tools Available</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {tools.filter(t => t.category === category && (
                  !searchQuery || 
                  t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  t.desc.toLowerCase().includes(searchQuery.toLowerCase())
                )).map((tool) => (
                  <motion.button
                    key={tool.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveTool(tool.id as ToolType);
                      setMobileView('workspace');
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('tool', tool.id);
                      window.history.pushState({}, '', `?${newParams.toString()}`);
                    }}
                    className="flex flex-col text-left p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 group-hover:scale-175 transition-transform">
                      <tool.icon className="h-12 w-12" />
                    </div>
                    <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                      <tool.icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm tracking-tight">{tool.name}</h4>
                        {newTools.includes(tool.id) && (
                          <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-black">NEW</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{tool.desc}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                        Launch Tool
                        <ArrowRight className="h-3 w-3" />
                      </span>
                      {[
                        'competitor', 'influencer', 'trends', 'market-research', 
                        'keyword-gap', 'social-listening', 'social-audit', 
                        'competitor-pricing', 'site-audit', 'rank-tracker'
                      ].includes(tool.id) && (
                        <Globe className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Tool Sidebar */}
          <div className={cn(
            "lg:col-span-1 space-y-6",
            mobileView === 'workspace' ? "hidden lg:block" : "block"
          )}>
            <div className="hidden lg:block space-y-6 sticky top-24">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full flex items-center justify-start gap-2 text-xs font-bold text-muted-foreground hover:text-primary mb-4"
                onClick={() => {
                  setActiveTool(null);
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('tool');
                  window.history.pushState({}, '', `?${newParams.toString()}`);
                }}
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Library
              </Button>
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
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('tool', tool.id);
                        window.history.pushState({}, '', `?${newParams.toString()}`);
                        setActiveTool(tool.id as ToolType);
                        setResult(null);
                        setError(null);
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
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('tool', tool.id);
                    window.history.pushState({}, '', `?${newParams.toString()}`);
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
                    "p-2 sm:p-2.5 rounded-xl transition-all relative",
                    activeTool === tool.id 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  )}>
                    <tool.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    {[
                      'competitor', 'influencer', 'trends', 'market-research', 
                      'keyword-gap', 'social-listening', 'social-audit', 
                      'competitor-pricing', 'site-audit', 'rank-tracker', 'backlink-checker',
                      'strategy', 'ads', 'seo', 'youtube-seo'
                    ].includes(tool.id) && (
                      <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-sm border border-white">
                        <Globe className="h-2 w-2" />
                      </div>
                    )}
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
                  onClick={() => {
                    setMobileView('list');
                    setActiveTool(null);
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('tool');
                    window.history.pushState({}, '', `?${newParams.toString()}`);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-xs font-bold">Library</span>
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
                    <span className="text-lg sm:text-xl flex items-center gap-2">
                      {tools.find(t => t.id === activeTool)?.name} Assistant
                      {[
                        'competitor', 'influencer', 'trends', 'market-research', 
                        'keyword-gap', 'social-listening', 'social-audit', 
                        'competitor-pricing', 'site-audit', 'rank-tracker', 'backlink-checker',
                        'strategy', 'ads', 'seo', 'youtube-seo'
                      ].includes(activeTool) && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md font-black uppercase flex items-center gap-1">
                          <Globe className="h-2 w-2" />
                          Live Research
                        </span>
                      )}
                    </span>
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
                    className="flex flex-col space-y-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 shadow-inner"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                    {error.includes("Rate Limit") && (
                      <Button 
                        variant="link"
                        size="sm"
                        onClick={() => { AIService.resetSafetyPause(); setError(null); }}
                        className="text-[10px] font-bold underline hover:text-primary transition-colors text-left pl-6 h-auto p-0"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Force Reset Safety Lock
                      </Button>
                    )}
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
    )}
  </div>
);
}

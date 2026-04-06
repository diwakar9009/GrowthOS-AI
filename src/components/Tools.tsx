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
  TrendingUp as TrendingUpIcon
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, addDoc, query, orderBy, onSnapshot, handleFirestoreError, OperationType } from "@/lib/firebase";
import { cn } from "@/lib/utils";

type ToolType = 'ads' | 'seo' | 'email' | 'utm' | 'downloader' | 'compressor' | 'competitor' | 'influencer' | 'hashtag' | 'strategy' | 'roi' | 'abtest';

export function Tools() {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<ToolType>('ads');
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
        prompt = `Analyze the digital marketing strategy for the following competitor or niche: ${input1}. 
        Focus on: ${input2 || 'General Strategy'}.
        Provide:
        - Estimated target audience
        - Content themes they likely use
        - Suggested "counter-strategy" or gap to exploit.`;
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
    { id: 'strategy', name: 'Strategy Gen', icon: Sparkles, desc: '30-day campaign plan' },
    { id: 'roi', name: 'ROI Calc', icon: Calculator, desc: 'Analyze campaign ROI' },
    { id: 'abtest', name: 'A/B Planner', icon: Split, desc: 'Design experiments' },
    { id: 'ads', name: 'Ad Copy', icon: Megaphone, desc: 'High-converting ad copy' },
    { id: 'seo', name: 'SEO Keywords', icon: Globe, desc: 'AI keyword research' },
    { id: 'competitor', name: 'Competitor IQ', icon: Search, desc: 'Analyze market gaps' },
    { id: 'influencer', name: 'Influencer Find', icon: Users, desc: 'Discover creators' },
    { id: 'hashtag', name: 'Hashtag Gen', icon: Hash, desc: 'Viral hashtag sets' },
    { id: 'email', name: 'Email Subjects', icon: Mail, desc: 'Boost open rates' },
    { id: 'utm', name: 'UTM Builder', icon: LinkIcon, desc: 'Track your links' },
    { id: 'downloader', name: 'Downloader', icon: Download, desc: 'Save social media content' },
    { id: 'compressor', name: 'Compressor', icon: ImageIcon, desc: 'Optimize image size' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Marketing Utilities</h1>
        <p className="text-muted-foreground">Professional tools for campaign execution and research.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Tool Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {tools.map((tool) => (
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
                "w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                activeTool === tool.id 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "bg-card hover:bg-accent text-muted-foreground border"
              )}
            >
              <tool.icon className="h-5 w-5" />
              <div className="text-left">
                <p className="font-bold leading-none">{tool.name}</p>
                <p className="text-[10px] opacity-80 mt-1">{tool.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Tool Workspace */}
        <div className="lg:col-span-3 space-y-6">
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
                       activeTool === 'strategy' ? "Brand/Product Name" : "Product/Service Name"}
                    </label>
                    <Input 
                      placeholder={activeTool === 'utm' ? "example.com" : 
                                   activeTool === 'competitor' ? "e.g., Nike, Coffee Shops" : 
                                   activeTool === 'influencer' ? "e.g., Sustainable Fashion" :
                                   activeTool === 'hashtag' ? "e.g., Vegan Recipes" : 
                                   activeTool === 'roi' ? "e.g., 5000" :
                                   activeTool === 'abtest' ? "e.g., Landing Page Headline" :
                                   activeTool === 'strategy' ? "e.g., Eco-Friendly Skincare" : "e.g., Luxury Watches"} 
                      value={input1}
                      onChange={(e) => setInput1(e.target.value)}
                    />
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
                       activeTool === 'strategy' ? "Primary Goal" : "Source (e.g., facebook)"}
                    </label>
                    <Input 
                      placeholder={activeTool === 'competitor' ? "e.g., Social Media, Pricing" : 
                                   activeTool === 'influencer' ? "e.g., Instagram, TikTok" :
                                   activeTool === 'hashtag' ? "e.g., Instagram, Twitter" : 
                                   activeTool === 'roi' ? "e.g., 15000" :
                                   activeTool === 'abtest' ? "e.g., Conversion Rate" :
                                   activeTool === 'strategy' ? "e.g., Sales, Brand Awareness" : "e.g., Instagram, Real Estate, Sale"} 
                      value={input2}
                      onChange={(e) => setInput2(e.target.value)}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={runTool} disabled={loading || !input1}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}
                  Run {tools.find(t => t.id === activeTool)?.name}
                </Button>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Result</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                  {result}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

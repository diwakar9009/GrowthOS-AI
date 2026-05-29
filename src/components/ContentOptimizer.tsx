import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { 
  Youtube, 
  Instagram, 
  FileText, 
  Search, 
  Sparkles, 
  TrendingUp, 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Share2,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Globe,
  Zap,
  ChevronRight,
  Plus
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";
import { AIService } from "@/lib/gemini";

const blogData = [
  { name: "Post 1", views: 1200, avgTime: 145, bounce: 42 },
  { name: "Post 2", views: 2100, avgTime: 180, bounce: 38 },
  { name: "Post 3", views: 800, avgTime: 90, bounce: 55 },
  { name: "Post 4", views: 3400, avgTime: 210, bounce: 31 },
  { name: "Post 5", views: 1500, avgTime: 160, bounce: 40 },
];

const youtubeData = [
  { name: "Video 1", views: 4500, watchTime: 1200, subs: 45 },
  { name: "Video 2", views: 12000, watchTime: 3400, subs: 120 },
  { name: "Video 3", views: 7800, watchTime: 2100, subs: 82 },
  { name: "Video 4", views: 15000, watchTime: 4200, subs: 190 },
];

const instagramData = [
  { name: "Post 1", likes: 450, comments: 32, reach: 2100 },
  { name: "Post 2", likes: 890, comments: 54, reach: 4500 },
  { name: "Post 3", likes: 1200, comments: 87, reach: 6200 },
  { name: "Post 4", likes: 670, comments: 41, reach: 3100 },
];

type Platform = "blog" | "youtube" | "instagram";

export function ContentOptimizer() {
  const [activePlatform, setActivePlatform] = useState<Platform>("blog");
  const [contentToOptimize, setContentToOptimize] = useState("");
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = async () => {
    if (!contentToOptimize) return;
    setIsOptimizing(true);
    try {
      const text = await AIService.generateContent(`Perform a professional deep-dive research into current ${activePlatform} algorithms and SEO trends. 
        Analyze the following content and provide expert optimization suggestions based on REAL-TIME platform data. 
        
        Format as JSON with: 
        - score (0-100)
        - strengths (array of strings)
        - weaknesses (array of strings)
        - suggestions (array of objects with title and description)
        - keywords (array of strings)
        
        Content: ${contentToOptimize}`, {
          model: "gemini-3.5-flash",
          useSearch: true
        });
      
      const result = JSON.parse(text || "{}");
      setOptimizationResult(result);
    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Content SEO Optimizer</h1>
        <p className="text-muted-foreground">Monitor performance and optimize your content for search engines and social algorithms.</p>
      </div>

      {/* Platform Switcher */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar lg:mx-0 lg:px-0">
        <div className="flex space-x-2 p-1 bg-muted rounded-xl w-fit shrink-0">
          <button 
            onClick={() => setActivePlatform("blog")}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activePlatform === "blog" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="h-4 w-4" />
            <span>Blog</span>
          </button>
          <button 
            onClick={() => setActivePlatform("youtube")}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activePlatform === "youtube" ? "bg-background shadow-sm text-red-600" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Youtube className="h-4 w-4" />
            <span>YouTube</span>
          </button>
          <button 
            onClick={() => setActivePlatform("instagram")}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activePlatform === "instagram" ? "bg-background shadow-sm text-pink-600" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Instagram className="h-4 w-4" />
            <span>Instagram</span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Performance Overview */}
        <Card className="lg:col-span-2 hover:shadow-lg transition-all duration-300 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-xl font-bold">Performance Trends</CardTitle>
              <CardDescription>Recent {activePlatform} performance metrics.</CardDescription>
            </div>
            <BarChart3 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {activePlatform === "blog" ? (
                <AreaChart data={blogData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="views" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.1} />
                </AreaChart>
              ) : activePlatform === "youtube" ? (
                <BarChart data={youtubeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <Tooltip />
                  <Bar dataKey="views" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={instagramData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <Tooltip />
                  <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} dot={{r: 4}} />
                  <Line type="monotone" dataKey="reach" stroke="#3b82f6" strokeWidth={2} dot={{r: 4}} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card className="hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">124.5K</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                <span>+12.3% this month</span>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.8%</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                <span>+0.5% this month</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20 hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">SEO Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">84/100</div>
              <div className="mt-2 h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[84%]" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SEO Assistant */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5 h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>AI SEO Assistant</span>
            </CardTitle>
            <CardDescription>Paste your content below to get instant SEO optimization suggestions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea 
              value={contentToOptimize}
              onChange={(e) => setContentToOptimize(e.target.value)}
              placeholder={`Paste your ${activePlatform} title, description, or content here...`}
              className="w-full min-h-[200px] p-4 rounded-xl border bg-muted/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-sm"
            />
            <Button 
              onClick={handleOptimize} 
              disabled={isOptimizing || !contentToOptimize}
              className="w-full"
            >
              {isOptimizing ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  Analyzing Content...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimize for SEO
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optimization Results</CardTitle>
            <CardDescription>AI-driven insights to boost your visibility.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {optimizationResult ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">SEO Score</p>
                      <p className="text-3xl font-bold text-primary">{optimizationResult.score}/100</p>
                    </div>
                    <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center font-bold text-primary">
                      {optimizationResult.score}%
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-bold flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Strengths</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {optimizationResult.strengths?.map((s: string, i: number) => (
                        <span key={i} className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-bold flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span>Top Suggestions</span>
                    </h4>
                    <div className="space-y-2">
                      {optimizationResult.suggestions?.map((s: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg border bg-muted/30 text-xs">
                          <p className="font-bold mb-1">{s.title || s}</p>
                          <p className="text-muted-foreground">{s.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-bold flex items-center space-x-2">
                      <Search className="h-4 w-4 text-blue-500" />
                      <span>Recommended Keywords</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {optimizationResult.keywords?.map((k: string, i: number) => (
                        <span key={i} className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100">
                          #{k}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="max-w-[200px]">
                    <p className="text-sm font-medium">No Analysis Yet</p>
                    <p className="text-xs text-muted-foreground">Enter your content and click optimize to see AI suggestions.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      {/* Content Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Best Practices Checklist</CardTitle>
          <CardDescription>Follow these steps for every piece of content you publish.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-xl border bg-card space-y-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Globe className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold">On-Page SEO</h4>
              <ul className="space-y-2">
                {["Keyword in Title", "Meta Description", "H1-H3 Tags", "Alt Text for Images"].map(item => (
                  <li key={item} className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl border bg-card space-y-3">
              <div className="h-8 w-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <Youtube className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold">Video SEO</h4>
              <ul className="space-y-2">
                {["Thumbnail CTR", "First 30s Hook", "Keyword Tags", "Closed Captions"].map(item => (
                  <li key={item} className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl border bg-card space-y-3">
              <div className="h-8 w-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
                <Instagram className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold">Social SEO</h4>
              <ul className="space-y-2">
                {["Niche Hashtags", "Alt Text", "Keyword in Bio", "Location Tags"].map(item => (
                  <li key={item} className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

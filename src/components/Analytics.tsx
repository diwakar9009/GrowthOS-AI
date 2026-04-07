import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Share2, 
  MousePointer2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Briefcase, 
  Layout, 
  FileText, 
  Zap, 
  Filter, 
  Loader2, 
  Globe, 
  Smartphone, 
  Monitor, 
  Activity,
  Clock,
  Target,
  IndianRupee,
  Calendar,
  Percent,
  TrendingDown,
  Check,
  Twitter,
  Linkedin,
  Facebook,
  Link2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, query, onSnapshot } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

const growthData = [
  { name: "Mon", followers: 4000, engagement: 2400, reach: 12000, conversionRate: 3.2 },
  { name: "Tue", followers: 4200, engagement: 2800, reach: 13500, conversionRate: 3.8 },
  { name: "Wed", followers: 4500, engagement: 2200, reach: 11000, conversionRate: 3.1 },
  { name: "Thu", followers: 4800, engagement: 3200, reach: 15000, conversionRate: 4.5 },
  { name: "Fri", followers: 5100, engagement: 3800, reach: 18000, conversionRate: 5.2 },
  { name: "Sat", followers: 5400, engagement: 4200, reach: 21000, conversionRate: 5.8 },
  { name: "Sun", followers: 5800, engagement: 3900, reach: 19500, conversionRate: 5.4 },
];

const acquisitionData = [
  { name: "Organic Search", value: 45, color: "#10b981" },
  { name: "Paid Ads", value: 25, color: "#3b82f6" },
  { name: "Social Media", value: 20, color: "#ec4899" },
  { name: "Direct", value: 10, color: "#f59e0b" },
];

const deviceData = [
  { name: "Mobile", value: 72, color: "#3b82f6" },
  { name: "Desktop", value: 24, color: "#10b981" },
  { name: "Tablet", value: 4, color: "#f59e0b" },
];

const audienceRadar = [
  { subject: 'Engagement', A: 120, B: 110, fullMark: 150 },
  { subject: 'Retention', A: 98, B: 130, fullMark: 150 },
  { subject: 'Conversion', A: 86, B: 130, fullMark: 150 },
  { subject: 'Reach', A: 99, B: 100, fullMark: 150 },
  { subject: 'Loyalty', A: 85, B: 90, fullMark: 150 },
  { subject: 'Virality', A: 65, B: 85, fullMark: 150 },
];

const roasData = [
  { name: "Week 1", value: 4.2 },
  { name: "Week 2", value: 4.8 },
  { name: "Week 3", value: 5.5 },
  { name: "Week 4", value: 5.2 },
];

const cpaData = [
  { name: "Week 1", value: 14.50 },
  { name: "Week 2", value: 13.20 },
  { name: "Week 3", value: 11.80 },
  { name: "Week 4", value: 12.45 },
];

const ShareActions = ({ title }: { title: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(`Check out my ${title} metrics on GrowthOS AI!`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
      <button 
        onClick={handleCopy}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
        title="Copy Link"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Link2 className="h-3.5 w-3.5" />}
      </button>
      <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-[#1DA1F2] transition-colors" title="Share on Twitter">
        <Twitter className="h-3.5 w-3.5" />
      </button>
      <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-[#0A66C2] transition-colors" title="Share on LinkedIn">
        <Linkedin className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export function Analytics() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    clients: 0,
    projects: 0,
    assets: 0,
    tasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedClients, setSelectedClients] = useState<string[]>(["all"]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isProjectFilterOpen, setIsProjectFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState("7d");
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [realtimeUsers, setRealtimeUsers] = useState(124);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [liveCampaignStats, setLiveCampaignStats] = useState<Record<string, any>>({});

  // Deterministic data generation based on selection
  const getDeterministicData = () => {
    const seed = selectedClients.join("") + selectedProjectId + dateRange;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    
    const random = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    const days = dateRange === "24h" ? 24 : dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const labels = dateRange === "24h" ? Array.from({length: 24}, (_, i) => `${i}:00`) : 
                  dateRange === "7d" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] :
                  Array.from({length: days}, (_, i) => `Day ${i+1}`);

    const baseFollowers = 5000 + (hash % 2000);
    const baseEngagement = 2000 + (hash % 1000);
    const baseReach = 10000 + (hash % 5000);

    const chartData = labels.map((name, i) => {
      const s = hash + i;
      return {
        name,
        followers: Math.floor(baseFollowers + (random(s) * 500 * (i + 1) / labels.length)),
        engagement: Math.floor(baseEngagement + (random(s + 1) * 300)),
        reach: Math.floor(baseReach + (random(s + 2) * 2000)),
        conversionRate: Number((3 + random(s + 3) * 4).toFixed(1))
      };
    });

    return chartData;
  };

  const currentGrowthData = getDeterministicData();

  const getFunnelData = () => {
    const lastData = currentGrowthData[currentGrowthData.length - 1];
    return [
      { name: 'Awareness (Reach)', value: lastData.reach, fill: '#3b82f6' },
      { name: 'Consideration (Eng.)', value: lastData.engagement * 10, fill: '#10b981' },
      { name: 'Conversion (Sales)', value: Math.floor(lastData.reach * (lastData.conversionRate / 100)), fill: '#f59e0b' },
    ];
  };

  const funnelData = getFunnelData();

  const getHealthScore = () => {
    const lastData = currentGrowthData[currentGrowthData.length - 1];
    const reachScore = Math.min(100, (lastData.reach / 20000) * 100);
    const engScore = Math.min(100, (lastData.engagement / 5000) * 100);
    const convScore = Math.min(100, (lastData.conversionRate / 10) * 100);
    return Math.floor((reachScore + engScore + convScore) / 3);
  };

  const healthScore = getHealthScore();

  const getRecommendations = () => {
    const lastData = currentGrowthData[currentGrowthData.length - 1];
    const recs = [];
    if (lastData.conversionRate < 4) {
      recs.push({
        title: "Optimize Landing Page",
        desc: "Your conversion rate is below benchmark. Consider A/B testing your CTA buttons.",
        impact: "High"
      });
    }
    if (lastData.engagement < 2500) {
      recs.push({
        title: "Boost Social Engagement",
        desc: "Engagement is dipping. Try interactive polls or video content to re-engage users.",
        impact: "Medium"
      });
    }
    if (lastData.reach > 15000) {
      recs.push({
        title: "Scale Top Performers",
        desc: "Reach is high! Double down on the campaigns driving this traffic.",
        impact: "High"
      });
    }
    return recs.length > 0 ? recs : [
      { title: "Maintain Momentum", desc: "All metrics are stable. Continue current strategy.", impact: "Low" }
    ];
  };

  const recommendations = getRecommendations();

  useEffect(() => {
    if (!user) return;

    const unsubscribers = [
      onSnapshot(collection(db, `users/${user.uid}/clients`), (s) => {
        setCounts(prev => ({ ...prev, clients: s.size }));
        setClients(s.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (error) => {
        console.error("Analytics: Clients listener error", error);
      }),
      onSnapshot(collection(db, `users/${user.uid}/projects`), (s) => {
        setCounts(prev => ({ ...prev, projects: s.size }));
        setProjects(s.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (error) => {
        console.error("Analytics: Projects listener error", error);
      }),
      onSnapshot(collection(db, `users/${user.uid}/assets`), (s) => setCounts(prev => ({ ...prev, assets: s.size })), (error) => {
        console.error("Analytics: Assets listener error", error);
      }),
      onSnapshot(collection(db, `users/${user.uid}/tasks`), (s) => {
        setCounts(prev => ({ ...prev, tasks: s.size }));
        setLoading(false);
      }, (error) => {
        console.error("Analytics: Tasks listener error", error);
        setLoading(false);
      })
    ];

    // Simulate Real-time data
    const interval = setInterval(() => {
      setRealtimeUsers(prev => Math.max(80, prev + Math.floor(Math.random() * 11) - 5));
      
      const eventTypes = ["Ad Click", "Form Submit", "Page View", "Purchase", "Newsletter Signup"];
      const locations = ["New York", "London", "Mumbai", "Tokyo", "Berlin", "Sydney"];
      const newEvent = {
        id: Date.now(),
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setLiveEvents(prev => [newEvent, ...prev].slice(0, 5));

      // Update live campaign stats
      setLiveCampaignStats(prev => {
        const next = { ...prev };
        clients.forEach(c => {
          if (!next[c.id]) {
            next[c.id] = {
              impressions: Math.random() * 50 + 10,
              ctr: Math.random() * 5 + 2,
              engagement: Math.random() * 10 + 5
            };
          } else {
            next[c.id] = {
              impressions: next[c.id].impressions + (Math.random() * 0.1),
              ctr: Math.max(1, next[c.id].ctr + (Math.random() * 0.02 - 0.01)),
              engagement: Math.max(1, next[c.id].engagement + (Math.random() * 0.04 - 0.02))
            };
          }
        });
        return next;
      });
    }, 3000);

    return () => {
      unsubscribers.forEach(unsub => unsub());
      clearInterval(interval);
    };
  }, [user, clients.length]);

  const filteredClients = selectedClients.includes("all") 
    ? clients 
    : clients.filter(c => selectedClients.includes(c.name));

  const toggleClient = (clientName: string) => {
    if (clientName === "all") {
      setSelectedClients(["all"]);
    } else {
      setSelectedClients(prev => {
        const withoutAll = prev.filter(c => c !== "all");
        if (withoutAll.includes(clientName)) {
          const next = withoutAll.filter(c => c !== clientName);
          return next.length === 0 ? ["all"] : next;
        } else {
          return [...withoutAll, clientName];
        }
      });
    }
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsProjectFilterOpen(false);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Growth Intelligence</h1>
          <p className="text-sm md:text-base text-muted-foreground">Comprehensive insights and live campaign statistics based on your active projects.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {/* Project/Campaign Selector */}
            <div className="relative whitespace-nowrap">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center space-x-2 h-9"
                onClick={() => setIsProjectFilterOpen(!isProjectFilterOpen)}
              >
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs md:text-sm">
                  {selectedProjectId === "all" ? "All Campaigns" : selectedProject?.title || "Campaign"}
                </span>
              </Button>
              
              {isProjectFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsProjectFilterOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-background border rounded-md shadow-lg z-20 p-2 max-h-64 overflow-y-auto">
                    <div 
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-all",
                        selectedProjectId === "all" && "bg-primary/10 text-primary"
                      )}
                      onClick={() => toggleProject("all")}
                    >
                      <span className="text-sm font-medium">All Campaigns</span>
                    </div>
                    <div className="h-px bg-border my-1" />
                    {projects.map(p => (
                      <div 
                        key={p.id}
                        className={cn(
                          "flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-all",
                          selectedProjectId === p.id && "bg-primary/10 text-primary"
                        )}
                        onClick={() => toggleProject(p.id)}
                      >
                        <span className="text-sm font-medium truncate">{p.title}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2 bg-background border rounded-md px-2 py-1.5 whitespace-nowrap">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select 
                className="bg-transparent text-xs md:text-sm outline-none"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
          <div className="relative whitespace-nowrap">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center space-x-2 h-9"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs md:text-sm">
                {selectedClients.includes("all") 
                  ? "All Clients" 
                  : `${selectedClients.length} Selected`}
              </span>
            </Button>
            
            {isFilterOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsFilterOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-background border rounded-md shadow-lg z-20 p-2 max-h-64 overflow-y-auto">
                  <div 
                    className={cn(
                      "flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-all duration-200 hover:scale-[1.02] hover:shadow-sm",
                      selectedClients.includes("all") && "bg-primary/10 text-primary"
                    )}
                    onClick={() => toggleClient("all")}
                  >
                    <div className={cn(
                      "h-4 w-4 border rounded flex items-center justify-center",
                      selectedClients.includes("all") ? "bg-primary border-primary" : "border-muted-foreground"
                    )}>
                      {selectedClients.includes("all") && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm font-medium">All Clients</span>
                  </div>
                  
                  <div className="h-px bg-border my-1" />
                  
                  {clients.map(c => (
                    <div 
                      key={c.id}
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-all duration-200 hover:scale-[1.02] hover:shadow-sm",
                        selectedClients.includes(c.name) && "bg-primary/10 text-primary"
                      )}
                      onClick={() => toggleClient(c.name)}
                    >
                      <div className={cn(
                        "h-4 w-4 border rounded flex items-center justify-center",
                        selectedClients.includes(c.name) ? "bg-primary border-primary" : "border-muted-foreground"
                      )}>
                        {selectedClients.includes(c.name) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-sm truncate">{c.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
      </div>
    </div>

      {/* Campaign Health & Key Metrics */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Campaign Health</span>
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full mt-1",
                  healthScore > 80 ? "bg-emerald-100 text-emerald-600" : 
                  healthScore > 60 ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"
                )}>
                  {healthScore > 80 ? "Excellent" : healthScore > 60 ? "Good" : "Needs Attention"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center py-2">
              <div className="relative h-24 w-24">
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path
                    className="stroke-muted fill-none"
                    strokeWidth="3"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={cn(
                      "fill-none stroke-current transition-all duration-1000",
                      healthScore > 80 ? "text-emerald-500" : 
                      healthScore > 60 ? "text-amber-500" : "text-rose-500"
                    )}
                    strokeWidth="3"
                    strokeDasharray={`${healthScore}, 100`}
                    strokeLinecap="round"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xl font-black">{healthScore}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <MetricCard 
          title="Total Reach" 
          value={`${(currentGrowthData[currentGrowthData.length - 1].reach / 1000).toFixed(1)}K`}
          change="+12.5%" 
          trend="up" 
          icon={<Users className="h-4 w-4" />} 
          description={`Across ${selectedClients.includes("all") ? "all clients" : "selected clients"}`}
        />
        <MetricCard 
          title="Engagement" 
          value={currentGrowthData[currentGrowthData.length - 1].engagement.toLocaleString()}
          change="+8.4%" 
          trend="up" 
          icon={<Activity className="h-4 w-4" />} 
          description="Total interactions"
        />
        <MetricCard 
          title="Conversion Rate" 
          value={`${currentGrowthData[currentGrowthData.length - 1].conversionRate}%`}
          change="-0.2%" 
          trend="down" 
          icon={<Target className="h-4 w-4" />} 
          description="Goal completion rate"
        />
      </div>

      {/* Detailed Campaign Metrics */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3">
        <MetricCard 
          title="CPA" 
          value={`₹${(1000 + (currentGrowthData[currentGrowthData.length - 1].reach % 500)).toLocaleString()}`}
          change="-₹175" 
          trend="up" 
          icon={<IndianRupee className="h-4 w-4" />} 
          description="Cost per acquisition"
        />
        <MetricCard 
          title="ROAS" 
          value={`${(4 + (currentGrowthData[currentGrowthData.length - 1].conversionRate / 2)).toFixed(1)}x`}
          change="+0.8x" 
          trend="up" 
          icon={<TrendingUp className="h-4 w-4" />} 
          description="Return on ad spend"
        />
        <MetricCard 
          title="CAC" 
          value={`₹${(850 + (currentGrowthData[currentGrowthData.length - 1].reach % 300)).toFixed(0)}`}
          change="-8.4%"
          trend="up"
          icon={<Target className="h-4 w-4" />}
          description="Customer acquisition cost"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Charts & Funnel */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="overflow-hidden border-primary/10 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Growth Performance
                </CardTitle>
                <CardDescription className="text-[10px]">Reach, Engagement and Conversion trends</CardDescription>
              </div>
              <ShareActions title="Growth" />
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentGrowthData}>
                    <defs>
                      <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#94a3b8'}}
                      dy={10}
                    />
                    <YAxis 
                      yAxisId="left"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#94a3b8'}}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#94a3b8'}}
                      unit="%"
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="reach" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorReach)" 
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="engagement" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={0} 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="conversionRate" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Funnel Analysis */}
            <Card className="border-primary/10 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Conversion Funnel
                </CardTitle>
                <CardDescription className="text-[10px]">Reach to Conversion drop-off</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funnelData.map((item, i) => {
                    const percentage = (item.value / funnelData[0].value) * 100;
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <span>{item.name}</span>
                          <span>{item.value.toLocaleString()}</span>
                        </div>
                        <div className="h-8 w-full bg-muted rounded-md overflow-hidden relative">
                          <motion.div 
                            className="h-full"
                            style={{ backgroundColor: item.fill, width: `${percentage}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: i * 0.2 }}
                          />
                          <div className="absolute inset-0 flex items-center justify-end pr-2">
                            <span className="text-[10px] font-black text-white drop-shadow-sm">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card className="border-amber-100 bg-amber-50/20 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  AI Recommendations
                </CardTitle>
                <CardDescription className="text-[10px]">Actionable insights based on your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendations.map((rec, i) => (
                  <div key={i} className="p-3 rounded-lg bg-white border border-amber-100 shadow-sm group hover:border-amber-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold flex items-center gap-1">
                          {rec.title}
                          <span className={cn(
                            "text-[8px] px-1.5 py-0.5 rounded-full uppercase",
                            rec.impact === 'High' ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"
                          )}>
                            {rec.impact} Impact
                          </span>
                        </h4>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{rec.desc}</p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-amber-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Metrics */}
        <div className="space-y-8">
          {/* Acquisition Sources */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-base font-bold">Acquisition</CardTitle>
              <CardDescription className="text-[10px]">Traffic source distribution</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={acquisitionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {acquisitionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {acquisitionData.map(item => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] text-muted-foreground truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Live Campaign Feed */}
        <Card className="lg:col-span-1 border-emerald-100 bg-emerald-50/30 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 cursor-default">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              <span>Live Campaign Feed</span>
            </CardTitle>
            <CardDescription>Real-time events from active campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {liveEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-white border border-emerald-100 shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        event.type === 'Purchase' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {event.type === 'Purchase' ? <IndianRupee className="h-4 w-4" /> : <MousePointer2 className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{event.type}</p>
                        <p className="text-[10px] text-muted-foreground">{event.location}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{event.time}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {liveEvents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-xs italic">
                  Waiting for incoming events...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Audience Insights Radar */}
        <Card className="lg:col-span-1 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 cursor-default">
          <CardHeader>
            <CardTitle>Audience Profile</CardTitle>
            <CardDescription>Psychographic and behavior breakdown.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={audienceRadar}>
                <PolarGrid stroke="#f0f0f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar
                  name="Current Audience"
                  dataKey="A"
                  stroke="var(--color-primary)"
                  fill="var(--color-primary)"
                  fillOpacity={0.5}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device & Geo Distribution */}
        <Card className="lg:col-span-1 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 cursor-default">
          <CardHeader>
            <CardTitle>Tech Distribution</CardTitle>
            <CardDescription>Devices used by your audience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {deviceData.map(device => (
                <div key={device.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      {device.name === 'Mobile' ? <Smartphone className="h-3 w-3" /> : 
                       device.name === 'Desktop' ? <Monitor className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                      <span>{device.name}</span>
                    </div>
                    <span className="font-bold">{device.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full" 
                      style={{ backgroundColor: device.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${device.value}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="text-xs font-bold mb-3 uppercase tracking-wider text-muted-foreground">Top Locations</h4>
              <div className="space-y-2">
                {[
                  { name: "India", val: "42%", flag: "🇮🇳" },
                  { name: "USA", val: "18%", flag: "🇺🇸" },
                  { name: "UK", val: "12%", flag: "🇬🇧" },
                  { name: "Germany", val: "8%", flag: "🇩🇪" },
                ].map(loc => (
                  <div key={loc.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center space-x-2">
                      <span>{loc.flag}</span>
                      <span>{loc.name}</span>
                    </span>
                    <span className="font-medium">{loc.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Live Monitor */}
      <Card className="border-primary/10 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 cursor-default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Campaign Live Monitor</CardTitle>
              <CardDescription>Real-time status of your active marketing campaigns.</CardDescription>
            </div>
            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-100">
              <Activity className="h-3 w-3 animate-pulse" />
              <span>SYSTEM ONLINE</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filteredClients.slice(0, 8).map((client, i) => {
              const stats = liveCampaignStats[client.id] || { impressions: 0, ctr: 0, engagement: 0 };
              return (
                <div key={client.id} className="p-4 rounded-xl border bg-card hover:border-primary/30 hover:shadow-md hover:scale-[1.02] transition-all duration-300 group cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-medium text-emerald-600">Active</span>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold truncate">{client.name}</h4>
                  <p className="text-[10px] text-muted-foreground mb-3">{client.niche || 'General Niche'}</p>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Impressions</p>
                      <p className="text-xs font-bold">{stats.impressions.toFixed(1)}K</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">CTR</p>
                      <p className="text-xs font-bold">{stats.ctr.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Engagement</p>
                      <p className="text-xs font-bold">{stats.engagement.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredClients.length === 0 && [1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 rounded-xl border bg-card opacity-50 grayscale">
                <div className="h-8 w-8 rounded-lg bg-muted mb-3" />
                <div className="h-4 w-24 bg-muted rounded mb-2" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, change, trend, icon, description }: { 
  title: string, 
  value: string, 
  change: string, 
  trend: 'up' | 'down',
  icon: React.ReactNode,
  description?: string
}) {
  return (
    <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-default group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          <ShareActions title={title} />
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center mt-1">
          {trend === 'up' ? (
            <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
          )}
          <span className={cn(
            "text-xs font-medium",
            trend === 'up' ? "text-green-600" : "text-red-600"
          )}>
            {change}
          </span>
          <span className="text-[10px] text-muted-foreground ml-1">vs last month</span>
        </div>
        {description && (
          <p className="text-[10px] text-muted-foreground mt-2 italic">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

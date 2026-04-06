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
  DollarSign,
  Calendar,
  Percent,
  TrendingDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, query, onSnapshot } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

const growthData = [
  { name: "Mon", followers: 4000, engagement: 2400, reach: 12000 },
  { name: "Tue", followers: 4200, engagement: 2800, reach: 13500 },
  { name: "Wed", followers: 4500, engagement: 2200, reach: 11000 },
  { name: "Thu", followers: 4800, engagement: 3200, reach: 15000 },
  { name: "Fri", followers: 5100, engagement: 3800, reach: 18000 },
  { name: "Sat", followers: 5400, engagement: 4200, reach: 21000 },
  { name: "Sun", followers: 5800, engagement: 3900, reach: 19500 },
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

export function Analytics() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    clients: 0,
    projects: 0,
    assets: 0,
    tasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState("all");
  const [dateRange, setDateRange] = useState("7d");
  const [clients, setClients] = useState<any[]>([]);
  const [realtimeUsers, setRealtimeUsers] = useState(124);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [liveCampaignStats, setLiveCampaignStats] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!user) return;

    const unsubscribers = [
      onSnapshot(collection(db, `users/${user.uid}/clients`), (s) => {
        setCounts(prev => ({ ...prev, clients: s.size }));
        setClients(s.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(collection(db, `users/${user.uid}/projects`), (s) => setCounts(prev => ({ ...prev, projects: s.size }))),
      onSnapshot(collection(db, `users/${user.uid}/assets`), (s) => setCounts(prev => ({ ...prev, assets: s.size }))),
      onSnapshot(collection(db, `users/${user.uid}/tasks`), (s) => {
        setCounts(prev => ({ ...prev, tasks: s.size }));
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

  const filteredClients = selectedClient === "all" 
    ? clients 
    : clients.filter(c => c.name === selectedClient);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Growth Intelligence</h1>
          <p className="text-muted-foreground">Comprehensive Google Analytics-style insights and live campaign statistics.</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-background border rounded-md px-2 py-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select 
              className="bg-transparent text-sm outline-none"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 bg-background border rounded-md px-2 py-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select 
              className="bg-transparent text-sm outline-none"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="all">All Properties</option>
              {clients.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
      </div>

      {/* Real-time & High-level Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-primary/20 bg-primary/5">
          <div className="absolute top-2 right-2 flex items-center space-x-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-bold text-red-500 uppercase">Live</span>
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{realtimeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Users currently on site</p>
            <div className="mt-4 h-1 w-full bg-primary/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                animate={{ width: ["20%", "80%", "40%", "90%", "60%"] }}
                transition={{ duration: 10, repeat: Infinity }}
              />
            </div>
          </CardContent>
        </Card>

        <MetricCard 
          title="Avg. Session Duration" 
          value="2m 45s" 
          change="+14%" 
          trend="up" 
          icon={<Clock className="h-4 w-4" />} 
          description="Time spent per visit"
        />
        <MetricCard 
          title="Bounce Rate" 
          value="34.2%" 
          change="-5.1%" 
          trend="up" 
          icon={<Activity className="h-4 w-4" />} 
          description="Lower is better"
        />
        <MetricCard 
          title="Goal Conversions" 
          value="892" 
          change="+22%" 
          trend="up" 
          icon={<Target className="h-4 w-4" />} 
          description="Key actions completed"
        />
      </div>

      {/* Detailed Campaign Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard 
          title="Conversion Rate" 
          value="4.82%" 
          change="+0.5%" 
          trend="up" 
          icon={<Percent className="h-4 w-4" />} 
          description="Visits to goal completion"
        />
        <MetricCard 
          title="Cost Per Acquisition (CPA)" 
          value="$12.45" 
          change="-$2.10" 
          trend="up" 
          icon={<DollarSign className="h-4 w-4" />} 
          description="Lower is better"
        />
        <MetricCard 
          title="Return on Ad Spend (ROAS)" 
          value="5.2x" 
          change="+0.8x" 
          trend="up" 
          icon={<TrendingUp className="h-4 w-4" />} 
          description="Revenue per dollar spent"
        />
      </div>

      {/* Profitability Visualizations */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>ROAS Performance</span>
            </CardTitle>
            <CardDescription>Return on Ad Spend trend over the last 4 weeks.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roasData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.02)'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <span>CPA Efficiency</span>
            </CardTitle>
            <CardDescription>Cost Per Acquisition trend (Lower is better).</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cpaData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.02)'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Acquisition Sources */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Acquisition</CardTitle>
            <CardDescription>Where your traffic comes from.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
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
            <div className="mt-4 grid grid-cols-2 gap-2">
              {acquisitionData.map(item => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-muted-foreground">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Behavior Flow / Growth */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>User Behavior</CardTitle>
              <CardDescription>Engagement and reach trends over time.</CardDescription>
            </div>
            <div className="flex space-x-2">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-[10px] text-muted-foreground">Reach</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-muted-foreground">Engagement</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="reach" 
                  stroke="var(--color-primary)" 
                  fillOpacity={1} 
                  fill="url(#colorReach)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="engagement" 
                  stroke="#10b981" 
                  fillOpacity={0} 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Live Campaign Feed */}
        <Card className="lg:col-span-1 border-emerald-100 bg-emerald-50/30">
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
                        {event.type === 'Purchase' ? <DollarSign className="h-4 w-4" /> : <MousePointer2 className="h-4 w-4" />}
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
        <Card className="lg:col-span-1">
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
        <Card className="lg:col-span-1">
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
      <Card className="border-primary/10">
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
                <div key={client.id} className="p-4 rounded-xl border bg-card hover:border-primary/30 transition-all group">
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
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

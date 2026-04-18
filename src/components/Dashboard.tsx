import { Link } from "react-router-dom";
import { Flame, Trophy, TrendingUp, Zap, Clock, Briefcase, Sparkles, Loader2, ArrowRight, Plus, Calendar as CalendarIcon, PenTool, Wrench, Target, Ear, FileText, IndianRupee, Users, Palette, Search, Layout, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { MOCK_SUGGESTIONS, MOCK_TRENDS } from "@/constants";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState, useRef } from "react";
import { db, collection, query, orderBy, limit, onSnapshot, where, handleFirestoreError, OperationType, addDoc } from "@/lib/firebase";
import { AIService } from "@/lib/gemini";
import ReactMarkdown from "react-markdown";

export function Dashboard() {
  const { profile, user, isAuthReady } = useAuth();
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [nextPost, setNextPost] = useState<any>(null);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [tipOfDay, setTipOfDay] = useState<string | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [briefingError, setBriefingError] = useState(false);
  const briefingInProgress = useRef(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [teamCount, setTeamCount] = useState(0);

  // Quick Add State
  const [showQuickAdd, setShowQuickAdd] = useState<'client' | 'project' | null>(null);
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddClientId, setQuickAddClientId] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quickActions = [
    { name: "New Strategy", icon: Sparkles, href: "/tools?tool=strategy", color: "bg-blue-500" },
    { name: "Competitor", icon: Search, href: "/tools?tool=competitor", color: "bg-orange-500" },
    { name: "Lead Scorer", icon: Target, href: "/tools?tool=lead-scorer", color: "bg-purple-500" },
    { name: "Brand Kit", icon: Palette, href: "/brand-kit", color: "bg-pink-500" },
  ];

  useEffect(() => {
    if (!user) return;

    // Fetch invoices for revenue
    const qInvoices = query(collection(db, `users/${user.uid}/invoices`), where("status", "==", "paid"));
    const unsubscribeInvoices = onSnapshot(qInvoices, (snapshot) => {
      const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
      setTotalRevenue(total);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/invoices`);
    });

    // Fetch team count
    const qTeam = query(collection(db, `users/${user.uid}/team`));
    const unsubscribeTeam = onSnapshot(qTeam, (snapshot) => {
      setTeamCount(snapshot.size + 1); // +1 for the owner
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/team`);
    });
    
    // Fetch tasks
    const qTasks = query(
      collection(db, `users/${user.uid}/tasks`),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentTasks(tasks);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/tasks`);
    });

    // Fetch client count and clients list
    const qClients = query(collection(db, `users/${user.uid}/clients`), orderBy("name", "asc"));
    const unsubscribeClients = onSnapshot(qClients, (snapshot) => {
      setClientCount(snapshot.size);
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/clients`);
    });

    // Fetch next scheduled post
    const today = new Date().toISOString().split('T')[0];
    const qCalendar = query(
      collection(db, `users/${user.uid}/calendar`),
      where("date", ">=", today),
      orderBy("date", "asc"),
      limit(1)
    );
    const unsubscribeCalendar = onSnapshot(qCalendar, (snapshot) => {
      if (!snapshot.empty) {
        setNextPost(snapshot.docs[0].data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/calendar`);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeClients();
      unsubscribeCalendar();
      unsubscribeInvoices();
      unsubscribeTeam();
    };
  }, [user]);

  const generateBriefing = async () => {
    if (!user || briefingInProgress.current) return;
    
    // Simple client-side cache to prevent re-generation within a session
    const cacheKey = `briefing_${user.uid}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { briefing: b, tip: t, ts } = JSON.parse(cached);
      // Cache for 30 minutes
      if (Date.now() - ts < 30 * 60 * 1000) {
        setBriefing(b);
        setTipOfDay(t);
        return;
      }
    }

    setLoadingBriefing(true);
    setBriefingError(false);
    briefingInProgress.current = true;
    try {
      const taskSummary = recentTasks.length > 0 
        ? recentTasks.map(t => `${t.type}: ${t.title}`).join(", ")
        : "No recent tasks. Just starting the day.";
      
      const text = await AIService.generateContent(`As a professional marketing assistant, provide a concise (3-4 bullet points) "Daily Briefing" for ${profile?.displayName || 'the User'}. 
        Context: They have ${clientCount} clients. Recent activity: ${taskSummary}.
        Also, provide a separate "Marketing Tip of the Day" (one sentence).
        Format: 
        BRIEFING: [bullet points]
        TIP: [one sentence tip]`);
      
      const briefingPart = text.split("TIP:")[0].replace("BRIEFING:", "").trim();
      const tipPart = text.split("TIP:")[1]?.trim() || "Focus on consistency to build brand authority.";
      
      setBriefing(briefingPart);
      setTipOfDay(tipPart);

      // Store in session cache
      sessionStorage.setItem(cacheKey, JSON.stringify({ 
        briefing: briefingPart, 
        tip: tipPart, 
        ts: Date.now() 
      }));
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("quota")) {
        setBriefingError(true);
      }
    } finally {
      setLoadingBriefing(false);
      briefingInProgress.current = false;
    }
  };

  const handleQuickAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !quickAddName) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/clients`), {
        userId: user.uid,
        name: quickAddName,
        status: "active",
        progress: 0,
        createdAt: new Date().toISOString()
      });
      setQuickAddName("");
      setShowQuickAdd(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/clients`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !quickAddTitle) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/projects`), {
        userId: user.uid,
        clientId: quickAddClientId || null,
        title: quickAddTitle,
        status: "todo",
        priority: "medium",
        createdAt: new Date().toISOString()
      });
      setQuickAddTitle("");
      setQuickAddClientId("");
      setShowQuickAdd(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/projects`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (user && isAuthReady && !briefing && !loadingBriefing && !briefingInProgress.current) {
      generateBriefing();
    }
  }, [recentTasks.length, clientCount, isAuthReady, briefing, loadingBriefing]);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Personal Assistant Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">Welcome back, {profile?.displayName?.split(' ')[0] || 'User'}. Ready to manage your campaigns?</p>
      </div>

      {/* AI Briefing & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <div className="flex items-center">
                  <Sparkles className="mr-2 h-4 w-4 text-primary shrink-0" />
                  AI Daily Briefing
                </div>
                {tipOfDay && (
                  <div className="hidden md:flex items-center text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse">
                    <Zap className="h-3 w-3 mr-1" />
                    Tip: {tipOfDay}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBriefing ? (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span>Analyzing your recent activity...</span>
                </div>
              ) : briefingError ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                  <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold">Rate Limit Reached</p>
                    <p className="text-[10px] text-muted-foreground px-4">The AI is busy. Please wait a moment before retrying.</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => generateBriefing()}>
                    <Zap className="h-3 w-3 mr-1" />
                    Retry Now
                  </Button>
                </div>
              ) : briefing ? (
                <div className="space-y-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground leading-relaxed max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    <ReactMarkdown>{briefing}</ReactMarkdown>
                  </div>
                  {tipOfDay && (
                    <div className="md:hidden p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <p className="text-[10px] font-bold text-amber-800 flex items-center mb-1">
                        <Zap className="h-3 w-3 mr-1" />
                        TIP OF THE DAY
                      </p>
                      <p className="text-xs text-amber-700 italic">{tipOfDay}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic py-4">No briefing available yet. Start by generating some content!</p>
              )}
            </CardContent>
          </Card>

          {/* AI Quick Tools */}
          <div className="hidden md:grid grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.name} to={action.href}>
                  <Card className="hover:border-primary/50 transition-all group border-primary/10 bg-card/50 hover:bg-card">
                    <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                      <div className={cn("p-2 rounded-lg text-white", action.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-wider">{action.name}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 md:gap-4">
          <Card 
            className="hover:border-primary/50 transition-all group cursor-pointer active:scale-95 border-primary/10 bg-primary/5"
            onClick={() => setShowQuickAdd('client')}
          >
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-blue-500 text-white">
                <Users className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold">Quick Add Client</p>
                <p className="text-[10px] text-muted-foreground">Onboard a new client</p>
              </div>
            </CardContent>
          </Card>
          <Card 
            className="hover:border-primary/50 transition-all group cursor-pointer active:scale-95 border-primary/10 bg-primary/5"
            onClick={() => setShowQuickAdd('project')}
          >
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-purple-500 text-white">
                <Layout className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold">New Campaign</p>
                <p className="text-[10px] text-muted-foreground">Start a new project</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Add Modals */}
      <AnimatePresence>
        {showQuickAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card>
                <CardHeader>
                  <CardTitle>{showQuickAdd === 'client' ? 'Add New Client' : 'Start New Campaign'}</CardTitle>
                  <CardDescription>Quickly add to your database.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={showQuickAdd === 'client' ? handleQuickAddClient : handleQuickAddProject} className="space-y-4">
                    {showQuickAdd === 'client' ? (
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Client Name</label>
                        <input 
                          autoFocus
                          className="w-full bg-muted border-none rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                          placeholder="e.g. Nike India"
                          value={quickAddName}
                          onChange={(e) => setQuickAddName(e.target.value)}
                          required
                        />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-muted-foreground">Campaign Title</label>
                          <input 
                            autoFocus
                            className="w-full bg-muted border-none rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                            placeholder="e.g. Summer Sale 2024"
                            value={quickAddTitle}
                            onChange={(e) => setQuickAddTitle(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-muted-foreground">Select Client (Optional)</label>
                          <select 
                            className="w-full bg-muted border-none rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                            value={quickAddClientId}
                            onChange={(e) => setQuickAddClientId(e.target.value)}
                          >
                            <option value="">No Client</option>
                            {clients.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button type="button" variant="ghost" onClick={() => setShowQuickAdd(null)}>Cancel</Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Campaign Health</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +2.4% vs last week
            </p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Team Size</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{teamCount} Members</div>
            <p className="text-xs text-emerald-700">Collaborating now</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Next Post</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-900 truncate">{nextPost?.title || "No posts planned"}</div>
            <p className="text-xs text-blue-700">
              {nextPost ? `${nextPost.platform} • ${new Date(nextPost.date).toLocaleDateString()}` : "Schedule in Calendar"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Active Clients</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{clientCount} Brands</div>
            <p className="text-xs text-purple-700">Managing {clientCount} brands</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Recent Client Tasks */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight flex items-center">
            <Clock className="mr-2 h-5 w-5 text-primary" />
            Recent Client Tasks
          </h2>
          <div className="space-y-4">
            {recentTasks.length > 0 ? (
              recentTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-bold">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(task.createdAt).toLocaleDateString()} • {task.type}
                          </p>
                        </div>
                          <Link to="/projects">
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-xl">
                <p className="text-muted-foreground">No tasks yet. Start by generating a caption!</p>
              </div>
            )}
          </div>
        </div>

        {/* Trending Topics */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Trending Topics</h2>
          <div className="space-y-4">
            {MOCK_TRENDS.map((trend, index) => (
              <motion.div
                key={trend.keyword}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{trend.keyword}</p>
                        <p className="text-xs text-muted-foreground mt-1">{trend.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{trend.relevance}%</p>
                      <p className="text-[10px] text-muted-foreground">Match</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

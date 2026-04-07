import { Link } from "react-router-dom";
import { Flame, Trophy, TrendingUp, Zap, Clock, Briefcase, Sparkles, Loader2, ArrowRight, Plus, Calendar as CalendarIcon, PenTool, Wrench, Target, Ear, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { MOCK_SUGGESTIONS, MOCK_TRENDS } from "@/constants";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import { db, collection, query, orderBy, limit, onSnapshot, where } from "@/lib/firebase";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";

export function Dashboard() {
  const { profile, user } = useAuth();
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [nextPost, setNextPost] = useState<any>(null);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  const quickActions = [
    { name: "New Strategy", icon: Sparkles, href: "/tools", color: "bg-blue-500" },
    { name: "Lead Scorer", icon: Target, href: "/tools", color: "bg-purple-500" },
    { name: "Social Listening", icon: Ear, href: "/tools", color: "bg-orange-500" },
    { name: "Campaign Brief", icon: FileText, href: "/tools", color: "bg-green-500" },
  ];

  useEffect(() => {
    if (!user) return;
    
    // Fetch tasks
    const qTasks = query(
      collection(db, `users/${user.uid}/tasks`),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentTasks(tasks);
    });

    // Fetch client count
    const qClients = query(collection(db, `users/${user.uid}/clients`));
    const unsubscribeClients = onSnapshot(qClients, (snapshot) => {
      setClientCount(snapshot.size);
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
    });

    return () => {
      unsubscribeTasks();
      unsubscribeClients();
      unsubscribeCalendar();
    };
  }, [user]);

  const generateBriefing = async () => {
    if (!user || recentTasks.length === 0) return;
    setLoadingBriefing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const taskSummary = recentTasks.map(t => `${t.type}: ${t.title}`).join(", ");
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `As a professional marketing assistant, provide a concise (3-4 bullet points) "Daily Briefing" for ${profile?.displayName || 'Diwakar'}. 
        Context: They have ${clientCount} clients. Recent activity: ${taskSummary}.
        Focus on: What to do next, a quick trend tip, and a motivational closer.`,
      });
      setBriefing(response.text || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBriefing(false);
    }
  };

  useEffect(() => {
    if (recentTasks.length > 0 && !briefing) {
      generateBriefing();
    }
  }, [recentTasks]);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Personal Assistant Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">Welcome back, {profile?.displayName?.split(' ')[0] || 'Diwakar'}. Ready to manage your campaigns?</p>
      </div>

      {/* AI Briefing & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center">
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              AI Daily Briefing
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBriefing ? (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing your recent activity...</span>
              </div>
            ) : briefing ? (
              <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground leading-relaxed">
                <ReactMarkdown>{briefing}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic py-4">No briefing available yet. Start by generating some content!</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link key={action.name} to={action.href}>
              <Card className="h-full hover:border-primary/50 transition-all group cursor-pointer active:scale-95">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                  <div className={cn("p-2 rounded-lg text-white transition-transform group-hover:scale-110", action.color)}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold">{action.name}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientCount}</div>
            <p className="text-xs text-muted-foreground">Managing {clientCount} brands</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Daily Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{profile?.streak || 0} Days</div>
            <p className="text-xs text-orange-700">Assistant is active</p>
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
            <CardTitle className="text-sm font-medium text-purple-900">Trend Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">High</div>
            <p className="text-xs text-purple-700">Market is active</p>
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

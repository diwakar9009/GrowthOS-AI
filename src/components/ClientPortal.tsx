import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db, doc, onSnapshot, collection, query, where, orderBy, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  BarChart3, 
  Calendar as CalendarIcon, 
  FileText, 
  MessageSquare,
  Users,
  ArrowLeft,
  Loader2,
  Sparkles,
  Target,
  Zap
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function ClientPortal() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;

    // This is a simplified version. In a real app, you'd need a way to find the owner's UID
    // For this demo, we'll assume the client data is accessible if you have the ID
    // (In production, you'd use a specific 'portals' collection or similar)
    
    // We'll search for the client document across all users (simplified for demo)
    // In a real multi-tenant app, the URL would likely include the agency ID too
    
    // For now, let's assume we are viewing it as the agency owner or a logged-in client
    // We'll use a placeholder logic here
    setLoading(false);
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Client Portal</h1>
            <p className="text-sm text-muted-foreground">Real-time project tracking for your brand.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Live Sync Active</span>
        </div>
      </div>

      {/* Hero Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles className="h-32 w-32 text-primary" />
        </div>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                Partner Dashboard
              </div>
              <h2 className="text-4xl font-black tracking-tight">Welcome to your Growth Portal</h2>
              <p className="text-muted-foreground max-w-md">
                Track every campaign, review content schedules, and see your brand's growth in real-time.
              </p>
            </div>
            <div className="flex flex-col items-center p-6 rounded-2xl bg-white shadow-xl border border-primary/10 min-w-[200px]">
              <div className="text-4xl font-black text-primary">84%</div>
              <div className="text-xs font-bold text-muted-foreground uppercase mt-1">Overall Progress</div>
              <div className="w-full h-2 bg-secondary rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-primary w-[84%]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          {/* Active Campaigns */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold flex items-center">
              <Zap className="mr-2 h-5 w-5 text-primary" />
              Active Campaigns
            </h3>
            <div className="grid gap-4">
              {[
                { name: "Summer Launch 2024", status: "In Progress", progress: 65, icon: Target },
                { name: "Influencer Outreach", status: "Review", progress: 90, icon: Users },
              ].map((campaign, i) => (
                <Card key={i} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <campaign.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">{campaign.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-bold">{campaign.progress}%</div>
                        <div className="w-24 h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${campaign.progress}%` }} />
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Content Calendar Preview */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
              Upcoming Content
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "Product Showcase Reel", date: "Tomorrow", platform: "Instagram" },
                { title: "Weekly Newsletter", date: "Friday", platform: "Email" },
              ].map((post, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-primary">{post.platform}</span>
                      <span className="text-[10px] font-medium text-muted-foreground">{post.date}</span>
                    </div>
                    <p className="text-sm font-bold">{post.title}</p>
                    <Button variant="outline" size="sm" className="w-full text-[10px] h-7">Review Draft</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Quick Stats */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold">Performance</h3>
            <div className="grid gap-4">
              <Card className="bg-emerald-50 border-emerald-100">
                <CardContent className="p-4 flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-emerald-900">+24%</p>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase">Engagement</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-100">
                <CardContent className="p-4 flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-blue-900">12</p>
                    <p className="text-[10px] font-bold text-blue-700 uppercase">Tasks Completed</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Documents */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Shared Files
            </h3>
            <div className="space-y-2">
              {["Brand Guidelines.pdf", "Q2 Strategy.docx", "April Invoices"].map((file, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                  <span className="text-xs font-medium">{file}</span>
                  <Clock className="h-3 w-3 text-muted-foreground" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

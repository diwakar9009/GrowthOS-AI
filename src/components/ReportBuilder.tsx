import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { 
  FileBarChart, 
  Download, 
  Share2, 
  Plus, 
  Trash2, 
  Layout, 
  Eye, 
  Sparkles, 
  Loader2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Users,
  TrendingUp,
  Target,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, query, orderBy, onSnapshot, addDoc, handleFirestoreError, OperationType } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";

interface ReportSection {
  id: string;
  type: 'text' | 'chart' | 'metrics' | 'summary';
  title: string;
  content: string;
  data?: any;
}

export function ReportBuilder() {
  const { user, profile } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [activeReport, setActiveReport] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  
  // New Report Form
  const [reportTitle, setReportTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [dateRange, setDateRange] = useState("Last 30 Days");

  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const qReports = query(collection(db, `users/${user.uid}/reports`), orderBy("createdAt", "desc"));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/reports`);
    });

    const qClients = query(collection(db, `users/${user.uid}/clients`), orderBy("name", "asc"));
    const unsubscribeClients = onSnapshot(qClients, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/clients`);
    });

    return () => {
      unsubscribeReports();
      unsubscribeClients();
    };
  }, [user]);

  const createReport = async () => {
    if (!user || !reportTitle) return;
    setLoading(true);
    try {
      const newReport = {
        title: reportTitle,
        clientName: clientName || "General",
        dateRange,
        status: 'draft',
        sections: [
          {
            id: 'sec_1',
            type: 'summary',
            title: 'Executive Summary',
            content: 'This report provides an overview of the marketing performance and key achievements for the period.'
          },
          {
            id: 'sec_2',
            type: 'metrics',
            title: 'Key Performance Indicators',
            content: 'Overview of core metrics including reach, engagement, and conversions.',
            data: {
              reach: '125.4K',
              engagement: '8.2%',
              conversions: '1,240',
              roi: '320%'
            }
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, `users/${user.uid}/reports`), newReport);
      setActiveReport({ id: docRef.id, ...newReport });
      setIsCreating(false);
      setReportTitle("");
      setClientName("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/reports`);
    } finally {
      setLoading(false);
    }
  };

  const generateAIAnalysis = async () => {
    if (!user || !activeReport) return;
    setGeneratingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `As a senior digital marketing analyst, write a professional executive summary and performance analysis for a marketing report.
      Client: ${activeReport.clientName}
      Report Title: ${activeReport.title}
      Period: ${activeReport.dateRange}
      
      Include:
      1. Executive Summary (2-3 paragraphs)
      2. Key Wins & Achievements
      3. Strategic Recommendations for next month
      
      Format with professional Markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      const analysis = response.text || "Analysis generation failed.";
      
      // Update the report sections
      const updatedSections = [...activeReport.sections];
      updatedSections[0].content = analysis;
      
      setActiveReport({ ...activeReport, sections: updatedSections });
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Report Builder</h1>
          <p className="text-muted-foreground">Generate professional marketing reports for your clients.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-gradient-to-r from-primary to-purple-600 shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" />
          Create New Report
        </Button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle>New Report Details</CardTitle>
                <CardDescription>Set the foundation for your marketing report.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Report Title</label>
                    <Input 
                      placeholder="e.g., Monthly Performance Report" 
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    >
                      <option value="">Select Client...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                      <option value="General">General / No Client</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reporting Period</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                    >
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                      <option>Last Quarter</option>
                      <option>Year to Date</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button onClick={createReport} disabled={loading || !reportTitle}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Initialize Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Reports List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">Recent Reports</h3>
          <div className="space-y-2">
            {reports.length > 0 ? (
              reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report)}
                  className={cn(
                    "w-full flex flex-col items-start p-4 rounded-xl border transition-all text-left group",
                    activeReport?.id === report.id 
                      ? "bg-primary/10 border-primary shadow-sm" 
                      : "bg-card hover:border-primary/30 hover:bg-accent"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-widest",
                      activeReport?.id === report.id ? "text-primary" : "text-muted-foreground"
                    )}>
                      {report.clientName}
                    </span>
                    <FileBarChart className={cn(
                      "h-4 w-4",
                      activeReport?.id === report.id ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                    )} />
                  </div>
                  <h4 className="font-bold text-sm line-clamp-1">{report.title}</h4>
                  <span className="text-[10px] text-muted-foreground mt-2">
                    {new Date(report.createdAt).toLocaleDateString()} • {report.dateRange}
                  </span>
                </button>
              ))
            ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-xl">
                <FileBarChart className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                <p className="text-xs text-muted-foreground">No reports yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Report Editor/Preview */}
        <div className="lg:col-span-3">
          {activeReport ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Layout className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{activeReport.title}</h2>
                    <p className="text-xs text-muted-foreground">Client: {activeReport.clientName} • Period: {activeReport.dateRange}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={generateAIAnalysis} disabled={generatingAI}>
                    {generatingAI ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3 text-primary" />}
                    AI Insights
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="mr-2 h-3 w-3" />
                    Share
                  </Button>
                  <Button size="sm">
                    <Download className="mr-2 h-3 w-3" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Report Content */}
              <div className="space-y-6 bg-white dark:bg-slate-950 p-8 rounded-2xl border shadow-xl min-h-[800px]">
                {/* Report Header */}
                <div className="border-b pb-8 mb-8 flex justify-between items-start">
                  <div className="space-y-4">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-black text-xl">
                      {profile?.displayName?.charAt(0) || "G"}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tighter uppercase">{activeReport.title}</h3>
                      <p className="text-muted-foreground font-medium">Prepared for {activeReport.clientName}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Marketing Intelligence Report</p>
                    <p className="text-sm font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Sections */}
                <div className="space-y-12">
                  {activeReport.sections.map((section: any) => (
                    <div key={section.id} className="space-y-4">
                      <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                        <h4 className="text-lg font-bold text-primary flex items-center">
                          <span className="mr-2 opacity-50">#</span>
                          {section.title}
                        </h4>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {section.type === 'metrics' && section.data && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(section.data).map(([key, value]: [string, any]) => (
                            <div key={key} className="p-4 rounded-xl bg-muted/30 border text-center">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{key}</p>
                              <p className="text-xl font-black text-primary">{value}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{section.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Report Footer */}
                <div className="mt-20 pt-8 border-t flex justify-between items-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  <span>Generated by Growth OS Intelligence</span>
                  <span>Confidential • {activeReport.clientName}</span>
                  <span>Page 1 of 1</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[600px] rounded-2xl border-2 border-dashed p-12 text-center bg-muted/10">
              <div className="mb-6 rounded-full bg-primary/10 p-6">
                <FileBarChart className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">No Report Selected</h3>
              <p className="mb-8 text-muted-foreground max-w-md">
                Select a report from the sidebar or create a new one to start building professional marketing presentations.
              </p>
              <Button onClick={() => setIsCreating(true)} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Report
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

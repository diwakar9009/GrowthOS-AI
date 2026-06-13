import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { 
  Plus, 
  Briefcase, 
  Mail, 
  Target, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Layout,
  ArrowLeft,
  Phone,
  Video,
  MessageSquare,
  FileText,
  Save,
  Bot,
  Calendar as CalendarIcon,
  ChevronRight,
  TrendingUp,
  FileBarChart,
  ClipboardList,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/ToastContext";
import { AIService } from "@/lib/gemini";
import ReactMarkdown from "react-markdown";

type TabType = "communications" | "campaigns" | "strategy";
type CommType = "Email" | "Phone Call" | "Video Meeting" | "Chat Message" | "Briefing";

export function Clients() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Lists and loaders
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Master-Detail views
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("communications");
  
  // Toggle states
  const [isAdding, setIsAdding] = useState(false);
  
  // Client list search
  const [searchQuery, setSearchQuery] = useState("");

  // New client form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newNiche, setNewNiche] = useState("");
  const [newBrandVoice, setNewBrandVoice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // CRM: Communication log variables
  const [commLogs, setCommLogs] = useState<any[]>([]);
  const [commType, setCommType] = useState<CommType>("Email");
  const [commSummary, setCommSummary] = useState("");
  const [commNotes, setCommNotes] = useState("");
  const [commActionItems, setCommActionItems] = useState("");
  const [commStatus, setCommStatus] = useState("Completed");
  const [commDate, setCommDate] = useState(new Date().toISOString().slice(0, 16));
  const [loggingComm, setLoggingComm] = useState(false);
  const [isLoggingExpanded, setIsLoggingExpanded] = useState(false);

  // CRM: Connected projects variables
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectPriority, setProjectPriority] = useState("medium");
  const [projectDueDate, setProjectDueDate] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [isProjectFormExpanded, setIsProjectFormExpanded] = useState(false);

  // CRM: Notes & Strategy editor variables
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesPreviewMode, setNotesPreviewMode] = useState(false);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);

  // Selected client object computed safely
  const selectedClient = clients.find(c => c.id === selectedClientId);

  // 1. Fetching all clients for the logged-in user
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, `users/${user.uid}/clients`),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/clients`);
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Fetching communication logs for selected client
  useEffect(() => {
    if (!user || !selectedClientId) return;
    setCommLogs([]); // Reset log when switching client
    const qComm = query(
      collection(db, `users/${user.uid}/clients/${selectedClientId}/communications`),
      orderBy("date", "desc")
    );
    const unsubscribeComm = onSnapshot(qComm, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCommLogs(logs);
    }, (error) => {
      console.error("Communications fetch error:", error);
    });
    return () => unsubscribeComm();
  }, [user, selectedClientId]);

  // 3. Fetching associated projects (filtered from core projects list)
  useEffect(() => {
    if (!user || !selectedClientId) return;
    const qProj = query(
      collection(db, `users/${user.uid}/projects`),
      orderBy("createdAt", "desc")
    );
    const unsubscribeProj = onSnapshot(qProj, (snapshot) => {
      const projectsList: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const matching = projectsList.filter(p => p.clientId === selectedClientId);
      setClientProjects(matching);
    }, (error) => {
      console.error("Projects retrieval error in client portal sync:", error);
    });
    return () => unsubscribeProj();
  }, [user, selectedClientId]);

  // 4. Update core notes state when the active client notes field changes
  useEffect(() => {
    if (selectedClient) {
      setNotesText(
        selectedClient.notes || 
        `### Marketing Strategy Brief - ${selectedClient.name}\n\nNo competitive blueprint generated yet. Click the "Generate AI Brand Strategy Deck" below to trigger high-converting growth pathways mapping competitor weaknesses, hooks, and content vectors.`
      );
    }
  }, [selectedClientId, selectedClient?.notes]);

  // Handle client listing submit API
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName) return;
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, `users/${user.uid}/clients`), {
        userId: user.uid,
        name: newName,
        email: newEmail,
        niche: newNiche,
        brandVoice: newBrandVoice,
        status: "active",
        progress: 0,
        notes: "",
        createdAt: new Date().toISOString()
      });
      showToast(`Onboarded client "${newName}" successfully!`, "success");
      setNewName("");
      setNewEmail("");
      setNewNiche("");
      setNewBrandVoice("");
      setIsAdding(false);
      
      // Auto-open CRM for this newly added client
      setSelectedClientId(docRef.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/clients`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/clients`, clientId));
      showToast("Client removed from directory", "success");
      if (selectedClientId === clientId) {
        setSelectedClientId(null);
      }
      setDeleteConfirmId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/clients/${clientId}`);
    }
  };

  const updateProgress = async (clientId: string, currentProgress: number, isDecrement: boolean = false) => {
    if (!user) return;
    let newProgress = isDecrement ? Math.max(0, currentProgress - 10) : Math.min(100, currentProgress + 10);
    try {
      await updateDoc(doc(db, `users/${user.uid}/clients`, clientId), {
        progress: newProgress,
        status: newProgress === 100 ? "completed" : "active"
      });
      showToast(`Campaign milestones synced to ${newProgress}%`, "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/clients/${clientId}`);
    }
  };

  // Submit Communication entry to Firestore
  const handleLogCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedClientId || !commSummary) return;
    setLoggingComm(true);

    try {
      const cleanActionItems = commActionItems
        .split("\n")
        .map(item => item.trim())
        .filter(item => item.length > 0);

      await addDoc(collection(db, `users/${user.uid}/clients/${selectedClientId}/communications`), {
        type: commType,
        summary: commSummary,
        notes: commNotes,
        actionItems: cleanActionItems,
        status: commStatus,
        date: commDate,
        createdAt: new Date().toISOString()
      });

      // Show toast
      showToast(`Successfully logged ${commType} summary card.`, "success");
      
      // Reset inputs
      setCommSummary("");
      setCommNotes("");
      setCommActionItems("");
      setIsLoggingExpanded(false);
    } catch (error) {
      console.error("Failed writing comm to DB:", error);
      showToast("Failed loading parameters to Database.", "error");
    } finally {
      setLoggingComm(false);
    }
  };

  // Inline submit client-specific campaign task to Core Projects Board
  const handleCreateProjectTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedClientId || !projectTitle) return;
    setCreatingProject(true);

    try {
      await addDoc(collection(db, `users/${user.uid}/projects`), {
        userId: user.uid,
        clientId: selectedClientId,
        title: projectTitle,
        description: projectDesc || "Injected from CRM Workspace Dashboard.",
        priority: projectPriority,
        dueDate: projectDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "todo",
        clientName: selectedClient?.name || "",
        createdAt: new Date().toISOString()
      });

      showToast(`Task "${projectTitle}" injected to global Projects Kanban!`, "success");
      setProjectTitle("");
      setProjectDesc("");
      setProjectPriority("medium");
      setProjectDueDate("");
      setIsProjectFormExpanded(false);
    } catch (e) {
      console.error("Error writing Project internally:", e);
      showToast("Database write error.", "error");
    } finally {
      setCreatingProject(false);
    }
  };

  // Saved edited Brand strategy & field notes back to Firestore
  const handleSaveNotes = async () => {
    if (!user || !selectedClientId) return;
    setSavingNotes(true);
    try {
      await updateDoc(doc(db, `users/${user.uid}/clients`, selectedClientId), {
        notes: notesText
      });
      showToast("CMO Strategy Brief updated inside Cloud CRM!", "success");
    } catch (e) {
      console.error("Error updating strategy deck:", e);
      showToast("Strategy save error.", "error");
    } finally {
      setSavingNotes(false);
    }
  };

  // Gemini brainstorming deck
  const handleAIGenerateStrategy = async () => {
    if (!user || !selectedClient) return;
    setGeneratingStrategy(true);
    showToast("Launching expert copywriter algorithms... generating playbook.", "info");

    const promptText = `
      You are an elite Digital CMO & Conversion Agency Partner.
      Create a highly professional, competitive growth and brand matrix strategy brief for:
      - Client Name: ${selectedClient.name}
      - Business Niche / Domain: ${selectedClient.niche || "General Service/E-Commerce"}
      - Declared Brand Voice: ${selectedClient.brandVoice || "Professional & Trustworthy"}

      Structure your output perfectly using these headers inside markdown layout:
      
      ### 🌟 Core Value Hook Strategy
      Provide 2 premium, emotionally magnetic copywriting hook variants designed to run on paid advertising networks. Incorporate the declared brand voice: "${selectedClient.brandVoice || "Professional"}".
      
      ### 🔍 Competitor Analysis Matrix
      Detail how this niche typically leaks traffic on mobile views, and outline 3 key parameters to outrank typical standards.

      ### 📈 Recommended Lead Acquisition Funnel
      Propose a high-converting conversion path (e.g., specific micro-lead magnet, webinar loop, interactive calculator checkout, or strategy callback script).
      Keep the brief punchy, actionable, and approximately 300-350 words in clean markdown.
    `;

    try {
      const aiResults = await AIService.generateContent(promptText, {
        model: "gemini-3.5-flash",
        systemInstruction: "You are an elite Digital CMO specializing in conversion copywriting and hyper-scale paid-traffic architectures. Avoid fluff, keep output dense with actual execution instructions."
      });
      setNotesText(aiResults);
      showToast("CMO Strategy generated! Review below and click 'Save Strategy' to store permanently.", "success");
    } catch (error: any) {
      console.error("AI CRM strategy generation failed:", error);
      showToast("AI system is currently busy. Please save details manually.", "error");
    } finally {
      setGeneratingStrategy(false);
    }
  };

  // Dynamic communication logs icon selection
  const getCommIcon = (type: CommType) => {
    switch (type) {
      case "Email": return <Mail className="h-4 w-4 text-blue-500" />;
      case "Phone Call": return <Phone className="h-4 w-4 text-emerald-500" />;
      case "Video Meeting": return <Video className="h-4 w-4 text-purple-500" />;
      case "Chat Message": return <MessageSquare className="h-4 w-4 text-orange-500" />;
      case "Briefing": return <FileText className="h-4 w-4 text-amber-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Filter clients locally by search querying
  const filteredClients = clients.filter(c => {
    const textStr = `${c.name} ${c.niche} ${c.email} ${c.brandVoice}`.toLowerCase();
    return textStr.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      {/* -------------------- MASTER LIST VIEW -------------------- */}
      {!selectedClientId ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col space-y-1">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Client CRM Command Center
              </h1>
              <p className="text-sm md:text-base text-muted-foreground font-semibold">
                Monitor client onboard stats, log real-time communications, and inject immediate campaign schedules.
              </p>
            </div>
            <Button 
              onClick={() => setIsAdding(!isAdding)} 
              className="w-full md:w-auto bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isAdding ? "Cancel Addition" : "Onboard New Client"}
            </Button>
          </div>

          {/* Add Client Drawer Form */}
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="border-primary/20 bg-primary/5 p-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-extrabold flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Client Onboarding Dossier
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Instantly initialize their target niche and brand personality mapping.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddClient} className="grid gap-4 grid-cols-1 md:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Client / Account Name</label>
                        <Input 
                          placeholder="e.g., Nike India, GrowthCorp" 
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          required
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Contact Email Address</label>
                        <Input 
                          type="email"
                          placeholder="primary-contact@client.com" 
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Industry / Niche segment</label>
                        <Input 
                          placeholder="e.g., B2B SaaS, Fitness, Beauty Cosmetics" 
                          value={newNiche}
                          onChange={(e) => setNewNiche(e.target.value)}
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Brand voice descriptions or guidelines</label>
                        <Input 
                          placeholder="e.g., Witty, humorous, professional, direct scientific style, playful aesthetic" 
                          value={newBrandVoice}
                          onChange={(e) => setNewBrandVoice(e.target.value)}
                          className="bg-card"
                        />
                      </div>
                      <div className="md:col-span-3 flex justify-end space-x-2 pt-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="text-xs font-bold font-mono">Cancel</Button>
                        <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs font-bold">
                          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Client Card"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search bar & statistics overview */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-muted/30 p-4 rounded-2xl border">
            <div className="relative w-full sm:max-w-xs">
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-card h-9 text-xs"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground">🔍</span>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground font-mono">
              <span>ACTIVE ACCOUNTS: {clients.filter(c => c.status === "active").length}</span>
              <span className="h-4 w-px bg-border" />
              <span>COMPLETED STREAMS: {clients.filter(c => c.status === "completed").length}</span>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredClients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-primary/5 hover:border-primary/20">
                    <CardHeader className="pb-3 flex flex-row items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center text-base font-extrabold text-foreground group-hover:text-primary transition-colors">
                          <Briefcase className="mr-2 h-4.5 w-4.5 text-primary shrink-0" />
                          {client.name}
                        </CardTitle>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground font-medium">
                          <Target className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <span>{client.niche || "Unspecified Segment"}</span>
                        </div>
                      </div>
                      
                      <div className={cn(
                        "rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest border",
                        client.status === 'active' 
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" 
                          : "bg-blue-500/10 text-blue-700 border-blue-500/20"
                      )}>
                        {client.status}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Email contact block */}
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground font-medium">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{client.email || "No email assigned"}</span>
                      </div>

                      {/* Brand Voice accent snippet */}
                      {client.brandVoice && (
                        <div className="flex items-center space-x-1.5 text-xs text-purple-700 bg-purple-500/5 border border-purple-500/10 px-2 py-1 rounded-lg">
                          <Sparkles className="h-3.5 w-3.5 shrink-0 text-purple-600 animate-pulse" />
                          <span className="truncate font-semibold text-[11px]">Voice: {client.brandVoice}</span>
                        </div>
                      )}

                      {/* Campaign linear progress slider */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-muted-foreground">Milestone Progress</span>
                          <span className="text-foreground font-mono">{client.progress}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${client.progress}%` }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                      </div>

                      {/* Interactive Buttons footer */}
                      <div className="flex items-center justify-between pt-3 border-t gap-2 flex-wrap">
                        {/* Detail CRM launcher button */}
                        <Button 
                          onClick={() => {
                            setSelectedClientId(client.id);
                            setActiveTab("communications");
                          }}
                          className="h-8 text-xs font-extrabold bg-primary shadow flex-1 sm:flex-initial"
                        >
                          <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                          Open CRM Suite
                          <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>

                        {/* Traditional Quick increment buttons */}
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-8 w-8 text-muted-foreground border-muted-foreground/20"
                            onClick={() => updateProgress(client.id, client.progress, true)}
                            title="Decrement Progress Model"
                          >
                            -
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-8 w-8 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10"
                            onClick={() => updateProgress(client.id, client.progress, false)}
                            title="Log Progress Step (+10%)"
                          >
                            +
                          </Button>

                          <span className="w-2" />

                          {/* Delete confirmed sequence */}
                          {deleteConfirmId === client.id ? (
                            <div className="flex items-center space-x-1 border border-rose-200 bg-rose-50 rounded-lg p-0.5 animate-in fade-in slide-in-from-right-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-rose-600 hover:bg-rose-100 rounded"
                                onClick={() => handleDeleteClient(client.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-muted-foreground"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteConfirmId(client.id)}
                              title="Delete Client Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Link to={`/portal/${client.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-600" title="Client Portal Link">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center bg-muted/10">
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold">No clients match searching keywords</h3>
              <p className="mb-6 text-xs text-muted-foreground">Modify your filters or add a fresh account above to log campaigns.</p>
              <Button onClick={() => setIsAdding(true)} className="bg-primary">
                <Plus className="mr-2 h-4 w-4" />
                Onboard New Account
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* -------------------- CRM DETAIL WORKSPACE VIEW -------------------- */
        selectedClient && (
          <div className="space-y-6">
            {/* Header / Meta breadcrumbs block */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20 border p-5 rounded-2xl shadow-sm">
              <div className="flex items-start gap-3">
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedClientId(null)}
                  className="h-10 w-10 shrink-0 rounded-xl"
                  title="Return to Directory list"
                >
                  <ArrowLeft className="h-4.5 w-4.5" />
                </Button>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">{selectedClient.name}</h2>
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Client CRM dossier
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground font-semibold">
                    <span className="bg-muted px-2 py-0.5 rounded text-[10px]">{selectedClient.niche || "General"} Niche</span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                    <span>{selectedClient.email || "No contact email"}</span>
                    {selectedClient.brandVoice && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                        <span className="text-purple-600">Voice: {selectedClient.brandVoice}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress and core metadata metrics panel */}
              <div className="flex items-center gap-4 bg-card px-4 py-2.5 rounded-xl border self-start md:self-auto shrink-0">
                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground">Onboard Milestone</p>
                  <p className="text-sm font-black text-foreground">{selectedClient.progress}% Progress</p>
                </div>
                <div className="w-16 bg-muted h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${selectedClient.progress}%` }} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <button 
                    onClick={() => updateProgress(selectedClient.id, selectedClient.progress, false)}
                    className="text-[10px] px-1.5 py-0.5 bg-primary/10 hover:bg-primary/20 text-primary rounded font-bold"
                  >
                    +10%
                  </button>
                  <button 
                    onClick={() => updateProgress(selectedClient.id, selectedClient.progress, true)}
                    className="text-[10px] px-1.5 py-0.5 hover:bg-muted text-muted-foreground rounded"
                  >
                    -10%
                  </button>
                </div>
              </div>
            </div>

            {/* TWO COLUMN MASTER-DETAIL CRM LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left sidebar: Clients list switcher (hidden on mobile, displayed on desktop inside details page) */}
              <div className="hidden lg:block lg:col-span-3 space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar border-r pr-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Clients Switcher</h4>
                  <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-mono font-bold text-muted-foreground">{clients.length} accounts</span>
                </div>
                <div className="space-y-1.5">
                  {clients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-between group",
                        c.id === selectedClientId
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card text-foreground border-transparent hover:border-muted-foreground/20 hover:bg-muted/40"
                      )}
                    >
                      <div className="truncate pr-2">
                        <p className="font-extrabold truncate">{c.name}</p>
                        <p className={cn("text-[9px] truncate font-medium mt-0.5", c.id === selectedClientId ? "text-primary-foreground/80" : "text-muted-foreground")}>
                          {c.niche || "General niche"}
                        </p>
                      </div>
                      <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity", c.id === selectedClientId && "opacity-100")} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right panel: Active sub-section Workspace */}
              <div className="lg:col-span-9 space-y-6">
                {/* Visual Navigation Tabs */}
                <div className="flex border-b bg-muted/20 p-1.5 rounded-xl gap-1">
                  <button
                    onClick={() => setActiveTab("communications")}
                    className={cn(
                      "flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 select-none hover:bg-card cursor-pointer",
                      activeTab === "communications" 
                        ? "bg-card text-primary shadow-sm border border-black/5" 
                        : "text-muted-foreground"
                    )}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Communications History</span>
                    <span className="bg-muted text-muted-foreground text-[10px] px-1.5 rounded-full font-mono">{commLogs.length}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("campaigns")}
                    className={cn(
                      "flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 select-none hover:bg-card cursor-pointer",
                      activeTab === "campaigns" 
                        ? "bg-card text-primary shadow-sm border border-black/5" 
                        : "text-muted-foreground"
                    )}
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    <span>Campaign &amp; Projects</span>
                    <span className="bg-primary/10 text-primary text-[10px] px-1.5 rounded-full font-mono">{clientProjects.length}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("strategy")}
                    className={cn(
                      "flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 select-none hover:bg-card cursor-pointer",
                      activeTab === "strategy" 
                        ? "bg-card text-primary shadow-sm border border-black/5" 
                        : "text-muted-foreground"
                    )}
                  >
                    <Bot className="h-3.5 w-3.5 text-purple-600" />
                    <span>AI Strategy &amp; Pitch Notes</span>
                  </button>
                </div>

                {/* TAB CONTENT CAROUSELS */}
                <div>
                  {/* TAB 1: COMMUNICATIONS HUB */}
                  {activeTab === "communications" && (
                    <div className="space-y-6">
                      {/* Log Action item launcher */}
                      <Card className="border-dashed border-primary/20 bg-gradient-to-tr from-primary/5 via-card to-background">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between flex-wrap gap-2">
                          <div>
                            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                              Log Client Interaction Link
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Add client feedback, discovery calls, script briefings, or deliverables sent.
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsLoggingExpanded(!isLoggingExpanded)}
                            className="text-xs font-extrabold"
                          >
                            {isLoggingExpanded ? "✕ Close Form" : "⚡ Log Touchpoint"}
                          </Button>
                        </CardHeader>

                        <AnimatePresence>
                          {isLoggingExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <CardContent className="pt-2">
                                <form onSubmit={handleLogCommunication} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Touchpoint Type</label>
                                    <select
                                      value={commType}
                                      onChange={(e) => setCommType(e.target.value as CommType)}
                                      className="w-full bg-muted border-none rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
                                    >
                                      <option value="Email">📧 Email Correspondence</option>
                                      <option value="Phone Call">📞 Phone / Call Log</option>
                                      <option value="Video Meeting">🎥 Zoom / Video Hangout</option>
                                      <option value="Chat Message">💬 WhatsApp / Chat Thread</option>
                                      <option value="Briefing">📝 Campaign Project Briefing</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Date &amp; Time Stamp</label>
                                    <input
                                      type="datetime-local"
                                      value={commDate}
                                      onChange={(e) => setCommDate(e.target.value)}
                                      className="w-full bg-muted border-none rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Short Summary / Purpose Heading</label>
                                    <Input
                                      placeholder="e.g., Aligned on June Meta Ads ad-retargeting creatives list"
                                      value={commSummary}
                                      onChange={(e) => setCommSummary(e.target.value)}
                                      required
                                      className="bg-card"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Conversation Narrative / Notes</label>
                                    <textarea
                                      placeholder="Details regarding what was agreed upon..."
                                      value={commNotes}
                                      onChange={(e) => setCommNotes(e.target.value)}
                                      className="w-full min-h-[100px] bg-muted border-none rounded-lg p-3 text-xs focus:ring-1 focus:ring-primary outline-none resize-y"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Action items (one directive per line)</label>
                                    <textarea
                                      placeholder="Send mock draft templates by Monday&#10;Incorporate discount pricing tags&#10;Launch A/B copy tests in dashboard"
                                      value={commActionItems}
                                      onChange={(e) => setCommActionItems(e.target.value)}
                                      className="w-full min-h-[100px] bg-muted border-none rounded-lg p-3 text-xs focus:ring-1 focus:ring-primary outline-none resize-y font-mono text-[11px]"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Follow-up Outcome Status</label>
                                    <select
                                      value={commStatus}
                                      onChange={(e) => setCommStatus(e.target.value)}
                                      className="w-full bg-muted border-none rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
                                    >
                                      <option value="Completed">🟢 Completed / Solved</option>
                                      <option value="Pending Follow-up">🟡 Needs Follow-up</option>
                                      <option value="Scheduled">🔵 Scheduled / Planned Ahead</option>
                                    </select>
                                  </div>

                                  <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsLoggingExpanded(false)} className="text-xs font-bold font-mono">
                                      Cancel
                                    </Button>
                                    <Button type="submit" size="sm" disabled={loggingComm} className="text-xs font-bold shadow bg-primary">
                                      {loggingComm ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                                      Save Touchpoint Log
                                    </Button>
                                  </div>
                                </form>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>

                      {/* Communications Listing Feed */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-extrabold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-primary" />
                            Historic Interaction Feed
                          </h3>
                        </div>

                        {commLogs.length === 0 ? (
                          <div className="text-center bg-muted/10 border rounded-2xl p-10">
                            <p className="text-xs font-bold text-muted-foreground italic">No communication touchpoints logged for this account yet.</p>
                            <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm mx-auto">Maintain communication hygiene. Logs sync immediately with client portal dashboards.</p>
                            <Button size="sm" onClick={() => setIsLoggingExpanded(true)} className="mt-4 bg-primary text-xs font-bold">
                              Log First Touchpoint
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
                            {commLogs.map((log) => (
                              <div key={log.id} className="relative pl-12 group">
                                {/* Type icon wrapper */}
                                <div className="absolute left-3 top-1 bg-card border rounded-full p-1.5 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-primary/5 transition-all">
                                  {getCommIcon(log.type)}
                                </div>

                                <Card className="border-primary/5 transition-all group-hover:border-primary/25 group-hover:shadow-md">
                                  <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between flex-wrap gap-2">
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-extrabold text-foreground">{log.type}</span>
                                          <span className="text-[10px] text-muted-foreground font-mono">
                                            {new Date(log.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                          </span>
                                        </div>
                                        <h4 className="text-sm font-extrabold text-primary mt-0.5 leading-snug">{log.summary}</h4>
                                      </div>

                                      <span className={cn(
                                        "text-[9px] font-mono px-2 py-0.5 rounded-full font-bold",
                                        log.status === "Completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-500/20" :
                                        log.status === "Pending Follow-up" ? "bg-amber-50 text-amber-700 border border-amber-500/20" :
                                        "bg-blue-50 text-blue-700 border border-blue-500/20"
                                      )}>
                                        {log.status}
                                      </span>
                                    </div>

                                    {log.notes && (
                                      <p className="text-xs text-muted-foreground/90 font-medium leading-relaxed bg-muted/30 p-2.5 rounded-lg whitespace-pre-line border">
                                        {log.notes}
                                      </p>
                                    )}

                                    {log.actionItems && log.actionItems.length > 0 && (
                                      <div className="space-y-1.5 pt-1.5 border-t">
                                        <p className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                                          <ClipboardList className="h-3 w-3 text-primary" /> Key Directives / Actions
                                        </p>
                                        <ul className="space-y-1">
                                          {log.actionItems.map((item: string, idx: number) => (
                                            <li key={idx} className="text-xs text-foreground font-semibold flex items-start gap-1.5">
                                              <span className="text-primary mt-1 select-none">▪</span>
                                              <span>{item}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CAMPAIGNS & PROJECTS BAR */}
                  {activeTab === "campaigns" && (
                    <div className="space-y-6">
                      {/* Push active tasks to project boards form */}
                      <Card className="border-dashed border-primary/20 bg-muted/5">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between flex-wrap gap-2">
                          <div>
                            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                              <ClipboardList className="h-4 w-4 text-primary" />
                              Inject Project Task Card
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Create tasks linked immediately to this client, reflecting in the Kanban engine.
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsProjectFormExpanded(!isProjectFormExpanded)}
                            className="text-xs font-extrabold"
                          >
                            {isProjectFormExpanded ? "✕ Close Form" : "📌 New Task"}
                          </Button>
                        </CardHeader>
                        <AnimatePresence>
                          {isProjectFormExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <CardContent className="pt-2">
                                <form onSubmit={handleCreateProjectTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Task Title</label>
                                    <Input
                                      placeholder="e.g., Audit visual banners or design copywriting variants"
                                      value={projectTitle}
                                      onChange={(e) => setProjectTitle(e.target.value)}
                                      required
                                      className="bg-card"
                                    />
                                  </div>

                                  <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Description / Deliverable Specs</label>
                                    <textarea
                                      placeholder="Provide step-by-step goals for marketing partners..."
                                      value={projectDesc}
                                      onChange={(e) => setProjectDesc(e.target.value)}
                                      className="w-full min-h-[80px] bg-muted border-none rounded-lg p-3 text-xs focus:ring-1 focus:ring-primary outline-none resize-y"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Task Priority</label>
                                    <select
                                      value={projectPriority}
                                      onChange={(e) => setProjectPriority(e.target.value)}
                                      className="w-full bg-muted border-none rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
                                    >
                                      <option value="low">🟡 Low Priority</option>
                                      <option value="medium">🟠 Medium Priority</option>
                                      <option value="high">🔴 High Priority</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Target Completion Date</label>
                                    <input
                                      type="date"
                                      value={projectDueDate}
                                      onChange={(e) => setProjectDueDate(e.target.value)}
                                      className="w-full bg-muted border-none rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
                                    />
                                  </div>

                                  <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsProjectFormExpanded(false)} className="text-xs font-bold font-mono">
                                      Cancel
                                    </Button>
                                    <Button type="submit" size="sm" disabled={creatingProject} className="text-xs font-bold bg-primary uppercase tracking-wider shadow">
                                      {creatingProject ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : "📌 Inject into Kanban"}
                                    </Button>
                                  </div>
                                </form>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>

                      {/* Displaying active projects connected to Client ID */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-extrabold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                          <Layout className="h-4 w-4 text-primary" />
                          Associated Team Campaigns ({clientProjects.length})
                        </h3>

                        {clientProjects.length === 0 ? (
                          <div className="text-center bg-muted/10 border rounded-2xl p-10">
                            <p className="text-xs font-bold text-muted-foreground italic">No ongoing project campaigns mapping this client ID.</p>
                            <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm mx-auto">Create a template strategy blueprint or inject a card above to activate team workflows.</p>
                            <Button size="sm" onClick={() => setIsProjectFormExpanded(true)} className="mt-4 bg-primary text-xs font-bold">
                              Inject Campaign Card
                            </Button>
                          </div>
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-2">
                            {clientProjects.map((proj) => (
                              <Card key={proj.id} className="border-primary/5 shadow-sm hover:shadow-md transition-shadow relative">
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between">
                                    <span className={cn(
                                      "text-[9px] uppercase font-bold px-2 py-0.5 rounded",
                                      proj.priority === "high" ? "bg-red-100 text-red-800" :
                                      proj.priority === "medium" ? "bg-orange-100 text-orange-800" :
                                      "bg-blue-100 text-blue-800"
                                    )}>
                                      {proj.priority} priority
                                    </span>
                                    <span className={cn(
                                      "text-[9px] font-bold px-2 py-0.5 rounded-full capitalize",
                                      proj.status === "done" ? "bg-emerald-100 text-emerald-800" :
                                      proj.status === "review" ? "bg-purple-100 text-purple-800" :
                                      proj.status === "in-progress" ? "bg-orange-100 text-orange-800" :
                                      "bg-blue-100 text-blue-800"
                                    )}>
                                      {proj.status === "done" ? "Done" : proj.status}
                                    </span>
                                  </div>
                                  <CardTitle className="text-sm font-black mt-2 leading-snug">{proj.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pb-4">
                                  <p className="text-xs text-muted-foreground line-clamp-3 font-medium">
                                    {proj.description || "No detail summary specified."}
                                  </p>
                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold pt-2 border-t font-mono">
                                    <span className="flex items-center gap-1">
                                      <CalendarIcon className="h-3.5 w-3.5" />
                                      Due: {proj.dueDate || "N/A"}
                                    </span>
                                    
                                    <Link to="/projects">
                                      <span className="text-primary flex items-center gap-0.5 cursor-pointer hover:underline">
                                        View Board <ExternalLink className="h-2.5 w-2.5" />
                                      </span>
                                    </Link>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: NOTES & ADVANCED AI STRATEGY */}
                  {activeTab === "strategy" && (
                    <div className="space-y-6">
                      <Card className="border-purple-200 bg-gradient-to-tr from-purple-500/5 via-card to-background shadow-md overflow-hidden">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between flex-wrap gap-2">
                          <div className="space-y-0.5">
                            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                              <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                              CMO Marketing Strategy Deck
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Write campaign notes, branding concepts, competitor research documents, and keyword pillars.
                            </CardDescription>
                          </div>
                          
                          {/* AI action button */}
                          <Button
                            onClick={handleAIGenerateStrategy}
                            disabled={generatingStrategy}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition-transform hover:scale-102 cursor-pointer shadow-purple-500/20"
                          >
                            {generatingStrategy ? (
                              <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Brainstorming Strategy...
                              </>
                            ) : (
                              <>
                                <Bot className="mr-1.5 h-4 w-4" /> Generate AI Strategy
                              </>
                            )}
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Toggles between Edit and render mode */}
                          <div className="flex justify-between items-center bg-muted/30 px-3 py-1.5 rounded-lg border">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                              {notesPreviewMode ? "👁️ Rich Blueprint View" : "✏️ Plain Editor"}
                            </span>
                            
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant={notesPreviewMode ? "ghost" : "outline"}
                                onClick={() => setNotesPreviewMode(false)}
                                className="h-7 text-[10px] font-bold"
                              >
                                Editor Mode
                              </Button>
                              <Button
                                size="sm"
                                variant={notesPreviewMode ? "outline" : "ghost"}
                                onClick={() => setNotesPreviewMode(true)}
                                className="h-7 text-[10px] font-bold"
                              >
                                Render Preview
                              </Button>
                            </div>
                          </div>

                          {/* Editor Panel display */}
                          {notesPreviewMode ? (
                            <div className="border rounded-xl p-4 md:p-5 bg-card prose prose-sm dark:prose-invert max-w-none text-muted-foreground overflow-y-auto max-h-[480px] custom-scrollbar text-xs leading-relaxed space-y-4 font-medium select-text shadow-inner">
                              <ReactMarkdown>{notesText}</ReactMarkdown>
                            </div>
                          ) : (
                            <textarea
                              value={notesText}
                              onChange={(e) => setNotesText(e.target.value)}
                              placeholder="Write custom marketing directives..."
                              className="w-full min-h-[300px] max-h-[500px] p-4 text-xs font-mono bg-muted border-none rounded-xl focus:ring-1 focus:ring-primary outline-none resize-y"
                            />
                          )}

                          {/* Trigger Save notes permanently */}
                          <div className="flex justify-end pt-2 border-t">
                            <Button 
                              onClick={handleSaveNotes}
                              disabled={savingNotes}
                              className="bg-primary text-xs font-bold flex items-center gap-1.5 shadow"
                            >
                              {savingNotes ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Save className="h-4 w-4" /> Save Strategy brief
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

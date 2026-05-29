import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { 
  db, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  handleFirestoreError, 
  OperationType 
} from "@/lib/firebase";
import { AIService } from "@/lib/gemini";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Send, 
  Loader2, 
  Sparkles, 
  Briefcase, 
  Search, 
  Check, 
  Copy, 
  PenTool, 
  Globe, 
  Mail, 
  Calendar as CalendarIcon, 
  Target, 
  ChevronRight, 
  Flame, 
  TrendingUp, 
  FileText,
  RotateCcw,
  Bot,
  User,
  PanelLeftClose,
  PanelLeft,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Message {
  sender: "user" | "assistant";
  text: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
  clientId: string | null;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export function AIAssistant() {
  const { user } = useAuth();
  
  // State for Chats and Clients
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  
  // Selected States
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // UI and Input States
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Scrolling ref
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested Prompts based on digital marketing roles
  const campaignThemes = [
    {
      title: "Content & Copy",
      prompt: "Draft high-converting Meta Ad creative copy and 3 scroll-stopping headlines based on our brand details.",
      icon: PenTool,
    },
    {
      title: "Strategy Calendar",
      prompt: "Generate a strategic 30-day content pillars and calendar roadmap outline for our main channel focus.",
      icon: CalendarIcon,
    },
    {
      title: "SEO Competitor Strategy",
      prompt: "Suggest 10 high-intent SEO target keywords, search volume estimates, and structural content cluster ideas.",
      icon: Globe,
    },
    {
      title: "Onboarding Sequence",
      prompt: "Create a copy template for a 3-step lead acquisition email sequences including clear hooks and calls to actions.",
      icon: Mail,
    },
    {
      title: "Full Launch Blueprint",
      prompt: "Design a comprehensive A-to-Z launch plan, KPI definitions, and estimated budget split recommendations.",
      icon: Target,
    },
  ];

  // Screen resize detector
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch Clients
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, `users/${user.uid}/clients`),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/clients`);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Chat History
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, `users/${user.uid}/assistantChats`),
      orderBy("updatedAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatSession[];
      setChats(chatList);
      setLoadingChats(false);
      
      // Auto-select latest chat if none active and we have chats
      if (!activeChatId && chatList.length > 0) {
        setActiveChatId(chatList[0].id);
        if (chatList[0].clientId) setSelectedClientId(chatList[0].clientId);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/assistantChats`);
      setLoadingChats(false);
    });
    return () => unsubscribe();
  }, [user, activeChatId]);

  // Scroll to bottom on typing or when message finishes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, chats, isGenerating]);

  // Current Active Chat
  const currentChat = chats.find(c => c.id === activeChatId) || null;

  // Selected Client
  const currentClient = clients.find(c => c.id === selectedClientId) || null;

  // Handle Client Selection & Sync with Chat context
  const handleClientChange = async (clientId: string | null) => {
    setSelectedClientId(clientId);
    if (!user || !activeChatId) return;
    
    try {
      await updateDoc(doc(db, `users/${user.uid}/assistantChats`, activeChatId), {
        clientId,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/assistantChats/${activeChatId}`);
    }
  };

  // Launch New Chat Session
  const createNewChat = async (initialTitle = "New Campaign Consultation") => {
    if (!user) return;
    try {
      const newSession = {
        title: initialTitle,
        clientId: selectedClientId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, `users/${user.uid}/assistantChats`), newSession);
      setActiveChatId(docRef.id);
      if (isMobile) setSidebarOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/assistantChats`);
    }
  };

  // Delete Chat Session
  const deleteChatSession = async (chatId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/assistantChats`, chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/assistantChats/${chatId}`);
    }
  };

  // Save/Update Chat title
  const saveChatTitle = async (chatId: string) => {
    if (!user || !editingTitle.trim()) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/assistantChats`, chatId), {
        title: editingTitle.trim(),
        updatedAt: new Date().toISOString()
      });
      setEditingChatId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/assistantChats/${chatId}`);
    }
  };

  // Force Resets Safety Lock Check
  const triggerForceReset = () => {
    AIService.resetSafetyPause();
    setGenerationError(null);
  };

  // Send Message Logic
  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend || inputMessage;
    if (!rawText.trim() || !user) return;
    
    setGenerationError(null);
    setIsGenerating(true);
    setInputMessage("");

    let curChatId = activeChatId;

    // 1. Auto-create chat if none exists yet
    if (!curChatId) {
      try {
        const titleText = rawText.length > 25 ? `${rawText.substring(0, 25)}...` : rawText;
        const newSession = {
          title: titleText,
          clientId: selectedClientId,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, `users/${user.uid}/assistantChats`), newSession);
        curChatId = docRef.id;
        setActiveChatId(curChatId);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/assistantChats`);
        setIsGenerating(false);
        return;
      }
    }

    const fetchedActiveChat = chats.find(c => c.id === curChatId);
    const existingMessages = fetchedActiveChat?.messages || [];
    
    const userMsg: Message = {
      sender: "user",
      text: rawText,
      createdAt: new Date().toISOString()
    };

    const updatedMessagesWithUser = [...existingMessages, userMsg];

    // Optimistically update list in local state
    setChats(prev => prev.map(c => c.id === curChatId ? {
      ...c,
      messages: updatedMessagesWithUser,
      updatedAt: new Date().toISOString()
    } : c));

    try {
      // 2. Format Prompt Context Injection
      let clientContextPrompt = "";
      if (currentClient) {
        clientContextPrompt = `\n--- ACTIVE CLIENT CONTEXT ---
Client Brand Name: ${currentClient.name}
Niche/Industry: ${currentClient.niche || "General"}
Target Audience: ${currentClient.audience || "General Audience"}
Brand Voice / Persona Style: ${currentClient.brandVoice || "Professional & Conversational"}\n-----------------------------\n`;
      }

      const assistantPersona = `You are "GrowthOS Executive Mentor", an elite CMO, digital marketing consultant, and conversion copywriter with 15+ years of digital scaling expertise.
Your purpose is to act as a complete personal marketing assistant.
- Guide step-by-step launches, outline content pillars, map channels, calculate CPC stats, provide copy drafts, write long newsletter scripts, or find topical keyword targets.
- Present answers in elegant, structured executive markdown formatting with clear bold headings, tables, or bullet lists.
- Be highly actionable, strategic, and practical.
- Incorporate user niche, audience, and client specifications naturally. Let client details dictate your tone (e.g. if their brand voice is creative or bold, craft copy drafts using that creative/bold style).`;

      // Pack system instructions & full history context
      const chatContextHistory = updatedMessagesWithUser.slice(-10).map(m => `${m.sender.toUpperCase()}: ${m.text}`).join("\n\n");
      const fullPrompt = `${clientContextPrompt}
Here is the user query:
"${rawText}"

Generate your professional marketing response.`;

      // Call streaming API
      const aiReply = await AIService.generateContent(fullPrompt, {
        model: "gemini-3.5-flash", 
        systemInstruction: assistantPersona,
        useSearch: true // Always ground in search for maximum accuracy!
      });

      const assistantMsg: Message = {
        sender: "assistant",
        text: aiReply,
        createdAt: new Date().toISOString()
      };

      const finalMessages = [...updatedMessagesWithUser, assistantMsg];

      // Safe Sync to Firestore
      await updateDoc(doc(db, `users/${user.uid}/assistantChats`, curChatId), {
        messages: finalMessages,
        title: fetchedActiveChat?.title === "New Campaign Consultation" && rawText.length > 25
          ? `${rawText.substring(0, 25)}...`
          : fetchedActiveChat?.title || "Campaign Consult",
        updatedAt: new Date().toISOString()
      });

    } catch (error: any) {
      console.error("Assistant chat execution error:", error);
      setGenerationError(error.message || "An unexpected error occurred during AI consultation.");
      
      // Rollback optimization or keep user message so they don't lose it
      try {
        await updateDoc(doc(db, `users/${user.uid}/assistantChats`, curChatId), {
          messages: updatedMessagesWithUser,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Local status update rollback failed", err);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy individual message text
  const copyMessageToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageIndex(index);
    setTimeout(() => setCopiedMessageIndex(null), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col lg:flex-row gap-6 overflow-hidden relative pb-10 md:pb-4 min-h-[500px]">
      
      {/* 1. Chats History Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={isMobile ? { x: -280, opacity: 0 } : { width: 0, opacity: 0 }}
            animate={isMobile ? { x: 0, opacity: 1 } : { width: 280, opacity: 1 }}
            exit={isMobile ? { x: -280, opacity: 0 } : { width: 0, opacity: 0 }}
            className={cn(
              "absolute lg:relative top-0 left-0 bottom-0 z-40 lg:z-10 flex flex-col w-72 bg-card border border-border rounded-2xl overflow-hidden shadow-xl lg:shadow-md max-h-full h-full",
              isMobile && "h-[calc(100vh-8rem)]"
            )}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
              <span className="text-xs font-extrabold uppercase text-primary tracking-widest flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                Conversations
              </span>
              <div className="flex items-center gap-1">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={() => createNewChat()}
                  title="Create New Chat"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                {isMobile && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 rounded-lg"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {loadingChats ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Loading consultations...</span>
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <h4 className="text-sm font-semibold text-foreground mb-1">No Consultations Yet</h4>
                  <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">Create a session to begin scale strategies.</p>
                  <Button 
                    size="sm" 
                    className="mt-4 rounded-xl font-bold w-full"
                    onClick={() => createNewChat("Launch Strategies")}
                  >
                    Start Consulting
                  </Button>
                </div>
              ) : (
                chats.map((session) => {
                  const isActive = session.id === activeChatId;
                  const isEditing = editingChatId === session.id;
                  
                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "group relative rounded-xl border transition-all duration-200 overflow-hidden",
                        isActive 
                          ? "bg-primary/5 border-primary/40 shadow-sm" 
                          : "border-border/60 hover:bg-muted/40 hover:border-border"
                      )}
                    >
                      <div className="flex items-center justify-between p-3">
                        <button
                          onClick={() => {
                            setActiveChatId(session.id);
                            if (session.clientId) setSelectedClientId(session.clientId);
                            if (isMobile) setSidebarOpen(false);
                          }}
                          className="flex-1 text-left overflow-hidden mr-6"
                        >
                          {isEditing ? (
                            <form 
                              onSubmit={(e) => { e.preventDefault(); saveChatTitle(session.id); }}
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="h-7 text-xs px-2 py-0.5"
                                autoFocus
                              />
                              <Button size="icon" className="h-7 w-7 rounded-md" type="submit">
                                <Check className="h-3 w-3" />
                              </Button>
                            </form>
                          ) : (
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold truncate pr-3 text-foreground group-hover:text-primary transition-colors">
                                {session.title}
                              </h4>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                <Briefcase className="h-2.5 w-2.5" />
                                {clients.find(c => c.id === session.clientId)?.name || "General Strategy"}
                              </p>
                            </div>
                          )}
                        </button>

                        {/* Action buttons inside item hover */}
                        {!isEditing && (
                          <div className="absolute right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChatId(session.id);
                                setEditingTitle(session.title);
                              }}
                            >
                              <PenTool className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6 text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChatSession(session.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t bg-muted/20">
              <Button 
                onClick={() => createNewChat("Launch Strategies")}
                className="w-full rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                New Conversation
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      
      {/* 2. Main Assistant Workspace Panel */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm relative h-full">
        
        {/* Chat Panel Header */}
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 rounded-xl border-border"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Collapse Conversating Sidebar" : "Expand Conversating Sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-black text-foreground">AI Marketing Command Assistant</h2>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">CMO-level dynamic strategy generator grounding in live search</p>
            </div>
          </div>

          {/* Core Feature: Client context alignment */}
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary shrink-0" />
            <select
              value={selectedClientId || ""}
              onChange={(e) => handleClientChange(e.target.value || null)}
              className="text-xs font-bold rounded-xl border border-input bg-background/50 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary max-w-[180px] sm:max-w-[210px]"
            >
              <option value="">General Consulting (No Client)</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  Client: {c.name} ({c.niche || "General"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chat Messages Log Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-card/40">
          {!currentChat || currentChat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 md:py-16 text-center max-w-2xl mx-auto space-y-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
              >
                <Bot className="h-8 w-8" />
              </motion.div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-foreground">Launch Your Growth OS Personal Assistant</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Discuss A-to-Z marketing plans, draft copy frameworks using selected Client’s voice, formulate ad tests, or search real-time trends instantly.
                </p>
              </div>

              {/* Show context injection banner if selected */}
              {currentClient && (
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs font-bold flex items-center justify-center gap-2 max-w-md w-full">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>
                    Aligned Context: <strong>{currentClient.name}</strong> will guide brand tone and niche logic!
                  </span>
                </div>
              )}

              {/* Campaign Presets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full pt-4">
                {campaignThemes.map((theme) => {
                  const Icon = theme.icon;
                  return (
                    <button
                      key={theme.title}
                      onClick={() => handleSendMessage(theme.prompt)}
                      className="flex text-left p-4 rounded-xl border border-border/80 bg-card hover:bg-accent/40 hover:border-primary/40 transition-all duration-200 group shadow-sm"
                    >
                      <div className="p-2 bg-primary/15 text-primary rounded-lg shrink-0 mr-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                          {theme.title}
                          <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </h4>
                        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{theme.prompt}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6 pr-1">
              {currentChat.messages.map((msg, index) => {
                const isAssistant = msg.sender === "assistant";
                
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={index}
                    className={cn(
                      "flex gap-4 p-4 rounded-2xl max-w-[85%] sm:max-w-[78%] border transition-all shadow-sm",
                      isAssistant
                        ? "bg-card border-border mr-auto"
                        : "bg-primary/15 border-primary/20 ml-auto"
                    )}
                  >
                    {/* Avatar Bubble */}
                    <div className={cn(
                      "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm",
                      isAssistant 
                        ? "bg-primary/10 text-primary border-primary/20" 
                        : "bg-background text-primary border-border"
                    )}>
                      {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>

                    {/* Text Body */}
                    <div className="flex-1 space-y-2 overflow-hidden">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                          {isAssistant ? "GrowthOS Mentor" : "My Consultant Request"}
                        </span>
                        
                        {/* Copy Clip handle */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
                          onClick={() => copyMessageToClipboard(msg.text, index)}
                          title="Copy Message contents"
                        >
                          {copiedMessageIndex === index ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>

                      {/* Content rendering */}
                      <div className="prose prose-sm font-medium leading-relaxed text-foreground max-w-none break-words text-xs sm:text-sm prose-p:my-2 prose-ul:list-disc prose-ul:ml-4 prose-ol:list-decimal prose-ol:ml-4 markdown-body">
                        {isAssistant ? (
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Streaming loading representation */}
              {isGenerating && (
                <div className="flex gap-4 p-4 rounded-2xl bg-muted/20 border border-border/40 max-w-[80%] mr-auto">
                  <div className="h-8 w-8 rounded-xl bg-primary/15 border border-primary/20 text-primary flex items-center justify-center shrink-0 animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="space-y-2 flex-grow">
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest animate-pulse">Assistant is executing smart analytics...</span>
                    <div className="space-y-1.5 py-1">
                      <div className="h-2 bg-muted rounded-full w-3/4 animate-pulse" />
                      <div className="h-2 bg-muted rounded-full w-5/6 animate-pulse" />
                      <div className="h-2 bg-muted rounded-full w-1/2 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {/* Scrolling Target */}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Errors Block */}
        {generationError && (
          <div className="px-6 py-3 border-t border-destructive/20 bg-destructive/10 text-destructive text-xs md:text-sm flex items-center justify-between gap-3 shadow-inner">
            <span className="font-semibold leading-relaxed">{generationError}</span>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-background border-destructive/25 text-destructive font-black shrink-0 hover:bg-destructive/10"
              onClick={triggerForceReset}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Force Unlock
            </Button>
          </div>
        )}

        {/* Input Interactive Typing Panel */}
        <div className="p-4 border-t bg-card">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center gap-2"
          >
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                currentClient 
                  ? `Message Assistant (context configured for: ${currentClient.name})...`
                  : "Message personal assistant... (select a client above to inject brand details!)"
              }
              className="h-11 md:h-12 rounded-xl border border-input shadow-inner text-sm px-4 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 flex-1"
              disabled={isGenerating}
            />
            <Button 
              type="submit" 
              disabled={isGenerating || !inputMessage.trim()}
              className="h-11 md:h-12 w-11 md:w-16 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-primary/10 active:scale-95"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
              ) : (
                <Send className="h-4 w-4 text-primary-foreground" />
              )}
            </Button>
          </form>
        </div>

      </div>

      {/* 3. Right Panel Sidebar: Brand Kit & Dynamic Client Profile at a glance */}
      {currentClient && (
        <div className="hidden xl:flex flex-col w-64 bg-card border border-border rounded-2xl p-4 overflow-y-auto max-h-full h-full shadow-sm space-y-5">
          <div className="flex items-center gap-1.5 border-b pb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-black uppercase text-muted-foreground tracking-wider">Context Details</span>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Company/Brand</span>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                {currentClient.name}
              </h4>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Niche</span>
              <p className="text-xs font-semibold text-muted-foreground bg-muted/40 p-2 rounded-lg leading-relaxed">
                {currentClient.niche || "Not defined"}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Brand Voice</span>
              <p className="text-xs font-semibold text-muted-foreground bg-muted/40 p-2 rounded-lg leading-relaxed">
                {currentClient.brandVoice || "Not defined"}
              </p>
            </div>

            {currentClient.email && (
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Contact Email</span>
                <span className="text-xs font-bold text-primary truncate block">
                  {currentClient.email}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t text-[10px] text-muted-foreground leading-relaxed">
            The values listed above will trigger custom prompts tailoring tone, product positioning, and keyword mapping dynamically in any new message query!
          </div>
        </div>
      )}

    </div>
  );
}

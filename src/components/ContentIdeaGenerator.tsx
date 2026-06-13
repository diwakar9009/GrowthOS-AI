import { useState, useEffect } from "react";
import { AIService } from "@/lib/gemini";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Input } from "./Input";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";
import { db, collection, addDoc, query, orderBy, onSnapshot, handleFirestoreError, OperationType } from "@/lib/firebase";
import { NICHES } from "@/constants";
import { 
  Sparkles, 
  Loader2, 
  Calendar as CalendarIcon, 
  Flame, 
  Trash2, 
  Check, 
  Copy, 
  Briefcase, 
  Network, 
  Video, 
  Layers, 
  Image as ImageIcon, 
  BookOpen, 
  TrendingUp, 
  Eye, 
  Volume2, 
  Plus, 
  HelpCircle,
  Hash,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface Idea {
  day: string;
  trend: string;
  format: string; // Reel, Carousel, Story, TikTok, etc.
  hook: string;
  description: string;
  visualDescription: string;
  predictedRelevance: number;
  audioSuggestion: string;
}

export function ContentIdeaGenerator() {
  const { profile, user } = useAuth();
  const { showToast } = useToast();
  
  // Niche and Brand States
  const [selectedNiche, setSelectedNiche] = useState(profile?.niche || "Fashion & Lifestyle");
  const [customNiche, setCustomNiche] = useState("");
  const [tone, setTone] = useState("Engaging & authentic");
  const [audience, setAudience] = useState("Gen Z & Millennials");
  const [platforms, setPlatforms] = useState<string[]>(["Instagram", "TikTok"]);
  
  // Clients states
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Dynamic system and flow states
  const [isSearchingTrends, setIsSearchingTrends] = useState(false);
  const [scrapedTrends, setScrapedTrends] = useState<string[]>([]);
  const [selectedTrend, setSelectedTrend] = useState("");
  const [customTrend, setCustomTrend] = useState("");
  
  // Generation results
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedIdeas, setGeneratedIdeas] = useState<Idea[]>([]);
  const [rawOutput, setRawOutput] = useState<string>("");
  const [isOriginalMarkdown, setIsOriginalMarkdown] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<{[key: number]: boolean}>({});

  // History states
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load clients
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/clients`), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/clients`);
    });
    return () => unsubscribe();
  }, [user]);

  // Load Idea Generator History
  useEffect(() => {
    if (!user) return;
    setLoadingHistory(true);
    const q = query(
      collection(db, `users/${user.uid}/tasks`), 
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((task: any) => task.type === "suggestion"); // Use 'suggestion' to persist content ideas in task subcollection
      setHistoryItems(items);
      setLoadingHistory(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/tasks`);
      setLoadingHistory(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Handle Client Selection & populating parameters
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) {
      setSelectedClient(null);
      return;
    }
    const clientFound = clients.find(c => c.id === clientId);
    if (clientFound) {
      setSelectedClient(clientFound);
      if (clientFound.niche) setSelectedNiche(clientFound.niche);
      if (clientFound.brandVoice) setTone(clientFound.brandVoice);
    }
  };

  // 1. Fetch live regional trends in niche using Gemini Grounding Search
  const fetchLiveTrends = async () => {
    setIsSearchingTrends(true);
    setScrapedTrends([]);
    setErrorMsg(null);
    
    const nicheQuery = selectedNiche === "Custom" ? customNiche : selectedNiche;
    
    try {
      const prompt = `Perform an instant real-time search of high-volume keywords, social media trends, viral challenges, and news in the "${nicheQuery}" niche. 
      List 5 distinct trending topics or cultural buzzwords currently viral. For example: "Sustainable thrift shopping", "3-step high-protein breakfast hack", etc.
      
      Format your response strictly as a JSON list of strings, for example:
      [
        "Trend name 1",
        "Trend name 2",
        "Trend name 3",
        "Trend name 4",
        "Trend name 5"
      ]`;

      const response = await AIService.generateContent(prompt, {
        model: "gemini-3.5-flash",
        useSearch: true // Enforce live Google Search grounding
      });

      let trendsList: string[] = [];
      try {
        const cleanedResponse = response.replace(/```json/g, "").replace(/```/g, "").trim();
        trendsList = JSON.parse(cleanedResponse);
      } catch (err) {
        // Fallback simple parsing
        const lines = response.split("\n")
          .map(line => line.replace(/[\[\]"'\-,]/g, "").trim())
          .filter(line => line.length > 3 && !line.includes("{") && !line.includes("}"));
        trendsList = lines.slice(0, 5);
      }

      if (trendsList.length > 0) {
        setScrapedTrends(trendsList);
        setSelectedTrend(trendsList[0]);
      } else {
        setScrapedTrends(["Eco-friendly packaging pivot", "Personalized audio hacks", "Interactive AI companions"]);
        setSelectedTrend("Eco-friendly packaging pivot");
      }
    } catch (err: any) {
      console.error("Live trend search failed:", err);
      // Nice fallbacks
      setScrapedTrends([
        "Sustainable clothing styling",
        "Zero-waste kitchen hacks",
        "30-day productivity sprints",
        "Mindful tech detox routines"
      ]);
      setSelectedTrend("Sustainable clothing styling");
    } finally {
      setIsSearchingTrends(false);
    }
  };

  // Pull default trends on load or when niche changes
  useEffect(() => {
    fetchLiveTrends();
  }, [selectedNiche]);

  // 2. Generate a structured Daily Content Blueprint
  const handleGenerateIdeas = async () => {
    setIsLoading(false);
    setErrorMsg(null);
    setGeneratedIdeas([]);
    setIsOriginalMarkdown(false);

    const activeNiche = selectedNiche === "Custom" ? customNiche : selectedNiche;
    const activeTrend = selectedTrend === "Custom" ? customTrend : selectedTrend;

    if (!activeNiche) {
      setErrorMsg("Please specify a niche to customize ideas.");
      return;
    }
    if (!activeTrend) {
      setErrorMsg("Please select or enter a trending topic.");
      return;
    }

    setIsLoading(true);

    const clientMeta = selectedClient 
      ? `Client Name: ${selectedClient.name}, Mission Focus: ${selectedClient.brandVoice || tone}` 
      : "General Campaign Focus";

    try {
      const systemInstruction = `You are a high-level digital marketing director and content viral strategist. 
      Your purpose is to produce high-engagement, hyper-creative media ideas mapping selected trends into the target niche.
      
      You must always return your response in a valid JSON array format unless it is completely impossible. Each element must represent an idea for a business day.
      Your JSON structure MUST perfectly match this TS interface:
      interface Idea {
        day: string; // e.g., "Day 1", "Day 2"
        trend: string; // The trending topic incorporated
        format: string; // "Reel", "Carousel", "Story", "Short", "Infographic", etc.
        hook: string; // High conversion hook/headline
        description: string; // Visual details/script walkthrough, call to action
        visualDescription: string; // Suggested graphics, camera angles or video style
        predictedRelevance: number; // 0 to 100 estimated virality/volume score
        audioSuggestion: string; // Dynamic audio suggestion or audio clip hook
      }`;

      const prompt = `Based on current live search trend "${activeTrend}" and Niche "${activeNiche}":
      Generate 4 highly-individualized daily content ideas tailored specifically to:
      - Platforms: ${platforms.join(", ")}
      - Tone / Persona: ${tone}
      - Underpinning Target Audience: ${audience}
      - Client Profile context: ${clientMeta}
      
      Important:
      Map the trend concept to the niche intelligently. For example, if trend is "Sustainable living" and niche is "Food", suggest a "Story challenge showing Zero-Waste meal prep techniques".
      
      Return ONLY the JSON array. Do not include raw conversational filler outside the markdown codeblock.`;

      const response = await AIService.generateContent(prompt, {
        model: "gemini-3.5-flash",
        systemInstruction,
        useSearch: true
      });

      setRawOutput(response);

      // Clean response block
      const cleanedText = response.replace(/```json/g, "").replace(/```/g, "").trim();
      
      try {
        const parsedIdeas = JSON.parse(cleanedText) as Idea[];
        if (Array.isArray(parsedIdeas) && parsedIdeas.length > 0) {
          setGeneratedIdeas(parsedIdeas);
        } else {
          throw new Error("Parsed result was not a populated array");
        }
      } catch (parseError) {
        console.warn("JSON parsing failed, falling back to markdown rendering mode", parseError);
        setIsOriginalMarkdown(true);
      }
      showToast("AI Content Generated: Dynamic campaign ideas populated successfully!", "success");
    } catch (err: any) {
      console.error("Content generation failed:", err);
      setErrorMsg(err.message || "An error occurred generating your dynamic content calendar.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save single content idea to task history in Firestore
  const saveToCampaignHistory = async (idea: Idea, index: number) => {
    if (!user) return;
    try {
      const activeNiche = selectedNiche === "Custom" ? customNiche : selectedNiche;
      const contentPayload = `
**Format**: ${idea.format}
**Estimated Relevance**: ${idea.predictedRelevance}%
**Viral Hook**: "${idea.hook}"

**Visual Outline & Script**:
${idea.description}

**Visual Setup**:
${idea.visualDescription}

**Suggested Audio Beat**:
${idea.audioSuggestion}
      `;

      await addDoc(collection(db, `users/${user.uid}/tasks`), {
        userId: user.uid,
        clientId: selectedClientId || null,
        title: `Content Idea: ${idea.day} (${idea.format}) - ${activeNiche}`,
        type: 'suggestion', // Valid enum value
        client: selectedClient ? selectedClient.name : 'General Idea Engine',
        content: contentPayload,
        createdAt: new Date().toISOString()
      });

      setSaveStatus(prev => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [index]: false }));
      }, 3000);
    } catch (e: any) {
      console.error("Failed saving to client repository:", e);
      handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/tasks`);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getFormatIcon = (format: string) => {
    const formatted = format.toLowerCase();
    if (formatted.includes("reel") || formatted.includes("video") || formatted.includes("short") || formatted.includes("tiktok")) {
      return <Video className="h-4 w-4 text-emerald-500" />;
    }
    if (formatted.includes("carousel") || formatted.includes("slide") || formatted.includes("deck")) {
      return <Layers className="h-4 w-4 text-sky-500" />;
    }
    if (formatted.includes("story")) {
      return <ImageIcon className="h-4 w-4 text-pink-500" />;
    }
    if (formatted.includes("thread") || formatted.includes("tweet") || formatted.includes("text")) {
      return <Network className="h-4 w-4 text-purple-500" />;
    }
    return <BookOpen className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto px-4 md:px-0 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4 animate-pulse" />
            </span>
            <span className="text-xs font-black uppercase text-primary tracking-widest">GrowthOS Lab</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">AI Content Idea Engine</h1>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-xl">
            Intelligently maps viral industry trends, challenges, and cultural hooks directly into your client’s niche to scale monthly organic traffic.
          </p>
        </div>

        {/* Client Selection Accent Panel */}
        <div className="flex items-center gap-3 bg-card border border-border/80 p-3 rounded-2xl shadow-sm self-start md:self-center">
          <Briefcase className="h-4.5 w-4.5 text-primary shrink-0" />
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">Context Alignment</span>
            <select
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="text-xs font-bold bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-foreground cursor-pointer min-w-[150px]"
            >
              <option value="">General Project (No client)</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>Client: {c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        
        {/* Left Control Center Panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-muted/10 border-b pb-4">
              <CardTitle className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                Target specifications
              </CardTitle>
              <CardDescription className="text-xs">Adjust your niche metrics to get dialed-in results.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              
              {/* Niche Input Category */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Selected Niche</label>
                <select
                  value={selectedNiche}
                  onChange={(e) => setSelectedNiche(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  {NICHES.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                  <option value="Custom">+ Custom niche...</option>
                </select>
                {selectedNiche === "Custom" && (
                  <Input
                    placeholder="e.g. Sustainable Vintage Fashion"
                    value={customNiche}
                    onChange={(e) => setCustomNiche(e.target.value)}
                    className="text-xs mt-1.5 h-9 rounded-xl"
                  />
                )}
              </div>

              {/* Live Trend Selection Accent */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    Trending Signal
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] text-primary hover:bg-primary/5 py-0 px-1.5"
                    onClick={fetchLiveTrends}
                    disabled={isSearchingTrends}
                  >
                    {isSearchingTrends ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Refresh Trends"
                    )}
                  </Button>
                </div>

                {isSearchingTrends ? (
                  <div className="p-4 rounded-xl border border-dashed text-center text-xs space-y-2">
                    <Loader2 className="h-4.5 w-4.5 animate-spin mx-auto text-primary" />
                    <span className="text-muted-foreground block">Querying live search metrics...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={selectedTrend}
                      onChange={(e) => setSelectedTrend(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {scrapedTrends.map((trend) => (
                        <option key={trend} value={trend}>{trend}</option>
                      ))}
                      <option value="Custom">+ Custom Keyword/Trend...</option>
                    </select>

                    {selectedTrend === "Custom" && (
                      <Input
                        placeholder="e.g. sustainable thrifted clothing swap"
                        value={customTrend}
                        onChange={(e) => setCustomTrend(e.target.value)}
                        className="text-xs h-9 rounded-xl mt-1.5"
                      />
                    )}
                  </div>
                )}
                <span className="text-[10px] text-muted-foreground leading-relaxed block bg-muted/20 p-2.5 rounded-lg border border-border/40">
                  We use AI search model grounding to scrape viral organic content hooks dynamically for this niche stream.
                </span>
              </div>

              {/* Vibe / Voice Controls */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Voice / Tone</label>
                <Input
                  placeholder="e.g. Bold, conversational, high hook..."
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="text-xs h-10 rounded-xl"
                />
              </div>

              {/* Audience Specs */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Target Audience</label>
                <Input
                  placeholder="e.g. Young professionals in Bangalore..."
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="text-xs h-10 rounded-xl"
                />
              </div>

              {/* Output Platforms Selector tags */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Target Platforms</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Instagram", "TikTok", "YouTube Shorts", "LinkedIn", "Twitter/X"].map((plat) => {
                    const isSelected = platforms.includes(plat);
                    return (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => {
                          setPlatforms(prev => 
                            prev.includes(plat) 
                              ? prev.filter(p => p !== plat) 
                              : [...prev, plat]
                          );
                        }}
                        className={cn(
                          "px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer",
                          isSelected 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "bg-background border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                        )}
                      >
                        {plat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Submit Action Trigger */}
              <Button
                onClick={handleGenerateIdeas}
                className="w-full h-11 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/15 active:scale-98 transition-all pt-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                    Cooking content angles...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                    Engage Idea Engine
                  </>
                )}
              </Button>

            </CardContent>
          </Card>
        </div>

        {/* Right Output Dashboard Display Panel */}
        <div className="lg:col-span-8 space-y-6 min-h-[300px]">
          
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-12 border border-border rounded-3xl bg-card flex flex-col items-center justify-center text-center space-y-4 shadow-sm min-h-[400px]"
              >
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-4 ring-primary/5 animate-bounce">
                  <Sparkles className="h-8 w-8 animate-pulse" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-base font-black text-foreground">Analyzing trend mechanics...</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Searching internet signals for <strong>"{selectedTrend}"</strong> and matching creative scroll-stopping visuals for the <strong>{selectedNiche}</strong> niche.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating daily calendar formats...
                </div>
              </motion.div>
            )}

            {errorMsg && !isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 border border-destructive/20 bg-destructive/5 rounded-2xl text-destructive text-xs md:text-sm font-semibold flex items-center justify-between gap-3 shadow-inner"
              >
                <span>{errorMsg}</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-card border-destructive/30 text-destructive font-black shrink-0"
                  onClick={handleGenerateIdeas}
                >
                  Retry Generation
                </Button>
              </motion.div>
            )}

            {/* Empty view suggestion screen */}
            {generatedIdeas.length === 0 && !isLoading && !isOriginalMarkdown && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-border/80 rounded-3xl p-12 bg-card/40 flex flex-col items-center justify-center text-center space-y-4 shadow-inner min-h-[400px]"
              >
                <div className="h-12 w-12 rounded-2xl bg-muted border border-border/80 flex items-center justify-center text-muted-foreground">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-wider">No campaign calendar active</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Define client details on the left specs panel and fire up the Idea Engine to get 3-5 high-engagement daily templates.
                  </p>
                </div>
                
                {selectedClient && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-primary/5 border border-primary/20 text-xs font-bold text-primary flex items-center gap-2 max-w-md">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>Selected context: <strong>{selectedClient.name}</strong> will pre-shape generation targets!</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Render Fallback raw markdown */}
            {isOriginalMarkdown && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-border rounded-3xl bg-card p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b pb-3.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black uppercase text-foreground">Content blueprint stream</h3>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="rounded-xl flex items-center gap-1.5 text-xs font-bold"
                    onClick={() => {
                      navigator.clipboard.writeText(rawOutput);
                      setCopiedIndex(999);
                      setTimeout(() => setCopiedIndex(null), 2000);
                    }}
                  >
                    {copiedIndex === 999 ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy Raw Output
                      </>
                    )}
                  </Button>
                </div>
                <div className="prose prose-sm font-medium leading-relaxed max-w-none text-foreground prose-p:my-2 prose-ul:list-disc prose-ul:ml-4 markdown-body text-xs md:text-sm">
                  <ReactMarkdown>{rawOutput}</ReactMarkdown>
                </div>
              </motion.div>
            )}

            {/* Generated Polished Ideas Board Grid */}
            {generatedIdeas.length > 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-primary/5 border border-primary/20 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      4 dynamic high-virality ideas generated matching trend: <strong>"{selectedTrend}"</strong>
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-primary/10 rounded-full text-primary tracking-widest block">
                    Dynamic OS
                  </span>
                </div>

                {/* Ideas dynamic collection board */}
                <div className="grid gap-5 md:grid-cols-2">
                  {generatedIdeas.map((idea, index) => (
                    <Card 
                      key={index} 
                      className="border-border hover:border-primary/30 transition-all duration-200 hover:shadow-md bg-card shadow-sm flex flex-col justify-between overflow-hidden group"
                    >
                      {/* Card Day Header */}
                      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-6 px-2.5 flex items-center justify-center rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                            {idea.day}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[140px] font-medium italic">
                            Trend: {idea.trend}
                          </span>
                        </div>

                        {/* predicted Virality relevance bar */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-muted-foreground uppercase">Virality:</span>
                          <span className={cn(
                            "text-xs font-black",
                            idea.predictedRelevance > 85 ? "text-emerald-500" : "text-amber-500"
                          )}>
                            {idea.predictedRelevance}%
                          </span>
                        </div>
                      </div>

                      {/* Card Core Content */}
                      <div className="p-4 space-y-4 flex-grow">
                        {/* Format icon & Target tags */}
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center border border-border">
                            {getFormatIcon(idea.format)}
                          </div>
                          <span className="text-xs font-black text-foreground uppercase tracking-wide">
                            {idea.format} Idea
                          </span>
                        </div>

                        {/* The Hook Hook */}
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 relative overflow-hidden">
                          <span className="text-[8px] uppercase font-black text-primary/80 tracking-widest block mb-0.5">Scroll-Stopping Hook</span>
                          <p className="text-xs sm:text-sm font-black text-foreground leading-snug">
                            "{idea.hook}"
                          </p>
                        </div>

                        {/* The description overview */}
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Content Walkthrough</span>
                          <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                            {idea.description}
                          </p>
                        </div>

                        {/* Video setup / prompt format instructions */}
                        <div className="space-y-1.5 bg-muted/30 p-3 rounded-xl border border-border/40 text-xs text-muted-foreground leading-relaxed">
                          <div className="flex items-center gap-1 font-bold text-foreground text-[10px] uppercase tracking-wider mb-0.5">
                            <Eye className="h-3 w-3 text-primary" />
                            Visual Outline
                          </div>
                          {idea.visualDescription}
                        </div>

                        {/* Suggested dynamic trending Audio overlay */}
                        {idea.audioSuggestion && (
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 bg-emerald-50/40 border border-emerald-100 p-2.5 rounded-xl dark:bg-emerald-950/10 dark:border-emerald-900/40">
                            <Volume2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Audio suggestion: {idea.audioSuggestion}</span>
                          </div>
                        )}
                      </div>

                      {/* Card operational foot bar actions */}
                      <div className="p-3.5 border-t bg-muted/10 flex items-center justify-between gap-2">
                        {/* Copy specific hook to clipboard */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[11px] font-bold h-8 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg shrink-0 px-2"
                          onClick={() => copyToClipboard(`Hook: "${idea.hook}"\nFormat: ${idea.format}\n\nOutline: ${idea.description}`, index)}
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-green-500 mr-1" />
                              Copied Details
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 mr-1" />
                              Copy details
                            </>
                          )}
                        </Button>

                        {/* Save to context workspace in Firestore */}
                        <Button
                          size="sm"
                          variant={saveStatus[index] ? "ghost" : "outline"}
                          className={cn(
                            "text-[11px] font-bold h-8 rounded-lg px-2.5 shrink-0 transition-all",
                            saveStatus[index] 
                              ? "text-green-600 bg-green-50 dark:bg-green-950/20" 
                              : "border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-sm"
                          )}
                          onClick={() => saveToCampaignHistory(idea, index)}
                          disabled={saveStatus[index]}
                        >
                          {saveStatus[index] ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-green-500 mr-1" />
                              Saved context!
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Save to Campaign
                            </>
                          )}
                        </Button>
                      </div>

                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Persistent Save History logs list */}
          <div className="pt-6 border-t border-border mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-4.5 w-4.5 text-primary" />
                <h3 className="text-sm font-black uppercase text-foreground tracking-wider">Dynamic Saved Ideas Repository</h3>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground px-2 py-0.5 bg-muted rounded-md block border">
                {historyItems.length} Ideas Saved
              </span>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-10 space-y-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground pl-2">Loading idea sandbox database...</span>
              </div>
            ) : historyItems.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-2xl bg-muted/10 border-border/60">
                <HelpCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-foreground">Sandbox is empty</h4>
                <p className="text-[10px] text-muted-foreground max-w-[280px] mx-auto mt-0.5">
                  Save ideas generated above to keep them pinned securely for your client’s organic dashboards.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyItems.map((item) => (
                  <div 
                    key={item.id}
                    className="p-4 border border-border/80 bg-card rounded-2xl transition-all shadow-sm hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 overflow-hidden flex-grow mr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-foreground group-hover:text-primary">
                          {item.title}
                        </span>
                        {item.client && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-primary/10 rounded-full text-primary">
                            Client: {item.client}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 italic">
                        {item.content?.replace(/\*\*[^*]+\*\*/g, "").substring(0, 180)}...
                      </p>
                      <span className="text-[9px] font-medium text-muted-foreground block">
                        Saved on: {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[11px] font-bold h-8 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg px-2.5"
                        onClick={() => {
                          const clipboardText = `Title: ${item.title}\nClient: ${item.client}\nSaved details:\n${item.content}`;
                          navigator.clipboard.writeText(clipboardText);
                          setCopiedIndex(item.id);
                          setTimeout(() => setCopiedIndex(null), 2000);
                        }}
                      >
                        {copiedIndex === item.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-green-500 mr-1" />
                            Copied Details
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 mr-1" />
                            Copy Core Strategy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

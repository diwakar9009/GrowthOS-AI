import { useState, useEffect } from "react";
import { AIService } from "@/lib/gemini";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Input } from "./Input";
import { TrendingUp, Sparkles, Loader2, Search, Briefcase } from "lucide-react";
import { MOCK_TRENDS } from "@/constants";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, addDoc, query, orderBy, onSnapshot, handleFirestoreError, OperationType } from "@/lib/firebase";

export function Trends() {
  const { profile, user } = useAuth();
  const [niche, setNiche] = useState(profile?.niche || "");
  const [audience, setAudience] = useState("General");
  const [format, setFormat] = useState("Viral Content Ideas");
  const [client, setClient] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientVoice, setClientVoice] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<string | null>(null);
  const [keywordTopic, setKeywordTopic] = useState("");
  const [keywords, setKeywords] = useState<any[]>([]);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);

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

  const generateIdeas = async (trend: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const text = await AIService.generateContent(`Perform a professional deep-dive internet research and generate 5 viral content ideas for a ${niche || "general"} creator based on the trending topic: "${trend}".
        Target Audience: ${audience}
        Client/Project Context: ${client || "General"}
        Brand Voice/Tone: ${clientVoice || "Professional & Engaging"}
        Output Format: ${format}
        
        Using real-time search data, provide:
        - Video/Reel hook (tailored to audience)
        - Brief description
        - Why it's trending (use specific real-time data and search results)
        - Call to action (CTA)
        - Strategic insight on why this trend is relevant NOW.`, {
          model: "gemini-3.5-flash",
          useSearch: true
        });

      setIdeas(text);

      // Save to Firestore history
      try {
        await addDoc(collection(db, `users/${user.uid}/tasks`), {
          userId: user.uid,
          clientId: clientId || null,
          title: `Trend Idea: ${trend} ${client ? `(Client: ${client})` : ''}`,
          type: 'trend',
          client: client || 'General',
          content: text,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/tasks`);
      }

    } catch (error: any) {
      console.error("Error generating ideas:", error);
      setIdeas(error.message || "Failed to generate ideas. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateKeywords = async () => {
    if (!keywordTopic || !user) return;
    setIsGeneratingKeywords(true);
    try {
      const text = await AIService.generateContent(`As an SEO expert, perform professional search research and generate a list of 10-15 trending and high-volume keywords for the topic: "${keywordTopic}" in the ${niche || "general"} niche. 
        Target Audience: ${audience}
        Using real-time search data, format as JSON with an array of objects: { keyword: string, volume: string, difficulty: 'low' | 'medium' | 'high', trend: 'up' | 'down' | 'stable' }`, {
          model: "gemini-3.5-flash",
          useSearch: true
        });
      
      const result = JSON.parse(text || "[]");
      setKeywords(result);
    } catch (error) {
      console.error("Keyword generation failed:", error);
    } finally {
      setIsGeneratingKeywords(false);
    }
  };

  const handleClientChange = (val: string) => {
    if (val === "custom") {
      setClientId("");
      setClient("");
      setClientVoice("");
    } else {
      const selected = clients.find(c => c.id === val);
      if (selected) {
        setClientId(selected.id);
        setClient(selected.name);
        if (selected.niche) setNiche(selected.niche);
        if (selected.brandVoice) setClientVoice(selected.brandVoice);
      }
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Trend Assistant</h1>
        <p className="text-sm md:text-base text-muted-foreground">Find viral ideas for your client campaigns.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-primary/20 bg-primary/5 h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-xl">
                <Briefcase className="h-5 w-5 text-primary" />
                <span>Campaign Context</span>
              </CardTitle>
              <CardDescription>Get personalized trend ideas for your clients.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Client</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={clientId || (client ? "custom" : "")}
                  onChange={(e) => handleClientChange(e.target.value)}
                >
                  <option value="">Select a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="custom">+ Add Custom Name</option>
                </select>
              </div>

              {(clientId === "" && (client || clients.length === 0)) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client / Project</label>
                  <Input 
                    placeholder="e.g., Nike India" 
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Niche</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Enter niche..." 
                    className="pl-8"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Audience</label>
                <Input 
                  placeholder="e.g., Gen Z, Tech Enthusiasts" 
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Output Format</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <option>Viral Content Ideas</option>
                  <option>Short-form Video Script</option>
                  <option>Educational Thread</option>
                  <option>Marketing Campaign Concept</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Search className="h-4 w-4 text-primary" />
                <span>Keyword Generator</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input 
                placeholder="Enter topic for keywords..." 
                value={keywordTopic}
                onChange={(e) => setKeywordTopic(e.target.value)}
                className="text-xs"
              />
              <Button 
                size="sm" 
                className="w-full text-xs" 
                onClick={generateKeywords}
                disabled={isGeneratingKeywords || !keywordTopic}
              >
                {isGeneratingKeywords ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
                Generate Keywords
              </Button>
              
              {keywords.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  {keywords.map((kw, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] p-1.5 rounded bg-background border">
                      <span className="font-bold truncate max-w-[100px]">{kw.keyword}</span>
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          "px-1 rounded",
                          kw.difficulty === 'low' ? "bg-green-100 text-green-700" :
                          kw.difficulty === 'medium' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                        )}>
                          {kw.difficulty}
                        </span>
                        <span className="text-muted-foreground">{kw.volume}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="font-bold text-xs md:text-sm uppercase tracking-wider text-muted-foreground px-1">Current Trends</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {MOCK_TRENDS.map((trend, index) => (
                <motion.div
                  key={trend.keyword}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                    onClick={() => generateIdeas(trend.keyword)}
                  >
                    <CardContent className="p-3 md:p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                        <span className="text-xs md:text-sm font-bold truncate">{trend.keyword}</span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase shrink-0">{trend.platform}</span>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <Card className="lg:col-span-2 h-fit border-primary/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Content Ideas</CardTitle>
                <CardDescription>AI-generated ideas based on the selected trend.</CardDescription>
              </div>
              {ideas && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    navigator.clipboard.writeText(ideas);
                    alert("Copied to clipboard!");
                  }}
                  className="hidden sm:flex"
                >
                  Copy All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Analyzing trend and generating ideas...</p>
              </div>
            ) : ideas ? (
              <div className="prose prose-sm max-w-none dark:prose-invert max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                <ReactMarkdown>{ideas}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex h-[300px] flex-col items-center justify-center space-y-4 text-center text-muted-foreground">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <p>Select a trend from the list to see content ideas.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Input } from "./Input";
import { TrendingUp, Sparkles, Loader2, Search, Briefcase } from "lucide-react";
import { MOCK_TRENDS } from "@/constants";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, addDoc, query, orderBy, onSnapshot } from "@/lib/firebase";

export function Trends() {
  const { profile, user } = useAuth();
  const [niche, setNiche] = useState(profile?.niche || "");
  const [client, setClient] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientVoice, setClientVoice] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/clients`), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const generateIdeas = async (trend: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 5 viral content ideas for a ${niche || "general"} creator based on the trending topic: "${trend}".
        Client/Project Context: ${client || "General"}
        Brand Voice/Tone: ${clientVoice || "Professional & Engaging"}
        Include:
        - Video/Reel hook
        - Brief description
        - Why it's trending (use real-time data if possible)
        - Call to action (CTA)`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const text = response.text || "No response from AI.";
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
        console.error("Failed to save task:", e);
      }

    } catch (error) {
      console.error("Error generating ideas:", error);
      setIdeas("Failed to generate ideas. Please try again.");
    } finally {
      setLoading(false);
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
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Trend Assistant</h1>
        <p className="text-muted-foreground">Find viral ideas for your client campaigns.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Context</CardTitle>
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
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="font-semibold">Current Trends</h3>
            {MOCK_TRENDS.map((trend, index) => (
              <motion.div
                key={trend.keyword}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => generateIdeas(trend.keyword)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{trend.keyword}</span>
                    </div>
                    <span className="text-xs text-muted-foreground uppercase">{trend.platform}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Content Ideas</CardTitle>
            <CardDescription>AI-generated ideas based on the selected trend.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[300px] flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Analyzing trend and generating ideas...</p>
              </div>
            ) : ideas ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
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

import { useState, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Input, Textarea } from "./Input";
import { Sparkles, Copy, Check, Loader2, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, addDoc, handleFirestoreError, OperationType, query, orderBy, onSnapshot } from "@/lib/firebase";

export function AICaptionGenerator() {
  const { profile, user } = useAuth();
  const [topic, setTopic] = useState("");
  const [client, setClient] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientVoice, setClientVoice] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [niche, setNiche] = useState(profile?.niche || "");
  const [tone, setTone] = useState("Professional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/clients`), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const generateCaption = async () => {
    if (!topic || !user) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 3 creative social media captions and 15 relevant hashtags for the following:
        Topic: ${topic}
        Client/Project: ${client || "General"}
        Niche: ${niche}
        Brand Voice/Tone: ${clientVoice || tone}
        Audience: Indian (Include Hinglish variations where appropriate)
        
        Format the output clearly with:
        - Option 1 (English)
        - Option 2 (Hinglish/Casual)
        - Option 3 (Short & Punchy)
        - Hashtags (Categorized)`,
      });

      const text = response.text || "No response from AI.";
      setResult(text);

      // Save to Firestore history
      try {
        await addDoc(collection(db, `users/${user.uid}/tasks`), {
          userId: user.uid,
          clientId: clientId || null,
          title: `Caption: ${topic} ${client ? `(Client: ${client})` : ''}`,
          type: 'caption',
          client: client || 'General',
          content: text,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.error("Failed to save task:", e);
      }

    } catch (error) {
      console.error("Error generating caption:", error);
      setResult("Failed to generate caption. Please try again.");
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

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Caption Assistant</h1>
        <p className="text-muted-foreground">Manage your client campaigns with AI-powered content.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Organize your work by client or project.</CardDescription>
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
                <label className="text-sm font-medium">Client / Project Name</label>
                <Input 
                  placeholder="e.g., Nike India, Local Cafe" 
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Topic</label>
              <Input 
                placeholder="e.g., Fitness reel, New tech review" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Niche (Optional)</label>
              <Input 
                placeholder="e.g., Fitness, Tech, Food" 
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tone</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option>Professional</option>
                <option>Casual</option>
                <option>Funny</option>
                <option>Inspirational</option>
                <option>Hinglish (Mix)</option>
              </select>
            </div>
            <Button 
              className="w-full" 
              onClick={generateCaption}
              disabled={loading || !topic}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>AI Output</CardTitle>
              <CardDescription>Your generated captions and hashtags.</CardDescription>
            </div>
            {result && (
              <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex h-[300px] flex-col items-center justify-center space-y-4 text-center text-muted-foreground">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p>Fill in the details and click generate to see the magic.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

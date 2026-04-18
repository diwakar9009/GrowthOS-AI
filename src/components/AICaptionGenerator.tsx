import { useState, useEffect } from "react";
import { AIService } from "@/lib/gemini";
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
  const [audience, setAudience] = useState("Indian (Gen Z & Millennials)");
  const [format, setFormat] = useState("Standard Social Media Pack");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const generateCaption = async () => {
    if (!topic || !user) return;
    setLoading(true);
    try {
      const text = await AIService.generateContent(`As an expert Social Media Manager, generate high-engagement content for the following:
        Topic: ${topic}
        Client/Project: ${client || "General"}
        Niche: ${niche}
        Audience Demographics: ${audience}
        Brand Voice/Tone: ${clientVoice || tone}
        Desired Output Format: ${format}
        
        Please provide:
        1. 3 Creative Social Media Captions (tailored to the audience and niche)
        2. 15-20 Relevant Hashtags (Categorized: Broad, Niche, Community)
        3. 3 Content Hook Ideas for Reels/Shorts
        
        Format the output clearly using Markdown headers.`);

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
        handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/tasks`);
      }

    } catch (error: any) {
      console.error("Error generating caption:", error);
      setResult(error.message || "Failed to generate caption. Please try again.");
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
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          AI Caption Assistant
        </h1>
        <p className="text-sm md:text-base text-muted-foreground font-medium">
          Manage your client campaigns with AI-powered content.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-primary/20 bg-primary/5 h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <Briefcase className="h-5 w-5 text-primary" />
              <span>Campaign Details</span>
            </CardTitle>
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
              <label className="text-sm font-medium">Niche</label>
              <Input 
                placeholder="e.g., Fitness, Tech, Food" 
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Audience</label>
              <Input 
                placeholder="e.g., Gen Z, Tech Professionals" 
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
                <option>Standard Social Media Pack</option>
                <option>Instagram Carousel Script</option>
                <option>Short-form Video Script</option>
                <option>Thread-style Content</option>
                <option>Professional/LinkedIn Post</option>
              </select>
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

        <Card className="lg:col-span-2 h-fit border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-xl font-bold">AI Output</CardTitle>
              <CardDescription>Your generated captions and hashtags.</CardDescription>
            </div>
            {result && (
              <Button variant="ghost" size="icon" onClick={copyToClipboard} className="hover:bg-primary/10">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="prose prose-sm max-w-none dark:prose-invert max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
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

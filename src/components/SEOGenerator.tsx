import { useState, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Input, Textarea } from "./Input";
import { Sparkles, Copy, Check, Loader2, Search, TrendingUp, Hash, FileText, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, addDoc, query, orderBy, onSnapshot } from "@/lib/firebase";

export function SEOGenerator() {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("YouTube");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("Professional");
  const [format, setFormat] = useState("Standard SEO Pack");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateSEOContent = async () => {
    if (!topic || !user) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `As an expert Digital Marketing Executive, generate trending and SEO-friendly content for the following:
        Topic/Keywords: ${topic}
        Platform: ${platform}
        Target Audience: ${targetAudience || "General"}
        Tone: ${tone}
        Desired Output Format: ${format}
        
        Please provide:
        1. **5 Trending & SEO-Optimized Titles** (High CTR focus)
        2. **A Compelling Description** (Optimized for search algorithms and user engagement)
        3. **15-20 Trending Hashtags** (Categorized by reach: High, Medium, Niche)
        4. **Primary & Secondary Keywords** to include for better ranking
        
        Format the output clearly using Markdown with headers for each section.`,
      });

      const text = response.text || "No response from AI.";
      setResult(text);

      // Save to Firestore history
      try {
        await addDoc(collection(db, `users/${user.uid}/tasks`), {
          userId: user.uid,
          title: `SEO Gen: ${topic} (${platform})`,
          type: 'seo_generator',
          content: text,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.error("Failed to save task:", e);
      }

    } catch (error) {
      console.error("Error generating SEO content:", error);
      setResult("Failed to generate SEO content. Please try again.");
    } finally {
      setLoading(false);
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
    <div className="space-y-8 pb-12">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">SEO & Trending Generator</h1>
        <p className="text-muted-foreground">Generate high-ranking titles, descriptions, and hashtags for any platform.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Generator Settings</span>
            </CardTitle>
            <CardDescription>Configure your SEO parameters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Main Topic / Keywords</label>
              <Input 
                placeholder="e.g., Best AI Tools 2024, Digital Marketing Tips" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option>YouTube</option>
                <option>Blog / Article</option>
                <option>Instagram</option>
                <option>LinkedIn</option>
                <option>Twitter / X</option>
                <option>TikTok</option>
                <option>Facebook</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target Audience</label>
              <Input 
                placeholder="e.g., Small business owners, Tech enthusiasts" 
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Output Format</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option>Standard SEO Pack</option>
                <option>Blog Outline & Meta</option>
                <option>Social Media SEO Strategy</option>
                <option>E-commerce Product SEO</option>
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
                <option>Casual / Friendly</option>
                <option>Excited / High Energy</option>
                <option>Educational</option>
                <option>Witty / Humorous</option>
              </select>
            </div>

            <Button 
              className="w-full shadow-lg shadow-primary/20" 
              onClick={generateSEOContent}
              disabled={loading || !topic}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Trends...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate SEO Pack
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 hover:shadow-xl transition-all duration-500">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-primary" />
                <span>Optimized Results</span>
              </CardTitle>
              <CardDescription>Your trending titles, descriptions, and hashtags.</CardDescription>
            </div>
            {result && (
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex items-center space-x-2">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Copied!" : "Copy All"}</span>
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {result ? (
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-primary prose-strong:text-foreground">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex h-[400px] flex-col items-center justify-center space-y-6 text-center text-muted-foreground">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-primary/10 animate-pulse" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Sparkles className="h-8 w-8" />
                  </div>
                </div>
                <div className="max-w-xs space-y-2">
                  <p className="font-semibold text-foreground">Ready to rank?</p>
                  <p className="text-sm">Enter your topic and platform details to generate a complete SEO-optimized content pack.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm pt-4">
                  <div className="flex items-center space-x-2 text-xs bg-muted p-2 rounded-lg">
                    <Type className="h-3 w-3 text-primary" />
                    <span>High CTR Titles</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs bg-muted p-2 rounded-lg">
                    <FileText className="h-3 w-3 text-primary" />
                    <span>SEO Descriptions</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs bg-muted p-2 rounded-lg">
                    <Hash className="h-3 w-3 text-primary" />
                    <span>Trending Tags</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs bg-muted p-2 rounded-lg">
                    <Search className="h-3 w-3 text-primary" />
                    <span>Keyword Research</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SEO Tips Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span>Trend Alignment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our AI analyzes current search patterns to ensure your titles use high-velocity keywords that are currently trending in your niche.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center space-x-2">
              <Search className="h-4 w-4 text-emerald-600" />
              <span>Algorithm Focus</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Descriptions are structured to satisfy both human readers and search crawlers, balancing readability with keyword density.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/50 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center space-x-2">
              <Hash className="h-4 w-4 text-purple-600" />
              <span>Hashtag Strategy</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We provide a balanced mix of broad, medium, and niche hashtags to maximize your content's discoverability across social graphs.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

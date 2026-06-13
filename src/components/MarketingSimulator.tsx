import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { useToast } from "../lib/ToastContext";
import { db, collection, addDoc, query, onSnapshot } from "../lib/firebase";
import { AIService } from "../lib/gemini";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calculator, 
  Sparkles, 
  HelpCircle, 
  Coins, 
  MousePointerClick, 
  ShieldAlert, 
  CheckCircle2, 
  TrendingUp, 
  Plus, 
  Loader2, 
  ArrowRight,
  ChevronDown,
  Percent,
  TrendingDown,
  Info,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  Briefcase,
  Zap,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { cn } from "../lib/utils";
import ReactMarkdown from "react-markdown";

type PresetType = "ecommerce" | "b2bsaas" | "agency" | "local_business";

interface PresetConfig {
  name: string;
  cpm: number;
  ctr: number;
  landingCr: number;
  closeRate: number;
  aov: number;
  adSpend: number;
}

const PRESETS: Record<PresetType, PresetConfig> = {
  ecommerce: {
    name: "E-Commerce Brand",
    adSpend: 150000,
    cpm: 250,
    ctr: 2.1,
    landingCr: 8.5, // represents Add-to-Cart -> checkout initiation
    closeRate: 30,  // represents Purchase completion
    aov: 2499
  },
  b2bsaas: {
    name: "B2B SaaS / Lead Gen",
    adSpend: 250000,
    cpm: 800,
    ctr: 1.2,
    landingCr: 4.5, // standard demo request form CR
    closeRate: 15,  // sales demo to closed won contract
    aov: 15000
  },
  agency: {
    name: "Marketing Agency / Coaching",
    adSpend: 100000,
    cpm: 600,
    ctr: 1.5,
    landingCr: 6.0, // discovery application CR
    closeRate: 18,  // strategy call to high-ticket signed
    aov: 45000
  },
  local_business: {
    name: "Local Business / Services",
    adSpend: 40000,
    cpm: 150,
    ctr: 2.8,
    landingCr: 12.0, // call/direction clicks
    closeRate: 40,   // leads to scheduled service
    aov: 4500
  }
};

export function MarketingSimulator() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // Simulation parameters (with state initialized to default E-Commerce)
  const [activePreset, setActivePreset] = useState<PresetType>("ecommerce");
  const [adSpend, setAdSpend] = useState(PRESETS.ecommerce.adSpend);
  const [cpm, setCpm] = useState(PRESETS.ecommerce.cpm);
  const [ctr, setCtr] = useState(PRESETS.ecommerce.ctr);
  const [landingCr, setLandingCr] = useState(PRESETS.ecommerce.landingCr);
  const [closeRate, setCloseRate] = useState(PRESETS.ecommerce.closeRate);
  const [aov, setAov] = useState(PRESETS.ecommerce.aov);

  // AI & Diagnosis States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatedAudit, setGeneratedAudit] = useState<string | null>(null);
  const [activeBottleneck, setActiveBottleneck] = useState<"CTR" | "CONVERSION" | "CLOSING" | "HEALTHY">("HEALTHY");

  // Fetch users' clients to tie campaign task exports directly
  useEffect(() => {
    if (!user) return;
    const q = collection(db, `users/${user.uid}/clients`);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsData);
      if (clientsData.length > 0) {
        setSelectedClientId(clientsData[0].id);
      }
    }, (error) => {
      console.error("Clients listing failure inside Simulator:", error);
    });
    return unsubscribe;
  }, [user]);

  // Handle Preset Switching
  const handlePresetChange = (presetName: PresetType) => {
    setActivePreset(presetName);
    const config = PRESETS[presetName];
    setAdSpend(config.adSpend);
    setCpm(config.cpm);
    setCtr(config.ctr);
    setLandingCr(config.landingCr);
    setCloseRate(config.closeRate);
    setAov(config.aov);
    setGeneratedAudit(null);
    setAiError(null);
  };

  // Funnel calculations derived on the fly
  const impressions = Math.round(adSpend / (cpm / 1000));
  const clicks = Math.round(impressions * (ctr / 100));
  const leads = Math.round(clicks * (landingCr / 100));
  const customers = Math.round(leads * (closeRate / 100));
  
  const totalRevenue = customers * aov;
  const netProfit = totalRevenue - adSpend;
  const roas = adSpend > 0 ? Number((totalRevenue / adSpend).toFixed(2)) : 0;
  const roi = adSpend > 0 ? Math.round((netProfit / adSpend) * 100) : 0;
  const cac = customers > 0 ? Math.round(adSpend / customers) : 0;
  const cpc = clicks > 0 ? Number((adSpend / clicks).toFixed(2)) : 0;
  const cpl = leads > 0 ? Number((adSpend / leads).toFixed(2)) : 0;

  // Track the primary bottleneck based on benchmarks
  useEffect(() => {
    if (ctr < 1.4) {
      setActiveBottleneck("CTR");
    } else if (landingCr < 4.5) {
      setActiveBottleneck("CONVERSION");
    } else if (closeRate < 15) {
      setActiveBottleneck("CLOSING");
    } else {
      setActiveBottleneck("HEALTHY");
    }
  }, [ctr, landingCr, closeRate]);

  // AI assistant recommendations using Gemini for custom Diagnostic
  const handleGenerateAIDiagnostic = async () => {
    if (!user) return;
    setAiLoading(true);
    setGeneratedAudit(null);
    setAiError(null);

    const clientObj = clients.find(c => c.id === selectedClientId);
    const clientNameStr = clientObj ? clientObj.name : "Target Audience";

    const scenarioText = `
      - Campaign Type Preset: ${PRESETS[activePreset].name}
      - Target Client: ${clientNameStr}
      - Total Planned Ad Budget: ₹${adSpend.toLocaleString()}
      - Current Funnel Settings:
        * CPM: ₹${cpm} (Cost per 1k impressions)
        * CTR: ${ctr}%
        * Landing Page CR: ${landingCr}%
        * Lead-to-Sale Close Rate: ${closeRate}%
        * Customer Average Value (AOV): ₹${aov.toLocaleString()}
      - Calculated Funnel Output Metrics:
        * Total Impressions: ${impressions.toLocaleString()}
        * Total Clicks generated: ${clicks.toLocaleString()} (Cost Per Click: ₹${cpc})
        * Leads acquired: ${leads.toLocaleString()} (Cost Per Lead: ₹${cpl})
        * Signed/Closed Customers: ${customers.toLocaleString()}
        * Estimated Customer Acquisition Cost (CAC): ₹${cac.toLocaleString()}
        * Projected Revenue: ₹${totalRevenue.toLocaleString()}
        * Projected ROAS: ${roas}x / Net Profit: ₹${netProfit.toLocaleString()}
    `;

    const systemInstruction = `You are an elite Digital Growth CMO & Conversion System Expert with years of performance counseling. 
      You analyze user performance metric funnels and produce structured copywriting blueprints and technical optimizations.
      Your responses MUST be professional, extremely precise, and actionable for execution. Do not use generic filler words.`;

    const promptText = `
      Perform a professional digital marketing audit and construct a bespoke visual growth playbook for: ${clientNameStr}.
      Here is the campaign metrics forecast:
      ${scenarioText}

      Primary Diagnostic focus: ${activeBottleneck === "CTR" 
        ? "LOW HOOK AND CTR PERFORMANCE (Traffic Acquisition Bottleneck)" 
        : activeBottleneck === "CONVERSION" 
        ? "LOW LANDING PAGE CONVERSION (On-Page Intent Bottleneck)" 
        : activeBottleneck === "CLOSING" 
        ? "LOW SALES CLOSE AND NURTURE (Closing Velocity Bottleneck)" 
        : "HEALTHY INTEGRATED SCALE RUN (Scaling / Optimization Benchmarks)"}

      Provide your strategic output in markdown with the following three distinct sections:

      ### 1. Growth Audit & Funnel diagnostic
      Provide a scientific breakdown of why this metric constraint exists. Contrast current numbers (e.g. CTR of ${ctr}%) to industry standard requirements. Reference specific metrics like the projected CPA/CAC (₹${cac}) and CPC (₹${cpc}) to prove where marketing efficiency is bleeding.

      ### 2. High-Impact Action Playbook
      Deliver exact, highly polished, copywriter-grade output scripts:
      - If CTR constraint: Write 3 thumb-stopping text ad-creative hooks (Meta/Google Ad structures) using psychological frameworks like "AIDA" or "Anger/Curiosity loops".
      - If LANDING PAGE constraint: Design an on-page structural layout checklist and write a persuasive "Hero Header & Value Proposition" script.
      - If SALES CLOSE/CLOSING constraint: Draft a 3-step high-intent automated lead nurture email snippet or high-converting callback sales script.

      ### 3. Immediate Implementation Tasks
      List exactly 3 specific, actionable tasks (one sentence each) that the user can immediately set working on. Format these as a bullet count block. Example:
      * Task 1: [Specific copy action]
      * Task 2: [Specific landing page/tech testing step]
      * Task 3: [Targeting, budget or tracking code adjustment]
    `;

    try {
      const text = await AIService.generateContent(promptText, {
        model: "gemini-3.5-flash",
        systemInstruction
      });
      setGeneratedAudit(text);
      showToast("Diagnostic generated! High-converting marketing handbook is now ready.", "success");
    } catch (err: any) {
      console.error("Simulation AI tool failed:", err);
      setAiError(err.message || "The Gemini engine is temporarily busy. Please retry in a few seconds.");
    } finally {
      setAiLoading(false);
    }
  };

  // Direct promotional action: Write generated Tasks straight to the user's CRM Campaigns as active tasks!
  const promoteToActiveCampaign = async () => {
    if (!user || !generatedAudit) return;
    
    // Parse individual bullet task lines from the AI output markdown.
    const taskKeywords = ["Task 1:", "Task 2:", "Task 3:", "1.", "2.", "3.", "*"];
    const lines = generatedAudit.split("\n");
    const tasksFound: string[] = [];

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if ((cleanLine.startsWith("*") || cleanLine.match(/^\d+\./)) && cleanLine.length > 25) {
        // Strip out bullet indicators or Task prefix numbers
        const stripped = cleanLine.replace(/^[*\s\d.]+/, "").replace(/^Task\s*\d+\s*:\s*/i, "").trim();
        if (stripped) {
          tasksFound.push(stripped);
        }
      }
    });

    const defaultTasks = [
      `Implement conversion-rate optimized copywriting hooks in visual creative assets for ${PRESETS[activePreset].name}.`,
      `Set up tracking scripts, verify heatmaps on landing page landing nodes, and benchmark mobile load-speed.`,
      `Configure custom audience filters, segment ad budgeting, and structure automated lead qualification pipelines.`
    ];

    const finalTasksToSave = tasksFound.length >= 3 ? tasksFound.slice(0, 3) : defaultTasks;
    
    try {
      const clientObj = clients.find(c => c.id === selectedClientId);
      const clientName = clientObj ? clientObj.name : "All Accounts";

      // Write each to the users' projects collection
      for (const taskText of finalTasksToSave) {
        await addDoc(collection(db, `users/${user.uid}/projects`), {
          userId: user.uid,
          clientId: selectedClientId || null,
          title: `Simulator Recommendation: ${taskText.substring(0, 48)}...`,
          description: `Generated campaign task during Funnel ROI Simulation.\n\nInsight recommendation Context:\n${taskText}\n\nFunnel config used: CPM: ₹${cpm}, CTR: ${ctr}%, CR: ${landingCr}%, Close: ${closeRate}%`,
          status: "todo",
          priority: "high",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week buffer
          createdAt: new Date().toISOString()
        });
      }

      // Add audit file to history/tasks
      await addDoc(collection(db, `users/${user.uid}/tasks`), {
        userId: user.uid,
        title: `ROI Simulator Playbook - ${clientName}`,
        type: "tool",
        content: generatedAudit,
        createdAt: new Date().toISOString()
      });

      showToast(`Campaign Saved: Added ${finalTasksToSave.length} optimized strategic cards inside your Project board successfully!`, "success");
    } catch (err: any) {
      console.error("Promoting campaign failed:", err);
      showToast("Failed to write projects to database. Please check Firestore status.", "error");
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Growth Funnel &amp; ROI Simulator
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Plan budgets, diagnose growth blocks, and generate direct copywriting cures with world-class AI diagnostics.
          </p>
        </div>

        {/* Preset selections */}
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(PRESETS) as PresetType[]).map((key) => (
            <button
              key={key}
              onClick={() => handlePresetChange(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all select-none hover:bg-secondary cursor-pointer ${
                activePreset === key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-foreground"
              }`}
            >
              {PRESETS[key].name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Side: Dynamic sliders input configuration panel */}
        <Card className="lg:col-span-4 border-primary/10 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-primary" />
              Funnel Parameters
            </CardTitle>
            <CardDescription className="text-xs">
              Interact with critical sliders for campaign projections.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Ad Spend */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">AD SPEND (BUDGET)</span>
                <span className="text-foreground text-sm font-mono font-bold">₹{adSpend.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="1000000"
                step="5000"
                value={adSpend}
                onChange={(e) => { setAdSpend(Number(e.target.value)); setGeneratedAudit(null); }}
                className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>₹5,000</span>
                <span>₹10,00,000</span>
              </div>
            </div>

            {/* CPM */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">CPM (COST PER 1K IMP)</span>
                <span className="text-foreground text-sm font-mono">₹{cpm}</span>
              </div>
              <input
                type="range"
                min="30"
                max="2500"
                step="10"
                value={cpm}
                onChange={(e) => { setCpm(Number(e.target.value)); setGeneratedAudit(null); }}
                className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>₹30</span>
                <span>₹2,500</span>
              </div>
            </div>

            {/* CTR */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground flex items-center gap-1">
                  CTR (CLICK-THROUGH RATE)
                  <span className={`h-2 w-2 rounded-full ${ctr < 1.4 ? "bg-rose-500" : "bg-emerald-500"}`} />
                </span>
                <span className={`text-sm font-mono font-bold ${ctr < 1.4 ? "text-rose-600" : "text-emerald-600"}`}>{ctr}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="8.0"
                step="0.05"
                value={ctr}
                onChange={(e) => { setCtr(Number(e.target.value)); setGeneratedAudit(null); }}
                className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>0.1% (Low)</span>
                <span>8.0% (Excellent)</span>
              </div>
            </div>

            {/* Landing Page CR */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground flex items-center gap-1">
                  CONVERSION RATE (LP CR)
                  <span className={`h-2 w-2 rounded-full ${landingCr < 4.5 ? "bg-amber-500" : "bg-emerald-500"}`} />
                </span>
                <span className={`text-sm font-mono font-bold ${landingCr < 4.5 ? "text-amber-600" : "text-emerald-600"}`}>{landingCr}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="25.0"
                step="0.1"
                value={landingCr}
                onChange={(e) => { setLandingCr(Number(e.target.value)); setGeneratedAudit(null); }}
                className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>0.5% (Cold)</span>
                <span>25.0% (Viral)</span>
              </div>
            </div>

            {/* Close Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground flex items-center gap-1">
                  OFFER CLOSE RATE
                  <span className={`h-2 w-2 rounded-full ${closeRate < 15 ? "bg-amber-500" : "bg-emerald-500"}`} />
                </span>
                <span className={`text-sm font-mono font-bold ${closeRate < 15 ? "text-amber-600" : "text-emerald-600"}`}>{closeRate}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={closeRate}
                onChange={(e) => { setCloseRate(Number(e.target.value)); setGeneratedAudit(null); }}
                className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>1% (Low Fit)</span>
                <span>60% (High Trust)</span>
              </div>
            </div>

            {/* AOV */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">AVG ORDER VALUE (AOV)</span>
                <span className="text-foreground text-sm font-mono">₹{aov.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="100"
                max="100000"
                step="500"
                value={aov}
                onChange={(e) => { setAov(Number(e.target.value)); setGeneratedAudit(null); }}
                className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>₹100</span>
                <span>₹1,00,000</span>
              </div>
            </div>

            {/* Select Client to Bind */}
            <div className="space-y-2 pt-2 border-t">
              <label className="text-xs font-extrabold uppercase text-muted-foreground flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-primary" /> Bind and Save to Client
              </label>
              {clients.length === 0 ? (
                <p className="text-[10px] text-amber-500 font-semibold italic">Onboard clients inside the Client manager page to lock customized tasks!</p>
              ) : (
                <select
                  value={selectedClientId}
                  onChange={(e) => { setSelectedClientId(e.target.value); setGeneratedAudit(null); }}
                  className="w-full bg-muted border-none rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Projections, benchmarks, funnel chart, AI diagnostics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main output indicators grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-4 text-center">
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase">Revenue</p>
                <p className="text-lg md:text-xl font-bold font-mono text-primary mt-1">₹{totalRevenue.toLocaleString()}</p>
                <span className="text-[9px] text-muted-foreground italic tracking-tight font-medium">projected gross</span>
              </CardContent>
            </Card>

            <Card className={cn("border-none", netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-rose-50 dark:bg-rose-950/20")}>
              <CardContent className="p-4 text-center">
                <p className={`text-[10px] font-extrabold uppercase ${netProfit >= 0 ? "text-emerald-800 dark:text-emerald-400" : "text-rose-800 dark:text-rose-400"}`}>Profit</p>
                <p className={`text-lg md:text-xl font-bold font-mono mt-1 ${netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {netProfit >= 0 ? "+" : ""}₹{netProfit.toLocaleString()}
                </p>
                <span className="text-[9px] text-muted-foreground italic font-medium">after ad spend</span>
              </CardContent>
            </Card>

            <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-100">
              <CardContent className="p-4 text-center">
                <p className="text-[10px] font-extrabold text-blue-900 dark:text-blue-300 uppercase">ROAS (REVENUE/SPEND)</p>
                <p className="text-lg md:text-xl font-bold font-mono text-blue-800 dark:text-blue-400 mt-1">{roas}x</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${roas >= 2.5 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {roas >= 2.5 ? "High ROI" : "Requires Optim."}
                </span>
              </CardContent>
            </Card>

            <Card className="bg-purple-50/50 dark:bg-purple-950/10 border-purple-100">
              <CardContent className="p-4 text-center">
                <p className="text-[10px] font-extrabold text-purple-900 dark:text-purple-300 uppercase">CAC (COST TO ACQUIRE)</p>
                <p className="text-lg md:text-xl font-bold font-mono text-purple-800 dark:text-purple-400 mt-1">₹{cac.toLocaleString()}</p>
                <span className="text-[9px] text-muted-foreground font-medium">vs AOV of ₹{aov.toLocaleString()}</span>
              </CardContent>
            </Card>
          </div>

          {/* Visual Funnel Segment displaying the conversion drop rate */}
          <Card className="border-primary/10 bg-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground flex items-center justify-between">
                <span>Conversion Stream breakdown &amp; benchmarks</span>
                <span className="text-[10px] flex items-center gap-1 font-bold text-primary">
                  <Percent className="h-3.5 w-3.5" /> Total Pipeline Efficiency: {Number(((customers / impressions) * 100).toFixed(4))}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3.5">
                {/* 1. Impressions */}
                <div className="relative">
                  <div className="flex items-center justify-between text-xs font-bold pb-1 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5 text-muted-foreground" /> 1. Impressions (Ad Viewers Nodes)
                    </span>
                    <span className="font-mono text-foreground">{impressions.toLocaleString()} reach</span>
                  </div>
                  <div className="h-8 w-full bg-muted/60 dark:bg-white/5 rounded-xl overflow-hidden flex items-center px-4 relative">
                    <div className="absolute top-0 left-0 bottom-0 bg-primary/20 dark:bg-primary/30 w-full transition-all duration-300" />
                    <span className="relative text-xs font-extrabold text-primary select-none">Top of Funnel (Brand Reach)</span>
                  </div>
                </div>

                {/* Drop rate spacer 1 */}
                <div className="flex items-center justify-between text-[11px] px-6 text-muted-foreground font-mono">
                  <span>Ad CTR drop link</span>
                  <span className={`flex items-center font-bold px-2 py-0.5 rounded-lg ${ctr < 1.4 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {ctr < 1.4 ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                    {ctr}% Conversion Click Rate (CPC: ₹{cpc})
                  </span>
                </div>

                {/* 2. Clicks */}
                <div className="relative">
                  <div className="flex items-center justify-between text-xs font-bold pb-1 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MousePointerClick className="h-3.5 w-3.5 text-blue-500" /> 2. Paid Clicks (Site Visitors)
                    </span>
                    <span className="font-mono text-foreground">{clicks.toLocaleString()} sessions</span>
                  </div>
                  <div className="h-8 w-full bg-muted/60 dark:bg-white/5 rounded-xl overflow-hidden flex items-center px-4 relative">
                    <div 
                      className="absolute top-0 left-0 bottom-0 bg-blue-500/20 dark:bg-blue-500/30 transition-all duration-300"
                      style={{ width: `${Math.max(15, Math.min(100, (clicks / impressions) * 2000))}%` }}
                    />
                    <span className="relative text-xs font-extrabold text-blue-700 dark:text-blue-300 select-none">Mid Funnel (Active Traffic)</span>
                  </div>
                </div>

                {/* Drop rate spacer 2 */}
                <div className="flex items-center justify-between text-[11px] px-6 text-muted-foreground font-mono font-medium">
                  <span>Landing Page node bounce</span>
                  <span className={`flex items-center font-bold px-2 py-0.5 rounded-lg ${landingCr < 4.5 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                    {landingCr < 4.5 ? <AlertTriangle className="h-3 w-3 mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {landingCr}% Onboard Rate (CPL: ₹{cpl})
                  </span>
                </div>

                {/* 3. Leads */}
                <div className="relative">
                  <div className="flex items-center justify-between text-xs font-bold pb-1 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-purple-500" /> 3. Marketing Qualified Leads (Prospects)
                    </span>
                    <span className="font-mono text-foreground">{leads.toLocaleString()} signups</span>
                  </div>
                  <div className="h-8 w-full bg-muted/60 dark:bg-white/5 rounded-xl overflow-hidden flex items-center px-4 relative">
                    <div 
                      className="absolute top-0 left-0 bottom-0 bg-purple-500/20 dark:bg-purple-500/30 transition-all duration-300"
                      style={{ width: `${Math.max(10, Math.min(100, (leads / clicks) * 500))}%` }}
                    />
                    <span className="relative text-xs font-extrabold text-purple-700 dark:text-purple-300 select-none">Warm Nurture Loop</span>
                  </div>
                </div>

                {/* Drop rate spacer 3 */}
                <div className="flex items-center justify-between text-[11px] px-6 text-muted-foreground font-mono">
                  <span>Sales pitch closing speed</span>
                  <span className="flex items-center font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-lg">
                    {closeRate}% Offer Close Rate (CAC: ₹{cac})
                  </span>
                </div>

                {/* 4. Signed Customers */}
                <div className="relative">
                  <div className="flex items-center justify-between text-xs font-bold pb-1 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 4. Customers onboarded / Purchased
                    </span>
                    <span className="font-mono text-foreground">{customers.toLocaleString()} sales</span>
                  </div>
                  <div className="h-8 w-full bg-muted/60 dark:bg-white/5 rounded-xl overflow-hidden flex items-center px-4 relative">
                    <div 
                      className="absolute top-0 left-0 bottom-0 bg-emerald-500/20 dark:bg-emerald-500/30 transition-all duration-300"
                      style={{ width: `${Math.max(6, Math.min(100, (customers / leads) * 300))}%` }}
                    />
                    <span className="relative text-xs font-extrabold text-emerald-700 dark:text-emerald-300 select-none">Bottom of Funnel (Closed Deals)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diagnostic & Smart Strategy Box */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background shadow-md overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse shrink-0" />
                  AI growth diagnostic &amp; actions
                </CardTitle>
                <CardDescription className="text-xs">
                  Runs professional evaluations of your funnel metrics using Google Gemini models.
                </CardDescription>
              </div>

              {/* Dynamic bottleneck alert tag */}
              <div className="text-[10px] font-extrabold tracking-wide uppercase px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 animate-pulse">
                {activeBottleneck === "CTR" ? (
                  <span>⚠️ Bottleneck: Low Click CTR</span>
                ) : activeBottleneck === "CONVERSION" ? (
                  <span>⚠️ Bottleneck: Low On-Page CR</span>
                ) : activeBottleneck === "CLOSING" ? (
                  <span>⚠️ Bottleneck: Sales Closing velocity</span>
                ) : (
                  <span>⭐ Status: Healthy Funnel</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Context notification about what we'd fix */}
              <div className="p-3.5 bg-muted/40 rounded-xl space-y-1">
                <p className="text-xs font-bold text-foreground">
                  {activeBottleneck === "CTR" ? (
                    "Acquisition Threat Detected: User attention is leaking."
                  ) : activeBottleneck === "CONVERSION" ? (
                    "Value Statement Threat: High traffic bounce rates."
                  ) : activeBottleneck === "CLOSING" ? (
                    "SDR Engagement Threat: Leads are stagnating in nurture loop."
                  ) : (
                    "No critical bottlenecks! Core structure is performing at optimal thresholds."
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {activeBottleneck === "CTR" 
                    ? "Your CTR of " + ctr + "% degrades CPC. Users aren't finding the ad visual attractive, or the hooks fail to trigger instant urgency. Generating highly clickable copy cure will lower CPM CPC leaks."
                    : activeBottleneck === "CONVERSION" 
                    ? "Landing page Conversion of " + landingCr + "% indicates an offer mismatch. Users arrive on key nodes but lack clear incentives to share data. Fixing headline propositions and removing mobile noise raises CR."
                    : activeBottleneck === "CLOSING" 
                    ? "Customer Closing rate of " + closeRate + "% requires structured sales cadences. Leads may be cold or lack clear booking instructions. Writing Objections Playbooks and onboarding sequence solves this."
                    : "Funnel elements align harmoniously. We recommend analyzing higher budget scaling, run technical checks to confirm structural stability, and launch multiple custom audience variations."
                  }
                </p>
              </div>

              {/* Diagnostic generation buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1.5 justify-end">
                <Button 
                  onClick={handleGenerateAIDiagnostic}
                  disabled={aiLoading}
                  className="flex-1 sm:max-w-xs transition-transform hover:scale-102 font-bold shadow bg-primary"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Doing Deep Marketing Audit...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-1.5" /> Diagnose &amp; Write Playbook
                    </>
                  )}
                </Button>
              </div>

              {/* Render dynamic AI analysis results */}
              {aiError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{aiError}</span>
                </div>
              )}

              <AnimatePresence>
                {generatedAudit && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="border-t pt-5 space-y-4"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#10b981] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                        🎯 Active Playbook generated
                      </h4>

                      {/* Prompts user to sync marketing cards straight to core DB Workspace! */}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={promoteToActiveCampaign}
                        className="text-xs font-extrabold border-[#10b981] text-[#059669] hover:bg-emerald-50 bg-white"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Promote Playbook to Campaign Task List
                      </Button>
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground border rounded-xl p-4 md:p-5 bg-card overflow-y-auto max-h-[380px] custom-scrollbar text-xs leading-relaxed space-y-4 font-medium select-text shadow-inner">
                      <ReactMarkdown>{generatedAudit}</ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

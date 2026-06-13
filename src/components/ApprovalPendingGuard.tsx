import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Lock, Sparkles, ArrowRight, ShieldAlert, LayoutGrid, Key, Info } from "lucide-react";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Input } from "./Input";
import { motion } from "motion/react";

interface GuardProps {
  children: React.ReactNode;
}

export function ApprovalPendingGuard({ children }: GuardProps) {
  const { isApproved, profile } = useAuth();
  const [customKey, setCustomKey] = useState(() => localStorage.getItem("growthos_user_gemini_api_key") || "");
  const [hasCustomKey, setHasCustomKey] = useState(() => !!localStorage.getItem("growthos_user_gemini_api_key"));
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState("");

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = keyInput.trim();
    if (!trimmed) {
      setError("Please enter a valid API Key.");
      return;
    }

    if (!trimmed.startsWith("AIzaSy")) {
      setError("Gemini API Keys typically start with 'AIzaSy'. Please verify your key.");
      return;
    }

    try {
      localStorage.setItem("growthos_user_gemini_api_key", trimmed);
      setCustomKey(trimmed);
      setHasCustomKey(true);
    } catch (err) {
      setError("Failed to save the key to your browser storage.");
    }
  };

  if (isApproved || hasCustomKey) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-8 animate-fade-in">
      <Card className="w-full max-w-lg border-amber-500/20 bg-card shadow-2xl relative overflow-hidden">
        {/* Subtle glowing accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600" />
        
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4 animate-bounce">
            <Lock className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-foreground flex items-center justify-center gap-2">
            AI Access Approvals Pending
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1 text-sm">
            Verification required to activate AI Studio features.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-4 px-6 md:px-8">
          <div className="rounded-xl bg-orange-500/10 p-4 border border-orange-500/20 text-sm text-foreground space-y-3 leading-relaxed">
            <h4 className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Lock className="h-3.5 w-3.5" /> Admin Approval Pending
            </h4>
            <p className="text-xs text-muted-foreground">
              Suno {profile?.displayName || "Creator"}, GrowthOS AI features (jaise AI Copywriter, Assistant, Suggestion Engine, Trends tools) ko safe aur secure rakhne ke liye naye accounts ko administrator ke manual approval ki zaroorat hoti hai.
            </p>
            <p className="text-muted-foreground text-[11px] border-t border-orange-500/10 pt-2.5">
              To verify and unlock: Please ask the site admin <strong className="text-foreground">diwakarvishwakarma9009@gmail.com</strong> or wait while your registration is being approved.
            </p>
          </div>

          {/* Quick unlock via custom API key */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <Key className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Or Unlock Instantly (Apna API Key use karein)</h4>
                <p className="text-xs text-muted-foreground">Apna Gemini API Key enter karke saare AI features bina admin approval ke unlock karein!</p>
              </div>
            </div>

            <form onSubmit={handleSaveKey} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste your Gemini API Key (starts with AIzaSy...)"
                  className="flex-1 h-9 text-xs bg-background"
                />
                <Button type="submit" size="sm" className="h-9 px-4 font-bold">
                  Unlock
                </Button>
              </div>
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-foreground/5 mt-1">
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" /> Get a Free Gemini Key from Google AI Studio
                </a>
              </div>
            </form>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-muted-foreground mt-4">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>Baki tools jaise Projects management, Client tracking, Calendar aur Invoicing open hain!</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>Approval status changes instantly; no need to refresh.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-muted/50">
            <Link to="/" className="w-full">
              <Button className="w-full h-10 font-bold flex items-center justify-center gap-2" variant="outline">
                <LayoutGrid className="h-4 w-4" />
                Return to Dashboard
              </Button>
            </Link>
            
            <a 
              href={`mailto:diwakarvishwakarma9009@gmail.com?subject=GrowthOS AI Access Request for ${profile?.email || ""}`}
              className="w-full"
            >
              <Button className="w-full h-10 font-bold flex items-center justify-center gap-2">
                Ask Admin for Approval
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

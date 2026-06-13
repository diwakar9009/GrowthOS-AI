/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { AICaptionGenerator } from "./components/AICaptionGenerator";
import { ContentIdeaGenerator } from "./components/ContentIdeaGenerator";
import { Trends } from "./components/Trends";
import { Analytics } from "./components/Analytics";
import { ContentOptimizer } from "./components/ContentOptimizer";
import { SEOGenerator } from "./components/SEOGenerator";
import { Clients } from "./components/Clients";
import { Calendar } from "./components/Calendar";
import { Tools } from "./components/Tools";
import { SuiteHub } from "./components/SuiteHub";
import { MarketingSimulator } from "./components/MarketingSimulator";
import { Profile } from "./components/Profile";
import { Projects } from "./components/Projects";
import { Assets } from "./components/Assets";
import { Invoices } from "./components/Invoices";
import { Team } from "./components/Team";
import { BrandKit } from "./components/BrandKit";
import { ClientPortal } from "./components/ClientPortal";
import { ReportBuilder } from "./components/ReportBuilder";
import { LandingPage } from "./components/LandingPage";
import { AIAssistant } from "./components/AIAssistant";
import { AdminUsers } from "./components/AdminUsers";
import { ApprovalPendingGuard } from "./components/ApprovalPendingGuard";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { ThemeProvider } from "./lib/ThemeContext";
import { ToastProvider } from "./lib/ToastContext";
import { auth, googleProvider, signInWithPopup } from "./lib/firebase";
import { Loader2, Flame } from "lucide-react";
import { motion } from "motion/react";

function AppContent() {
  const { user, loading } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed:", error);
      const isUnauthorizedDomain = error.code === "auth/unauthorized-domain" || 
                                   error.message?.includes("auth/unauthorized-domain") ||
                                   error.message?.includes("unauthorized-domain");
      
      if (isUnauthorizedDomain) {
        const currentDomain = window.location.hostname;
        setLoginError(`Domain Unauthorized: Please add "${currentDomain}" to 'Authorized Domains' in your Firebase Console (Authentication > Settings).`);
      } else if (error.code === "auth/popup-blocked") {
        setLoginError("Login popup was blocked by your browser.");
      } else {
        setLoginError(error.message || "Login failed. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Flame className="h-10 w-10 animate-pulse" />
          </div>
          <div className="flex flex-col items-center space-y-2">
            <h2 className="text-xl font-bold tracking-tight">GrowthOS AI</h2>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs font-medium">Initializing Command Center...</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={handleLogin} error={loginError} />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/ai-content" element={<ApprovalPendingGuard><AICaptionGenerator /></ApprovalPendingGuard>} />
          <Route path="/idea-generator" element={<ApprovalPendingGuard><ContentIdeaGenerator /></ApprovalPendingGuard>} />
          <Route path="/trends" element={<ApprovalPendingGuard><Trends /></ApprovalPendingGuard>} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/content-seo" element={<ApprovalPendingGuard><ContentOptimizer /></ApprovalPendingGuard>} />
          <Route path="/seo-generator" element={<ApprovalPendingGuard><SEOGenerator /></ApprovalPendingGuard>} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/team" element={<Team />} />
          <Route path="/brand-kit" element={<BrandKit />} />
          <Route path="/reports" element={<ReportBuilder />} />
          <Route path="/portal/:clientId" element={<ClientPortal />} />
          <Route path="/tools" element={<ApprovalPendingGuard><Tools /></ApprovalPendingGuard>} />
          <Route path="/suite-hub" element={<ApprovalPendingGuard><SuiteHub /></ApprovalPendingGuard>} />
          <Route path="/simulator" element={<ApprovalPendingGuard><MarketingSimulator /></ApprovalPendingGuard>} />
          <Route path="/assistant" element={<ApprovalPendingGuard><AIAssistant /></ApprovalPendingGuard>} />
          <Route path="/admin-users" element={<AdminUsers />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

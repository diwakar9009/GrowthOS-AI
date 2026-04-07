/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { AICaptionGenerator } from "./components/AICaptionGenerator";
import { Trends } from "./components/Trends";
import { Analytics } from "./components/Analytics";
import { ContentOptimizer } from "./components/ContentOptimizer";
import { SEOGenerator } from "./components/SEOGenerator";
import { Clients } from "./components/Clients";
import { Calendar } from "./components/Calendar";
import { Tools } from "./components/Tools";
import { Profile } from "./components/Profile";
import { Projects } from "./components/Projects";
import { Assets } from "./components/Assets";
import { Invoices } from "./components/Invoices";
import { Team } from "./components/Team";
import { BrandKit } from "./components/BrandKit";
import { ClientPortal } from "./components/ClientPortal";
import { LandingPage } from "./components/LandingPage";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { auth, googleProvider, signInWithPopup } from "./lib/firebase";
import { Loader2 } from "lucide-react";

function AppContent() {
  const { user, loading } = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/ai-content" element={<AICaptionGenerator />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/content-seo" element={<ContentOptimizer />} />
          <Route path="/seo-generator" element={<SEOGenerator />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/team" element={<Team />} />
          <Route path="/brand-kit" element={<BrandKit />} />
          <Route path="/portal/:clientId" element={<ClientPortal />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

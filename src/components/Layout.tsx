import { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { Flame } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-6 md:hidden">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">GrowthOS AI</span>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
          <span className="text-xs font-bold">DV</span>
        </div>
      </header>

      <main className="pb-20 pt-6 md:ml-64 md:pb-6 md:pt-6">
        <div className="mx-auto max-w-5xl px-6">
          {children}
        </div>
      </main>
    </div>
  );
}

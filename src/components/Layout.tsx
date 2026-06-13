import { ReactNode, useState } from "react";
import { Navigation } from "./Navigation";
import { Flame, Menu, X, LayoutGrid, TrendingUp, PenTool, Wrench, User, BarChart3, Briefcase, Calendar as CalendarIcon, Layout as LayoutIcon, Image, Search, Sparkles, FileText, Users, Palette, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "../lib/ThemeContext";
import { CommandBar } from "./CommandBar";

interface LayoutProps {
  children: ReactNode;
}

const navGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutGrid },
      { name: "Projects", href: "/projects", icon: LayoutIcon },
      { name: "Clients", href: "/clients", icon: Briefcase },
      { name: "Calendar", href: "/calendar", icon: CalendarIcon },
    ]
  },
  {
    label: "AI Studio",
    items: [
      { name: "AI Content", href: "/ai-content", icon: PenTool },
      { name: "Idea Generator", href: "/idea-generator", icon: Sparkles },
      { name: "Trends", href: "/trends", icon: TrendingUp },
      { name: "Content SEO", href: "/content-seo", icon: Search },
      { name: "SEO Gen", href: "/seo-generator", icon: Sparkles },
      { name: "Tools", href: "/tools", icon: Wrench },
    ]
  },
  {
    label: "Management",
    items: [
      { name: "Assets", href: "/assets", icon: Image },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Invoices", href: "/invoices", icon: FileText },
      { name: "Team", href: "/team", icon: Users },
      { name: "Brand Kit", href: "/brand-kit", icon: Palette },
      { name: "Profile", href: "/profile", icon: User },
    ]
  }
];

export function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <div className="no-print">
        <Navigation />
      </div>
      
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 md:hidden no-print gap-2">
        <div className="flex items-center space-x-1.5 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="h-4 w-4" />
          </div>
          <span className="text-xs font-extrabold tracking-tight">GrowthOS</span>
        </div>
        
        <div className="flex-1 max-w-[150px]">
          <CommandBar />
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 hover:text-primary transition-all duration-300 shadow-sm cursor-pointer"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Desktop Top Header */}
      <header className="sticky top-0 z-30 hidden md:flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-md px-8 ml-64 no-print shadow-sm">
        <div className="flex items-center space-x-4">
          <CommandBar />
        </div>
        <div className="flex items-center space-x-3 text-xs font-semibold text-muted-foreground mr-2">
          <span>GrowthOS Pro Command Center</span>
          <span className="h-4 w-px bg-border" />
          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-extrabold animate-pulse">Active</span>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-30 bg-background pt-16 md:hidden overflow-y-auto"
          >
            <div className="p-6 space-y-8">
              {navGroups.map((group) => (
                <div key={group.label} className="space-y-3">
                  <h3 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-3">
                    {group.label}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            "flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pb-24 pt-6 md:ml-64 md:pb-6 md:pt-6 print:ml-0 print:pt-0">
        <div className="mx-auto max-w-5xl px-4 md:px-6 print:max-w-none print:px-0">
          {children}
        </div>
      </main>
    </div>
  );
}

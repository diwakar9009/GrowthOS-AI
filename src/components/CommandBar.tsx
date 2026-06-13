import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { db, collection, query, onSnapshot } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Sparkles,
  Bot,
  PenTool,
  Wrench,
  TrendingUp,
  Briefcase,
  Layout,
  LayoutGrid,
  Calendar as CalendarIcon,
  User,
  Image,
  BarChart3,
  FileBarChart,
  FileText,
  Users,
  Palette,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Calculator
} from "lucide-react";

interface CommandItem {
  id: string;
  name: string;
  category: "AI Tools" | "Campaigns" | "Clients" | "Management Pages";
  icon: React.ComponentType<any>;
  href: string;
  keywords: string[];
}

export function CommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener to open command bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch real-time Projects and Clients for search indices
  useEffect(() => {
    if (!user) return;

    const unsubProjects = onSnapshot(
      collection(db, `users/${user.uid}/projects`),
      (snapshot) => {
        setProjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => console.error("CommandBar Projects listener error:", error)
    );

    const unsubClients = onSnapshot(
      collection(db, `users/${user.uid}/clients`),
      (snapshot) => {
        setClients(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => console.error("CommandBar Clients listener error:", error)
    );

    return () => {
      unsubProjects();
      unsubClients();
    };
  }, [user]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Static items (AI Tools, Pages)
  const staticItems: CommandItem[] = [
    // AI Tools
    {
      id: "ai-assistant",
      name: "AI Assistant Chat",
      category: "AI Tools",
      icon: Bot,
      href: "/assistant",
      keywords: ["ai", "assistant", "chat", "guru", "bot", "help", "guide"]
    },
    {
      id: "ai-content",
      name: "AI Caption Pack Generator",
      category: "AI Tools",
      icon: PenTool,
      href: "/ai-content",
      keywords: ["ai", "content", "generator", "caption", "post", "copywriter"]
    },
    {
      id: "idea-generator",
      name: "Content Idea & Calendars",
      category: "AI Tools",
      icon: Sparkles,
      href: "/idea-generator",
      keywords: ["ai", "idea", "calendar", "viral", "trend", "generator"]
    },
    {
      id: "trends",
      name: "Live Search & Social Trends",
      category: "AI Tools",
      icon: TrendingUp,
      href: "/trends",
      keywords: ["live", "search", "social", "trend", "analytics", "tracking"]
    },
    {
      id: "content-seo",
      name: "SEO Content Optimizer",
      category: "AI Tools",
      icon: Search,
      href: "/content-seo",
      keywords: ["seo", "optimize", "keywords", "score", "search", "audit"]
    },
    {
      id: "seo-gen",
      name: "SEO & Keyword Generator",
      category: "AI Tools",
      icon: Sparkles,
      href: "/seo-generator",
      keywords: ["seo", "keyword", "meta tags", "generator", "search", "ranking"]
    },
    {
      id: "roi-simulator",
      name: "Growth Funnel & ROI Simulator",
      category: "AI Tools",
      icon: Calculator,
      href: "/simulator",
      keywords: ["roi", "funnel", "simulator", "calculator", "cpc", "cac", "roas", "projections", "budget"]
    },
    {
      id: "ai-tools",
      name: "All Pro Marketing Tools",
      category: "AI Tools",
      icon: Wrench,
      href: "/tools",
      keywords: ["tools", "all", "utility", "marketing", "pro"]
    },

    // Management Pages
    {
      id: "dashboard",
      name: "Dashboard Command Center",
      category: "Management Pages",
      icon: LayoutGrid,
      href: "/",
      keywords: ["dashboard", "home", "stats", "overview", "main"]
    },
    {
      id: "calendar-page",
      name: "Campaign Calendar Schedule",
      category: "Management Pages",
      icon: CalendarIcon,
      href: "/calendar",
      keywords: ["calendar", "schedule", "events", "date", "plan"]
    },
    {
      id: "assets-page",
      name: "Creative Media Assets",
      category: "Management Pages",
      icon: Image,
      href: "/assets",
      keywords: ["assets", "media", "images", "photos", "files", "library"]
    },
    {
      id: "analytics-page",
      name: "Performance Analytics & Logs",
      category: "Management Pages",
      icon: BarChart3,
      href: "/analytics",
      keywords: ["analytics", "charts", "performance", "reach", "growth"]
    },
    {
      id: "reports-page",
      name: "Client Report Builder",
      category: "Management Pages",
      icon: FileBarChart,
      href: "/reports",
      keywords: ["reports", "export", "pdf", "builder", "documents"]
    },
    {
      id: "invoices-page",
      name: "Invoicing & Financials",
      category: "Management Pages",
      icon: FileText,
      href: "/invoices",
      keywords: ["invoices", "payments", "money", "billing", "clients"]
    },
    {
      id: "team-page",
      name: "Collaborative Team Hub",
      category: "Management Pages",
      icon: Users,
      href: "/team",
      keywords: ["team", "users", "collaborators", "sharing", "access"]
    },
    {
      id: "brand-kit-page",
      name: "Brand Kit & Palettes",
      category: "Management Pages",
      icon: Palette,
      href: "/brand-kit",
      keywords: ["brand kit", "palette", "styles", "colors", "guidelines"]
    },
    {
      id: "profile-page",
      name: "My Creator Profile Settings",
      category: "Management Pages",
      icon: User,
      href: "/profile",
      keywords: ["profile", "settings", "account", "logout", "custom keys"]
    }
  ];

  if (isAdmin) {
    staticItems.push({
      id: "admin-approvals",
      name: "Admin User Access Control",
      category: "Management Pages",
      icon: ShieldCheck,
      href: "/admin-users",
      keywords: ["admin", "users", "approvals", "permissions", "control"]
    });
  }

  // Dynamic campaigns index mappings
  const dynamicProjects: CommandItem[] = projects.map((p) => ({
    id: `project-${p.id}`,
    name: p.title,
    category: "Campaigns",
    icon: Layout,
    href: `/projects?search=${encodeURIComponent(p.title)}`,
    keywords: ["project", "campaign", "task", p.title.toLowerCase(), p.description?.toLowerCase() || ""]
  }));

  // Dynamic clients index mappings
  const dynamicClients: CommandItem[] = clients.map((c) => ({
    id: `client-${c.id}`,
    name: c.name,
    category: "Clients",
    icon: Briefcase,
    href: `/clients?search=${encodeURIComponent(c.name)}`,
    keywords: ["client", "user", c.name.toLowerCase(), c.niche?.toLowerCase() || "", c.brandVoice?.toLowerCase() || ""]
  }));

  // Combine items
  const allItems = [...dynamicProjects, ...dynamicClients, ...staticItems];

  // Search filter core logic
  const filteredItems = allItems.filter((item) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.keywords.some((kw) => kw.includes(query))
    );
  // Cap results at 12 for clean layout density
  }).slice(0, 12);

  // Keyboard navigation within results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelectItem(filteredItems[selectedIndex]);
      }
    }
  };

  const handleSelectItem = (item: CommandItem) => {
    navigate(item.href);
    setIsOpen(false);
  };

  // Close when clicking outside modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Sleek Top Search Command Bar trigger inside Layout */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-3 w-full max-w-xs md:max-w-md bg-secondary/80 border hover:border-primary/40 px-3.5 py-1.5 rounded-xl text-left text-muted-foreground transition-all duration-300 shadow-sm cursor-pointer group hover:bg-secondary"
      >
        <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="flex-1 text-xs font-semibold select-none truncate">
          Search anything...
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 bg-background border rounded px-1.5 py-0.5 text-[9px] font-mono tracking-wide text-foreground/50 h-5">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>

      {/* Command Palette Modal overlay */}
      <AnimatePresence>
        {isOpen && (
          <div
            onClick={handleBackdropClick}
            className="fixed inset-0 z-100 flex items-start justify-center bg-black/40 dark:bg-black/60 backdrop-blur-[2px] pt-[12vh] px-4 no-print cursor-default"
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-2xl bg-background border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              onKeyDown={handleKeyDown}
            >
              {/* Top search input */}
              <div className="flex items-center border-b px-4 py-3 bg-muted/20">
                <Search className="h-5 w-5 text-primary shrink-0 mr-3 animate-pulse" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Type to search projects, clients, and premium AI tools..."
                  className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground focus:ring-0 text-foreground py-1 font-medium"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[10px] uppercase font-bold text-muted-foreground border rounded px-2 py-1 hover:bg-muted hover:text-foreground transition-all ml-2"
                >
                  ESC
                </button>
              </div>

              {/* Suggestions results body */}
              <div className="max-h-[360px] overflow-y-auto p-2 custom-scrollbar space-y-4">
                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground space-y-2">
                    <Search className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm font-semibold">No matches found</p>
                    <p className="text-xs text-muted-foreground/80">Try searching for keywords like "SEO", client names, or task cards.</p>
                  </div>
                ) : (
                  <div>
                    {/* Dynamic categories grouping */}
                    {["AI Tools", "Campaigns", "Clients", "Management Pages"].map((cat) => {
                      const groupItems = filteredItems.filter((item) => item.category === cat);
                      if (groupItems.length === 0) return null;

                      return (
                        <div key={cat} className="space-y-1 py-1.5">
                          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70 px-3 pb-1">
                            {cat}
                          </h3>
                          {groupItems.map((item) => {
                            const IconComp = item.icon;
                            const globalIndex = filteredItems.indexOf(item);
                            const isCurrent = globalIndex === selectedIndex;

                            return (
                              <div
                                key={item.id}
                                onClick={() => handleSelectItem(item)}
                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer transition-all duration-150 ${
                                  isCurrent
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-foreground hover:bg-muted/60"
                                }`}
                              >
                                <div className="flex items-center space-x-3 truncate">
                                  <div className={`p-1.5 rounded-lg ${isCurrent ? "bg-white/25 text-white" : "bg-primary/10 text-primary"}`}>
                                    <IconComp className="h-4 w-4" />
                                  </div>
                                  <span className="truncate">{item.name}</span>
                                </div>
                                <div className="flex items-center space-x-1 pl-2">
                                  {isCurrent ? (
                                    <span className="text-[10px] bg-white/20 text-white rounded px-1.5 py-0.5 flex items-center gap-1">
                                      Navigate <ArrowRight className="h-3 w-3" />
                                    </span>
                                  ) : (
                                    <ChevronRight className="h-3 w-3 opacity-30" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Utility Footer tip bar */}
              <div className="border-t px-4 py-2.5 bg-muted/40 flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-medium">
                    <kbd className="bg-background border px-1 rounded text-[9px]">↑↓</kbd> to navigate
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <kbd className="bg-background border px-1 rounded text-[9px]">Enter</kbd> to select
                  </span>
                </div>
                <div className="font-mono text-[10px]">
                  GrowthOS AI Launcher
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

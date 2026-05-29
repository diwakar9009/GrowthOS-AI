import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, TrendingUp, PenTool, Wrench, User, Flame, BarChart3, Briefcase, Calendar as CalendarIcon, Layout, Image, Search, Sparkles, FileText, Users, Palette, FileBarChart, Bot, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutGrid },
      { name: "Projects", href: "/projects", icon: Layout },
      { name: "Clients", href: "/clients", icon: Briefcase },
      { name: "Calendar", href: "/calendar", icon: CalendarIcon },
    ]
  },
  {
    label: "AI Studio",
    items: [
      { name: "AI Assistant", href: "/assistant", icon: Bot },
      { name: "AI Content", href: "/ai-content", icon: PenTool },
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
      { name: "Reports", href: "/reports", icon: FileBarChart },
      { name: "Invoices", href: "/invoices", icon: FileText },
      { name: "Team", href: "/team", icon: Users },
      { name: "Brand Kit", href: "/brand-kit", icon: Palette },
      { name: "Profile", href: "/profile", icon: User },
    ]
  }
];

export function Navigation() {
  const location = useLocation();
  
  // Key mobile items
  const mobileItems = [
    { name: "Home", href: "/", icon: LayoutGrid },
    { name: "Assistant", href: "/assistant", icon: Bot },
    { name: "Tools", href: "/tools", icon: Wrench },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t bg-background px-4 md:hidden no-print">
        <div className="flex w-full items-center justify-around">
          {mobileItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
                <span className="text-[10px] font-medium whitespace-nowrap">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Side Nav */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r bg-background p-6 md:flex no-print">
        <div className="mb-8 flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Flame className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">GrowthOS AI</span>
        </div>
        <nav className="flex flex-1 flex-col space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <h3 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-3">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", isActive ? "" : "group-hover:text-primary")} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

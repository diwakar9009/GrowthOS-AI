import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, TrendingUp, PenTool, Wrench, User, Flame, BarChart3, Briefcase, Calendar as CalendarIcon, Layout, Image } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutGrid },
  { name: "Projects", href: "/projects", icon: Layout },
  { name: "Clients", href: "/clients", icon: Briefcase },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon },
  { name: "AI Content", href: "/ai-content", icon: PenTool },
  { name: "Trends", href: "/trends", icon: TrendingUp },
  { name: "Assets", href: "/assets", icon: Image },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Tools", href: "/tools", icon: Wrench },
  { name: "Profile", href: "/profile", icon: User },
];

export function Navigation() {
  const location = useLocation();

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background px-4 md:hidden">
        {navItems.map((item) => {
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
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Side Nav */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r bg-background p-6 md:flex">
        <div className="mb-8 flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">GrowthOS AI</span>
        </div>
        <nav className="flex flex-1 flex-col space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

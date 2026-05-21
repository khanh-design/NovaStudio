"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Sparkles,
  Mic,
  ChevronLeft,
  Film,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/audio", label: "Audio TTS", icon: Mic },
  { href: "/projects", label: "Projects", icon: FolderOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile overlay trigger */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg glass"
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle menu"
      >
        <Zap className="h-5 w-5 text-primary" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "shrink-0 border-r border-border flex flex-col bg-card/80 backdrop-blur-sm transition-all duration-300 ease-out z-40",
          collapsed ? "w-16" : "w-56",
          /* Mobile: absolute overlay */
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0",
          "max-lg:translate-x-0",
        )}
      >
        {/* Brand area */}
        <div
          className={cn(
            "h-14 flex items-center border-b border-border transition-all",
            collapsed ? "px-3 justify-center" : "px-4 gap-3"
          )}
        >
          <div className="relative flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Film className="h-4 w-4 text-background" />
            </div>
            {/* Subtle glow behind logo */}
            <div className="absolute inset-0 rounded-lg bg-primary/20 blur-md -z-10" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight text-gradient truncate">
                NovaStudio
              </span>
              <span className="text-[10px] text-muted-foreground">
                AI Creator Tool
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group relative flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                  collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                  isActive
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                )}
                title={collapsed ? label : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary transition-all" />
                )}

                <Icon
                  className={cn(
                    "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                    isActive ? "text-primary" : "group-hover:text-foreground"
                  )}
                />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle + footer */}
        <div className="px-2 py-3 border-t border-border space-y-2">
          {/* Collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "hidden lg:flex items-center w-full rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all",
              collapsed ? "justify-center p-2" : "gap-2 px-3 py-2"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                collapsed && "rotate-180"
              )}
            />
            {!collapsed && <span>Collapse</span>}
          </button>

          {/* Phase indicator */}
          {!collapsed && (
            <div className="px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-muted-foreground">
                  Phase 1 — Core Generation
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

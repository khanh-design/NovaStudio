"use client";

import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  CheckCircle,
  Loader2,
  ImageIcon,
  Film,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./animated-counter";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  CheckCircle,
  Loader2,
  ImageIcon,
  Film,
};

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  color: string;
  delay?: number;
}

export function StatCard({ label, value, icon, color, delay = 0 }: StatCardProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const Icon = iconMap[icon] || LayoutDashboard;

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card/60 p-4 transition-all duration-500",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 card-hover",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight">
            <AnimatedCounter value={value} />
          </p>
        </div>
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center bg-white/[0.04]",
        )}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
      </div>
    </div>
  );
}

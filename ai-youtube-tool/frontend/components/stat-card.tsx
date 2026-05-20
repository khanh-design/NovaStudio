"use client";
import { useEffect, useState } from "react";
import { ImageIcon, Film, CheckCircle, Loader2, LayoutDashboard } from "lucide-react";
import { AnimatedCounter } from "./animated-counter";
import { cn } from "@/lib/utils";

// Icon name → component map (only plain strings cross server/client boundary)
const ICON_MAP = {
  LayoutDashboard,
  CheckCircle,
  Loader2,
  ImageIcon,
  Film,
} as const;

type IconName = keyof typeof ICON_MAP;

interface StatCardProps {
  label: string;
  value: number;
  icon: IconName;   // plain string, serializable
  color: string;
  delay?: number;
}

export function StatCard({ label, value, icon, color, delay = 0 }: StatCardProps) {
  const [visible, setVisible] = useState(false);
  const Icon = ICON_MAP[icon];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 space-y-2 transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className={cn("h-4 w-4 transition-transform duration-300 hover:scale-110", color)} />
      </div>
      <p className="text-2xl font-bold tabular-nums">
        <AnimatedCounter value={value} duration={800} />
      </p>
    </div>
  );
}

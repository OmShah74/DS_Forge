"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database, Eraser, BrainCircuit, Activity, Rocket,
  LayoutGrid, Settings, FlaskConical, Cpu, ChevronLeft, ChevronRight, Zap
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useUIStore } from "@/store/uiStore";
import { useExplainabilityStore } from "@/store/explainabilityStore";
import { Terminal } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { name: "Datasets", href: "/datasets", icon: Database },
  { name: "Cleaning", href: "/cleaning", icon: Eraser },
  { name: "Feature Eng", href: "/features", icon: Zap },
  { name: "Training", href: "/training", icon: BrainCircuit },
  { name: "Evaluation", href: "/evaluation", icon: Activity },
  { name: "Deployment", href: "/deployment", icon: Rocket },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { toggleActivityLog } = useExplainabilityStore();

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen glass-panel border-r border-white/5 flex flex-col z-[100] transition-all duration-300 shadow-2xl",
      sidebarCollapsed ? "w-20" : "w-64"
    )}>
      {/* Sidebar Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 hover:bg-purple-500 transition-colors z-[110] active:scale-95"
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={cn("p-8 pb-4", sidebarCollapsed && "px-4 py-8 flex flex-col items-center")}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] shrink-0 active:scale-95 transition-transform cursor-pointer">
            <Cpu size={22} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 flex justify-between items-center min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-white truncate">
                DS <span className="text-purple-500">FORGE</span>
              </h1>
              <button
                onClick={toggleActivityLog}
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-purple-400 transition-all active:scale-90"
                title="System Activity Log"
              >
                <Terminal size={16} />
              </button>
            </div>
          )}
        </div>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 mt-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">v1.1 • CPU-Engine</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-4">
        <Link href="/">
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
            pathname === "/"
              ? "bg-purple-500/10 text-white border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.05)]"
              : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]",
            sidebarCollapsed && "justify-center px-0 h-12"
          )}>
            <LayoutGrid size={20} className={cn("transition-transform duration-300 group-hover:scale-110 shrink-0", pathname === "/" && "text-purple-400")} />
            {!sidebarCollapsed && <span className="font-bold text-base tracking-tight text-gray-300">Overview</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 rounded bg-black border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[120]">
                Overview
              </div>
            )}
          </div>
        </Link>

        {!sidebarCollapsed && (
          <div className="pt-6 pb-2 px-4 text-center">
            <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em] border-b border-white/5 pb-2">Pipeline Architecture</p>
          </div>
        )}

        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                isActive
                  ? "bg-purple-600/10 text-purple-300 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] border border-transparent",
                sidebarCollapsed && "justify-center px-0 h-12"
              )}>
                <item.icon size={20} className={cn("transition-transform duration-300 group-hover:scale-110 shrink-0", isActive && "text-purple-400")} />
                {!sidebarCollapsed && <span className="font-bold text-base tracking-tight">{item.name}</span>}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-2 py-1 rounded bg-black border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[120]">
                    {item.name}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5">
        <Link href="/settings">
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all group relative",
            sidebarCollapsed && "justify-center px-0 h-12"
          )}>
            <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500 shrink-0" />
            {!sidebarCollapsed && <span className="font-semibold text-sm tracking-tight">System Settings</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 rounded bg-gray-800 text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[120]">
                Settings
              </div>
            )}
          </div>
        </Link>
      </div>
    </aside>
  );
}

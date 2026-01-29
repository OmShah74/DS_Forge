"use client";
import { useUIStore } from "@/store/uiStore";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function MainContentWrapper({ children }: { children: React.ReactNode }) {
    const { sidebarCollapsed } = useUIStore();

    return (
        <main className={cn(
            "flex-1 min-h-screen relative overflow-hidden transition-all duration-300",
            sidebarCollapsed ? "ml-20" : "ml-64"
        )}>
            {/* Background Decorations */}
            <div className="absolute inset-0 grid-overlay z-0 opacity-40 pointer-events-none"></div>

            {/* Page Content */}
            <div className="relative z-10 px-8 py-10">
                {children}
            </div>
        </main>
    );
}

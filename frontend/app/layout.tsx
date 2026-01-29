import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import MainContentWrapper from "@/components/layout/MainContentWrapper";

export const metadata: Metadata = {
  title: "DS-Forge | Data Science OS",
  description: "Self-contained Data Science Operating System for professional workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="flex bg-[#080a18] selection:bg-blue-500/30">
        <Sidebar />
        <MainContentWrapper>
          {children}
        </MainContentWrapper>
      </body>
    </html>
  );
}
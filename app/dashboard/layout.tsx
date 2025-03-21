import React from "react";
import ClientRootLayout from "./components/ClientRootLayout";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import Breadcrumbs from './components/breadcrumbs';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TEDxSIST ⋅ Dashboard",
  description: "Admin Functionalities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientRootLayout>
      <main
        lang="en"
        className={`min-h-screen w-full bg-background text-foreground flex ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center justify-between w-full px-4">
                <div className="flex items-center gap-2">
                  <SidebarTrigger
                    variant="outline"
                    className="scale-125 sm:scale-70 md:scale-70 lg:scale-100 text-foreground/60"
                  />
                  <Separator
                    orientation="vertical"
                    className="h-7 bg-border"
                  />
                  <Breadcrumbs />
                </div>
                <ModeToggle />
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/15 md:min-h-min gap-5 p-5 pt-3">
                {children}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </main>
    </ClientRootLayout>
  );
}

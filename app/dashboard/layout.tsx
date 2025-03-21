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
import ExcelDownloadButton from "@/components/ExcelButton"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SISTMUN ⋅ Dashboard",
  description: "Admin Functionalities",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0",
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
        className={`min-h-screen w-full bg-background text-foreground flex ${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="w-full">
            <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear">
              <div className="flex items-center justify-between w-full px-2 sm:px-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <SidebarTrigger
                    variant="outline"
                    className="h-8 w-8 sm:h-9 sm:w-9 text-foreground/60"
                  />
                  <Separator
                    orientation="vertical"
                    className="h-5 sm:h-7 bg-border"
                  />
                  <Breadcrumbs />
                </div>
                <div className="flex items-center gap-2">
                  <ModeToggle />
                  <ExcelDownloadButton />
                </div>
              </div>
            </header>
           <div className="flex flex-1 flex-col gap-2 sm:gap-4 p-2 sm:p-4 pt-0">
              <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex-1 rounded-lg sm:rounded-xl bg-muted/15 md:min-h-min gap-2 sm:gap-5 p-2 sm:p-5 pt-2 sm:pt-3">
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
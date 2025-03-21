"use client"

import * as React from "react"
import Image from "next/image"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton className="flex items-center gap-2 ">
          {/* Logo */}
          <div className="flex aspect-square items-center justify-center rounded-lg bg-sidebar-white text-sidebar-primary-foreground ">
            <Image
              src="/unglobe.svg" // Path to logo image in the public directory
              alt="SIST-mun Logo"
              width={32} // Adjust the size as needed
              height={32} // Adjust the size as needed
            />
          </div>
          {/* Text */}
          <div className="grid flex-1 text-left text-sm leading-tight ">
            <span className="truncate font-semibold">SIST-MUN</span>
            <span className="truncate text-xs">Central App</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

"use client"

import * as React from "react"
import {jwtDecode, JwtPayload} from "jwt-decode"
import {
  Ticket,
  GalleryVerticalEnd,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"

import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

interface UserPayload extends JwtPayload {
  name?: string;
  email?: string;
  picture?: string;
}

const decodeToken = () => {
  // Check if running in browser environment
  if (typeof window === 'undefined') {
    return {
      username: "Guest",
      email: "guest@example.com",
      picture: "/favicon.ico",
    };
  }
  
  const token = sessionStorage.getItem("Token");
  if (token) {
    try {
      const decoded = jwtDecode<UserPayload>(token); 
      return {
        username: decoded.name || "Default Username",
        email: decoded.email || "Default Email",
        picture: decoded.picture || "/favicon.ico"
      };
    } catch (error) {
      console.error("Invalid token:", error);
      return {
        username: "Error",
        email: "Error",
        picture: "Error"
      };
    }
  }
  return {
    username: "Guest",
    email: "guest@example.com",
    picture: "/favicon.ico",
  };
};
const userData = decodeToken();
// This is sample data.
const data = {
  user: {
    name: userData.username,
    email: userData.email,
    avatar: userData.picture,
  },
  teams: [
    {
      name: "SIST-MUN",
      logo: GalleryVerticalEnd,
      plan: "Central App",
    }
  ],
  navMain: [
    
    {
      title: "QR Ticketing",
      url: "/dashboard/qrTicketing",
      icon: Ticket,
     
    },
   
    
  ]
  
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="py-4">
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

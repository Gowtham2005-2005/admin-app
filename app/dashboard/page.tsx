'use client';
import React, { useEffect, useState } from 'react';
import { Separator } from "@/components/ui/separator";
import { useRouter } from 'next/navigation';
import { jwtDecode } from "jwt-decode";

export default function Page() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    // Check if running in browser environment
    if (typeof window === 'undefined') return;
    
    const token = sessionStorage.getItem('Token');
    if (token) {
      try {
        const decoded = jwtDecode<{ name: string }>(token); // Decoding the token and storing user info
        setUser(decoded);
      } catch (error) {
        console.error('Invalid token:', error);
        router.push('/');
      }
    } else {
      // Redirect to login if no token
      router.push('/');
    }
  }, [router]);

  const handleNavigation = (route: string) => {
    router.push(route); // Navigate to the specified route
  };

  // Return null while redirecting or if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className='text-foreground'>
      <div className="space-y-1">
        <h2 className="text-lg font-medium leading-none">Welcome {user.name}</h2>
        <p className="text-sm text-muted-foreground">
          Please Navigate through Operations
        </p>
      </div>
      <Separator className="my-4 " />
      <div className="flex h-5 items-center space-x-4 text-sm">
      
       
        <div onClick={() => handleNavigation('/dashboard/qrTicketing')} className="cursor-pointer">QR Ticketing</div>
        
        
      </div>
    </div>
  );
}

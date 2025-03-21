'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if running in browser environment
    if (typeof window === 'undefined') return;
    
    const token = sessionStorage.getItem('Token');
    if (!token) {
      router.push('/'); // Redirect to the login page if no token exists
    } else {
      setLoading(false); // Allow rendering when the token is valid
    }
  }, [router]);

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while validating the token
  }

  return <>{children}</>; // Render children if authentication is valid
}

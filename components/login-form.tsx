'use client';
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from '@/firebase';

const ALLOWED_ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter();
  const googleProvider = new GoogleAuthProvider();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUpWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null); // Reset any previous errors
      const response = await signInWithPopup(auth, googleProvider);
      const user = response.user;
      const token = await user.getIdToken(); // Fetch the ID token
      // Optionally verify email domain(example@tedxsist.com)
      const email = user.email || "";
      if (!email.endsWith("@gmail.com")) {
        setError("Please use your TEDxSIST email to sign in.");
        return;
      }

      if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
        setError("Access denied. Please use an authorized admin email address.");
        return;
      }

      // Check if running in browser environment
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('Token', token);
      }
      router.push('/dashboard/qrTicketing');
    } catch (error) {
      console.error("Error during Google Sign-In:", error);
      setError("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Check if running in browser environment
    if (typeof window === 'undefined') return;
    
    const token = sessionStorage.getItem('Token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router])

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to Central App</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to central-app using your Sathyabama MUN account
        </p>
      </div>
      <div className="grid gap-6">
        {error && (
          <div className="text-red-500 text-sm text-center">
            {error}
          </div>
        )}
        <Button
          type="button"
          className="w-full"
          onClick={signUpWithGoogle}
          disabled={loading}
          aria-label="Login with Google"
        >
          {loading ? (
            <>
            <Loader2 className="animate-spin mr-2" />
            <span>Signing in...</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5 mr-2"
              >
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Login with Google
            </>
          )}
        </Button>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            No other option available for now
          </span>
        </div>
      </div>
    </form>
  );
}

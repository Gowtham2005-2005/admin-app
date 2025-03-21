import Image from 'next/image';
import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
   (<div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
              <Link href="/" className="flex items-center gap-2" aria-label="Home">
      <Image
        src="/unglobe.svg" // Ensure this file is in the `public/` folder
        alt="Company Logo"
        width={60}
        height={10}
      />
    </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <div className="relative w-full h-full"> 
      <Image
        src="/main.png"
        alt="Image"
        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        layout="fill" // Fills the parent container
        objectFit="cover" // Ensures the image respects the aspect ratio
      />
    </div>
      </div>
    </div>)
  );
}

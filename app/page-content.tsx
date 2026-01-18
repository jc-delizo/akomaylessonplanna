'use client'

import { ComponentExample } from "@/components/component-example";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function PageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth callback if code parameter is present (fallback for when Supabase redirects to root)
    if (code) {
      setIsRedirecting(true);
      // Use window.location for a hard redirect to ensure it works
      window.location.href = `/auth/callback?code=${code}`;
      return;
    }

    // Handle OAuth errors
    if (error) {
      setIsRedirecting(true);
      window.location.href = `/login?error=${encodeURIComponent(
        errorDescription || error || "Authentication failed"
      )}`;
      return;
    }
  }, [searchParams]);

  // Show loading state while redirecting
  if (isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Completing authentication...</p>
        </div>
      </div>
    );
  }

  return <ComponentExample />;
}

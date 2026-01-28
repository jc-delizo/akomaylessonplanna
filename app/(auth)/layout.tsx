import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication | Ako may lesson plan na!",
  description: "Sign in or create an account to access the marketplace",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-in fade-in-0 duration-300 slide-in-from-bottom-2 motion-reduce:animate-none motion-reduce:opacity-100">
        {children}
      </div>
    </div>
  );
}

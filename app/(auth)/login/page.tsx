import { Suspense } from 'react'
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent } from '@/components/ui/card'

function LoginLoading() {
  return (
    <Card className="w-full max-w-md ring-0">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/button/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/default/card/card"
import { Input } from "@/registry/default/input/input"
import { Label } from "@/registry/default/label/label"
import { Field, FieldGroup, FieldLabel } from "@/registry/default/field/field"

function AuthLoginBlock({
  onSubmit,
  className,
  ...props
}: {
  onSubmit?: (email: string, password: string) => void
  className?: string
} & Omit<React.ComponentProps<"div">, "onSubmit">) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    onSubmit?.(email, password)
  }

  return (
    <Card className={cn("w-full max-w-md", className)} {...props}>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            {error && (
              <div className="text-destructive text-xs">{error}</div>
            )}
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full">
            Sign in
          </Button>
          <div className="text-center text-xs text-muted-foreground">
            <a href="#" className="hover:underline">
              Forgot password?
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

export { AuthLoginBlock }

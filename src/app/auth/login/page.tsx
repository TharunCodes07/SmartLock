
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { login } from "@/actions/user"
import { redirect } from 'next/navigation'
import { getSession } from "@/lib/getSession"

const Login = async () => {
  // const session = await getSession();
  // if (session?.user) {
  //   redirect('/')
  // }
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm transition-all">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">SmartLock</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your account to continue</p>
        </div>  
        <form action={login} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="you@example.com" type="email" name="email" autoComplete="email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                placeholder="••••••••"
                type="password"
                name="password"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Sign In <span className="ml-1">→</span>
          </Button>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/auth/register" className="font-medium text-primary hover:underline">
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login


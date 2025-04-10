import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { register } from "@/actions/user"
import { redirect } from 'next/navigation'
import { getSession } from "@/lib/getSession"

const Register = async () => {

  // const session = await getSession();
  //   if (session?.user) {
  //     redirect('/')
  //   }
    
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm transition-all">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">SmartLock</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create an account to continue</p>
        </div>
        <form action={register} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
            <Label htmlFor="userName">User Name</Label>
            <Input id="userName" placeholder="UserName" type="text" name="userName" required/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="you@example.com" type="email" name="email" required/>
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
            Sign Up &rarr; 
          </Button>

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register


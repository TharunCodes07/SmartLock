import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { compare } from 'bcryptjs'
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: {  label: "Password", type: "password" }
      },
      authorize : async (credentials) => {
        const email = credentials.email as string | undefined
        const password = credentials.password as string | undefined

        if(!email || !password) {
          throw new CredentialsSignin('Please fill all the fields') 
        }
        const user = await prisma.user.findUnique({
                where: { email },
            })

        if (!user) {
                throw new Error('User does not exist')
            }
            
        const passwordMatch = await compare(password, user.password)

        if(!passwordMatch) {
            throw new Error('Invalid password')
        }
        const userData = { id: user.id, name: user.userName, email: user.email }

        return userData
      }
    })
  ],
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async session({session, token}) {
      if(token?.sub){
        session.user.id = token.sub;
      }
      return session
    },

    async jwt({token, user}) {
      if(user){
        token.sub = user.id
      }
      return token;
    },
  }
})
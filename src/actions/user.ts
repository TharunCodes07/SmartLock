'use server'

import { signIn } from '@/auth'
import {prisma} from '@/lib/prisma'
import {hash} from 'bcryptjs'
import { CredentialsSignin } from 'next-auth'
import { redirect } from 'next/navigation'

const register = async (formdata : FormData) => {
  const userName = formdata.get('userName') as string | undefined
  const email = formdata.get('email') as string | undefined
  const password = formdata.get('password') as string | undefined

  if(!userName || !email || !password) {
    throw new Error('Please fill all the fields') 
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error('User already exists')
  }

  const hashedPassword = await hash(password, 10)
  await prisma.user.create({
    data: {
        userName,
        email,
        password: hashedPassword,
    }
  })
}

const login = async (formdata : FormData) => {
    const email = formdata.get('email') as string | undefined
    const password = formdata.get('password') as string | undefined
    
    if(!email || !password) {
        throw new Error('Please fill all the fields') 
    }
    try{

      await signIn('credentials', {
        redirect: false,
        email,
        password,

      })

    }
    catch (error) {
      const someError = error as CredentialsSignin
      throw new Error(someError.message)

    }
    finally{
      redirect('/')
    }
}

export {register, login}
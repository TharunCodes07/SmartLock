import {prisma} from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Handle GET requests to /api/users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        Family: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { message: 'Error fetching users' },
      { status: 500 }
    );
  }
}
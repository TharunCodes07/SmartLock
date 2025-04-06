import {prisma} from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Handle POST requests to /api/family
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, email } = body;

    if (!userId || !name || !email) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const familyMember = await prisma.family.create({
      data: {
        userId,
        name,
        email,
        status: 'neutral', 
      },
    });

    return NextResponse.json(familyMember, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error creating family member' },
      { status: 500 }
    );
  }
}
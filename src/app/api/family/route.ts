import {prisma} from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch family members for the authenticated user
    const familyMembers = await prisma.family.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        status: true,
        email: true,
      },
    });

    return NextResponse.json(familyMembers);
  } catch (error) {
    console.error('Error fetching family members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family members' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


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
// File: app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the session to verify the user is authenticated
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const param = await params
    const userId = param.id;

    // Ensure the user is only accessing their own data
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch the user with their family members and cameras
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        family: true, // Matches the schema's relation name 'family'
        cameras: true, // Matches the schema's relation name 'cameras'
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Construct a safe response object, excluding sensitive fields like password
    const safeUser = {
      id: user.id,
      email: user.email,
      userName: user.userName,
      family: user.family, // Matches the schema
      cameras: user.cameras, // Matches the schema
    };

    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
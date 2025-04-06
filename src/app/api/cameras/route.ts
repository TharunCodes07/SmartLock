// File: app/api/cameras/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET: Fetch user's cameras
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cameras = await prisma.camera.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json(cameras, { status: 200 });
  } catch (error) {
    console.error('Error fetching cameras:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new camera
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Camera name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const camera = await prisma.camera.create({
      data: {
        name: name.trim(),
        userId: session.user.id,
      },
    });

    return NextResponse.json(camera, { status: 201 });
  } catch (error: any) {
    console.error('Error creating camera:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A camera with this name already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadImage } from '@/lib/cloudinary';

// GET: Fetch family members for the authenticated user
export async function GET(request: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const familyMembers = await prisma.family.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        emotion: true,
        email: true,
        image: true, // Include image field in the response
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

// POST: Create a new family member with an image
export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const file = formData.get('image') as File;

    // Validate required fields
    if (!userId || !name || !email || !file) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Optional: Validate file type and size
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json(
        { message: 'File size exceeds the 5MB limit.' },
        { status: 400 }
      );
    }

    // Upload image to Cloudinary
    const imageUrl = await uploadImage(file);

    // Create family member with the image URL
    const familyMember = await prisma.family.create({
      data: {
        userId: userId,
        name,
        email,
        emotion: 'neutral',
        image: imageUrl,
      },
    });

    return NextResponse.json(familyMember, { status: 201 });
  } catch (error) {
    console.error('Error creating family member:', error);
    return NextResponse.json(
      { message: 'Error creating family member' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
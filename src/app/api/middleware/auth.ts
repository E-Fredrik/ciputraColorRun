import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function authenticateAdmin(request: Request): Promise<{ authenticated: boolean; user?: any; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'Missing or invalid authorization header' };
    }

    const accessCode = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Find user with this access code and admin role
    const user = await prisma.user.findFirst({
      where: {
        accessCode,
        role: 'admin',
      },
    });

    if (!user) {
      return { authenticated: false, error: 'Invalid access code or not an admin' };
    }

    return { authenticated: true, user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
}

export function unauthorizedResponse(error?: string) {
  return NextResponse.json(
    { error: error || 'Unauthorized' },
    { status: 401 }
  );
}

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const refreshToken = body.refresh_token;

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'No refresh token provided' },
      { status: 400 }
    );
  }

  try {
    // Call your backend to refresh tokens
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_GW_ENDPOINT}/auth/refresh-tokens`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': process.env.API_KEY!,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to refresh tokens');
    }

    const tokens = await response.json();

    // Create response
    const apiResponse = NextResponse.json({ success: true });

    // Update cookies with new tokens
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };

    apiResponse.cookies.set('id_token', tokens.id_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });

    apiResponse.cookies.set('access_token', tokens.access_token, {
      ...cookieOptions,
      maxAge: 60 * 60,
    });

    apiResponse.cookies.set('refresh_token', tokens.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    });

    return apiResponse;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh tokens' },
      { status: 500 }
    );
  }
}

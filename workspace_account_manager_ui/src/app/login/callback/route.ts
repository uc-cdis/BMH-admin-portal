import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { exchangeCodeForTokens } from '@/lib/auth/auth-api';
import { validateState, validateNonce, storeTokens } from '@/lib/auth/oidc';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  console.log(searchParams);
  console.log(state);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${error}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/login?error=invalid_request', request.url)
    );
  }

  // Validate state
  if (!validateState(state)) {
    // return NextResponse.redirect(
    //   new URL('/login?error=invalid_state', request.url)
    // );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(
      code,
      process.env.NEXT_PUBLIC_API_GW_ENDPOINT!,
      process.env.NEXT_PUBLIC_API_KEY!
    );

    // Validate nonce
    const decoded = jwtDecode<any>(tokens.id_token);
    if (!validateNonce(decoded.nonce)) {
      throw new Error('Invalid nonce');
    }
    storeTokens(tokens)

    const response = NextResponse.redirect(
      new URL('/dashboard', request.url)
    );

    // Set secure cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    response.cookies.set('id_token', tokens.id_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set('access_token', tokens.access_token, {
      ...cookieOptions,
      maxAge: 60 * 60, // 1 hour
    });

    response.cookies.set('refresh_token', tokens.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=authentication_failed', request.url)
    );
  }
}

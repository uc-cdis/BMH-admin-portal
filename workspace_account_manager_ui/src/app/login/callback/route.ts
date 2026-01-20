import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { exchangeCodeForTokens } from '@/lib/auth/auth-api';

interface TokenSet {
  id_token: string;
  access_token: string;
  refresh_token: string;
}

interface DecodedToken {
  nonce: string;
  exp?: number;
  [key: string]: any;
}

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

  console.log('\n🍪 Reading Cookies:');

  const storedState = request.cookies.get('oauth_state')?.value;
  const storedNonce = request.cookies.get('oauth_nonce')?.value;
  const redirectAfterLogin = request.cookies.get('redirect_after_login')?.value || '/';

  console.log('   oauth_state:', storedState ? `${storedState.substring(0, 15)}...` : 'MISSING');
  console.log('   oauth_nonce:', storedNonce ? `${storedNonce.substring(0, 15)}...` : 'MISSING');
  console.log('   redirect_after_login:', redirectAfterLogin);

  // Debug: Show all cookies
  const allCookies = request.cookies.getAll();
  console.log('\n📋 All Cookies Received:');
  allCookies.forEach(cookie => {
    const value = cookie.value.length > 20
      ? `${cookie.value.substring(0, 20)}...`
      : cookie.value;
    console.log(`   ${cookie.name}: ${value}`);
  });
// ========================================
  // STEP 5: Validate State (CSRF Protection)
  // ========================================
  console.log('\n🔍 State Validation:');
  console.log('   Received:', state ? `${state.substring(0, 15)}...` : 'null');
  console.log('   Stored:', storedState ? `${storedState.substring(0, 15)}...` : 'null');
  console.log('   Match:', state === storedState);

  if (!storedState) {
    console.error('❌ No stored state found in cookies!');
    console.error('💡 TIP: Check that initiateLogin() is setting cookies correctly');
    console.error('💡 TIP: Verify cookies have path=/ and SameSite=Lax');

    return NextResponse.redirect(
      new URL('/login?error=missing_state', request.url)
    );
  }

  if (state !== storedState) {
    console.error('❌ State Mismatch - Possible CSRF Attack!');
    console.error('   This could mean:');
    console.error('   - Cookies were cleared between login and callback');
    console.error('   - Different browser/tab was used');
    console.error('   - Potential CSRF attack');

    return NextResponse.redirect(
      new URL('/login?error=invalid_state', request.url)
    );
  }

  console.log('✅ State validation passed');

  // ========================================
  // STEP 6: Exchange Code for Tokens
  // ========================================
  console.log('\n💱 Exchanging Authorization Code for Tokens...');

  let tokens: TokenSet;

  try {
    tokens = await exchangeCodeForTokens(
      code,
      process.env.NEXT_PUBLIC_API_GW_ENDPOINT!,
      process.env.NEXT_PUBLIC_API_KEY!
    );

    console.log('✅ Successfully received tokens from backend');
    console.log('   ID Token:', tokens.id_token ? `${tokens.id_token.substring(0, 20)}...` : 'MISSING');
    console.log('   Access Token:', tokens.access_token ? `${tokens.access_token.substring(0, 20)}...` : 'MISSING');
    console.log('   Refresh Token:', tokens.refresh_token ? `${tokens.refresh_token.substring(0, 20)}...` : 'MISSING');

  } catch (error) {
    console.error('❌ Failed to Exchange Code for Tokens');
    console.error('   Error:', error);
    console.error('💡 TIP: Check API_GW_ENDPOINT and API_KEY are set correctly');
    console.error('💡 TIP: Verify backend /auth/get-tokens endpoint is working');

    return NextResponse.redirect(
      new URL('/login?error=token_exchange_failed', request.url)
    );
  }

  // ========================================
  // STEP 7: Validate Nonce (Replay Protection)
  // ========================================
  console.log('\n🔍 Nonce Validation:');

  let decoded: DecodedToken;

  try {
    decoded = jwtDecode<DecodedToken>(tokens.id_token);
    console.log('   Nonce from token:', decoded.nonce ? `${decoded.nonce.substring(0, 15)}...` : 'MISSING');
    console.log('   Stored nonce:', storedNonce ? `${storedNonce.substring(0, 15)}...` : 'MISSING');
    console.log('   Match:', decoded.nonce === storedNonce);

  } catch (error) {
    console.error('❌ Failed to Decode ID Token');
    console.error('   Error:', error);

    return NextResponse.redirect(
      new URL('/login?error=invalid_token', request.url)
    );
  }

  if (!storedNonce) {
    console.error('❌ No stored nonce found in cookies!');

    return NextResponse.redirect(
      new URL('/login?error=missing_nonce', request.url)
    );
  }

  if (decoded.nonce !== storedNonce) {
    console.error('❌ Nonce Mismatch - Possible Replay Attack!');

    return NextResponse.redirect(
      new URL('/login?error=invalid_nonce', request.url)
    );
  }

  console.log('✅ Nonce validation passed');

  // ========================================
  // STEP 8: Set Authentication Cookies
  // ========================================
  console.log('\n🍪 Setting Authentication Cookies...');

  const response = NextResponse.redirect(new URL(redirectAfterLogin, request.url));

  const isProduction = process.env.NODE_ENV === 'production';

  // Cookie options for auth tokens
  const authCookieOptions = {
    httpOnly: true,           // Cannot be accessed by JavaScript (XSS protection)
    secure: isProduction,     // Only sent over HTTPS in production
    sameSite: 'lax' as const, // CSRF protection
    path: '/',                // Accessible from all routes
  };

  // Set ID token (long expiry)
  response.cookies.set('id_token', tokens.id_token, {
    ...authCookieOptions,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  console.log('   ✅ Set id_token cookie (7 days)');

  // Set access token (short expiry)
  response.cookies.set('access_token', tokens.access_token, {
    ...authCookieOptions,
    maxAge: 60 * 60, // 1 hour
  });
  console.log('   ✅ Set access_token cookie (1 hour)');

  // Set refresh token (long expiry)
  response.cookies.set('refresh_token', tokens.refresh_token, {
    ...authCookieOptions,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  console.log('   ✅ Set refresh_token cookie (30 days)');

  // ========================================
  // STEP 9: Clean Up OAuth Cookies
  // ========================================
  console.log('\n🧹 Cleaning Up OAuth Cookies...');

  response.cookies.delete('oauth_state');
  response.cookies.delete('oauth_nonce');
  response.cookies.delete('redirect_after_login');

  console.log('   ✅ Deleted oauth_state');
  console.log('   ✅ Deleted oauth_nonce');
  console.log('   ✅ Deleted redirect_after_login');

  // ========================================
  // STEP 10: Log Success and Redirect
  // ========================================
  console.log('\n✅ Authentication Successful!');
  console.log('🚀 Redirecting to:', redirectAfterLogin);
  console.log('========================================\n');

  return response;
}

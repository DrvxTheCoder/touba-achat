import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (token?.revoked) {
    const response = NextResponse.redirect(new URL('/auth/signin?error=SessionRevoked', req.url));
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('__Secure-next-auth.session-token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};

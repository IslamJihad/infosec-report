import { NextRequest, NextResponse } from 'next/server';

const BASIC_PREFIX = 'Basic ';
const AUTH_REALM = 'InfoSec Report';

function secureCompare(left: string, right: string): boolean {
  if (left.length !== right.length) return false;

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

function decodeBasicCredentials(authorizationHeader: string): { username: string; password: string } | null {
  if (!authorizationHeader.startsWith(BASIC_PREFIX)) {
    return null;
  }

  const encoded = authorizationHeader.slice(BASIC_PREFIX.length).trim();
  if (!encoded) {
    return null;
  }

  try {
    const decoded = atob(encoded);
    const separator = decoded.indexOf(':');
    if (separator <= 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

function unauthorizedResponse(): NextResponse {
  return new NextResponse('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${AUTH_REALM}", charset="UTF-8"`,
    },
  });
}

export function proxy(req: NextRequest): NextResponse {
  const configuredUsername = process.env.BASIC_AUTH_USERNAME?.trim() || '';
  const configuredPassword = process.env.BASIC_AUTH_PASSWORD?.trim() || '';

  if (!configuredUsername || !configuredPassword) {
    return NextResponse.next();
  }

  const authorizationHeader = req.headers.get('authorization') || '';
  const credentials = decodeBasicCredentials(authorizationHeader);
  if (!credentials) {
    return unauthorizedResponse();
  }

  if (!secureCompare(credentials.username, configuredUsername)) {
    return unauthorizedResponse();
  }

  if (!secureCompare(credentials.password, configuredPassword)) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

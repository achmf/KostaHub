import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from './lib/auth'

const PUBLIC_PATHS = ['/login', '/register', '/status']

export async function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (isPublic) {
    if (pathname.startsWith('/login') && session) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const payload = await decrypt(session)
    if (!payload) throw new Error('Invalid session')
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register|status).*)'],
}


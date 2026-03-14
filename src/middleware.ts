import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE_NAME = 'mpm_session'
const SESSION_ISSUER = 'mpm-next'
const SESSION_AUDIENCE = 'mpm-next-app'

async function verifyAdminToken(token: string): Promise<boolean> {
    try {
        const secret = process.env.JWT_SECRET
        if (!secret) return false

        const parts = token.split('.')
        if (parts.length !== 3) return false
        const [header, payload, signature] = parts

        // Verify HMAC-SHA256 signature using Web Crypto API (Edge-compatible)
        const encoder = new TextEncoder()
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify'],
        )

        const sigBytes = Uint8Array.from(
            atob(signature.replace(/-/g, '+').replace(/_/g, '/')),
            c => c.charCodeAt(0),
        )

        const valid = await crypto.subtle.verify(
            'HMAC',
            key,
            sigBytes,
            encoder.encode(`${header}.${payload}`),
        )
        if (!valid) return false

        const parsed = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))

        if (
            parsed.iss !== SESSION_ISSUER ||
            parsed.aud !== SESSION_AUDIENCE ||
            typeof parsed.exp !== 'number' ||
            parsed.exp <= Math.floor(Date.now() / 1000)
        ) {
            return false
        }

        return parsed.isAdmin === true
    } catch {
        return false
    }
}

export async function middleware(request: NextRequest) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const isAdmin = token ? await verifyAdminToken(token) : false

    if (!isAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*'],
}


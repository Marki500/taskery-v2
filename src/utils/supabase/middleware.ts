import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        // Redirection Logic
        const path = request.nextUrl.pathname

        // Check if user is a client
        const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('user_id', user.id)
            .single()

        const isClient = !!client

        // 1. Client trying to access non-portal routes (except auth/public)
        if (isClient) {
            if (path.startsWith('/dashboard') || path === '/') {
                const url = request.nextUrl.clone()
                url.pathname = '/portal'
                return NextResponse.redirect(url)
            }
        }

        // 2. Regular user trying to access portal routes
        if (!isClient) {
            if (path.startsWith('/portal') || path === '/') {
                const url = request.nextUrl.clone()
                url.pathname = '/dashboard'
                return NextResponse.redirect(url)
            }
        }
    }

    return response
}

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
    console.log('🔐 NEW SET-SESSION API - Version 2.0 - Processing invitation tokens')

    try {
        const { accessToken, refreshToken } = await request.json()
        console.log('📝 Tokens received:', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken })

        if (!accessToken || !refreshToken) {
            return NextResponse.json(
                { success: false, error: 'Missing tokens' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Set the session from tokens
        const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        })

        if (error || !data.user) {
            return NextResponse.json(
                { success: false, error: 'Invalid session' },
                { status: 401 }
            )
        }

        // Check if user is a client
        const { data: clientData } = await supabase
            .from('clients')
            .select('id, workspace_id')
            .eq('user_id', data.user.id)
            .single()

        const redirectTo = clientData ? '/client-portal' : '/projects'

        return NextResponse.json({
            success: true,
            redirectTo
        })
    } catch (error) {
        console.error('Set session error:', error)
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        )
    }
}

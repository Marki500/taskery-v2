import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = await createClient()

    // Sign out the user
    await supabase.auth.signOut()

    // Redirect to login page
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    return NextResponse.redirect(`${origin}/login`)
}

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    console.log('🚀 NEW CALLBACK CODE - Version 2.0 - Handling invitation tokens')

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/projects'

    // Use env var for production, fallback to request origin
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

    // Handle OAuth code flow
    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Check if user needs a workspace (new OAuth user)
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'

                // 1. Ensure profile exists (in case DB trigger didn't run)
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', user.id)
                    .single()

                if (!existingProfile) {
                    await supabase
                        .from('profiles')
                        .insert({
                            id: user.id,
                            email: user.email,
                            full_name: userName,
                            avatar_url: user.user_metadata?.avatar_url || null
                        })
                }

                // 2. Check if user already has a workspace
                const { data: existingMembership } = await supabase
                    .from('workspace_members')
                    .select('id')
                    .eq('user_id', user.id)
                    .limit(1)
                    .single()

                if (!existingMembership) {
                    // Create default workspace for new OAuth user
                    const { data: workspace } = await supabase
                        .from('workspaces')
                        .insert({
                            name: `Workspace de ${userName}`,
                            owner_id: user.id
                        })
                        .select()
                        .single()

                    if (workspace) {
                        await supabase
                            .from('workspace_members')
                            .insert({
                                workspace_id: workspace.id,
                                user_id: user.id,
                                role: 'admin'
                            })
                    }
                }
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // If no code, serve HTML that processes hash fragments (for invitation links)
    return new NextResponse(`
<!DOCTYPE html>
<html>
<head>
    <title>Procesando invitación...</title>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            align-items: center;
            justify-center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div style="text-align: center;">
        <div class="spinner"></div>
        <h1>Procesando invitación...</h1>
    </div>
    <script>
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken && refreshToken) {
            // Send tokens to server via POST
            fetch('/api/auth/set-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken, refreshToken })
            }).then(res => res.json())
              .then(data => {
                  if (data.success) {
                      window.location.href = data.redirectTo || '/projects';
                  } else {
                      window.location.href = '/login?error=invalid_invite';
                  }
              })
              .catch(() => {
                  window.location.href = '/login?error=session_error';
              });
        } else {
            window.location.href = '/login?error=no_tokens';
        }
    </script>
</body>
</html>
    `, {
        headers: { 'Content-Type': 'text/html' }
    })
}

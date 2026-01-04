'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const supabase = createClient()

                // Check if there's a hash fragment with tokens (invite/magic link flow)
                const hashParams = new URLSearchParams(window.location.hash.substring(1))
                const accessToken = hashParams.get('access_token')
                const refreshToken = hashParams.get('refresh_token')
                const type = hashParams.get('type')

                if (accessToken && refreshToken) {
                    // Set the session from the tokens
                    const { data, error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    })

                    if (sessionError) {
                        console.error('Session error:', sessionError)
                        setError('Error al procesar la invitación')
                        return
                    }

                    if (data.user) {
                        // Check if this user is a client
                        const { data: clientData } = await supabase
                            .from('clients')
                            .select('id, workspace_id')
                            .eq('user_id', data.user.id)
                            .single()

                        if (clientData) {
                            // User is a client - redirect to client portal
                            router.push('/client-portal')
                            return
                        }

                        // User is not a client - check if they have workspace access
                        const { data: membership } = await supabase
                            .from('workspace_members')
                            .select('workspace_id')
                            .eq('user_id', data.user.id)
                            .limit(1)
                            .single()

                        if (membership) {
                            // User has workspace access - redirect to dashboard
                            router.push('/projects')
                            return
                        }

                        // User has no access - this shouldn't happen
                        setError('No tienes acceso a ningún workspace')
                        return
                    }
                }

                // If no hash tokens, check for code parameter (OAuth flow)
                const urlParams = new URLSearchParams(window.location.search)
                const code = urlParams.get('code')

                if (code) {
                    // Let the server-side route handle this
                    window.location.href = `/auth/callback?code=${code}`
                    return
                }

                // No valid auth parameters found
                setError('Link de invitación inválido o expirado')
            } catch (err) {
                console.error('Callback error:', err)
                setError('Ocurrió un error inesperado')
            }
        }

        handleCallback()
    }, [router])

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-destructive text-lg font-semibold">{error}</div>
                    <button
                        onClick={() => router.push('/login')}
                        className="text-primary hover:underline"
                    >
                        Volver al login
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Procesando invitación...</p>
            </div>
        </div>
    )
}

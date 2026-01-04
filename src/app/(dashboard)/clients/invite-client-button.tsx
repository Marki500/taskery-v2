'use client'

import { useState } from 'react'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { inviteClientUser } from './actions'
import { toast } from 'sonner'

interface InviteClientButtonProps {
    clientId: string
    clientEmail: string | null
    hasUser: boolean
}

export function InviteClientButton({ clientId, clientEmail, hasUser }: InviteClientButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleInvite = async () => {
        setLoading(true)
        try {
            const result = await inviteClientUser(clientId)
            if (result.success) {
                toast.success(result.message)
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Error al invitar')
        } finally {
            setLoading(false)
        }
    }

    if (!clientEmail) {
        return (
            <Button variant="ghost" size="sm" className="h-8 text-xs" disabled>
                <Mail className="h-3 w-3 mr-1" />
                Sin email
            </Button>
        )
    }

    if (hasUser) {
        return (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-green-600" disabled>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Invitado
            </Button>
        )
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={handleInvite}
            disabled={loading}
        >
            {loading ? (
                <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Enviando...
                </>
            ) : (
                <>
                    <Mail className="h-3 w-3 mr-1" />
                    Invitar al Portal
                </>
            )}
        </Button>
    )
}

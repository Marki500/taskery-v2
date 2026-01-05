import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { getClients } from "./actions"
import { ClientDialog } from "./client-dialog"
import { NewProjectDialog } from "../projects/new-project-dialog"
import { InviteClientButton } from "./invite-client-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Users, Mail, Phone, MapPin, Search } from "lucide-react"
import { ClientsList } from "./clients-list"
// import { Input } from "@/components/ui/input" // Future: Search

export default async function ClientsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user's first workspace (similar to dashboard logic)
    // In a real multi-workspace app, we'd probably have the workspaceId in the URL or a global context/cookie selection
    const { data: memberships } = await supabase
        .from('workspace_members')
        .select('workspace_id, workspaces(name)')
        .eq('user_id', user.id)
        .limit(1)
        .single()

    if (!memberships) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>No tienes acceso a ningún workspace.</p>
            </div>
        )
    }

    const workspaceId = memberships.workspace_id
    const clients = await getClients(workspaceId)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground">
                        Gestiona los clientes de tu workspace <span className="font-medium text-foreground">
                            {Array.isArray(memberships.workspaces)
                                ? memberships.workspaces[0]?.name
                                : (memberships.workspaces as any)?.name}
                        </span>
                    </p>
                </div>
                <ClientDialog workspaceId={workspaceId} />
            </div>

            {/* <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar clientes..." className="pl-9 max-w-sm" />
            </div> */}

            <ClientsList clients={clients} workspaceId={workspaceId} />
        </div>
    )
}

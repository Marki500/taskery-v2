import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { getDashboardStats } from "./actions"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const stats = await getDashboardStats()

    // Fallback if stats fail
    if (!stats) {
        return <div className="p-8">Cargando estadísticas...</div>
    }

    // Get workspace ID for activity feed
    const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()


    const userName = user.email?.split('@')[0] || 'Usuario'
    const workspaceId = membership?.workspace_id || null

    return <DashboardClient userId={user.id} userName={userName} workspaceId={workspaceId} initialStats={stats} />
}

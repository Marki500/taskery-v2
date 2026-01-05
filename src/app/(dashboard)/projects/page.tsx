import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { NewProjectDialog } from "./new-project-dialog"
import { ProjectsList } from "./projects-list"

export default async function ProjectsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get workspace members for project assignment
    const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

    let workspaceMembers: any[] = []
    if (membership) {
        const { data } = await supabase
            .from('workspace_members')
            .select(`
user_id,
    role,
    profiles(
        id,
        full_name,
        email,
        avatar_url
    )
        `)
            .eq('workspace_id', membership.workspace_id)
            .in('role', ['admin', 'member'])  // Only admins and members, not clients

        workspaceMembers = data || []
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-xl border border-slate-200/60 dark:border-indigo-500/30 shadow-2xl shadow-indigo-100/20 dark:shadow-indigo-500/10 relative overflow-hidden">
                {/* Ambient Neon Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

                <div>
                    <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent">
                        Proyectos
                    </h1>
                    <p className="text-muted-foreground mt-3 text-lg font-medium">
                        Organiza y gestiona tus proyectos
                    </p>
                </div>
                <NewProjectDialog workspaceMembers={workspaceMembers} />
            </div>

            {/* Projects List - will load based on client-side filter */}
            <ProjectsList workspaceMembers={workspaceMembers} />
        </div>
    )
}

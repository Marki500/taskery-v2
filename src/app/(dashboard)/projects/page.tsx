import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { getProjects } from "./project-actions"
import { NewProjectDialog } from "./new-project-dialog"
import { ProjectsList } from "./projects-list"

export default async function ProjectsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const projects = await getProjects()

    // Get workspace members for project assignment
    const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single()

    let workspaceMembers: any[] = []
    if (membership) {
        const { data } = await supabase
            .from('workspace_members')
            .select(`
                user_id,
                profiles (
                    id,
                    full_name,
                    email,
                    avatar_url
                )
            `)
            .eq('workspace_id', membership.workspace_id)

        workspaceMembers = data || []
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-xl border border-slate-200/60 dark:border-indigo-500/30 shadow-2xl shadow-indigo-100/20 dark:shadow-indigo-500/10 relative overflow-hidden">
                {/* Ambient Neon Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />

                <div className="space-y-2 relative z-10">
                    <h1 className="text-5xl font-black tracking-tight text-slate-800 dark:text-white">
                        Proyectos
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-medium flex items-center gap-2">
                        Gestiona y organiza tu <span className="text-indigo-600 dark:text-indigo-400 font-bold border-b-2 border-indigo-200 dark:border-indigo-500/30">universo de trabajo</span>.
                    </p>
                </div>
                <div className="relative z-10">
                    {projects.length >= 0 && <NewProjectDialog />}
                </div>
            </div>

            <ProjectsList initialProjects={projects} workspaceMembers={workspaceMembers} />
        </div>
    )
}

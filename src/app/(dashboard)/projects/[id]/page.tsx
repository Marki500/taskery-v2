import { createClient } from "@/utils/supabase/server"
import { redirect, notFound } from "next/navigation"
import { KanbanBoard } from "@/components/kanban/board"
import { getProjectById } from "../project-actions"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EditProjectDialog } from "../edit-project-dialog"
import { ProjectChatButton } from "@/components/projects/project-chat-button"

interface ProjectPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const project = await getProjectById(id)

    if (!project) {
        notFound()
    }

    // Get workspace members (excluding clients)
    const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single()

    let workspaceMembers: any[] = []
    if (membership) {
        const { data, error } = await supabase
            .from('workspace_members')
            .select(`
                user_id,
                role,
                profiles (
                    id,
                    full_name,
                    email,
                    avatar_url
                )
            `)
            .eq('workspace_id', membership.workspace_id)
            .in('role', ['admin', 'member'])  // Only admins and members, not clients

        if (error) {
            console.error('Error fetching workspace members:', error)
        }

        workspaceMembers = data || []
        console.log('Workspace members:', workspaceMembers)
    }

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/projects">
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-4">
                        {project.url && (() => {
                            let domain = project.url;
                            try {
                                const urlStr = project.url.startsWith('http') ? project.url : `https://${project.url}`;
                                domain = new URL(urlStr).hostname;
                            } catch (e) {
                                // Fallback to raw url or whatever
                            }
                            return (
                                <img
                                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
                                    alt=""
                                    className="w-10 h-10 object-contain p-1.5 bg-white rounded-lg border shadow-sm"
                                />
                            );
                        })()}
                        <div>
                            <h1 className="text-5xl font-extrabold tracking-tight text-foreground">
                                {project.name}
                            </h1>
                            <p className="text-muted-foreground text-xl mt-2 font-medium">
                                {project.description || 'Tablero de tareas'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ProjectChatButton projectId={project.id} projectName={project.name} />
                    <EditProjectDialog project={project} workspaceMembers={workspaceMembers} />
                </div>
            </div>

            {/* The Kanban Board Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden bg-muted/30 rounded-xl border border-border/50 p-4">
                <KanbanBoard projectId={id} />
            </div>
        </div>
    )
}
